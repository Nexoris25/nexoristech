/**
 * Manage the media library: rename, retitle, and delete.
 *
 * Deleting removes the row and the file from disk, because a library that keeps the bytes of things
 * it says it has deleted is not a library. What it does first is check whether the file is used,
 * and that check is offered rather than enforced: an editor may know something the search does not,
 * so `force` deletes anyway. Replacing rewrites every reference to point at another file before the
 * original goes, which is the option that leaves no page with a hole in it.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { unlink } from "node:fs/promises";
import { join } from "node:path";
import { cmsDb } from "../../../../lib/cms-db.js";
import { requireCmsAccess } from "../../../../lib/auth.js";
import { usageFor, replaceEverywhere } from "../../../../lib/media-usage.js";
import { isUuid } from "../../../../lib/route-params.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Delete the file behind a URL. A missing file is not an error: the row is what we are removing. */
async function removeFile(url: string | null): Promise<void> {
  if (!url || !url.startsWith("/uploads/")) return;
  const name = url.slice("/uploads/".length);
  // Only a plain file name from our own uploads directory is ever touched.
  if (!/^[A-Za-z0-9._-]+$/.test(name)) return;
  await unlink(join(process.cwd(), "public", "uploads", name)).catch(() => undefined);
}

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await requireCmsAccess();
  const f = await request.formData();
  const action = String(f.get("action") ?? "");
  const back = new URL("/cms/media", request.url);
  const done = (q: string): Response =>
    NextResponse.redirect(new URL(`/cms/media${q}`, request.url), { status: 303 });
  const pool = cmsDb();

  if (action === "update") {
    const id = String(f.get("id") ?? "");
    if (!isUuid(id)) return NextResponse.redirect(back, { status: 303 });
    const name = String(f.get("name") ?? "").trim();
    const alt = String(f.get("alt_text") ?? "").trim();
    if (!name) return done("?error=name");
    await pool.query("UPDATE cms_media SET name=$1, alt_text=$2 WHERE id=$3", [name, alt || null, id]);
    return done("?saved=1");
  }

  if (action === "delete") {
    const ids = f.getAll("id").map(String).filter(isUuid);
    if (ids.length === 0) return NextResponse.redirect(back, { status: 303 });
    const force = String(f.get("force") ?? "") === "1";
    const replaceWith = String(f.get("replace_with") ?? "").trim();

    const { rows: files } = await pool.query<{ id: string; url: string | null; name: string }>(
      "SELECT id, url, name FROM cms_media WHERE id = ANY($1::uuid[])",
      [ids],
    );
    if (files.length === 0) return NextResponse.redirect(back, { status: 303 });

    // Replacing is a deliberate choice for one file, so it is only offered for a single selection.
    if (replaceWith && isUuid(replaceWith) && files.length === 1) {
      const target = (
        await pool.query<{ url: string | null }>("SELECT url FROM cms_media WHERE id=$1", [replaceWith])
      ).rows[0];
      if (target?.url && files[0]!.url) {
        await replaceEverywhere(files[0]!.url, target.url);
      }
    } else if (!force) {
      const used = await usageFor(files.filter((x): x is { id: string; url: string; name: string } => Boolean(x.url)));
      if (used.size > 0) {
        // Nothing is deleted. The screen re-asks with what it found.
        return done(`?inuse=${encodeURIComponent(ids.join(","))}`);
      }
    }

    for (const file of files) await removeFile(file.url);
    await pool.query("DELETE FROM cms_media WHERE id = ANY($1::uuid[])", [ids]);
    await pool
      .query(
        "INSERT INTO cms_activity (actor_name, action, subject, category) VALUES ($1,'Deleted',$2,'Media')",
        [staff.name, files.map((x) => x.name).join(", ").slice(0, 200)],
      )
      .catch(() => undefined);
    return done(`?deleted=${files.length}`);
  }

  return NextResponse.redirect(back, { status: 303 });
}
