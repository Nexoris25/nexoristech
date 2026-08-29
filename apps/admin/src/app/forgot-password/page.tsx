/**
 * 1.2 Forgot Password. A centered card: back-to-login link, the heading and helper text, the email
 * field, a send button, and a support footer. The form records a reset request and returns with
 * ?sent=1, which swaps in a confirmation line.
 *
 * The confirmation depends on whether email can actually be sent, and that is the whole point of this
 * file now. With a provider configured, the link goes to the address on the staff record and the
 * wording stays vague on purpose: saying "a link is on its way" whether or not the account exists is
 * what stops this form being used to discover which addresses are registered.
 *
 * With no provider, that same sentence would be a lie, and worse than a lie: a locked-out person would
 * sit waiting for mail that is never coming rather than asking anyone. So the request is still
 * recorded, and the page says plainly that an administrator will send the link. The request reaching
 * the admin through the platform is what makes that a loop rather than a dead end, and it appears on
 * People and Access the moment it is made.
 *
 * The property worth protecting through all of this is that nobody but the person ever knows their
 * password. An administrator can start a reset; only the holder of the link can finish it.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Headphones, CheckCircle2, UserCheck } from "lucide-react";
import { emailConfigured } from "../../lib/email.js";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}): Promise<ReactNode> {
  const { sent } = await searchParams;
  // What will actually happen when they press the button.
  const byEmail = await emailConfigured();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10">
      <div className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_10px_40px_rgba(15,23,42,0.06)] sm:p-9">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-[0.82rem] font-600 text-[#543CDA] hover:text-[#4330B8]">
          <ArrowLeft size={15} strokeWidth={2.2} /> Back to login
        </Link>

        <div className="mt-6 flex justify-center">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-[#F4F1FD]">
            <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10">
              <rect x="8" y="14" width="32" height="22" rx="3" stroke="#6A55F2" strokeWidth="2.2" />
              <path d="M8 17 L24 28 L40 17" stroke="#6A55F2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M30 10 L44 6 L40 20 Z" fill="#543CDA" opacity="0.85" />
            </svg>
          </span>
        </div>

        <h1 className="mt-5 text-center text-[1.3rem] font-700 text-slate-900">Forgot your password?</h1>
        <p className="mx-auto mt-2 max-w-[19rem] text-center text-[0.88rem] leading-relaxed text-slate-500">
          {byEmail
            ? "Enter your email address and we'll send you a link to reset your password."
            : "Enter your email address and an administrator will send you a secure link to set a new password. Nobody is ever told your password, and the link works once."}
        </p>

        {sent ? (
          byEmail ? (
            <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-[0.84rem] text-green-700">
              <CheckCircle2 size={17} strokeWidth={2} className="mt-0.5 shrink-0" />
              If that email is registered, a reset link is on its way.
            </div>
          ) : (
            /* Deliberately not "a link is on its way". No mail is going anywhere, and telling somebody
               locked out to watch their inbox would leave them waiting instead of asking. This still
               says nothing about whether the address is registered. */
            <div className="mt-6 flex items-start gap-2.5 rounded-lg border border-[#543CDA]/25 bg-[#F6F4FE] px-4 py-3 text-[0.84rem] text-slate-700">
              <UserCheck size={17} strokeWidth={2} className="mt-0.5 shrink-0 text-[#543CDA]" />
              <span>
                Your request has been recorded. An administrator will send you a link to set a new
                password. If it is urgent, contact them directly and mention that you have requested a
                reset.
              </span>
            </div>
          )
        ) : (
          <form action="/api/auth/forgot" method="post" className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-[0.82rem] font-600 text-slate-700">Email address</span>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-[0.9rem] text-slate-900 placeholder:text-slate-500 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15"
              />
            </label>
            <button type="submit" className="w-full cursor-pointer rounded-lg bg-[#543CDA] py-2.5 text-[0.9rem] font-600 text-white transition-colors hover:bg-[#4330B8]">
              {byEmail ? "Send reset link" : "Request a reset link"}
            </button>
          </form>
        )}

        <div className="mt-4 text-center">
          <Link href="/login" className="text-[0.84rem] font-600 text-[#543CDA] hover:text-[#4330B8]">
            Back to login
          </Link>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-[#543CDA] shadow-subtle">
            <Headphones size={16} strokeWidth={2} />
          </span>
          <span className="text-[0.8rem] leading-snug text-slate-600">
            <span className="font-600 text-slate-800">Need help?</span>
            <br />
            Contact our support team at <span className="font-600 text-[#543CDA]">support@nexoris.com</span>
          </span>
        </div>
      </div>
    </div>
  );
}
