/**
 * Prepare an uploaded stamp or signature for a document.
 *
 * Scans arrive with two problems that make them sit badly on a page:
 *
 *  1. A white or near-white background. Even a file that claims an alpha channel usually has opaque
 *     white behind the ink, which prints as a pale box over the ruled line.
 *  2. Wide empty margins. A signature photographed on A4 may be taller than it is wide with the ink in
 *     a narrow band; sized by those bounds it renders tiny, because most of the box is nothing.
 *
 * So the background is knocked out to transparent and the image is trimmed to the ink's own bounds.
 * After that its aspect ratio describes the artwork rather than the scan, and the layout can size it
 * predictably. Nothing is stored: the cleaned image goes straight back to the browser, which sends it
 * with the document. A stamp carries a date, so it is expected to change from one document to the next.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import sharp from "sharp";
import { getCurrentStaff } from "../../../../lib/auth.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** At or above this on all three channels counts as paper rather than ink. */
const WHITE_THRESHOLD = 235;
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File)) return NextResponse.json({ error: "No image was uploaded." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "That image is larger than 8MB." }, { status: 400 });

  try {
    const input = sharp(Buffer.from(await file.arrayBuffer())).ensureAlpha();
    const { data, info } = await input.raw().toBuffer({ resolveWithObject: true });

    let cleared = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      if (data[i]! >= WHITE_THRESHOLD && data[i + 1]! >= WHITE_THRESHOLD && data[i + 2]! >= WHITE_THRESHOLD) {
        data[i + 3] = 0;
        cleared++;
      }
    }

    const trimmed = await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
      .png()
      // Trim what is fully transparent, so the file's bounds become the ink's bounds.
      .trim({ threshold: 0 })
      .toBuffer({ resolveWithObject: true });

    // Cap the stored resolution: beyond this adds file size to every generated PDF and no visible detail.
    const capped = await sharp(trimmed.data).resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true })
      .png({ compressionLevel: 9 }).toBuffer({ resolveWithObject: true });

    return NextResponse.json({
      dataUrl: `data:image/png;base64,${capped.data.toString("base64")}`,
      width: capped.info.width,
      height: capped.info.height,
      clearedPercent: Math.round((cleared / (info.width * info.height)) * 100),
    });
  } catch {
    return NextResponse.json({ error: "That file could not be read as an image." }, { status: 400 });
  }
}
