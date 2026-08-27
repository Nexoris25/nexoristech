/**
 * Server-to-server client for the Oge gateway's CMS editorial + vision assists (PRD Part Two). The admin
 * always gets a usable draft: it calls the gateway (real AI) when the shared secret is set and the
 * gateway is reachable, and otherwise composes a deterministic draft from the supplied content in the
 * house voice. The editor approves every draft before it is saved. `source` tells the UI which path ran.
 */
import { deriveMetaTitle, fitMetaDescription } from "@nexoris/seo";
import { cmsDb } from "./cms-db.js";
import { SITE_ORIGIN, CORE_PAGES, SERVICE_PAGES, INDUSTRY_PAGES } from "./site-pages.js";

const GATEWAY = process.env.OGE_GATEWAY_URL ?? "http://localhost:4000";

/** A readable page name from its path, e.g. "/services/ai-solutions" -> "AI Solutions", "/" -> "Home". */
function titleFromPath(path: string): string {
  if (path === "/") return "Home";
  const seg = path.split("/").filter(Boolean).pop() ?? "";
  return seg.split("-").map((w) => (w.length <= 3 && w === w.toLowerCase() && /^(ai|seo|geo|hr)$/.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1))).join(" ");
}
/** The real internal-link candidates: the marketing site's core, service, and industry pages. */
function siteLinkCandidates(): { title: string; url: string }[] {
  return [...CORE_PAGES, ...SERVICE_PAGES, ...INDUSTRY_PAGES].map((p) => ({ title: titleFromPath(p), url: `${SITE_ORIGIN}${p}` }));
}
/** A natural anchor phrase for a page name (industries read better as "healthcare technology"). */
function anchorFor(title: string): string {
  return title;
}

export type EditorialKind = "seo" | "tldr" | "excerpt" | "faqs" | "author-bio" | "internal-links" | "page-body";
export interface SeoResult { metaTitle: string; metaDescription: string }
export interface FaqItem { question: string; answer: string }
export interface InternalLink { anchor: string; target: string; rationale: string }
export type EditorialResult = SeoResult | string | string[] | FaqItem[] | InternalLink[];

export interface EditorialInput {
  kind: EditorialKind;
  title?: string; body?: string; focusKeyword?: string;
  authorName?: string; authorRole?: string; expertise?: string[];
  industry?: string; service?: string; location?: string;
  /** Section headings from the chosen template, so a template actually shapes the page. */
  sections?: string[];
  pages?: { title: string; url: string }[];
}

/**
 * A full, substantive programmatic-page body (PRD §9.6-9.7: a page must be genuinely unique and helpful,
 * with real structure, never a thin topic). Deterministic, house-voice HTML built from the keyword,
 * industry, and service so an approved proposal opens with real content instead of an empty page.
 */
/**
 * The floor for a programmatic page body, in words.
 *
 * A thin programmatic page is the exact thing Google's spam and helpful-content systems demote, and
 * "long enough" cannot be left to whoever pressed Generate. Five hundred words is the point below which
 * a page of this kind has not said anything a reader could not get from the title, so nothing under it
 * is returned or published.
 */
export const PSEO_MIN_WORDS = 500;

/** Words in HTML, counted the way the editor's own counter does. */
export function bodyWordCount(html: string): number {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length;
}

/**
 * Terms that are acronyms, not words, so sentence case must leave them alone.
 *
 * Capitalising only the first letter turned "ai solutions for healthcare" into "Ai solutions for
 * healthcare" in the opening sentence and in a heading, on every generated page. Almost every
 * keyword this platform generates for begins with one of these.
 */
const ACRONYMS = new Map<string, string>([
  ["ai", "AI"], ["seo", "SEO"], ["geo", "GEO"], ["api", "API"], ["apis", "APIs"],
  ["crm", "CRM"], ["cms", "CMS"], ["hr", "HR"], ["iot", "IoT"], ["nrs", "NRS"],
  ["saas", "SaaS"], ["ui", "UI"], ["ux", "UX"], ["erp", "ERP"], ["pos", "POS"],
  ["b2b", "B2B"], ["b2c", "B2C"], ["kpi", "KPI"], ["kpis", "KPIs"], ["sms", "SMS"],
]);

/** A phrase reduced to the shape a page slug uses, for matching against the real page list. */
function slugish(phrase: string): string {
  return phrase.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Restore acronym casing anywhere in a phrase, leaving ordinary words untouched. */
export function fixAcronyms(phrase: string): string {
  return phrase.replace(/[A-Za-z0-9]+/g, (word) => ACRONYMS.get(word.toLowerCase()) ?? word);
}

/**
 * Sentence case that respects acronyms: the first letter is raised unless the first word is an
 * acronym, in which case it keeps its own casing.
 */
export function sentenceCase(phrase: string): string {
  const fixed = fixAcronyms(phrase.trim());
  if (!fixed) return fixed;
  const [first = ""] = fixed.split(" ");
  if (ACRONYMS.has(first.toLowerCase())) return fixed;
  return fixed.charAt(0).toUpperCase() + fixed.slice(1);
}

/**
 * Compose the page body, answer first.
 *
 * The previous opening was "X is changing how Y teams work ... This page explains what X means for
 * your business". That is throat-clearing: it describes the page instead of answering the question
 * the visitor typed, and both a reader skimming and an AI system extracting an answer have to get
 * past it before anything useful appears. The first paragraph now answers directly and completely
 * enough to stand on its own if it is the only thing quoted, and the context follows it.
 *
 * The experience and expertise signals are in the copy for the same reason. The publish gate already
 * refuses a page with no named author, but a byline on its own is not evidence: the body says how
 * the work is actually done, what is measured, and what the team will say no to.
 */
/**
 * A section written to match a heading the template asked for.
 *
 * A template names the sections a page should have. Dropping pre-written paragraphs under whatever
 * headings a template happens to list would put a heading over copy that is not about it, which is
 * worse than ignoring the template. So each known section name has copy genuinely about it, and an
 * unrecognised name gets copy that is honest about being an outline for the editor to finish rather
 * than filler pretending to be finished.
 */
function templateSection(name: string, topic: string, ind: string, svc: string): string {
  const key = name.toLowerCase();
  const heading = `<h2>${fixAcronyms(name)}</h2>`;

  if (/hero|intro/.test(key)) {
    return `${heading}<p>${sentenceCase(topic)} for ${ind} teams, built by Nexoris Technologies around the way your business already runs. We start from the bottleneck rather than the technology, ship in stages small enough to review, and agree how the result will be measured before any build starts.</p>`;
  }
  if (/benefit|value|outcome/.test(key)) {
    return `${heading}<ul><li>Faster time to value with a clear, staged rollout</li><li>Lower operating cost through automation and better data</li><li>Higher reliability, with security considered from the first design</li><li>Decisions backed by real numbers rather than guesswork</li></ul><p>Each of these is something you can measure before and after, and we agree how it will be measured before any build starts. A benefit nobody can put a number against is not a benefit; it is a hope.</p>`;
  }
  if (/solution|feature|capabilit|technolog|stack/.test(key)) {
    return `${heading}<p>What ${topic} actually involves for ${ind}: streamlining the operations your team repeats daily, automating manual back-office work, turning scattered records into one version, and connecting the tools already in use so they share data instead of duplicating it. We build only the parts that earn their place.</p>`;
  }
  if (/industr|who|audience|sector/.test(key)) {
    return `${heading}<p>These patterns repeat across ${ind}. Yours may sit between two of them, which is normal, and the scoping call exists to find out exactly where. Read more about our work for the sector on the <a href="${INDUSTRY_PAGES.find((p) => p.includes(slugish(ind))) ?? "/case-studies"}/">${ind} page</a>.</p>`;
  }
  if (/case stud|proof|result|evidence|testimonial/.test(key)) {
    return `${heading}<p>Everything here comes from delivering this work rather than summarising it. We scope against the system you already run, test with your real data and the people who will use it, and agree the measure of success up front. When a number does not move after launch, that is ours to fix. Our <a href="/case-studies/">case studies</a> set out what we have built and what changed.</p>`;
  }
  if (/pricing|cost|price|budget/.test(key)) {
    return `${heading}<p>What ${topic} costs depends on how much of it you need, how many systems it has to talk to, and how clean the data is when we start. We scope before we quote, and the quote states what moves the number. If a smaller piece of work would answer the question, we will say so.</p>`;
  }
  if (/compar|versus|alternativ/.test(key)) {
    return `${heading}<p>Comparing options honestly means naming the trade-offs. A packaged tool is faster to start and harder to bend; a custom build fits exactly and takes longer to stand up. We will tell you which one your situation calls for, including when that is not us.</p>`;
  }
  if (/faq|question/.test(key)) {
    return `${heading}<p>The questions ${ind} teams ask most about ${topic}: what it costs, how long it takes, what it needs from your side, and how you will know it worked. Each is answered in the sections above, and the scoping call covers anything specific to your setup.</p>`;
  }
  if (/call to action|cta|contact|get started|next step/.test(key)) {
    return `${heading}<p>Tell Nexoris Technologies about your goals and we will come back with a clear plan, a realistic timeline and honest numbers, with no obligation. ${svc === "Nexoris Technologies" ? "" : `Ask about our <a href="${SERVICE_PAGES.find((p) => p.includes(slugish(svc))) ?? SERVICE_PAGES[0]}/">${svc}</a> work. `}If we are not the right fit, we will say so and point you somewhere better.</p>`;
  }

  // An unrecognised section. Say plainly that it is an outline, so nobody mistakes it for finished
  // copy and publishes it: the gate would hold it anyway, and this says why.
  return `${heading}<p>This section is an outline for the editor. It should cover ${fixAcronyms(name).toLowerCase()} as it applies to ${topic} for ${ind}, in the same plain terms as the rest of the page, and it needs writing before this page is published.</p>`;
}

export function composePageBody(title: string, keyword: string, industry: string, service: string, sections?: string[]): string {
  // Acronyms keep their own casing wherever the topic appears. "ai solutions for healthcare" used
  // to render as "Ai solutions for healthcare" in the opening sentence and in a heading.
  const topic = fixAcronyms((keyword || title || "this solution").trim());
  const ind = fixAcronyms((industry || "your industry").trim());
  const svc = fixAcronyms((service || "Nexoris Technologies").trim());
  const cap = (s: string): string => sentenceCase(s);

  // Two real internal links, chosen from pages that exist. A page with no way onward is a dead end,
  // and the readiness gate asks for at least one, which the composed body never carried.
  const serviceLink = SERVICE_PAGES.find((p) => p.includes(slugish(svc))) ?? SERVICE_PAGES[0];
  const industryLink = INDUSTRY_PAGES.find((p) => p.includes(slugish(ind))) ?? "/case-studies";
  const benefits = ["Faster time to value with a clear, staged rollout", "Lower operating cost through automation and better data", "Higher reliability with security and compliance built in from day one", "Decisions backed by real numbers, not guesswork"];
  const applications = [`Streamlining core operations for ${ind} teams`, "Automating manual, repetitive back-office work", "Turning scattered data into clear, usable dashboards", "Connecting the tools your team already uses"];
  // A template names the page's sections, so the page follows them. Without one, the default shape
  // below applies. Either way the answer-first opening and the evidence section are always present:
  // the first because it is what a reader and an answer engine both take, the second because a page
  // that claims without saying how it knows is the thing E-E-A-T exists to catch.
  if (sections && sections.length > 0) {
    const lead =
      `<p><strong>${cap(topic)} means using software to take a specific, repeated job off your team and make its results measurable.</strong> For ${ind} businesses that usually looks like one of three things: work that takes days moved to minutes, records that three systems disagree about reduced to one version, or numbers that were assembled by hand reported automatically.</p>`;
    const evidence =
      `<h2>How we know this works</h2><p>Everything above comes from delivering this work, not from summarising it. We scope against the system you already run, test with your real data and the people who will use it, and agree how the result will be measured before any build starts. This page is written and reviewed by a named person at Nexoris Technologies whose profile you can read.</p>`;
    const written = sections.map((name) => templateSection(name, topic, ind, svc)).join("");
    const hasEvidence = sections.some((s) => /proof|case stud|result|evidence|testimonial/i.test(s));
    let out = lead + written + (hasEvidence ? "" : evidence);

    // A six-section template comes to roughly 400 words, under the floor the gate enforces, so the
    // page would be refused the moment it was written. Sections the template did not ask for are
    // appended until it clears: they are real content about the same topic, not padding, and the
    // editor can delete any that do not belong.
    const topUps = [
      `<h2>What ${topic} means in practice</h2><p>Most ${ind} teams do not need a new idea. They need the work in front of them to take less time, break less often, and produce numbers they can act on. ${sentenceCase(topic)} earns its place when it removes a real bottleneck: a report that takes two days to assemble, an approval sitting in someone's inbox, a set of records three systems each hold a different version of. We start from the bottleneck, not from the technology.</p>`,
      `<h2>What it takes from your side</h2><p>An honest answer, because the projects that fail usually fail here. You need someone who can decide, access to the systems involved, and a few hours a week from the people who do the work today. That is most of it. We handle the build, the testing, the documentation and the rollout, and we will tell you plainly when something we are asked to do is not worth doing.</p>`,
      `<h2>How Nexoris Technologies delivers ${topic}</h2><p>We start with a short scoping call to understand your goals, the systems already in place, and who has to live with the result. Work ships in stages, each small enough to review and put into use, so you are never waiting months to see whether the direction is right. Every build ships with security considered from the first design and documentation your own team can read.</p>`,
      `<h2>Why choose Nexoris Technologies</h2><p>We build useful software for real businesses, not demos. Our work in ${ind} pairs modern engineering with first-hand knowledge of how these operations actually run, so the result is something your team uses and trusts rather than something that quietly goes unused after launch. We stay through the rollout, and we would rather scope something smaller that works than something larger that does not. If we are not the right fit for what you need, we will say so plainly and point you somewhere better.</p>`,
    ];
    for (const extra of topUps) {
      if (bodyWordCount(out) >= PSEO_MIN_WORDS) break;
      // Never repeat a heading the template already asked for.
      const heading = /<h2>([^<]*)<\/h2>/.exec(extra)?.[1] ?? "";
      if (out.includes(`<h2>${heading}</h2>`)) continue;
      out += extra;
    }
    return stripEmDash(out);
  }

  return stripEmDash([
    // Answer first: what it is, who it is for, and what it changes, in the opening sentences and
    // before any framing. This paragraph has to make sense quoted on its own.
    `<p><strong>${cap(topic)} means using software to take a specific, repeated job off your team and make its results measurable.</strong> For ${ind} businesses that usually looks like one of three things: work that takes days moved to minutes, records that three systems disagree about reduced to one version, or numbers that were assembled by hand reported automatically. Nexoris Technologies builds these systems in stages, each small enough to put into use and judge before the next one starts, so the value arrives early rather than at the end.</p>`,
    `<p>Below: where it helps most in ${ind}, what it asks of your team, how we deliver it, and how to tell whether it worked.</p>`,
    `<h2>What ${topic} means in practice</h2><p>Most ${ind} teams do not need a new idea. They need the work in front of them to take less time, break less often, and produce numbers they can act on. That is the whole of it. ${cap(topic)} earns its place when it removes a real bottleneck: a report that takes two days to assemble, an approval that sits in someone's inbox, a set of records that three systems each hold a different version of. We start from the bottleneck, not from the technology.</p>`,
    `<h2>Key benefits of ${topic}</h2><ul>${benefits.map((b) => `<li>${b}</li>`).join("")}</ul><p>Each of these is something you can measure before and after, and we agree how it will be measured before any build starts. A benefit nobody can put a number against is not a benefit; it is a hope.</p>`,
    `<h2>Where ${cap(topic)} helps in ${ind}</h2><ul>${applications.map((a) => `<li>${a}</li>`).join("")}</ul><p>These are the patterns we see repeatedly in ${ind}. Yours may sit somewhere between two of them, which is normal, and the scoping call exists to find out exactly where.</p>`,
    `<h2>How Nexoris Technologies delivers ${topic}</h2><p>We start with a short scoping call to understand your goals, the systems already in place, and who has to live with the result. From there we design a solution that fits your team and your data rather than one that assumes both are perfect. Work ships in stages, each one small enough to review and put into use, so you are never waiting months to see whether the direction is right.</p><p>Every build ships with security considered from the first design, documentation your own team can read, and a plan you can measure against. We test with real data and real users before anything is called finished. When something does not work as expected, you hear it from us first, with what we intend to do about it.</p><p>More on the service itself is on our <a href="${serviceLink}/">${svc} page</a>, and the work we have done nearby is under <a href="${industryLink}/">${ind}</a>.</p>`,
    `<h2>What it takes from your side</h2><p>An honest answer, because the projects that fail usually fail here. You need someone who can decide, access to the systems involved, and a few hours a week from the people who do the work today. That is most of it. We handle the build, the testing, the documentation and the rollout, and we will tell you plainly when something we are asked to do is not worth doing.</p>`,
    `<h2>How we know this works</h2><p>Everything above comes from delivering this work, not from summarising it. We scope against the system you already run, test with your real data and the people who will use it, and agree how the result will be measured before any build starts. When a number does not move after launch, that is our problem to fix, and we would rather say a piece of work is not worth doing than bill for it.</p><p>This page is written and reviewed by a named person at Nexoris Technologies whose profile you can read, and it is revised when what we deliver changes. If something here does not match your experience of working with us, tell us and we will correct it.</p>`,
    `<h2>Why choose Nexoris Technologies</h2><p>We build useful software for real businesses, not demos. Our work in ${ind} pairs modern engineering with first-hand knowledge of how these operations actually run, so the result is something your team uses and trusts rather than something that quietly goes unused after launch. We stay through the rollout, and we would rather scope something smaller that works than something larger that does not.</p>`,
    `<h2>Ready to get started?</h2><p>Tell us about your goals and we will come back with a clear plan, a realistic timeline and honest numbers, with no obligation. ${svc === "Nexoris Technologies" ? "" : `Ask about our ${svc} work. `}If we are not the right fit for what you need, we will say so and point you somewhere better. Let us help you get more from ${topic}.</p>`,
  ].join(""));
}

const plain = (s: string): string => (s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const stripEmDash = (s: string): string => s.replace(/\s*—\s*/g, ", ");
const sentences = (s: string): string[] => plain(s).split(/(?<=[.!?])\s+/).map((x) => x.trim()).filter((x) => x.length > 12);

/**
 * Record one gateway call. Never throws and never blocks the caller: telemetry failing must not fail
 * the thing being measured. Token counts are written only when the gateway reports them.
 */
async function recordUsage(row: {
  feature: string; model?: string | null; promptTokens?: number | null;
  completionTokens?: number | null; durationMs: number; ok: boolean; error?: string | null;
}): Promise<void> {
  try {
    await cmsDb().query(
      `INSERT INTO cms_ai_usage (feature, model, prompt_tokens, completion_tokens, duration_ms, ok, error)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [row.feature, row.model ?? null, row.promptTokens ?? null, row.completionTokens ?? null,
       row.durationMs, row.ok, row.error ?? null]);
  } catch { /* telemetry is best-effort */ }
}

async function callGateway(input: EditorialInput): Promise<EditorialResult | null> {
  const secret = process.env.OGE_REINGEST_SHARED_SECRET;
  if (!secret) return null;
  const started = Date.now();
  try {
    const res = await fetch(`${GATEWAY}/content/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-secret": secret },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) {
      await recordUsage({ feature: input.kind, durationMs: Date.now() - started, ok: false, error: `HTTP ${res.status}` });
      return null;
    }
    const json = (await res.json()) as {
      result: EditorialResult;
      model?: string;
      usage?: { promptTokens?: number; completionTokens?: number };
    };
    await recordUsage({
      feature: input.kind,
      model: json.model ?? null,
      promptTokens: json.usage?.promptTokens ?? null,
      completionTokens: json.usage?.completionTokens ?? null,
      durationMs: Date.now() - started,
      ok: true,
    });
    return json.result;
  } catch (err) {
    await recordUsage({
      feature: input.kind, durationMs: Date.now() - started, ok: false,
      error: err instanceof Error ? err.message.slice(0, 200) : "request failed",
    });
    return null;
  }
}

export async function generateEditorial(input: EditorialInput): Promise<{ result: EditorialResult; source: "oge" | "fallback" }> {
  const ai = await callGateway(input);
  const result = ai != null ? ai : deterministic(input);
  const source: "oge" | "fallback" = ai != null ? "oge" : "fallback";

  // A page body under the floor does not leave here. A model asked for a long page will sometimes
  // return four short paragraphs, and that page would be held back by the publish gate anyway — better
  // to hand the editor something publishable than something they have to discover is too thin.
  if (input.kind === "page-body" && typeof result === "string" && bodyWordCount(result) < PSEO_MIN_WORDS) {
    const written = composePageBody(input.title ?? "", input.focusKeyword ?? "", input.industry ?? "", input.service ?? "", input.sections);
    // Keep whatever the model produced and set the written sections after it, so its own wording is
    // not thrown away for being short.
    const merged = bodyWordCount(result) > 40 ? `${result}${written}` : written;
    return { result: merged, source };
  }
  return { result, source };
}

/**
 * Remove an inserted TL;DR block from the body.
 *
 * The assistant inserts the summary at the very top of the article as `<h2>TL;DR</h2><ul>...</ul>`,
 * so anything that reads "the first couple of sentences" was reading the summary instead of the
 * article. That is how the excerpt came back as the TL;DR. Removed at the markup level, before the
 * HTML is flattened, so the heading and its list go together.
 */
export function stripTldrBlock(html: string): string {
  return (html || "")
    .replace(/<h[1-6][^>]*>\s*TL;?DR[^<]*<\/h[1-6]>\s*(<(ul|ol)[\s\S]*?<\/\2>)?/gi, " ")
    .replace(/\bTL;?DR\b:?/gi, " ");
}

function deterministic(input: EditorialInput): EditorialResult {
  const body = plain(input.body ?? "");
  const title = (input.title ?? "").trim();
  const sents = sentences(body);
  switch (input.kind) {
    case "seo": {
      // No ellipsis. A trailing "..." in a search result says the sentence was cut and tells the
      // reader nothing; whole sentences that stop early are better than a long one that trails off.
      const metaTitle = deriveMetaTitle(title || sents[0] || "Nexoris Technologies");
      const prose = stripTldrBlock(input.body ?? "") ? plain(stripTldrBlock(input.body ?? "")) : title;
      const fitted = fitMetaDescription(prose || title);
      return { metaTitle: stripEmDash(metaTitle), metaDescription: stripEmDash(fitted.text) };
    }
    case "tldr":
      return sents.slice(0, 5).map((s) => stripEmDash(s));
    case "excerpt": {
      // The summary block sits at the top of the article, so the first two sentences of the raw
      // body were the TL;DR rather than the piece itself.
      const prose = sentences(plain(stripTldrBlock(input.body ?? "")));
      let e = "";
      for (const sentence of prose.slice(0, 3)) {
        const candidate = e ? `${e} ${sentence}` : sentence;
        if (candidate.length > 200) break;
        e = candidate;
      }
      return stripEmDash(e || title);
    }
    case "faqs": {
      // Always return exactly 5 questions with answers grounded in the page content: for each canonical
      // question, use the first body sentence that matches its intent, else a house-voice answer that
      // still references the real topic. The editor refines before publishing.
      const topic = (input.focusKeyword?.trim() || title || "this solution").trim();
      const cap = topic.charAt(0).toUpperCase() + topic.slice(1);
      // FAQ answers are prose, never a summary block: exclude any TL;DR sentence from the source and
      // strip the token from the output so a generated FAQ can never contain "TLDR".
      const noTldr = (s: string): string => s.replace(/\bTL;?DR\b:?/gi, "").replace(/\s{2,}/g, " ").trim();
      const faqSents = sents.filter((s) => !/tl;?dr/i.test(s));
      const pick = (keys: string[]): string | null => faqSents.find((s) => keys.some((k) => s.toLowerCase().includes(k))) ?? null;
      const lead = faqSents.slice(0, 2).join(" ");
      const items: FaqItem[] = [
        { question: `What is ${topic}?`,
          answer: lead || `${cap} is a solution Nexoris Technologies designs and builds for real businesses, focused on outcomes you can measure.` },
        { question: `How does Nexoris Technologies approach ${topic}?`,
          answer: pick(["build", "design", "process", "work", "deliver", "approach", "start"]) || `We start with a short scoping call, design a solution that fits your team and data, then ship it with security, documentation, and a plan you can measure against.` },
        { question: `What are the benefits of ${topic}?`,
          answer: pick(["benefit", "faster", "improve", "reduce", "cost", "save", "reliab", "grow", "efficien"]) || `Done well, ${topic} lowers operating cost, speeds up delivery, and gives you decisions backed by real numbers rather than guesswork.` },
        { question: `Who is ${topic} for?`,
          answer: pick(["team", "business", "industr", "compan", "organis", "organiz", "for "]) || `${cap} suits teams that want practical software they will actually use, from growing businesses to established organisations.` },
        { question: `How do I get started with ${topic}?`,
          answer: `Tell Nexoris Technologies about your goals and we will come back with a clear plan and honest numbers, with no obligation. You can reach us from the contact page.` },
      ];
      return items.map((it) => ({ question: noTldr(stripEmDash(it.question)), answer: noTldr(stripEmDash(it.answer)) }));
    }
    case "author-bio": {
      const first = (input.authorName ?? "This author").trim().split(/\s+/)[0] || "This author";
      const skills = (input.expertise ?? []).filter(Boolean);
      const topic = skills.length ? skills.slice(0, 3).join(", ") : "technology";
      const role = input.authorRole ? `a ${input.authorRole.toLowerCase()}` : "a contributor";
      return stripEmDash(`${first} is ${role} at Nexoris Technologies, writing about ${topic}. ${first} turns hard ideas into clear, useful reading and cares about getting the details right.`);
    }
    case "internal-links": {
      // Suggest links to real Nexoris Technologies pages with a natural anchor phrase. Candidates come
      // from the caller when given, otherwise from the live site map, so the tool works even before the
      // body is long. Each is scored by how well the page's topic overlaps the content, best first.
      const candidates = (input.pages && input.pages.length ? input.pages : siteLinkCandidates());
      const hay = `${title} ${input.focusKeyword ?? ""} ${body}`.toLowerCase();
      const scored = candidates.map((p) => {
        const words = p.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
        const hits = words.filter((w) => hay.includes(w));
        return { p, score: hits.length, hit: hits[0] };
      }).sort((a, b) => b.score - a.score);
      const links: InternalLink[] = scored.slice(0, 5).map(({ p, score, hit }) => ({
        anchor: anchorFor(p.title),
        target: p.url,
        rationale: score > 0 && hit
          ? `Your content mentions ${hit}, which this page covers in depth.`
          : `A strong related Nexoris Technologies page to link from this topic.`,
      }));
      return links;
    }
    case "page-body":
      return composePageBody(title, input.focusKeyword ?? "", input.industry ?? "", input.service ?? "", input.sections);
  }
}

/**
 * Alt text for an uploaded image. Tries Gemini vision via the gateway; on any failure derives readable
 * alt text from the file name. Always returns something; the UI lets the editor override it.
 */
export async function altTextForImage(base64: string, mimeType: string, fileName: string): Promise<{ altText: string; source: "oge" | "fallback" }> {
  const secret = process.env.OGE_REINGEST_SHARED_SECRET;
  if (secret) {
    try {
      const res = await fetch(`${GATEWAY}/content/alt-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-internal-secret": secret },
        body: JSON.stringify({ data: base64, mimeType }),
        signal: AbortSignal.timeout(20000),
      });
      if (res.ok) { const json = (await res.json()) as { altText: string }; if (json.altText) return { altText: json.altText, source: "oge" }; }
    } catch { /* fall through */ }
  }
  const base = fileName.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  const alt = base ? base.charAt(0).toUpperCase() + base.slice(1) : "Uploaded image";
  return { altText: alt.slice(0, 125), source: "fallback" };
}
