/**
 * Server-side proxy from the browser to the Oge gateway's grounded chat (PRD 1.6, 10.5). Streams
 * the gateway's server-sent events straight through, keeping the gateway origin server-side. If the
 * gateway is unreachable, it emits a single graceful notice and handoff so the widget never shows a
 * broken state or a technical error.
 */
import type { NextRequest } from "next/server";
import { rateLimit, clientIp } from "../../../lib/rate-limit.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GATEWAY = process.env.OGE_GATEWAY_URL ?? "http://localhost:4000";

/** A one-off SSE stream carrying a single notice and done, for graceful degradation. */
function noticeStream(message: string): Response {
  const encoder = new TextEncoder();
  const event = (data: unknown): Uint8Array =>
    encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(event({ type: "notice", message }));
      controller.enqueue(
        event({
          type: "handoff",
          message: "Reach the Nexoris Technologies team.",
          whatsapp: "https://wa.me/2349138133224",
          contactUrl: "/contact",
          email: "business@nexoristech.com",
        }),
      );
      controller.enqueue(event({ type: "done" }));
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

function offlineStream(): Response {
  return noticeStream(
    "Our assistant is offline right now. You can reach the team on WhatsApp or the contact page.",
  );
}

export async function POST(request: NextRequest): Promise<Response> {
  if (!rateLimit(`chat:${clientIp(request)}`, 20, 60_000)) {
    return noticeStream(
      "You have sent a lot of messages in a short time. Please wait a moment, or reach the team on WhatsApp or the contact page.",
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid-json" }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${GATEWAY}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!upstream.body) return offlineStream();
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch {
    return offlineStream();
  }
}
