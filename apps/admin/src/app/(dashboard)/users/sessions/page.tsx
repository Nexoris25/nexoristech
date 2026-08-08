/**
 * Active Sessions. Every device currently signed in to this account, and a way to end any of them.
 *
 * The screen used to list three invented devices — a Mac in Abuja, an iPhone in Lagos, a Windows machine
 * in Port Harcourt, with invented IP addresses and dates — and its sign-out buttons did nothing, because
 * sessions were a signed cookie with no record anywhere. Every row here is a real staff_session row, and
 * ending one takes effect on the next request that session makes.
 *
 * Signed-in staff, scoped to their own sessions.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, Monitor, Smartphone, ShieldAlert, ShieldCheck, LogOut } from "lucide-react";
import { requireStaff } from "../../../../lib/auth.js";
import { listSessions } from "../../../../lib/sessions.js";

export const dynamic = "force-dynamic";

/** A relative description, because "3 minutes ago" is what tells you whether a session is yours. */
function ago(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function when(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
}

const MOBILE = /iPhone|iPad|Android/i;

export default async function ActiveSessionsPage({ searchParams }: {
  searchParams: Promise<{ done?: string }>;
}): Promise<ReactNode> {
  const staff = await requireStaff();
  const [sessions, { done }] = await Promise.all([listSessions(staff.id), searchParams]);

  const current = sessions.find((s) => s.id === staff.sessionId) ?? null;
  const others = sessions.filter((s) => s.id !== staff.sessionId);
  const ended = done?.startsWith("ended-") ? Number(done.slice(6)) : 0;

  return (
    <div className="mx-auto max-w-4xl">
      <nav className="flex items-center gap-1.5 text-[0.78rem] text-slate-600">
        <Link href="/settings" className="hover:text-[#543CDA]">Security</Link>
        <ChevronRight size={13} strokeWidth={2} />
        <span className="text-slate-700">Active sessions</span>
      </nav>
      <h1 className="mt-2 text-[1.4rem] font-700 text-slate-900">Active sessions</h1>
      <p className="mt-1 text-[0.86rem] text-slate-600">
        Every device signed in to your account. End any you do not recognise.
      </p>

      {ended > 0 && (
        <p role="status" className="mt-4 rounded-xl border border-[#BBF7D0] bg-[#DCFCE7] px-4 py-3 text-[0.84rem] font-600 text-[#15803D]">
          {ended === 1 ? "That session was ended." : `${ended} sessions were ended.`} They are signed out on their next request.
        </p>
      )}
      {done === "none" && (
        <p role="status" className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[0.84rem] font-600 text-slate-700">
          Nothing to end.
        </p>
      )}

      <section className="mt-5 rounded-2xl border border-[#DDD6FE] bg-[#F4F1FD] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-[#543CDA] shadow-subtle">
              <ShieldCheck size={18} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-[0.9rem] font-700 text-slate-900">This device</p>
              {current ? (
                <>
                  <p className="mt-1 text-[0.83rem] text-slate-700">
                    {current.device ?? "Unrecognised browser"}
                    {current.ip ? ` · ${current.ip}` : ""}
                  </p>
                  <p className="text-[0.78rem] text-slate-600">
                    Signed in {when(current.created_at)} · expires {when(current.expires_at)}
                  </p>
                </>
              ) : (
                <p className="mt-1 max-w-xl text-[0.82rem] leading-relaxed text-slate-700">
                  This sign-in happened before sessions were recorded, so it cannot be listed or ended
                  here. Sign out and back in and it will appear.
                </p>
              )}
            </div>
          </div>
          <span className="shrink-0 text-[0.8rem] font-600 text-[#15803D]">Active now</span>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Other sessions</h2>
          {others.length > 0 && (
            <form action="/api/sessions/revoke" method="post">
              <input type="hidden" name="all" value="1" />
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg border border-[#FECACA] bg-white px-3 py-2 text-[0.8rem] font-600 text-[#B91C1C] hover:bg-red-50">
                <LogOut size={14} strokeWidth={2} /> End all others
              </button>
            </form>
          )}
        </div>

        {others.length === 0 ? (
          <p className="mt-3 text-[0.84rem] text-slate-600">No other device is signed in to your account.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {others.map((s) => {
              const Icon = MOBILE.test(s.device ?? "") ? Smartphone : Monitor;
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                    <Icon size={17} strokeWidth={2} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.86rem] font-600 text-slate-900">{s.device ?? "Unrecognised browser"}</span>
                    <span className="block text-[0.78rem] text-slate-600">
                      {s.ip ? `${s.ip} · ` : ""}last active {ago(s.last_seen_at)}
                    </span>
                    <span className="block text-[0.74rem] text-slate-600">Signed in {when(s.created_at)}</span>
                  </span>
                  <form action="/api/sessions/revoke" method="post" className="shrink-0">
                    <input type="hidden" name="session_id" value={s.id} />
                    <button type="submit" className="rounded-lg border border-slate-200 px-3 py-2 text-[0.8rem] font-600 text-[#B91C1C] hover:border-[#FECACA] hover:bg-red-50">
                      End session
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-4 flex items-start gap-3 rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-5">
        <ShieldAlert size={18} strokeWidth={2} className="mt-0.5 shrink-0 text-[#B45309]" />
        <p className="text-[0.84rem] leading-relaxed text-[#78350F]">
          If a session here is not yours, end it and change your password. Ending a session takes effect
          on that device&apos;s next request.
        </p>
      </section>
    </div>
  );
}
