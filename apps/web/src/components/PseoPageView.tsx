/**
 * Renders a published programmatic page (PRD 9.6): the H1, the summary, the pain points and what we
 * build, an honest feature matrix, intent-specific pricing or comparison, the proof block from the
 * substitution ladder (never empty, never fabricated), the FAQ, cited sources, and the EEAT author
 * line, with a Service plus FAQPage plus breadcrumb JSON-LD graph and a route into the Solution
 * Finder. Only published, gate-passed pages reach this component.
 *
 * Bodies are HTML from the CMS editor, so they go through the sanitising renderer rather than the
 * markdown one. Passing HTML to ReactMarkdown escapes it, which published the tags to the page as
 * visible text; insights and legal pages had the same fault and were fixed, and this was the last
 * place still doing it. The other fields here (pricing, comparison) are short markdown fragments from
 * the pSEO package rather than the editor, so they keep the markdown renderer.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Button, Container, Section } from "@nexoris/ui";
import {
  buildGraph,
  serviceNode,
  faqPageNode,
  breadcrumbNode,
  type JsonLdNode,
} from "@nexoris/seo";
import { resolveProof } from "@nexoris/pseo";
import type { PseoPage } from "../lib/cms.js";
import { JsonLd } from "./JsonLd.js";
import { Markdown } from "./Markdown.js";
import { FloatingToc } from "./FloatingToc.js";
import { withHeadingIds, headingsOf } from "../lib/render-html.js";
import { resolveDateTokens } from "../lib/date.js";

export function PseoPageView({ page }: { page: PseoPage }): ReactNode {
  const path = `/${page.slug}`;
  const h1 = resolveDateTokens(page.h1);
  const summary = page.summary ? resolveDateTokens(page.summary) : undefined;
  const serviceType = [page.techLabel, "development", page.industryLabel]
    .filter(Boolean)
    .join(" ");

  const proof = resolveProof({
    industryLabel: page.industryLabel ?? "your industry",
    techLabel: page.techLabel ?? "this work",
    ...(page.location ? { location: page.location } : {}),
  });

  const nodes: JsonLdNode[] = [
    serviceNode({
      name: h1,
      path,
      ...(serviceType ? { serviceType } : {}),
      ...(page.industryLabel ? { audience: page.industryLabel } : {}),
    }),
  ];
  // The written body, with anchors, so the contents control has something to point at.
  const bodyHtml = page.body ? withHeadingIds(resolveDateTokens(page.body)) : "";
  const toc = bodyHtml ? headingsOf(bodyHtml) : [];

  const faqNode = page.faq.length > 0 ? faqPageNode(page.faq) : undefined;
  if (faqNode) nodes.push(faqNode);
  nodes.push(
    breadcrumbNode([
      { name: "Solutions", path: "/contact" },
      ...(page.category ? [{ name: page.category, path }] : []),
      { name: h1, path },
    ]),
  );

  return (
    <>
      <JsonLd graph={buildGraph(nodes)} />
      <Section>
        <Container className="max-w-article">
          {page.category ? (
            <p className="font-mono text-[0.72rem] uppercase tracking-[0.12em] text-purple-600">
              {page.category}
            </p>
          ) : null}
          {h1 ? (
            <h1 className="mt-2 font-roboto text-hero font-700 text-ink-950">
              {h1}
            </h1>
          ) : null}
          {summary ? (
            <p className="mt-4 text-body text-neutral-700">{summary}</p>
          ) : null}

          {page.painPoints ? (
            <div className="prose pseo-body mt-8"
              dangerouslySetInnerHTML={{ __html: withHeadingIds(resolveDateTokens(page.painPoints)) }} />
          ) : null}
          {bodyHtml ? (
            <div className="prose pseo-body mt-6" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
          ) : null}

          {page.featureMatrix.length > 0 ? (
            <section className="mt-10" aria-labelledby="matrix">
              <h2
                id="matrix"
                className="font-roboto text-section font-700 text-ink-950"
              >
                What this includes
              </h2>
              <div className="mt-4 overflow-x-auto rounded-card border border-purple-200">
                <table className="w-full text-left text-label">
                  <tbody>
                    {page.featureMatrix.map((row) => (
                      <tr key={row.feature} className="border-b border-purple-100">
                        <th className="px-4 py-3 font-600 text-ink-950" scope="row">
                          {row.feature}
                        </th>
                        <td className="px-4 py-3 text-neutral-700">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {page.intent === "cost" && page.pricing ? (
            <section className="mt-10">
              <h2 className="font-roboto text-section font-700 text-ink-950">
                What it costs
              </h2>
              <div className="mt-4">
                <Markdown>{page.pricing}</Markdown>
              </div>
            </section>
          ) : null}

          {page.intent === "comparison" && page.comparison ? (
            <section className="mt-10">
              <h2 className="font-roboto text-section font-700 text-ink-950">
                How the options compare
              </h2>
              <div className="mt-4">
                <Markdown>{page.comparison}</Markdown>
              </div>
            </section>
          ) : null}

          {/* Proof, from the substitution ladder. Never empty, never fabricated. */}
          <section className="mt-10">
            <h2 className="font-roboto text-section font-700 text-ink-950">
              Why Nexoris Technologies
            </h2>
            <ul className="mt-4 flex flex-col gap-4">
              {proof.items.map((item) => (
                <li
                  key={item.label}
                  className="rounded-card border border-purple-200 p-5"
                >
                  <p className="font-600 text-ink-950">{item.label}</p>
                  <p className="mt-1 text-body text-neutral-700">{item.detail}</p>
                </li>
              ))}
            </ul>
          </section>

          {page.faq.length > 0 ? (
            <section className="mt-10" aria-labelledby="faq">
              <h2
                id="faq"
                className="font-roboto text-section font-700 text-ink-950"
              >
                Common questions
              </h2>
              <dl className="mt-6 flex flex-col gap-6">
                {page.faq.map((item) => (
                  <div key={item.question}>
                    <dt className="font-roboto text-subhead font-600 text-ink-950">
                      {item.question}
                    </dt>
                    <dd className="mt-2 text-body text-neutral-700">
                      {item.answer}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-4">
            <Button href="/contact" size="lg">
              {page.location
                ? `Get an estimate for your ${page.industryLabel ?? ""} project in ${page.location}`.trim()
                : "Get an instant estimate"}
            </Button>
          </div>

          {page.dataSources.length > 0 ? (
            <section className="mt-12 border-t border-neutral-200 pt-6">
              <h2 className="text-eyebrow uppercase text-neutral-600">Sources</h2>
              <ul className="mt-2 flex flex-col gap-1 text-label text-neutral-600">
                {page.dataSources.map((source) => (
                  <li key={source.label}>
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer text-purple-700 underline hover:text-purple-600"
                      >
                        {source.label}
                      </a>
                    ) : (
                      source.label
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {page.author ? (
            <p className="mt-6 text-label text-neutral-600">
              Written by{" "}
              {page.author.slug ? (
                <Link
                  href={`/authors/${page.author.slug}`}
                  className="cursor-pointer text-purple-700 hover:text-purple-600"
                >
                  {page.author.name}
                </Link>
              ) : (
                page.author.name
              )}
              {page.factChecker ? `, fact-checked by ${page.factChecker.name}` : ""}
              .
            </p>
          ) : null}
        </Container>
      </Section>

      <FloatingToc entries={toc} />
    </>
  );
}
