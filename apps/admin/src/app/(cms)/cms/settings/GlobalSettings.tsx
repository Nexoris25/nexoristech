"use client";
/**
 * Global Settings (CMS design). Tabbed configuration for the whole platform: General, Branding,
 * Localization, Email, Notifications, Security and System. The configurable tabs submit one JSON blob
 * to /api/cms/global-settings (cms_setting scope='global'); System is a read-only status view whose
 * checks are performed on the server when the page loads.
 *
 * Two things were removed rather than kept as switches that changed nothing. The Security card offered
 * password expiry and "Require MFA", neither of which any code read: there is no rotation prompt and no
 * enrolment flow, so an owner turning MFA on would have believed the platform was protected. The Backup
 * tab reported a last backup of "Today, 02:30", 28 backups and 245.6 GB, with no backup system behind
 * any of it.
 *
 * What remains is enforced: minimum length and the symbol rule are applied wherever a password is set,
 * the session timeout sets how long a cookie and its session row live, and the lockout is counted in
 * login_attempt. See lib/security-policy.
 *
 * Responsive to 360px.
 */
import { useState } from "react";
import type { ReactNode } from "react";
import { Settings, Palette, Globe, Mail, Bell, ShieldCheck, Server, CheckCircle2, XCircle, MinusCircle, HelpCircle } from "lucide-react";
import type { ServiceCheck, SystemInfo, Health } from "../../../../lib/system-status.js";

export interface GlobalConfig {
  companyName: string; websiteUrl: string; companyEmail: string; companyPhone: string;
  defaultLanguage: string; timezone: string; dateFormat: string; currency: string;
  primaryColor: string; secondaryColor: string;
  numberFormat: string; firstDayOfWeek: string; measurementSystem: string; rtlSupport: boolean;
  emailProvider: string; smtpHost: string; smtpPort: string; smtpEncryption: string; fromEmail: string; fromName: string;
  notifyReview: boolean; notifyPublishing: boolean; notifyInvitations: boolean; notifyAi: boolean; notifySecurity: boolean; quietHours: boolean;
  minPasswordLength: string; requireSpecial: boolean; sessionTimeout: string; lockoutAttempts: string;
}
const TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "localization", label: "Localization", icon: Globe },
  { id: "email", label: "Email", icon: Mail },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "system", label: "System", icon: Server },
] as const;
const field = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[0.86rem] text-slate-900 placeholder:text-slate-400 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15 resize-none";
const label = "text-[0.8rem] font-600 text-slate-700";

export function GlobalSettings({ initial, services, info }: { initial: GlobalConfig; services: ServiceCheck[]; info: SystemInfo[] }): ReactNode {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("general");
  const [c, setC] = useState<GlobalConfig>(initial);
  const set = <K extends keyof GlobalConfig>(k: K, v: GlobalConfig[K]): void => setC((p) => ({ ...p, [k]: v }));
  const readOnly = tab === "system";

  return (
    <form action="/api/cms/global-settings" method="post">
      <input type="hidden" name="data" value={JSON.stringify(c)} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[14rem_1fr]">
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[0.84rem] font-600 ${tab === t.id ? "bg-[#EEEBFC] text-[#543CDA]" : "text-slate-600 hover:bg-slate-100"}`}>
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </nav>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
          {tab === "general" ? (
            <div className="flex flex-col gap-4">
              <h2 className="text-[0.95rem] font-700 text-slate-900">Company Information</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5"><span className={label}>Company Name</span><input value={c.companyName} onChange={(e) => set("companyName", e.target.value)} className={field} /></label>
                <label className="flex flex-col gap-1.5"><span className={label}>Website URL</span><input value={c.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} className={field} /></label>
                <label className="flex flex-col gap-1.5"><span className={label}>Company Email</span><input type="email" value={c.companyEmail} onChange={(e) => set("companyEmail", e.target.value)} className={field} /></label>
                <label className="flex flex-col gap-1.5"><span className={label}>Company Phone</span><input value={c.companyPhone} onChange={(e) => set("companyPhone", e.target.value)} className={field} /></label>
              </div>
              <h2 className="mt-2 text-[0.95rem] font-700 text-slate-900">Default Preferences</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5"><span className={label}>Default Language</span><select value={c.defaultLanguage} onChange={(e) => set("defaultLanguage", e.target.value)} className={`cursor-pointer ${field}`}><option>English (en)</option><option>Français (fr)</option><option>Hausa (ha)</option></select></label>
                <label className="flex flex-col gap-1.5"><span className={label}>Time Zone</span><select value={c.timezone} onChange={(e) => set("timezone", e.target.value)} className={`cursor-pointer ${field}`}><option>(GMT+01:00) West Africa Time</option><option>(GMT+00:00) UTC</option></select></label>
                <label className="flex flex-col gap-1.5"><span className={label}>Date Format</span><select value={c.dateFormat} onChange={(e) => set("dateFormat", e.target.value)} className={`cursor-pointer ${field}`}><option>MMM DD, YYYY</option><option>DD/MM/YYYY</option><option>YYYY-MM-DD</option></select></label>
                <label className="flex flex-col gap-1.5"><span className={label}>Currency</span><select value={c.currency} onChange={(e) => set("currency", e.target.value)} className={`cursor-pointer ${field}`}><option>NGN — Nigerian Naira (₦)</option><option>USD — US Dollar ($)</option></select></label>
              </div>
            </div>
          ) : tab === "branding" ? (
            <div className="flex flex-col gap-4">
              <h2 className="text-[0.95rem] font-700 text-slate-900">Brand Identity</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5"><span className={label}>Primary Color</span><span className="flex items-center gap-2"><input type="color" value={c.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} className="h-9 w-12 cursor-pointer rounded-md border border-slate-200" /><span className="font-mono text-[0.82rem] text-slate-600">{c.primaryColor}</span></span></label>
                <label className="flex flex-col gap-1.5"><span className={label}>Secondary Color</span><span className="flex items-center gap-2"><input type="color" value={c.secondaryColor} onChange={(e) => set("secondaryColor", e.target.value)} className="h-9 w-12 cursor-pointer rounded-md border border-slate-200" /><span className="font-mono text-[0.82rem] text-slate-600">{c.secondaryColor}</span></span></label>
              </div>
              <div className="mt-2 rounded-xl border border-slate-200 p-5">
                <p className="text-[0.8rem] font-600 text-slate-500">Preview</p>
                <div className="mx-auto mt-3 max-w-xs rounded-2xl border border-slate-200 p-5 text-center shadow-subtle">
                  <span className="mx-auto grid h-9 w-9 place-items-center rounded-lg text-white" style={{ background: `linear-gradient(135deg, ${c.primaryColor}, ${c.secondaryColor})` }}>N</span>
                  <p className="mt-2 text-[0.95rem] font-700 text-slate-900">{c.companyName || "Nexoris CMS"}</p>
                  <p className="text-[0.78rem] text-slate-500">Welcome back!</p>
                  <button type="button" className="mt-3 w-full rounded-lg py-2 text-[0.82rem] font-600 text-white" style={{ background: c.primaryColor }}>Sign In</button>
                </div>
              </div>
            </div>
          ) : tab === "localization" ? (
            <div className="flex flex-col gap-4">
              <h2 className="text-[0.95rem] font-700 text-slate-900">Regional Formats</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5"><span className={label}>Number Format</span><select value={c.numberFormat} onChange={(e) => set("numberFormat", e.target.value)} className={`cursor-pointer ${field}`}><option>1,234.56</option><option>1.234,56</option><option>1 234,56</option></select></label>
                <label className="flex flex-col gap-1.5"><span className={label}>First Day of Week</span><select value={c.firstDayOfWeek} onChange={(e) => set("firstDayOfWeek", e.target.value)} className={`cursor-pointer ${field}`}><option>Monday</option><option>Sunday</option></select></label>
                <label className="flex flex-col gap-1.5"><span className={label}>Measurement System</span><select value={c.measurementSystem} onChange={(e) => set("measurementSystem", e.target.value)} className={`cursor-pointer ${field}`}><option>Metric (km, kg, °C)</option><option>Imperial (mi, lb, °F)</option></select></label>
              </div>
              <Toggle title="RTL Support" sub="Enable right-to-left layout support." checked={c.rtlSupport} set={(v) => set("rtlSupport", v)} />
            </div>
          ) : tab === "email" ? (
            <div className="flex flex-col gap-4">
              <h2 className="text-[0.95rem] font-700 text-slate-900">Email Provider</h2>
              <label className="flex flex-col gap-1.5"><span className={label}>Provider</span><select value={c.emailProvider} onChange={(e) => set("emailProvider", e.target.value)} className={`cursor-pointer ${field}`}><option>SMTP</option><option>Microsoft 365</option><option>Google Workspace</option><option>Mailgun</option><option>Resend</option><option>SendGrid</option></select></label>
              <h2 className="mt-2 text-[0.95rem] font-700 text-slate-900">SMTP Configuration</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5"><span className={label}>SMTP Host</span><input value={c.smtpHost} onChange={(e) => set("smtpHost", e.target.value)} placeholder="smtp.mailgun.org" className={field} /></label>
                <label className="flex flex-col gap-1.5"><span className={label}>Port</span><input value={c.smtpPort} onChange={(e) => set("smtpPort", e.target.value)} placeholder="587" className={field} /></label>
                <label className="flex flex-col gap-1.5"><span className={label}>Encryption</span><select value={c.smtpEncryption} onChange={(e) => set("smtpEncryption", e.target.value)} className={`cursor-pointer ${field}`}><option>STARTTLS</option><option>SSL/TLS</option><option>None</option></select></label>
                <label className="flex flex-col gap-1.5"><span className={label}>From Name</span><input value={c.fromName} onChange={(e) => set("fromName", e.target.value)} className={field} /></label>
                <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>From Email</span><input type="email" value={c.fromEmail} onChange={(e) => set("fromEmail", e.target.value)} className={field} /></label>
              </div>
            </div>
          ) : tab === "notifications" ? (
            <div className="flex flex-col gap-3">
              <h2 className="text-[0.95rem] font-700 text-slate-900">Notification Channels</h2>
              <Toggle title="Review Assignments" sub="Notify when content is assigned for review." checked={c.notifyReview} set={(v) => set("notifyReview", v)} />
              <Toggle title="Publishing Alerts" sub="Notify on publish, schedule, or unpublish." checked={c.notifyPublishing} set={(v) => set("notifyPublishing", v)} />
              <Toggle title="User Invitations" sub="Notify when users are invited or join." checked={c.notifyInvitations} set={(v) => set("notifyInvitations", v)} />
              <Toggle title="AI Completions" sub="Notify when AI tasks are completed." checked={c.notifyAi} set={(v) => set("notifyAi", v)} />
              <Toggle title="Security Alerts" sub="Notify on suspicious login or security events." checked={c.notifySecurity} set={(v) => set("notifySecurity", v)} />
              <Toggle title="Quiet Hours" sub="Pause non-critical emails overnight." checked={c.quietHours} set={(v) => set("quietHours", v)} />
            </div>
          ) : tab === "security" ? (
            <div className="flex flex-col gap-4">
              <h2 className="text-[0.95rem] font-700 text-slate-900">Password Policy</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5"><span className={label}>Minimum length</span><select value={c.minPasswordLength} onChange={(e) => set("minPasswordLength", e.target.value)} className={`cursor-pointer ${field}`}><option>8 characters</option><option>12 characters</option><option>16 characters</option></select></label>
                <label className="flex flex-col gap-1.5"><span className={label}>Lock out after</span><select value={c.lockoutAttempts} onChange={(e) => set("lockoutAttempts", e.target.value)} className={`cursor-pointer ${field}`}><option>3 attempts</option><option>5 attempts</option><option>10 attempts</option><option>Never</option></select></label>
              </div>
              <Toggle title="Require a symbol" sub="Passwords must include a character that is not a letter or a number." checked={c.requireSpecial} set={(v) => set("requireSpecial", v)} />
              <h2 className="mt-2 text-[0.95rem] font-700 text-slate-900">Sessions</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5"><span className={label}>Session timeout</span><select value={c.sessionTimeout} onChange={(e) => set("sessionTimeout", e.target.value)} className={`cursor-pointer ${field}`}><option>30 minutes</option><option>1 hour</option><option>8 hours</option><option>1 day</option></select></label>
              </div>
              <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-[0.78rem] leading-relaxed text-slate-600">
                These apply the moment they are saved: the password rules wherever a password is set, the
                timeout to new sign-ins, and the lockout to attempts over a fifteen-minute window.
                &ldquo;Keep me signed in&rdquo; still lasts thirty days, which is what it is for.
              </p>
              <p className="rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2.5 text-[0.78rem] leading-relaxed text-[#78350F]">
                Multi-factor authentication and password expiry are not built yet, so there is no switch
                for them here. A switch that changed nothing would be worse than its absence.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <h2 className="text-[0.95rem] font-700 text-slate-900">System</h2>
              <div className="grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
                {info.map((x) => (
                  <div key={x.key} className="flex items-center justify-between gap-3 border-b border-slate-100 py-2">
                    <span className="shrink-0 text-[0.82rem] text-slate-600">{x.key}</span>
                    <span className="truncate text-right text-[0.82rem] font-600 text-slate-800">{x.value}</span>
                  </div>
                ))}
              </div>
              <h2 className="mt-2 text-[0.95rem] font-700 text-slate-900">Service status</h2>
              <p className="text-[0.78rem] text-slate-600">Checked when this page loaded.</p>
              <ul className="grid grid-cols-1 gap-2">
                {services.map((s) => (
                  <li key={s.name} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2.5">
                    <span className="min-w-0">
                      <span className="block text-[0.82rem] font-600 text-slate-800">{s.name}</span>
                      <span className="block text-[0.74rem] text-slate-600">{s.detail}</span>
                    </span>
                    <StatusPill health={s.health} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!readOnly ? (
            <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="submit" className="rounded-lg bg-[#543CDA] px-6 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]">Save Changes</button>
            </div>
          ) : null}
        </section>
      </div>
    </form>
  );
}

const HEALTH: Record<Health, { icon: typeof CheckCircle2; fg: string; bg: string; label: string }> = {
  up: { icon: CheckCircle2, fg: "#15803D", bg: "#DCFCE7", label: "Responding" },
  down: { icon: XCircle, fg: "#DC2626", bg: "#FEE2E2", label: "Not responding" },
  "not-configured": { icon: MinusCircle, fg: "#B45309", bg: "#FEF3C7", label: "Not configured" },
  unknown: { icon: HelpCircle, fg: "#475569", bg: "#F1F5F9", label: "Unknown" },
};

/** One service's state, coloured so a problem is visible without reading the label. */
function StatusPill({ health }: { health: Health }): ReactNode {
  const h = HEALTH[health];
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[0.72rem] font-700" style={{ background: h.bg, color: h.fg }}>
      <h.icon size={13} /> {h.label}
    </span>
  );
}

function Toggle({ title, sub, checked, set }: { title: string; sub: string; checked: boolean; set: (v: boolean) => void }): ReactNode {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-3">
      <span><span className="block text-[0.85rem] font-600 text-slate-800">{title}</span><span className="block text-[0.76rem] text-slate-500">{sub}</span></span>
      <input type="checkbox" checked={checked} onChange={(e) => set(e.target.checked)} className="peer sr-only" />
      <span onClick={() => set(!checked)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-[#543CDA]" : "bg-slate-300"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? "left-[1.4rem]" : "left-0.5"}`} /></span>
    </label>
  );
}
