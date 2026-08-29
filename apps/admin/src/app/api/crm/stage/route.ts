/**
 * Move a lead to a new pipeline stage from the board (drag and drop). Handles the straightforward
 * stage moves and regenerates the stage-aware Oge follow-up. Won, Lost, and Nurture need extra input
 * (deal value, a reason, a revival date), so for those it returns { needsDetail: true } and the board
 * sends the user to the lead page to complete it there. Viewers cannot move leads. Every move is
 * logged to the one audit trail and the lead timeline.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "../../../../lib/db.js";
import { getStaffFor } from "../../../../lib/auth.js";
import { STAGES } from "../../../../lib/crm-constants.js";
import { recommendationForLead } from "../../../../lib/lead-recommendation.js";
import { prepareFollowUp } from "../../../../lib/followup.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NEEDS_DETAIL = new Set(["Won", "Lost", "Nurture"]);

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getStaffFor("crm.write");
  if (!staff || staff.role === "viewer") return NextResponse.json({ error: "You cannot move leads." }, { status: 403 });

  let leadId = "", status = "";
  try {
    const body = (await request.json()) as { leadId?: string; status?: string };
    leadId = String(body.leadId ?? "");
    status = String(body.status ?? "");
  } catch { /* bad body */ }

  if (!leadId || !(STAGES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: "Choose a valid stage." }, { status: 400 });
  }
  // These stages need extra data captured on the lead page.
  if (NEEDS_DETAIL.has(status)) return NextResponse.json({ needsDetail: true });

  const pool = db();
  const cur = (await pool.query<{ status: string; name: string | null; company: string | null; message: string | null; finder: Record<string, unknown> | null }>(
    "SELECT status, name, company, message, finder FROM lead WHERE id=$1", [leadId])).rows[0];
  if (!cur) return NextResponse.json({ error: "That lead no longer exists." }, { status: 404 });
  if (cur.status === status) return NextResponse.json({ ok: true, status });

  await pool.query("UPDATE lead SET status=$1, lost_reason=NULL, nurture_date=NULL WHERE id=$2", [status, leadId]);
  await pool.query(
    "INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after) VALUES ($1,'stage-change','lead',$2,$3::jsonb,$4::jsonb)",
    [staff.id, leadId, JSON.stringify({ status: cur.status }), JSON.stringify({ status })]).catch(() => undefined);
  await pool.query(
    "INSERT INTO lead_activity (lead_id, actor_id, type, note) VALUES ($1,$2,'stage-change',$3)",
    [leadId, staff.id, `Moved from ${cur.status} to ${status}.`]).catch(() => undefined);

  // Regenerate the Oge follow-up for the new stage (every stage here has one).
  const rec = recommendationForLead(cur.finder);
  const followUp = await prepareFollowUp(status, {
    name: cur.name, company: cur.company, message: cur.message,
    matchedServices: rec ? rec.services.map((s) => s.label) : [],
    industry: rec ? rec.industry.label : null,
  });
  await pool.query(
    `UPDATE lead SET followup_stage=$1, followup_draft=$2, followup_drafted_by=$3, followup_due=$4, followup_sent_at=NULL WHERE id=$5`,
    [status, followUp.draft, followUp.draftedBy, followUp.due.toISOString().slice(0, 10), leadId]);

  revalidatePath("/crm");
  revalidatePath("/crm/board");
  revalidatePath(`/crm/${leadId}`);
  revalidatePath("/dashboard");
  return NextResponse.json({ ok: true, status });
}
