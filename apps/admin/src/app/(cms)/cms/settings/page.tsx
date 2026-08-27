/**
 * Global Settings. Platform-wide configuration, plus the live system checks.
 *
 * The defaults below are the values that apply when nothing has been saved yet. The security ones match
 * lib/security-policy, so the screen and the gate cannot drift: what is shown here is what is enforced.
 */
import type { ReactNode } from "react";
import { requireCmsAccess } from "../../../../lib/auth.js";
import { cmsDb } from "../../../../lib/cms-db.js";
import { systemStatus } from "../../../../lib/system-status.js";
import { GlobalSettings, type GlobalConfig } from "./GlobalSettings.js";

export const dynamic = "force-dynamic";

const DEFAULTS: GlobalConfig = {
  companyName: "Nexoris Technologies Ltd.", websiteUrl: "https://nexoristech.com", companyEmail: "hello@nexoristech.com", companyPhone: "+234 803 123 4567",
  defaultLanguage: "English (en)", timezone: "(GMT+01:00) West Africa Time", dateFormat: "MMM DD, YYYY", currency: "NGN — Nigerian Naira (₦)",
  primaryColor: "#543CDA", secondaryColor: "#6A55F2",
  numberFormat: "1,234.56", firstDayOfWeek: "Monday", measurementSystem: "Metric (km, kg, °C)", rtlSupport: false,
  notifyReview: true, notifyPublishing: true, notifyInvitations: true, notifyAi: true, notifySecurity: true, quietHours: false,
  // These four are read by lib/security-policy and applied to sign-in and to every password change.
  minPasswordLength: "12 characters", requireSpecial: true, sessionTimeout: "1 day", lockoutAttempts: "5 attempts",
};

export default async function GlobalSettingsPage(): Promise<ReactNode> {
  await requireCmsAccess();
  let config = DEFAULTS;
  const [status] = await Promise.all([systemStatus()]);
  try {
    const { rows } = await cmsDb().query<{ data: Partial<GlobalConfig> }>("SELECT data FROM cms_setting WHERE scope='global'");
    if (rows[0]?.data) config = { ...DEFAULTS, ...rows[0].data };
  } catch { /* use defaults */ }

  return (
    <div>
      <h1 className="text-[1.4rem] font-700 text-slate-900">Global Settings</h1>
      <p className="mt-1 text-[0.86rem] text-slate-600">
        Configuration for the whole platform. The security settings take effect as soon as they are saved.
      </p>
      <div className="mt-5">
        <GlobalSettings initial={config} services={status.services} info={status.info} />
      </div>
    </div>
  );
}
