"use client";
/**
 * The Oge assistant widget (PRD 10.5): a floating button bottom-right with one gentle first-visit
 * pulse, opening a chat panel that streams grounded answers over server-sent events, names and
 * links its sources, and shows a handoff panel (WhatsApp, contact, email) when offered. It speaks
 * to the gateway through the same-origin /api/chat proxy. Off-topic declines and failures are
 * handled by the gateway and shown as plain messages, never error codes.
 */
import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { Button } from "@nexoris/ui";

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

const GREETING =
  "Hi, I am Oge. Ask me anything about what Nexoris Technologies does and how we can help.";

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
  const sessionId = useRef<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionId.current =
      globalThis.crypto?.randomUUID?.() ?? `s${Date.now()}`;
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
  }, [messages]);

  function patchLast(patch: (m: Message) => Message): void {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      copy[copy.length - 1] = patch(copy[copy.length - 1] as Message);
      return copy;
    });
  }

  async function send(event: FormEvent): Promise<void> {
    event.preventDefault();
    const text = input.trim();
    if (text.length === 0 || streaming) return;

    const history = messages
      .filter((m) => m.text.length > 0)
      .slice(-6)
      .map((m) => ({
        role: m.role === "visitor" ? "user" : "assistant",
        content: m.text,
      }));

    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "visitor", text },
      { id: nextId(), role: "oge", text: "" },
    ]);
    setInput("");
    setStreaming(true);

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
        text:
          m.text ||
          "Something went wrong reaching the assistant. Please try again, or reach the team on the contact page.",
      }));
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Chat with Nexoris Technologies"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-purple-600 text-white shadow-lg hover:bg-purple-700"
      >
        {pulse ? (
          <span
            aria-hidden="true"
            className="absolute inset-0 animate-ping rounded-full bg-purple-600 opacity-60"
          />
        ) : null}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 17 0z"
          />
        </svg>
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Chat with Nexoris Technologies"
      className="fixed bottom-5 right-5 z-50 flex h-[32rem] max-h-[80vh] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-card border border-purple-200 bg-white shadow-2xl"
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <div className="flex items-center justify-between bg-ink-950 px-4 py-3 text-white">
        <span className="font-syne text-label font-700">
          Oge, the Nexoris Technologies assistant
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close the chat"
          className="cursor-pointer rounded p-1 text-purple-200 hover:text-white"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div
        ref={logRef}
        aria-live="polite"
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {messages.length === 0 ? (
          <p className="text-label text-neutral-600">{GREETING}</p>
        ) : null}
        <ul className="flex flex-col gap-3">
          {messages.map((message) => (
            <li
              key={message.id}
              className={
                message.role === "visitor" ? "flex justify-end" : "flex"
              }
            >
              <div
                className={
                  message.role === "visitor"
                    ? "max-w-[85%] rounded-card bg-purple-600 px-3 py-2 text-label text-white"
                    : "max-w-[90%] rounded-card bg-purple-100 px-3 py-2 text-label text-ink-950"
                }
              >
                <p className="whitespace-pre-wrap">
                  {message.text ||
                    (message.role === "oge" && streaming ? "…" : "")}
                </p>
                {message.sources && message.sources.length > 0 ? (
                  <ul className="mt-2 flex flex-col gap-1 border-t border-purple-200 pt-2">
                    {message.sources.slice(0, 3).map((source) => (
                      <li key={source.url}>
                        <Link
                          href={source.url}
                          className="cursor-pointer font-600 text-purple-700 hover:text-purple-600"
                        >
                          {source.title.replace(
                            " | Nexoris Technologies",
                            "",
                          )}{" "}
                          &rarr;
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {message.handoff ? (
                  <div className="mt-2 flex flex-col gap-1 border-t border-purple-200 pt-2 text-label">
                    <a
                      href={message.handoff.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="cursor-pointer font-600 text-purple-700 hover:text-purple-600"
                    >
                      Message us on WhatsApp &rarr;
                    </a>
                    <Link
                      href={message.handoff.contactUrl}
                      className="cursor-pointer font-600 text-purple-700 hover:text-purple-600"
                    >
                      Go to the contact page &rarr;
                    </Link>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </div>

      <form
        onSubmit={send}
        className="flex items-center gap-2 border-t border-purple-200 p-3"
      >
        <label htmlFor="oge-input" className="sr-only">
          Type your message to Oge
        </label>
        <input
          id="oge-input"
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about our services"
          maxLength={2000}
          className="min-w-0 flex-1 rounded-card border border-purple-200 p-2 text-label text-ink-950"
        />
        <Button type="submit" size="md" disabled={streaming || input.trim().length === 0}>
          Send
        </Button>
      </form>
    </div>
  );
}
