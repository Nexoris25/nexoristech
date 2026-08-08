import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { AuthorForm } from "../AuthorForm.js";

export const dynamic = "force-dynamic";

export default async function NewAuthorPage(): Promise<ReactNode> {
  await requireCmsAccess();
  return (
    <div>
      <Link href="/cms/authors" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-slate-500 hover:text-[#543CDA]"><ArrowLeft size={15} /> Back to Authors</Link>
      <h1 className="mt-3 text-[1.4rem] font-700 text-slate-900">Create New Author</h1>
      <p className="mt-1 text-[0.86rem] text-slate-500">Add a contributor and shape how they appear on the public site.</p>
      <div className="mt-5"><AuthorForm /></div>
    </div>
  );
}
