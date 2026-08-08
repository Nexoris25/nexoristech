/**
 * Export the CMS overview as CSV: content counts by type and by status, plus media and authors, read
 * live from the nexoris_cms database. Admin only.
 */
import { cmsDb } from "../../../../lib/cms-db.js";
import { getCmsStaff } from "../../../../lib/auth.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const staff = await getCmsStaff();
  if (!staff) return new Response("Forbidden", { status: 403 });
  const pool = cmsDb();
  const [byKind, byStatus, extra] = await Promise.all([
    pool.query<{ kind: string; c: string }>("SELECT kind, count(*)::text c FROM cms_content GROUP BY kind ORDER BY kind"),
    pool.query<{ status: string; c: string }>("SELECT status, count(*)::text c FROM cms_content GROUP BY status ORDER BY status"),
    pool.query<{ media: string; authors: string }>("SELECT (SELECT count(*) FROM cms_media)::text media, (SELECT count(*) FROM cms_author)::text authors"),
  ]);
  const lines = ["Group,Item,Count"];
  for (const r of byKind.rows) lines.push(`Content type,${r.kind},${r.c}`);
  for (const r of byStatus.rows) lines.push(`Status,${r.status},${r.c}`);
  lines.push(`Library,Media assets,${extra.rows[0]!.media}`, `Team,Authors,${extra.rows[0]!.authors}`);
  return new Response(lines.join("\r\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="cms-overview-${new Date().toISOString().slice(0, 10)}.csv"` },
  });
}
