/**
 * Oge editorial generation for the CMS (PRD Part Two). Admin only. The client sends the current draft
 * (title, body, focus keyword, and for internal links the candidate pages); Oge returns a draft the
 * editor reviews and approves before saving. Real AI when the gateway + keys are set, deterministic
 * otherwise — always a usable result.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cmsDb } from "../../../../../lib/cms-db.js";
import { getCmsStaff } from "../../../../../lib/auth.js";
import { generateEditorial, type EditorialInput, type EditorialKind } from "../../../../../lib/oge-content.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS: readonly EditorialKind[] = ["seo", "tldr", "excerpt", "faqs", "author-bio", "internal-links", "page-body"];

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCmsStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Partial<EditorialInput> & { template?: string };
  if (!body.kind || !KINDS.includes(body.kind)) return NextResponse.json({ error: "invalid kind" }, { status: 400 });

  // A chosen template decides the page's sections. The template was stored on the row and shown in
  // the picker but never reached the generator, so every programmatic page came out with the same
  // eight headings whichever template was selected: a control that looked like it did something.
  let sections: string[] | undefined;
  if (body.kind === "page-body" && body.template) {
    const { rows } = await cmsDb().query<{ sections: unknown }>(
      "SELECT sections FROM cms_template WHERE name = $1 AND active LIMIT 1", [body.template]);
    const raw = rows[0]?.sections;
    if (Array.isArray(raw)) {
      const named = raw.map((s) => String(s).trim()).filter(Boolean);
      if (named.length > 0) sections = named;
    }
  }

  const { result, source } = await generateEditorial({ ...(body as EditorialInput), ...(sections ? { sections } : {}) });
  return NextResponse.json({ result, source });
}
