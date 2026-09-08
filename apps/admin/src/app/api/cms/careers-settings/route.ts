/**
 * Save the careers module settings (nexoris_cms, cms_setting scope='careers'). CMS access only. Stores one
 * JSON blob. On success it returns to the careers settings page.
 */
import type { NextRequest } from "next/server";
import { cmsDb } from "../../../../lib/cms-db.js";
import { getCmsStaff } from "../../../../lib/auth.js";
import { seeOther } from "../../../../lib/redirect.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCmsStaff();
  if (!staff) return seeOther("/cms/careers/settings");
  const f = await request.formData();
  let data = "{}";
  try { data = JSON.stringify(JSON.parse(String(f.get("data") ?? "{}"))); } catch { data = "{}"; }
  await cmsDb().query(
    `INSERT INTO cms_setting (scope, data, updated_by, updated_at) VALUES ('careers', $1::jsonb, $2, now())
     ON CONFLICT (scope) DO UPDATE SET data = EXCLUDED.data, updated_by = EXCLUDED.updated_by, updated_at = now()`,
    [data, staff.name]);
  return seeOther("/cms/careers/settings");
}
