/**
 * Buyer TIN directory (PRD 15). Add a buyer we bill, and record a TIN verification. No live NRS call
 * is made (§17), so "verify" records the check against the directory rather than performing it - the
 * screen is ready for the real lookup to be wired in later. Admin only.
 */
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { getFiscalStaff } from "../../../../lib/fiscal/permissions.js";
import { seeOther } from "../../../../lib/redirect.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getFiscalStaff("INVOICE_CREATE");
  const back = "/settings/e-invoicing/buyers";
  if (!staff) return seeOther(back);
  const f = await request.formData();
  const action = String(f.get("action") ?? "add");
  const pool = db();

  if (action === "verify") {
    const id = String(f.get("id") ?? "");
    if (id) {
      await pool.query("UPDATE nrs_buyer SET verified=true, last_checked=now() WHERE id=$1", [id]);
      await pool.query("INSERT INTO nrs_log (kind, summary, ok) VALUES ('request', 'TIN verification recorded for a buyer', true)");
    }
  } else {
    const name = String(f.get("name") ?? "").trim();
    if (name) {
      await pool.query(
        "INSERT INTO nrs_buyer (name, tin, created_by) VALUES ($1,$2,$3) ON CONFLICT (lower(name)) DO UPDATE SET tin=EXCLUDED.tin",
        [name, String(f.get("tin") ?? "").trim() || null, staff.id]);
    }
  }
  return seeOther("/settings/e-invoicing/buyers?saved=1");
}
