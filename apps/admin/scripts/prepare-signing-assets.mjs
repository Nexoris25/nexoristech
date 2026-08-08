/**
 * Prepare the official stamp and signature for the document engine.
 *
 * Scans arrive with two problems that make them sit badly on a page:
 *
 *  1. A white or near-white background. Even when the file claims an alpha channel, a scan usually has
 *     opaque white behind the ink, which prints as a pale box over the ruled line.
 *  2. Wide empty margins. The signature here is 471x529 — taller than wide — but the ink occupies only
 *     a middle band. Sized by its bounding box it would render tiny, because most of the box is nothing.
 *
 * So: knock near-white pixels out to transparent, then trim to the ink's actual bounds. After this the
 * image's aspect ratio describes the artwork rather than the scan, and `objectFit: contain` gives the
 * size and orientation you would expect.
 *
 *   node scripts/prepare-signing-assets.mjs <source> <destination> [whiteThreshold]
 */
import sharp from "sharp";

const [, , src, dest, thresholdArg] = process.argv;
if (!src || !dest) {
  console.error("usage: prepare-signing-assets.mjs <source> <destination> [whiteThreshold]");
  process.exit(1);
}
// Anything at or above this on all three channels is treated as paper, not ink.
const threshold = Number(thresholdArg ?? 235);

const input = sharp(src).ensureAlpha();
const { width, height } = await input.metadata();
const { data, info } = await input.raw().toBuffer({ resolveWithObject: true });

let cleared = 0;
for (let i = 0; i < data.length; i += info.channels) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  if (r >= threshold && g >= threshold && b >= threshold) {
    data[i + 3] = 0;
    cleared++;
  }
}

const out = await sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } })
  .png()
  // Trim whatever is fully transparent, so the file's bounds are the ink's bounds.
  .trim({ threshold: 0 })
  .toBuffer({ resolveWithObject: true });

await sharp(out.data).toFile(dest);

console.warn(
  `${src}\n  ${width}x${height} -> ${out.info.width}x${out.info.height} ` +
  `(ratio ${(out.info.width / out.info.height).toFixed(2)}, ` +
  `${((cleared / (info.width * info.height)) * 100).toFixed(1)}% cleared to transparent)\n  wrote ${dest}`,
);
