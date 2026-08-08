/** Add a department (PRD 7.2). A simple, expandable list. HR Admin only. */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { getCurrentStaff } from "../../../../lib/auth.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCurrentStaff();
  const f = await request.formData();
  const name = String(f.get("name") ?? "").trim();
  if (staff && staff.role === "admin" && name) {
    await db().query(
      "INSERT INTO hr_department (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING",
      [name, String(f.get("description") ?? "").trim() || null],
    );
  }
  return NextResponse.redirect(new URL("/people/departments", request.url), { status: 303 });
}
