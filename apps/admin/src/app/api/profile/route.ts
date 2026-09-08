/**
 * Saving your own profile: the display name, and the contact details on your employee record.
 *
 * A route handler posted to natively, matching sign-in and session revocation, so it survives the
 * Origin:null case behind a proxy and works without client hydration.
 *
 * It writes only the row belonging to the signed-in person. Role, salary, department and employment
 * status are not writable here: those are decisions made about you, not by you, and belong to HR.
 */
import type { NextRequest } from "next/server";
import { getCurrentStaff } from "../../../lib/auth.js";
import { db } from "../../../lib/db.js";
import { seeOther, seeOtherAt, pathBuilder } from "../../../lib/redirect.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Trim to a value or null, so an emptied field clears rather than storing "". */
function value(form: FormData, key: string): string | null {
  const raw = String(form.get(key) ?? "").trim();
  return raw === "" ? null : raw;
}

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCurrentStaff();
  if (!staff) return seeOther("/login");

  const form = await request.formData();
  const name = value(form, "name");
  const back = pathBuilder("/complete-profile");

  if (!name) {
    back.searchParams.set("error", "name");
    return seeOtherAt(back);
  }

  await db().query("UPDATE staff SET name = $2 WHERE id = $1", [staff.id, name]);
  // The employee record is optional: not every staff account has been onboarded into HR yet, and a
  // person without one should still be able to correct their name.
  await db().query(
    `UPDATE employee
        SET full_name = COALESCE($2, full_name), phone = $3, personal_email = $4, address = $5,
            nok_name = $6, nok_relationship = $7, nok_phone = $8, updated_at = now()
      WHERE staff_id = $1`,
    [staff.id, name, value(form, "phone"), value(form, "personal_email"), value(form, "address"),
     value(form, "nok_name"), value(form, "nok_relationship"), value(form, "nok_phone")],
  );

  back.searchParams.set("saved", "1");
  return seeOtherAt(back);
}
