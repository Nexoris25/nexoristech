/**
 * Serves uploaded media from wherever MEDIA_STORAGE_PATH points.
 *
 * Next serves files under `public/` and nothing else, so moving uploads out of the application
 * directory — which is the whole point, since a deploy replaces that directory and took every image
 * with it — also removes the thing that was serving them. This route puts that back: the address
 * stays `/uploads/<name>`, and the bytes come from the configured directory.
 *
 * The public website proxies its own `/uploads/*` here, so a visitor still only ever talks to the
 * website's origin and this app stays unreachable from the internet.
 *
 * When MEDIA_STORAGE_PATH is unset the directory is the old `public/uploads`, and Next's static
 * handler answers first for anything that exists there. This route is then simply never reached,
 * which is why adding it changes nothing for a developer machine.
 */
import { NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname } from "node:path";
import { Readable } from "node:stream";
import { mediaFilePath } from "../../../lib/media-storage.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Everything the CMS writes is WebP; the rest are here for files uploaded before that was true. */
const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".pdf": "application/pdf",
};

/** Names are content-addressed UUIDs, so a stored file never changes under its own name. */
const CACHE_CONTROL = "public, max-age=604800, s-maxage=31536000, immutable";

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await context.params;
  // Uploads are flat: one file name, no directories. Anything else is not ours.
  if (path.length !== 1) return new NextResponse("Not found", { status: 404 });

  const file = mediaFilePath(path[0]!);
  if (!file) return new NextResponse("Not found", { status: 404 });

  let size: number;
  try {
    const info = await stat(file);
    if (!info.isFile()) return new NextResponse("Not found", { status: 404 });
    size = info.size;
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const type = CONTENT_TYPES[extname(file).toLowerCase()] ?? "application/octet-stream";
  // Streamed rather than read into memory: a media library holds photographs, not thumbnails.
  const body = Readable.toWeb(createReadStream(file)) as ReadableStream;
  return new NextResponse(body, {
    headers: {
      "content-type": type,
      "content-length": String(size),
      "cache-control": CACHE_CONTROL,
      // The bytes are whatever was uploaded; never let a browser decide they are something else.
      "x-content-type-options": "nosniff",
    },
  });
}
