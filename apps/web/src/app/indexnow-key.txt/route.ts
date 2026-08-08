/**
 * The IndexNow key file. The protocol lets the key live at any URL provided the submission names it via
 * `keyLocation`, which is what the admin sends, so this sits at a fixed, predictable path rather than a
 * dynamic one. Search engines fetch it to confirm we may submit URLs for this domain.
 */
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return new Response("Not configured", { status: 404 });
  return new Response(key, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
