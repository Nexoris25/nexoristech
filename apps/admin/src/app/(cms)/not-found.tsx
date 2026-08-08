/**
 * Not found, inside the CMS shell. Every CMS screen in the navigation exists, so a 404 here means a
 * mistyped or stale link. Offers the way back rather than a dead end.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function CmsNotFound(): ReactNode {
  return (
    <div className="grid min-h-[60vh] place-items-center px-4">
      <div className="max-w-md text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#EEEBFC] text-[#543CDA]"><FileQuestion size={22} /></span>
        <h1 className="mt-4 text-[1.25rem] font-700 text-slate-900">We could not find that page</h1>
        <p className="mt-1.5 text-[0.88rem] leading-relaxed text-slate-500">
          The link may be out of date, or the address may have a typo. Everything in the CMS navigation is
          live, so try from the dashboard.
        </p>
        <Link href="/cms" className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]">
          <ArrowLeft size={15} /> Back to the CMS dashboard
        </Link>
      </div>
    </div>
  );
}
