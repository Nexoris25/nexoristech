/**
 * Cleaning up what an editor types into the redirect manager before it is stored.
 *
 * Nothing validated these fields. `old_url` was taken with a `.trim()` and written straight to the
 * database, so a rule saved as `//web-development/` — a doubled leading slash, which is what you get
 * from pasting a path into a field that already shows one — was stored, listed as Active, and could
 * never match, because no browser ever requests that path. It looked like the feature was broken.
 *
 * Both fields accept a full URL as well as a path, because that is what a person has in hand: the
 * address they copied out of the browser. A source is reduced to its path, since matching happens on
 * the path of an incoming request. A destination keeps its origin when it has one, so a redirect can
 * legitimately point off-site.
 */

export const REDIRECT_TYPES = ["301", "302", "307", "410"] as const;
export const MATCH_PATTERNS = ["Exact match", "Pattern match (RegEx)"] as const;
export const CASE_MODES = ["Ignore Case", "Match Case"] as const;
export const SLASH_MODES = ["Ignore Trailing Slash", "Exact Match"] as const;

export type RedirectType = (typeof REDIRECT_TYPES)[number];
export type MatchPattern = (typeof MATCH_PATTERNS)[number];

export interface FieldResult {
  value: string;
  /**
   * The host the rule is scoped to, when the editor gave a full URL.
   *
   * This is what makes a www-to-canonical redirect expressible. Without it the host was discarded and
   * the rule matched on every host, so `https://www.example.com/pricing/ -> https://example.com/pricing/`
   * also fired on the canonical host — redirecting a page to itself. Null means "any host", which is
   * what a plain path has always meant.
   */
  host?: string | null;
  /** A reason to reject, or null when the value is usable. */
  error: string | null;
}

/** One of the allowed values, or the first as the default. Never trusts the posted string. */
export function oneOf<T extends readonly string[]>(allowed: T, raw: unknown): T[number] {
  const v = String(raw ?? "").trim();
  return (allowed as readonly string[]).includes(v) ? (v as T[number]) : (allowed[0] as T[number]);
}

/**
 * The source to match on.
 *
 * For an exact rule this is a path: a full URL is reduced to its path so that pasting
 * `https://nexoristech.com/old-page/` works, and repeated leading slashes collapse to one. A pattern
 * rule is left exactly as written — a regular expression is not a path, and "normalising" `^/old/(.*)$`
 * would corrupt it — but it must compile, because one that does not would be stored as a rule that can
 * never fire.
 */
export function normaliseSource(raw: string, pattern: MatchPattern): FieldResult {
  const input = String(raw ?? "").trim();
  if (!input) return { value: "", error: "Enter the URL or path to redirect from." };

  if (pattern === "Pattern match (RegEx)") {
    if (input.length > 300) return { value: input, error: "The pattern is too long (limit 300 characters)." };
    try {
      new RegExp(input);
    } catch {
      return { value: input, error: "That is not a valid regular expression." };
    }
    return { value: input, error: null };
  }

  let path = input;
  let host: string | null = null;
  if (/^https?:\/\//i.test(path)) {
    try {
      const u = new URL(path);
      // The host is kept, not discarded: it is the difference between "redirect /pricing/ on the www
      // host" and "redirect /pricing/ everywhere", and only the first of those is safe to pair with a
      // destination on the canonical host.
      host = u.host.toLowerCase();
      path = `${u.pathname}${u.search}`;
    } catch {
      return { value: input, error: "That does not look like a valid URL." };
    }
  }
  path = `/${path.replace(/^\/+/, "")}`;
  // The home page of a specific host is a legitimate rule — that is exactly how www is redirected —
  // but "/" with no host would take the whole site down.
  if (path === "/" && !host) return { value: path, error: "The home page cannot be redirected." };
  return { value: path, host, error: null };
}

/**
 * Where the visitor is sent.
 *
 * A 410 says the page is gone and has no destination, so an empty value is correct there and only
 * there. An absolute URL is kept whole, which is how an off-site redirect is expressed; anything else
 * is treated as a path on this site.
 */
export function normaliseDestination(raw: string, type: RedirectType): FieldResult {
  const input = String(raw ?? "").trim();
  if (type === "410") return { value: "", error: null };
  if (!input) return { value: "", error: "Enter where this should redirect to." };

  if (/^https?:\/\//i.test(input)) {
    try {
      new URL(input);
      return { value: input, error: null };
    } catch {
      return { value: input, error: "That does not look like a valid URL." };
    }
  }
  // A destination may carry $1…$9 from a pattern rule's capture groups, so it is not URL-parsed.
  return { value: `/${input.replace(/^\/+/, "")}`, error: null };
}

/**
 * The whole form, cleaned. Returns the first problem found so the editor is told one clear thing
 * rather than being handed a list to work through.
 */
export interface RedirectInput {
  oldUrl: string;
  /** The host this rule is scoped to, or null for every host. */
  sourceHost: string | null;
  newUrl: string;
  type: RedirectType;
  pattern: MatchPattern;
  caseSensitivity: (typeof CASE_MODES)[number];
  slashHandling: (typeof SLASH_MODES)[number];
  status: "Active" | "Inactive";
  startDate: string | null;
  expiryDate: string | null;
  notes: string | null;
}

export function parseRedirectForm(get: (name: string) => unknown): { input: RedirectInput | null; error: string | null } {
  const type = oneOf(REDIRECT_TYPES, get("type"));
  const pattern = oneOf(MATCH_PATTERNS, get("pattern"));

  const source = normaliseSource(String(get("old_url") ?? ""), pattern);
  if (source.error) return { input: null, error: source.error };
  const destination = normaliseDestination(String(get("new_url") ?? ""), type);
  if (destination.error) return { input: null, error: destination.error };

  /*
   * A rule points at itself when it lands on the same path of the same host.
   *
   * Both halves matter. Comparing the raw strings is not enough — a source is stored as a path and a
   * destination may be a full URL, so "/pricing/" and "https://www.example.com/pricing/" are the same
   * address written two ways. And the host has to be part of it, because sending
   * www.example.com/pricing/ to example.com/pricing/ is the same path on purpose: that is what a
   * www-to-canonical redirect is, and refusing it would block the commonest rule there is.
   *
   * A destination with no host of its own resolves against whatever host the request arrived on, so
   * it counts as the same host as the source.
   */
  let destHost: string | null = null;
  let destPath = destination.value;
  if (/^https?:\/\//i.test(destination.value)) {
    const u = new URL(destination.value);
    destHost = u.host.toLowerCase();
    destPath = `${u.pathname}${u.search}`;
  }
  const sameHost = destHost === null || (source.host ?? null) === destHost;
  if (type !== "410" && pattern === "Exact match" && sameHost && source.value === destPath) {
    return { input: null, error: "A redirect cannot point at itself." };
  }

  const startRaw = String(get("start_date") ?? "").trim();
  const expiryRaw = String(get("expiry_date") ?? "").trim();
  const isDate = (v: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(v);
  if (startRaw && !isDate(startRaw)) return { input: null, error: "The start date is not a valid date." };
  if (expiryRaw && !isDate(expiryRaw)) return { input: null, error: "The expiry date is not a valid date." };
  // A window that closes before it opens would never serve the redirect at all.
  if (startRaw && expiryRaw && startRaw > expiryRaw) {
    return { input: null, error: "The expiry date is before the start date." };
  }

  return {
    input: {
      oldUrl: source.value,
      sourceHost: source.host ?? null,
      newUrl: destination.value,
      type,
      pattern,
      caseSensitivity: oneOf(CASE_MODES, get("case_sensitivity")),
      slashHandling: oneOf(SLASH_MODES, get("slash_handling")),
      status: String(get("status") ?? "Active").trim() === "Inactive" ? "Inactive" : "Active",
      startDate: startRaw || null,
      expiryDate: expiryRaw || null,
      notes: String(get("notes") ?? "").trim() || null,
    },
    error: null,
  };
}
