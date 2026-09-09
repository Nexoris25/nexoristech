"use client";
/**
 * The Nexoris CMS shell (owner's CMS design): a white sidebar with the brand lockup and a grouped,
 * collapsible navigation, and a white top bar with global search, notifications, help, and the user
 * menu. The CMS is a module of the platform - the logo returns to the main dashboard - but has its own
 * dedicated chrome because it is a large sub-application. Collapses to a rail; slides in as a drawer
 * below lg.
 */
import type { ComponentType, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Lightbulb, FolderTree, PenLine, FileCode, LayoutTemplate, FileText, ShieldCheck, Database,
  Briefcase, Inbox, BookOpen, Quote, Scale, Image as ImageIcon, Library, SlidersHorizontal, BarChart3, ListChecks,
  FileClock, Search, Shuffle, Network, Bot, Activity, UsersRound, KeyRound, Settings, Menu, ChevronDown, ChevronRight,
  Bell, HelpCircle, X, Sparkles,
} from "lucide-react";
import { PLATFORM_VERSION } from "../../lib/version.js";
import { AccountMenu } from "../AccountMenu.js";

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
interface Item { icon: Icon; label: string; href: string }
interface Group { section: string | null; items: Item[] }

const NAV: Group[] = [
  { section: null, items: [{ icon: LayoutDashboard, label: "Dashboard", href: "/cms" }] },
  { section: "Content", items: [
    { icon: Lightbulb, label: "Insights", href: "/cms/insights" },
    { icon: FolderTree, label: "Categories", href: "/cms/categories" },
    { icon: PenLine, label: "Authors", href: "/cms/authors" },
  ] },
  { section: "Programmatic SEO", items: [
    { icon: FileCode, label: "Generated Pages", href: "/cms/generated-pages" },
    { icon: LayoutTemplate, label: "Templates", href: "/cms/templates" },
    { icon: FileText, label: "Proposals", href: "/cms/proposals" },
    { icon: ShieldCheck, label: "Quality Gate", href: "/cms/quality-gate" },
    { icon: Database, label: "Data Readiness", href: "/cms/data-readiness" },
  ] },
  { section: "Careers", items: [
    { icon: LayoutDashboard, label: "Dashboard", href: "/cms/careers" },
    { icon: Briefcase, label: "Jobs", href: "/cms/jobs" },
    { icon: Inbox, label: "Applications", href: "/cms/applications" },
    { icon: FolderTree, label: "Departments", href: "/cms/departments" },
    { icon: Settings, label: "Settings", href: "/cms/careers/settings" },
  ] },
  { section: "Proof Library", items: [
    { icon: BookOpen, label: "Case Studies", href: "/cms/case-studies" },
    { icon: Quote, label: "Testimonials", href: "/cms/testimonials" },
    { icon: Scale, label: "Legal Pages", href: "/cms/legal-pages" },
  ] },
  { section: null, items: [{ icon: ImageIcon, label: "Media Library", href: "/cms/media" }] },
  { section: "Oge AI Workspace", items: [
    { icon: LayoutDashboard, label: "Dashboard", href: "/cms/ai" },
    { icon: Library, label: "Knowledge Base", href: "/cms/ai/knowledge-base" },
    { icon: SlidersHorizontal, label: "AI Configuration", href: "/cms/ai/configuration" },
    { icon: BarChart3, label: "AI Analytics", href: "/cms/ai/analytics" },
  ] },
  { section: "Workflow", items: [
    { icon: ListChecks, label: "Review Queue", href: "/cms/review-queue" },
    { icon: FileClock, label: "Activity Log", href: "/cms/activity-log" },
  ] },
  { section: "SEO Operations", items: [
    { icon: Search, label: "SEO Settings", href: "/cms/seo/settings" },
    { icon: Shuffle, label: "Redirect Manager", href: "/cms/seo/redirects" },
    { icon: Network, label: "Sitemap Manager", href: "/cms/seo/sitemap" },
    { icon: Bot, label: "Robots.txt Manager", href: "/cms/seo/robots" },
    { icon: ListChecks, label: "Indexing Status", href: "/cms/seo/indexing" },
    { icon: Search, label: "Search Console", href: "/cms/seo/search-console" },
    { icon: Sparkles, label: "AI Visibility", href: "/cms/seo/ai-visibility" },
    { icon: Activity, label: "Crawl Health", href: "/cms/seo/crawl-health" },
  ] },
  { section: "Administration", items: [
    { icon: UsersRound, label: "Users", href: "/cms/admin/users" },
    { icon: ShieldCheck, label: "Roles", href: "/cms/admin/roles" },
    { icon: KeyRound, label: "Permissions", href: "/cms/admin/permissions" },
  ] },
  { section: "Settings", items: [
    { icon: Settings, label: "Global Settings", href: "/cms/settings" },
  ] },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/cms") return pathname === "/cms";
  if (href === "/cms/ai") return pathname === "/cms/ai";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Sidebar({ staff, pathname, onNavigate }: { staff: { name: string; role: string }; pathname: string; onNavigate: () => void }): ReactNode {
  return (
    <>
      <Link href="/dashboard" className="flex items-center gap-2.5 px-4 py-4" title="Back to the platform">
        <img src="/logo-mark-purple.png" alt="Nexoris Technologies" className="h-8 w-8 shrink-0 object-contain" />
        <span className="text-[1rem] font-700 text-slate-900">Nexoris CMS</span>
      </Link>
      <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="CMS sections">
        {NAV.map((group, gi) => (
          <NavGroup key={group.section ?? `g${gi}`} group={group} pathname={pathname} onNavigate={onNavigate} />
        ))}
      </nav>
      {/* The signed-in person sits at the foot of the rail here too, where the dashboard puts them,
          so the same thing is in the same place whichever shell you are in. */}
      <div className="border-t border-slate-200 px-3 py-3">
        <AccountMenu
          staff={staff}
          variant="sidebar"
          settingsHref="/cms/settings"
          roleLabel={staff.role === "admin" ? "Super Admin" : staff.role}
        />
      </div>
    </>
  );
}

function NavGroup({ group, pathname, onNavigate }: { group: Group; pathname: string; onNavigate: () => void }): ReactNode {
  const hasActive = group.items.some((i) => isActive(pathname, i.href));
  const [open, setOpen] = useState(true);
  const link = (i: Item): ReactNode => {
    const active = isActive(pathname, i.href);
    return (
      <Link key={i.href} href={i.href} onClick={onNavigate}
        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.83rem] transition-colors ${
          active ? "bg-[#543CDA] font-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
        <i.icon size={16} strokeWidth={2} /> {i.label}
      </Link>
    );
  };
  if (!group.section) return <div className="mb-0.5 mt-1">{group.items.map(link)}</div>;
  return (
    <div className="mt-3">
      <button type="button" onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between px-3 pb-1 text-[0.66rem] font-700 uppercase tracking-wider ${hasActive ? "text-[#543CDA]" : "text-slate-500"} hover:text-slate-600`}>
        {group.section}{open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>
      {open ? <div className="flex flex-col gap-0.5">{group.items.map(link)}</div> : null}
    </div>
  );
}

interface NotifItem { id: string; title: string; detail: string; href: string; ago: string }

export function CmsShell({ staff, notifications, notificationItems = [], children }: { staff: { name: string; role: string }; notifications: number; notificationItems?: NotifItem[]; children: ReactNode }): ReactNode {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!bellOpen) return;
    const onDown = (e: MouseEvent): void => { if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false); };
    const onKey = (e: KeyboardEvent): void => { if (e.key === "Escape") setBellOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [bellOpen]);

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <aside className="sticky top-0 hidden h-screen w-[13.2rem] shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <Sidebar staff={staff} pathname={pathname} onNavigate={() => undefined} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} className="absolute inset-0 cursor-pointer bg-black/40" />
          <aside className="absolute inset-y-0 left-0 flex w-[82%] max-w-[300px] flex-col overflow-y-auto border-r border-slate-200 bg-white">
            <button type="button" aria-label="Close" onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"><X size={18} /></button>
            <Sidebar staff={staff} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-2.5 sm:px-5">
          <button type="button" aria-label="Open menu" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"><Menu size={18} /></button>
          <div className="relative min-w-0 flex-1 sm:max-w-xl">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input placeholder="Search content, pages, authors..." aria-label="Search" className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-12 text-[0.84rem] text-slate-900 placeholder:text-slate-400 focus:border-[#543CDA] focus:bg-white focus:outline-none" />
            <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[0.6rem] text-slate-500 sm:block">⌘K</kbd>
          </div>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <div ref={bellRef} className="relative">
              <button type="button" aria-label="Notifications" aria-haspopup="menu" aria-expanded={bellOpen} onClick={() => setBellOpen((o) => !o)} className="relative grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100">
                <Bell size={18} />{notifications > 0 ? <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#DC2626] px-1 text-[0.58rem] font-700 text-white">{notifications > 99 ? "99+" : notifications}</span> : null}
              </button>
              {bellOpen ? (
                <div role="menu" className="absolute right-0 z-50 mt-1.5 w-[320px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                    <span className="text-[0.84rem] font-700 text-slate-900">Notifications</span>
                    <span className="rounded-full bg-[#EEEBFC] px-2 py-0.5 text-[0.66rem] font-600 text-[#543CDA]">{notifications} to review</span>
                  </div>
                  {notificationItems.length === 0 ? (
                    <p className="px-4 py-6 text-center text-[0.82rem] text-slate-500">You are all caught up.</p>
                  ) : (
                    <ul className="max-h-[320px] overflow-y-auto py-1">
                      {notificationItems.map((n) => (
                        <li key={n.id}>
                          <Link href={n.href} onClick={() => setBellOpen(false)} className="flex items-start gap-2.5 px-4 py-2.5 hover:bg-slate-50">
                            <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#FEF3C7] text-[#B45309]"><ListChecks size={14} /></span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[0.82rem] font-600 text-slate-800">{n.title}</span>
                              <span className="block text-[0.72rem] text-slate-500">{n.detail} · {n.ago}</span>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link href="/cms/review-queue" onClick={() => setBellOpen(false)} className="block border-t border-slate-100 px-4 py-2.5 text-center text-[0.8rem] font-600 text-[#543CDA] hover:bg-slate-50">Open review queue</Link>
                </div>
              ) : null}
            </div>
            <Link href="/cms/settings" aria-label="Help and settings" className="hidden h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 sm:grid"><HelpCircle size={18} /></Link>
            {/* Was a plain div with a chevron: it looked like the dashboard's account menu and did
                nothing, which left every CMS route with no way to reach a profile or sign out. */}
            <AccountMenu
              staff={staff}
              variant="header"
              settingsHref="/cms/settings"
              roleLabel={staff.role === "admin" ? "Super Admin" : staff.role}
            />
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6">
          {children}
          <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-[0.72rem] text-slate-500">
            <span>© {new Date().getFullYear()} Nexoris Technologies. All rights reserved.</span>
            <span className="flex gap-3"><span>Version {PLATFORM_VERSION}</span><Link href="/cms/settings" className="hover:text-slate-600">Support</Link><Link href="/cms/settings" className="hover:text-slate-600">Documentation</Link></span>
          </footer>
        </main>
      </div>
    </div>
  );
}
