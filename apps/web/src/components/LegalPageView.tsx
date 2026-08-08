/**
 * Legal page (privacy, terms, cookie), ported to the approved handoff design (assets/legal.css):
 * a dark legal hero, a sticky table of contents, and numbered policy sections. The content is still
 * driven by its Strapi single type; until a policy is published it shows a clear interim note rather
 * than an empty page. Rendered inside .svc-page.legal-page; ScrollFx adds the reveal animation.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { getLegalPage, type LegalType } from "../lib/cms.js";
import { formatLagosDate, resolveDateTokens } from "../lib/date.js";
import { ScrollFx } from "./home/ScrollFx.js";
import { FloatingToc } from "./FloatingToc.js";

/** Stable, readable anchor id from a section heading. */

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
  // Sections that carry a heading are the numbered policy sections and the contents list. Anything
  // before the first heading is a preamble: it renders above them and is not numbered or listed.
  const preamble = sections.filter((s) => !s.heading);
  const anchors = sections.filter((s) => s.heading);

  return (
    <div className="svc-page legal-page">
      <ScrollFx />

      <section className="legal-hero" aria-label={title}>
        <div className="glow" />
        <div className="wrap">
          <nav className="crumb reveal" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            {/* The short title where one is set, so a long policy name does not wrap the crumb. */}
            <span className="here">{page?.shortTitle ?? heading}</span>
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
              {/* Hidden below 1024px, where the floating control takes over: stacking the full list
                  above the copy pushed the policy itself off the first screen. */}
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
                {preamble.map((s, i) => (
                  <div
                    key={`preamble-${i}`}
                    className="legal-preamble"
                    // The CMS stores HTML, and it is sanitised in splitSections before it gets here.
                    // It used to be handed to ReactMarkdown, which escapes raw HTML, so every tag in a
                    // policy rendered as visible text.
                    dangerouslySetInnerHTML={{ __html: resolveDateTokens(s.body) }}
                  />
                ))}
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
                    <div dangerouslySetInnerHTML={{ __html: resolveDateTokens(s.body) }} />
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

      {/* The same entries as the column, as a sheet on small screens. */}
      <FloatingToc entries={anchors.map((a) => ({ id: a.id, text: a.heading }))} />
    </div>
  );
}
