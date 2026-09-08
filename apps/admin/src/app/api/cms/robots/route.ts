/**
 * Save the site robots.txt (nexoris_cms, cms_setting scope='robots'). CMS access only. On success it
 * returns to the robots editor.
 */
import type { NextRequest } from "next/server";
import { cmsDb } from "../../../../lib/cms-db.js";
import { getCmsStaff } from "../../../../lib/auth.js";
import { seeOther } from "../../../../lib/redirect.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCmsStaff();
  if (!staff) return seeOther("/cms/seo/robots");
  const f = await request.formData();
  const content = String(f.get("content") ?? "");
  await cmsDb().query(
    `INSERT INTO cms_setting (scope, data, updated_by, updated_at) VALUES ('robots', $1::jsonb, $2, now())
     ON CONFLICT (scope) DO UPDATE SET data = EXCLUDED.data, updated_by = EXCLUDED.updated_by, updated_at = now()`,
    [JSON.stringify({ content }), staff.name]);
  return seeOther("/cms/seo/robots");
}
