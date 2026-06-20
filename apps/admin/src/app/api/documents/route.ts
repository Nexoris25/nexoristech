/**
 * The document PDF endpoint (PRD Part Three, 5). Authenticated staff (not viewers) post document
 * data and receive a branded, text-selectable PDF. The content is validated and used as-is; the
 * engine never invents figures or terms.
 */
import type { NextRequest } from "next/server";
import { getCurrentStaff } from "../../../lib/auth.js";
import { renderDocument } from "../../../lib/pdf/render.js";
import {
  DOC_KINDS,
  type DocKind,
  type DocSection,
  type DocumentData,
  type LineItem,
} from "../../../lib/pdf/types.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function sanitize(body: Record<string, unknown>): DocumentData | null {
  const kind = str(body.kind) as DocKind;
  if (!(DOC_KINDS as readonly string[]).includes(kind)) return null;
  const title = str(body.title);
  if (!title) return null;

  const sections: DocSection[] = Array.isArray(body.sections)
    ? (body.sections as Record<string, unknown>[])
        .map((s) => ({ heading: str(s.heading), body: str(s.body) }))
        .filter((s) => s.heading || s.body)
    : [];

  const lineItems: LineItem[] = Array.isArray(body.lineItems)
    ? (body.lineItems as Record<string, unknown>[])
        .map((i) => ({
          description: str(i.description),
          amount:
            typeof i.amount === "number" && Number.isFinite(i.amount)
              ? Math.max(0, i.amount)
              : 0,
        }))
        .filter((i) => i.description)
    : [];

  return {
    kind,
    title,
    date: str(body.date) || new Date().toLocaleDateString("en-NG"),
    sections,
    ...(str(body.reference) ? { reference: str(body.reference) } : {}),
    ...(str(body.recipientName) ? { recipientName: str(body.recipientName) } : {}),
    ...(str(body.recipientCompany)
      ? { recipientCompany: str(body.recipientCompany) }
      : {}),
    ...(str(body.intro) ? { intro: str(body.intro) } : {}),
    ...(str(body.terms) ? { terms: str(body.terms) } : {}),
    ...(lineItems.length > 0 ? { lineItems } : {}),
  };
}

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCurrentStaff();
  if (!staff || staff.role === "viewer") {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "invalid-json" }, { status: 400 });
  }

  const data = sanitize(body);
  if (!data) {
    return Response.json({ error: "invalid-document" }, { status: 400 });
  }

  const pdf = await renderDocument(data);
  const filename = `${data.kind.replace(/\s+/g, "-").toLowerCase()}.pdf`;
  return new Response(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
