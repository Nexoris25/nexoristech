/**
 * The pages affected by one SEO issue, opened from the Metadata Status list on SEO Settings.
 *
 * A dashboard that reports "17 missing descriptions" and stops there leaves the editor to go and find
 * those seventeen. Every row here links straight into the editor for that page, so the count on the
 * dashboard is a route to the fix rather than a statistic.
 *
 * Paginated with the shared control, so the page-size choice and numbered pages behave as elsewhere.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, PencilLine, ShieldCheck } from "lucide-react";
import { requireCmsAccess } from "../../../../../../../lib/auth.js";
import { issueById, pagesWithIssue, countWithIssue, editHref, KIND_ROUTES } from "../../../../../../../lib/seo-audit.js";
import { Pagination, currentPage, perPageFrom } from "../../../../../../../components/cms/Pagination.js";

export const dynamic = "force-dynamic";

const KIND_LABEL: Record<string, string> = {
  insight: "Insight",
  generated_page: "Generated page",
  case_study: "Case study",
  legal_page: "Legal page",
  job: "Job",
};

/** The public path a page lives at, so the row can also open the live page. */
function publicHref(kind: string, slug: string | null): string | null {
  if (!slug) return null;
  const seg = KIND_ROUTES[kind];
  if (kind === "insight") return `/insights/${slug}`;
  if (kind === "case_study") return `/case-studies/${slug}`;
  if (kind === "job") return `/careers/${slug}`;
  if (kind === "legal_page") return `/${slug}`;
  if (kind === "generated_page") return `/${slug}`;
  return seg ? `/${seg}/${slug}` : null;
}

export default async function SeoIssuePage({ params, searchParams }: {
  params: Promise<{ issue: string }>;
  searchParams: Promise<{ page?: string; per?: string }>;
}): Promise<ReactNode> {
  await requireCmsAccess();
  const issue = issueById((await params).issue);
  if (!issue) notFound();

  const sp = await searchParams;
  const perPage = perPageFrom(sp.per);
  // The count comes first so the page number can be clamped before the window is read.
  const total = await countWithIssue(issue);
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const page = currentPage(sp.page, pageCount);
  const rows = await pagesWithIssue(issue, perPage, (page - 1) * perPage);
  const tone = issue.severity === "error" ? { fg: "#DC2626", bg: "#FEE2E2", word: "Error" } : { fg: "#B45309", bg: "#FEF3C7", word: "Warning" };

  return (
    <div>
      <Link href="/cms/seo/settings" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-slate-600 hover:text-[#543CDA]">
        <ArrowLeft size={15} /> SEO Settings
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[1.4rem] font-700 text-slate-900">{issue.label}</h1>
            <span className="rounded-full px-2.5 py-1 text-[0.68rem] font-700" style={{ background: tone.bg, color: tone.fg }}>{tone.word}</span>
          </div>
          <p className="mt-1 max-w-2xl text-[0.86rem] leading-relaxed text-slate-600">{issue.note}.</p>
        </div>
        <span className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[0.82rem] font-700 text-slate-800 shadow-subtle">
          {total.toLocaleString("en-NG")} {total === 1 ? "page" : "pages"}
        </span>
      </div>

      {total === 0 ? (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-subtle">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#DCFCE7] text-[#15803D]"><ShieldCheck size={19} /></span>
          <p className="text-[0.88rem] font-600 text-slate-800">
            No published page has this problem.
            <span className="mt-0.5 block text-[0.78rem] font-400 text-slate-600">Nothing to correct here.</span>
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-subtle">
            <table className="w-full min-w-[38rem] text-left">
              <thead className="border-b border-slate-200 bg-slate-50/70">
                <tr className="text-[0.72rem] font-700 uppercase tracking-wide text-slate-600">
                  <th scope="col" className="px-4 py-3">Page</th>
                  <th scope="col" className="px-4 py-3">Type</th>
                  <th scope="col" className="px-4 py-3">Last edited</th>
                  <th scope="col" className="px-4 py-3 text-right">Fix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const live = publicHref(r.kind, r.slug);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <Link href={editHref(r)} className="block text-[0.85rem] font-600 text-slate-900 hover:text-[#543CDA]">{r.title}</Link>
                        <span className="mt-0.5 block truncate font-mono text-[0.72rem] text-slate-600">{live ?? "no slug"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.7rem] font-600 text-slate-700">{KIND_LABEL[r.kind] ?? r.kind}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[0.78rem] text-slate-600">{r.updated_at.slice(0, 10)}</td>
                      <td className="px-4 py-3">
                        <span className="flex items-center justify-end gap-2">
                          {live && (
                            <a href={live} target="_blank" rel="noreferrer" aria-label={`Open ${r.title} on the site`}
                              className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-[#543CDA]">
                              <ExternalLink size={14} />
                            </a>
                          )}
                          <Link href={editHref(r)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-3 py-2 text-[0.78rem] font-600 text-white hover:bg-[#4330B8]">
                            <PencilLine size={14} /> Edit
                          </Link>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination total={total} page={page} pageCount={pageCount} perPage={perPage} noun="pages"
            basePath={`/cms/seo/settings/issues/${issue.id}`} />
        </>
      )}
    </div>
  );
}
