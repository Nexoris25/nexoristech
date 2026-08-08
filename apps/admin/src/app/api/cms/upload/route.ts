/**
 * Image upload for the CMS (PRD Part One: "VPS filesystem, WebP at upload, no CDN"). Admin only. Accepts
 * a multipart file, converts it to WebP with sharp, writes it to the served media folder, records it in
 * cms_media, and returns the URL plus auto-generated alt text (Oge vision when available, otherwise
 * derived from the file name) which the editor can override. Used by Featured Image, Author Headshot,
 * Cover Image, and the Media Library.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { cmsDb } from "../../../../lib/cms-db.js";
import { getCmsStaff } from "../../../../lib/auth.js";
import { altTextForImage } from "../../../../lib/oge-content.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 15 * 1024 * 1024;

function mediaDir(): string {
  const cwd = process.cwd();
  const base = existsSync(join(cwd, "public")) ? join(cwd, "public") : join(cwd, "apps", "admin", "public");
  return join(base, "uploads");
}

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCmsStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const folder = String(form?.get("folder") ?? "Uploads").trim() || "Uploads";
  if (!(file instanceof File)) return NextResponse.json({ error: "no file" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "file too large" }, { status: 413 });
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "not an image" }, { status: 415 });

  const input = Buffer.from(await file.arrayBuffer());
  let webp: Buffer, width = 0, height = 0;
  try {
    const pipeline = sharp(input, { failOn: "none" }).rotate();
    const meta = await pipeline.metadata();
    width = meta.width ?? 0; height = meta.height ?? 0;
    // Cap very large images so stored assets stay lean; keep aspect ratio.
    webp = await pipeline.resize({ width: Math.min(width || 2400, 2400), withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    const out = await sharp(webp).metadata();
    width = out.width ?? width; height = out.height ?? height;
  } catch {
    return NextResponse.json({ error: "could not process image" }, { status: 422 });
  }

  const id = randomUUID();
  const fileName = `${id}.webp`;
  const dir = mediaDir();
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, fileName), webp);
  const url = `/uploads/${fileName}`;

  const original = file.name || "image";
  const { altText } = await altTextForImage(webp.toString("base64"), "image/webp", original);

  const displayName = original.replace(/\.[a-z0-9]+$/i, "") || "image";
  const { rows } = await cmsDb().query<{ id: string }>(
    `INSERT INTO cms_media (name, kind, size_bytes, url, alt_text, mime_type, width, height, folder, uploaded_by)
     VALUES ($1,'image',$2,$3,$4,'image/webp',$5,$6,$7,$8) RETURNING id`,
    [displayName, webp.length, url, altText, width, height, folder, staff.name]);

  return NextResponse.json({ id: rows[0]?.id, url, altText, width, height, sizeBytes: webp.length });
}
