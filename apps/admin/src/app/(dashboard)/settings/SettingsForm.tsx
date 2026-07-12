"use client";
/**
 * Company settings and NRS e-invoicing readiness form (PRD 15). The e-invoicing section is prepared
 * now and switched on later: turning it on needs a company TIN and names the SI or APP partner
 * whose API will carry the submission. Nothing submits to the NRS yet; this is the readiness config.
 */
import type { ReactNode } from "react";
import { useActionState, useState } from "react";
import { Check, Info } from "lucide-react";
import { updateSettings } from "../../../lib/shell-actions.js";
import type { SettingsState } from "../../../lib/shell-constants.js";

const initial: SettingsState = {};

interface Settings {
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

const FIELD =
  "w-full rounded-card border border-neutral-200 bg-white p-2.5 text-[0.88rem] text-ink-950 focus:border-purple-500";
const LABEL = "text-[0.82rem] font-600 text-ink-950";

export function SettingsForm({ settings }: { settings: Settings }): ReactNode {
  const [state, action, pending] = useActionState(updateSettings, initial);
  const [nrsEnabled, setNrsEnabled] = useState(settings.nrs_enabled);

  return (
    <form action={action} className="flex flex-col gap-4">
      {/* Company profile */}
      <div className="rounded-card border border-purple-200 bg-white p-5 shadow-subtle">
        <h2 className="text-[1.05rem] font-700 text-ink-950">Company profile</h2>
        <p className="mt-0.5 text-[0.8rem] text-neutral-600">
          Used on every document and invoice the platform generates.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Legal name</span>
            <input name="legalName" defaultValue={settings.legal_name} className={FIELD} required />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Tax Identification Number (TIN)</span>
            <input name="tin" defaultValue={settings.tin ?? ""} placeholder="Not set" className={FIELD} />
          </label>
          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={LABEL}>Registered address</span>
            <input name="address" defaultValue={settings.address} className={FIELD} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Billing email</span>
            <input name="email" type="email" defaultValue={settings.email} className={FIELD} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Phone</span>
            <input name="phone" defaultValue={settings.phone} className={FIELD} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Default VAT rate (%)</span>
            <input
              name="vatRate"
              type="number"
              step="0.1"
              min="0"
              max="100"
              defaultValue={settings.vat_rate}
              className={FIELD}
            />
          </label>
        </div>
      </div>

      {/* NRS e-invoicing readiness */}
      <div className="rounded-card border border-purple-200 bg-white p-5 shadow-subtle">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[1.05rem] font-700 text-ink-950">NRS e-invoicing</h2>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.72rem] font-600 ${
              nrsEnabled ? "bg-[#E4F5EE] text-[#0E7A5B]" : "bg-neutral-100 text-neutral-600"
            }`}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: nrsEnabled ? "#12A97A" : "#9CA3AF" }}
            />
            {nrsEnabled ? "Enabled" : "Not applicable yet"}
          </span>
        </div>

        <div className="mt-3 flex items-start gap-2.5 rounded-card border border-purple-200 bg-purple-100/40 px-3.5 py-3 text-[0.82rem] leading-relaxed text-neutral-600">
          <Info size={15} strokeWidth={2} className="mt-0.5 shrink-0 text-purple-600" />
          <span>
            Every invoice already carries the nullable NRS fields (IRN, QR code, company and client
            TINs, submission status). Switching this on later is wiring the SI or APP partner call and
            flipping the flag, not restructuring data. Nothing is submitted to the NRS from here yet.
          </span>
        </div>

        <label className="mt-4 flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            name="nrsEnabled"
            checked={nrsEnabled}
            onChange={(e) => setNrsEnabled(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-purple-600"
          />
          <span className="text-[0.88rem] font-600 text-ink-950">
            Enable NRS e-invoicing readiness (requires a company TIN)
          </span>
        </label>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Environment</span>
            <select name="nrsEnvironment" defaultValue={settings.nrs_environment} className={`cursor-pointer ${FIELD}`}>
              <option value="sandbox">Sandbox</option>
              <option value="production">Production</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Partner type</span>
            <select name="nrsPartnerType" defaultValue={settings.nrs_partner_type ?? ""} className={`cursor-pointer ${FIELD}`}>
              <option value="">Not chosen</option>
              <option value="SI">System Integrator (SI)</option>
              <option value="APP">Access Point Provider (APP)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Partner name</span>
            <input name="nrsPartner" defaultValue={settings.nrs_partner ?? ""} placeholder="To be selected" className={FIELD} />
          </label>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-card bg-purple-600 px-5 py-2.5 text-[0.88rem] font-600 text-white hover:bg-purple-700 disabled:opacity-60"
        >
          {pending ? "Saving" : "Save settings"}
        </button>
        {state.ok ? (
          <span className="inline-flex items-center gap-1.5 text-[0.85rem] font-600 text-[#0E7A5B]" role="status">
            <Check size={15} strokeWidth={2.4} /> Saved
          </span>
        ) : null}
        {state.error ? (
          <span className="text-[0.85rem] text-[#C0362C]" role="alert">
            {state.error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
