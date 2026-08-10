/**
 * CEO Dashboard. Year-to-date KPIs, the revenue trend, top clients by revenue, and priority alerts.
 *
 * Everything here reads from the database. It previously carried invented figures — ₦215m revenue,
 * ₦68m profit, 87 clients — and fictional client names, which on the one screen an owner uses to judge
 * the business is worse than showing nothing. Panels that have no data now say so.
 *
 * Two panels were removed rather than wired: Business Health and Client Satisfaction were a rating and a
 * score with no source anywhere in the platform. There is nothing to derive them from, so inventing a
 * number to fill the space is the same mistake in a smaller box.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Wallet, TrendingUp, Users, Landmark, AlertTriangle, CheckCircle2 } from "lucide-react";
import { RangeFilter } from "../../../../components/cms/RangeFilter.js";
import { resolvePeriod, PERIODS } from "../../../../lib/period.js";
import { redirect } from "next/navigation";
import { isExecutive } from "../../../../lib/crm-constants.js";
import { requireStaff } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";
import { AreaChart, Bar } from "../../../../components/charts.js";
import { ChartHover, type HoverPoint } from "../../../../components/ChartHover.js";

export const dynamic = "force-dynamic";

const BRAND_TINT = "bg-[#EEEBFC] text-[#543CDA]";

const nairaShort = (v: number): string => {
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(v >= 10_000_000 ? 1 : 2)}M`;
  if (v >= 1_000) return `₦${Math.round(v / 1_000)}K`;
  return `₦${Math.round(v).toLocaleString("en-NG")}`;
};

export default async function CeoDashboard({ searchParams }: { searchParams: Promise<{ range?: string }> }): Promise<ReactNode> {
  // Every figure on this page is company-wide: collected revenue, settled expenses, cash profit,
  // how many clients have ever been billed. It used to check only that someone was signed in, so a
  // salesperson or a viewer could read all of it. Anyone without an executive role is sent to the
  // dashboard they do have, rather than shown an empty version of this one.
  const staff = await requireStaff();
  if (!isExecutive(staff.role)) redirect("/dashboard");
  const pool = db();
  const period = resolvePeriod((await searchParams).range, "ytd");
  const w = [period.start, period.end];
  const [{ rows: fin }, { rows: clients }, { rows: overdue }, { rows: monthly }] = await Promise.all([
    // Collected revenue and settled expenses over the selected window. Profit here is cash in less
    // cash out, not an accounting profit, and the label says so. Clients invoiced is a running total
    // and stays unbounded: it answers "how many clients have we ever billed", not "this period".
    pool.query<{ revenue: string; expenses: string; clients: string }>(
      `SELECT
         (SELECT coalesce(sum(amount),0) FROM einvoice_payment
           WHERE payment_date >= $1 AND payment_date < $2)::text AS revenue,
         (SELECT coalesce(sum(amount + coalesce(vat,0)),0) FROM expense
           WHERE expense_date >= $1 AND expense_date < $2)::text AS expenses,
         (SELECT count(DISTINCT customer_name) FROM einvoice WHERE doc_type='Invoice')::text AS clients`,
      w),
    pool.query<{ name: string; amount: string }>(
      `SELECT customer_name AS name, sum(total)::text AS amount
         FROM einvoice WHERE doc_type='Invoice' GROUP BY customer_name ORDER BY sum(total) DESC LIMIT 5`),
    pool.query<{ n: string }>(
      `SELECT count(*)::text AS n FROM einvoice
        WHERE doc_type='Invoice' AND total > amount_paid AND due_date < current_date - interval '30 days'`),
    pool.query<{ label: string; amount: string }>(
      `SELECT to_char(date_trunc('month', payment_date), 'Mon') AS label, sum(amount)::text AS amount
         FROM einvoice_payment
        WHERE payment_date >= $1 AND payment_date < $2
        GROUP BY date_trunc('month', payment_date) ORDER BY date_trunc('month', payment_date)`,
      w),
  ]);

  const f = fin[0]!;
  const revenue = Number(f.revenue);
  const expenses = Number(f.expenses);
  const KPIS = [
    { label: "Revenue Collected", value: nairaShort(revenue), icon: <Wallet size={16} strokeWidth={2} /> },
    { label: "Cash Surplus", value: nairaShort(revenue - expenses), icon: <TrendingUp size={16} strokeWidth={2} /> },
    { label: "Clients Invoiced", value: f.clients, icon: <Users size={16} strokeWidth={2} /> },
    { label: "Expenses", value: nairaShort(expenses), icon: <Landmark size={16} strokeWidth={2} /> },
  ];

  const topClient = Math.max(1, ...clients.map((c) => Number(c.amount)));
  const billedTotal = clients.reduce((t, c) => t + Number(c.amount), 0);
  const CLIENTS = clients.map((c) => ({
    name: c.name,
    amount: nairaShort(Number(c.amount)),
    pct: billedTotal > 0 ? Number(((Number(c.amount) / billedTotal) * 100).toFixed(1)) : 0,
    bar: Math.round((Number(c.amount) / topClient) * 100),
  }));

  const overdueCount = Number(overdue[0]?.n ?? 0);
  const ALERTS = [
    overdueCount > 0
      ? { text: `${overdueCount} invoice${overdueCount === 1 ? "" : "s"} unpaid more than 30 days past due`, tone: "text-[#B91C1C] bg-[#FEE2E2]" }
      : null,
  ].filter((x): x is { text: string; tone: string } => x !== null);

  const trend = monthly.map((r) => Number(r.amount) / 1_000_000);
  const trendLabels = monthly.map((r) => r.label);
  const trendPoints: HoverPoint[] = monthly.map((r) => ({
    label: r.label,
    series: [{ label: "Revenue", color: "#543CDA", value: `₦${(Number(r.amount) / 1_000_000).toFixed(2)}M` }],
  }));
  const trendTop = Math.max(1, ...trend);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900 sm:text-[1.6rem]">Company Overview</h1>
          <p className="mt-1 text-[0.88rem] text-slate-500">{period.label} performance across Nexoris Technologies.</p>
        </div>
        <RangeFilter defaultValue={period.value} options={PERIODS.map((o) => ({ value: o.value, label: o.label }))} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <div className="flex items-start justify-between">
              <p className="text-[0.8rem] font-500 text-slate-500">{k.label}</p>
              <span className={`grid h-8 w-8 place-items-center rounded-lg ${BRAND_TINT}`}>{k.icon}</span>
            </div>
            <p className="mt-2 font-mono text-[1.4rem] font-700 leading-none text-slate-900">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <div className="flex items-center justify-between">
            <h2 className="text-[0.98rem] font-700 text-slate-900">Revenue Trend</h2>
          </div>
          {trend.length === 0 ? (
            <p className="py-20 text-center text-[0.86rem] text-slate-500">No payments recorded this year yet.</p>
          ) : (
            <div className="mt-3 flex">
              <div className="flex flex-col justify-between py-2 pr-3 font-mono text-[0.64rem] text-slate-500">
                {[trendTop, trendTop * 0.75, trendTop * 0.5, trendTop * 0.25, 0]
                  .map((v, i) => <span key={i}>{v <= 0 ? "₦0" : `₦${v.toFixed(1)}M`}</span>)}
              </div>
              <div className="min-w-0 flex-1">
                <ChartHover points={trendPoints} height={230}>
                  <AreaChart values={trend} height={230} />
                </ChartHover>
                <div className="mt-1 flex justify-between font-mono text-[0.62rem] text-slate-500">
                  {trendLabels.map((x) => <span key={x}>{x}</span>)}
                </div>
              </div>
            </div>
          )}
        </section>

      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.98rem] font-700 text-slate-900">Top Clients by Revenue</h2>
          <ul className="mt-4 flex flex-col gap-4">
            {CLIENTS.map((c) => (
              <li key={c.name} className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 font-mono text-[0.66rem] font-700 text-slate-600">{c.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between text-[0.82rem]">
                    <span className="truncate pr-2 font-600 text-slate-900">{c.name}</span>
                    <span className="shrink-0 font-mono text-slate-600">{c.amount}</span>
                  </div>
                  <div className="mt-1.5"><Bar pct={c.bar} /></div>
                </div>
                <span className="w-12 shrink-0 text-right font-mono text-[0.78rem] font-600 text-[#15803D]">{c.pct}%</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.98rem] font-700 text-slate-900">Priority Alerts</h2>
          {ALERTS.length === 0 ? (
            <p className="mt-4 flex items-start gap-2 text-[0.84rem] text-slate-600">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#15803D]" />
              Nothing needs attention. No invoice is more than 30 days past due.
            </p>
          ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {ALERTS.map((a) => (
              <li key={a.text} className="flex items-center gap-3">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${a.tone}`}><AlertTriangle size={15} strokeWidth={2} /></span>
                <span className="flex-1 text-[0.83rem] text-slate-700">{a.text}</span>
                <Link href="/finance/receivables" className="shrink-0 text-[0.8rem] font-600 text-[#543CDA] hover:text-[#4330B8]">View</Link>
              </li>
            ))}
          </ul>
          )}
        </section>
      </div>
    </div>
  );
}
