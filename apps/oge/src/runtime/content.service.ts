/**
 * CMS editorial assists for the admin dashboard (PRD Part Two, Section 1-2, and Part One 10.1 CMS AI
 * group). Oge drafts the SEO fields, a TL;DR, an excerpt, an FAQ set, a per-article author bio, and
 * internal-link suggestions from the article body, plus alt text for an uploaded image. Everything is a
 * draft the editor approves before publish, grounded only in the supplied content, in the house voice:
 * spoken word, English, no em dash, no jargon, cliches, or buzzwords, "Nexoris Technologies" in full.
 * All generation walks the CMS AI fallback chain; a thrown error lets the admin fall back deterministically.
 */
import { Injectable } from "@nestjs/common";
import { CMS_AI_MODELS, CRM_WORKER_MODELS, apiKeyFor, apiKeyEnvVar, chainFor, resolveModelId, type Env, type ModelSlot } from "../config/models.js";
import { generateGrounded, stripEmDash } from "../providers/generation.js";
import { deriveMetaTitle, fitMetaDescription, META_LIMITS } from "@nexoris/seo";

export type EditorialKind = "seo" | "tldr" | "excerpt" | "faqs" | "author-bio" | "internal-links";

export interface EditorialInput {
  kind: EditorialKind;
  title?: string;
  body?: string;              // HTML or plain text of the article
  authorName?: string;
  authorRole?: string;
  expertise?: string[];
  /** Years in the field, taken from the author record. Never inferred. */
  yearsExperience?: number | string;
  /** The author's standing profile bio, as the factual base a per-article bio draws from. */
  authorProfileBio?: string;
  pages?: { title: string; url: string }[]; // candidate targets for internal links
}

export interface SeoResult { metaTitle: string; metaDescription: string }
export interface FaqItem { question: string; answer: string }
export interface InternalLink { anchor: string; target: string; rationale: string }
export type EditorialResult = SeoResult | string | string[] | FaqItem[] | InternalLink[];

const VOICE = `Write in English, in the house voice: spoken word, the way a knowledgeable person explains things. Never use an em dash. No jargon, cliches, or buzzwords. Always write "Nexoris Technologies" in full. Do not invent facts, prices, dates, client names, or results. Ground everything strictly in the supplied content.`;
const plain = (s: string): string => (s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

/**
 * Drop an inserted TL;DR block, heading and list together.
 *
 * The assistant puts the summary at the very top of the article, so anything reading the opening of
 * the body was reading the summary rather than the piece.
 */
const stripTldr = (s: string): string =>
  (s || "")
    .replace(/<h[1-6][^>]*>\s*TL;?DR[^<]*<\/h[1-6]>\s*(<(ul|ol)[\s\S]*?<\/\2>)?/gi, " ")
    .replace(/\bTL;?DR\b:?/gi, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

/**
 * Pulls a JSON value out of a model's reply.
 *
 * The old rule was `/\{[\s\S]*\}/`, which is greedy: it spanned from the first brace in the reply to
 * the last one anywhere in it. That works only when the model returns bare JSON and nothing else. A
 * reasoning model emits a `<think>` block first, and a chatty one wraps the answer in a fenced code
 * block with a sentence after it — both cases produced a span that was not valid JSON, so every
 * editorial feature failed with "bad seo json" while the model had in fact answered correctly.
 *
 * This strips the reasoning and the fences, then scans for the first *balanced* object or array,
 * respecting strings and escapes so a brace inside a value cannot end the scan early.
 */
export function parseJson<T>(text: string): T | null {
  const cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<\|[^|]*\|>/g, "")
    .replace(/```(?:json)?/gi, "")
    .trim();

  for (let i = 0; i < cleaned.length; i++) {
    const open = cleaned[i];
    if (open !== "{" && open !== "[") continue;
    const close = open === "{" ? "}" : "]";

    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let j = i; j < cleaned.length; j++) {
      const ch = cleaned[j];
      if (escaped) { escaped = false; continue; }
      if (ch === "\\") { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === open) depth++;
      else if (ch === close) {
        depth--;
        if (depth === 0) {
          try { return JSON.parse(cleaned.slice(i, j + 1)) as T; } catch { break; }
        }
      }
    }
  }
  return null;
}

@Injectable()
export class ContentService {
  private readonly env: Env = process.env;

  async generate(input: EditorialInput): Promise<EditorialResult> {
    const body = plain(input.body ?? "");
    const title = (input.title ?? "").trim();
    switch (input.kind) {
      case "seo": return this.seo(title, body);
      case "tldr": return this.tldr(title, body);
      case "excerpt": return this.excerpt(title, body);
      case "faqs": return this.faqs(title, body);
      case "author-bio": return this.authorBio(input);
      case "internal-links": return this.internalLinks(title, body, input.pages ?? []);
    }
  }

  private async run(system: string, user: string, maxTokens = 600, temperature = 0.4): Promise<string> {
    const { value } = await generateGrounded(CMS_AI_MODELS, this.env, { system: `${system}\n${VOICE}`, user, temperature, maxTokens });
    return value.trim();
  }

  /**
   * Meta title and meta description.
   *
   * The title is derived from the page title rather than written. The page title is already the
   * shortest accurate description of the page, and asking a model for a second one invites the two
   * to disagree, which is how a search result ends up promising something the page does not open
   * with.
   *
   * The description is the part worth generating: a short summary written to earn the click, and
   * often the only sentence someone reads before deciding. The model is asked for two or three
   * whole sentences rather than a character count, because asked for 160 characters it returns 180
   * or 120 and a different number next time. fitMetaDescription then keeps whole sentences up to
   * the limit, so nothing is cut mid-word the way the old `.slice(0, 160)` could.
   *
   * One retry, nudged with what was wrong. A short complete description beats a long severed one,
   * so a short result is returned as it is rather than padded to reach the window.
   */
  private async seo(title: string, body: string): Promise<SeoResult> {
    const metaTitle = deriveMetaTitle(title);

    const system = [
      'Write the meta description for a Nexoris Technologies page. Return strict JSON: {"metaDescription": string}.',
      "Summarise what the page actually gives the reader and why it is worth opening, in the concrete",
      "terms someone searching would recognise. Two or three short complete sentences, about 155 to 160",
      "characters in total. Every sentence must be finished. Do not repeat the page title back, do not",
      'begin with "This page", and do not promise anything the page does not contain.',
    ].join(" ");

    const ask = async (extra: string): Promise<string> => {
      const text = await this.run(system + extra, JSON.stringify({ title, body: body.slice(0, 4000) }), 300, 0.35);
      const j = parseJson<{ metaDescription?: string }>(text);
      return stripEmDash(j?.metaDescription ?? "");
    };

    let fitted = fitMetaDescription(await ask(""));
    if (!fitted.inRange) {
      const nudge = fitted.length < META_LIMITS.descriptionMin
        ? ` The previous attempt came to ${fitted.length} characters, which is short. Add one more short sentence.`
        : " The previous attempt was too long to fit. Use shorter sentences.";
      const second = fitMetaDescription(await ask(nudge));
      const closer = Math.abs(second.length - META_LIMITS.descriptionMax) < Math.abs(fitted.length - META_LIMITS.descriptionMax);
      if (second.complete && (!fitted.complete || closer)) fitted = second;
    }
    if (!fitted.complete) throw new Error("no complete meta description");
    return { metaTitle, metaDescription: fitted.text };
  }

  private async tldr(title: string, body: string): Promise<string[]> {
    const text = await this.run(
      `Write a TL;DR for the article as 3 to 5 short bullet points a reader can scan in seconds. Return strict JSON: {"bullets": string[]}. Each bullet is one plain sentence.`,
      JSON.stringify({ title, body: body.slice(0, 6000) }), 400, 0.4);
    const j = parseJson<{ bullets: string[] }>(text);
    if (!j || !Array.isArray(j.bullets)) throw new Error("bad tldr json");
    return j.bullets.map((b) => stripEmDash(b)).filter(Boolean).slice(0, 5);
  }

  /**
   * The card and listing excerpt.
   *
   * The article often opens with an inserted TL;DR block, so a model asked to summarise "the start"
   * summarised the summary and the excerpt came back as the TL;DR. The block is removed before the
   * body is sent, and the instruction says so as well.
   *
   * No ellipsis on the way out either. The old code ended with `.slice(0, 200)`, which could cut a
   * word; whole sentences are kept instead and a short excerpt is preferred to a severed one.
   *
   * The limit is 280 rather than 200, and the instruction asks for a teaser rather than a summary.
   * Two lines on a card is enough to restate the title in other words, which is what a 200-character
   * summary tends to be. Three lines is enough to say what the reader gets, and the instruction asks
   * for the one specific thing - a figure, a range, a comparison - that the title cannot carry.
   */
  private async excerpt(title: string, body: string): Promise<string> {
    const source = stripTldr(body);
    const text = await this.run(
      `Write a two to three sentence excerpt for this article, used on cards and in search results. At most 280 characters. ` +
      `It is a teaser, not a summary: say what the reader will be able to do or decide after reading, and name the most specific thing the article contains - a figure, a comparison, a range - that they cannot get from the title alone. ` +
      `Plain and inviting. No hype, no questions, no "discover" or "learn about". ` +
      `The article may begin with a TL;DR summary: ignore it and describe the article itself. Do not repeat the title. Finish every sentence. Return only the excerpt text.`,
      JSON.stringify({ title, body: source.slice(0, 4000) }), 220, 0.5);

    const cleaned = stripEmDash(plain(stripTldr(text)));
    let out = "";
    for (const sentence of cleaned.split(/(?<=[.!?])\s+/)) {
      const candidate = out ? `${out} ${sentence}` : sentence;
      if (candidate.length > 280) break;
      out = candidate;
    }
    return out || cleaned.slice(0, 200);
  }

  private async faqs(title: string, body: string): Promise<FaqItem[]> {
    const text = await this.run(
      `Write 5 to 7 frequently asked questions with clear, self-contained answers based only on the article. These become FAQPage schema, so each answer must stand on its own. Return strict JSON: {"faqs": [{"question": string, "answer": string}]}.`,
      JSON.stringify({ title, body: body.slice(0, 8000) }), 900, 0.4);
    const j = parseJson<{ faqs: FaqItem[] }>(text);
    if (!j || !Array.isArray(j.faqs)) throw new Error("bad faq json");
    return j.faqs.filter((f) => f.question && f.answer).map((f) => ({ question: stripEmDash(f.question), answer: stripEmDash(f.answer) })).slice(0, 7);
  }

  /**
   * The per-article author bio.
   *
   * This is an E-E-A-T signal, so it has to be two things at once: true about the person, and about
   * this article. It used to see only a name, a role and the article title, which is not enough to
   * be either. It could not say why this author is worth reading on this subject, and given nothing
   * factual to work from, a model fills the gap by inventing credentials.
   *
   * It now receives the author's own record, their standing profile bio and the article body, and
   * is told to connect the two and to invent nothing. A bio with no author assigned is refused
   * rather than written about an anonymous contributor, which is the case E-E-A-T cares about most.
   */
  private async authorBio(input: EditorialInput): Promise<string> {
    const name = (input.authorName ?? "").trim();
    if (!name) throw new Error("assign an author before writing a bio");

    const system = [
      "Write a third-person author bio of 2 to 3 sentences for the byline of this specific article.",
      "Sentence one: who this person is, using only the role, years and areas of expertise supplied.",
      "Sentence two: what in their background bears directly on the subject of this article, referring",
      "to what the article actually covers rather than to its title alone.",
      "An optional third sentence may say how they work.",
      "Use only the supplied facts. Do not invent employers, job titles, qualifications, awards, client",
      "names or numbers, and do not state years of experience unless a number is given. Where a field",
      "is missing, write around it rather than guessing.",
      VOICE,
    ].join(" ");

    const { value } = await generateGrounded(CRM_WORKER_MODELS, this.env, {
      system,
      user: JSON.stringify({
        name,
        role: input.authorRole ?? null,
        yearsExperience: input.yearsExperience ?? null,
        expertise: input.expertise ?? [],
        profileBio: input.authorProfileBio ?? null,
        articleTitle: input.title ?? null,
        articleBody: plain(input.body ?? "").slice(0, 3000),
      }),
      temperature: 0.45, maxTokens: 260,
    });
    return stripEmDash(plain(value));
  }

  private async internalLinks(title: string, body: string, pages: { title: string; url: string }[]): Promise<InternalLink[]> {
    if (pages.length === 0) throw new Error("no candidate pages");
    /*
     * The anchor has to be words the article already contains.
     *
     * This asked for a phrase that "appears or fits in the article". Anything that merely fits is
     * unusable: the editor places a link by finding the phrase in the copy, so a suggestion that is
     * not there arrives with its Place button disabled and no way to act on it.
     *
     * Two to six words, because a one-word anchor tells a reader and a search engine nothing about
     * where the link goes. "software" could lead anywhere on this site; "business process
     * automation" says exactly what is on the other end.
     */
    const text = await this.run(
      [
        "Suggest up to 5 internal links from this article to other Nexoris Technologies pages, chosen ONLY from the candidate list.",
        "The anchor must be a phrase that appears in the article body word for word, copied exactly as written there, including its capitalisation.",
        "Use between two and six words. Never a single word, and never a fragment of a word.",
        "The phrase must describe what the linked page is about, so a reader knows where it leads before clicking.",
        "Only suggest a link where the article genuinely discusses that subject. Fewer good links are better than five weak ones, and none at all is a valid answer.",
        "Do not link a page to itself, and do not suggest the same target twice.",
        'Return strict JSON: {"links": [{"anchor": string, "target": string, "rationale": string}]}.',
      ].join(" "),
      JSON.stringify({ title, body: body.slice(0, 6000), candidates: pages.slice(0, 60) }), 600, 0.3);
    const j = parseJson<{ links: InternalLink[] }>(text);
    if (!j || !Array.isArray(j.links)) throw new Error("bad links json");

    const valid = new Set(pages.map((p) => p.url));
    const plain = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    /** The phrase stands on its own in the copy: not inside a longer word, and not invented. */
    const inBody = (anchor: string): boolean => {
      const escaped = anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
      return new RegExp(`(?<![\\w-])${escaped}(?![\\w-])`, "i").test(plain);
    };

    const used = new Set<string>();
    return j.links
      .filter((l) => l.anchor && valid.has(l.target))
      .map((l) => ({ anchor: stripEmDash(l.anchor).trim(), target: l.target, rationale: stripEmDash(l.rationale ?? "") }))
      // A model asked for two words still returns one sometimes, and still invents a phrase the
      // article does not contain. Both are checked here rather than left for the editor to discover.
      .filter((l) => l.anchor.split(/\s+/).length >= 2 && inBody(l.anchor))
      .filter((l) => (used.has(l.target) ? false : (used.add(l.target), true)))
      .slice(0, 5);
  }

  /**
   * The Gemini slots that can answer a vision call, in the order they should be tried.
   *
   * Only Gemini takes inlineData here, so this cannot use the full CMS chain. It previously used a
   * single slot — the Project B key — which meant one rate-limited project sent every upload to the
   * filename fallback while the Project A key sat unused. Both projects are tried, deduplicated by
   * the model and key they actually resolve to so a shared key is not called twice.
   */
  private visionSlots(): ModelSlot[] {
    const gemini = chainFor(CMS_AI_MODELS).filter((s) => s.provider === "gemini");
    const base = gemini[0];
    if (!base) return [];
    const candidates: ModelSlot[] = [
      ...gemini,
      // The other project, same model: a second quota rather than a second model.
      ...gemini.map((s) => ({ ...s, geminiProject: s.geminiProject === "B" ? ("A" as const) : ("B" as const) })),
    ];
    const seen = new Set<string>();
    return candidates.filter((s) => {
      const key = `${resolveModelId(s, this.env)}::${apiKeyEnvVar(s)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Alt text for an uploaded image, via Gemini vision. Returns concise, descriptive alt text (no
   * "image of"). Walks every configured Gemini project before giving up, so a rate limit on one
   * does not cost the caller its alt text. Throws only when all of them fail, which is what makes
   * the admin fall back to filename-derived alt text; the message names the last failure so the
   * reason is visible in the log rather than showing up as a bare 500.
   */
  async altText(base64: string, mimeType: string): Promise<string> {
    const slots = this.visionSlots();
    let lastError = "no vision key";

    for (const slot of slots) {
      const apiKey = apiKeyFor(slot, this.env);
      if (!apiKey) continue;
      const modelId = resolveModelId(slot, this.env);
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: `Write concise, specific alt text for this image, at most 125 characters, for accessibility and image SEO. Do not start with "image of" or "photo of". ${VOICE}` }] },
            contents: [{ role: "user", parts: [{ inlineData: { mimeType, data: base64 } }, { text: "Alt text:" }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 80 },
          }),
        });
        if (!res.ok) {
          // 429 and 5xx are worth trying the next project for; a 400 means the image itself is
          // rejected and every project will say the same, so stop.
          lastError = `vision ${res.status} on ${apiKeyEnvVar(slot)}`;
          if (res.status >= 400 && res.status < 500 && res.status !== 429) break;
          continue;
        }
        const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
        const alt = stripEmDash((json.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim());
        if (!alt) { lastError = "empty alt"; continue; }
        return alt.replace(/^(image|photo|picture) of /i, "").slice(0, 125);
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
      }
    }

    throw new Error(lastError);
  }
}
