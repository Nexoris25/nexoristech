/**
 * CMS editorial assists for the admin dashboard (PRD Part Two, Section 1-2, and Part One 10.1 CMS AI
 * group). Oge drafts the SEO fields, a TL;DR, an excerpt, an FAQ set, a per-article author bio, and
 * internal-link suggestions from the article body, plus alt text for an uploaded image. Everything is a
 * draft the editor approves before publish, grounded only in the supplied content, in the house voice:
 * spoken word, English, no em dash, no jargon, cliches, or buzzwords, "Nexoris Technologies" in full.
 * All generation walks the CMS AI fallback chain; a thrown error lets the admin fall back deterministically.
 */
import { Injectable } from "@nestjs/common";
import { CMS_AI_MODELS, CRM_WORKER_MODELS, apiKeyFor, resolveModelId, type Env } from "../config/models.js";
import { generateGrounded, stripEmDash } from "../providers/generation.js";

export type EditorialKind = "seo" | "tldr" | "excerpt" | "faqs" | "author-bio" | "internal-links";

export interface EditorialInput {
  kind: EditorialKind;
  title?: string;
  body?: string;              // HTML or plain text of the article
  focusKeyword?: string;
  authorName?: string;
  authorRole?: string;
  expertise?: string[];
  pages?: { title: string; url: string }[]; // candidate targets for internal links
}

export interface SeoResult { metaTitle: string; metaDescription: string }
export interface FaqItem { question: string; answer: string }
export interface InternalLink { anchor: string; target: string; rationale: string }
export type EditorialResult = SeoResult | string | string[] | FaqItem[] | InternalLink[];

const VOICE = `Write in English, in the house voice: spoken word, the way a knowledgeable person explains things. Never use an em dash. No jargon, cliches, or buzzwords. Always write "Nexoris Technologies" in full. Do not invent facts, prices, dates, client names, or results. Ground everything strictly in the supplied content.`;
const plain = (s: string): string => (s || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

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
      case "seo": return this.seo(title, body, input.focusKeyword);
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

  private async seo(title: string, body: string, keyword?: string): Promise<SeoResult> {
    const text = await this.run(
      `You write SEO metadata for a Nexoris Technologies page. Return strict JSON: {"metaTitle": string, "metaDescription": string}. metaTitle is at most 60 characters and includes the focus keyword when natural. metaDescription is 150 to 160 characters, compelling, and reads well as a search and AI-answer snippet.`,
      JSON.stringify({ title, focusKeyword: keyword ?? null, body: body.slice(0, 4000) }), 300, 0.3);
    const j = parseJson<SeoResult>(text);
    if (!j || !j.metaTitle) throw new Error("bad seo json");
    return { metaTitle: stripEmDash(j.metaTitle).slice(0, 60), metaDescription: stripEmDash(j.metaDescription ?? "").slice(0, 160) };
  }

  private async tldr(title: string, body: string): Promise<string[]> {
    const text = await this.run(
      `Write a TL;DR for the article as 3 to 5 short bullet points a reader can scan in seconds. Return strict JSON: {"bullets": string[]}. Each bullet is one plain sentence.`,
      JSON.stringify({ title, body: body.slice(0, 6000) }), 400, 0.4);
    const j = parseJson<{ bullets: string[] }>(text);
    if (!j || !Array.isArray(j.bullets)) throw new Error("bad tldr json");
    return j.bullets.map((b) => stripEmDash(b)).filter(Boolean).slice(0, 5);
  }

  private async excerpt(title: string, body: string): Promise<string> {
    const text = await this.run(
      `Write a one to two sentence excerpt for this article, used on cards and in search results. Plain and inviting, at most 200 characters. Return only the excerpt text.`,
      JSON.stringify({ title, body: body.slice(0, 4000) }), 160, 0.5);
    return stripEmDash(plain(text)).slice(0, 200);
  }

  private async faqs(title: string, body: string): Promise<FaqItem[]> {
    const text = await this.run(
      `Write 5 to 7 frequently asked questions with clear, self-contained answers based only on the article. These become FAQPage schema, so each answer must stand on its own. Return strict JSON: {"faqs": [{"question": string, "answer": string}]}.`,
      JSON.stringify({ title, body: body.slice(0, 8000) }), 900, 0.4);
    const j = parseJson<{ faqs: FaqItem[] }>(text);
    if (!j || !Array.isArray(j.faqs)) throw new Error("bad faq json");
    return j.faqs.filter((f) => f.question && f.answer).map((f) => ({ question: stripEmDash(f.question), answer: stripEmDash(f.answer) })).slice(0, 7);
  }

  private async authorBio(input: EditorialInput): Promise<string> {
    // The per-article author bio uses the CRM worker group, tuned for warm outreach-style prose.
    const { value } = await generateGrounded(CRM_WORKER_MODELS, this.env, {
      system: `Write a short third-person author bio (2 to 3 sentences) for this contributor, tied to the topic of the article. Warm and credible, no fluff.\n${VOICE}`,
      user: JSON.stringify({ name: input.authorName ?? null, role: input.authorRole ?? null, expertise: input.expertise ?? [], articleTitle: input.title ?? null }),
      temperature: 0.5, maxTokens: 220,
    });
    return stripEmDash(plain(value));
  }

  private async internalLinks(title: string, body: string, pages: { title: string; url: string }[]): Promise<InternalLink[]> {
    if (pages.length === 0) throw new Error("no candidate pages");
    const text = await this.run(
      `Suggest up to 5 internal links from this article to other Nexoris Technologies pages, chosen ONLY from the candidate list. For each, give the anchor text (a natural phrase that appears or fits in the article), the target URL from the list, and a one-line rationale. Return strict JSON: {"links": [{"anchor": string, "target": string, "rationale": string}]}.`,
      JSON.stringify({ title, body: body.slice(0, 6000), candidates: pages.slice(0, 40) }), 600, 0.3);
    const j = parseJson<{ links: InternalLink[] }>(text);
    if (!j || !Array.isArray(j.links)) throw new Error("bad links json");
    const valid = new Set(pages.map((p) => p.url));
    return j.links.filter((l) => l.anchor && valid.has(l.target)).map((l) => ({ anchor: stripEmDash(l.anchor), target: l.target, rationale: stripEmDash(l.rationale ?? "") })).slice(0, 5);
  }

  /**
   * Alt text for an uploaded image, via Gemini vision on the backend Project B key. Returns concise,
   * descriptive alt text (no "image of"). Throws when the key is missing or the call fails, so the
   * admin falls back to filename-derived alt text.
   */
  async altText(base64: string, mimeType: string): Promise<string> {
    const slot = CMS_AI_MODELS.backups.find((s) => s.provider === "gemini") ?? CMS_AI_MODELS.primary;
    const apiKey = apiKeyFor(slot, this.env);
    if (!apiKey || slot.provider !== "gemini") throw new Error("no vision key");
    const modelId = resolveModelId(slot, this.env);
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: `Write concise, specific alt text for this image, at most 125 characters, for accessibility and image SEO. Do not start with "image of" or "photo of". ${VOICE}` }] },
        contents: [{ role: "user", parts: [{ inlineData: { mimeType, data: base64 } }, { text: "Alt text:" }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 80 },
      }),
    });
    if (!res.ok) throw new Error(`vision ${res.status}`);
    const json = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const alt = stripEmDash((json.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("").trim());
    if (!alt) throw new Error("empty alt");
    return alt.replace(/^(image|photo|picture) of /i, "").slice(0, 125);
  }
}
