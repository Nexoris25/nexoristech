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
import { STAGES, type StageState, type DraftState } from "./crm-constants.js";

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

  if (!leadId || !(STAGES as readonly string[]).includes(status)) {
    return { error: "Choose a valid stage." };
  }
  if (status === "Lost" && !lostReason) {
    return { error: "A lost lead needs a reason." };
  }
  if (status === "Nurture" && !nurtureDate) {
    return { error: "Nurture needs a revival date." };
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

  revalidatePath(`/crm/${leadId}`);
  revalidatePath("/crm");
  return { ok: true };
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
