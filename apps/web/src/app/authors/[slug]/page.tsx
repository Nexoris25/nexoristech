/**
 * The retired author URL.
 *
 * Author profiles moved to the site root: `/chinedu-nwogu` rather than `/authors/chinedu-nwogu`.
 * This stays as a permanent redirect rather than being deleted, because the old path has been in
 * sitemaps, in article bylines, and in whatever anyone has already linked or cited. A 308 tells a
 * browser and a search engine where the page went and passes the ranking with it; deleting the
 * route would have turned every one of those links into a 404.
 */
import { permanentRedirect } from "next/navigation";
import { authorPath } from "../../../lib/routes.js";

export const dynamic = "force-dynamic";

export default async function LegacyAuthorRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<never> {
  const { slug } = await params;
  permanentRedirect(authorPath(slug));
}
