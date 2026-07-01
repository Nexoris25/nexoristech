/**
 * A coded product mockup for the hero: the Nexoris Technologies CRM dashboard shown inside a
 * browser frame, so the homepage leads with real software rather than a stock photo. Built with
 * Tailwind and lucide-react icons; decorative (aria-hidden) since it illustrates the product.
 */
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  Users,
  Contact,
  Search,
  TrendingUp,
  Flame,
} from "lucide-react";

function Kpi({ label, value, delta }: { label: string; value: string; delta: string }): ReactNode {
  return (
    <div className="rounded-xl border border-purple-100 bg-white p-3">
      <div className="text-[10px] font-600 uppercase tracking-wide text-neutral-600">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="font-mono text-lg font-700 text-ink-950">{value}</span>
        <span className="inline-flex items-center gap-0.5 text-[10px] font-600 text-[#0e7a5b]">
          <TrendingUp size={11} strokeWidth={2.4} />
          {delta}
        </span>
      </div>
    </div>
  );
}

/** Pipeline-by-stage mini bar chart (illustrative heights). */
const BARS = [40, 62, 48, 78, 55, 92, 70];

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
            app.nexoristech.com/crm
          </div>
        </div>

        {/* App body: sidebar + main */}
        <div className="grid grid-cols-[120px_1fr] bg-neutral-50 sm:grid-cols-[150px_1fr]">
          <aside className="hidden flex-col gap-1 bg-ink-950 p-3 text-purple-100 sm:flex">
            <div className="mb-3 flex items-center gap-2 px-1">
              <img src="/logo-mark-white.png" alt="" className="h-5 w-auto" />
              <span className="font-roboto text-[11px] font-700 text-white">Nexoris</span>
            </div>
            {[
              { icon: LayoutDashboard, label: "Dashboard" },
              { icon: Contact, label: "CRM", active: true },
              { icon: Users, label: "People" },
            ].map((n) => (
              <div
                key={n.label}
                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-600 ${
                  n.active ? "bg-purple-600 text-white" : "text-purple-100/70"
                }`}
              >
                <n.icon size={13} strokeWidth={2} />
                {n.label}
              </div>
            ))}
          </aside>

          <main className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-roboto text-sm font-700 text-ink-950">Leads</div>
                <div className="text-[10px] text-neutral-600">1 new, hottest first</div>
              </div>
              <div className="hidden items-center gap-1.5 rounded-md border border-purple-100 bg-white px-2 py-1 text-[10px] text-neutral-600 sm:flex">
                <Search size={11} strokeWidth={2} />
                Search
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <Kpi label="Open leads" value="24" delta="+6" />
              <Kpi label="Won" value="8" delta="+2" />
              <Kpi label="Win rate" value="33%" delta="+4" />
            </div>

            {/* Chart */}
            <div className="mt-3 rounded-xl border border-purple-100 bg-white p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-600 uppercase tracking-wide text-neutral-600">
                  Pipeline by stage
                </span>
              </div>
              <div className="flex h-16 items-end gap-1.5">
                {BARS.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-gradient-to-t from-purple-600 to-purple-500"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Lead row with AI score */}
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-purple-100 bg-white p-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-purple-100 font-mono text-[11px] font-700 text-purple-600">
                AO
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] font-600 text-ink-950">Dr. Amaka Obi</div>
                <div className="truncate text-[10px] text-neutral-600">
                  BrightCare Clinic · Healthcare
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-700 text-white">
                <Flame size={10} strokeWidth={2.4} />
                90 Hot
              </span>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
