/**
 * Renders a hardcoded marketing page from its content module (PRD 12). A server component:
 * the interactive pieces (Oge, the Solution Finder, the Contact form submission) are layered in
 * during their own stages. Dynamic [CMS] blocks render their approved heading and intro copy
 * and leave the data area empty until the content API supplies real, tagged proof, honouring
 * the no-fabrication rule (absent proof renders nothing).
 */
import type { ReactNode } from "react";
import { Button, Container, Section } from "@nexoris/ui";
import type {
  Cta,
  MarketingPage,
  Section as PageSection,
} from "../content/types.js";

function CtaButton({
  cta,
  variant,
}: {
  cta: Cta;
  variant: "primary" | "secondary";
}): ReactNode {
  return (
    <Button href={cta.href} variant={variant} size="lg">
      {cta.label}
    </Button>
  );
}

function Hero({ page }: { page: MarketingPage }): ReactNode {
  const { hero } = page;
  return (
    <header className="relative overflow-hidden bg-ink-950 text-white">
      {/* Soft radial purple glow behind the headline (PRD 14.6). */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[480px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, #6A55F2 0%, #543CDA 60%, transparent 100%)",
        }}
      />
      {/* Extra top padding clears the fixed header that overlays the hero (PRD 7.1). */}
      <Container className="relative pb-16 pt-28 md:pb-30 md:pt-40">
        <h1 className="max-w-[20ch] font-jakarta text-hero font-700 text-white">
          {hero.h1}
        </h1>
        {hero.subline ? (
          <p className="mt-6 max-w-[60ch] text-body text-purple-100">
            {hero.subline}
          </p>
        ) : null}
        {hero.primaryCta || hero.secondaryCta ? (
          <div className="mt-8 flex flex-wrap gap-4">
            {hero.primaryCta ? (
              <CtaButton cta={hero.primaryCta} variant="primary" />
            ) : null}
            {hero.secondaryCta ? (
              <CtaButton cta={hero.secondaryCta} variant="secondary" />
            ) : null}
          </div>
        ) : null}
        {hero.trustStrip ? (
          <p className="mt-8 text-label text-purple-200">{hero.trustStrip}</p>
        ) : null}
      </Container>
    </header>
  );
}

function SectionHeading({ children }: { children: ReactNode }): ReactNode {
  return (
    <h2 className="font-jakarta text-section font-700 text-ink-950">
      {children}
    </h2>
  );
}

function SectionBlock({
  section,
  tinted,
  slot,
}: {
  section: PageSection;
  tinted: boolean;
  slot?: ReactNode;
}): ReactNode {
  const inner = renderSectionInner(section);
  if (inner === null && !slot) {
    return null;
  }
  return (
    <Section
      tinted={tinted}
      id={section.id}
      aria-labelledby={`${section.id}-heading`}
    >
      <Container>
        {inner}
        {slot}
      </Container>
    </Section>
  );
}

function renderSectionInner(section: PageSection): ReactNode {
  switch (section.kind) {
    case "rich":
      return (
        <div className="max-w-article">
          {section.heading ? (
            <h2
              id={`${section.id}-heading`}
              className="font-jakarta text-section font-700 text-ink-950"
            >
              {section.heading}
            </h2>
          ) : null}
          {section.intro ? (
            <p className="mt-4 text-body text-neutral-600">{section.intro}</p>
          ) : null}
          {section.body?.map((paragraph, index) => (
            <p key={index} className="mt-4 text-body text-ink-950">
              {paragraph}
            </p>
          ))}
          {section.link ? (
            <p className="mt-6">
              <a
                href={section.link.href}
                className="cursor-pointer font-600 text-purple-600 hover:text-purple-700"
              >
                {section.link.label} &rarr;
              </a>
            </p>
          ) : null}
        </div>
      );
    case "cards":
      return (
        <div>
          {section.heading ? (
            <SectionHeading>{section.heading}</SectionHeading>
          ) : null}
          {section.intro ? (
            <p className="mt-4 max-w-article text-body text-neutral-600">
              {section.intro}
            </p>
          ) : null}
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {section.cards.map((card, index) => (
              <div
                key={index}
                className="rounded-card border border-purple-200 bg-white p-6 shadow-subtle"
              >
                {card.title ? (
                  <h3 className="font-jakarta text-subhead font-600 text-ink-950">
                    {card.title}
                  </h3>
                ) : null}
                <p
                  className={
                    card.title
                      ? "mt-2 text-body text-neutral-600"
                      : "text-body text-ink-950"
                  }
                >
                  {card.body}
                </p>
                {card.links && card.links.length > 0 ? (
                  <ul className="mt-4 flex flex-col gap-1">
                    {card.links.map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          className="cursor-pointer text-label font-600 text-purple-600 hover:text-purple-700"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
          {section.closingLine ? (
            <p className="mt-8 max-w-article text-body font-600 text-ink-950">
              {section.closingLine}
            </p>
          ) : null}
          {section.footerLink ? (
            <p className="mt-6">
              <a
                href={section.footerLink.href}
                className="cursor-pointer font-600 text-purple-600 hover:text-purple-700"
              >
                {section.footerLink.label} &rarr;
              </a>
            </p>
          ) : null}
        </div>
      );
    case "steps":
      return (
        <div>
          {section.heading ? (
            <SectionHeading>{section.heading}</SectionHeading>
          ) : null}
          {section.intro ? (
            <p className="mt-4 max-w-article text-body text-neutral-600">
              {section.intro}
            </p>
          ) : null}
          <ol className="mt-8 flex flex-col gap-6">
            {section.steps.map((step, index) => (
              <li key={index} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600 font-mono text-label font-600 text-white"
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="font-jakarta text-subhead font-600 text-ink-950">
                    {step.title}
                  </h3>
                  <p className="mt-1 max-w-article text-body text-neutral-600">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          {section.link ? (
            <p className="mt-8">
              <a
                href={section.link.href}
                className="cursor-pointer font-600 text-purple-600 hover:text-purple-700"
              >
                {section.link.label} &rarr;
              </a>
            </p>
          ) : null}
        </div>
      );
    case "faq":
      return (
        <div className="max-w-article">
          <SectionHeading>{section.heading}</SectionHeading>
          <dl className="mt-8 flex flex-col gap-6">
            {section.items.map((item, index) => (
              <div key={index} className="border-b border-purple-200 pb-6">
                <dt className="font-jakarta text-subhead font-600 text-ink-950">
                  {item.question}
                </dt>
                <dd className="mt-2 text-body text-neutral-600">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      );
    case "cta-band":
      return (
        <div className="rounded-card bg-ink-950 p-8 text-center md:p-12">
          <h2 className="mx-auto max-w-[28ch] font-jakarta text-section font-700 text-white">
            {section.heading}
          </h2>
          {section.body ? (
            <p className="mx-auto mt-4 max-w-[60ch] text-body text-purple-100">
              {section.body}
            </p>
          ) : null}
          <div className="mt-8 flex justify-center">
            <CtaButton cta={section.button} variant="primary" />
          </div>
        </div>
      );
    case "form":
      return (
        <div className="max-w-article">
          <h2 className="font-jakarta text-section font-700 text-ink-950">
            {section.heading}
          </h2>
          {/* The interactive submission, smart assistant, and brief builder are wired in Stage 5. */}
          <form className="mt-8 flex flex-col gap-4">
            {section.fields.map((field) => (
              <div key={field.label} className="flex flex-col gap-1">
                <label className="text-label font-600 text-ink-950">
                  {field.label}
                </label>
                {field.microcopy ? (
                  <span className="text-label text-neutral-600">
                    {field.microcopy}
                  </span>
                ) : null}
                {field.options ? (
                  <select
                    className="rounded-card border border-purple-200 p-3 text-body"
                    aria-label={field.label}
                  >
                    {field.options.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="rounded-card border border-purple-200 p-3 text-body"
                    aria-label={field.label}
                  />
                )}
              </div>
            ))}
            <div className="rounded-card border border-purple-200 bg-purple-100 p-6">
              <h3 className="font-jakarta text-subhead font-600 text-ink-950">
                {section.briefBuilder.heading}
              </h3>
              <p className="mt-2 text-body text-neutral-600">
                {section.briefBuilder.body}
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button type="submit">{section.submitLabel}</Button>
            </div>
          </form>
        </div>
      );
    case "dynamic":
      // Render only the approved heading and intro; the data area fills from the CMS later and
      // renders nothing until then.
      if (!section.heading && !section.intro) {
        return null;
      }
      return (
        <div className="max-w-article">
          {section.heading ? (
            <SectionHeading>{section.heading}</SectionHeading>
          ) : null}
          {section.intro ? (
            <p className="mt-4 text-body text-neutral-600">{section.intro}</p>
          ) : null}
        </div>
      );
    default:
      return null;
  }
}

export function PageRenderer({
  page,
  sectionSlots,
}: {
  page: MarketingPage;
  /** Extra content injected into a section by its id, for example the home industries grid. */
  sectionSlots?: Record<string, ReactNode>;
}): ReactNode {
  return (
    <>
      <Hero page={page} />
      {page.sections.map((section, index) => (
        <SectionBlock
          key={section.id}
          section={section}
          tinted={index % 2 === 1}
          {...(sectionSlots?.[section.id]
            ? { slot: sectionSlots[section.id] }
            : {})}
        />
      ))}
    </>
  );
}
