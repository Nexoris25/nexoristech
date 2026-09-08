/** Add a department (PRD 7.2). A simple, expandable list. HR Admin only. */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { getStaffFor } from "../../../../lib/auth.js";
import { seeOther } from "../../../../lib/redirect.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getStaffFor("hr.settings");
  if (!staff) return NextResponse.json({ ok: false }, { status: 403 });
  const f = await request.formData();
  const name = String(f.get("name") ?? "").trim();
  if (staff && staff.role === "admin" && name) {
    await db().query(
      "INSERT INTO hr_department (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING",
      [name, String(f.get("description") ?? "").trim() || null],
    );
  }
  return seeOther("/people/departments");
}
