/**
 * Oge editorial generation for the CMS (PRD Part Two). Admin only. The client sends the current draft
 * (title, body, focus keyword, and for internal links the candidate pages); Oge returns a draft the
 * editor reviews and approves before saving. Real AI when the gateway + keys are set, deterministic
 * otherwise — always a usable result.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCmsStaff } from "../../../../../lib/auth.js";
import { generateEditorial, type EditorialInput, type EditorialKind } from "../../../../../lib/oge-content.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS: readonly EditorialKind[] = ["seo", "tldr", "excerpt", "faqs", "author-bio", "internal-links", "page-body"];

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCmsStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Partial<EditorialInput>;
  if (!body.kind || !KINDS.includes(body.kind)) return NextResponse.json({ error: "invalid kind" }, { status: 400 });
  const { result, source } = await generateEditorial(body as EditorialInput);
  return NextResponse.json({ result, source });
}
