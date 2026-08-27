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
import { SemanticCache } from "../cache/semantic-cache.js";
import { normaliseQuery } from "../cache/normalise.js";
import { QuotaGovernor, type DenyReason } from "../quota/governor.js";
import { embedBatch } from "../providers/embeddings.js";
import { generateGrounded } from "../providers/generation.js";
import { retrieve, type RetrievedChunk } from "../retrieval/retrieve.js";
import { buildSystemPrompt, PROMPT_VERSION } from "./prompt.js";
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
      yield { type: "done", cached: "exact" };
      return;
    }

    // 2. Embed once, for the semantic cache and retrieval.
    let queryVector: number[] | undefined;
    try {
      const { vectors } = await embedBatch([trimmed], this.env);
      queryVector = vectors[0];
    } catch {
      queryVector = undefined;
    }

    if (queryVector) {
      const semantic = await this.semanticCache.find(queryVector, kbVersion);
      if (semantic) {
        yield { type: "meta", retrieval: "semantic-cache" };
        yield { type: "sources", sources: semantic.sources };
        yield* this.streamText(semantic.answer);
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

    // 4. Grounded generation across the website-bot chain.
    try {
      const { value: answer } = await generateGrounded(
        WEBSITE_BOT_MODELS,
        this.env,
        {
          system: buildSystemPrompt(chunks),
          user: trimmed,
          ...(ctx.history ? { history: ctx.history } : {}),
        },
      );
      yield* this.streamText(answer);
      await this.exactCache.set(trimmed, kbVersion, answer, sources);
      if (queryVector) {
        await this.semanticCache.add(
          queryVector,
          normaliseQuery(trimmed),
          kbVersion,
          answer,
          sources,
        );
      }
      yield { type: "done" };
    } catch {
      // 5. Extractive fallback with handoff (PRD 10.2): never a stack trace to the UI.
      const top = chunks[0] as RetrievedChunk;
      const quote = top.content.replace(/\s+/g, " ").slice(0, 400);
      yield* this.streamText(
        `${FALLBACK_PREAMBLE}\n\nFrom ${top.title}: ${quote}`,
      );
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
