/**
 * Raise an invoice (PRD 6.4, 10.1). Finance is the only module that generates an invoice, so it
 * lives here, never in CRM. An invoice can be prefilled straight from a won deal: the project cost,
 * service line, client, and engagement type carry over from CRM so nobody retypes them, and the
 * customer name stays overridable. VAT is applied per invoice at the company rate. The generator
 * renders the dedicated NRS-ready invoice template with the company details read from settings.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import { requireCapability } from "../../../../lib/auth.js";
import { db } from "../../../../lib/db.js";
import { GenerateDocument } from "../../crm/[id]/GenerateDocument.js";

export const dynamic = "force-dynamic";

interface WonDeal {
  id: string;
  name: string | null;
  company: string | null;
  service_line: string | null;
  deal_value: string | null;
  engagement_type: string | null;
}

export default async function RaiseInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ deal?: string }>;
}): Promise<ReactNode> {
  const staff = await requireCapability("finance.read");
  if (staff.role === "viewer") {
    return <p className="text-[0.9rem] text-neutral-600">Viewers cannot raise invoices.</p>;
  }

  const { deal: dealId } = await searchParams;
  const pool = db();

  const [{ rows: settingsRows }, { rows: deals }] = await Promise.all([
    pool.query<{ vat_rate: string; nrs_enabled: boolean }>(
      "SELECT vat_rate::text, nrs_enabled FROM company_settings WHERE id = true",
    ),
    pool.query<WonDeal>(
      `SELECT id, name, company, service_line, deal_value::text, engagement_type
         FROM lead
        WHERE status = 'Won' AND deal_value IS NOT NULL
        ORDER BY won_at DESC NULLS LAST LIMIT 50`,
    ),
  ]);

  const vatRate = settingsRows[0] ? Number.parseFloat(settingsRows[0].vat_rate) : 7.5;
  const nrsEnabled = settingsRows[0]?.nrs_enabled ?? false;
  const selected = dealId ? deals.find((d) => d.id === dealId) : undefined;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-roboto text-[1.7rem] font-700 leading-tight text-ink-950">Raise an invoice</h1>
      <p className="mt-1 text-[0.95rem] text-neutral-600">
        Prefill from a won deal so the project cost and client carry over, or start blank. Full
        payment for a one-off or retainer, or a milestone percentage of the engagement value.
      </p>

      <div className="mt-4 flex items-start gap-2.5 rounded-card border border-purple-200 bg-purple-100/40 px-4 py-3 text-[0.82rem] leading-relaxed text-neutral-600">
        <Info size={15} strokeWidth={2} className="mt-0.5 shrink-0 text-purple-600" />
        <span>
          Company details, VAT ({vatRate}%), and TIN come from{" "}
          <Link href="/settings" className="cursor-pointer font-600 text-purple-700 hover:text-purple-600">
            Settings
          </Link>
          . NRS e-invoicing is {nrsEnabled ? "enabled: invoices carry a Pending status until submitted" : "not applicable yet, so invoices carry the fields but are not submitted"}.
        </span>
      </div>

      {/* Prefill from a won deal */}
      <form action="/finance/invoice" className="mt-5 rounded-card border border-purple-200 bg-white p-4 shadow-subtle">
        <label htmlFor="deal" className="text-[0.8rem] font-600 text-ink-950">
          Prefill from a won deal
        </label>
        {deals.length === 0 ? (
          <p className="mt-1.5 text-[0.82rem] text-neutral-600">
            No won deals yet. Mark a lead Won in CRM to capture its value, then it appears here.
          </p>
        ) : (
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <select
              id="deal"
              name="deal"
              defaultValue={dealId ?? ""}
              className="min-w-[240px] flex-1 cursor-pointer rounded-card border border-neutral-200 bg-white p-2.5 text-[0.85rem] text-ink-950"
            >
              <option value="">Blank invoice</option>
              {deals.map((d) => (
                <option key={d.id} value={d.id}>
                  {[d.company || d.name || "Unnamed", d.service_line].filter(Boolean).join(" — ")}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="cursor-pointer rounded-card bg-purple-600 px-4 py-2.5 text-[0.85rem] font-600 text-white hover:bg-purple-700"
            >
              Apply
            </button>
          </div>
        )}
        {selected ? (
          <p className="mt-2 text-[0.78rem] text-purple-700">
            Prefilled from {selected.company || selected.name || "the deal"}. Every field, including
            the customer name, is overridable below.
          </p>
        ) : null}
      </form>

      <div className="mt-4 rounded-card border border-purple-200 bg-white p-5 shadow-subtle">
        <GenerateDocument
          key={selected?.id ?? "blank"}
          allowedKinds={["Invoice"]}
          vatRate={vatRate}
          {...(selected?.name ? { defaultName: selected.name } : {})}
          {...(selected?.company ? { defaultCompany: selected.company } : {})}
          {...(selected?.service_line ? { defaultProject: selected.service_line } : {})}
          {...(selected?.deal_value ? { defaultCost: Number.parseFloat(selected.deal_value) } : {})}
          {...(selected?.engagement_type ? { defaultEngagement: selected.engagement_type } : {})}
        />
      </div>
    </div>
  );
}
