/**
 * Create a project.
 *
 * A native form posting to a route handler, matching how the rest of this admin submits: it survives
 * an Origin the proxy rewrites, which Server Actions do not.
 *
 * The client can be an existing one or a new name typed here. Creating the customer and the project
 * in one form is deliberate — the first project for a new client is the common case, and sending
 * somebody to a separate screen to create the client first is a step that exists only because the
 * data model has two tables.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { requireCapability } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";
import { PROJECT_STATUSES, PROJECT_STATUS_LABEL } from "../../../../lib/projects.js";

export const dynamic = "force-dynamic";

const field =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-[0.85rem] text-slate-900 outline-none focus:border-[#543CDA] focus:ring-2 focus:ring-[#543CDA]/15";
const label = "block text-[0.75rem] font-600 text-slate-600";

const ERRORS: Record<string, string> = {
  name: "Give the project a name.",
  client: "Choose a client, or type a new client name.",
  code: "A project already uses that code.",
  progress: "Progress must be between 0 and 100.",
};

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; msg?: string }>;
}): Promise<ReactNode> {
  await requireCapability("finance.invoice.raise");
  const { error, msg } = await searchParams;
  const { rows: clients } = await db().query<{ id: string; name: string }>(
    "SELECT id, name FROM client WHERE active ORDER BY name LIMIT 500",
  );

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/projects" className="text-[0.8rem] font-600 text-slate-500 hover:text-[#543CDA]">
        ← Projects
      </Link>
      <h1 className="mt-2 text-[1.4rem] font-700 text-slate-900">New Project</h1>
      <p className="mt-1 text-[0.88rem] text-slate-500">
        The contract value entered here is what percentage billing takes its percentage of.
      </p>

      {error ? (
        <p className="mt-4 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-[0.85rem] text-[#B91C1C]">
          {msg ?? ERRORS[error] ?? "That could not be saved."}
        </p>
      ) : null}

      <form action="/api/projects" method="post" className="mt-5 space-y-5">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">The project</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={label} htmlFor="name">Project name</label>
              <input id="name" name="name" required className={`mt-1 ${field}`} placeholder="Inventory and operations platform" />
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="description">What the work is</label>
              <textarea id="description" name="description" rows={3} className={`mt-1 ${field}`} />
            </div>
            <div>
              <label className={label} htmlFor="contract_value">Contract value (NGN)</label>
              <input id="contract_value" name="contract_value" inputMode="decimal" className={`mt-1 ${field}`} placeholder="12500000.00" />
            </div>
            <div>
              <label className={label} htmlFor="service_line">Service line</label>
              <input id="service_line" name="service_line" className={`mt-1 ${field}`} placeholder="Custom software" />
            </div>
            <div>
              <label className={label} htmlFor="status">Status</label>
              <select id="status" name="status" defaultValue="Planned" className={`mt-1 cursor-pointer ${field}`}>
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>{PROJECT_STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label} htmlFor="progress_percent">Delivery progress (%)</label>
              <input id="progress_percent" name="progress_percent" inputMode="decimal" defaultValue="0" className={`mt-1 ${field}`} />
            </div>
            <div>
              <label className={label} htmlFor="start_date">Start date</label>
              <input id="start_date" name="start_date" type="date" className={`mt-1 ${field}`} />
            </div>
            <div>
              <label className={label} htmlFor="end_date">Expected end date</label>
              <input id="end_date" name="end_date" type="date" className={`mt-1 ${field}`} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
          <h2 className="text-[0.95rem] font-700 text-slate-900">The client</h2>
          <p className="mt-1 text-[0.8rem] text-slate-500">
            Pick an existing client, or leave it unset and type a new name below.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={label} htmlFor="client_id">Existing client</label>
              <select id="client_id" name="client_id" defaultValue="" className={`mt-1 cursor-pointer ${field}`}>
                <option value="">— New client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="client_name">New client name</label>
              <input id="client_name" name="client_name" className={`mt-1 ${field}`} placeholder="Trivaron Limited" />
            </div>
            <div>
              <label className={label} htmlFor="client_contact_name">Contact person</label>
              <input id="client_contact_name" name="client_contact_name" className={`mt-1 ${field}`} />
            </div>
            <div>
              <label className={label} htmlFor="client_email">Email</label>
              <input id="client_email" name="client_email" type="email" className={`mt-1 ${field}`} />
            </div>
            <div>
              <label className={label} htmlFor="client_phone">Phone</label>
              <input id="client_phone" name="client_phone" className={`mt-1 ${field}`} />
            </div>
            <div>
              <label className={label} htmlFor="client_tin">TIN</label>
              <input id="client_tin" name="client_tin" className={`mt-1 ${field}`} />
            </div>
            <div className="sm:col-span-2">
              <label className={label} htmlFor="client_address">Address</label>
              <textarea id="client_address" name="client_address" rows={2} className={`mt-1 ${field}`} />
            </div>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <button type="submit" className="rounded-lg bg-[#543CDA] px-5 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]">
            Create project
          </button>
          <Link href="/projects" className="text-[0.85rem] font-600 text-slate-500 hover:text-slate-800">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
