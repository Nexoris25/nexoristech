/**
 * Deciding whether a request matches a CMS redirect, and what to answer with.
 *
 * Kept as pure functions so the rules can be tested directly. The middleware that uses them runs on
 * the edge runtime for every page request on the site, so this file must not import anything that
 * touches a database, the filesystem or Node built-ins.
 *
 * The four rule settings were offered by the CMS form long before anything honoured them: a rule
 * saved as a RegEx matched exactly, "Match Case" matched case-insensitively, "Exact Match" on slashes
 * ignored the trailing slash, and an expiry date expired nothing. They mean what they say now.
 */

export type RedirectType = "301" | "302" | "307" | "410";
export type MatchPattern = "Exact match" | "Pattern match (RegEx)";

export interface RedirectRule {
  id: string;
  /** A path for an exact rule; a regular expression source for a pattern rule. */
  source: string;
  /** A path, or an absolute URL for an off-site redirect. Empty for a 410. */
  destination: string;
  type: RedirectType;
  pattern: MatchPattern;
  /** From "Case Sensitivity": true when the editor chose "Match Case". */
  caseSensitive: boolean;
  /** From "Slash Handling": true when the editor chose "Exact Match". */
  exactSlash: boolean;
}

export interface RedirectHit {
  rule: RedirectRule;
  /** Where to send the visitor, with any capture groups substituted. Empty for a 410. */
  destination: string;
}

/**
 * A request path reduced to the form rules are compared in.
 *
 * The site sets `trailingSlash: true`, so `/a` and `/a/` are the same page and a rule written either
 * way should fire — unless the editor asked for "Exact Match", which is the whole point of the
 * setting. The root is never reduced to the empty string, because "" would match everything.
 */
export function normalisePath(path: string, exactSlash = false): string {
  if (typeof path !== "string" || path.length === 0) return "/";
  let p = path.trim();
  if (!p.startsWith("/")) p = `/${p}`;
  // A doubled leading slash is a different path to the browser and a common paste error. One rule
  // saved as "//web-development/" never fired because nothing ever requests that.
  p = p.replace(/^\/+/, "/");
  if (exactSlash) return p;
  return p.replace(/\/+$/, "") || "/";
}

/** The HTTP status for a type. 410 is not a redirect at all, which is why it is handled apart. */
export function statusFor(type: RedirectType): 301 | 302 | 307 | 410 {
  switch (type) {
    case "302": return 302;
    case "307": return 307;
    case "410": return 410;
    default: return 301;
  }
}

/**
 * Compile a rule's pattern, or null when it cannot be compiled.
 *
 * An editor can save anything into the pattern field, and one bad expression must not take the whole
 * site's redirect handling down with it — so a rule that will not compile is skipped and the rest
 * still work. Length is capped because the expression runs against every request path.
 */
export function compilePattern(rule: RedirectRule): RegExp | null {
  if (rule.pattern !== "Pattern match (RegEx)") return null;
  if (rule.source.length > 300) return null;
  try {
    return new RegExp(rule.source, rule.caseSensitive ? "" : "i");
  } catch {
    return null;
  }
}

/** `$1`…`$9` in a destination, filled from the pattern's capture groups. */
function substitute(destination: string, groups: RegExpExecArray): string {
  return destination.replace(/\$([1-9])/g, (whole, digit: string) => groups[Number(digit)] ?? whole);
}

/**
 * The first rule that matches this path, or null.
 *
 * Exact rules are tried before patterns: they are the common case, they are unambiguous, and an
 * editor who wrote both would expect the specific one to win over the general one.
 */
export function matchRedirect(requestPath: string, rules: RedirectRule[]): RedirectHit | null {
  const exact = rules.filter((r) => r.pattern === "Exact match");
  for (const rule of exact) {
    const path = normalisePath(requestPath, rule.exactSlash);
    const source = normalisePath(rule.source, rule.exactSlash);
    const same = rule.caseSensitive ? path === source : path.toLowerCase() === source.toLowerCase();
    if (same) return { rule, destination: rule.destination };
  }

  for (const rule of rules) {
    if (rule.pattern !== "Pattern match (RegEx)") continue;
    const re = compilePattern(rule);
    if (!re) continue;
    const path = normalisePath(requestPath, rule.exactSlash);
    const m = re.exec(path);
    if (m) return { rule, destination: substitute(rule.destination, m) };
  }
  return null;
}

/**
 * The absolute address to send the visitor to.
 *
 * A destination may be a path on this site or a full URL somewhere else — the CMS accepts both, and
 * an off-site move is a legitimate redirect. Anything that is not absolute is resolved against the
 * request, so a path works without the site knowing its own public origin.
 */
export function resolveDestination(destination: string, requestUrl: string): string {
  const d = destination.trim();
  if (/^https?:\/\//i.test(d)) return d;
  return new URL(d.startsWith("/") ? d : `/${d}`, requestUrl).toString();
}

/**
 * Whether a rule should be served at all today.
 *
 * Both dates are inclusive of the day named, which is how a person reads them: a rule starting on the
 * 10th works from the first moment of the 10th, and one expiring on the 10th works through the end of
 * it. A date that cannot be read is ignored rather than treated as "not live" — dropping a rule
 * because of a typo in an optional field would be a silent outage of the redirect it carries.
 */
export function isLive(
  rule: { startDate?: string | null; expiryDate?: string | null },
  now = new Date(),
): boolean {
  const at = now.getTime();

  if (rule.startDate) {
    const start = new Date(`${rule.startDate.slice(0, 10)}T00:00:00.000Z`);
    if (!Number.isNaN(start.getTime()) && at < start.getTime()) return false;
  }
  if (rule.expiryDate) {
    const expiry = new Date(`${rule.expiryDate.slice(0, 10)}T23:59:59.999Z`);
    if (!Number.isNaN(expiry.getTime()) && at > expiry.getTime()) return false;
  }
  return true;
}
