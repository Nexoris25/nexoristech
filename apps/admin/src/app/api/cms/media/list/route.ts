/**
 * The media library, as a picker needs it.
 *
 * The editor's image button offers a choice between the library and the machine, and choosing the
 * library needs the list. Images only, newest first, capped: a picker is for finding something you
 * remember uploading, not for paging through everything ever stored.
 */
import { NextResponse } from "next/server";
import { cmsDb } from "../../../../../lib/cms-db.js";
import { requireCmsAccess } from "../../../../../lib/auth.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  await requireCmsAccess();
  const { rows } = await cmsDb().query<{ id: string; name: string; url: string; alt_text: string | null }>(
    `SELECT id, name, url, alt_text
       FROM cms_media
      WHERE kind = 'image' AND url IS NOT NULL AND url <> ''
      ORDER BY created_at DESC
      LIMIT 200`,
  );
  return NextResponse.json(rows);
}
