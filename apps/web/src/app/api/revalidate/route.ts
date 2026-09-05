/**
 * On-demand revalidation endpoint (PRD 6.3). The CMS calls it on publish so the affected ISR
 * routes rebuild within moments, authenticated by a shared secret. Not a public endpoint.
 */
import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const secret = request.headers.get("x-revalidate-secret");
  if (!secret || secret !== process.env.REVALIDATION_SECRET) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid-json" }, { status: 400 });
  }

  const rawPaths = (body as { paths?: unknown }).paths;
  const paths = Array.isArray(rawPaths)
    ? rawPaths.filter((p): p is string => typeof p === "string")
    : [];

  for (const path of paths) {
    revalidatePath(path);
  }
  // Discovery documents and marketing relationships change when CMS content is published/unpublished.
  if (paths.length) {
    revalidatePath("/sitemap.xml");
    revalidatePath("/llms.txt");
    revalidatePath("/", "layout");
  }

  return Response.json({ revalidated: paths });
}
