"use client";
/**
 * The Oge conversation UI, shared by the floating widget and the full Oge workspace. It posts each
 * question to /api/oge/chat and shows the grounded, permission-scoped answer. Oge only ever reports
 * what the signed-in user is allowed to see, so the same component is safe for every role. Warm, plain
 * language; nothing is sent anywhere except the question.
 */
import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Send } from "lucide-react";
import { OgeMark } from "./OgeMark.js";

interface Msg { id: number; role: "user" | "oge"; text: string }

const SUGGESTIONS = [
  "How many new leads do I have?",
  "What are we owed?",
  "Any rejected NRS invoices?",
  "Show the latest pay run",
];

export function OgeChat({ variant = "panel", firstName }: { variant?: "panel" | "page"; firstName?: string | undefined }): ReactNode {
  const greeting = `Hi${firstName ? ` ${firstName}` : ""}, I am Oge. Ask me about your leads, invoices, receivables, NRS status, payroll, or team. I answer from your live data and only within what your role can see.`;
  const [messages, setMessages] = useState<Msg[]>([{ id: 0, role: "oge", text: greeting }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, busy]);

  async function ask(text: string): Promise<void> {
    const question = text.trim();
    if (!question || busy) return;
    setInput("");
    setMessages((m) => [...m, { id: nextId.current++, role: "user", text: question }]);
    setBusy(true);
    try {
      const res = await fetch("/api/oge/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: question }) });
      const data = (await res.json()) as { text?: string; error?: string };
      setMessages((m) => [...m, { id: nextId.current++, role: "oge", text: data.text ?? data.error ?? "Something went wrong reaching me. Please try again." }]);
    } catch {
      setMessages((m) => [...m, { id: nextId.current++, role: "oge", text: "I could not reach the server just now. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }
  function onSubmit(e: FormEvent): void { e.preventDefault(); void ask(input); }

  const tall = variant === "page";

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className={`flex-1 overflow-y-auto ${tall ? "px-1 py-2" : "px-4 py-3"}`}>
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            m.role === "oge" ? (
              <div key={m.id} className="flex items-start gap-2.5">
                <span className="mt-0.5 shrink-0"><OgeMark size={26} className="rounded-lg" /></span>
                <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white/10 px-3.5 py-2.5 text-[0.85rem] leading-relaxed text-white/90">{m.text}</div>
              </div>
            ) : (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-[#543CDA] px-3.5 py-2.5 text-[0.85rem] leading-relaxed text-white">{m.text}</div>
              </div>
            )
          ))}
          {busy ? (
            <div className="flex items-center gap-2.5">
              <OgeMark size={26} className="rounded-lg" />
              <div className="flex gap-1 rounded-2xl rounded-tl-sm bg-white/10 px-3.5 py-3">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:-0.2s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60 [animation-delay:-0.1s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/60" />
              </div>
            </div>
          ) : null}

          {messages.length <= 1 && !busy ? (
            <div className="mt-1 flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => void ask(s)} className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[0.76rem] font-500 text-white/80 hover:bg-white/10 hover:text-white">{s}</button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <form onSubmit={onSubmit} className={`flex items-center gap-2 border-t border-white/10 ${tall ? "px-1 pt-3" : "p-3"}`}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Oge about your work…"
          aria-label="Ask Oge"
          className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-[0.85rem] text-white placeholder:text-white/40 focus:border-[#6A55F2] focus:outline-none"
        />
        <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#543CDA] text-white hover:bg-[#4330B8] disabled:opacity-50">
          <Send size={16} strokeWidth={2.2} />
        </button>
      </form>
    </div>
  );
}
