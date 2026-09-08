/**
 * Moving a job application through its stages.
 *
 * The application screen carried a "Move to Reviewed" button and a "More actions" button, neither of
 * which had a handler, so an application could be read and never acted on. These are the stage changes
 * the screen already displays.
 *
 * The stage is validated against the same set the screen renders, so an unknown value cannot be written
 * and then shown as an unstyled blank.
 */
import type { NextRequest } from "next/server";
import { getCmsStaffFor } from "../../../../lib/auth.js";
import { cmsDb } from "../../../../lib/cms-db.js";
import { seeOtherAt, pathBuilder } from "../../../../lib/redirect.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The stages an application can be in. Kept in step with the STAGE map the screens render. */
export const APPLICATION_STAGES = ["new", "reviewed", "interviewed", "rejected"] as const;

const safeBack = (raw: string): string => (raw.startsWith("/") && !raw.startsWith("//") ? raw : "/cms/applications");

export async function POST(request: NextRequest): Promise<Response> {
  const f = await request.formData();
  const back = pathBuilder(safeBack(String(f.get("back") ?? "/cms/applications")));

  // Deciding on a candidate is a review decision, which is what that capability is for.
  const staff = await getCmsStaffFor("review.decide");
  if (!staff) {
    back.searchParams.set("denied", "1");
    return seeOtherAt(back);
  }

  const id = String(f.get("id") ?? "").trim();
  const stage = String(f.get("stage") ?? "").trim();
  if (!id || !(APPLICATION_STAGES as readonly string[]).includes(stage)) {
    back.searchParams.set("error", "1");
    return seeOtherAt(back);
  }

  const { rowCount } = await cmsDb().query(
    "UPDATE cms_content SET application_stage = $2, updated_at = now() WHERE id = $1 AND kind = 'application'",
    [id, stage],
  );
  if ((rowCount ?? 0) > 0) {
    await cmsDb().query(
      `INSERT INTO cms_activity (actor_name, action, subject, category, status)
       VALUES ($1, $2, $3, 'careers', 'done')`,
      [staff.name, `moved an application to ${stage}`, id],
    ).catch(() => undefined);
  }
  back.searchParams.set("moved", stage);
  return seeOtherAt(back);
}
