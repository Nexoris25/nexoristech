/**
 * Save the global CMS settings (nexoris_cms, cms_setting scope='global'). CMS access only. Stores one JSON
 * blob. On success it returns to the settings page.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cmsDb } from "../../../../lib/cms-db.js";
import { getCmsStaffFor } from "../../../../lib/auth.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCmsStaffFor("settings.manage");
  if (!staff) return NextResponse.redirect(new URL("/cms/settings", request.url), { status: 303 });
  const f = await request.formData();
  let data = "{}";
  try { data = JSON.stringify(JSON.parse(String(f.get("data") ?? "{}"))); } catch { data = "{}"; }
  await cmsDb().query(
    `INSERT INTO cms_setting (scope, data, updated_by, updated_at) VALUES ('global', $1::jsonb, $2, now())
     ON CONFLICT (scope) DO UPDATE SET data = EXCLUDED.data, updated_by = EXCLUDED.updated_by, updated_at = now()`,
    [data, staff.name]);
  return NextResponse.redirect(new URL("/cms/settings", request.url), { status: 303 });
}
