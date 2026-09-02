"use client";
/**
 * The signed-in admin shell, built to the Nexoris Technologies dashboard design: a deep indigo
 * sidebar with the brand lockup and a flat module list (CRM expands to its sub-sections), Help
 * Center and Logout pinned at the bottom; and a white top bar with the dashboard switcher (on
 * dashboard routes), global search, quick-create, apps, notifications, the Oge greeting, and the
 * user menu. The sidebar collapses to an icon rail on desktop and slides in as a drawer below lg.
 * Every menu opens and closes on click, outside click, and Escape. Correct to 360px.
 */
import type { ComponentType, ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  Clock,
  Contact,
  FileClock,
  FileCode,
  FilePlus,
  FileText,
  HandCoins,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  Lightbulb,
  ListChecks,
  LogOut,
  Menu,
  Newspaper,
  PanelLeft,
  Plug,
  Plus,
  Receipt,
  ReceiptText,
  RefreshCw,
  Search,
  Send,
  Settings,
  TriangleAlert,
  ShieldCheck,
  Target,
  UserCog,
  UserPlus,
  UsersRound,
  Wallet,
  FolderKanban,
  KeyRound,
  Landmark,
  Scale as ScaleIcon,
  X,
  XCircle,
} from "lucide-react";
import { isExecutive } from "../lib/crm-constants.js";
import { Dropdown } from "./Dropdown.js";
import { OgeWidget } from "./OgeWidget.js";

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

export interface ShellStaff {
  name: string;
  role: string;
}

interface SubEntry {
  label: string;
  href: string;
}
interface NavEntry {
  icon: Icon;
  label: string;
  href: string;
  adminOnly?: boolean;
  module?: boolean;
  children?: SubEntry[];
}

/**
 * CRM module navigation: exactly the PRD's CRM screen inventory (§5.14) - the lead and deal
 * pipeline, the SLA board, the performance dashboards, the Sales Rep Profile, the reassignment
 * queue, and the document templates. CRM owns no companies, contacts, opportunities, quotes, or
 * products, and never invoices (§5.13).
 */
const CRM_NAV: NavEntry[] = [
  { icon: LayoutDashboard, label: "Overview", href: "/crm/overview" },
  { icon: Contact, label: "Leads", href: "/crm" },
  { icon: Target, label: "Pipeline", href: "/crm/board" },
  { icon: Activity, label: "SLA board", href: "/crm/sla" },
  { icon: BarChart3, label: "Performance", href: "/crm/performance" },
  { icon: UserCog, label: "Sales Reps", href: "/crm/reps", adminOnly: true },
  { icon: CheckSquare, label: "Reassignment", href: "/crm/reassignment", adminOnly: true },
  { icon: FileText, label: "Templates", href: "/crm/templates" },
];

/**
 * HR module navigation: the PRD's HR screen inventory (§7.10) minus recruitment/candidate data, by
 * instruction - the employee directory and record, onboarding, the contract staff register, leave,
 * expense claims, and departments (§7.2). Offboarding is reached from a person's record.
 */
const HR_NAV: NavEntry[] = [
  { icon: UsersRound, label: "Directory", href: "/people" },
  { icon: UserPlus, label: "Onboard", href: "/people/onboard" },
  { icon: Briefcase, label: "Contract Staff", href: "/people/contract" },
  { icon: Building2, label: "Departments", href: "/people/departments" },
  { icon: CalendarClock, label: "Leave", href: "/people/leave" },
  { icon: Receipt, label: "Expense Claims", href: "/people/expenses" },
];

/**
 * Payroll module navigation: the PRD's Payroll screen inventory (§8.12), organised. The pay run,
 * the statutory deduction toggle panel (Settings), the salary advance queue, the payslip, and the
 * compliance/remittance calendar. Salary lives in HR and is read on every run (§8.1), so Payroll has
 * no salary-editing screen; there is no general loan product (only the salary advance, §8.6).
 */
const PAYROLL_NAV: NavEntry[] = [
  { icon: LayoutDashboard, label: "Overview", href: "/payroll" },
  { icon: Wallet, label: "Pay Runs", href: "/payroll/runs" },
  { icon: HandCoins, label: "Salary Advances", href: "/payroll/advances" },
  { icon: FileText, label: "Payslips", href: "/payroll/payslips" },
  { icon: Landmark, label: "Remittances", href: "/payroll/remittances" },
  { icon: BarChart3, label: "Reports", href: "/payroll/reports" },
  { icon: Settings, label: "Settings", href: "/payroll/settings" },
];

/**
 * Finance module navigation, organised under the requested structure and mapped to the PRD's Finance
 * model (§6): the overview, the transaction ledger (invoice payments in, expenses out), Accounts
 * Receivable (invoices and their payments, §6.4), Accounts Payable (expenses grouped by vendor, §6.5;
 * there is no separate Bill/Vendor sub-ledger in the PRD), Reports (§6.8), and Settings (§6.2, §6.7).
 */
/**
 * Projects module navigation. A project is the engagement invoices are raised against, so it sits
 * beside Finance and reads from the same invoice table rather than keeping figures of its own.
 */
const PROJECTS_NAV: NavEntry[] = [
  { icon: FolderKanban, label: "All Projects", href: "/projects" },
  { icon: Plus, label: "New Project", href: "/projects/new" },
];

const FINANCE_NAV: NavEntry[] = [
  { icon: LayoutDashboard, label: "Overview", href: "/finance" },
  { icon: ReceiptText, label: "Invoices", href: "/finance/invoices" },
  { icon: ArrowLeftRight, label: "Transactions", href: "/finance/transactions" },
  { icon: FileText, label: "Receivables", href: "/finance/invoices?pay=unpaid" },
  { icon: Receipt, label: "Payables", href: "/finance/payables" },
  { icon: BarChart3, label: "Reports", href: "/finance/reports" },
  { icon: Settings, label: "Settings", href: "/finance/settings" },
];

/**
 * Settings module navigation, mapped to the PRD's shell scope (§3, §15): People & Access (the one
 * access-grant screen, §3.2), Roles & Permissions (a read-only view of the fixed role model), the one
 * platform Audit Log (§3.4), the Company profile (§15), and NRS e-Invoicing readiness (§15 - the one
 * area the PRD lets us build ahead). No Teams, Business Units, Branches, or Approval Workflows: the
 * PRD does not describe them and people/departments live in HR (§3.1, §7.2).
 */
const SETTINGS_NAV: NavEntry[] = [
  { icon: LayoutDashboard, label: "Overview", href: "/settings" },
  { icon: UsersRound, label: "People & Access", href: "/settings/access" },
  { icon: ShieldCheck, label: "Roles", href: "/settings/roles" },
  { icon: KeyRound, label: "Owner Account", href: "/settings/owner" },
  { icon: FileClock, label: "Audit", href: "/audit" },
  { icon: Building2, label: "Company", href: "/settings/company" },
  { icon: ReceiptText, label: "NRS e-Invoicing", href: "/settings/e-invoicing" },
];

/**
 * The CMS areas surfaced in the main shell. The CMS has its own dedicated chrome with the full grouped
 * navigation; this is the shortlist so someone working elsewhere in the platform can jump straight to a
 * CMS area without loading the CMS first.
 */
const CMS_NAV: NavEntry[] = [
  { icon: LayoutDashboard, label: "Overview", href: "/cms" },
  { icon: Lightbulb, label: "Insights", href: "/cms/insights" },
  { icon: FileCode, label: "Generated Pages", href: "/cms/generated-pages" },
  { icon: BookOpen, label: "Case Studies", href: "/cms/case-studies" },
  { icon: Briefcase, label: "Jobs", href: "/cms/jobs" },
  { icon: ListChecks, label: "Review Queue", href: "/cms/review-queue" },
  { icon: Search, label: "SEO Operations", href: "/cms/seo/settings" },
  { icon: Bot, label: "Oge AI Workspace", href: "/cms/ai" },
];

/**
 * NRS e-Invoicing configuration sub-nav, shown inside Settings > NRS e-Invoicing (PRD 15 readiness).
 * The config side: integration and registration, invoice and tax configuration, and read-only
 * submission history, the error/retry queue, and the integration logs. The operational document side
 * (issuing e-invoices and notes) is the separate top-level module below.
 */
const EINVOICING_SETTINGS_NAV: NavEntry[] = [
  { icon: LayoutDashboard, label: "Overview", href: "/settings/e-invoicing" },
  { icon: Plug, label: "Integration", href: "/settings/e-invoicing/integration" },
  { icon: Building2, label: "Business Registration", href: "/settings/e-invoicing/registration" },
  { icon: ReceiptText, label: "Invoice Configuration", href: "/settings/e-invoicing/invoice-config" },
  { icon: Landmark, label: "Tax Configuration", href: "/settings/e-invoicing/tax-config" },
  { icon: FileText, label: "Submission History", href: "/settings/e-invoicing/submission-history" },
  { icon: RefreshCw, label: "Error & Retry Queue", href: "/settings/e-invoicing/retry-queue" },
  { icon: ScaleIcon, label: "Reconciliation", href: "/settings/e-invoicing/reconciliation" },
  { icon: FileClock, label: "Integration Logs", href: "/settings/e-invoicing/logs" },
];

/**
 * The NRS e-Invoicing module is compliance-only: it never creates invoices. Commercial invoices are
 * raised in Finance; this module lists finalized invoices Ready for Submission, drives them through the
 * NRS lifecycle (Submitted / Accepted / Rejected), and owns the Credit and Debit Notes that adjust an
 * accepted invoice. Plus reporting and the integration monitor. Configuration lives under Settings.
 */
const EINVOICING_NAV: NavEntry[] = [
  { icon: LayoutDashboard, label: "Overview", href: "/e-invoicing" },
  { icon: Send, label: "Ready for Submission", href: "/e-invoicing/ready" },
  { icon: Clock, label: "Submitted", href: "/e-invoicing/submitted" },
  { icon: CheckCircle2, label: "Accepted", href: "/e-invoicing/accepted" },
  { icon: XCircle, label: "Rejected", href: "/e-invoicing/rejected" },
  { icon: FileText, label: "Credit Notes", href: "/e-invoicing/credit-notes" },
  { icon: FilePlus, label: "Debit Notes", href: "/e-invoicing/debit-notes" },
  { icon: TriangleAlert, label: "VAT to Account For", href: "/e-invoicing/vat-to-account" },
  { icon: BarChart3, label: "Reports", href: "/e-invoicing/reports" },
  { icon: Activity, label: "Integration Monitor", href: "/e-invoicing/monitor" },
];

/**
 * The dashboards a person may switch between.
 *
 * The CEO dashboard is company-wide finance, so it is offered only to the roles allowed to read it.
 * Listing it for everyone meant a salesperson picked it and either saw the whole company's revenue,
 * or after the guard landed, bounced straight back with no explanation.
 */
const DASHBOARDS = [
  { label: "Executive Dashboard", href: "/dashboard" },
  { label: "CEO Dashboard", href: "/dashboard/ceo", executiveOnly: true },
  { label: "Personal Dashboard", href: "/dashboard/personal" },
] as const;

function dashboardsFor(role: string): { label: string; href: string }[] {
  return DASHBOARDS.filter((d) => !("executiveOnly" in d && d.executiveOnly) || isExecutive(role))
    .map((d) => ({ label: d.label, href: d.href }));
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");
}

/** True when this entry is the current section. Exact-match roots (like /crm) never swallow their
 *  own children (/crm/companies), so only one item is ever highlighted. */
function isActive(pathname: string, href: string, items: NavEntry[]): boolean {
  if (pathname === href) return true;
  if (!pathname.startsWith(`${href}/`)) return false;
  // A deeper sibling wins over a shorter root.
  return !items.some((o) => o.href !== href && o.href.startsWith(`${href}/`) && (pathname === o.href || pathname.startsWith(`${o.href}/`)));
}

/**
 * The one platform, not five products. The sidebar always shows every module the signed-in user may
 * see (RBAC, §3.2); the module you are in expands to reveal its own sections, and every other module
 * stays one click away. Access comes from the module_access grants (admins see all).
 */
type AccessKey = "crm" | "finance" | "einvoicing" | "hr" | "payroll";
interface ModuleEntry { id: string; icon: Icon; label: string; href: string; access?: AccessKey; adminOnly?: boolean; hasChildren?: boolean }

const MODULES: ModuleEntry[] = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { id: "crm", icon: Contact, label: "CRM", href: "/crm", access: "crm", hasChildren: true },
  { id: "projects", icon: FolderKanban, label: "Projects", href: "/projects", access: "finance", hasChildren: true },
  { id: "finance", icon: Landmark, label: "Finance", href: "/finance", access: "finance", hasChildren: true },
  { id: "einvoicing", icon: ReceiptText, label: "NRS e-Invoicing", href: "/e-invoicing", access: "einvoicing", hasChildren: true },
  { id: "hr", icon: UsersRound, label: "HR", href: "/people", access: "hr", hasChildren: true },
  { id: "payroll", icon: Wallet, label: "Payroll", href: "/payroll", access: "payroll", hasChildren: true },
  { id: "cms", icon: Newspaper, label: "CMS", href: "/cms", adminOnly: true, hasChildren: true },
  { id: "action", icon: Inbox, label: "Action Center", href: "/action-center" },
  { id: "settings", icon: Settings, label: "Settings", href: "/settings", adminOnly: true, hasChildren: true },
];

function canSee(m: ModuleEntry, role: string, access: string[]): boolean {
  if (m.adminOnly) return role === "admin";
  if (!m.access) return true;
  if (role === "admin") return true;
  // NRS e-Invoicing has its own grant, and a Finance grant also opens it (it bills off Finance invoices).
  if (m.access === "einvoicing") return access.includes("einvoicing") || access.includes("finance");
  return access.includes(m.access);
}
function activeModuleId(path: string): string {
  if (path.startsWith("/crm")) return "crm";
  if (path.startsWith("/finance")) return "finance";
  if (path === "/e-invoicing" || path.startsWith("/e-invoicing/")) return "einvoicing";
  if (path.startsWith("/people")) return "hr";
  if (path.startsWith("/payroll")) return "payroll";
  if (path === "/cms" || path.startsWith("/cms/")) return "cms";
  if (path.startsWith("/settings") || path.startsWith("/audit")) return "settings";
  if (path.startsWith("/action-center")) return "action";
  return "dashboard";
}
/** The child screens for a module, so any module can expand its list without navigating there first. */
function childrenForModule(id: string, path: string): NavEntry[] {
  switch (id) {
    case "crm": return CRM_NAV;
    case "projects": return PROJECTS_NAV;
    case "finance": return FINANCE_NAV;
    case "einvoicing": return EINVOICING_NAV;
    case "hr": return HR_NAV;
    case "payroll": return PAYROLL_NAV;
    case "cms": return CMS_NAV;
    case "settings": return path.startsWith("/settings/e-invoicing") ? EINVOICING_SETTINGS_NAV : SETTINGS_NAV;
    default: return [];
  }
}

function SidebarNav({
  role,
  access,
  pathname,
  collapsed,
  onNavigate,
}: {
  role: string;
  access: string[];
  pathname: string;
  collapsed: boolean;
  onNavigate: () => void;
}): ReactNode {
  const activeId = activeModuleId(pathname);
  const modules = MODULES.filter((m) => canSee(m, role, access));
  // Each module with children expands in place (the CMS accordion pattern) so its sub-screens are one
  // click away without navigating first. An untouched module follows the active screen; once the user
  // toggles a module, their choice sticks — and persists across reloads via localStorage.
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try { const raw = localStorage.getItem("nx-nav-open"); if (raw) setOpen(JSON.parse(raw) as Record<string, boolean>); } catch { /* ignore */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem("nx-nav-open", JSON.stringify(open)); } catch { /* ignore */ }
  }, [open, loaded]);

  return (
    <nav aria-label="Sections" className="flex flex-col gap-0.5">
      {modules.map((m) => {
        const isActiveModule = m.id === activeId;

        // In the icon rail, and for leaf modules (Dashboard, CMS, Action Center), the row is a direct link.
        if (collapsed || !m.hasChildren) {
          const rowActive = isActiveModule && (!m.hasChildren || pathname === m.href);
          return (
            <Link
              key={m.id}
              href={m.href}
              onClick={onNavigate}
              title={collapsed ? m.label : undefined}
              className={`flex items-center rounded-xl py-2.5 text-[0.85rem] transition-colors ${collapsed ? "justify-center px-0" : "gap-3 px-3"} ${
                rowActive ? "bg-[#543CDA] font-600 text-white shadow-[0_4px_14px_rgba(84,60,218,0.35)]"
                  : isActiveModule ? "font-600 text-slate-900" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <m.icon size={18} strokeWidth={2} />
              {!collapsed ? m.label : null}
            </Link>
          );
        }

        const isOpen = open[m.id] ?? isActiveModule;
        const items = childrenForModule(m.id, pathname).filter((e) => !e.adminOnly || role === "admin");
        return (
          <div key={m.id}>
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [m.id]: !(o[m.id] ?? isActiveModule) }))}
              aria-expanded={isOpen}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[0.85rem] transition-colors ${
                isActiveModule ? "font-600 text-slate-900" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <m.icon size={18} strokeWidth={2} />
              <span className="flex-1 text-left">{m.label}</span>
              <ChevronDown size={15} strokeWidth={2.2} className={`shrink-0 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && items.length > 0 ? (
              <div className="mb-1 ml-[1.15rem] mt-0.5 flex flex-col gap-0.5 border-l border-slate-200 pl-2.5">
                {items.map((sub) => <SubLink key={sub.href} sub={sub} active={isActive(pathname, sub.href, items)} onNavigate={onNavigate} />)}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

function SubLink({ sub, active, onNavigate }: { sub: NavEntry; active: boolean; onNavigate: () => void }): ReactNode {
  return (
    <Link
      href={sub.href}
      onClick={onNavigate}
      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[0.8rem] transition-colors ${
        active ? "bg-[#EEEBFC] font-600 text-[#543CDA]" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <sub.icon size={15} strokeWidth={2} />
      {sub.label}
    </Link>
  );
}

const MENU_ITEM = "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.84rem] text-slate-700 hover:bg-slate-50";

/** One unread alert, as the bell shows it. The id is the ActionItem id the read state is keyed on. */
export type ShellNotification = { id: string; title: string; detail: string; href: string };

export function AdminShell({ staff, unread, notifications, access, children }: { staff: ShellStaff; unread: number; notifications: ShellNotification[]; access: string[]; children: ReactNode }): ReactNode {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const onDashboards = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const dashboards = dashboardsFor(staff.role);
  const currentDash = dashboards.find((d) => d.href === pathname) ?? dashboards[0]!;
  const firstName = staff.name.split(/\s+/)[0] ?? staff.name;

  const sidebarInner = (drawer: boolean): ReactNode => {
    const isCollapsed = collapsed && !drawer;
    return (
      <>
        <div className={`flex px-1 ${isCollapsed ? "flex-col items-center gap-3" : "items-center justify-between"}`}>
          <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 py-1">
            <img src="/logo-mark-purple.png" alt="Nexoris Technologies" className="h-8 w-8 shrink-0 object-contain" />
            {!isCollapsed ? (
              <span className="font-roboto text-[1rem] font-700 leading-none text-slate-900">
                Nexoris
                <span className="mt-1 block font-mono text-[0.5rem] font-500 tracking-[0.18em] text-slate-500">TECHNOLOGIES</span>
              </span>
            ) : null}
          </Link>
          {!drawer ? (
            <button type="button" onClick={() => setCollapsed((c) => !c)} aria-label="Collapse sidebar" className="hidden rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:block">
              <PanelLeft size={15} strokeWidth={2} />
            </button>
          ) : null}
        </div>

        <div className="mt-5 flex-1 overflow-y-auto pr-1">
          <SidebarNav role={staff.role} access={access} pathname={pathname} collapsed={isCollapsed} onNavigate={() => setMobileOpen(false)} />
        </div>

        {/* Signed-in user chip, per the design */}
        <div className="mt-4 border-t border-slate-200 pt-3">
          <Dropdown
            panelClassName="w-[200px] bottom-full mb-1"
            buttonClassName={`flex w-full items-center rounded-xl py-2 text-left hover:bg-slate-100 ${isCollapsed ? "justify-center px-0" : "gap-2.5 px-2"}`}
            label={
              <>
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#14112e] font-mono text-[0.66rem] font-700 text-white">{initials(staff.name)}</span>
                {!isCollapsed ? (
                  <>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-[0.82rem] font-600 text-slate-900">{staff.name}</span>
                      <span className="block truncate text-[0.68rem] capitalize text-slate-500">{staff.role}</span>
                    </span>
                    <ChevronDown size={14} strokeWidth={2.2} className="shrink-0 text-slate-500" />
                  </>
                ) : null}
              </>
            }
          >
            <Link href="/complete-profile" className={MENU_ITEM}><UserCog size={15} strokeWidth={2} /> Profile</Link>
            <Link href="/settings" className={MENU_ITEM}><Settings size={15} strokeWidth={2} /> Settings</Link>
            <form action="/api/auth/logout" method="post" className="border-t border-slate-100">
              <button type="submit" className={`${MENU_ITEM} w-full text-left text-red-600`}><LogOut size={15} strokeWidth={2} /> Logout</button>
            </form>
          </Dropdown>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-5 transition-[width] duration-200 lg:flex ${collapsed ? "w-[76px]" : "w-48"}`}>
        {sidebarInner(false)}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} className="absolute inset-0 cursor-pointer bg-black/50" />
          <aside className="absolute inset-y-0 left-0 flex w-[84%] max-w-[300px] flex-col overflow-y-auto border-r border-slate-200 bg-white px-3 py-5">
            <button type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-800">
              <X size={18} strokeWidth={2} />
            </button>
            {sidebarInner(true)}
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5 sm:gap-3 sm:px-5">
          <button type="button" aria-label="Open menu" onClick={() => setMobileOpen(true)} className="cursor-pointer rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden">
            <Menu size={18} strokeWidth={2} />
          </button>

          {onDashboards ? (
            <Dropdown
              buttonClassName="flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-[0.92rem] font-700 text-slate-900 hover:bg-slate-50"
              label={<>{currentDash.label} <ChevronDown size={15} strokeWidth={2.4} className="text-slate-500" /></>}
            >
              {dashboards.map((d) => (
                <Link key={d.href} href={d.href} className={`${MENU_ITEM} ${d.href === currentDash.href ? "font-600 text-[#543CDA]" : ""}`}>
                  <LayoutDashboard size={15} strokeWidth={2} /> {d.label}
                </Link>
              ))}
            </Dropdown>
          ) : null}

          <form action="/crm" className={`relative min-w-0 ${onDashboards ? "hidden md:block md:max-w-xs md:flex-1" : "flex-1 sm:max-w-md"}`}>
            <Search size={15} strokeWidth={2} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input name="q" placeholder="Search anything..." aria-label="Search" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-12 text-[0.82rem] text-slate-900 placeholder:text-slate-500 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15" />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[0.58rem] text-slate-500 sm:block">Ctrl+K</kbd>
          </form>

          <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
            <Dropdown
              align="right"
              buttonClassName="hidden cursor-pointer place-items-center rounded-full bg-[#543CDA] p-2 text-white hover:bg-[#4330B8] sm:grid"
              buttonLabel="Create new"
              label={<Plus size={16} strokeWidth={2.4} />}
            >
              <p className="px-3 py-1.5 text-[0.68rem] font-600 uppercase tracking-wide text-slate-500">Create new</p>
              <Link href="/crm/create" className={MENU_ITEM}><Contact size={15} strokeWidth={2} /> New Lead</Link>
              <Link href="/crm/templates" className={MENU_ITEM}><FileText size={15} strokeWidth={2} /> New Document</Link>
              <Link href="/finance/invoice" className={MENU_ITEM}><ReceiptText size={15} strokeWidth={2} /> New Invoice</Link>
            </Dropdown>

            <Dropdown
              align="right"
              panelClassName="w-[300px]"
              buttonClassName="relative cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              buttonLabel={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
              label={
                <>
                  <Bell size={17} strokeWidth={2} />
                  {unread > 0 ? (
                    <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#DC2626] px-1 font-mono text-[0.56rem] font-700 text-white">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  ) : null}
                </>
              }
            >
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-[0.84rem] font-700 text-slate-900">Notifications</span>
                <span className="rounded-full bg-[#EEEBFC] px-2 py-0.5 text-[0.66rem] font-600 text-[#543CDA]">{unread} unread</span>
              </div>
              {notifications.length === 0 ? (
                <span className="block px-3 py-2 text-[0.8rem] text-slate-600">Nothing unread.</span>
              ) : (
                notifications.map((n) => (
                  // Through the marking route, so reading one here marks it read, exactly as it does
                  // in the Action Center itself.
                  <Link
                    key={n.id}
                    href={`/api/notifications?id=${encodeURIComponent(n.id)}&to=${encodeURIComponent(n.href)}`}
                    className="block border-t border-slate-100 px-3 py-2 first:border-t-0 hover:bg-slate-50"
                  >
                    <span className="block truncate text-[0.8rem] font-600 text-slate-900">{n.title}</span>
                    <span className="block truncate text-[0.74rem] text-slate-600">{n.detail}</span>
                  </Link>
                ))
              )}
              <Link href="/action-center" className="block border-t border-slate-100 px-3 py-2 text-center text-[0.8rem] font-600 text-[#543CDA] hover:bg-slate-50">View all</Link>
            </Dropdown>

            <Dropdown
              align="right"
              panelClassName="w-[220px]"
              buttonClassName="flex cursor-pointer items-center gap-2 rounded-full py-1 pl-1 pr-1 hover:bg-slate-50"
              buttonLabel={`Account menu for ${staff.name}`}
              label={
                <>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#14112e] font-mono text-[0.66rem] font-700 text-white">{initials(staff.name)}</span>
                  <span className="hidden leading-tight md:block">
                    <span className="block max-w-[120px] truncate text-[0.8rem] font-600 text-slate-900">{staff.name}</span>
                    <span className="block text-[0.68rem] capitalize text-slate-500">{staff.role}</span>
                  </span>
                  <ChevronDown size={14} strokeWidth={2.2} className="hidden text-slate-500 md:block" />
                </>
              }
            >
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="truncate text-[0.84rem] font-600 text-slate-900">{staff.name}</p>
                <p className="text-[0.72rem] capitalize text-slate-500">{staff.role}</p>
              </div>
              <Link href="/complete-profile" className={MENU_ITEM}><UserCog size={15} strokeWidth={2} /> Profile</Link>
              <Link href="/users/sessions" className={MENU_ITEM}><LayoutGrid size={15} strokeWidth={2} /> Active sessions</Link>
              <Link href="/settings" className={MENU_ITEM}><Settings size={15} strokeWidth={2} /> Settings</Link>
              <form action="/api/auth/logout" method="post" className="border-t border-slate-100">
                <button type="submit" className={`${MENU_ITEM} w-full text-left text-red-600`}><LogOut size={15} strokeWidth={2} /> Sign out</button>
              </form>
            </Dropdown>
          </div>
        </header>

        <main className="min-w-0 flex-1 px-3 py-5 sm:px-5 sm:py-6 lg:px-7">{children}</main>
      </div>

      {/* The Oge assistant, floating on every screen. Answers within the user's permissions. */}
      <OgeWidget firstName={firstName} />
    </div>
  );
}
