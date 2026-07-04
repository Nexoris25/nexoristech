"use client";
/**
 * The Solution Finder quiz on the homepage, ported from the approved design handoff. Five
 * questions, each answer scores one of four categories (build / auto / bot / data); the highest
 * score yields a recommendation with an icon, title, and plain-language description, plus a CTA.
 * Pure client-side, ephemeral state. Styling lives in styles/design.css.
 */
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";

type Cat = "build" | "auto" | "bot" | "data";

const QUESTIONS: { q: string; a: [string, Cat][] }[] = [
  {
    q: "What is frustrating you most right now?",
    a: [
      ["My team retypes the same data into several tools", "auto"],
      ["Customers message after hours and nobody replies", "bot"],
      ["I make decisions on old or unclear numbers", "data"],
      ["We have a product idea but no system yet", "build"],
    ],
  },
  {
    q: "Where does most of that pain show up?",
    a: [
      ["Day-to-day operations and admin", "auto"],
      ["Sales, enquiries, and customer support", "bot"],
      ["Reporting and management decisions", "data"],
      ["A new product we want to launch", "build"],
    ],
  },
  {
    q: "How are you handling it today?",
    a: [
      ["Spreadsheets and manual work", "auto"],
      ["A few people answering messages all day", "bot"],
      ["Pulling numbers together by hand", "data"],
      ["Nothing built yet, still planning", "build"],
    ],
  },
  {
    q: "What would a good outcome look like?",
    a: [
      ["The repetitive work just disappears", "auto"],
      ["Every customer answered, at any hour", "bot"],
      ["Clear dashboards I can act on", "data"],
      ["A working product my customers use", "build"],
    ],
  },
  {
    q: "How soon do you want to move?",
    a: [
      ["As soon as possible", "build"],
      ["Within the next three months", "auto"],
      ["Later this year", "data"],
      ["Just exploring for now", "bot"],
    ],
  },
];

const RECS: Record<Cat, { title: string; desc: string; ic: string; path: ReactNode }> = {
  build: {
    title: "AI Product Development",
    desc: "You described building something new. We would start by designing and scoping the product around how your business actually works, then build it in stages you can see.",
    ic: "ci1",
    path: (
      <>
        <path d="M3 7l9-4 9 4-9 4-9-4z" />
        <path d="M3 7v10l9 4 9-4V7" />
      </>
    ),
  },
  auto: {
    title: "Business Process Automation",
    desc: "The repetitive work is the bottleneck. We would map the busywork your team does by hand and take it off them, so people get their time back for judgement work.",
    ic: "ci2",
    path: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1" />
      </>
    ),
  },
  bot: {
    title: "AI Chatbots and Virtual Assistants",
    desc: "Customers are going unanswered. We would build an assistant trained on your own content that answers every enquiry, at any hour, and hands over to a person when it needs to.",
    ic: "ci4",
    path: <path d="M21 11.5a8.38 8.38 0 0 1-9 8.4L3 21l1.1-3.5A8.5 8.5 0 1 1 21 11.5z" />,
  },
  data: {
    title: "Data Dashboards and Analytics",
    desc: "You are deciding without clear numbers. We would turn your data into dashboards and forecasts you can act on, so you stop running this quarter on last quarter's figures.",
    ic: "ci3",
    path: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  },
};

export function SolutionFinder(): ReactNode {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Record<Cat, number>>({
    build: 0,
    auto: 0,
    bot: 0,
    data: 0,
  });
  const [done, setDone] = useState(false);

  const best = useMemo<Cat>(() => {
    let top: Cat = "build";
    let max = -1;
    (Object.keys(scores) as Cat[]).forEach((k) => {
      if (scores[k] > max) {
        max = scores[k];
        top = k;
      }
    });
    return top;
  }, [scores]);

  function answer(cat: Cat): void {
    setScores((s) => ({ ...s, [cat]: s[cat] + 1 }));
    if (step < QUESTIONS.length - 1) setStep((n) => n + 1);
    else setDone(true);
  }

  function restart(): void {
    setStep(0);
    setScores({ build: 0, auto: 0, bot: 0, data: 0 });
    setDone(false);
  }

  const current = QUESTIONS[step]!;
  const rec = RECS[best];

  return (
    <div className="finder reveal">
      <div className="fglow" />
      <div className="fc">
        <span className="kicker on-dark">
          <span className="dot" />
          Solution Finder
        </span>
        <h2>Tell us what is going on. We will point you to the right service.</h2>
        <p>
          You do not need to know what an ERP is or whether you need a chatbot. Answer five short
          questions, and our assistant matches you to one of the four ways we help, in plain words.
          It takes about a minute.
        </p>
        <div className="cat-chips">
          <div className="cat-chip">
            <span className="ci ci1">
              <svg viewBox="0 0 24 24">
                <path d="M3 7l9-4 9 4-9 4-9-4z" />
                <path d="M3 7v10l9 4 9-4V7" />
              </svg>
            </span>
            Build new software
          </div>
          <div className="cat-chip">
            <span className="ci ci2">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1" />
              </svg>
            </span>
            Automate busywork
          </div>
          <div className="cat-chip">
            <span className="ci ci3">
              <svg viewBox="0 0 24 24">
                <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
              </svg>
            </span>
            Understand numbers
          </div>
          <div className="cat-chip">
            <span className="ci ci4">
              <svg viewBox="0 0 24 24">
                <path d="M3 12a9 9 0 0 1 18 0M12 3v9l5 3" />
              </svg>
            </span>
            Grow and maintain
          </div>
        </div>
      </div>

      <div className="finder-panel">
        <div className="fp-top">
          <span>{done ? "Complete" : `Question ${step + 1} of 5`}</span>
          <span className="fp-dots">
            {QUESTIONS.map((_, i) => (
              <i key={i} className={done || i <= step ? "on" : ""} />
            ))}
          </span>
        </div>

        {!done ? (
          <div>
            <div className="fp-q font-head">{current.q}</div>
            <div className="fp-opts">
              {current.a.map(([label, cat]) => (
                <button key={label} className="fp-opt" onClick={() => answer(cat)}>
                  <span className="od" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="fp-result on">
            <div className={`ric ${rec.ic}`}>
              <svg viewBox="0 0 24 24">{rec.path}</svg>
            </div>
            <div className="rk">Recommended for you</div>
            <h3>{rec.title}</h3>
            <p>{rec.desc}</p>
            <Link className="btn btn-primary" href="/contact">
              Start this conversation <span className="arr">&rarr;</span>
            </Link>
            <button
              type="button"
              className="fp-ask"
              onClick={() =>
                window.Oge?.ask(`I think I need ${rec.title}. What would that involve for my business?`)
              }
            >
              Ask Oge about this <span aria-hidden="true">&rarr;</span>
            </button>
            <button className="fp-restart" onClick={restart}>
              &#8634; Start over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
