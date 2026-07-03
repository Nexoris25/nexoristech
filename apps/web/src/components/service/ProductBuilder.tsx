"use client";
/**
 * Product Builder hero widget for AI Product Development. Three tabs — Website, Web App, Mobile App
 * — each a faithful, responsive reproduction of the approved reference designs, rebranded to
 * Nexoris Technologies, with real Nigerian data (naira, Lagos, real names). Web App and Website show
 * the top of a full page inside a browser frame; Mobile App is a full-height device. Auto-cycles,
 * pauses on click. Tailwind + lucide-react; decorative (illustrates what Nexoris Technologies builds).
 */
import { useEffect, useRef, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  Globe,
  LayoutDashboard,
  Smartphone,
  Search,
  Bell,
  ChevronDown,
  Sparkles,
  TriangleAlert,
  Layers,
  Users,
  ShieldCheck,
  Briefcase,
  BarChart3,
  Settings,
  TrendingUp,
  TrendingDown,
  PieChart,
  House,
  SquareCheckBig,
  MonitorPlay,
  UsersRound,
  Play,
  Flame,
  Star,
  Type,
  Lightbulb,
  Cog,
} from "lucide-react";

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
type TypeId = "website" | "webapp" | "mobile";

const TYPES: { id: TypeId; label: string; icon: Icon }[] = [
  { id: "website", label: "Website", icon: Globe },
  { id: "webapp", label: "Web App", icon: LayoutDashboard },
  { id: "mobile", label: "Mobile App", icon: Smartphone },
];

/* ════════════════════ WEB APP — finance dashboard ════════════════════ */

function Kpi({
  label,
  value,
  delta,
  dir,
  sub,
  icon: I,
}: {
  label: string;
  value: string;
  delta?: string;
  dir?: "up" | "down" | "flat";
  sub?: string;
  icon: Icon;
}): ReactNode {
  const dc = dir === "down" ? "text-[#c0362c]" : dir === "flat" ? "text-neutral-600" : "text-[#0e7a5b]";
  const D = dir === "down" ? TrendingDown : TrendingUp;
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-2.5">
      <div className="flex items-start justify-between">
        <div className="text-[8px] font-500 text-neutral-600">{label}</div>
        <span className="grid h-4 w-4 place-items-center rounded-full bg-purple-100 text-purple-600">
          <I size={9} strokeWidth={2} />
        </span>
      </div>
      <div className="mt-0.5 font-mono text-[12px] font-800 leading-tight text-ink-950">{value}</div>
      {delta ? (
        <div className={`mt-0.5 flex items-center gap-0.5 text-[7.5px] font-600 ${dc}`}>
          <D size={8} strokeWidth={2.4} />
          {delta} <span className="font-400 text-neutral-600">vs last week</span>
        </div>
      ) : (
        <div className="mt-0.5 text-[7.5px] text-neutral-600">{sub}</div>
      )}
    </div>
  );
}

function AlertBox({ text, risk, tone }: { text: string; risk: string; tone: "hi" | "mid" }): ReactNode {
  const c = tone === "hi" ? "text-[#c0362c]" : "text-[#7a5400]";
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-2.5 py-2">
      <div className="flex gap-1.5">
        <TriangleAlert size={11} className={c} strokeWidth={2} />
        <div className="text-[8.5px] font-600 leading-snug text-ink-950">{text}</div>
      </div>
      <div className={`mt-1 text-[8px] font-700 ${c}`}>{risk}</div>
    </div>
  );
}

function WebAppMock(): ReactNode {
  const nav: [Icon, string, boolean][] = [
    [LayoutDashboard, "Overview", true],
    [Layers, "Financials", false],
    [Users, "People", false],
    [ShieldCheck, "Compliance", false],
    [Briefcase, "Operations", false],
    [BarChart3, "Reports", false],
    [Settings, "System", false],
  ];
  return (
    <div className="grid h-full grid-cols-[128px_1fr] bg-neutral-50">
      <aside className="flex flex-col bg-white p-3">
        <div className="mb-3 flex items-center gap-1.5 px-1">
          <img src="/logo-mark-purple.png" alt="" className="h-4 w-auto" />
          <span className="font-roboto text-[12px] font-800 text-ink-950">Nexoris</span>
        </div>
        <div className="flex flex-col gap-0.5">
          {nav.map(([I, l, a]) => (
            <span key={l} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[9px] font-600 ${a ? "bg-purple-600 text-white" : "text-neutral-600"}`}>
              <I size={11} strokeWidth={2} />
              {l}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center gap-2 border-t border-neutral-100 pt-2.5">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-purple-100 font-mono text-[7px] font-700 text-purple-600">JD</span>
          <div className="min-w-0">
            <div className="truncate text-[8.5px] font-700 text-ink-950">Jane Doe</div>
            <div className="text-[7px] font-600 text-purple-600">Growth · Upgrade</div>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-2 bg-white px-3 py-2">
          <span className="flex flex-1 items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-[8px] text-neutral-600">
            <Search size={10} strokeWidth={2} /> Search for anything…
          </span>
          <span className="grid h-6 w-6 place-items-center rounded-full bg-neutral-100 text-neutral-600"><Bell size={11} /></span>
          <span className="flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-[8px] font-600 text-ink-950">Branch <ChevronDown size={9} /></span>
        </div>

        <div className="flex-1 overflow-hidden px-3 pb-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="font-roboto text-[13px] font-800 text-ink-950">Good morning, Fatimat! 👋</div>
              <div className="text-[8px] text-neutral-600">Here&apos;s what&apos;s happening with your business today</div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-purple-100 text-purple-600"><Sparkles size={10} /></span>
              <span className="flex items-center gap-1 rounded-md border border-neutral-200 px-2 py-1 text-[8px] font-600 text-ink-950">Filter <ChevronDown size={9} /></span>
              <span className="hidden rounded-md border border-neutral-200 px-2 py-1 text-[8px] text-neutral-600 lg:inline">Apr 17 – Apr 23, 2026</span>
            </div>
          </div>

          {/* AI compliance alerts */}
          <div className="rounded-xl border border-neutral-200 bg-white p-2.5">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-purple-100 text-purple-600"><Sparkles size={10} /></span>
                <span className="text-[9.5px] font-700 text-ink-950">AI Compliance Alerts</span>
                <span className="rounded-full bg-[#fdeceb] px-1.5 py-0.5 text-[7px] font-700 text-[#c0362c]">3 critical</span>
              </div>
              <span className="text-[8px] font-600 text-purple-600">View all →</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <AlertBox text="3 vendor payments missing WHT deduction" risk="High Risk" tone="hi" />
              <AlertBox text="PAYE Monthly Return is due in 7 days" risk="Medium Risk" tone="mid" />
              <AlertBox text="2 vendor duplicate payment risk detected" risk="High Risk" tone="hi" />
            </div>
          </div>

          {/* KPI grid */}
          <div className="mt-2.5 grid grid-cols-4 gap-2">
            <Kpi label="Total Revenue" value="₦52,843,699" delta="20.5%" dir="up" icon={TrendingUp} />
            <Kpi label="Total Expense" value="₦18,433,000" delta="8%" dir="down" icon={TrendingDown} />
            <Kpi label="Gross Profit" value="₦34,500,111" delta="44.1%" dir="up" icon={PieChart} />
            <Kpi label="Cash Balance" value="₦100,000,000" delta="3%" dir="up" icon={Layers} />
            <Kpi label="Payroll (month)" value="₦11,556,000" delta="3%" dir="down" icon={Users} />
            <Kpi label="Employees" value="82" sub="= last month" icon={UsersRound} />
            <Kpi label="Pending Approval" value="9" delta="5%" dir="up" icon={SquareCheckBig} />
            <Kpi label="Open Invoice" value="21" sub="₦35,240,000" icon={Briefcase} />
          </div>

          {/* chart teaser (top of below-the-fold) */}
          <div className="mt-2.5 grid grid-cols-[1.5fr_1fr] gap-2.5">
            <div className="rounded-xl border border-neutral-200 bg-white p-2.5">
              <div className="mb-1.5 flex items-center justify-between text-[8px]">
                <span className="font-700 text-ink-950">Cash flow summary</span>
                <span className="text-neutral-600">Last 7 days</span>
              </div>
              <div className="flex h-10 items-end gap-1.5">
                {[
                  [30, 22, 44], [42, 28, 60], [26, 24, 90], [22, 40, 78], [38, 26, 70], [24, 20, 52], [34, 22, 66],
                ].map((g, i) => (
                  <span key={i} className="flex flex-1 items-end gap-0.5">
                    <span className="flex-1 rounded-t bg-[#3fbf7f]" style={{ height: `${g[0]}%` }} />
                    <span className="flex-1 rounded-t bg-[#ef6a6a]" style={{ height: `${g[1]}%` }} />
                    <span className="flex-1 rounded-t bg-purple-600" style={{ height: `${g[2]}%` }} />
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-2.5">
              <span className="relative grid h-14 w-14 place-items-center rounded-full" style={{ background: "conic-gradient(#8b78f0 0 45%, #ef6a6a 45% 71%, #3d8bff 71% 83%, #f4c95d 83% 91%, #2ee6a8 91% 100%)" }}>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-center">
                  <span className="font-mono text-[8px] font-800 leading-none text-ink-950">₦13.5M</span>
                </span>
              </span>
              <div className="min-w-0">
                <div className="text-[8px] font-700 text-ink-950">Top Expenses</div>
                <div className="mt-0.5 text-[7px] text-neutral-600">Salaries &amp; Wages · 45%</div>
                <div className="text-[7px] text-neutral-600">Purchases · ₦3,250,000</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════ MOBILE — learning app ════════════════════ */

function MobileMock(): ReactNode {
  const cats: [Icon, string, string][] = [
    [Type, "Text-based", "bg-[#f6d9b8] text-[#8a5a2b]"],
    [Play, "Video Lessons", "bg-[#cfe0fb] text-[#2d6be0]"],
    [SquareCheckBig, "Quizzes", "bg-[#f8cfd6] text-[#c0362c]"],
    [MonitorPlay, "Mock Exams", "bg-[#cfe0fb] text-[#2d6be0]"],
  ];
  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-purple-100 via-white to-[#efe7f9]">
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />
      <div className="relative flex h-[456px] w-[248px] flex-col overflow-hidden rounded-[34px] border-[7px] border-ink-950 bg-white shadow-[0_28px_70px_rgba(13,10,28,.4)]">
        {/* header (dark) */}
        <div className="bg-ink-950 px-4 pb-6 pt-2.5 text-white">
          <div className="flex items-center justify-between text-[8px] font-600">
            <span>9:41</span>
            <span>▮▮▮ 📶 🔋</span>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <img src="/logo-mark-white.png" alt="" className="h-5 w-auto" />
              <span className="font-roboto text-[13px] font-800">Nexoris</span>
            </span>
            <span className="flex items-center gap-2.5">
              <Bell size={13} className="text-white/80" />
              <span className="grid h-6 w-6 place-items-center rounded-full bg-purple-500 font-mono text-[7px] font-700">CO</span>
            </span>
          </div>
          <div className="mt-3 text-[10px] font-600 text-white/80">Your progress</div>
        </div>

        {/* progress card (overlaps) */}
        <div className="-mt-4 mx-3 grid grid-cols-[auto_1fr] items-center gap-2 rounded-2xl bg-white p-2.5 shadow-[0_8px_20px_rgba(13,10,28,.12)]">
          <div className="flex flex-col items-center border-r border-neutral-100 pr-2.5">
            <Flame size={14} className="text-[#f97316]" />
            <span className="font-mono text-[12px] font-800 text-ink-950">1</span>
            <span className="text-[6.5px] text-neutral-600">day streak</span>
          </div>
          <div>
            <div className="mb-1 text-[7px] font-600 text-neutral-600">Your growth this week</div>
            <div className="grid grid-cols-3 text-center">
              {[["12", "Lessons"], ["0", "Quizzes"], ["3", "Mock Exams"]].map(([v, l]) => (
                <div key={l}>
                  <div className="font-mono text-[12px] font-800 text-purple-600">{v}</div>
                  <div className="text-[6px] text-neutral-600">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-3 pt-3">
          <div className="mb-1.5 text-[9px] font-800 text-ink-950">Categories you&apos;re interested in</div>
          <div className="grid grid-cols-4 gap-1">
            {cats.map(([I, l, tint]) => (
              <div key={l} className="flex flex-col items-center gap-1">
                <span className={`grid h-9 w-9 place-items-center rounded-2xl ${tint}`}><I size={14} strokeWidth={2} /></span>
                <span className="text-center text-[6.5px] font-500 leading-tight text-neutral-600">{l}</span>
              </div>
            ))}
          </div>

          <div className="mb-1.5 mt-3 text-[9px] font-800 text-ink-950">To get you started</div>
          <div className="flex gap-2 overflow-hidden">
            {[
              ["WAEC Mock Exam", "Mock Exams", "4.8", "from-purple-600 to-purple-700"],
              ["Earth Science", "Video Lessons", "3.5", "from-[#e0794a] to-[#7a4a2a]"],
            ].map(([t, cat, rate, grad]) => (
              <div key={t} className="w-[104px] shrink-0 overflow-hidden rounded-xl border border-neutral-100">
                <div className={`relative h-12 bg-gradient-to-br ${grad}`}>
                  <span className="absolute right-1 top-1 flex items-center gap-0.5 rounded bg-black/40 px-1 py-0.5 text-[6.5px] font-700 text-white">
                    <Star size={6} className="fill-[#f4c95d] text-[#f4c95d]" /> {rate}
                  </span>
                </div>
                <div className="p-1.5">
                  <div className="truncate text-[8px] font-700 text-ink-950">{t}</div>
                  <span className="mt-0.5 inline-block rounded bg-[#f6d9b8] px-1 py-0.5 text-[6px] font-600 text-[#8a5a2b]">{cat}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-1 mt-3 flex items-center justify-between">
            <span className="text-[9px] font-800 text-ink-950">My referrals</span>
            <span className="text-[7.5px] font-600 text-purple-600">See all</span>
          </div>
          {[["John Doe"], ["Emeka Nwosu"]].map(([n]) => (
            <div key={n} className="flex items-center gap-2 border-b border-neutral-100 py-1.5 last:border-0">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-purple-100 font-mono text-[7px] font-700 text-purple-600">
                {n!.split(" ").map((w) => w[0]).join("")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[8.5px] font-600 text-ink-950">{n}</span>
                <span className="block text-[6.5px] text-neutral-600">Joined</span>
              </span>
              <span className="flex items-center gap-0.5 text-[7px] font-700 text-[#f97316]"><Flame size={8} /> +100 XP</span>
            </div>
          ))}
        </div>

        {/* bottom nav */}
        <div className="mt-auto flex items-center justify-around border-t border-neutral-100 bg-white px-3 py-2">
          {([[House, true], [Play, false], [SquareCheckBig, false], [MonitorPlay, false], [UsersRound, false]] as const).map(([I, a], i) => (
            <I key={i} size={15} strokeWidth={a ? 2.4 : 2} className={a ? "text-purple-600" : "text-neutral-600/55"} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════ WEBSITE — advisory site ════════════════════ */

function WebsiteMock(): ReactNode {
  const services: [Icon, string, string][] = [
    [Lightbulb, "Business Strategy & Advisory", "Develop winning strategies and make confident decisions that drive growth."],
    [Cog, "Operations & Process", "Streamline operations and build efficient processes that reduce cost."],
    [TrendingUp, "Market Entry & Growth", "Enter new markets and scale with confidence and local intelligence."],
    [PieChart, "Financial Advisory", "Strengthen your financial foundation and plan for long-term value."],
  ];
  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* hero */}
      <div className="relative bg-ink-950 px-5 pb-8 pt-3 text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(120deg, rgba(84,60,218,.5), transparent 60%)" }} />
        <div className="relative flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <img src="/logo-mark-white.png" alt="" className="h-4 w-auto" />
            <span className="font-roboto text-[11px] font-800">Nexoris Technologies</span>
          </span>
          <span className="hidden items-center gap-3 text-[8.5px] font-500 text-white/80 sm:flex">
            <span>Services</span>
            <span>About</span>
            <span>Contact</span>
            <span className="rounded-md bg-purple-600 px-2.5 py-1 font-600 text-white">Get in touch</span>
          </span>
        </div>
        <div className="relative py-6 text-center">
          <div className="text-[8px] font-700 uppercase tracking-[.16em] text-purple-300">Strategy · Clarity · Growth</div>
          <div className="mx-auto mt-2 max-w-[26ch] font-roboto text-[19px] font-800 leading-tight">
            Helping ambitious businesses grow with confidence.
          </div>
          <div className="mt-3 flex justify-center gap-2">
            <span className="rounded-md bg-white px-3 py-1.5 text-[9px] font-700 text-ink-950">Get started</span>
            <span className="rounded-md border border-white/40 px-3 py-1.5 text-[9px] font-600">Explore services</span>
          </div>
        </div>
      </div>

      {/* what we do */}
      <div className="flex-1 px-5 py-4">
        <div className="text-center">
          <div className="text-[8px] font-700 uppercase tracking-[.14em] text-purple-600">What we do</div>
          <div className="mt-1 font-roboto text-[14px] font-800 text-ink-950">Advisory services that drive measurable impact</div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {services.map(([I, t, d]) => (
            <div key={t} className="rounded-xl border border-neutral-200 p-2.5">
              <span className="mb-2 grid h-7 w-7 place-items-center rounded-lg bg-purple-100 text-purple-600"><I size={14} strokeWidth={2} /></span>
              <div className="text-[9px] font-700 leading-tight text-ink-950">{t}</div>
              <div className="mt-1 text-[7.5px] leading-snug text-neutral-600">{d}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-center gap-6 border-t border-neutral-100 pt-3 opacity-60">
          {["Logoipsum", "Logoipsum", "Logoipsum", "Logoipsum"].map((l, i) => (
            <span key={i} className="flex items-center gap-1 text-[8px] font-800 text-neutral-600">
              <span className="h-2.5 w-2.5 rounded-full bg-neutral-600/60" /> {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const MOCKS: Record<TypeId, () => ReactNode> = {
  website: WebsiteMock,
  webapp: WebAppMock,
  mobile: MobileMock,
};

export function ProductBuilder(): ReactNode {
  const [active, setActive] = useState<TypeId>("webapp");
  const paused = useRef(false);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const next = (prev: TypeId): TypeId => TYPES[(TYPES.findIndex((x) => x.id === prev) + 1) % TYPES.length]!.id;

  useEffect(() => {
    const t = setTimeout(() => {
      if (!paused.current) setActive(next);
    }, 5200);
    return () => clearTimeout(t);
  }, [active]);

  useEffect(() => () => clearTimeout(resumeRef.current), []);

  function pick(id: TypeId): void {
    paused.current = true;
    setActive(id);
    clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => {
      paused.current = false;
      setActive(next);
    }, 12000);
  }

  const Mock = MOCKS[active];
  const framed = active !== "mobile";

  return (
    <div className="hero-product-builder reveal" aria-label="What Nexoris Technologies can build for you">
      <div className="mb-3 flex flex-wrap gap-1.5" role="tablist">
        {TYPES.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            onClick={() => pick(t.id)}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11.5px] font-600 transition-colors ${
              active === t.id
                ? "border-purple-500 bg-purple-600 text-white shadow-[0_4px_14px_rgba(84,60,218,.35)]"
                : "border-white/15 bg-white/5 text-purple-100/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <t.icon size={13} strokeWidth={2} />
            {t.label}
          </button>
        ))}
      </div>

      {framed ? (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-950 shadow-[0_30px_80px_rgba(13,10,28,.55)] ring-1 ring-white/5">
          <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.04] px-4 py-2.5">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="mx-auto flex items-center gap-2 rounded-md bg-white/[0.06] px-3 py-1 text-[11px] text-purple-100/70">
              <span className="h-1.5 w-1.5 rounded-full bg-mint-400" />
              {active === "website" ? "nexoristech.com" : "app.nexoristech.com"}
            </div>
          </div>
          <div className="h-[452px]">
            <Mock />
          </div>
        </div>
      ) : (
        <div className="h-[496px]">
          <Mock />
        </div>
      )}
    </div>
  );
}
