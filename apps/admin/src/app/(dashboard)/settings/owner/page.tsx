/**
 * Owner account: create your own administrator, then retire the seeded one.
 *
 * The seeded account exists so a fresh deployment can be signed into at all. Its password was set
 * from an environment variable, which means it lives wherever that variable lives - a deploy config,
 * a shell history, whatever was pasted into a terminal - and it is the same for everyone who has
 * ever seen that file. It is a bootstrap and it should not outlive the bootstrap.
 *
 * The order is enforced rather than suggested: the retire button only appears once there is another
 * active administrator to fall back on, and it refuses the account you are signed in as.
 */
import type { ReactNode } from "react";
import { ShieldCheck, KeyRound, TriangleAlert } from "lucide-react";
import { requireAdmin, getCurrentStaff } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";

export const dynamic = "force-dynamic";

const field =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.85rem] text-slate-900 outline-none focus:border-[#543CDA] focus:ring-2 focus:ring-[#543CDA]/15";
const lbl = "block text-[0.75rem] font-600 text-slate-600";

interface Row {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  last_seen: string | null;
}

export default async function OwnerAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; msg?: string; created?: string; retired?: string }>;
}): Promise<ReactNode> {
  await requireAdmin();
  const me = await getCurrentStaff();
  const { error, msg, created, retired } = await searchParams;

  // Read at runtime, never written into the source: which address the deployment seeded is a
  // property of this environment, not of the code.
  const seeded = (process.env.ADMIN_SEED_EMAIL ?? "").trim().toLowerCase();

  const { rows } = await db().query<Row>(
    `SELECT s.id, s.name, s.email, s.role, s.active,
            (SELECT max(created_at)::text FROM staff_session ss WHERE ss.staff_id = s.id) last_seen
       FROM staff s WHERE s.role = 'admin' ORDER BY s.created_at`,
  );

  const seededRow = seeded ? rows.find((r) => r.email.toLowerCase() === seeded) : undefined;
  const otherAdmins = rows.filter((r) => r.active && r.id !== seededRow?.id);
  const canRetire = Boolean(seededRow) && otherAdmins.length > 0 && seededRow?.id !== me?.id;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[1.4rem] font-700 text-slate-900">Owner Account</h1>
      <p className="mt-1 max-w-2xl text-[0.88rem] text-slate-500">
        Create the administrator account this platform belongs to, then remove the one the
        deployment seeded. A seeded password was set outside the platform and is only as private as
        the file it came from.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-[0.85rem] text-[#B91C1C]">
          {msg ?? "That could not be done."}
        </p>
      ) : null}
      {created ? (
        <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[0.85rem] text-green-700">
          <b>{created}</b> is now an administrator. Sign out, sign in as that account to prove the
          password works, then come back and retire the seeded one.
        </p>
      ) : null}
      {retired ? (
        <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[0.85rem] text-green-700">
          The seeded account and its password have been deleted. Remove ADMIN_SEED_EMAIL,
          ADMIN_SEED_NAME and ADMIN_SEED_PASSWORD from the deployment environment as well, so it is
          not recreated on the next seed run.
        </p>
      ) : null}

      {/* Current administrators */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-subtle">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="text-[0.95rem] font-700 text-slate-900">Administrators</h2>
        </div>
        <table className="w-full text-left">
          <tbody>
            {rows.map((r) => {
              const isSeeded = seeded !== "" && r.email.toLowerCase() === seeded;
              return (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-5 py-3">
                    <span className="block text-[0.88rem] font-600 text-slate-900">{r.name}</span>
                    <span className="block text-[0.78rem] text-slate-500">{r.email}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {isSeeded ? (
                      <span className="rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[0.72rem] font-600 text-[#B45309]">
                        Seeded account
                      </span>
                    ) : null}
                    {r.id === me?.id ? (
                      <span className="ml-1.5 rounded-full bg-[#EEEBFC] px-2.5 py-1 text-[0.72rem] font-600 text-[#543CDA]">
                        You
                      </span>
                    ) : null}
                    {!r.active ? (
                      <span className="ml-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[0.72rem] font-600 text-slate-500">
                        Inactive
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Create the owner */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="flex items-center gap-2 text-[0.95rem] font-700 text-slate-900">
          <ShieldCheck size={16} className="text-[#543CDA]" /> Create an administrator
        </h2>
        <p className="mt-1 text-[0.8rem] text-slate-500">
          The password is set here and stored only as a hash. Nobody, including this screen, can read
          it back afterwards. If the address already has an account it is upgraded rather than
          duplicated.
        </p>
        <form action="/api/owner" method="post" className="mt-4 grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="action" value="create" />
          <div>
            <label className={lbl} htmlFor="o-name">Full name</label>
            <input id="o-name" name="name" required autoComplete="off" className={`mt-1 ${field}`} />
          </div>
          <div>
            <label className={lbl} htmlFor="o-email">Email address</label>
            <input id="o-email" name="email" type="email" required autoComplete="off" className={`mt-1 ${field}`} />
          </div>
          <div>
            <label className={lbl} htmlFor="o-pass">Password</label>
            <input id="o-pass" name="password" type="password" required minLength={12} autoComplete="new-password" className={`mt-1 ${field}`} />
            <span className="mt-1 block text-[0.72rem] text-slate-500">At least 12 characters.</span>
          </div>
          <div>
            <label className={lbl} htmlFor="o-confirm">Confirm password</label>
            <input id="o-confirm" name="confirm" type="password" required minLength={12} autoComplete="new-password" className={`mt-1 ${field}`} />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="rounded-lg bg-[#543CDA] px-5 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]">
              Create administrator
            </button>
          </div>
        </form>
      </section>

      {/* Retire the seeded account */}
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
        <h2 className="flex items-center gap-2 text-[0.95rem] font-700 text-slate-900">
          <KeyRound size={16} className="text-[#B45309]" /> Retire the seeded account
        </h2>
        {!seeded ? (
          <p className="mt-2 text-[0.82rem] text-slate-500">
            No ADMIN_SEED_EMAIL is set in this environment, so there is no seeded account to
            identify. Nothing to do here.
          </p>
        ) : !seededRow ? (
          <p className="mt-2 flex items-start gap-2 text-[0.82rem] text-green-700">
            <ShieldCheck size={15} className="mt-0.5 shrink-0" />
            The seeded account <b className="font-600">{seeded}</b> no longer exists. Remove the
            ADMIN_SEED_* variables from the deployment so it is not recreated.
          </p>
        ) : (
          <>
            <p className="mt-2 text-[0.82rem] text-slate-600">
              Deleting <b>{seededRow.email}</b> removes its password hash and signs out any session
              it holds. This cannot be undone from here; the account would have to be created again.
            </p>
            {!canRetire ? (
              <p className="mt-3 flex items-start gap-2 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2.5 text-[0.8rem] text-[#B45309]">
                <TriangleAlert size={15} className="mt-0.5 shrink-0" />
                {seededRow.id === me?.id
                  ? "You are signed in as the seeded account. Create your own administrator above, sign in as it, then come back."
                  : "There is no other active administrator to fall back on. Create one above first."}
              </p>
            ) : (
              <form action="/api/owner" method="post" className="mt-3">
                <input type="hidden" name="action" value="retire" />
                <input type="hidden" name="id" value={seededRow.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-[#FCA5A5] px-5 py-2.5 text-[0.85rem] font-600 text-[#B91C1C] hover:bg-red-50"
                >
                  Delete {seededRow.email}
                </button>
              </form>
            )}
          </>
        )}
      </section>
    </div>
  );
}
