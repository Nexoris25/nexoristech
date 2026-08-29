/**
 * The Oge website-bot orchestration (PRD 10.2, 10.5). For each visitor message it runs the
 * governor, then the exact-match cache, then the semantic cache, then hybrid retrieval, then the
 * grounded website-bot generation chain, caching the result. On empty retrieval it declines
 * plainly; when the whole chain is exhausted it returns the most relevant chunk as an extractive
 * answer with a handoff panel. No error code or technical detail ever reaches the visitor.
 */
import {
  Injectable,
  type OnModuleInit,
  type OnModuleDestroy,
} from "@nestjs/common";
import pg from "pg";
import { ExactMatchCache } from "../cache/exact-cache.js";
import { SemanticCache, semanticThreshold } from "../cache/semantic-cache.js";
import { normaliseQuery } from "../cache/normalise.js";
import { QuotaGovernor, type DenyReason } from "../quota/governor.js";
import { embedBatch } from "../providers/embeddings.js";
import { generateGroundedStream } from "../providers/generation.js";
import { retrieve, type RetrievedChunk } from "../retrieval/retrieve.js";
import { buildSystemPrompt, PROMPT_VERSION } from "./prompt.js";
import {
  CONNECT_MARKER,
  SentenceStream,
  stripDecoration,
  unsupportedFigures,
} from "./grounding.js";
import { WEBSITE_BOT_MODELS, type Env } from "../config/models.js";
import type { Source } from "../db.js";
import type { ChatContext, ChatEvent } from "./events.js";

const { Pool } = pg;

const WHATSAPP_HREF = "https://wa.me/2349138133224";
const CONTACT_URL = "https://nexoristech.com/contact/";
const BUSINESS_EMAIL = "business@nexoristech.com";

/** PRD 10.2: the exact words shown with the extractive fallback. */
const FALLBACK_PREAMBLE =
  "I am having trouble generating a full response right now. Here is what I found, and the team can help you with anything beyond this.";

@Injectable()
export class OgeService implements OnModuleInit, OnModuleDestroy {
  private pool!: pg.Pool;
  private exactCache!: ExactMatchCache;
  private semanticCache!: SemanticCache;
  private governor!: QuotaGovernor;
  private readonly env: Env = process.env;

  onModuleInit(): void {
    const connectionString = process.env.DATABASE_URL_OGE;
    if (!connectionString) {
      throw new Error("DATABASE_URL_OGE is not set.");
    }
    // The knowledge base is on a remote host, so a pool without timeouts hangs forever when it cannot
    // be reached. Failing in a few seconds is what lets /health report a problem instead of stalling.
    this.pool = new Pool({
      connectionString,
      max: 5,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      statement_timeout: 15000,
    });
    this.exactCache = new ExactMatchCache(this.pool);
    this.semanticCache = new SemanticCache(this.pool);
    this.governor = new QuotaGovernor();
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }

  async health(): Promise<{ status: string; db: boolean }> {
    try {
      await this.pool.query("SELECT 1");
      return { status: "ok", db: true };
    } catch {
      return { status: "degraded", db: false };
    }
  }

  /**
   * The version the answer caches are keyed on.
   *
   * The knowledge-base version alone was not enough. Both caches store a finished answer, so an
   * answer written under an older system prompt kept being served long after the prompt changed:
   * fixing the assistant to say "we build" rather than "they build" had no effect on any question
   * somebody had already asked, and there was no way to tell from the outside. The prompt is part of
   * what produced the answer, so it belongs in the key.
   *
   * Queried per request (one indexed row) rather than memoised, so a CMS re-ingest still invalidates
   * without a gateway restart.
   */
  private async kbVersion(): Promise<string> {
    const { rows } = await this.pool.query<{ kb_version: string }>(
      "SELECT kb_version FROM kb_chunk ORDER BY updated_at DESC LIMIT 1",
    );
    return `${rows[0]?.kb_version ?? "none"}:${PROMPT_VERSION}`;
  }

  /** Stream a grounded answer for one visitor message. */
  async *chat(message: string, ctx: ChatContext): AsyncGenerator<ChatEvent> {
    const trimmed = message.trim();
    const admit = this.governor.admitChat({
      sessionId: ctx.sessionId,
      ip: ctx.ip,
      inputLength: trimmed.length,
    });
    if (!admit.allowed) {
      yield { type: "notice", message: this.limitMessage(admit.reason) };
      yield { type: "done" };
      return;
    }

    const kbVersion = await this.kbVersion();

    // 1. Exact-match cache: zero model calls on a hit.
    const exact = await this.exactCache.get(trimmed, kbVersion);
    if (exact) {
      yield { type: "meta", retrieval: "exact-cache" };
      yield { type: "sources", sources: exact.sources };
      yield* this.streamText(exact.answer);
      // A cached decline is still a decline. Without this the first visitor to ask an unanswerable
      // question was offered the team and everyone after them was not.
      if (this.isDecline(exact.answer)) yield this.handoff();
      yield { type: "done", cached: "exact" };
      return;
    }

    /*
     * 2. Embed once, in one call, for two different jobs.
     *
     * Retrieval wants the question as asked, because every word of it is signal about which pages to
     * pull. The semantic cache wants the normalised form, and getting that wrong was returning wrong
     * answers: it embedded the raw string, where shared surface (capitals, the company name, the
     * question mark) dominates short questions. Measured against the live cache, "Who founded Nexoris
     * Technologies?" scored 0.885 against the stored answer to "What services does Nexoris
     * Technologies offer?", cleared the 0.88 threshold, and a visitor asking who founded the company
     * was told what it sells. The same pair on normalised text scores 0.834, and is correctly a miss.
     *
     * Both vectors come from a single batch, so this costs one round trip, exactly as before.
     */
    const normalised = normaliseQuery(trimmed);
    let queryVector: number[] | undefined;
    let cacheVector: number[] | undefined;
    try {
      const { vectors } = await embedBatch([trimmed, normalised], this.env);
      queryVector = vectors[0];
      cacheVector = vectors[1];
    } catch {
      queryVector = undefined;
      cacheVector = undefined;
    }

    if (cacheVector) {
      const semantic = await this.semanticCache.find(
        cacheVector,
        kbVersion,
        // The override existed, was documented, and was never passed, so the tuning knob for the one
        // setting that decides whether a cached answer is reused did nothing.
        semanticThreshold(this.env),
      );
      if (semantic) {
        yield { type: "meta", retrieval: "semantic-cache" };
        yield { type: "sources", sources: semantic.sources };
        yield* this.streamText(semantic.answer);
        if (this.isDecline(semantic.answer)) yield this.handoff();
        yield { type: "done", cached: "semantic" };
        return;
      }
    }

    // 3. Hybrid retrieval.
    const { chunks, usedKeyword } = await retrieve(
      this.pool,
      this.env,
      trimmed,
      queryVector ? { queryVector } : {},
    );
    if (chunks.length === 0) {
      yield { type: "meta", retrieval: "none" };
      yield* this.streamText(
        "I do not have that detail yet. If you tell me a little more about what you need, I can point you to the right part of Nexoris Technologies or connect you with the team.",
      );
      yield this.handoff();
      yield { type: "done" };
      return;
    }

    const sources = this.dedupeSources(chunks);
    yield { type: "meta", retrieval: usedKeyword ? "hybrid" : "vector-only" };
    yield { type: "sources", sources };

    /*
     * 4. Grounded generation across the website-bot chain, streamed.
     *
     * The answer used to be generated in full and then replayed word by word, which made the
     * visitor watch typing dots for as long as the model took: measured at 8.5 seconds of silence
     * followed by the whole reply in one burst. The tokens now pass straight through.
     */
    let emitted = false;
    try {
      const stream = generateGroundedStream(WEBSITE_BOT_MODELS, this.env, {
        system: buildSystemPrompt(chunks),
        user: trimmed,
        ...(ctx.history ? { history: ctx.history } : {}),
      });

      /*
       * Streamed a sentence at a time so every figure can be checked against the pages the answer
       * was grounded in before the visitor reads it. A sentence carrying a price, percentage or
       * amount that appears nowhere in the context is dropped rather than shown: the prompt has
       * been told four different ways not to invent one and still produced "such as 99.5%, 99.9%"
       * for an uptime guarantee we do not publish. Holding one sentence back costs a fraction of a
       * second; the alternative is a number a customer could quote back to us.
       */
      const context = chunks.map((c) => c.content).join("\n");
      const sentences = new SentenceStream();
      let answer = "";
      /*
       * Whether this answer should end by offering a person.
       *
       * Two ways it becomes true, and both mean the same thing to the visitor: the assistant did not
       * answer the question. The model says so with CONNECT_MARKER, and the figure guard says so by
       * having had to drop a sentence, which means the reply was drifting into invention whatever it
       * looked like. Before this, a decline ended the conversation: the handoff was only ever offered
       * when generation failed outright, so being told "I do not have that detail" left the visitor
       * with nowhere to go, on the page whose job is to get them talking to us.
       */
      let connect = false;
      const emit = function* (this: void, raw: string): Generator<ChatEvent> {
        let text = raw;
        if (text.includes(CONNECT_MARKER)) {
          connect = true;
          text = text.replaceAll(CONNECT_MARKER, "");
        }
        text = stripDecoration(text);
        if (text.length === 0) return;
        /*
         * A piece that is only whitespace is a paragraph break, and it has to survive.
         *
         * The sentence splitter emits the blank line between two sentences as its own piece, and the
         * guard here used to drop anything whose trimmed length was zero. That deleted every
         * paragraph break in every answer, so sentences arrived welded together: "what your project
         * needs.To help me understand". Nothing to check for invented figures in whitespace either,
         * so the check below is skipped rather than run against it.
         */
        if (text.trim().length === 0) {
          answer += text;
          yield { type: "token", text };
          return;
        }
        const invented = unsupportedFigures(text, context);
        if (invented.length > 0) {
          console.warn(
            `[oge] dropped a sentence citing figures absent from the retrieved context: ${invented.join(", ")}`,
          );
          connect = true;
          return;
        }
        answer += text;
        yield { type: "token", text };
      };

      let next = await stream.next();
      while (!next.done) {
        for (const sentence of sentences.push(next.value)) {
          for (const event of emit(sentence)) {
            emitted = true;
            yield event;
          }
        }
        next = await stream.next();
      }
      for (const event of emit(sentences.flush())) {
        emitted = true;
        yield event;
      }
      // A person, when the assistant could not answer. The widget turns this into the WhatsApp button
      // and "Share your details instead", which opens the contact form inside the chat and files the
      // lead with Oge as its source.
      //
      // The marker is the signal and the wording is the backstop, because the model does not always
      // remember to emit one. Asked when we were established it answered "We do not publish the year
      // we were established. If you would like to know, I can put you in touch with the team." and
      // sent no marker, so the one reply that explicitly offered a person was the one that did not
      // produce the button to reach them.
      if (connect || this.isDecline(answer)) yield this.handoff();

      // What was actually shown, not what the model produced: caching the unfiltered answer would
      // serve the dropped sentences, the decoration and the marker back to the next visitor.
      await this.exactCache.set(trimmed, kbVersion, answer, sources);
      if (cacheVector) {
        await this.semanticCache.add(
          cacheVector,
          normalised,
          kbVersion,
          answer,
          sources,
        );
      }
      yield { type: "done" };
    } catch {
      // 5. Extractive fallback with handoff (PRD 10.2): never a stack trace to the UI.
      if (emitted) {
        // Part of an answer is already on screen. Restating the preamble and then quoting a page
        // would read as the assistant talking over itself, so this just closes what was said and
        // offers the team.
        yield { type: "token", text: "\n\n" };
        yield* this.streamText(
          "That is as far as I can take this one. The team can pick it up from here.",
        );
      } else {
        const top = chunks[0] as RetrievedChunk;
        const quote = top.content.replace(/\s+/g, " ").slice(0, 400);
        yield* this.streamText(
          `${FALLBACK_PREAMBLE}\n\nFrom ${top.title}: ${quote}`,
        );
      }
      yield this.handoff();
      yield { type: "done", fallback: true };
    }
  }

  private *streamText(text: string): Generator<ChatEvent> {
    for (const piece of text.split(/(\s+)/)) {
      if (piece.length > 0) yield { type: "token", text: piece };
    }
  }

  private dedupeSources(chunks: readonly RetrievedChunk[]): Source[] {
    const seen = new Map<string, Source>();
    for (const c of chunks) {
      if (!seen.has(c.url)) seen.set(c.url, { url: c.url, title: c.title });
    }
    return [...seen.values()];
  }

  /**
   * Whether a stored answer was a decline.
   *
   * The marker is stripped before an answer is cached, so this reads the shape of what was said. It
   * is only ever used to decide whether to *offer* a person, so a false positive costs an extra
   * button and a false negative costs what the situation already was.
   */
  private isDecline(answer: string): boolean {
    return /\b(do not|don't) (have|publish)\b|\bnot something we publish\b/i.test(answer);
  }

  private handoff(): ChatEvent {
    return {
      type: "handoff",
      message:
        "You can reach the Nexoris Technologies team on WhatsApp, through the contact page, or by email.",
      whatsapp: WHATSAPP_HREF,
      contactUrl: CONTACT_URL,
      email: BUSINESS_EMAIL,
    };
  }

  private limitMessage(reason: DenyReason | undefined): string {
    if (reason === "input-too-long") {
      return "That message is quite long. Could you shorten it to the key question so I can help?";
    }
    return "You have sent several messages in a short time. Please wait a moment and try again, or reach the team on WhatsApp or the contact page.";
  }
}
