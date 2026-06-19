/**
 * Server-side proxy from the browser to the Oge gateway's Solution Finder (PRD 1.6, 10.5). Keeps
 * the gateway origin server-side and avoids CORS. The deterministic recommendation and the short
 * rationale are produced by the gateway; this route just forwards the five answers.
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
    const upstream = await fetch(`${GATEWAY}/finder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data: unknown = await upstream.json().catch(() => null);
    return Response.json(data, { status: upstream.status });
  } catch {
    // The gateway is unreachable; the client falls back to the local deterministic match.
    return Response.json({ error: "gateway-unreachable" }, { status: 502 });
  }
}
