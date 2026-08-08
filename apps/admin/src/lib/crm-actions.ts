"use server";
/**
 * CRM mutations (PRD 2.2, 2.3). Moving a lead through the lifecycle writes the new stage plus an
 * immutable audit row (who, what, when, before and after) and a lead-activity entry. Lost requires
 * a reason from the controlled list; Nurture requires a revival date. Viewers cannot mutate.
 */
import { revalidatePath } from "next/cache";
import { db } from "./db.js";
import { requireStaff } from "./auth.js";
import { draftReply } from "./oge.js";
import { recommendationForLead } from "./lead-recommendation.js";
import { prepareFollowUp } from "./followup.js";
import {
  STAGES,
  ENGAGEMENT_TYPES,
  type StageState,
  type DraftState,
  type FollowUpState,
} from "./crm-constants.js";

const ENGAGEMENT_VALUES = new Set<string>(ENGAGEMENT_TYPES.map((e) => e.value));

const NO_FOLLOWUP_STAGES = new Set(["Won", "Lost"]);

/** Read the fields a follow-up draft needs, and the deterministic service match, for a lead. */
async function followUpContext(leadId: string): Promise<{
  name: string | null;
  company: string | null;
  message: string | null;
  matchedServices: string[];
  industry: string | null;
} | null> {
  const { rows } = await db().query<{
    name: string | null;
    company: string | null;
    message: string | null;
    finder: Record<string, unknown> | null;
  }>("SELECT name, company, message, finder FROM lead WHERE id = $1", [leadId]);
  const lead = rows[0];
  if (!lead) return null;
  const rec = recommendationForLead(lead.finder);
  return {
    name: lead.name,
    company: lead.company,
    message: lead.message,
    matchedServices: rec ? rec.services.map((s) => s.label) : [],
    industry: rec ? rec.industry.label : null,
  };
}

export async function updateLeadStage(
  _prev: StageState,
  formData: FormData,
): Promise<StageState> {
  const staff = await requireStaff();
  if (staff.role === "viewer") {
    return { error: "Viewers cannot change leads." };
  }

  const leadId = String(formData.get("leadId") ?? "");
  const status = String(formData.get("status") ?? "");
  const lostReason = String(formData.get("lostReason") ?? "").trim();
  const nurtureDate = String(formData.get("nurtureDate") ?? "").trim();

  // The Deal captured the moment a lead is marked Won (PRD 5.9): value, service line, engagement.
  const dealValue = Number.parseFloat(String(formData.get("dealValue") ?? ""));
  const serviceLine = String(formData.get("serviceLine") ?? "").trim();
  const engagementType = String(formData.get("engagementType") ?? "").trim();

  if (!leadId || !(STAGES as readonly string[]).includes(status)) {
    return { error: "Choose a valid stage." };
  }
  if (status === "Lost" && !lostReason) {
    return { error: "A lost lead needs a reason." };
  }
  if (status === "Nurture" && !nurtureDate) {
    return { error: "Nurture needs a revival date." };
  }
  if (status === "Won") {
    if (!Number.isFinite(dealValue) || dealValue <= 0) {
      return { error: "A won deal needs its value in naira." };
    }
    if (!serviceLine) return { error: "A won deal needs a service line." };
    if (!ENGAGEMENT_VALUES.has(engagementType)) {
      return { error: "Choose the engagement type for the deal." };
    }
  }

  const pool = db();
  const { rows } = await pool.query<{
    status: string;
    lost_reason: string | null;
    nurture_date: string | null;
  }>("SELECT status, lost_reason, nurture_date FROM lead WHERE id = $1", [
    leadId,
  ]);
  const current = rows[0];
  if (!current) return { error: "That lead no longer exists." };

  const nextLostReason = status === "Lost" ? lostReason : null;
  const nextNurtureDate = status === "Nurture" ? nurtureDate : null;

  await pool.query(
    "UPDATE lead SET status = $1, lost_reason = $2, nurture_date = $3 WHERE id = $4",
    [status, nextLostReason, nextNurtureDate, leadId],
  );

  // On Won, record the deal and stamp won_at. This is CRM's Sales Won Value and the source Finance
  // reads to open the Engagement; CRM's responsibility ends there (PRD 5.9). Nothing is invented.
  if (status === "Won") {
    await pool.query(
      `UPDATE lead SET deal_value = $1, service_line = $2, engagement_type = $3, won_at = now()
        WHERE id = $4`,
      [dealValue, serviceLine, engagementType, leadId],
    );
    await pool.query(
      `INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after)
       VALUES ($1, 'engagement-created', 'lead', $2, NULL, $3::jsonb)`,
      [
        staff.id,
        leadId,
        JSON.stringify({ dealValue, serviceLine, engagementType }),
      ],
    );
    await pool.query(
      `INSERT INTO lead_activity (lead_id, actor_id, type, note)
       VALUES ($1, $2, 'deal-won', $3)`,
      [
        leadId,
        staff.id,
        `Deal won: ${serviceLine}, ${engagementType}. Ready for the Finance Engagement.`,
      ],
    );
  }

  await pool.query(
    `INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after)
     VALUES ($1, 'stage-change', 'lead', $2, $3::jsonb, $4::jsonb)`,
    [
      staff.id,
      leadId,
      JSON.stringify({ status: current.status }),
      JSON.stringify({
        status,
        lostReason: nextLostReason,
        nurtureDate: nextNurtureDate,
      }),
    ],
  );

  await pool.query(
    `INSERT INTO lead_activity (lead_id, actor_id, type, note)
     VALUES ($1, $2, 'stage-change', $3)`,
    [leadId, staff.id, `Moved from ${current.status} to ${status}.`],
  );

  // When a lead advances, prepare a stage-aware follow-up and a recommended send-by date so the
  // salesperson is never left wondering what to send next or when. Won and Lost clear it.
  if (NO_FOLLOWUP_STAGES.has(status)) {
    await pool.query(
      `UPDATE lead SET followup_stage = NULL, followup_draft = NULL,
              followup_drafted_by = NULL, followup_due = NULL, followup_sent_at = NULL
        WHERE id = $1`,
      [leadId],
    );
  } else {
    const context = await followUpContext(leadId);
    if (context) {
      const followUp = await prepareFollowUp(status, context);
      await pool.query(
        `UPDATE lead SET followup_stage = $1, followup_draft = $2, followup_drafted_by = $3,
                followup_due = $4, followup_sent_at = NULL
          WHERE id = $5`,
        [
          status,
          followUp.draft,
          followUp.draftedBy,
          followUp.due.toISOString().slice(0, 10),
          leadId,
        ],
      );
    }
  }

  revalidatePath(`/crm/${leadId}`);
  revalidatePath("/crm");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Regenerate the current stage follow-up draft for a lead (PRD 5.9). */
export async function regenerateFollowUp(
  _prev: FollowUpState,
  formData: FormData,
): Promise<FollowUpState> {
  const staff = await requireStaff();
  if (staff.role === "viewer") return { error: "Viewers cannot change leads." };
  const leadId = String(formData.get("leadId") ?? "");
  if (!leadId) return { error: "Missing lead." };

  const { rows } = await db().query<{ status: string; followup_stage: string | null }>(
    "SELECT status, followup_stage FROM lead WHERE id = $1",
    [leadId],
  );
  const lead = rows[0];
  if (!lead) return { error: "That lead no longer exists." };
  const stage = lead.followup_stage ?? lead.status;
  if (NO_FOLLOWUP_STAGES.has(stage)) {
    return { error: "There is no follow-up to regenerate at this stage." };
  }

  const context = await followUpContext(leadId);
  if (!context) return { error: "That lead no longer exists." };
  const followUp = await prepareFollowUp(stage, context);
  await db().query(
    `UPDATE lead SET followup_stage = $1, followup_draft = $2, followup_drafted_by = $3,
            followup_due = $4, followup_sent_at = NULL
      WHERE id = $5`,
    [stage, followUp.draft, followUp.draftedBy, followUp.due.toISOString().slice(0, 10), leadId],
  );
  revalidatePath(`/crm/${leadId}`);
  return { ok: true, draft: followUp.draft, draftedBy: followUp.draftedBy };
}

/** Mark the current follow-up sent and log the contact, clearing it from the due list. */
export async function markFollowUpSent(formData: FormData): Promise<void> {
  const staff = await requireStaff();
  if (staff.role === "viewer") return;
  const leadId = String(formData.get("leadId") ?? "");
  if (!leadId) return;
  await db().query(
    "UPDATE lead SET followup_sent_at = now(), last_contacted_at = now() WHERE id = $1",
    [leadId],
  );
  await db().query(
    `INSERT INTO lead_activity (lead_id, actor_id, type, note)
     VALUES ($1, $2, 'follow-up-sent', 'Marked the stage follow-up as sent.')`,
    [leadId, staff.id],
  );
  revalidatePath(`/crm/${leadId}`);
  revalidatePath("/dashboard");
}

/**
 * Draft a reply for a lead via the Oge CRM Worker (PRD 3.2). Drafts only: the salesperson reviews
 * and sends. Grounds the draft in the lead's words and the deterministic service match.
 */
export async function draftLeadReply(
  _prev: DraftState,
  formData: FormData,
): Promise<DraftState> {
  const staff = await requireStaff();
  if (staff.role === "viewer") {
    return { error: "Viewers cannot draft replies." };
  }
  const leadId = String(formData.get("leadId") ?? "");
  if (!leadId) return { error: "Missing lead." };

  const { rows } = await db().query<{
    name: string | null;
    company: string | null;
    message: string | null;
    finder: Record<string, unknown> | null;
  }>("SELECT name, company, message, finder FROM lead WHERE id = $1", [leadId]);
  const lead = rows[0];
  if (!lead) return { error: "That lead no longer exists." };

  const rec = recommendationForLead(lead.finder);
  const matchedServices = rec ? rec.services.map((s) => s.label) : [];
  const message =
    (lead.message ?? "").trim() ||
    (matchedServices.length > 0
      ? `Interested in ${matchedServices.join(", ")}.`
      : "A new enquiry with limited detail.");

  const result = await draftReply({
    ...(lead.name ? { name: lead.name } : {}),
    ...(lead.company ? { company: lead.company } : {}),
    message,
    matchedServices,
    ...(rec ? { industry: rec.industry.label } : {}),
  });
  if (!result) {
    return { error: "Could not draft a reply right now. Please try again." };
  }
  return { draft: result.draft, draftedBy: result.draftedBy };
}
