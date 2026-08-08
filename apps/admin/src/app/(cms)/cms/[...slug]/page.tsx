/**
 * Catch-all for CMS URLs that do not exist. Every screen in the CMS navigation is built, so anything
 * reaching here is a mistyped or stale link rather than something still to come; it renders the standard
 * not-found page instead of promising a screen that is never arriving.
 */
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { requireCmsAccess } from "../../../../lib/auth.js";

export const dynamic = "force-dynamic";

export default async function CmsNotFound(): Promise<ReactNode> {
  await requireCmsAccess();
  notFound();
}
