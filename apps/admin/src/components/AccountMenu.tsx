"use client";
/**
 * The signed-in person's menu: who you are, how to reach your own record, and how to sign out.
 *
 * One component, used everywhere it appears — the dashboard top bar, the dashboard sidebar, and the
 * CMS top bar. It existed in three forms before, and only two of them worked. The CMS rendered a
 * plain div carrying a name, a role and a chevron: it looked exactly like the menu on the dashboard,
 * announced nothing to a screen reader, and did nothing when clicked. Every /cms route therefore had
 * no route to a profile and, worse, no way to sign out, so leaving the CMS meant editing the URL.
 * The two that did work offered different items to each other, so the same chevron gave you a
 * different menu depending on where you clicked it.
 *
 * Sign-out is a form posting to the logout route rather than a link, because signing out changes
 * state on the server and must not be something a prefetch or a crawler can trigger.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, KeyRound, LayoutGrid, LogOut, Settings, UserCog } from "lucide-react";
import { Dropdown } from "./Dropdown.js";

const MENU_ITEM =
  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[0.84rem] text-slate-700 hover:bg-slate-50";

export interface AccountMenuStaff {
  name: string;
  role: string;
}

/** Two initials, the same everywhere the person is shown as a circle. */
export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function AccountMenu({
  staff,
  variant = "header",
  collapsed = false,
  settingsHref = "/settings",
  roleLabel,
}: {
  staff: AccountMenuStaff;
  /** "header" sits in a top bar and opens downwards; "sidebar" sits at the foot and opens upwards. */
  variant?: "header" | "sidebar";
  /** Sidebar only: the rail is narrowed to icons, so the name and chevron are hidden. */
  collapsed?: boolean;
  /**
   * Where "Settings" goes. The CMS has its own settings screen, and the dashboard's lives behind a
   * layout that sends a CMS-only user back to /cms — so pointing both at one page would hand some
   * people a link that bounces them.
   */
  settingsHref?: string;
  /** Overrides the displayed role, for shells that name it differently. */
  roleLabel?: string;
}): ReactNode {
  const sidebar = variant === "sidebar";
  const role = roleLabel ?? staff.role;

  return (
    <Dropdown
      align={sidebar ? "left" : "right"}
      panelClassName={sidebar ? "w-[200px] bottom-full mb-1" : "w-[220px]"}
      buttonClassName={
        sidebar
          ? `flex w-full items-center rounded-xl py-2 text-left hover:bg-slate-100 ${collapsed ? "justify-center px-0" : "gap-2.5 px-2"}`
          : "flex cursor-pointer items-center gap-2 rounded-full py-1 pl-1 pr-1 hover:bg-slate-50"
      }
      buttonLabel={`Account menu for ${staff.name}`}
      label={
        <>
          <span
            className={`grid shrink-0 place-items-center rounded-full bg-[#14112e] font-mono font-700 text-white ${sidebar ? "h-9 w-9 text-[0.66rem]" : "h-8 w-8 text-[0.66rem]"}`}
          >
            {initialsOf(staff.name)}
          </span>
          {sidebar ? (
            collapsed ? null : (
              <>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate text-[0.82rem] font-600 text-slate-900">{staff.name}</span>
                  <span className="block truncate text-[0.68rem] capitalize text-slate-500">{role}</span>
                </span>
                <ChevronDown size={14} strokeWidth={2.2} className="shrink-0 text-slate-500" />
              </>
            )
          ) : (
            <>
              <span className="hidden leading-tight md:block">
                <span className="block max-w-[130px] truncate text-[0.8rem] font-600 text-slate-900">{staff.name}</span>
                <span className="block text-[0.68rem] capitalize text-slate-500">{role}</span>
              </span>
              <ChevronDown size={14} strokeWidth={2.2} className="hidden text-slate-500 md:block" />
            </>
          )}
        </>
      }
    >
      {/* The name is repeated inside the panel because the trigger hides it below md. */}
      <div className="border-b border-slate-100 px-3 py-2">
        <p className="truncate text-[0.84rem] font-600 text-slate-900">{staff.name}</p>
        <p className="text-[0.72rem] capitalize text-slate-500">{role}</p>
      </div>
      <Link href="/complete-profile" className={MENU_ITEM}>
        <UserCog size={15} strokeWidth={2} /> Profile
      </Link>
      <Link href="/account" className={MENU_ITEM}>
        <KeyRound size={15} strokeWidth={2} /> Your account
      </Link>
      <Link href="/users/sessions" className={MENU_ITEM}>
        <LayoutGrid size={15} strokeWidth={2} /> Active sessions
      </Link>
      <Link href={settingsHref} className={MENU_ITEM}>
        <Settings size={15} strokeWidth={2} /> Settings
      </Link>
      <form action="/api/auth/logout" method="post" className="border-t border-slate-100">
        <button type="submit" className={`${MENU_ITEM} w-full text-left text-red-600`}>
          <LogOut size={15} strokeWidth={2} /> Sign out
        </button>
      </form>
    </Dropdown>
  );
}
