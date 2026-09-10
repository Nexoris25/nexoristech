/**
 * Create Redirect (CMS SEO Operations design). CMS access only.
 *
 * The form itself is shared with the Edit screen so the two cannot drift apart. Any reason the save
 * was refused comes back on the query string and is shown above the fields, rather than the editor
 * being returned to an empty form with no explanation.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCmsAccess } from "../../../../../../lib/auth.js";
import { RedirectForm } from "../../../../../../components/cms/RedirectForm.js";

export const dynamic = "force-dynamic";

export default async function NewRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}): Promise<ReactNode> {
  await requireCmsAccess();
  const { error } = await searchParams;
  return (
    <div>
      <Link href="/cms/seo/redirects" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-slate-500 hover:text-[#543CDA]">
        <ArrowLeft size={15} /> Back to Redirects
      </Link>
      <h1 className="mt-3 text-[1.4rem] font-700 text-slate-900">Create Redirect</h1>
      <p className="mt-1 text-[0.86rem] text-slate-500">Create a new URL redirect.</p>
      <RedirectForm {...(error ? { error } : {})} />
    </div>
  );
}
