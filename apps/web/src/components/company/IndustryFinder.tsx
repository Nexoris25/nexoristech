"use client";
/**
 * Per-industry service finder. A live, interactive picker rendered on every industry page (anchor
 * #solution-finder, targeted by the hero's secondary CTA). The visitor picks the outcome that
 * matters most for their operation and the matching Nexoris service appears instantly, with a link
 * to the service page and a contact CTA. The choices are the industry's own relevant services
 * (resolved server-side, always including AI Content, SEO & GEO), so every recommendation names a
 * real page. Deterministic and self-contained: no network call, no fabricated claims.
 */
import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { ICONS } from "./industryIcons.js";

export interface FinderService {
  title: string;
  href: string;
  blurb: string;
  need: string;
  iconKey: string;
}

export function IndustryFinder({
  services,
  industry,
}: {
  services: FinderService[];
  industry: string;
}): ReactNode {
  const [selected, setSelected] = useState<number | null>(null);
  const rec = selected !== null ? services[selected] : null;

  return (
    <section className="band ind-finder-band" id="solution-finder" aria-label="Service finder">
      <div className="wrap">
        <div className="band-head reveal">
          <span className="kicker">
            <span className="dot" />
            Service finder
            <span className="live" aria-hidden="true">
              <i />
              Live
            </span>
          </span>
          <h2 className="h-section">Not sure where to start? Tell us what matters most.</h2>
          <p className="lede">
            Pick the outcome you want for your {industry} operation and the right service appears
            straight away.
          </p>
        </div>

        <div className="ind-finder reveal">
          <div className="ifd-needs" role="group" aria-label={`What do you want to fix or build in ${industry}?`}>
            {services.map((s, i) => (
              <button
                type="button"
                key={s.href}
                className={`ifd-need${selected === i ? " on" : ""}`}
                aria-pressed={selected === i}
                onClick={() => setSelected(i)}
              >
                <span className="ifd-ic">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    {ICONS[s.iconKey] ?? ICONS.cube}
                  </svg>
                </span>
                <span>{s.need}</span>
              </button>
            ))}
          </div>

          <div className="ifd-result" aria-live="polite">
            {rec ? (
              <div className="ifd-card">
                <span className="ifd-tag">Your match</span>
                <div className="ifd-card-h">
                  <span className="ifd-ic lg">
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      {ICONS[rec.iconKey] ?? ICONS.cube}
                    </svg>
                  </span>
                  <h3>{rec.title}</h3>
                </div>
                <p>{rec.blurb}</p>
                <div className="ifd-cta">
                  <Link className="btn btn-primary" href={rec.href}>
                    Explore this service <span className="arr">&rarr;</span>
                  </Link>
                  <Link className="btn btn-ghost" href="/contact">
                    Talk to us
                  </Link>
                </div>
              </div>
            ) : (
              <div className="ifd-empty">
                <span className="ifd-ic lg">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    {ICONS.search}
                  </svg>
                </span>
                <p>
                  Choose what you want to fix or build, and your recommended service shows up here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
