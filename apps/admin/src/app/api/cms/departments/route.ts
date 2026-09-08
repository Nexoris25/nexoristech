/**
 * Create or update a careers department (nexoris_cms). CMS access only. Slug is normalised. On success it
 * returns to the departments list.
 */
import type { NextRequest } from "next/server";
import { cmsDb } from "../../../../lib/cms-db.js";
import { getCmsStaff } from "../../../../lib/auth.js";
import { seeOther } from "../../../../lib/redirect.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const slugify = (s: string): string => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCmsStaff();
  if (!staff) return seeOther("/cms/departments");
  const f = await request.formData();
  const id = String(f.get("id") ?? "").trim();
  const name = String(f.get("name") ?? "").trim();
  if (!name) return seeOther(`${id ? `/cms/departments/${id}` : "/cms/departments/new"}?error=name`);

  const slug = slugify(String(f.get("slug") ?? "") || name);
  const description = String(f.get("description") ?? "").trim() || null;
  const order = Number(f.get("display_order")) || 0;
  const active = f.get("active") != null;
  const pool = cmsDb();

  if (id) {
    await pool.query("UPDATE cms_department SET name=$1, slug=$2, description=$3, display_order=$4, active=$5, updated_at=now() WHERE id=$6",
      [name, slug, description, order, active, id]);
  } else {
    await pool.query("INSERT INTO cms_department (name, slug, description, display_order, active) VALUES ($1,$2,$3,$4,$5)",
      [name, slug, description, order, active]);
  }
  return seeOther("/cms/departments");
}
