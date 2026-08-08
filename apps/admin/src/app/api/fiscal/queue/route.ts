/**
 * Run the submission queue. Drains every job that is due and returns to the retry queue screen with a
 * summary of what happened.
 *
 * Exposed as a route rather than a background daemon so it can be driven two ways: an operator pressing
 * "Process queue now", and a scheduler calling the same endpoint on a timer. Both take the same path, so
 * there is one code path to reason about.
 *
 * Requires INVOICE_SUBMIT: draining the queue transmits documents to the tax authority.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getFiscalStaff } from "../../../../lib/fiscal/permissions.js";
import { drainQueue } from "../../../../lib/fiscal/queue.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getFiscalStaff("INVOICE_SUBMIT");
  const back = new URL("/settings/e-invoicing/retry-queue", request.url);
  if (!staff) return NextResponse.redirect(back, { status: 303 });

  const r = await drainQueue();
  back.searchParams.set("ran", "1");
  back.searchParams.set("picked", String(r.picked));
  back.searchParams.set("accepted", String(r.accepted));
  back.searchParams.set("rejected", String(r.rejected));
  back.searchParams.set("deferred", String(r.deferred));
  back.searchParams.set("failed", String(r.failed));
  return NextResponse.redirect(back, { status: 303 });
}
