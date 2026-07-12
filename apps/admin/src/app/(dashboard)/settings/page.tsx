/**
 * Company settings and NRS e-invoicing readiness (PRD 15). Admin only. Reads the single settings
 * row and renders the editable form. The e-invoicing section prepares the data shape and partner
 * choice now, so going live later is a wiring task, not a migration.
 */
import type { ReactNode } from "react";
import { requireAdmin } from "../../../lib/auth.js";
import { db } from "../../../lib/db.js";
import { SettingsForm } from "./SettingsForm.js";

export const dynamic = "force-dynamic";

interface Row {
  legal_name: string;
  tin: string | null;
  address: string;
  email: string;
  phone: string;
  vat_rate: string;
  nrs_enabled: boolean;
  nrs_environment: string;
  nrs_partner: string | null;
  nrs_partner_type: string | null;
}

export default async function SettingsPage(): Promise<ReactNode> {
  await requireAdmin();
  const { rows } = await db().query<Row>(
    `SELECT legal_name, tin, address, email, phone, vat_rate::text,
            nrs_enabled, nrs_environment, nrs_partner, nrs_partner_type
       FROM company_settings WHERE id = true`,
  );
  const settings = rows[0]!;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-roboto text-[1.7rem] font-700 leading-tight text-ink-950">Settings</h1>
      <p className="mt-1 text-[0.95rem] text-neutral-600">
        Company profile and NRS e-invoicing readiness for Nexoris Technologies.
      </p>
      <div className="mt-6">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
