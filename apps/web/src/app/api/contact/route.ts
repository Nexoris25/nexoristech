/**
 * Server-side proxy from the Contact form to the Oge lead intake (PRD 11). Forwards the lead to
 * the gateway, which scores and stores it. Keeps the gateway origin server-side. If the gateway is
 * unreachable the client shows a plain "please email us" fallback so a lead is never silently lost.
 */
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GATEWAY = process.env.OGE_GATEWAY_URL ?? "http://localhost:4000";

export async function POST(request: NextRequest): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid-json" }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${GATEWAY}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data: unknown = await upstream.json().catch(() => null);
    return Response.json(data, { status: upstream.status });
  } catch {
    return Response.json({ error: "gateway-unreachable" }, { status: 502 });
  }
}
