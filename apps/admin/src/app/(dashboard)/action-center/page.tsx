/**
 * The Action Center (PRD 11): the one shared inbox across the platform, living in the shell. Today
 * it gathers the CRM's deterministic alerts (SLA, hot leads, unassigned, follow-ups due, nurture
 * revivals), grouped by priority; Finance, HR, and Payroll feed the same list as they land. A
 * salesperson sees their own; admins and viewers see everyone. Nothing here is invented.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Inbox } from "lucide-react";
import { requireStaff } from "../../../lib/auth.js";
import { db } from "../../../lib/db.js";
import { buildActionCenter, type ActionItem } from "../../../lib/action-center.js";
import { PRIORITY_STYLE, type Priority } from "../../../lib/lead-ui.js";

export const dynamic = "force-dynamic";

const PRIORITIES: Priority[] = ["High", "Medium", "Low"];

function Row({ item }: { item: ActionItem }): ReactNode {
  const p = PRIORITY_STYLE[item.priority];
  return (
    <Link
      href={item.href}
      className="group flex items-center gap-3 border-t border-purple-200/50 px-5 py-3.5 first:border-t-0 hover:bg-neutral-50"
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-card"
        style={{ background: `${p.dot}1a`, color: p.dot }}
      >
        <Inbox size={16} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.92rem] font-600 text-ink-950">{item.title}</span>
        <span className="block truncate text-[0.8rem] text-neutral-600">
          {item.module} · {item.detail}
        </span>
      </span>
      <span className="hidden shrink-0 text-[0.8rem] text-neutral-600 sm:block">{item.assignee}</span>
      <ArrowRight
        size={16}
        strokeWidth={2}
        className="shrink-0 text-neutral-300 transition-colors group-hover:text-purple-600"
      />
    </Link>
  );
}

export default async function ActionCenterPage(): Promise<ReactNode> {
  const staff = await requireStaff();
  const now = new Date();
  const items = await buildActionCenter(
    db(),
    now,
    staff.role === "salesperson" ? staff.id : undefined,
  );

  const counts: Record<Priority, number> = { High: 0, Medium: 0, Low: 0 };
  for (const item of items) counts[item.priority] += 1;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-roboto text-[1.7rem] font-700 leading-tight text-ink-950">Action Center</h1>
      <p className="mt-1 text-[0.95rem] text-neutral-600">
        One inbox for everything that needs a decision across Nexoris Technologies.
      </p>

      <div className="mt-6 grid grid-cols-3 gap-3 sm:max-w-md">
        {PRIORITIES.map((priority) => (
          <div key={priority} className="rounded-card border border-purple-200 bg-white p-4 shadow-subtle">
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-[0.68rem] font-700 ${PRIORITY_STYLE[priority].chip}`}
            >
              {priority}
            </span>
            <p className="mt-2 font-mono text-[1.5rem] font-700 leading-none text-ink-950">
              {counts[priority]}
            </p>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-card border border-dashed border-purple-200 bg-white py-12 text-center">
          <CheckCircle2 size={26} strokeWidth={1.8} className="text-purple-600" />
          <p className="max-w-sm text-[0.9rem] text-neutral-600">
            Nothing needs attention right now. Alerts appear the moment an SLA runs short, a hot lead
            waits, or a follow-up falls due.
          </p>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {PRIORITIES.filter((p) => counts[p] > 0).map((priority) => (
            <section key={priority}>
              <h2 className="mb-2 flex items-center gap-2 text-[0.8rem] font-700 uppercase tracking-wide text-neutral-600">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: PRIORITY_STYLE[priority].dot }}
                />
                {priority} priority
                <span className="text-neutral-400">({counts[priority]})</span>
              </h2>
              <div className="overflow-hidden rounded-card border border-purple-200 bg-white shadow-subtle">
                {items.filter((i) => i.priority === priority).map((item) => (
                  <Row key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <p className="mt-6 rounded-card border border-purple-200 bg-purple-100/40 px-4 py-3 text-[0.82rem] leading-relaxed text-neutral-600">
        <span className="font-600 text-ink-950">Growing with the platform.</span> As Finance, HR, and
        Payroll go live, overdue invoices, leave approvals, pay-run reviews, and statutory deadlines
        join this same inbox, alongside AI checks like payroll anomaly flags and overdue-invoice
        escalation drafts.
      </p>
    </div>
  );
}
