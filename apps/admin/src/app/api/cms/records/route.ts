/**
 * Deleting a CMS record that is not a piece of content: an author, a category, a department, a
 * template, a redirect.
 *
 * Every one of those lists ended its row with a "…" button that had no handler, so none of these could
 * be removed through the interface at all — a mistyped category stayed forever. Content already had
 * /api/cms/content for this; this is the equivalent for the supporting tables.
 *
 * Only the tables named in ENTITIES can be addressed, and the table name is taken from that map rather
 * than from the request, so the entity parameter cannot reach any other table.
 *
 * A referenced row is not deleted. Removing a category that articles are filed under would either fail
 * on the foreign key or silently orphan them, so the count is checked first and the reason is reported.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCmsStaffFor } from "../../../../lib/auth.js";
import { cmsDb } from "../../../../lib/cms-db.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Entity {
  table: string;
  label: string;
  /** Rows elsewhere that would be orphaned. Checked before the delete, and refused if any exist. */
  guards?: { sql: string; message: (n: number) => string }[];
}

const ENTITIES: Record<string, Entity> = {
  author: {
    table: "cms_author",
    label: "author",
    guards: [{
      sql: "SELECT count(*)::int n FROM cms_content WHERE author_id = $1 OR fact_checker_id = $1",
      message: (n) => `That author is credited on ${n} ${n === 1 ? "page" : "pages"}. Reassign them first.`,
    }],
  },
  category: {
    table: "cms_category",
    label: "category",
    guards: [{
      sql: "SELECT count(*)::int n FROM cms_content WHERE category_id = $1",
      message: (n) => `That category holds ${n} ${n === 1 ? "page" : "pages"}. Move them first.`,
    }],
  },
  department: {
    table: "cms_department",
    label: "department",
    guards: [{
      sql: "SELECT count(*)::int n FROM cms_content WHERE kind = 'job' AND department = (SELECT name FROM cms_department WHERE id = $1)",
      message: (n) => `That department has ${n} open ${n === 1 ? "role" : "roles"}. Close or move them first.`,
    }],
  },
  template: { table: "cms_template", label: "template" },
  redirect: { table: "cms_redirect", label: "redirect" },
};

const safeBack = (raw: string): string => (raw.startsWith("/") && !raw.startsWith("//") ? raw : "/cms");

export async function POST(request: NextRequest): Promise<Response> {
  const f = await request.formData();
  const back = safeBack(String(f.get("back") ?? "/cms"));
  const to = (params: Record<string, string>): Response => {
    const url = new URL(back, request.url);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    return NextResponse.redirect(url, { status: 303 });
  };

  // Removing a record is a delete, so it needs the delete capability, not merely CMS access.
  const staff = await getCmsStaffFor("content.delete");
  if (!staff) return to({ denied: "1" });

  const entity = ENTITIES[String(f.get("entity") ?? "")];
  const id = String(f.get("id") ?? "").trim();
  if (!entity || !id) return to({ error: "unknown" });

  const pool = cmsDb();
  for (const guard of entity.guards ?? []) {
    const { rows } = await pool.query<{ n: number }>(guard.sql, [id]);
    const n = rows[0]?.n ?? 0;
    if (n > 0) return to({ blocked: guard.message(n) });
  }

  const { rowCount } = await pool.query(`DELETE FROM ${entity.table} WHERE id = $1`, [id]);
  return to((rowCount ?? 0) > 0 ? { deleted: entity.label } : { error: "missing" });
}
