"use client";
/**
 * AI Chatbots & Virtual Assistants hero widget. A scripted, auto-cycling chat demo across three
 * channels — Website, WhatsApp, and a live Voice line — each with its own theming, a typing
 * indicator before replies, and a call waveform for voice. Ported from the approved handoff.
 * Tabs switch channels; the replay button restarts the current conversation. Respects
 * prefers-reduced-motion (no auto-cycle, messages shown at rest). Styling: styles/chat-widget.css.
 */
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type ChannelId = "web" | "wa" | "voice";
type Msg = { role: "me" | "them"; html: string };
type NoteIcon = "globe" | "wa" | "phone";

interface Script {
  name: string;
  status: string;
  hint: string;
  note: [NoteIcon, string];
  msgs: Msg[];
}

const SCRIPTS: Record<ChannelId, Script> = {
  web: {
    name: "Oge · Support assistant",
    status: "Trained on your content",
    hint: "Ask about hours, prices, or your order…",
    note: ["globe", "Embedded on your website · answers in seconds"],
    msgs: [
      { role: "me", html: "Do you deliver to Lekki on Sundays?" },
      {
        role: "them",
        html: "Yes. We deliver to Lekki every day including Sundays, between 10am and 6pm. Orders placed before 2pm arrive the same day.<span class='tag'>From your delivery policy</span>",
      },
      { role: "me", html: "How much is delivery there?" },
      {
        role: "them",
        html: "Delivery to Lekki Phase 1 is ₦2,500. I can start your order now, or hand you to a person if you would prefer.",
      },
    ],
  },
  wa: {
    name: "Business WhatsApp",
    status: "Official WhatsApp Business API",
    hint: "Type a message…",
    note: ["wa", "On the customer's own WhatsApp · replies in Pidgin too"],
    msgs: [
      { role: "me", html: "Una still get the blue kettle?" },
      {
        role: "them",
        html: "Yes o, the blue kettle dey in stock. Na ₦18,000, and we fit deliver am reach you tomorrow.<span class='tag'>Replies in Pidgin too</span>",
      },
      { role: "me", html: "Ok abeg reserve one for me" },
      {
        role: "them",
        html: "Done. I don hold one for you. Make I send you the payment link, or you wan talk to person?",
      },
    ],
  },
  voice: {
    name: "Voice line · Live call",
    status: "Speaking with a caller now",
    hint: "Listening to the caller…",
    note: ["phone", "Answers your phone line · live transcript"],
    msgs: [
      { role: "them", html: "<span class='who'>Assistant</span>Thank you for calling. How can I help you today?" },
      { role: "me", html: "<span class='who'>Caller</span>I want to know if my policy covers a dental check." },
      {
        role: "them",
        html: "<span class='who'>Assistant</span>Let me check your plan. Your Standard Health plan covers one dental check each year at no cost.<span class='tag'>Reads your plan rules</span>",
      },
      {
        role: "them",
        html: "<span class='who'>Assistant</span>This sounds like a claims question, so I am connecting you to an officer now with your details ready.",
      },
    ],
  },
};

const ORDER: ChannelId[] = ["web", "wa", "voice"];
const LANGS = ["English", "Pidgin", "Yoruba", "Hausa", "Igbo", "French"];

const NOTE_ICONS: Record<NoteIcon, ReactNode> = {
  globe: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 4 5.7 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.7-4-9s1.5-6.5 4-9z" />
    </svg>
  ),
  wa: (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2z" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
    </svg>
  ),
};

const TABS: { id: ChannelId; label: string; icon: ReactNode }[] = [
  {
    id: "web",
    label: "Website",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3" y="4" width="18" height="14" rx="2" />
        <path d="M3 9h18M8 21h8" />
      </svg>
    ),
  },
  {
    id: "wa",
    label: "WhatsApp",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2z" />
      </svg>
    ),
  },
  {
    id: "voice",
    label: "Voice line",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </svg>
    ),
  },
];

export function ChatWidget(): ReactNode {
  const [ch, setCh] = useState<ChannelId>("web");
  const [replayNonce, setReplayNonce] = useState(0);
  const [items, setItems] = useState<(Msg | { typing: true })[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const runId = useRef(0);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view, like a real chat window.
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items]);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const myRun = ++runId.current;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setItems([]);

    const script = SCRIPTS[ch];
    const push = (entry: Msg | { typing: true }): void => {
      if (runId.current !== myRun) return;
      setItems((prev) => [...prev, entry]);
    };
    const dropTyping = (): void => {
      if (runId.current !== myRun) return;
      setItems((prev) => prev.filter((e) => !("typing" in e)));
    };

    if (reduce) {
      setItems(script.msgs);
      return () => {
        timers.current.forEach(clearTimeout);
      };
    }

    let delay = 320;
    script.msgs.forEach((m) => {
      if (m.role === "them") {
        timers.current.push(setTimeout(() => push({ typing: true }), delay));
        delay += 720;
        timers.current.push(
          setTimeout(() => {
            dropTyping();
            push(m);
          }, delay),
        );
        delay += 560;
      } else {
        timers.current.push(setTimeout(() => push(m), delay));
        delay += 720;
      }
    });
    // advance to the next channel once the conversation has settled
    timers.current.push(
      setTimeout(() => {
        if (runId.current !== myRun) return;
        setCh((prev) => ORDER[(ORDER.indexOf(prev) + 1) % ORDER.length]!);
      }, delay + 2600),
    );

    return () => {
      timers.current.forEach(clearTimeout);
    };
  }, [ch, replayNonce]);

  const script = SCRIPTS[ch];

  return (
    <div className={`chatw reveal ch-${ch}`} aria-label="Assistant demo">
      <div className="chatw-tabs" role="tablist" aria-label="Assistant channel">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={ch === t.id}
            className={`chatw-tab${ch === t.id ? " on" : ""}`}
            onClick={() => setCh(t.id)}
          >
            {t.icon}
            <span className="lbl">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="chatw-head">
        <span className="ava">
          <svg viewBox="0 0 24 24">
            <rect x="5" y="7" width="14" height="11" rx="3" />
            <path d="M12 7V4M9 12h.01M15 12h.01M9 15h6" />
          </svg>
        </span>
        <div>
          <b>{script.name}</b>
          <span className="sub">
            <span className="live" />
            {script.status}
          </span>
        </div>
        <span className="chatw-wave" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
      </div>

      <div className="chatw-body" ref={bodyRef}>
        {items.map((entry, i) =>
          "typing" in entry ? (
            <div className="chatw-bub typing" key={`t${i}`} aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
          ) : (
            <div
              className={`chatw-bub ${entry.role === "me" ? "me" : "them"}`}
              key={i}
              dangerouslySetInnerHTML={{ __html: entry.html }}
            />
          ),
        )}
      </div>

      <div className="chatw-foot">
        <span className="fake-in">{script.hint}</span>
        <button
          className="send"
          type="button"
          aria-label="Replay the conversation"
          onClick={() => setReplayNonce((n) => n + 1)}
        >
          <svg viewBox="0 0 24 24">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      <div className="chatw-note">
        {NOTE_ICONS[script.note[0]]}
        <span>{script.note[1]}</span>
      </div>

      <div className="chatw-langs">
        <span className="ll">Speaks today</span>
        {LANGS.map((l) => (
          <span className="lchip" key={l}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
