/**
 * Create or update a CMS category (nexoris_cms). Admin only. Slug is normalised; a category cannot be
 * its own parent. On success it returns to the categories list.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cmsDb } from "../../../../lib/cms-db.js";
import { getCmsStaff } from "../../../../lib/auth.js";
import { notifyPublished } from "../../../../lib/publish-notify.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slugify = (s: string): string => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCmsStaff();
  if (!staff) return NextResponse.redirect(new URL("/cms/categories", request.url), { status: 303 });
  const f = await request.formData();
  const id = String(f.get("id") ?? "").trim();
  const name = String(f.get("name") ?? "").trim();
  if (!name) return NextResponse.redirect(new URL(`${id ? `/cms/categories/${id}` : "/cms/categories/new"}?error=name`, request.url), { status: 303 });

  const slug = slugify(String(f.get("slug") ?? "") || name);
  // Falls back to the head of the full name, which is the right answer often enough to be a useful
  // default and always editable when it is not.
  const shortName =
    String(f.get("short_name") ?? "").trim() || name.split(/[,&]/)[0]!.trim() || name;
  const description = String(f.get("description") ?? "").trim() || null;
  const parent = String(f.get("parent_id") ?? "").trim();
  const parentId = parent && parent !== id ? parent : null;
  // "Save as Draft" and "Unpublish" both mean the same thing for a category: not live. The
  // intent decides it, so an editor does not have to know which checkbox controls visibility.
  const intent = String(f.get("intent") ?? "save").trim();
  const active = intent === "draft" || intent === "unpublish" ? false : f.get("active") != null;
  const pool = cmsDb();

  if (id) {
    await pool.query(
      "UPDATE cms_category SET name=$1, slug=$2, description=$3, parent_id=$4, active=$5, updated_by=$6, short_name=$8, updated_at=now() WHERE id=$7",
      [name, slug, description, parentId, active, staff.name, id, shortName]);
  } else {
    await pool.query(
      "INSERT INTO cms_category (name, slug, description, parent_id, active, created_by, updated_by, short_name) VALUES ($1,$2,$3,$4,$5,$6,$6,$7)",
      [name, slug, description, parentId, active, staff.name, shortName]);
  }
  // A category name appears on the insights index and on every article filed under it. The website has
  // no page per category, so the hub is what gets rebuilt; renaming one used to leave the old name up.
  await notifyPublished({ path: "/insights", kind: "category", published: active });
  return NextResponse.redirect(new URL("/cms/categories", request.url), { status: 303 });
}
