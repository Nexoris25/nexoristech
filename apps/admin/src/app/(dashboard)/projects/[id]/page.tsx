/**
 * One project: what it is worth, what has been invoiced against it, what has been paid, and what
 * remains — plus the milestones and the invoices themselves.
 *
 * Four money figures are shown and they are deliberately four. Contract is what was agreed;
 * invoiced is what has been claimed; paid is what has arrived; outstanding is what has been claimed
 * and not yet arrived. Collapsing any pair of these into one number is how a finance screen starts
 * telling you something that is not true.
 *
 * Delivery progress sits apart from all of them, because it is not a money fact.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCapability } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";
import { requireUuid } from "../../../../lib/route-params.js";
import { naira } from "../../../../lib/finance.js";
import {
  MILESTONE_STATUSES,
  MILESTONE_STATUS_LABEL,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABEL,
  PROJECT_STATUS_STYLE,
  projectFinancials,
  type MilestoneStatus,
  type ProjectStatus,
} from "../../../../lib/projects.js";
import {
  docNumber,
  naira as ngn,
  paymentStatus,
  PAYMENT_STYLE,
  type DocType,
} from "../../../../lib/einvoice.js";

export const dynamic = "force-dynamic";

interface ProjectRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  contract_value: string;
  progress_percent: string;
  service_line: string | null;
  start_date: string | null;
  end_date: string | null;
  client_id: string;
  client_name: string;
  manager_id: string | null;
  client_email: string | null;
}

interface MilestoneRow {
  id: string;
  label: string;
  percent: string | null;
  amount: string;
  due_date: string | null;
  status: MilestoneStatus;
}

interface InvoiceRow {
  id: string;
  doc_type: DocType;
  seq: string;
  series: string | null;
  series_no: string | null;
  issue_date: string;
  due_date: string | null;
  total: string;
  amount_paid: string;
  invoice_percentage: string | null;
  fiscal_required: boolean;
  vat_charged: boolean;
  cancelled_at: string | null;
}

const field =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.85rem] text-slate-900 outline-none focus:border-[#543CDA] focus:ring-2 focus:ring-[#543CDA]/15";
const lbl = "block text-[0.75rem] font-600 text-slate-600";

function Stat({ k, v, tone }: { k: string; v: string; tone?: string }): ReactNode {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="text-[0.7rem] font-600 uppercase tracking-wide text-slate-500">{k}</div>
      <div className={`mt-1 font-mono text-[1.05rem] font-700 tabular-nums ${tone ?? "text-slate-900"}`}>{v}</div>
    </div>
  );
}

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; msg?: string }>;
}): Promise<ReactNode> {
  await requireCapability("finance.read");
  const id = requireUuid((await params).id);
  const { error, msg } = await searchParams;
  const pool = db();

  const project = (
    await pool.query<ProjectRow>(
      `SELECT p.id, p.code, p.name, p.description, p.status, p.contract_value::text,
              p.progress_percent::text, p.service_line, p.start_date::text, p.end_date::text,
              p.manager_id, c.id client_id, c.name client_name, c.email client_email
         FROM project p JOIN client c ON c.id = p.client_id
        WHERE p.id = $1`,
      [id],
    )
  ).rows[0];
  if (!project) notFound();

  const [milestones, invoices, totals, managers] = await Promise.all([
    pool.query<MilestoneRow>(
      "SELECT id, label, percent::text, amount::text, due_date::text, status FROM project_milestone WHERE project_id=$1 ORDER BY sort",
      [id],
    ),
    pool.query<InvoiceRow>(
      `SELECT id, doc_type, seq::text, series, series_no::text, issue_date::text, due_date::text,
              total::text, amount_paid::text, invoice_percentage::text, fiscal_required, vat_charged, cancelled_at
         FROM einvoice WHERE project_id=$1 ORDER BY created_at DESC`,
      [id],
    ),
    pool.query<{ invoiced: string; paid: string; billed_percent: string }>(
      `SELECT COALESCE(SUM(total), 0)::text invoiced,
              COALESCE(SUM(amount_paid), 0)::text paid,
              COALESCE(SUM(invoice_percentage), 0)::text billed_percent
         FROM einvoice
        WHERE project_id=$1 AND doc_type='Invoice' AND cancelled_at IS NULL`,
      [id],
    ),
    pool.query<{ id: string; name: string }>("SELECT id, name FROM staff WHERE active ORDER BY name LIMIT 200"),
  ]);

  const t = totals.rows[0]!;
  const f = projectFinancials({
    contractValue: project.contract_value,
    invoiced: t.invoiced,
    paid: t.paid,
  });
  const progress = Number(project.progress_percent);
  const billedPercent = Number(t.billed_percent);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/projects" className="text-[0.8rem] font-600 text-slate-500 hover:text-[#543CDA]">← Projects</Link>

      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">{project.name}</h1>
          <p className="mt-1 text-[0.85rem] text-slate-500">
            <span className="font-mono">{project.code}</span> · {project.client_name}
            {project.service_line ? ` · ${project.service_line}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[0.75rem] font-600 ${PROJECT_STATUS_STYLE[project.status]}`}>
            {PROJECT_STATUS_LABEL[project.status]}
          </span>
          <Link
            href={`/finance/invoices/new?project=${project.id}`}
            className="rounded-lg bg-[#543CDA] px-4 py-2 text-[0.83rem] font-600 text-white hover:bg-[#4330B8]"
          >
            Raise invoice
          </Link>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-[0.85rem] text-[#B91C1C]">
          {msg ?? "That could not be saved."}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat k="Contract" v={naira(f.contractValue)} />
        <Stat k="Invoiced" v={naira(f.invoiced)} />
        <Stat k="Paid" v={naira(f.paid)} tone="text-[#15803D]" />
        <Stat k="Outstanding" v={naira(f.outstanding)} tone="text-[#B45309]" />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between text-[0.78rem]">
            <span className="font-600 text-slate-600">Delivery progress</span>
            <span className="font-mono tabular-nums text-slate-900">{progress.toFixed(1)}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#543CDA]" style={{ width: `${Math.min(100, Math.max(0, progress))}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center justify-between text-[0.78rem]">
            <span className="font-600 text-slate-600">Invoiced against contract</span>
            <span className="font-mono tabular-nums text-slate-900">{f.percentInvoiced}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#0F766E]" style={{ width: `${Math.min(100, Number(f.percentInvoiced))}%` }} />
          </div>
          <p className="mt-1.5 text-[0.72rem] text-slate-500">
            {billedPercent > 0 ? `${billedPercent.toFixed(3)}% billed by percentage. ` : ""}
            {naira(f.uninvoiced)} of the contract is not yet invoiced.
          </p>
        </div>
      </div>

      {project.description ? (
        <p className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-[0.86rem] leading-relaxed text-slate-700">
          {project.description}
        </p>
      ) : null}

      {/* Milestones */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Milestones</h2>
          <p className="text-[0.78rem] text-slate-500">
            Stages of delivery. Marking one done records that the work is finished; it does not invoice it.
          </p>
        </div>
        {milestones.rows.length === 0 ? (
          <p className="px-5 py-6 text-center text-[0.85rem] text-slate-500">No milestones yet.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[0.7rem] uppercase tracking-wide text-slate-500">
                <th className="px-5 py-2.5 font-600">Milestone</th>
                <th className="px-5 py-2.5 text-right font-600">Share</th>
                <th className="px-5 py-2.5 text-right font-600">Amount</th>
                <th className="px-5 py-2.5 font-600">Due</th>
                <th className="px-5 py-2.5 font-600">Status</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {milestones.rows.map((m) => (
                <tr key={m.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-5 py-2.5 text-[0.86rem] font-600 text-slate-800">{m.label}</td>
                  <td className="px-5 py-2.5 text-right font-mono text-[0.8rem] tabular-nums text-slate-600">
                    {m.percent ? `${Number(m.percent).toFixed(2)}%` : "—"}
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono text-[0.8rem] tabular-nums text-slate-800">{naira(m.amount)}</td>
                  <td className="px-5 py-2.5 text-[0.8rem] text-slate-600">{m.due_date ?? "—"}</td>
                  <td className="px-5 py-2.5">
                    <form action="/api/projects/milestone" method="post" className="flex items-center gap-1.5">
                      <input type="hidden" name="project_id" value={project.id} />
                      <input type="hidden" name="milestone_id" value={m.id} />
                      <input type="hidden" name="action" value="status" />
                      <select
                        name="status"
                        defaultValue={m.status}
                        className="cursor-pointer rounded-md border border-slate-200 px-2 py-1 text-[0.76rem]"
                      >
                        {MILESTONE_STATUSES.map((s) => (
                          <option key={s} value={s}>{MILESTONE_STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                      <button type="submit" className="text-[0.74rem] font-600 text-[#543CDA] hover:underline">Save</button>
                    </form>
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <form action="/api/projects/milestone" method="post">
                      <input type="hidden" name="project_id" value={project.id} />
                      <input type="hidden" name="milestone_id" value={m.id} />
                      <input type="hidden" name="action" value="delete" />
                      <button type="submit" className="text-[0.74rem] font-600 text-slate-400 hover:text-[#B91C1C]">Remove</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <form action="/api/projects/milestone" method="post" className="grid gap-3 border-t border-slate-200 bg-slate-50/60 px-5 py-4 sm:grid-cols-5">
          <input type="hidden" name="project_id" value={project.id} />
          <input type="hidden" name="action" value="add" />
          <div className="sm:col-span-2">
            <label className={lbl} htmlFor="ms-label">New milestone</label>
            <input id="ms-label" name="label" required className={`mt-1 ${field}`} placeholder="Discovery and design" />
          </div>
          <div>
            <label className={lbl} htmlFor="ms-percent">Share (%)</label>
            <input id="ms-percent" name="percent" inputMode="decimal" className={`mt-1 ${field}`} placeholder="30" />
          </div>
          <div>
            <label className={lbl} htmlFor="ms-amount">or Amount</label>
            <input id="ms-amount" name="amount" inputMode="decimal" className={`mt-1 ${field}`} />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className={lbl} htmlFor="ms-due">Due</label>
              <input id="ms-due" name="due_date" type="date" className={`mt-1 ${field}`} />
            </div>
            <button type="submit" className="rounded-lg bg-[#0F766E] px-3 py-2 text-[0.8rem] font-600 text-white hover:bg-[#0d6259]">Add</button>
          </div>
        </form>
      </section>

      {/* Invoices */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Invoices</h2>
          <p className="text-[0.78rem] text-slate-500">Every document raised against this project, and what has been paid on it.</p>
        </div>
        {invoices.rows.length === 0 ? (
          <p className="px-5 py-6 text-center text-[0.85rem] text-slate-500">Nothing invoiced yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[0.7rem] uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-2.5 font-600">Number</th>
                  <th className="px-5 py-2.5 font-600">Issued</th>
                  <th className="px-5 py-2.5 text-right font-600">%</th>
                  <th className="px-5 py-2.5 text-right font-600">Total</th>
                  <th className="px-5 py-2.5 text-right font-600">Paid</th>
                  <th className="px-5 py-2.5 font-600">Kind</th>
                  <th className="px-5 py-2.5 font-600">Payment</th>
                </tr>
              </thead>
              <tbody>
                {invoices.rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="px-5 py-2.5">
                      <Link href={`/e-invoicing/doc/${r.id}`} className="font-mono text-[0.82rem] font-600 text-slate-900 hover:text-[#543CDA]">
                        {docNumber(r.doc_type, r.seq, r.series, r.series_no)}
                      </Link>
                    </td>
                    <td className="px-5 py-2.5 text-[0.8rem] text-slate-600">{r.issue_date}</td>
                    <td className="px-5 py-2.5 text-right font-mono text-[0.8rem] tabular-nums text-slate-600">
                      {r.invoice_percentage ? `${Number(r.invoice_percentage).toFixed(2)}%` : "—"}
                    </td>
                    <td className="px-5 py-2.5 text-right font-mono text-[0.82rem] tabular-nums text-slate-900">{ngn(r.total)}</td>
                    <td className="px-5 py-2.5 text-right font-mono text-[0.82rem] tabular-nums text-[#15803D]">{ngn(r.amount_paid)}</td>
                    <td className="px-5 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-[0.7rem] font-600 ${r.fiscal_required ? "bg-[#EEEBFC] text-[#543CDA]" : "bg-slate-100 text-slate-600"}`}>
                        {r.fiscal_required ? "NRS e-invoice" : "PDF invoice"}
                      </span>
                      {!r.vat_charged ? <span className="ml-1 text-[0.7rem] text-slate-400">no VAT</span> : null}
                    </td>
                    <td className="px-5 py-2.5">
                      {(() => {
                        const s = paymentStatus(Number(r.total), Number(r.amount_paid), r.due_date, Boolean(r.cancelled_at));
                        return <span className={`rounded-full px-2 py-0.5 text-[0.7rem] font-600 ${PAYMENT_STYLE[s]}`}>{s}</span>;
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Edit */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="text-[0.95rem] font-700 text-slate-900">Update project</h2>
        <form action="/api/projects" method="post" className="mt-4 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={project.id} />
          <input type="hidden" name="client_id" value={project.client_id} />
          <div className="sm:col-span-2">
            <label className={lbl} htmlFor="p-name">Name</label>
            <input id="p-name" name="name" defaultValue={project.name} required className={`mt-1 ${field}`} />
          </div>
          <div className="sm:col-span-2">
            <label className={lbl} htmlFor="p-desc">What the work is</label>
            <textarea id="p-desc" name="description" rows={2} defaultValue={project.description ?? ""} className={`mt-1 ${field}`} />
          </div>
          <div>
            <label className={lbl} htmlFor="p-value">Contract value (NGN)</label>
            <input id="p-value" name="contract_value" inputMode="decimal" defaultValue={project.contract_value} className={`mt-1 ${field}`} />
          </div>
          <div>
            <label className={lbl} htmlFor="p-service">Service line</label>
            <input id="p-service" name="service_line" defaultValue={project.service_line ?? ""} className={`mt-1 ${field}`} />
          </div>
          <div>
            <label className={lbl} htmlFor="p-status">Status</label>
            <select id="p-status" name="status" defaultValue={project.status} className={`mt-1 cursor-pointer ${field}`}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>{PROJECT_STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={lbl} htmlFor="p-manager">Project manager</label>
            <select id="p-manager" name="manager_id" defaultValue={project.manager_id ?? ""} className={`mt-1 cursor-pointer ${field}`}>
              <option value="">Unassigned</option>
              {managers.rows.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl} htmlFor="p-progress">Delivery progress (%)</label>
            <input id="p-progress" name="progress_percent" inputMode="decimal" defaultValue={project.progress_percent} className={`mt-1 ${field}`} />
          </div>
          <div>
            <label className={lbl} htmlFor="p-start">Start date</label>
            <input id="p-start" name="start_date" type="date" defaultValue={project.start_date ?? ""} className={`mt-1 ${field}`} />
          </div>
          <div>
            <label className={lbl} htmlFor="p-end">Expected end date</label>
            <input id="p-end" name="end_date" type="date" defaultValue={project.end_date ?? ""} className={`mt-1 ${field}`} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-lg bg-[#543CDA] px-5 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]">
              Save changes
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
