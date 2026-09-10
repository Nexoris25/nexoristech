/**
 * Records that a redirect was served.
 *
 * `cms_redirect.hits` and `last_used` have existed since the table was created and nothing has ever
 * written to them, so the CMS list has always shown every rule with zero hits. The count is taken
 * where the redirect is actually issued — the middleware — but middleware runs on the edge runtime
 * and cannot reach Postgres, so it calls this and this does the write.
 *
 * The middleware does not wait for the answer: the visitor is redirected immediately and the count is
 * settled afterwards. A count can therefore be lost if the process dies in that window, which is the
 * right trade for a usage counter — nobody should wait on a redirect to increment a number.
 *
 * Guarded by REVALIDATION_SECRET. Without it this would be an unauthenticated write that anyone could
 * call in a loop to inflate the figures, and a number anyone can inflate is not worth showing.
 */
import { cmsDb } from "../../../../lib/cms-db.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.REVALIDATION_SECRET;
  if (!secret || request.headers.get("x-redirect-hit") !== secret) {
    // 404 rather than 401: an endpoint that answers differently when the secret is wrong tells an
    // attacker it exists and is worth guessing at.
    return new Response(null, { status: 404 });
  }

  let id: unknown;
  try {
    ({ id } = (await request.json()) as { id?: unknown });
  } catch {
    return new Response(null, { status: 400 });
  }
  if (typeof id !== "string" || !UUID.test(id)) return new Response(null, { status: 400 });

  try {
    await cmsDb().query(
      "UPDATE cms_redirect SET hits = COALESCE(hits, 0) + 1, last_used = now() WHERE id = $1",
      [id],
    );
  } catch (error) {
    // The visitor has already been redirected; a counter that cannot be written is not their problem.
    console.error("[redirects] hit not recorded:", error instanceof Error ? error.message : error);
  }
  return new Response(null, { status: 204 });
}
