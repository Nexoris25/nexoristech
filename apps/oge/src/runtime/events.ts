/**
 * The server-sent event shapes the chat endpoint streams to the browser, and the per-request
 * context the service needs. No error codes or technical detail ever reach the visitor (PRD 10.2):
 * a failure becomes a plain notice or the extractive handoff.
 */
import type { Source } from "../db.js";
import type { ChatMessage } from "../providers/generation.js";

/** How the answer was sourced, for the UI and diagnostics. */
export type RetrievalKind =
  | "exact-cache"
  | "semantic-cache"
  | "hybrid"
  | "vector-only"
  | "none";

export type ChatEvent =
  | { type: "meta"; retrieval: RetrievalKind }
  | { type: "sources"; sources: Source[] }
  | { type: "token"; text: string }
  | {
      type: "handoff";
      message: string;
      whatsapp: string;
      contactUrl: string;
      email: string;
    }
  | { type: "notice"; message: string }
  | { type: "done"; cached?: "exact" | "semantic"; fallback?: boolean };

export interface ChatContext {
  readonly sessionId: string;
  readonly ip: string;
  readonly history?: readonly ChatMessage[];
}
