"use client";
/**
 * The floating Oge assistant, bottom-right on every dashboard screen. A round avatar launcher (the
 * same Oge mark as the website) opens a calm dark chat panel. Closes on the launcher, on the close
 * button, and on Escape. The conversation itself lives in OgeChat, which answers only within the
 * signed-in user's permissions. Full-screen sheet on small screens, a docked panel on desktop.
 */
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { OgeMark } from "./OgeMark.js";
import { OgeChat } from "./OgeChat.js";

export function OgeWidget({ firstName }: { firstName?: string | undefined }): ReactNode {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-[60] sm:inset-auto sm:bottom-24 sm:right-6">
          <button type="button" aria-label="Close Oge" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/40 sm:hidden" />
          <div className="absolute inset-x-0 bottom-0 flex h-[85dvh] max-h-[85dvh] flex-col overflow-hidden rounded-t-2xl bg-[#14112e] shadow-2xl sm:static sm:h-[540px] sm:max-h-[calc(100dvh-7rem)] sm:w-[380px] sm:rounded-2xl sm:border sm:border-white/10">
            <div className="flex shrink-0 items-center gap-2.5 border-b border-white/10 bg-gradient-to-r from-[#543CDA] to-[#4330B8] px-4 py-3">
              <OgeMark size={30} className="rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="text-[0.9rem] font-700 leading-tight text-white">Oge</p>
                <p className="text-[0.7rem] text-white/70">Nexoris Technologies assistant</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"><X size={18} strokeWidth={2} /></button>
            </div>
            <div className="min-h-0 flex-1">
              <OgeChat variant="panel" firstName={firstName} />
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close Oge" : "Ask Oge"}
        className="fixed bottom-6 right-6 z-[55] grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-[#543CDA] to-[#4330B8] shadow-[0_10px_30px_rgba(84,60,218,0.45)] transition-transform hover:scale-105"
      >
        {open ? <X size={22} strokeWidth={2.2} className="text-white" /> : <OgeMark size={36} className="rounded-xl" />}
      </button>
    </>
  );
}
