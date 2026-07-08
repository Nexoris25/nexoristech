/**
 * Hero product mockup: the Nexoris Technologies admin dashboard (CRM, Finance, HR, Payroll,
 * Commission, Action Center) shown inside a browser frame, so the homepage leads with real
 * software rather than a stock photo. Matches the approved dashboard design, Nexoris-branded.
 * Built with Tailwind and lucide-react; decorative (aria-hidden) as it illustrates the product.
 */
import type { ComponentType, ReactNode } from "react";
import {
  LayoutDashboard,
  Contact,
  Wallet,
  UsersRound,
  Coins,
  BadgePercent,
  Inbox,
  BarChart3,
  FileClock,
  ShieldCheck,
  Blocks,
  Settings,
  Search,
  Bell,
  MessageSquare,
  Sparkles,
  Trophy,
  ReceiptText,
  UserPlus,
  CalendarCheck,
  ChevronRight,
} from "lucide-react";

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

/** A tiny sparkline (illustrative), not a UI icon. */
function Spark({ up = true }: { up?: boolean }): ReactNode {
  const pts = up ? "0,16 12,12 24,14 36,7 48,9 60,2" : "0,6 12,9 24,5 36,11 48,8 60,14";
  return (
    <svg viewBox="0 0 60 18" className="h-4 w-16" fill="none" aria-hidden="true">
      <polyline points={pts} stroke="#543CDA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavItem({ icon: I, label, active }: { icon: Icon; label: string; active?: boolean }): ReactNode {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-2.5 py-[7px] text-[10.5px] font-500 ${
        active ? "bg-purple-600 text-white" : "text-purple-100/60"
      }`}
    >
      <I size={13} strokeWidth={2} />
      {label}
    </div>
  );
}

function SideLabel({ children }: { children: ReactNode }): ReactNode {
  return (
    <div className="px-2.5 pb-1 pt-3 font-mono text-[8px] uppercase tracking-[.14em] text-purple-100/60">
      {children}
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  up,
  spark = true,
}: {
  label: string;
  value: string;
  sub: ReactNode;
  up?: boolean;
  spark?: boolean;
}): ReactNode {
  return (
    <div className="rounded-lg border border-purple-100 bg-white p-2.5">
      <div className="text-[8.5px] font-500 uppercase tracking-wide text-neutral-600">{label}</div>
      <div className="mt-1 font-mono text-[13px] font-700 leading-none text-ink-950">{value}</div>
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[8px] text-neutral-600">{sub}</span>
        {spark ? <Spark up={up ?? true} /> : null}
      </div>
    </div>
  );
}

const PRIORITY: Record<string, string> = {
  High: "text-[#c0362c] bg-[#fdeceb]",
  Medium: "text-[#7a5400] bg-[#fdf3e0]",
  Low: "text-[#0e7a5b] bg-[#e4f5ee]",
};

const ROWS: { p: keyof typeof PRIORITY; item: string; module: string; due: string; who: string }[] = [
  { p: "High", item: "Invoice INV-2025-041 is overdue", module: "Finance", due: "15 days overdue", who: "Tunde S." },
  { p: "High", item: "SLA breach: 2 leads", module: "CRM", due: "Today", who: "Admin" },
  { p: "Medium", item: "Leave request awaiting approval", module: "HR", due: "May 21, 2025", who: "Chidi E." },
  { p: "Medium", item: "Pay run May 2025 ready for review", module: "Payroll", due: "Regular monthly", who: "Payroll Admin" },
  { p: "Low", item: "Subscription renewal in 7 days", module: "Finance", due: "AWS · ₦450,000", who: "Finance Admin" },
];

const ACTIVITY: { icon: Icon; tint: string; title: ReactNode; sub: string; time: string }[] = [
  { icon: Trophy, tint: "text-purple-600 bg-purple-100", title: <>Deal WON: Acme Corp</>, sub: "by Chinedu Obafor", time: "10:24 AM" },
  { icon: ReceiptText, tint: "text-[#0e7a5b] bg-[#e4f5ee]", title: <>Invoice paid INV-2025-033</>, sub: "₦4,500,000", time: "09:15 AM" },
  { icon: UserPlus, tint: "text-[#2d6be0] bg-[#e6effc]", title: <>New employee onboarded</>, sub: "Michael Adeyemi", time: "Yesterday" },
  { icon: CalendarCheck, tint: "text-[#9a6a00] bg-[#fdf3e0]", title: <>Pay run May 2025 created</>, sub: "38 employees", time: "Yesterday" },
];

export function ProductMockup(): ReactNode {
  return (
    <div aria-hidden="true" className="hero-product reveal">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-950 shadow-[0_30px_80px_rgba(13,10,28,.55)] ring-1 ring-white/5">
        {/* Browser chrome */}
        <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          </div>
          <div className="mx-auto flex items-center gap-2 rounded-md bg-white/[0.06] px-3 py-1 text-[11px] text-purple-100/70">
            <span className="h-1.5 w-1.5 rounded-full bg-mint-400" />
            app.nexoristech.com/dashboard
          </div>
        </div>

        {/* App shell */}
        <div className="grid grid-cols-[1fr] bg-neutral-50 min-[675px]:grid-cols-[160px_1fr]">
          {/* Sidebar */}
          <aside className="hidden flex-col bg-ink-950 p-2.5 text-purple-100 min-[675px]:flex">
            <div className="mb-1 flex items-center gap-2 px-1.5 py-1">
              <img src="/logo-mark-white.png" alt="" className="h-5 w-auto" />
              <span className="font-roboto text-[10px] font-700 leading-tight text-white">
                Nexoris<br />
                <span className="font-mono text-[7px] font-500 tracking-[.12em] text-purple-100/50">
                  TECHNOLOGIES
                </span>
              </span>
            </div>
            <NavItem icon={LayoutDashboard} label="Dashboard" active />
            <SideLabel>Modules</SideLabel>
            <NavItem icon={Contact} label="CRM" />
            <NavItem icon={Wallet} label="Finance" />
            <NavItem icon={UsersRound} label="HR" />
            <NavItem icon={Coins} label="Payroll" />
            <SideLabel>Commission</SideLabel>
            <NavItem icon={BadgePercent} label="Commission Engine" />
            <SideLabel>Tools</SideLabel>
            <NavItem icon={Inbox} label="Action Center" />
            <NavItem icon={BarChart3} label="Reports" />
            <NavItem icon={FileClock} label="Audit Log" />
            <SideLabel>Settings</SideLabel>
            <NavItem icon={ShieldCheck} label="Access & Roles" />
            <NavItem icon={Blocks} label="Integrations" />
            <NavItem icon={Settings} label="Company Settings" />
          </aside>

          {/* Main */}
          <div className="min-w-0">
            {/* Top bar */}
            <div className="flex items-center gap-3 border-b border-purple-100 bg-white px-3 py-2">
              <div className="flex flex-1 items-center gap-2 rounded-md bg-neutral-50 px-2.5 py-1.5 text-[9px] text-neutral-600">
                <Search size={11} strokeWidth={2} />
                Search across modules, people, deals, invoices…
              </div>
              <span className="relative text-neutral-600">
                <Bell size={14} strokeWidth={2} />
                <span className="absolute -right-1 -top-1 grid h-3 w-3 place-items-center rounded-full bg-purple-600 text-[6px] font-700 text-white">
                  6
                </span>
              </span>
              <MessageSquare size={14} strokeWidth={2} className="text-neutral-600" />
              <span className="flex items-center gap-1.5">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-purple-600 font-mono text-[8px] font-700 text-white">
                  DA
                </span>
                <span className="hidden leading-tight lg:block">
                  <span className="block text-[9px] font-600 text-ink-950">David Anozie</span>
                  <span className="block text-[7.5px] text-neutral-600">Founder</span>
                </span>
              </span>
            </div>

            {/* Content */}
            <div className="p-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-roboto text-[15px] font-700 text-ink-950">Good morning, David 👋</div>
                  <div className="text-[9px] text-neutral-600">
                    Here&apos;s what&apos;s happening across Nexoris Technologies today.
                  </div>
                </div>
                <div className="hidden items-center gap-2 min-[675px]:flex">
                  <span className="rounded-md border border-purple-100 bg-white px-2 py-1 text-[8.5px] text-neutral-600">
                    May 20, 2025
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-purple-600 px-2 py-1 text-[8.5px] font-600 text-white">
                    <Sparkles size={10} strokeWidth={2} />
                    Customize
                  </span>
                </div>
              </div>

              {/* KPIs */}
              <div className="mt-3 grid grid-cols-2 gap-2 min-[675px]:grid-cols-3 lg:grid-cols-5">
                <Kpi label="Sales Won Value (MTD)" value="₦45,000,000" up sub={<span className="text-[#0e7a5b]">↑ 18.6% vs Apr</span>} />
                <Kpi label="Recognized Revenue" value="₦28,750,000" up sub={<span className="text-[#0e7a5b]">↑ 12.2% vs Apr</span>} />
                <Kpi label="Open Invoices" value="₦35,200,000" sub="31 invoices" up={false} />
                <Kpi label="Payroll · Next Run" value="May 31" sub="11 days from now" spark={false} />
                <Kpi label="Active Employees" value="38" sub="2 on leave" spark={false} />
              </div>

              {/* Action Center + Module Activity */}
              <div className="mt-2.5 grid grid-cols-1 gap-2.5 lg:grid-cols-[1.55fr_1fr]">
                <div className="rounded-lg border border-purple-100 bg-white p-2.5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] font-700 text-ink-950">Action Center</span>
                    <span className="inline-flex items-center gap-0.5 text-[8px] font-600 text-purple-600">
                      View All <ChevronRight size={9} strokeWidth={2.4} />
                    </span>
                  </div>
                  <div className="grid grid-cols-[46px_1fr_auto] gap-x-2 border-b border-purple-100 pb-1 font-mono text-[7px] uppercase tracking-wide text-neutral-600">
                    <span>Priority</span>
                    <span>Item</span>
                    <span>Assignee</span>
                  </div>
                  <div className="divide-y divide-purple-100/70">
                    {ROWS.map((r, i) => (
                      <div key={i} className="grid grid-cols-[46px_1fr_auto] items-center gap-x-2 py-[5px]">
                        <span className={`inline-flex w-fit rounded px-1.5 py-0.5 text-[7px] font-700 ${PRIORITY[r.p]}`}>
                          {r.p}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[9px] font-500 text-ink-950">{r.item}</span>
                          <span className="block truncate text-[7.5px] text-neutral-600">
                            {r.module} · {r.due}
                          </span>
                        </span>
                        <span className="text-[8px] text-neutral-600">{r.who}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-purple-100 bg-white p-2.5">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[10px] font-700 text-ink-950">Module Activity</span>
                    <span className="text-[8px] text-neutral-600">Today</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {ACTIVITY.map((a, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md ${a.tint}`}>
                          <a.icon size={11} strokeWidth={2} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[9px] font-600 text-ink-950">{a.title}</span>
                          <span className="block truncate text-[7.5px] text-neutral-600">{a.sub}</span>
                        </span>
                        <span className="shrink-0 text-[7px] text-neutral-600">{a.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
