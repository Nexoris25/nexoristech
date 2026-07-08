"use client";
/**
 * Oge, the Nexoris Technologies website assistant (PRD 10.5), redesigned to the approved "Meet Oge"
 * handoff. A floating avatar launcher opens a calm dark chat panel that streams grounded answers
 * over server-sent events, names and links its sources, offers a lead-capture step that shows
 * exactly what will be sent before it goes to the team, and degrades to a WhatsApp/contact fallback
 * when the assistant is unavailable. It speaks to the gateway through the same-origin /api/chat
 * proxy and files leads through /api/contact. A small window.Oge API lets the Meet-Oge page and the
 * homepage Solution Finder open it or start it on a question. Styling: styles/oge-widget.css.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { OgeMark } from "./home/OgeMark.js";

interface Source {
  url: string;
  title: string;
}
interface Handoff {
  message: string;
  whatsapp: string;
  contactUrl: string;
  email: string;
}
interface Message {
  id: string;
  role: "visitor" | "oge";
  text: string;
  sources?: Source[];
  handoff?: Handoff;
}

type ChatEvent =
  | { type: "meta" }
  | { type: "sources"; sources: Source[] }
  | { type: "token"; text: string }
  | ({ type: "handoff" } & Handoff)
  | { type: "notice"; message: string }
  | { type: "done" };

type LeadStage = "form" | "confirm" | "sending" | "sent" | "error";
interface Lead {
  stage: LeadStage;
  name: string;
  contact: string;
  topic: string;
}

const GREETING =
  "Hi, I am Oge. Ask me what we build, how we work, or what something costs. I answer from our own pages and can connect you to the team.";

const WHATSAPP = "https://wa.me/2349138133224";
const EMAIL = "business@nexoristech.com";

const TOPICS = [
  "New product or software",
  "Automating busywork",
  "A chatbot or assistant",
  "Data and dashboards",
  "Managed support",
  "Something else",
];

declare global {
  interface Window {
    Oge?: {
      open: () => void;
      close: () => void;
      fallback: () => void;
      ask: (text: string) => void;
    };
  }
}

let messageCounter = 0;
function nextId(): string {
  messageCounter += 1;
  return `m${messageCounter}`;
}

export function OgeWidget(): ReactNode {
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [lead, setLead] = useState<Lead | null>(null);
  const sessionId = useRef<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const streamingRef = useRef(false);
  const messagesRef = useRef<Message[]>([]);

  messagesRef.current = messages;

  useEffect(() => {
    sessionId.current = globalThis.crypto?.randomUUID?.() ?? `s${Date.now()}`;
    setPulse(localStorage.getItem("oge-seen") !== "1");
  }, []);

  useEffect(() => {
    if (open) {
      setPulse(false);
      localStorage.setItem("oge-seen", "1");
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, lead]);

  function patchLast(patch: (m: Message) => Message): void {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      copy[copy.length - 1] = patch(copy[copy.length - 1] as Message);
      return copy;
    });
  }

  const runSend = useCallback(async (raw: string): Promise<void> => {
    const text = raw.trim();
    if (text.length === 0 || streamingRef.current) return;

    const history = messagesRef.current
      .filter((m) => m.text.length > 0)
      .slice(-6)
      .map((m) => ({ role: m.role === "visitor" ? "user" : "assistant", content: m.text }));

    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "visitor", text },
      { id: nextId(), role: "oge", text: "" },
    ]);
    setInput("");
    setStreaming(true);
    streamingRef.current = true;

    try {
      const response = await fetch("/api/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId: sessionId.current, history }),
      });
      const reader = response.body?.getReader();
      if (!reader) throw new Error("no stream");
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";
        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line.startsWith("data:")) continue;
          let parsed: ChatEvent;
          try {
            parsed = JSON.parse(line.slice(5).trim()) as ChatEvent;
          } catch {
            continue;
          }
          if (parsed.type === "token") {
            patchLast((m) => ({ ...m, text: m.text + parsed.text }));
          } else if (parsed.type === "sources") {
            patchLast((m) => ({ ...m, sources: parsed.sources }));
          } else if (parsed.type === "handoff") {
            patchLast((m) => ({
              ...m,
              handoff: {
                message: parsed.message,
                whatsapp: parsed.whatsapp,
                contactUrl: parsed.contactUrl,
                email: parsed.email,
              },
            }));
          } else if (parsed.type === "notice") {
            patchLast((m) => ({ ...m, text: m.text + parsed.message }));
          }
        }
      }
    } catch {
      patchLast((m) => ({
        ...m,
        text: m.text || "I am having trouble reaching the assistant right now. Here is how to reach the team directly.",
        handoff: {
          message: "Reach the Nexoris Technologies team.",
          whatsapp: WHATSAPP,
          contactUrl: "/contact",
          email: EMAIL,
        },
      }));
    } finally {
      setStreaming(false);
      streamingRef.current = false;
      inputRef.current?.focus();
    }
  }, []);

  // window.Oge API for the Meet-Oge page and the Solution Finder.
  useEffect(() => {
    window.Oge = {
      open: () => setOpen(true),
      close: () => setOpen(false),
      fallback: () => {
        setOpen(true);
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "oge",
            text: "I am having trouble generating a full response right now. The team can help you with anything I cannot.",
            handoff: { message: "", whatsapp: WHATSAPP, contactUrl: "/contact", email: EMAIL },
          },
        ]);
      },
      ask: (text: string) => {
        setOpen(true);
        void runSend(text);
      },
    };
    return () => {
      delete window.Oge;
    };
  }, [runSend]);

  function onSubmit(event: FormEvent): void {
    event.preventDefault();
    void runSend(input);
  }

  function startLead(): void {
    setLead({ stage: "form", name: "", contact: "", topic: TOPICS[0]! });
  }

  async function submitLead(): Promise<void> {
    if (!lead) return;
    setLead({ ...lead, stage: "sending" });
    const transcript = messagesRef.current
      .filter((m) => m.text.length > 0)
      .map((m) => `${m.role === "visitor" ? "You" : "Oge"}: ${m.text}`)
      .join("\n");
    try {
      const res = await fetch("/api/contact/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.name,
          contact: lead.contact,
          topic: lead.topic,
          source: "oge-chat",
          message: `Lead captured by Oge. Topic: ${lead.topic}.`,
          transcript,
        }),
      });
      setLead((l) => (l ? { ...l, stage: res.ok ? "sent" : "error" } : l));
    } catch {
      setLead((l) => (l ? { ...l, stage: "error" } : l));
    }
  }

  const Avatar = ({ size }: { size: number }): ReactNode => (
    <span className="ogw-av">
      <OgeMark size={size} />
    </span>
  );

  if (!open) {
    return (
      <button type="button" className="ogw-launch" onClick={() => setOpen(true)} aria-label="Chat with Oge, the Nexoris Technologies assistant">
        {pulse ? <span className="ogw-ring" aria-hidden="true" /> : null}
        <Avatar size={60} />
        <span className="ogw-online" aria-hidden="true" />
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Chat with Oge, the Nexoris Technologies assistant"
      className="ogw-panel"
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <div className="ogw-head">
        <span className="ogw-avwrap">
          <span className="ogw-av">
            <OgeMark size={40} />
          </span>
          <span className="ogw-online" aria-hidden="true" />
        </span>
        <span className="hx">
          <b>Oge</b>
          <span className="sub">
            <i />
            Nexoris Technologies assistant
          </span>
        </span>
        <button type="button" className="ogw-close" onClick={() => setOpen(false)} aria-label="Close the chat">
          <svg viewBox="0 0 24 24">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div ref={logRef} className="ogw-log" aria-live="polite">
        {/* Greeting */}
        <div className="ogw-row">
          <span className="ogw-mav">
            <OgeMark size={26} />
          </span>
          <div className="ogw-bub oge">
            <p>{GREETING}</p>
            <div className="ogw-actions">
              <button type="button" className="ogw-btn ghost" onClick={startLead}>
                Talk to the team
              </button>
            </div>
          </div>
        </div>

        {messages.map((m) =>
          m.role === "visitor" ? (
            <div className="ogw-row me" key={m.id}>
              <div className="ogw-bub me">
                <p>{m.text}</p>
              </div>
            </div>
          ) : (
            <div className="ogw-row" key={m.id}>
              <span className="ogw-mav">
                <OgeMark size={26} />
              </span>
              <div className="ogw-bub oge">
                {m.text.length > 0 ? (
                  <p>{m.text}</p>
                ) : streaming ? (
                  <span className="ogw-typing" aria-label="Oge is typing">
                    <i />
                    <i />
                    <i />
                  </span>
                ) : (
                  <p>…</p>
                )}
                {m.handoff ? (
                  <div className="ogw-actions">
                    <a className="ogw-btn wa" href={m.handoff.whatsapp} target="_blank" rel="noopener noreferrer">
                      Message us on WhatsApp
                    </a>
                    <button type="button" className="ogw-btn ghost" onClick={startLead}>
                      Share your details instead
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ),
        )}

        {/* Lead capture */}
        {lead ? (
          <div className="ogw-row">
            <span className="ogw-mav">
              <OgeMark size={26} />
            </span>
            <div className="ogw-bub oge" style={{ maxWidth: "92%" }}>
              {lead.stage === "form" ? (
                <>
                  <p>Happy to connect you. A couple of details and I will show you exactly what goes to the team.</p>
                  <div className="ogw-lead">
                    <label htmlFor="ogw-name">Your name</label>
                    <input
                      id="ogw-name"
                      value={lead.name}
                      onChange={(e) => setLead({ ...lead, name: e.target.value })}
                      placeholder="e.g. Ada Obi"
                      maxLength={80}
                    />
                    <label htmlFor="ogw-contact">Email or phone</label>
                    <input
                      id="ogw-contact"
                      value={lead.contact}
                      onChange={(e) => setLead({ ...lead, contact: e.target.value })}
                      placeholder="e.g. ada@shop.ng"
                      maxLength={120}
                    />
                    <label htmlFor="ogw-topic">What is it about?</label>
                    <select id="ogw-topic" value={lead.topic} onChange={(e) => setLead({ ...lead, topic: e.target.value })}>
                      {TOPICS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <div className="ogw-actions">
                      <button
                        type="button"
                        className="ogw-btn primary"
                        disabled={lead.name.trim().length === 0 || lead.contact.trim().length === 0}
                        onClick={() => setLead({ ...lead, stage: "confirm" })}
                      >
                        Review before sending
                      </button>
                      <button type="button" className="ogw-btn ghost" onClick={() => setLead(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              ) : lead.stage === "confirm" || lead.stage === "sending" ? (
                <>
                  <p>Here is exactly what goes to the team, with our chat attached.</p>
                  <div className="ogw-lead">
                    <div className="lk">Confirm before sending</div>
                    <div className="ogw-conf">
                      <div className="cl">
                        <span>Name</span>
                        <b>{lead.name}</b>
                      </div>
                      <div className="cl">
                        <span>Contact</span>
                        <b>{lead.contact}</b>
                      </div>
                      <div className="cl">
                        <span>Topic</span>
                        <b>{lead.topic}</b>
                      </div>
                      <div className="cl">
                        <span>Transcript</span>
                        <b>Attached</b>
                      </div>
                    </div>
                    <div className="ogw-actions">
                      <button type="button" className="ogw-btn primary" disabled={lead.stage === "sending"} onClick={() => void submitLead()}>
                        {lead.stage === "sending" ? "Sending…" : "Send to the team"}
                      </button>
                      <button type="button" className="ogw-btn ghost" disabled={lead.stage === "sending"} onClick={() => setLead({ ...lead, stage: "form" })}>
                        Edit
                      </button>
                    </div>
                  </div>
                </>
              ) : lead.stage === "sent" ? (
                <p>
                  Thank you, {lead.name.split(" ")[0]}. Your details and our chat are with the team, and someone
                  will reply within one business day.
                </p>
              ) : (
                <>
                  <p>
                    I could not send that just now. Please email us at <b>{EMAIL}</b> or message us on WhatsApp and
                    we will pick it up.
                  </p>
                  <div className="ogw-actions">
                    <a className="ogw-btn wa" href={WHATSAPP} target="_blank" rel="noopener noreferrer">
                      Message us on WhatsApp
                    </a>
                    <button type="button" className="ogw-btn ghost" onClick={() => setLead({ ...lead, stage: "confirm" })}>
                      Try again
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <form className="ogw-foot" onSubmit={onSubmit}>
        <label htmlFor="ogw-input" className="sr-only">
          Type your message to Oge
        </label>
        <input
          id="ogw-input"
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about our services…"
          maxLength={2000}
          autoComplete="off"
        />
        <button className="ogw-send" type="submit" disabled={streaming || input.trim().length === 0} aria-label="Send">
          <svg viewBox="0 0 24 24">
            <path d="M4 12l16-8-6 16-3.5-6.5L4 12z" />
          </svg>
        </button>
      </form>
    </div>
  );
}
