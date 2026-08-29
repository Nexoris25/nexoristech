"use client";
/**
 * Invite a user (PRD 3.2). Two ways in: pick someone already onboarded in HR who has no login yet, or
 * type a name and email for a new person. Either way it creates the login account, links it to the HR
 * record where there is one, and issues a link the person follows to set their own password.
 *
 * The invitation is emailed, and the link also comes back on the access screen to copy. Both, on
 * purpose: the email is the route in, and the copyable link is what turns a mail provider being down
 * into a delay rather than a lockout.
 *
 * An address is always required, including on the HR path. An employee record without one used to be
 * offered in the picker as "(no email on record)" and then rejected on submit, so the accounts most
 * likely to be platform-only were the ones that could not be created. Picking such a person now
 * reveals a box for the address to send to.
 *
 * Posts natively to /api/access so it works framed.
 */
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { UserPlus, X } from "lucide-react";

export interface InvitableEmployee { id: string; name: string; email: string }

export function InviteUser({ employees, emailReady = false }: { employees: InvitableEmployee[]; emailReady?: boolean }): ReactNode {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"employee" | "new">(employees.length > 0 ? "employee" : "new");
  // Which employee is selected, so the address box can appear exactly when their record has none.
  const [picked, setPicked] = useState<string>(employees[0]?.id ?? "");
  const pickedEmail = employees.find((e) => e.id === picked)?.email ?? "";
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const field = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.85rem] text-slate-900 placeholder:text-slate-400 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15";
  const tab = (on: boolean): string => `rounded-lg px-3 py-1.5 text-[0.78rem] font-600 ${on ? "bg-[#543CDA] text-white" : "text-slate-600 hover:bg-slate-100"}`;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#543CDA] px-4 py-2 text-[0.82rem] font-600 text-white hover:bg-[#4330B8]">
        <UserPlus size={15} strokeWidth={2.4} /> Invite user
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Invite a user">
          <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="absolute inset-0 cursor-default bg-black/40" />
          <div ref={ref} className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[1.05rem] font-700 text-slate-900">Invite a user</h2>
                {/* What will actually happen, which depends on whether a provider is configured.
                    Promising an email that cannot be sent is how an admin closes this dialog believing
                    the person has been contacted. */}
                <p className="mt-1 text-[0.82rem] text-slate-500">
                  {emailReady
                    ? "They get an email with a link, and you get the same link to copy. They set their own password and sign in. Grant modules once they do."
                    : "You get a link to send them however you like. They open it, set their own password, and sign in. Grant modules once they do."}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-slate-100"><X size={17} /></button>
            </div>

            <div className="mt-4 inline-flex rounded-lg border border-slate-200 p-0.5">
              <button type="button" onClick={() => setMode("employee")} className={tab(mode === "employee")}>From HR</button>
              <button type="button" onClick={() => setMode("new")} className={tab(mode === "new")}>New person</button>
            </div>

            {mode === "employee" ? (
              <form action="/api/access" method="post" className="mt-4 flex flex-col gap-3">
                <input type="hidden" name="action" value="invite" />
                {employees.length === 0 ? (
                  <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-[0.82rem] text-slate-600">Everyone onboarded in HR already has a login. Use <span className="font-600">New person</span> instead.</p>
                ) : (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[0.8rem] font-600 text-slate-700">Employee</span>
                    <select name="employeeId" required value={picked} onChange={(e) => setPicked(e.target.value)} className={`cursor-pointer ${field}`}>
                      {employees.map((e) => <option key={e.id} value={e.id}>{e.name}{e.email ? ` — ${e.email}` : " (no email on record)"}</option>)}
                    </select>
                  </label>
                )}
                {employees.length > 0 && !pickedEmail ? (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[0.8rem] font-600 text-slate-700">Email address</span>
                    <input name="email" type="email" required placeholder="name@nexoristech.com" className={field} />
                    <span className="text-[0.74rem] text-slate-500">This person has no address on their HR record, and the invitation has to be sent somewhere.</span>
                  </label>
                ) : null}
                <button type="submit" disabled={employees.length === 0} className="mt-1 rounded-lg bg-[#543CDA] px-4 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8] disabled:cursor-not-allowed disabled:opacity-50">Create invitation link</button>
              </form>
            ) : (
              <form action="/api/access" method="post" className="mt-4 flex flex-col gap-3">
                <input type="hidden" name="action" value="invite" />
                <label className="flex flex-col gap-1.5"><span className="text-[0.8rem] font-600 text-slate-700">Full name</span>
                  <input name="name" required placeholder="e.g. Amaka Obi" className={field} />
                </label>
                <label className="flex flex-col gap-1.5"><span className="text-[0.8rem] font-600 text-slate-700">Work email</span>
                  <input name="email" type="email" required placeholder="name@nexoristech.com" className={field} />
                </label>
                <p className="text-[0.74rem] text-slate-500">People are normally created in HR onboarding. Use this for contractors and platform-only accounts.</p>
                <button type="submit" className="mt-1 rounded-lg bg-[#543CDA] px-4 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]">Create invitation link</button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
