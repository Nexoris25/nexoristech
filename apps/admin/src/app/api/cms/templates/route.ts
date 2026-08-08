/**
 * Create or update a programmatic SEO template (nexoris_cms). CMS access only. Sections and variables are
 * JSON arrays. On success it returns to the templates list.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cmsDb } from "../../../../lib/cms-db.js";
import { getCmsStaff } from "../../../../lib/auth.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const jsonOr = (v: FormDataEntryValue | null, fallback: string): string => { try { const s = String(v ?? ""); JSON.parse(s); return s || fallback; } catch { return fallback; } };

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCmsStaff();
  if (!staff) return NextResponse.redirect(new URL("/cms/templates", request.url), { status: 303 });
  const f = await request.formData();
  const id = String(f.get("id") ?? "").trim();
  const name = String(f.get("name") ?? "").trim();
  if (!name) return NextResponse.redirect(new URL(`${id ? `/cms/templates/${id}` : "/cms/templates/new"}?error=name`, request.url), { status: 303 });

  const type = String(f.get("type") ?? "Landing Page").trim() || "Landing Page";
  const description = String(f.get("description") ?? "").trim() || null;
  const sections = jsonOr(f.get("sections"), "[]");
  const variables = jsonOr(f.get("variables"), "[]");
  const active = f.get("active") != null;
  const inProposals = f.get("in_proposals") != null;
  const pool = cmsDb();

  if (id) {
    await pool.query(
      "UPDATE cms_template SET name=$1, type=$2, description=$3, sections=$4::jsonb, variables=$5::jsonb, active=$6, in_proposals=$7, updated_at=now() WHERE id=$8",
      [name, type, description, sections, variables, active, inProposals, id]);
  } else {
    await pool.query(
      "INSERT INTO cms_template (name, type, description, sections, variables, active, in_proposals) VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6,$7)",
      [name, type, description, sections, variables, active, inProposals]);
  }
  return NextResponse.redirect(new URL("/cms/templates", request.url), { status: 303 });
}
