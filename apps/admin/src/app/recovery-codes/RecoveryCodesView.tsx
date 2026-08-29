"use client";
/**
 * Renders the codes from the URL fragment, and refuses to let somebody leave without acknowledging
 * that they have kept them.
 *
 * The fragment is read in an effect rather than during render because it does not exist on the
 * server, and reading it while rendering would produce markup that does not match what the browser
 * then produces. It is cleared from the address bar as soon as it is read, so the codes do not sit in
 * browser history or survive a screen being left open and later revisited.
 *
 * The checkbox is friction on purpose. This is the one screen whose entire value depends on the
 * person doing something, and "Continue" being available immediately is how a screen like this gets
 * clicked through and the codes lost.
 */
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Copy, Check, Download, TriangleAlert } from "lucide-react";

export function RecoveryCodesView(): ReactNode {
  const [codes, setCodes] = useState<string[]>([]);
  const [read, setRead] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const match = /codes=([^&]+)/.exec(window.location.hash);
    if (match?.[1]) setCodes(decodeURIComponent(match[1]).split(",").filter(Boolean));
    // Out of the address bar and out of history, so a shoulder or a back button does not find them.
    history.replaceState(null, "", window.location.pathname);
  }, []);

  const asText = `Nexoris Technologies recovery codes\nEach code works once. Keep them somewhere only you can reach.\n\n${codes.join("\n")}\n`;

  function copy(): void {
    void navigator.clipboard.writeText(asText).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => undefined,
    );
  }

  function download(): void {
    const url = URL.createObjectURL(new Blob([asText], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "nexoris-recovery-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (codes.length === 0) {
    return (
      <div className="mt-5 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[0.84rem] text-amber-900">
        <TriangleAlert size={17} className="mt-0.5 shrink-0" />
        <span>
          There are no codes to show. They appear once, straight after you set your password. You can
          still sign in, and an administrator can send you a reset link if you need one.
        </span>
      </div>
    );
  }

  return (
    <>
      <ul className="mt-5 grid grid-cols-1 gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
        {codes.map((c) => (
          <li key={c} className="font-mono text-[0.86rem] tracking-wide text-slate-800">
            {c}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={copy}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-[0.82rem] font-600 text-slate-700 hover:bg-slate-50">
          {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />} {copied ? "Copied" : "Copy"}
        </button>
        <button type="button" onClick={download}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-[0.82rem] font-600 text-slate-700 hover:bg-slate-50">
          <Download size={14} /> Download
        </button>
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-[0.84rem] text-slate-700">
        <input type="checkbox" checked={read} onChange={(e) => setRead(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#543CDA]" />
        <span>I have saved these codes somewhere only I can reach.</span>
      </label>

      <a href="/login?accepted=1" aria-disabled={!read} tabIndex={read ? undefined : -1}
        onClick={(e) => { if (!read) e.preventDefault(); }}
        className={`mt-4 block rounded-lg px-6 py-2.5 text-center text-[0.88rem] font-600 text-white ${read ? "bg-[#543CDA] hover:bg-[#4330B8]" : "pointer-events-none bg-slate-300"}`}>
        Continue to sign in
      </a>
    </>
  );
}
