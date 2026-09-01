/**
 * The pixel size of an embedded image, read from its own header.
 *
 * react-pdf will scale a picture to whatever box it is given and says nothing about the size the
 * picture actually is. Given only a width, that means a 200 pixel diagram drawn for a slide gets
 * enlarged to the full width of the column, soft and pixelated, while the writer wonders why their
 * crisp export looks like that. Reading the header costs a few bytes of parsing and lets the layout
 * ask for the smaller of "as drawn" and "as much room as there is".
 *
 * Only the four formats the document engine accepts are understood. Anything else returns nothing,
 * and the caller falls back to the full column width, which is the old behaviour.
 */

/** The header bytes of a base64 data URL, decoded once. 64 bytes is enough for every format here. */
function header(dataUrl: string, bytes = 64): Buffer | null {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) return null;
  try {
    // Four base64 characters carry three bytes, so this is the smallest prefix that can be decoded.
    const chars = Math.ceil(bytes / 3) * 4;
    return Buffer.from(dataUrl.slice(comma + 1, comma + 1 + chars), "base64");
  } catch {
    return null;
  }
}

export interface PixelSize { width: number; height: number }

/** PNG: width and height are the two big-endian words of the IHDR chunk, at a fixed offset. */
function png(buf: Buffer): PixelSize | null {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** GIF: two little-endian shorts straight after the signature. */
function gif(buf: Buffer): PixelSize | null {
  if (buf.length < 10 || buf.toString("ascii", 0, 3) !== "GIF") return null;
  return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
}

/**
 * JPEG: walk the markers to the frame header, which is the only place the size is stated.
 *
 * The prefix read here covers the usual case, where the frame comes early. A file whose frame sits
 * past it simply returns nothing and is laid out at the column width, which is no worse than before.
 */
function jpeg(buf: Buffer): PixelSize | null {
  if (buf.length < 4 || buf.readUInt16BE(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buf[offset + 1]!;
    // SOF0 through SOF15, excluding the four that are not frame headers.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
    }
    offset += 2 + buf.readUInt16BE(offset + 2);
  }
  return null;
}

/** WebP, in its simple lossy form: the size sits in the VP8 bitstream header. */
function webp(buf: Buffer): PixelSize | null {
  if (buf.length < 30 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WEBP") {
    return null;
  }
  const kind = buf.toString("ascii", 12, 16);
  if (kind === "VP8X") return { width: (buf.readUIntLE(24, 3) & 0xffffff) + 1, height: (buf.readUIntLE(27, 3) & 0xffffff) + 1 };
  if (kind === "VP8 ") return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
  return null;
}

/** The image's size in pixels, or nothing when the header does not say. */
export function pixelSize(dataUrl: string): PixelSize | null {
  const buf = header(dataUrl);
  if (!buf) return null;
  const size = png(buf) ?? jpeg(buf) ?? gif(buf) ?? webp(buf);
  return size && size.width > 0 && size.height > 0 ? size : null;
}

/**
 * How wide to draw a picture in a column of the given width.
 *
 * Pixels are read as CSS pixels at 96 to the inch, the convention every screenshot and every export
 * from a drawing tool follows, and converted to the points a PDF is measured in. A picture larger
 * than the column is brought down to fit; one smaller than it is left at its own size rather than
 * being stretched.
 */
export function drawWidth(dataUrl: string, columnWidth: number): number {
  const size = pixelSize(dataUrl);
  if (!size) return columnWidth;
  return Math.min(columnWidth, (size.width * 72) / 96);
}
