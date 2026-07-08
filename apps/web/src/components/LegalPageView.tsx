/**
 * Legal page (privacy, terms, cookie), ported to the approved handoff design (assets/legal.css):
 * a dark legal hero, a sticky table of contents, and numbered policy sections. The content is still
 * driven by its Strapi single type; until a policy is published it shows a clear interim note rather
 * than an empty page. Rendered inside .svc-page.legal-page; ScrollFx adds the reveal animation.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getLegalPage, type LegalType } from "../lib/cms.js";
import { formatLagosDate, resolveDateTokens } from "../lib/date.js";
import { ScrollFx } from "./home/ScrollFx.js";

/** Stable, readable anchor id from a section heading. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function LegalPageView({
  type,
  heading,
}: {
  type: LegalType;
  heading: string;
}): Promise<ReactNode> {
  const page = await getLegalPage(type);
  const title = page?.title ?? heading;
  const sections = page?.sections ?? [];
  const anchors = sections.map((s) => ({ ...s, id: slugify(s.heading) }));

  return (
    <div className="svc-page legal-page">
      <ScrollFx />

      <section className="legal-hero" aria-label={title}>
        <div className="glow" />
        <div className="wrap">
          <nav className="crumb reveal" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <span className="here">{heading}</span>
          </nav>
          <div className="legal-head reveal">
            <span className="kicker on-dark">
              <span className="dot" />
              Legal
            </span>
            <h1>{title}</h1>
            {page?.intro ? <p>{page.intro}</p> : null}
            {page?.effectiveDate ? (
              <div className="legal-meta">
                <span className="lm">
                  <svg viewBox="0 0 24 24">
                    <rect x="4" y="5" width="16" height="16" rx="2" />
                    <path d="M16 3v4M8 3v4M4 11h16" />
                  </svg>
                  Last updated {formatLagosDate(page.effectiveDate)}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="band" aria-label={`${heading} details`}>
        <div className="wrap">
          {anchors.length === 0 ? (
            <div className="legal-body reveal">
              <p className="legal-interim">
                This policy is being finalised. For any questions in the meantime, contact{" "}
                <a href="mailto:business@nexoristech.com">business@nexoristech.com</a>.
              </p>
              <div className="review-note">
                This policy is a working draft prepared for review by qualified legal counsel before
                publication. It is not legal advice.
              </div>
            </div>
          ) : (
            <div className="legal-layout">
              <nav className="toc reveal" aria-label="On this page">
                <h2>On this page</h2>
                <ol>
                  {anchors.map((s) => (
                    <li key={s.id}>
                      <a href={`#${s.id}`}>{s.heading}</a>
                    </li>
                  ))}
                </ol>
              </nav>

              <div className="legal-body reveal">
                {anchors.map((s, i) => (
                  <section className="legal-sec" id={s.id} key={s.id}>
                    <h2>
                      <span className="sn">{String(i + 1).padStart(2, "0")}</span> {s.heading}
                    </h2>
                    {s.plainSummary ? (
                      <div className="legal-short">
                        <b>In short:</b> {s.plainSummary}
                      </div>
                    ) : null}
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {resolveDateTokens(s.body)}
                    </ReactMarkdown>
                  </section>
                ))}
                <div className="review-note">
                  This policy is a working draft prepared for review by qualified legal counsel
                  before publication. It is not legal advice.
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
