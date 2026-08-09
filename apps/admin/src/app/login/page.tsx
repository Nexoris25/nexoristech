/**
 * 1.1 Login (Batch 1 - Authentication & Identity). Two panels: a dark indigo brand panel and a white
 * sign-in form. The form posts natively to the auth route handler so sign-in works without client
 * hydration; on failure the route returns to /login?error=1.
 *
 * The brand panel carried three things it should not have: a version string reading v2.4.8 while the
 * CMS shell said 1.0.0, a hardcoded "All systems operational" that was true no matter what the systems
 * were doing, and a stock Mark Twain quote. A sign-in screen is the first thing anyone sees of this
 * platform, and an unearned status claim on it is the cheapest possible kind of confidence.
 *
 * What replaces them is what the product actually is: the modules behind the login, stated plainly.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Users, UsersRound, FileText, Wallet } from "lucide-react";
import { PLATFORM_VERSION } from "../../lib/version.js";
import { PasswordInput } from "../../components/auth/PasswordInput.js";

/**
 * The modules this platform actually contains, in the order the sidebar presents them. Four rather
 * than six: the panel is a first impression, not an inventory, and four rows breathe where six crowd.
 */
const MODULES = [
  { name: "CRM and pipeline", line: "Leads, deals and the follow-ups behind them", icon: Users },
  { name: "Content and SEO", line: "Publishing, structured data and search performance", icon: FileText },
  { name: "Finance and invoicing", line: "Invoices, payments and statutory tax", icon: Wallet },
  { name: "People and payroll", line: "Onboarding, pay runs and remittances", icon: UsersRound },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; accepted?: string; reset?: string }>;
}): Promise<ReactNode> {
  const { error, accepted, reset } = await searchParams;

  return (
    <div className="flex min-h-screen bg-white">
      {/* Brand panel */}
      <aside className="relative hidden w-[44%] max-w-[560px] shrink-0 overflow-hidden lg:flex lg:flex-col">
        {/* Ground: deep ink, so the purple reads as light rather than as paint. */}
        <div className="absolute inset-0 bg-[#0D0A1C]" />
        {/* One large aurora anchored off-canvas, so the falloff across the panel is asymmetric instead
            of a centred blob, and a tighter accent low and right to stop the base going flat. */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(120% 80% at -10% -15%, rgba(106,85,242,0.42) 0%, rgba(84,60,218,0.14) 42%, transparent 70%)," +
              "radial-gradient(70% 55% at 108% 105%, rgba(124,107,240,0.30) 0%, transparent 62%)",
          }}
        />
        {/* A fine grid, barely there. It gives the surface a sense of being engineered and keeps the
            large empty areas from looking unfinished. */}
        <div
          className="absolute inset-0 opacity-[0.055]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(120% 90% at 20% 10%, #000 30%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(120% 90% at 20% 10%, #000 30%, transparent 78%)",
          }}
        />
        {/* A single hairline down the seam, catching the light. */}
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-12">
          <div className="flex items-center gap-2.5">
            <img src="/logo-mark-white.png" alt="" className="h-8 w-auto" />
            <span className="font-roboto text-[1.05rem] font-700 leading-none text-white">
              NEXORIS
              <span className="mt-1 block font-mono text-[0.52rem] font-500 tracking-[0.24em] text-white/60">
                TECHNOLOGIES
              </span>
            </span>
          </div>

          <div>
            {/* A short rule instead of gradient-clipped type: the colour is carried by an element that
                can be controlled, and the headline stays solid and legible at every weight. */}
            <span className="block h-[3px] w-10 rounded-full bg-gradient-to-r from-[#6A55F2] to-[#C4B9F5]" />
            <h1 className="mt-6 text-[2.3rem] font-700 leading-[1.1] tracking-[-0.025em] text-white">
              One place to run
              <span className="block text-white/90">the whole business.</span>
            </h1>
            <p className="mt-5 max-w-[23rem] text-[0.97rem] leading-[1.65] text-white/60">
              Pipeline, publishing, people and money, working from one set of records.
            </p>

            {/* Real modules, real icons from the set the rest of the platform uses. */}
            <ul className="mt-10 flex max-w-[23rem] flex-col gap-[18px]">
              {MODULES.map((m) => (
                <li key={m.name} className="flex items-start gap-3.5">
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-white/10 bg-white/[0.06] text-[#C4B9F5]">
                    <m.icon size={16} strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[0.88rem] font-600 leading-tight text-white/90">{m.name}</span>
                    <span className="mt-0.5 block text-[0.8rem] leading-snug text-white/45">{m.line}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between border-t border-white/[0.07] pt-5 text-[0.72rem]">
            <span className="font-mono tracking-wide text-white/30">v{PLATFORM_VERSION}</span>
            <span className="text-white/30">Nexoris Technologies Limited</span>
          </div>
        </div>
      </aside>

      {/* Form */}
      <main className="flex flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-[380px]">
          <div className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
            <img src="/logo-mark-purple.png" alt="" className="h-8 w-auto" />
            <span className="font-roboto text-[1rem] font-700 text-slate-900">Nexoris Technologies</span>
          </div>

          <h2 className="text-center text-[1.35rem] font-700 text-slate-900">Sign in to your account</h2>

          <form action="/api/auth/login" method="post" className="mt-7 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[0.82rem] font-600 text-slate-700">Email address</span>
              <input
                name="email"
                type="email"
                autoComplete="username"
                required
                // The testing account, prefilled while developing only. In production this is empty:
                // a sign-in form that names a real account is telling an attacker which address to
                // attack, and it survives into a deployment far too easily.
                {...(process.env.NODE_ENV === "production" ? {} : { defaultValue: "admin@nexoristech.com" })}
                placeholder="you@nexoristech.com"
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[0.9rem] text-slate-900 placeholder:text-slate-500 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[0.82rem] font-600 text-slate-700">Password</span>
              <PasswordInput name="password" defaultValue="NexorisAdmin2026!" />
            </label>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-[0.82rem] text-slate-600">
                <input type="checkbox" name="remember" className="h-4 w-4 cursor-pointer rounded accent-[#543CDA]" />
                Remember me
              </label>
              <Link href="/forgot-password" className="text-[0.82rem] font-600 text-[#543CDA] hover:text-[#4330B8]">
                Forgot password?
              </Link>
            </div>

            {/* Someone arriving from an invitation link has just set a password; say so, or they cannot
                tell whether it worked. */}
            {accepted ? (
              <p className="rounded-lg border border-[#BBF7D0] bg-[#DCFCE7] px-3.5 py-2.5 text-[0.82rem] text-[#15803D]" role="status">
                Your password is set. Sign in to continue.
              </p>
            ) : null}

            {/* Arriving from a completed reset. Every other session was signed out, which is worth
                saying so it is not mistaken for something going wrong. */}
            {reset ? (
              <p className="rounded-lg border border-[#BBF7D0] bg-[#DCFCE7] px-3.5 py-2.5 text-[0.82rem] text-[#15803D]" role="status">
                Your password has been changed and you were signed out everywhere else. Sign in with
                your new password.
              </p>
            ) : null}

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[0.82rem] text-red-700" role="alert">
                Those details did not match. Please try again.
              </p>
            ) : null}

            <button
              type="submit"
              className="mt-1 w-full cursor-pointer rounded-lg bg-[#543CDA] py-2.5 text-[0.9rem] font-600 text-white transition-colors hover:bg-[#4330B8]"
            >
              Sign In
            </button>

            {/* An "or - Sign in with SSO" button stood here with no handler and no identity provider
                behind it. Offering a second way in that cannot work is worse than offering one. */}
          </form>

          <p className="mt-6 text-center text-[0.76rem] leading-relaxed text-slate-500">
            By signing in, you agree to our{" "}
            <span className="font-600 text-[#543CDA]">Terms of Service</span> and{" "}
            <span className="font-600 text-[#543CDA]">Privacy Policy</span>.
          </p>
        </div>
      </main>
    </div>
  );
}
