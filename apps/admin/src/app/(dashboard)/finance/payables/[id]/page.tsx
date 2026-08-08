/**
 * Expense record (PRD 6.5). The single company expense: what it was, the vendor, category, amount and
 * VAT, how it was paid, and whether it is settled. Payroll-posted rows are read-only records of the
 * automatic salary post (8.9).
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "../../../../../lib/auth.js";
import { db } from "../../../../../lib/db.js";
import { naira } from "../../../../../lib/finance.js";

export const dynamic = "force-dynamic";

interface Exp {
  seq: string; expense_date: string; vendor: string | null; description: string; category: string | null;
  amount: string; vat: string; status: string; source: string; reference: string | null; method_name: string | null;
}

export default async function ExpensePage({ params }: { params: Promise<{ id: string }> }): Promise<ReactNode> {
  await requireAdmin();
  const { id } = await params;
  const { rows } = await db().query<Exp>(
    `SELECT e.seq::text, e.expense_date::text, e.vendor, e.description, c.name category, e.amount::text, e.vat::text,
            e.status, e.source, e.reference, m.name method_name
       FROM expense e LEFT JOIN finance_category c ON c.id=e.category_id LEFT JOIN payment_method m ON m.id=e.payment_method_id
      WHERE e.id=$1`, [id]);
  const e = rows[0];
  if (!e) notFound();

  const rows2 = [
    ["Vendor", e.vendor ?? "—"], ["Category", e.category ?? "Uncategorised"],
    ["Date", new Date(e.expense_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })],
    ["Paid from", e.method_name ?? "—"], ["Reference", e.reference ?? "—"], ["Source", e.source],
  ] as const;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/finance/payables" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]"><ArrowLeft size={15} strokeWidth={2.2} /> Payables</Link>

      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-5">
          <div>
            <div className="flex items-center gap-2"><h1 className="text-[1.15rem] font-700 text-slate-900">{e.description}</h1><span className={`rounded-full px-2.5 py-0.5 text-[0.72rem] font-600 ${e.status === "Paid" ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#FEF3C7] text-[#B45309]"}`}>{e.status}</span></div>
            <p className="mt-0.5 font-mono text-[0.76rem] text-slate-500">EXP-{e.seq.padStart(4, "0")}</p>
          </div>
          <p className="font-mono text-[1.3rem] font-700 text-slate-900">{naira(e.amount, 2)}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-6 py-5">
          {rows2.map(([k, v]) => (
            <div key={k}><dt className="text-[0.72rem] uppercase tracking-wide text-slate-500">{k}</dt><dd className="mt-0.5 text-[0.85rem] font-600 text-slate-800">{v}</dd></div>
          ))}
          <div><dt className="text-[0.72rem] uppercase tracking-wide text-slate-500">VAT paid</dt><dd className="mt-0.5 font-mono text-[0.85rem] font-600 text-slate-800">{naira(e.vat, 2)}</dd></div>
        </dl>
      </div>
    </div>
  );
}
