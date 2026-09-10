/**
 * Create or update a URL redirect (nexoris_cms). CMS access only.
 *
 * Everything the form collects is stored now. It used to write five columns and drop the rest on the
 * floor: Expiry Date, Case Sensitivity, Slash Handling and Match Pattern — including RegEx — were all
 * posted by the form and silently discarded, so a rule saved as a pattern behaved as an exact match
 * and an expiry date expired nothing.
 *
 * The values are also validated rather than trimmed and trusted. A source is reduced to a path so a
 * pasted full URL works, repeated leading slashes collapse, and a pattern must compile. A rule that
 * cannot match is worse than a rejected one: it sits in the list looking Active.
 */
import type { NextRequest } from "next/server";
import { cmsDb } from "../../../../lib/cms-db.js";
import { getCmsStaff } from "../../../../lib/auth.js";
import { seeOtherAt, pathBuilder } from "../../../../lib/redirect.js";
import { parseRedirectForm } from "../../../../lib/redirect-rules.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCmsStaff();
  if (!staff) return seeOtherAt(pathBuilder("/cms/seo/redirects"));

  const f = await request.formData();
  const id = String(f.get("id") ?? "").trim();
  const { input, error } = parseRedirectForm((name) => f.get(name));

  if (!input) {
    // Back to the form the editor was on, with the reason, rather than a silent no-op.
    const back = pathBuilder(id ? `/cms/seo/redirects/${id}` : "/cms/seo/redirects/new");
    back.searchParams.set("error", error ?? "That redirect could not be saved.");
    return seeOtherAt(back);
  }

  const pool = cmsDb();
  const values = [
    input.oldUrl, input.newUrl || null, input.type, input.status, input.notes,
    input.pattern, input.caseSensitivity, input.slashHandling, input.expiryDate,
    input.startDate, input.sourceHost,
  ];

  if (id) {
    await pool.query(
      `UPDATE cms_redirect
          SET old_url=$1, new_url=$2, type=$3, status=$4, notes=$5,
              pattern=$6, case_sensitivity=$7, slash_handling=$8, expiry_date=$9,
              start_date=$10, source_host=$11
        WHERE id=$12`,
      [...values, id]);
  } else {
    await pool.query(
      `INSERT INTO cms_redirect
         (old_url, new_url, type, status, notes, pattern, case_sensitivity, slash_handling,
          expiry_date, start_date, source_host)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      values);
  }

  const back = pathBuilder("/cms/seo/redirects");
  back.searchParams.set("saved", "1");
  return seeOtherAt(back);
}
