/**
 * The home proof band (PRD 12 home behaviour): featured case study cards from the content API,
 * each showing its verified metrics. Renders nothing until the CMS has published case studies, so
 * the page never shows an empty or fabricated proof area.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { getFeaturedCaseStudies } from "../lib/cms.js";

export async function ProofBand(): Promise<ReactNode> {
  const caseStudies = await getFeaturedCaseStudies(2);
  if (caseStudies.length === 0) return null;

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
      {caseStudies.map((study) => (
        <Link
          key={study.slug}
          href={`/case-studies/${study.slug}`}
          className="group cursor-pointer rounded-card border border-purple-200 p-6 transition hover:border-purple-600"
        >
          <h3 className="font-jakarta text-subhead font-700 text-ink-950 group-hover:text-purple-700">
            {study.title}
          </h3>
          {study.summary ? (
            <p className="mt-2 text-body text-neutral-600">{study.summary}</p>
          ) : null}
          {study.metrics.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-4">
              {study.metrics.slice(0, 3).map((metric) => (
                <li key={metric.label}>
                  <span className="block font-jakarta text-subhead font-700 text-purple-700">
                    {metric.value}
                  </span>
                  <span className="text-label text-neutral-600">
                    {metric.label}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </Link>
      ))}
    </div>
  );
}
