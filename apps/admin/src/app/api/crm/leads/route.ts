/**
 * Create a lead from the Create Lead form (Batch 3, screen 3). Inserts the record and auto-computes
 * a baseline score and band from what was provided (completeness plus source), matching the form's
 * "auto calculated" score field; Oge re-scores richer leads later. Redirects to the new lead.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "../../../../lib/db.js";
import { getStaffFor } from "../../../../lib/auth.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getStaffFor("crm.write");
  if (!staff || staff.role === "viewer") {
    return NextResponse.redirect(new URL("/crm", request.url), { status: 303 });
  }

  const form = await request.formData();
  const name = str(form.get("name"));
  const email = str(form.get("email"));
  if (!name || !email) {
    return NextResponse.redirect(new URL("/crm/create?error=1", request.url), { status: 303 });
  }
  const dial = str(form.get("dialCode"));
  const phoneRaw = str(form.get("phone"));
  const phone = phoneRaw ? `${dial} ${phoneRaw}`.trim() : null;
  const company = str(form.get("company")) || null;
  const jobTitle = str(form.get("jobTitle"));
  const budget = str(form.get("budget"));
  const potential = str(form.get("potentialValue"));
  const source = str(form.get("source")) || "referral";
  const industry = str(form.get("industry"));
  const notes = str(form.get("notes")) || null;
  const status = str(form.get("status")) || "New";
  const owner = str(form.get("owner")) || null;

  // Baseline score from completeness and source (Oge refines it later).
  let score = 40;
  if (email) score += 8;
  if (phone) score += 8;
  if (company) score += 10;
  if (jobTitle) score += 10;
  if (budget || potential) score += 12;
  if (source === "referral") score += 12;
  else if (source === "solution-finder" || source === "oge-chat") score += 8;
  score = Math.min(100, score);
  const band = score >= 70 ? "Hot" : score >= 45 ? "Warm" : "Cold";

  const finder = industry ? JSON.stringify({ industry, role: jobTitle || null }) : null;

  const { rows } = await db().query<{ id: string }>(
    `INSERT INTO lead (source, name, email, phone, company, message, finder, score, band,
                       justification, scored_by, status, assigned_to)
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,'rules',$11,$12)
     RETURNING id`,
    [source, name, email, phone, company, notes, finder, score, band,
      "Baseline score from the details provided; Oge refines it as the lead engages.", status, owner],
  );

  return NextResponse.redirect(new URL(`/crm/${rows[0]!.id}`, request.url), { status: 303 });
}
