/**
 * Projects. The engagement a client is buying, and the thing invoices and payments hang off.
 *
 * Each row carries the two money figures that must never be collapsed into one: what has been
 * invoiced, and what has actually been paid. Delivery progress is a third, separate number, set by
 * whoever runs the project — a project can be fully invoiced and half built, and a screen that
 * derived one from the other would hide exactly that.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Plus, FolderKanban } from "lucide-react";
import { requireCapability } from "../../../lib/auth.js";
import { db } from "../../../lib/db.js";
import { naira } from "../../../lib/finance.js";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABEL,
  PROJECT_STATUS_STYLE,
  projectFinancials,
  type ProjectStatus,
} from "../../../lib/projects.js";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  code: string;
  name: string;
  client_name: string;
  status: ProjectStatus;
  contract_value: string;
  progress_percent: string;
  invoiced: string;
  paid: string;
}

const TABS = [["All", ""], ...PROJECT_STATUSES.map((s) => [PROJECT_STATUS_LABEL[s], s])] as const;

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}): Promise<ReactNode> {
  await requireCapability("finance.read");
  const { status } = await searchParams;
  const filter = status && (PROJECT_STATUSES as readonly string[]).includes(status) ? status : "";

  // Invoiced and paid are totalled in SQL from the invoices that point at each project. Cancelled
  // invoices are excluded: they are not a claim on anybody. NRS status is not consulted at all —
  // whether a document reached the tax authority says nothing about whether the client owes us.
  const { rows } = await db().query<Row>(
    `SELECT p.id, p.code, p.name, c.name client_name, p.status,
            p.contract_value::text, p.progress_percent::text,
            COALESCE(i.invoiced, 0)::text invoiced,
            COALESCE(i.paid, 0)::text paid
       FROM project p
       JOIN client c ON c.id = p.client_id
       LEFT JOIN (
         SELECT project_id, SUM(total) invoiced, SUM(amount_paid) paid
           FROM einvoice
          WHERE doc_type = 'Invoice' AND cancelled_at IS NULL AND project_id IS NOT NULL
          GROUP BY project_id
       ) i ON i.project_id = p.id
      ${filter ? "WHERE p.status = $1" : ""}
      ORDER BY p.created_at DESC LIMIT 200`,
    filter ? [filter] : [],
  );

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Projects</h1>
          <p className="mt-1 text-[0.88rem] text-slate-500">
            What each client is buying, what has been invoiced against it, and what has been paid.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.83rem] font-600 text-white hover:bg-[#4330B8]"
        >
          <Plus size={15} strokeWidth={2.4} /> New Project
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[0.68rem] font-600 uppercase tracking-wide text-slate-500">Status</span>
        {TABS.map(([label, val]) => {
          const active = (val === "" && !filter) || val === filter;
          return (
            <Link
              key={label}
              href={val ? `/projects?status=${val}` : "/projects"}
              className={`rounded-full px-3 py-1.5 text-[0.78rem] font-600 ${active ? "bg-[#0F766E] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-14 text-center">
            <FolderKanban size={22} className="text-slate-300" />
            <p className="text-[0.92rem] font-600 text-slate-700">
              No projects{filter ? " with this status" : " yet"}
            </p>
            {!filter ? (
              <Link href="/projects/new" className="text-[0.85rem] font-600 text-[#543CDA]">
                Create your first project
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[0.7rem] uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-600">Project</th>
                  <th className="px-5 py-3 font-600">Client</th>
                  <th className="px-5 py-3 text-right font-600">Contract</th>
                  <th className="px-5 py-3 text-right font-600">Invoiced</th>
                  <th className="px-5 py-3 text-right font-600">Paid</th>
                  <th className="px-5 py-3 text-right font-600">Outstanding</th>
                  <th className="px-5 py-3 font-600">Progress</th>
                  <th className="px-5 py-3 font-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const f = projectFinancials({
                    contractValue: r.contract_value,
                    invoiced: r.invoiced,
                    paid: r.paid,
                  });
                  const progress = Number(r.progress_percent);
                  return (
                    <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <Link href={`/projects/${r.id}`} className="font-600 text-[0.88rem] text-slate-900 hover:text-[#543CDA]">
                          {r.name}
                        </Link>
                        <div className="font-mono text-[0.72rem] text-slate-400">{r.code}</div>
                      </td>
                      <td className="px-5 py-3 text-[0.85rem] text-slate-700">{r.client_name}</td>
                      <td className="px-5 py-3 text-right font-mono text-[0.82rem] tabular-nums text-slate-700">{naira(f.contractValue)}</td>
                      <td className="px-5 py-3 text-right font-mono text-[0.82rem] tabular-nums text-slate-700">{naira(f.invoiced)}</td>
                      <td className="px-5 py-3 text-right font-mono text-[0.82rem] tabular-nums text-[#15803D]">{naira(f.paid)}</td>
                      <td className="px-5 py-3 text-right font-mono text-[0.82rem] tabular-nums text-slate-900">{naira(f.outstanding)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-[#543CDA]" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
                          </div>
                          <span className="text-[0.75rem] tabular-nums text-slate-500">{progress.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[0.72rem] font-600 ${PROJECT_STATUS_STYLE[r.status]}`}>
                          {PROJECT_STATUS_LABEL[r.status]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
