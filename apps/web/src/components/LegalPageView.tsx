/**
 * Renders a legal page (privacy, terms, cookie) from its Strapi single type as section and
 * plain-summary pairs (PRD legal pages). Until the policy is published it shows a clear interim
 * note rather than an empty page.
 */
import type { ReactNode } from "react";
import { Container, Section } from "@nexoris/ui";
import { getLegalPage, type LegalType } from "../lib/cms.js";
import { formatLagosDate } from "../lib/date.js";
import { Markdown } from "./Markdown.js";

export async function LegalPageView({
  type,
  heading,
}: {
  type: LegalType;
  heading: string;
}): Promise<ReactNode> {
  const page = await getLegalPage(type);

  return (
    <Section>
      <Container className="max-w-article">
        <h1 className="font-syne text-hero font-700 text-ink-950">
          {page?.title ?? heading}
        </h1>
        {page?.effectiveDate ? (
          <p className="mt-2 text-label text-neutral-600">
            Effective {formatLagosDate(page.effectiveDate)}
          </p>
        ) : null}
        {page?.intro ? (
          <p className="mt-4 text-body text-neutral-700">{page.intro}</p>
        ) : null}

        {!page || page.sections.length === 0 ? (
          <p className="mt-8 text-body text-neutral-600">
            This policy is being finalised. For any questions in the meantime,
            contact business@nexoristech.com.
          </p>
        ) : (
          <div className="mt-8 flex flex-col gap-10">
            {page.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="font-syne text-section font-700 text-ink-950">
                  {section.heading}
                </h2>
                {section.plainSummary ? (
                  <p className="mt-3 rounded-card border border-purple-200 bg-purple-100 p-4 text-label text-ink-950">
                    In short: {section.plainSummary}
                  </p>
                ) : null}
                <Markdown>{section.body}</Markdown>
              </section>
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}
