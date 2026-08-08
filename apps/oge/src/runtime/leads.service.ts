/**
 * Lead intake (PRD 11). Receives a lead from any of the three website paths, scores it on arrival
 * via the CRM Worker (with the immediate rules baseline as fallback), and stores it with its full
 * context in the nexoris_admin lead table. The score and justification are kept for the CRM and are
 * never returned to the browser; the visitor gets only a warm acknowledgement.
 */
import {
  Injectable,
  BadRequestException,
  type OnModuleInit,
  type OnModuleDestroy,
} from "@nestjs/common";
import pg from "pg";
import { scoreLead } from "../crm/score-lead.js";
import type { LeadInput, LeadSource } from "../crm/lead.js";
import type { Env } from "../config/models.js";

const { Pool } = pg;

const SOURCES = new Set<LeadSource>([
  "contact-form",
  "oge-chat",
  "solution-finder",
  "whatsapp",
  "email",
  "referral",
]);

export interface LeadAck {
  readonly id: string;
  readonly acknowledgement: string;
}

@Injectable()
export class LeadsService implements OnModuleInit, OnModuleDestroy {
  private pool!: pg.Pool;
  private readonly env: Env = process.env;

  onModuleInit(): void {
    const connectionString = process.env.DATABASE_URL_ADMIN;
    if (!connectionString) {
      throw new Error("DATABASE_URL_ADMIN is not set.");
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
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
  }

  private validate(input: unknown): LeadInput {
    const lead = (input ?? {}) as Record<string, unknown>;
    if (
      typeof lead.source !== "string" ||
      !SOURCES.has(lead.source as LeadSource)
    ) {
      throw new BadRequestException("Unknown or missing lead source.");
    }
    const hasContact =
      typeof lead.email === "string" || typeof lead.phone === "string";
    const hasMessage =
      typeof lead.message === "string" && lead.message.trim().length > 0;
    if (!hasContact && !hasMessage) {
      throw new BadRequestException(
        "A lead needs a contact detail or a message.",
      );
    }
    return lead as unknown as LeadInput;
  }

  async recordLead(input: unknown): Promise<LeadAck> {
    const lead = this.validate(input);
    const score = await scoreLead(lead, this.env);

    const { rows } = await this.pool.query<{ id: string }>(
      `INSERT INTO lead
         (source, page, utm, name, email, phone, company, message, finder,
          score, band, justification, scored_by)
       VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, $9::jsonb, $10, $11, $12, $13)
       RETURNING id`,
      [
        lead.source,
        lead.page ?? null,
        JSON.stringify(lead.utm ?? {}),
        lead.name ?? null,
        lead.email ?? null,
        lead.phone ?? null,
        lead.company ?? null,
        lead.message ?? null,
        lead.finder ? JSON.stringify(lead.finder) : null,
        score.score,
        score.band,
        score.justification,
        score.scoredBy,
      ],
    );

    const firstName = (lead.name ?? "").trim().split(/\s+/)[0] || "there";
    return {
      id: rows[0]?.id ?? "",
      acknowledgement: `Thank you, ${firstName}. We have your message and someone from Nexoris Technologies will reply within one business day.`,
    };
  }
}
