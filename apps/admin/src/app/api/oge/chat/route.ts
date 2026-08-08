/**
 * The admin Oge chat endpoint. Answers a question grounded in the asker's live data, scoped to their
 * role and module grants (§3.2) - Oge never answers about a module the user cannot see. Session-gated;
 * reads the same module_access the shell uses. JSON in, JSON out.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { getCurrentStaff } from "../../../../lib/auth.js";
import { askOge } from "../../../../lib/oge-assistant.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  let message = "";
  try {
    const body = (await request.json()) as { message?: unknown };
    message = typeof body.message === "string" ? body.message.slice(0, 500) : "";
  } catch { /* empty body */ }

  const access = staff.role === "admin"
    ? ["crm", "finance", "hr", "payroll"]
    : (await db().query<{ module: string }>("SELECT DISTINCT module FROM module_access WHERE staff_id=$1", [staff.id])).rows.map((r) => r.module);

  const answer = await askOge(message, { staff, access });
  return NextResponse.json(answer);
}
