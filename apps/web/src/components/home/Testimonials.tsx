"use client";
/**
 * Homepage testimonials carousel, ported from the approved design handoff. perView is 1 (<=760),
 * 2 (<=1080), or 3 (desktop); arrows and dots page through; arrows disable at the ends; it
 * recalculates on resize.
 *
 * The quotes come from the CMS. The component used to hold five placeholders reading "Client name" /
 * "Role, Company", and nothing ever replaced them, so the live homepage showed placeholder copy where
 * client quotes belonged. It now renders what it is given and nothing when there is nothing: an empty
 * section is honest, invented praise is not.
 *
 * The avatar is the client's own headshot when the CMS has one, and a brand monogram when it does not.
 * A quote attributed to a face carries more than a quote attributed to two initials, and it is the
 * client's face or nothing: no stock photography stands in for a real person. Styling lives in
 * styles/design.css.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export interface Quote {
  text: string;
  name: string;
  role: string;
  photoUrl?: string;
  photoAlt?: string;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function Testimonials({ quotes }: { quotes: Quote[] }): ReactNode {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [perView, setPerView] = useState(3);

  const computePerView = (): number =>
    window.innerWidth <= 760 ? 1 : window.innerWidth <= 1080 ? 2 : 3;

  const maxIndex = Math.max(0, quotes.length - perView);

  const apply = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>(".tcard");
    if (!card) return;
    const step = card.getBoundingClientRect().width + 20;
    const clamped = Math.min(index, Math.max(0, quotes.length - perView));
    track.style.transform = `translateX(-${clamped * step}px)`;
  }, [index, perView, quotes.length]);

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

  // No approved testimonial is a real state, and the honest thing to draw for it is nothing.
  if (quotes.length === 0) return null;

  return (
    <div className="tst-wrap reveal">
      <div className="tst-viewport">
        <div className="tst-track" ref={trackRef}>
          {quotes.map((q, i) => (
            <article className="tcard" key={i}>
              <div className="qm">&ldquo;</div>
              <p>{q.text}</p>
              <div className="who">
                {q.photoUrl ? (
                  <span className="av av-photo">
                    <img src={q.photoUrl} alt={q.photoAlt ?? q.name} loading="lazy" />
                  </span>
                ) : (
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
                )}
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
