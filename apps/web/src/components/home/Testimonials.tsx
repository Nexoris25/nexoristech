"use client";
/**
 * Homepage testimonials carousel, ported from the approved design handoff. perView is 1 (<=760),
 * 2 (<=1080), or 3 (desktop); arrows and dots page through; arrows disable at the ends; it
 * recalculates on resize. The quotes are the design's self-describing placeholders and are
 * replaced by CMS-approved testimonials when they exist (no fabricated client claims). Avatars
 * are brand monograms rather than stock headshots. Styling lives in styles/design.css.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface Quote {
  text: string;
  name: string;
  role: string;
}

const QUOTES: Quote[] = [
  {
    text: "An approved client quote sits here, loaded from the content API with the person's own words about working with Nexoris Technologies.",
    name: "Client name",
    role: "Role, Company",
  },
  {
    text: "A second verified testimonial, shown exactly as designed. Only real, approved quotes ever appear here.",
    name: "Client name",
    role: "Role, Company",
  },
  {
    text: "A third quote completes the row on desktop. The carousel pages through every approved testimonial.",
    name: "Client name",
    role: "Role, Company",
  },
  {
    text: "A fourth testimonial demonstrates the navigation. Use the arrows or dots to move through more.",
    name: "Client name",
    role: "Role, Company",
  },
  {
    text: "A fifth quote, so the slider has something to slide to on every screen size.",
    name: "Client name",
    role: "Role, Company",
  },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function Testimonials(): ReactNode {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [perView, setPerView] = useState(3);

  const computePerView = (): number =>
    window.innerWidth <= 760 ? 1 : window.innerWidth <= 1080 ? 2 : 3;

  const maxIndex = Math.max(0, QUOTES.length - perView);

  const apply = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>(".tcard");
    if (!card) return;
    const step = card.getBoundingClientRect().width + 20;
    const clamped = Math.min(index, Math.max(0, QUOTES.length - perView));
    track.style.transform = `translateX(-${clamped * step}px)`;
  }, [index, perView]);

  useEffect(() => {
    const onResize = (): void => setPerView(computePerView());
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (index > maxIndex) setIndex(maxIndex);
  }, [index, maxIndex]);

  useEffect(() => {
    apply();
  }, [apply]);

  return (
    <div className="tst-wrap reveal">
      <div className="tst-viewport">
        <div className="tst-track" ref={trackRef}>
          {QUOTES.map((q, i) => (
            <article className="tcard" key={i}>
              <div className="qm">&ldquo;</div>
              <p>{q.text}</p>
              <div className="who">
                <span
                  className="av"
                  aria-hidden="true"
                  style={{
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 700,
                    fontSize: ".8rem",
                    color: "#543CDA",
                  }}
                >
                  {initials(q.name)}
                </span>
                <div>
                  <div className="nm">{q.name}</div>
                  <div className="rl">{q.role}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="tst-ctrl">
        <button
          className="tst-btn"
          aria-label="Previous testimonials"
          disabled={index <= 0}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
        >
          &larr;
        </button>
        <div className="tst-dots">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              className={i === index ? "on" : ""}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
        <button
          className="tst-btn"
          aria-label="Next testimonials"
          disabled={index >= maxIndex}
          onClick={() => setIndex((i) => Math.min(maxIndex, i + 1))}
        >
          &rarr;
        </button>
      </div>
    </div>
  );
}
