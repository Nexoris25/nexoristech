"use client";
/**
 * An interactive preview of Oge, the Nexoris Technologies assistant, for the "Our AI approach"
 * section. It cycles through real questions and answers (grounded in the site's own copy, no
 * fabrication), with a typing indicator, so the section shows the AI product working rather than
 * a robot stock image. Uses the Oge avatar mark. Pauses under reduced-motion.
 */
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Send } from "lucide-react";
import { OgeMark } from "./OgeMark.js";

const PAIRS: { q: string; a: string }[] = [
  {
    q: "Do I actually need AI in my product?",
    a: "Not always. We add AI only where it genuinely makes the product better, and we tell you plainly when it does not.",
  },
  {
    q: "How long does a business website take?",
    a: "Usually four to eight weeks. A custom system or app runs three to six months, delivered in stages you can see.",
  },
  {
    q: "Who owns the code when it is done?",
    a: "You do. Every source file and design is handed to your team at the end. Nothing is held back.",
  },
  {
    q: "Do you build for Nigerian payment systems?",
    a: "Yes. We build for local payments, patchy connectivity, and how business is actually done here.",
  },
];

export function OgeChat(): ReactNode {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"typing" | "answered">("typing");
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) {
      setPhase("answered");
      return;
    }
    setPhase("typing");
    const t1 = setTimeout(() => setPhase("answered"), 1100);
    const t2 = setTimeout(() => setIndex((v) => (v + 1) % PAIRS.length), 4600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [index]);

  const pair = PAIRS[index]!;

  return (
    <div className="oge-chat" aria-hidden="true">
      <div className="oge-chat-glow" />
      <div className="oge-chat-head">
        <span className="oge-chat-ava">
          <OgeMark size={38} />
          <span className="oge-chat-online" />
        </span>
        <span className="oge-chat-id">
          <b>Oge</b>
          <span>Nexoris Technologies assistant</span>
        </span>
        <span className="oge-chat-tag">AI · Live</span>
      </div>

      <div className="oge-chat-body">
        <div className="oge-q">{pair.q}</div>
        <div className="oge-a">
          <span className="oge-a-ava">
            <OgeMark size={26} />
          </span>
          {phase === "typing" ? (
            <span className="oge-typing">
              <i />
              <i />
              <i />
            </span>
          ) : (
            <span className="oge-a-bubble">{pair.a}</span>
          )}
        </div>
      </div>

      <div className="oge-chat-input">
        <span>Ask Oge about our work…</span>
        <span className="oge-send">
          <Send size={14} strokeWidth={2} />
        </span>
      </div>
    </div>
  );
}
