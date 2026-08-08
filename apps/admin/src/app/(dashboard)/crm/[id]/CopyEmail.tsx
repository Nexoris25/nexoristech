"use client";
/**
 * The lead's email with click-to-copy. The address is shown on the detail page (not the list, to keep
 * the table width sane); one click copies it to the clipboard with brief confirmation feedback.
 */
import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyEmail({ email }: { email: string }): React.ReactNode {
  const [copied, setCopied] = useState(false);
  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard unavailable */ }
  }
  return (
    <button type="button" onClick={copy} title="Copy email" className="group flex min-w-0 items-center gap-1.5 text-left">
      <span className="block truncate text-[0.84rem] font-600 text-slate-900 group-hover:text-[#543CDA]">{email}</span>
      {copied
        ? <Check size={13} strokeWidth={2.4} className="shrink-0 text-[#15803D]" />
        : <Copy size={13} strokeWidth={2} className="shrink-0 text-slate-500 group-hover:text-[#543CDA]" />}
    </button>
  );
}
