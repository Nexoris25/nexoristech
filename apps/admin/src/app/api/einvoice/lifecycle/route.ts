/**
 * Advance the commercial invoice lifecycle (Draft -> Pending Approval -> Ready to Send -> Sent to
 * Customer -> Viewed -> Closed). This is the Nexoris-internal workflow only; it never touches the NRS
 * compliance status or the payment status. Admin/Finance only.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { getFiscalStaff } from "../../../../lib/fiscal/permissions.js";
import { LIFECYCLE_NEXT } from "../../../../lib/einvoice.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getFiscalStaff("INVOICE_CREATE");
  const f = await request.formData();
  const id = String(f.get("id") ?? "");
  const back = new URL(`/e-invoicing/doc/${id || ""}`, request.url);
  if (!staff || !id) return NextResponse.redirect(back, { status: 303 });

  const action = String(f.get("action") ?? "advance");
  const pool = db();
  const cur = (await pool.query<{ lifecycle_status: string }>("SELECT lifecycle_status FROM einvoice WHERE id=$1", [id])).rows[0];
  if (!cur) return NextResponse.redirect(back, { status: 303 });
  // Finalize takes a Draft straight to Ready to Send, making it eligible for NRS submission.
  const next = action === "finalize"
    ? (cur.lifecycle_status === "Draft" ? "ReadyToSend" : undefined)
    : LIFECYCLE_NEXT[cur.lifecycle_status];
  if (!next) return NextResponse.redirect(back, { status: 303 });

  await pool.query("UPDATE einvoice SET lifecycle_status=$1, updated_at=now() WHERE id=$2", [next, id]);
  await pool.query(
    "INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after) VALUES ($1,'einvoice-lifecycle','einvoice',$2,$3::jsonb,$4::jsonb)",
    [staff.id, id, JSON.stringify({ lifecycle_status: cur.lifecycle_status }), JSON.stringify({ lifecycle_status: next })]).catch(() => undefined);

  return NextResponse.redirect(back, { status: 303 });
}
