/**
 * Server-side proxy from the Contact form to the Oge lead intake (PRD 11). Forwards the lead to
 * the gateway, which scores and stores it. Keeps the gateway origin server-side. If the gateway is
 * unreachable the client shows a plain "please email us" fallback so a lead is never silently lost.
 */
import type { NextRequest } from "next/server";
import { rateLimit, clientIp } from "../../../lib/rate-limit.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GATEWAY = process.env.OGE_GATEWAY_URL ?? "http://localhost:4000";

export async function POST(request: NextRequest): Promise<Response> {
  if (!rateLimit(`contact:${clientIp(request)}`, 5, 60_000)) {
    return Response.json({ error: "rate-limited" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid-json" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "invalid-body" }, { status: 400 });
  }
  const lead = { ...body } as Record<string, unknown>;
  // Other existing callers have their own user flows; this checkbox is for contact enquiries.
  const contactEnquiry =
    lead.source !== "oge-chat" && lead.source !== "newsletter";
  if (contactEnquiry && lead.consent !== true) {
    return Response.json({ error: "consent-required" }, { status: 400 });
  }
  delete lead.consent;
  if (contactEnquiry && typeof lead.message === "string") {
    lead.message += `\n\nEnquiry consent: agreed to use of details to respond, per /privacy-policy/. Recorded ${new Date().toISOString()}.`;
  }
  try {
    const upstream = await fetch(`${GATEWAY}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead),
    });
    const data: unknown = await upstream.json().catch(() => null);
    return Response.json(data, { status: upstream.status });
  } catch {
    return Response.json({ error: "gateway-unreachable" }, { status: 502 });
  }
}
