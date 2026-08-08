"use client";
/**
 * The case-study grid on the hub, with its filter.
 *
 * The tabs above this grid used to be "All / By industry / By service / By outcome" and pressing one
 * changed only which tab looked pressed. They could not do more, because the grid below them held three
 * fixed placeholder cards rather than records. Case studies come from the CMS now, so the filter is
 * built from what is actually published: the industries the work was done in. A filter offering a
 * choice that returns nothing is worse than no filter, so only industries with work behind them appear,
 * and the row disappears entirely when everything shares one industry.
 */
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import type { CaseStudyCard } from "../../lib/cms.js";

export function CaseStudyGrid({ studies }: { studies: CaseStudyCard[] }): ReactNode {
  const industries = useMemo(() => {
    const seen = new Set<string>();
    for (const s of studies) if (s.industry) seen.add(s.industry);
    return [...seen].sort((a, b) => a.localeCompare(b));
  }, [studies]);

  const [filter, setFilter] = useState("");
  const shown = filter ? studies.filter((s) => s.industry === filter) : studies;

  return (
    <>
      <div className="cs-toolbar reveal">
        {industries.length > 1 ? (
          <div className="cs-tabs" role="group" aria-label="Filter by industry">
            <button type="button" className={`cs-tab${filter === "" ? " on" : ""}`}
              aria-pressed={filter === ""} onClick={() => setFilter("")}>All</button>
            {industries.map((ind) => (
              <button key={ind} type="button" className={`cs-tab${filter === ind ? " on" : ""}`}
                aria-pressed={filter === ind} onClick={() => setFilter(ind)}>{ind}</button>
            ))}
          </div>
        ) : <span />}
        <span className="cs-count" aria-live="polite">
          {shown.length} {shown.length === 1 ? "case study" : "case studies"}
        </span>
      </div>

      <div className="cs-grid reveal">
        {shown.map((study) => (
          <Link className="cs-card" href={`/case-studies/${study.slug}`} key={study.slug}>
            {study.coverUrl ? (
              <span className="csc-shot">
                <img src={study.coverUrl} alt={study.coverAlt ?? ""} loading="lazy" />
              </span>
            ) : (
              <span className="csc-shot csc-shot-none" aria-hidden="true" />
            )}
            <span className="csc-body">
              {study.industry ? <span className="csc-tag">{study.industry}</span> : null}
              <h3>{study.title}</h3>
              {study.summary ? <span className="csc-sum">{study.summary}</span> : null}
              <span className="csc-go">Read the case study <span className="arr">&rarr;</span></span>
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
