"use client";
/**
 * Per-industry Solution Finder. It reuses the exact visual pattern of the homepage finder (the dark
 * two-column .finder card, intro chips, and the scored quiz panel), but every option and every
 * recommendation is drawn from the services THIS industry actually needs, resolved server-side and
 * always including AI Content, SEO & GEO. Three short questions score the industry's services and
 * the highest scorer is recommended, so the result is always a real, relevant service page. Pure
 * client-side, ephemeral state.
 */
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ICONS } from "./industryIcons.js";

export interface FinderService {
  title: string;
  href: string;
  iconKey: string;
  goal: string;
  result: string;
}

export function IndustrySolutionFinder({
  services,
}: {
  services: FinderService[];
}): ReactNode {
  // Three questions, each a rotating window of the industry's services, so every service (including
  // AI Content, SEO & GEO, appended last server-side) can be chosen and recommended.
  const questions = useMemo(() => {
    const n = services.length;
    const count = Math.min(4, n);
    const win = (start: number): FinderService[] =>
      Array.from({ length: count }, (_, i) => services[(start + i) % n]!);
    return [
      { q: "What would make the biggest difference to your business right now?", opts: win(0) },
      { q: "And what is the next priority after that?", opts: win(2 % n) },
      { q: "What would make the biggest long-term difference?", opts: win(4 % n) },
    ];
  }, [services]);

  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);

  const best = useMemo<FinderService>(() => {
    let top = services[0]!;
    let max = -1;
    for (const s of services) {
      const v = scores[s.href] ?? 0;
      if (v > max) {
        max = v;
        top = s;
      }
    }
    return top;
  }, [scores, services]);

  function answer(href: string): void {
    setScores((s) => ({ ...s, [href]: (s[href] ?? 0) + 1 }));
    if (step < questions.length - 1) setStep((n) => n + 1);
    else setDone(true);
  }

  function restart(): void {
    setStep(0);
    setScores({});
    setDone(false);
  }

  const current = questions[step]!;

  return (
    <div className="finder reveal">
      <div className="fglow" />
      <div className="fc">
        <span className="kicker on-dark">
          <span className="dot" />
          Solution Finder
        </span>
        <h2>Not sure which service you need? Let us point you to the right one.</h2>
        <p>
          You do not need to know the jargon. Answer three short questions about what matters most,
          and we will match you to the service that will make the biggest difference first. It takes
          under a minute.
        </p>
        <div className="cat-chips">
          {services.slice(0, 4).map((s) => (
            <div className="cat-chip" key={s.href}>
              <span className="ci ci1">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {ICONS[s.iconKey] ?? ICONS.cube}
                </svg>
              </span>
              {s.title}
            </div>
          ))}
        </div>
      </div>

      <div className="finder-panel">
        <div className="fp-top">
          <span>{done ? "Complete" : `Question ${step + 1} of ${questions.length}`}</span>
          <span className="fp-dots">
            {questions.map((_, i) => (
              <i key={i} className={done || i <= step ? "on" : ""} />
            ))}
          </span>
        </div>

        {!done ? (
          <div>
            <div className="fp-q font-head">{current.q}</div>
            <div className="fp-opts">
              {current.opts.map((s) => (
                <button key={s.href} type="button" className="fp-opt" onClick={() => answer(s.href)}>
                  <span className="od" />
                  {s.goal}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="fp-result on">
            <div className="ric ci1">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {ICONS[best.iconKey] ?? ICONS.cube}
              </svg>
            </div>
            <div className="rk">Recommended for you</div>
            <h3>{best.title}</h3>
            <p>{best.result}</p>
            <Link className="btn btn-primary" href="/contact">
              Start this conversation <span className="arr">&rarr;</span>
            </Link>
            <Link className="fp-ask" href={best.href}>
              Read about {best.title} <span aria-hidden="true">&rarr;</span>
            </Link>
            <button type="button" className="fp-restart" onClick={restart}>
              &#8634; Start over
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
