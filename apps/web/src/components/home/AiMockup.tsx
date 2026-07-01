/**
 * A coded AI-feature mockup for the "Our AI approach" section: the Oge assistant answering a real
 * customer question inside a product, replacing the generic robot stock image the critique flagged.
 * Tailwind + lucide-react; decorative (aria-hidden). Fills the .ai-media frame.
 */
import type { ReactNode } from "react";
import { Sparkles, ArrowRight } from "lucide-react";

export function AiMockup(): ReactNode {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 flex flex-col bg-gradient-to-br from-ink-800 to-ink-950 p-4"
    >
      {/* Assistant header */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-purple-600/30 ring-1 ring-purple-500/40">
          <Sparkles size={14} strokeWidth={2} className="text-purple-100" />
        </span>
        <div className="leading-tight">
          <div className="text-[12px] font-600 text-white">Oge</div>
          <div className="flex items-center gap-1 text-[10px] text-purple-100/60">
            <span className="h-1.5 w-1.5 rounded-full bg-mint-400" />
            Nexoris assistant
          </div>
        </div>
      </div>

      {/* Conversation */}
      <div className="flex flex-1 flex-col justify-end gap-2.5 py-3">
        <div className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-purple-600 px-3 py-2 text-[11.5px] leading-snug text-white">
          We are a Lagos clinic drowning in paper records. Can you help?
        </div>
        <div className="max-w-[90%] self-start rounded-2xl rounded-bl-md bg-white/[0.07] px-3 py-2 text-[11.5px] leading-snug text-purple-100/90 ring-1 ring-white/10">
          Yes. We build electronic health records, appointment reminders over SMS and WhatsApp, and
          HMO claim tools for clinics. Shall I map it to your setup?
        </div>
        <div className="flex gap-1.5">
          <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-600 text-purple-100/80 ring-1 ring-white/10">
            Hospital &amp; Clinic Software
          </span>
          <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-600 text-purple-100/80 ring-1 ring-white/10">
            How we work
          </span>
        </div>
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2 ring-1 ring-white/10">
        <span className="flex-1 text-[11px] text-purple-100/45">Ask about your clinic…</span>
        <span className="grid h-6 w-6 place-items-center rounded-lg bg-purple-600 text-white">
          <ArrowRight size={13} strokeWidth={2.2} />
        </span>
      </div>
    </div>
  );
}
