/**
 * The lead contract (PRD 11): what every lead carries from the website to the CRM, regardless of
 * which of the three paths created it (the Contact form, Oge chat capture, or the Solution Finder).
 * Scoring and storage build on this shape.
 */
import type { FinderAnswers, PageRef } from "@nexoris/recommend";

export type LeadSource =
  | "contact-form"
  | "oge-chat"
  | "solution-finder"
  | "whatsapp"
  | "email"
  | "referral";

export type Band = "Hot" | "Warm" | "Cold";

/** The Solution Finder context attached to a lead, when it came through the finder. */
export interface LeadFinderContext extends Partial<FinderAnswers> {
  /** The pages the finder recommended, for service tagging and the salesperson's context. */
  recommendation?: PageRef[];
}

/** One turn of a chat, kept apart from the other so each side can be told from the other. */
export interface LeadTurn {
  readonly role: "visitor" | "oge";
  readonly text: string;
}

export interface LeadInput {
  readonly source: LeadSource;
  /** The originating page path, including which programmatic or cost page, so revenue is traceable. */
  readonly page?: string;
  readonly utm?: Record<string, string>;
  readonly name?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly company?: string;
  /** The full message or the chat transcript. */
  readonly message?: string;
  /** What the topic dropdown said, when the lead came through Oge chat. */
  readonly topic?: string;
  /**
   * The conversation that produced the lead, turn by turn. Sent structured rather than as one
   * string so that scoring can tell what the visitor said from what Oge said: they are not
   * equivalent evidence, and treating them as one block scores our own sales copy as if the
   * visitor had written it.
   */
  readonly transcript?: readonly LeadTurn[];
  readonly finder?: LeadFinderContext;
}

/**
 * What the visitor themselves said, which is the only part of a chat that shows their intent.
 *
 * A conversation is the lead's message, and it is stored and scored as one. But the length of that
 * message and the words in it must be weighed against the visitor's turns alone. Oge answers at
 * length and in the confident register of our own marketing, so a chat where somebody typed "hi"
 * twice carries several hundred words of ours. Measured whole, that reads as a detailed brief from
 * a decision maker, and scores like one.
 */
export function visitorWords(lead: LeadInput): string {
  const turns = lead.transcript;
  if (!turns || turns.length === 0) return lead.message ?? "";
  return turns
    .filter((turn) => turn.role === "visitor")
    .map((turn) => turn.text.trim())
    .filter((text) => text.length > 0)
    .join("\n");
}

/** Enough turns and characters for any real sales conversation, and a bound on a hostile one. */
const MAX_TURNS = 60;
const MAX_TURN_CHARS = 4000;

/**
 * The conversation, cleaned up. Anything the browser sends is untrusted, so a turn survives only if
 * it has a role we know and text we can use, and the whole is capped: a long chat is still a lead,
 * but it is not a reason to accept an unbounded body or to pay to score one.
 */
export function normaliseTranscript(value: unknown): LeadTurn[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const turns: LeadTurn[] = [];
  for (const entry of value.slice(-MAX_TURNS)) {
    const turn = (entry ?? {}) as Record<string, unknown>;
    if (turn.role !== "visitor" && turn.role !== "oge") continue;
    if (typeof turn.text !== "string") continue;
    const text = turn.text.trim().slice(0, MAX_TURN_CHARS);
    if (text.length === 0) continue;
    turns.push({ role: turn.role, text });
  }
  return turns.length > 0 ? turns : undefined;
}

/** The conversation written out for the salesperson to read, and stored as the lead's message. */
export function renderTranscript(
  turns: readonly LeadTurn[],
  visitorName?: string,
): string {
  const visitor = (visitorName ?? "").trim().split(/\s+/)[0] || "Visitor";
  return turns
    .map((turn) => turn.text.trim())
    .map((text, i) => ({ text, role: turns[i]!.role }))
    .filter((turn) => turn.text.length > 0)
    .map((turn) => `${turn.role === "visitor" ? visitor : "Oge"}: ${turn.text}`)
    .join("\n\n");
}

export interface LeadScore {
  readonly score: number;
  readonly band: Band;
  readonly justification: string;
  /** Whether the score came from the model or the immediate rules-based baseline. */
  readonly scoredBy: "ai" | "rules";
}

/** Map a 1 to 100 score to its band. A low score never auto-rejects; it only orders the queue. */
export function bandForScore(score: number): Band {
  if (score >= 70) return "Hot";
  if (score >= 45) return "Warm";
  return "Cold";
}

/**
 * What the CRM stores and shows as the lead's message.
 *
 * Composed on the server rather than in the browser so that one place decides how a lead reads,
 * and so a caller cannot send a conversation that says one thing beside a message that says
 * another. A chat lead's message is the conversation; anything else keeps the message it came
 * with; and somebody who opened the form without asking Oge anything has still told us a topic,
 * which is better in the CRM than an empty message.
 */
export function composeLeadMessage(input: {
  transcript?: readonly LeadTurn[] | undefined;
  message?: string | undefined;
  topic?: string | undefined;
  name?: string | undefined;
}): string | undefined {
  const topic = (input.topic ?? "").trim();
  const topicLine = topic.length > 0 ? `Topic: ${topic}` : "";
  if (input.transcript && input.transcript.length > 0) {
    return [
      topicLine,
      "Captured by Oge during this conversation:",
      renderTranscript(input.transcript, input.name),
    ]
      .filter((part) => part.length > 0)
      .join("\n\n");
  }
  const message = (input.message ?? "").trim();
  if (message.length > 0) return input.message;
  return topicLine || undefined;
}
