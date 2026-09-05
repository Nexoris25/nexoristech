import Link from "next/link";
import type { CaseStudyCard } from "../lib/cms.js";

/** Publication and relationships belong to CMS; this component owns presentation only. */
export function CaseStudyProof({ studies, heading = "Work in this industry" }: { studies: CaseStudyCard[]; heading?: string }) {
  if (!studies.length) return null;
  return <section className="band soft" id="proof" aria-label="Client case studies">
    <div className="wrap">
      <div className="band-head"><span className="kicker">Selected work</span><h2 className="h-section">{heading}</h2></div>
      <div className="proof-grid">
        {studies.map(study => <Link className="proof-card" href={`/case-studies/${study.slug}/`} key={study.slug}>
          {study.coverUrl ? <span className="pc-shot"><img src={study.coverUrl} alt={study.coverAlt ?? ""} loading="lazy" /></span> : null}
          <span className="pc-body">
            {study.industry ? <span className="pc-tag">{study.industry}</span> : null}
            <h3>{study.title}</h3>
            {study.summary ? <span className="pc-sum">{study.summary}</span> : null}
            <span className="pc-go">Read the case study <span aria-hidden="true">↗</span></span>
          </span>
        </Link>)}
      </div>
    </div>
  </section>;
}
