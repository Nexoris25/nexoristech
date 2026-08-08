/**
 * Customer Statement (PRD 6.10; Statement of Account is a Finance document, 10.1). Pick a client and
 * see every invoice raised to them, what has been paid, and the balance carried - the statement you
 * send a client who asks what they owe. Clients are read from the invoices themselves; Finance never
 * keeps a separate customer table (people live in HR; clients are named on their invoices).
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { requireAdmin } from "../../../../../lib/auth.js";
import { db } from "../../../../../lib/db.js";
import { naira } from "../../../../../lib/finance.js";

export const dynamic = "force-dynamic";

interface Client { client_name: string; invoices: number; billed: string; paid: string; outstanding: string }
interface Line { id: string; seq: string; issue_date: string; due_date: string; total: string; amount_paid: string; status: string }

export default async function StatementPage({ searchParams }: { searchParams: Promise<{ client?: string }> }): Promise<ReactNode> {
  await requireAdmin();
  const { client } = await searchParams;
  const pool = db();

  const { rows: clients } = await pool.query<Client>(
    `SELECT customer_name AS client_name, count(*)::int invoices, sum(total)::text billed,
            sum(amount_paid)::text paid, sum(total - amount_paid)::text outstanding
       FROM einvoice
      WHERE doc_type = 'Invoice' AND lifecycle_status <> 'Closed'
      GROUP BY customer_name ORDER BY customer_name`);

  const selected = client ?? clients[0]?.client_name ?? null;
  const { rows: lines } = selected
    ? await pool.query<Line>(
      `SELECT id, seq::text, issue_date::text, due_date::text, total::text, amount_paid::text,
              lifecycle_status AS status
         FROM einvoice
        WHERE doc_type = 'Invoice' AND customer_name = $1 AND lifecycle_status <> 'Closed'
        ORDER BY issue_date`, [selected])
    : { rows: [] as Line[] };
  const stmt = clients.find((c) => c.client_name === selected);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/finance/receivables" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]"><ArrowLeft size={15} strokeWidth={2.2} /> Receivables</Link>
      <h1 className="mt-3 text-[1.4rem] font-700 text-slate-900">Customer Statement</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">Every invoice for a client and the balance they carry.</p>

      {clients.length === 0 ? (
        <div className="mt-5 flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center shadow-subtle"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#EEEBFC] text-[#543CDA]"><Users size={22} /></span><p className="text-[0.9rem] font-600 text-slate-700">No clients yet</p></div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[15rem_1fr]">
          <aside className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-subtle">
            {clients.map((c) => (
              <Link key={c.client_name} href={`/finance/receivables/statement?client=${encodeURIComponent(c.client_name)}`} className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[0.83rem] ${c.client_name === selected ? "bg-[#F4F1FD] font-600 text-[#543CDA]" : "text-slate-700 hover:bg-slate-50"}`}>
                <span className="truncate">{c.client_name}</span>
                <span className="shrink-0 font-mono text-[0.74rem]">{naira(c.outstanding)}</span>
              </Link>
            ))}
          </aside>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div><h2 className="text-[1rem] font-700 text-slate-900">{selected}</h2><p className="text-[0.78rem] text-slate-500">{stmt?.invoices} invoice{stmt?.invoices === 1 ? "" : "s"}</p></div>
              <div className="text-right"><p className="text-[0.72rem] text-slate-500">Balance</p><p className="font-mono text-[1.1rem] font-700 text-[#543CDA]">{naira(stmt?.outstanding ?? "0")}</p></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left">
                <thead><tr className="border-b border-slate-100 bg-slate-50 text-[0.7rem] uppercase tracking-wide text-slate-500"><th className="px-5 py-2.5 font-600">Invoice</th><th className="px-5 py-2.5 font-600">Issued</th><th className="px-5 py-2.5 text-right font-600">Total</th><th className="px-5 py-2.5 text-right font-600">Paid</th><th className="px-5 py-2.5 text-right font-600">Balance</th></tr></thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id} className="border-b border-slate-50 last:border-b-0">
                      <td className="px-5 py-2.5"><Link href={`/finance/receivables/${l.id}`} className="font-mono text-[0.8rem] font-600 text-[#543CDA]">INV-{l.seq.padStart(4, "0")}</Link></td>
                      <td className="px-5 py-2.5 text-[0.8rem] text-slate-600">{new Date(l.issue_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="px-5 py-2.5 text-right font-mono text-[0.8rem] text-slate-700">{naira(l.total)}</td>
                      <td className="px-5 py-2.5 text-right font-mono text-[0.8rem] text-slate-600">{naira(l.amount_paid)}</td>
                      <td className="px-5 py-2.5 text-right font-mono text-[0.8rem] font-600 text-slate-900">{naira(Number(l.total) - Number(l.amount_paid))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="bg-[#F4F1FD]"><td className="px-5 py-3 text-[0.82rem] font-700 text-slate-900" colSpan={4}>Balance due</td><td className="px-5 py-3 text-right font-mono text-[0.85rem] font-700 text-[#543CDA]">{naira(stmt?.outstanding ?? "0")}</td></tr></tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
