"use client";
/**
 * The signed-in dashboard shell, matching the approved Nexoris Technologies dashboard design (the
 * homepage product mockup at full scale): an ink sidebar with the brand lockup and grouped module
 * navigation, and a white top bar with global search, notifications, and the signed-in staff chip.
 * The sidebar is fixed on large screens and a slide-in drawer below them, correct down to 360px.
 * Modules not yet built are shown disabled with a "Soon" tag rather than as dead links.
 */
import type { ComponentType, ReactNode } from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgePercent,
  Bell,
  ChevronDown,
  Coins,
  Contact,
  FileClock,
  Inbox,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  UsersRound,
  Wallet,
  X,
} from "lucide-react";

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

export interface ShellStaff {
  name: string;
  role: string;
}

interface SubEntry {
  label: string;
  href: string;
  adminOnly?: boolean;
}

interface NavEntry {
  icon: Icon;
  label: string;
  href?: string;
  adminOnly?: boolean;
  children?: SubEntry[];
}

interface NavGroup {
  label?: string;
  entries: NavEntry[];
}

const CRM_SUBNAV: SubEntry[] = [
  { label: "Leads", href: "/crm" },
  { label: "SLA board", href: "/crm/sla" },
  { label: "Performance", href: "/crm/performance" },
  { label: "Reassignment queue", href: "/crm/reassignment", adminOnly: true },
  { label: "Sales reps", href: "/crm/reps", adminOnly: true },
  { label: "Templates", href: "/crm/templates" },
];

const NAV: NavGroup[] = [
  {
    entries: [{ icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" }],
  },
  {
    label: "Modules",
    entries: [
      { icon: Contact, label: "CRM", href: "/crm", children: CRM_SUBNAV },
      { icon: Wallet, label: "Finance" },
      { icon: UsersRound, label: "HR" },
      { icon: Coins, label: "Payroll" },
    ],
  },
  {
    label: "Commission",
    entries: [{ icon: BadgePercent, label: "Commission Engine" }],
  },
  {
    label: "Tools",
    entries: [
      { icon: Inbox, label: "Action Center" },
      { icon: FileClock, label: "Audit Log" },
    ],
  },
  {
    label: "Settings",
    entries: [{ icon: ShieldCheck, label: "People & Access", href: "/people", adminOnly: true }],
  },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function SidebarNav({
  role,
  pathname,
  onNavigate,
}: {
  role: string;
  pathname: string;
  onNavigate: () => void;
}): ReactNode {
  return (
    <nav aria-label="Modules" className="flex flex-col">
      {NAV.map((group, gi) => (
        <div key={group.label ?? gi}>
          {group.label ? (
            <p className="px-3 pb-1 pt-5 font-mono text-[0.62rem] uppercase tracking-[.14em] text-purple-100/50">
              {group.label}
            </p>
          ) : null}
          {group.entries
            .filter((entry) => !entry.adminOnly || role === "admin")
            .map((entry) => {
              const active =
                entry.href !== undefined &&
                (pathname === entry.href || pathname.startsWith(`${entry.href}/`));
              if (!entry.href) {
                return (
                  <span
                    key={entry.label}
                    className="flex items-center gap-2.5 rounded-card px-3 py-2 text-label text-purple-100/40"
                    aria-disabled="true"
                  >
                    <entry.icon size={16} strokeWidth={2} />
                    {entry.label}
                    <span className="ml-auto rounded-full border border-purple-100/20 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-purple-100/40">
                      Soon
                    </span>
                  </span>
                );
              }
              const children = entry.children?.filter(
                (child) => !child.adminOnly || role === "admin",
              );
              return (
                <div key={entry.label}>
                  <Link
                    href={entry.href}
                    onClick={onNavigate}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-card px-3 py-2 text-label transition-colors ${
                      active
                        ? "bg-purple-600 font-600 text-white"
                        : "text-purple-100/70 hover:bg-ink-800 hover:text-white"
                    }`}
                  >
                    <entry.icon size={16} strokeWidth={2} />
                    {entry.label}
                    {children && children.length > 0 ? (
                      <ChevronDown
                        size={14}
                        strokeWidth={2.4}
                        className={`ml-auto transition-transform ${active ? "rotate-180" : ""}`}
                      />
                    ) : null}
                  </Link>
                  {children && children.length > 0 && active ? (
                    <div className="mb-1 ml-[22px] mt-0.5 flex flex-col border-l border-ink-800 pl-2">
                      {children.map((child) => {
                        const childActive =
                          pathname === child.href ||
                          (child.href !== entry.href &&
                            pathname.startsWith(`${child.href}/`));
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onNavigate}
                            className={`cursor-pointer rounded-card px-3 py-1.5 text-[0.8rem] transition-colors ${
                              childActive
                                ? "font-600 text-white"
                                : "text-purple-100/60 hover:text-white"
                            }`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({
  staff,
  newLeadCount,
  signOutAction,
  children,
}: {
  staff: ShellStaff;
  newLeadCount: number;
  signOutAction: () => Promise<void>;
  children: ReactNode;
}): ReactNode {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const sidebarInner = (
    <>
      <Link
        href="/dashboard"
        onClick={() => setOpen(false)}
        className="flex cursor-pointer items-center gap-2.5 px-2 py-1"
      >
        <img src="/logo-mark-white.png" alt="" className="h-7 w-auto" />
        <span className="font-roboto text-[0.95rem] font-700 leading-tight text-white">
          Nexoris
          <span className="block font-mono text-[0.55rem] font-500 tracking-[.14em] text-purple-100/60">
            TECHNOLOGIES
          </span>
        </span>
      </Link>
      <div className="mt-4 flex-1 overflow-y-auto pr-1">
        <SidebarNav role={staff.role} pathname={pathname} onNavigate={() => setOpen(false)} />
      </div>
      <div className="mt-4 border-t border-ink-800 pt-4">
        <p className="truncate px-2 text-label font-600 text-white">{staff.name}</p>
        <p className="px-2 text-[0.72rem] capitalize text-purple-100/60">{staff.role}</p>
        <form action={signOutAction} className="mt-2 px-2 pb-1">
          <button
            type="submit"
            className="flex cursor-pointer items-center gap-2 text-label text-purple-100/70 hover:text-white"
          >
            <LogOut size={15} strokeWidth={2} />
            Sign out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-neutral-50 lg:flex">
      {/* Fixed sidebar on large screens */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-ink-950 px-3 py-6 lg:flex">
        {sidebarInner}
      </aside>

      {/* Drawer below lg */}
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-pointer bg-ink-950/60"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[82%] max-w-[280px] flex-col overflow-y-auto bg-ink-950 px-3 py-6">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 cursor-pointer rounded-card p-1.5 text-purple-100/70 hover:bg-ink-800 hover:text-white"
            >
              <X size={18} strokeWidth={2} />
            </button>
            {sidebarInner}
          </aside>
        </div>
      ) : null}

      {/* Main column */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-2 border-b border-purple-200 bg-white px-3 py-2.5 sm:gap-3 sm:px-5">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="cursor-pointer rounded-card p-2 text-ink-950 hover:bg-purple-100 lg:hidden"
          >
            <Menu size={18} strokeWidth={2} />
          </button>

          <form action="/crm" className="min-w-0 flex-1">
            <label className="relative block">
              <Search
                size={15}
                strokeWidth={2}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600"
                aria-hidden="true"
              />
              <input
                type="search"
                name="q"
                placeholder="Search leads by name, email, or company"
                aria-label="Search leads"
                className="w-full rounded-card border border-neutral-200 bg-neutral-50 py-2 pl-9 pr-3 text-[0.82rem] text-ink-950 placeholder:text-neutral-600/70 focus:border-purple-500"
              />
            </label>
          </form>

          <Link
            href="/crm"
            aria-label={`${newLeadCount} new lead${newLeadCount === 1 ? "" : "s"}`}
            className="relative cursor-pointer rounded-card p-2 text-neutral-600 hover:bg-purple-100 hover:text-ink-950"
          >
            <Bell size={17} strokeWidth={2} />
            {newLeadCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-purple-600 px-1 font-mono text-[0.58rem] font-700 text-white">
                {newLeadCount > 99 ? "99+" : newLeadCount}
              </span>
            ) : null}
          </Link>

          <span className="flex items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-purple-600 font-mono text-[0.68rem] font-700 text-white">
              {initials(staff.name)}
            </span>
            <span className="hidden leading-tight md:block">
              <span className="block max-w-[140px] truncate text-[0.8rem] font-600 text-ink-950">
                {staff.name}
              </span>
              <span className="block text-[0.68rem] capitalize text-neutral-600">
                {staff.role}
              </span>
            </span>
          </span>
        </header>

        <main className="min-w-0 flex-1 px-3 py-5 sm:px-5 sm:py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
