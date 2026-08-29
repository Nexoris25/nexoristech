/**
 * The one time recovery codes are ever shown.
 *
 * Reached immediately after somebody sets their password on an invitation. The codes arrive in the
 * URL fragment rather than the query string, which is the point of the redirect that sends them here:
 * a fragment is never sent to the server, so the codes are not in a request log, an access log, a
 * referrer header, or the server-rendered HTML of this page. They exist in the browser and nowhere
 * else, and the page is rendered by the client component below from what it finds after the hash.
 *
 * There is deliberately no way back to this screen. Only the SHA-256 of each code is stored, so no
 * page could show them again even if one wanted to; somebody who loses them regenerates a new set or
 * asks an administrator for a reset link.
 */
import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { RecoveryCodesView } from "./RecoveryCodesView.js";

export const metadata = { title: "Your recovery codes" };

export default function RecoveryCodesPage(): ReactNode {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-7 shadow-subtle sm:p-8">
        <div className="flex items-center gap-2.5">
          <img src="/logo-mark-purple.png" alt="Nexoris Technologies" className="h-9 w-9 object-contain" />
          <span className="font-roboto text-[1.05rem] font-700 leading-none text-slate-900">
            Nexoris
            <span className="mt-1 block font-mono text-[0.52rem] font-500 tracking-[0.24em] text-slate-500">
              TECHNOLOGIES
            </span>
          </span>
        </div>

        <div className="mt-6 flex items-center gap-2 text-[#543CDA]">
          <ShieldCheck size={18} />
          <h1 className="text-[1.15rem] font-700 text-slate-900">Save your recovery codes</h1>
        </div>
        <p className="mt-1.5 text-[0.86rem] text-slate-600">
          Your account is active. These codes let you reset your own password if you ever forget it.
          Each one works once. This is the only time they will be shown.
        </p>

        <RecoveryCodesView />
      </div>
    </div>
  );
}
