/**
 * Turning programmatic page generation on and off.
 *
 * A native form post, so the switch works without client hydration and goes through the same capability
 * gate as the generator it controls: whoever may run generation may pause it, and nobody else.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCmsStaffFor } from "../../../../lib/auth.js";
import { setPseoEnabled } from "../../../../lib/pseo-settings.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const back = new URL("/cms/proposals", request.url);

  const staff = await getCmsStaffFor("seo.manage");
  if (!staff) {
    back.searchParams.set("denied", "1");
    return NextResponse.redirect(back, { status: 303 });
  }

  const f = await request.formData();
  const enabled = String(f.get("enabled") ?? "") === "1";
  await setPseoEnabled(enabled, staff.name);

  back.searchParams.set("generation", enabled ? "on" : "off");
  return NextResponse.redirect(back, { status: 303 });
}
