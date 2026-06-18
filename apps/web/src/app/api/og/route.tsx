/**
 * The branded Open Graph card endpoint (PRD 9.3, 16): a server-generated 1200x630 PNG, the
 * one raster a visitor receives. Takes a title and an eyebrow as query parameters so every
 * page references its own card via /api/og. Dark ink background with a soft purple glow, the
 * white Nexoris Technologies logo, the eyebrow, and the title.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ImageResponse } from "next/og";
import { OG_IMAGE } from "@nexoris/seo";

// Read the white logo once and inline it as a data URL (Node runtime).
const logoDataUrl = `data:image/png;base64,${readFileSync(
  resolve(process.cwd(), "public/brand/nexoris-logo-white.png"),
).toString("base64")}`;

// Load the brand font as TTF for the card. Supplying explicit fonts avoids the bundled
// default-font path bug in the image renderer on some platforms.
const fontRegular = readFileSync(
  resolve(process.cwd(), "assets/og/plus-jakarta-sans-400.ttf"),
);
const fontBold = readFileSync(
  resolve(process.cwd(), "assets/og/plus-jakarta-sans-700.ttf"),
);

export function GET(request: Request): ImageResponse {
  const { searchParams } = new URL(request.url);
  const title =
    searchParams.get("title")?.slice(0, 120) ?? "Nexoris Technologies";
  const eyebrow =
    searchParams.get("eyebrow")?.slice(0, 40) ?? "Nexoris Technologies";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0D0A1C",
          backgroundImage:
            "radial-gradient(900px circle at 80% -10%, rgba(106,85,242,0.45), transparent 60%)",
          padding: "72px",
          color: "#FFFFFF",
          fontFamily: "Plus Jakarta Sans",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <img src={logoDataUrl} width={64} height={71} alt="" />
          <span style={{ fontSize: 30, fontWeight: 700 }}>
            Nexoris Technologies
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: 26,
              color: "#DCD6F9",
              textTransform: "uppercase",
              letterSpacing: 2,
            }}
          >
            {eyebrow}
          </span>
          <span
            style={{
              fontSize: 64,
              fontWeight: 700,
              marginTop: 16,
              lineHeight: 1.1,
              maxWidth: 980,
            }}
          >
            {title}
          </span>
        </div>
        <span style={{ fontSize: 26, color: "#DCD6F9" }}>nexoristech.com</span>
      </div>
    ),
    {
      width: OG_IMAGE.width,
      height: OG_IMAGE.height,
      fonts: [
        {
          name: "Plus Jakarta Sans",
          data: fontRegular,
          weight: 400,
          style: "normal",
        },
        {
          name: "Plus Jakarta Sans",
          data: fontBold,
          weight: 700,
          style: "normal",
        },
      ],
    },
  );
}
