"use client";
/**
 * The shareable invitation link, with a one-click copy (PRD 3.2). Invitations are not emailed, so this is
 * how a link reaches the person: an admin copies it and sends it however they normally reach them.
 *
 * The link is shown in full rather than hidden behind the button, because an admin often needs to paste
 * it somewhere the clipboard cannot reach. If the Clipboard API is unavailable (it needs a secure
 * context), the text is selected instead so a manual copy still works.
 */
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";

export function CopyLink({ link, compact = false }: { link: string; compact?: boolean }): ReactNode {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // No clipboard permission or an insecure origin: select it so the admin can copy by hand.
      inputRef.current?.select();
    }
  };

  return (
    <div className={`flex flex-col gap-2 sm:flex-row sm:items-center ${compact ? "" : "mt-2"}`}>
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
        <Link2 size={14} className="shrink-0 text-slate-500" />
        <input
          ref={inputRef}
          readOnly
          value={link}
          aria-label="Invitation link"
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 bg-transparent font-mono text-[0.76rem] text-slate-700 focus:outline-none"
        />
      </div>
      <button
        type="button"
        onClick={() => { void copy(); }}
        className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-[0.8rem] font-600 transition-colors ${copied ? "bg-[#DCFCE7] text-[#15803D]" : "bg-[#543CDA] text-white hover:bg-[#4330B8]"}`}
      >
        {copied ? <><Check size={14} strokeWidth={2.6} /> Copied</> : <><Copy size={14} strokeWidth={2.4} /> Copy link</>}
      </button>
    </div>
  );
}
