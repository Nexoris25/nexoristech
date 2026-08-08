/**
 * Create or update a URL redirect (nexoris_cms). CMS access only. On success it returns to the redirect
 * list. Type is validated against the allowed set.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cmsDb } from "../../../../lib/cms-db.js";
import { getCmsStaff } from "../../../../lib/auth.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES = new Set(["301", "302", "307", "410"]);

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCmsStaff();
  if (!staff) return NextResponse.redirect(new URL("/cms/seo/redirects", request.url), { status: 303 });
  const f = await request.formData();
  const id = String(f.get("id") ?? "").trim();
  const oldUrl = String(f.get("old_url") ?? "").trim();
  if (!oldUrl) return NextResponse.redirect(new URL(`${id ? `/cms/seo/redirects` : "/cms/seo/redirects/new"}?error=old_url`, request.url), { status: 303 });

  const newUrl = String(f.get("new_url") ?? "").trim() || null;
  const typeRaw = String(f.get("type") ?? "301").trim();
  const type = TYPES.has(typeRaw) ? typeRaw : "301";
  const status = String(f.get("status") ?? "Active").trim() === "Inactive" ? "Inactive" : "Active";
  const notes = String(f.get("notes") ?? "").trim() || null;
  const pool = cmsDb();

  if (id) {
    await pool.query("UPDATE cms_redirect SET old_url=$1, new_url=$2, type=$3, status=$4, notes=$5 WHERE id=$6",
      [oldUrl, newUrl, type, status, notes, id]);
  } else {
    await pool.query("INSERT INTO cms_redirect (old_url, new_url, type, status, notes) VALUES ($1,$2,$3,$4,$5)",
      [oldUrl, newUrl, type, status, notes]);
  }
  return NextResponse.redirect(new URL("/cms/seo/redirects", request.url), { status: 303 });
}
