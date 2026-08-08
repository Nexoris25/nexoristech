/**
 * Your profile. The details the platform holds about you, and the ones you may correct yourself.
 *
 * This screen was a four-step onboarding shell prefilled with "John Doe" and john.doe@nexoris.com, whose
 * form posted to /dashboard and saved nothing. It now loads the signed-in person's staff and employee
 * records and writes back through /api/profile.
 *
 * The read-only column is deliberate: role, department, salary and employment status are decisions made
 * about you by HR, and a screen that let you type over them would be lying about what it saves.
 *
 * Signed-in staff, scoped to their own record.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, UserRound } from "lucide-react";
import { requireStaff } from "../../lib/auth.js";
import { db } from "../../lib/db.js";

export const dynamic = "force-dynamic";

const FIELD =
  "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[0.88rem] text-slate-900 placeholder:text-slate-500 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15";
const LABEL = "text-[0.8rem] font-600 text-slate-700";

interface Profile {
  email: string;
  role: string;
  last_login: string | null;
  full_name: string | null;
  phone: string | null;
  personal_email: string | null;
  address: string | null;
  nok_name: string | null;
  nok_relationship: string | null;
  nok_phone: string | null;
  staff_number: string | null;
  job_title: string | null;
  employment_type: string | null;
  employment_status: string | null;
  date_joined: string | null;
  department: string | null;
}

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  salesperson: "Salesperson",
  viewer: "Viewer",
};

export default async function ProfilePage({ searchParams }: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}): Promise<ReactNode> {
  const staff = await requireStaff();
  const [{ rows }, sp] = await Promise.all([
    db().query<Profile>(
      `SELECT s.email, s.role, s.last_login::text,
              e.full_name, e.phone, e.personal_email, e.address,
              e.nok_name, e.nok_relationship, e.nok_phone,
              e.staff_number, e.job_title, e.employment_type, e.employment_status, e.date_joined::text,
              d.name AS department
         FROM staff s
         LEFT JOIN employee e ON e.staff_id = s.id
         LEFT JOIN hr_department d ON d.id = e.department_id
        WHERE s.id = $1`,
      [staff.id]),
    searchParams,
  ]);
  const p = rows[0];

  const facts: { label: string; value: string | null }[] = [
    { label: "Work email", value: p?.email ?? null },
    { label: "Access level", value: ROLE_LABEL[p?.role ?? ""] ?? p?.role ?? null },
    { label: "Staff number", value: p?.staff_number ?? null },
    { label: "Job title", value: p?.job_title ?? null },
    { label: "Department", value: p?.department ?? null },
    { label: "Employment type", value: p?.employment_type ?? null },
    { label: "Status", value: p?.employment_status ?? null },
    { label: "Joined", value: p?.date_joined ? new Date(p.date_joined).toLocaleDateString("en-NG", { dateStyle: "medium" }) : null },
    { label: "Last signed in", value: p?.last_login ? new Date(p.last_login).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : null },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[0.82rem] font-600 text-slate-600 hover:text-[#543CDA]">
        <ArrowLeft size={15} strokeWidth={2} /> Dashboard
      </Link>
      <h1 className="mt-3 text-[1.4rem] font-700 text-slate-900">Your profile</h1>
      <p className="mt-1 text-[0.86rem] text-slate-600">
        Correct your own contact details here. Role, department and pay are set by HR.
      </p>

      {sp.saved === "1" && (
        <p role="status" className="mt-4 rounded-xl border border-[#BBF7D0] bg-[#DCFCE7] px-4 py-3 text-[0.84rem] font-600 text-[#15803D]">
          Your profile was saved.
        </p>
      )}
      {sp.error === "name" && (
        <p role="alert" className="mt-4 rounded-xl border border-[#FECACA] bg-[#FEE2E2] px-4 py-3 text-[0.84rem] font-600 text-[#B91C1C]">
          Your name cannot be blank.
        </p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle sm:p-6">
          <h2 className="text-[1rem] font-700 text-slate-900">Details you can change</h2>
          <form action="/api/profile" method="post" className="mt-5 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Full name</span>
              <input name="name" required defaultValue={p?.full_name ?? staff.name} className={FIELD} />
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>Phone number</span>
                <input name="phone" type="tel" defaultValue={p?.phone ?? ""} placeholder="0803 000 0000" className={FIELD} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>Personal email</span>
                <input name="personal_email" type="email" defaultValue={p?.personal_email ?? ""} className={FIELD} />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>Home address</span>
              <textarea name="address" rows={2} defaultValue={p?.address ?? ""} className={`resize-none ${FIELD}`} />
            </label>

            <fieldset className="mt-1 rounded-xl border border-slate-200 p-4">
              <legend className="px-1.5 text-[0.8rem] font-700 text-slate-700">Next of kin</legend>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <label className="flex flex-col gap-1.5">
                  <span className={LABEL}>Name</span>
                  <input name="nok_name" defaultValue={p?.nok_name ?? ""} className={FIELD} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={LABEL}>Relationship</span>
                  <input name="nok_relationship" defaultValue={p?.nok_relationship ?? ""} className={FIELD} />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className={LABEL}>Phone</span>
                  <input name="nok_phone" type="tel" defaultValue={p?.nok_phone ?? ""} className={FIELD} />
                </label>
              </div>
            </fieldset>

            <div className="mt-1 flex flex-wrap gap-3">
              <button type="submit" className="rounded-lg bg-[#543CDA] px-5 py-2.5 text-[0.86rem] font-600 text-white hover:bg-[#4330B8]">
                Save changes
              </button>
              <Link href="/dashboard" className="rounded-lg border border-slate-200 px-5 py-2.5 text-[0.86rem] font-600 text-slate-700 hover:bg-slate-50">
                Cancel
              </Link>
            </div>
          </form>
        </section>

        <aside className="flex flex-col gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#EEEBFC] text-[#543CDA]">
                <UserRound size={20} strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[0.95rem] font-700 text-slate-900">{p?.full_name ?? staff.name}</p>
                <p className="truncate text-[0.8rem] text-slate-600">{p?.job_title ?? ROLE_LABEL[staff.role] ?? staff.role}</p>
              </div>
            </div>
            <dl className="mt-4 flex flex-col gap-3">
              {facts.map((f) => (
                <div key={f.label}>
                  <dt className="text-[0.74rem] text-slate-600">{f.label}</dt>
                  <dd className="mt-0.5 text-[0.84rem] font-600 text-slate-900">{f.value ?? "Not set"}</dd>
                </div>
              ))}
            </dl>
            {!p?.staff_number && (
              <p className="mt-4 rounded-lg bg-slate-50 p-3 text-[0.76rem] leading-relaxed text-slate-600">
                You do not have an employee record yet, so the HR details above are blank. HR creates it
                during onboarding.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.9rem] font-700 text-slate-900">Security</h2>
            <Link href="/users/sessions" className="mt-3 inline-flex items-center gap-2 text-[0.84rem] font-600 text-[#543CDA] hover:underline">
              <ShieldCheck size={15} strokeWidth={2} /> Review active sessions
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
