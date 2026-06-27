/**
 * Renders a hardcoded marketing page from its content module (PRD 12). A server component:
 * the interactive pieces (Oge, the Solution Finder, the Contact form submission) are layered in
 * during their own stages. Dynamic [CMS] blocks render their approved heading and intro copy
 * and leave the data area empty until the content API supplies real, tagged proof, honouring
 * the no-fabrication rule (absent proof renders nothing).
 */
import type { ReactNode } from "react";
import Image from "next/image";
import { Button, Container, Field, Input, Section, Select } from "@nexoris/ui";
import type {
  Cta,
  MarketingPage,
  Section as PageSection,
} from "../content/types.js";
import { heroPhoto, img } from "../content/media.js";

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
    <header className="bg-aurora bg-dotgrid relative overflow-hidden text-white">
      {/* A second soft glow adds depth to the mesh without turning the hero purple. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-1/4 h-[420px] w-[420px] rounded-full opacity-30 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, #6A55F2 0%, #543CDA 55%, transparent 100%)",
        }}
      />
      {/* Extra top padding clears the fixed header that overlays the hero (PRD 7.1). */}
      <Container className="relative grid items-center gap-12 pb-16 pt-28 md:pb-30 md:pt-40 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-label font-600 text-purple-100 backdrop-blur">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-mint-400"
            />
            Nexoris Technologies
          </span>
          <h1 className="mt-5 max-w-[18ch] font-syne text-hero font-700 text-white">
            {hero.h1}
          </h1>
          {hero.subline ? (
            <p className="mt-6 max-w-[56ch] text-body text-purple-100">
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
            <p className="mt-10 border-t border-white/10 pt-6 text-label text-purple-200">
              {hero.trustStrip}
            </p>
          ) : null}
        </div>

        {/* Companion photography, framed and lifted off the mesh. Shown from lg up so the mobile
            hero stays fast and headline-first. */}
        <div className="relative hidden lg:block">
          <div
            aria-hidden="true"
            className="absolute -inset-4 rounded-[28px] bg-gradient-to-tr from-purple-600/30 to-mint-400/10 blur-2xl"
          />
          <div className="image-frame relative aspect-[4/3]">
            <Image
              src={img(heroPhoto.id, 1100)}
              alt={heroPhoto.alt}
              fill
              priority
              sizes="(min-width: 1024px) 46vw, 100vw"
              className="object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-ink-950/40 to-transparent"
            />
          </div>
        </div>
      </Container>
    </header>
  );
}

function SectionHeading({ children }: { children: ReactNode }): ReactNode {
  return (
    <h2 className="font-syne text-section font-700 text-ink-950">
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
  // The interactive Contact form replaces the static form markup when its slot is provided.
  const inner =
    section.kind === "form" && slot ? null : renderSectionInner(section);
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
              className="font-syne text-section font-700 text-ink-950"
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
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {section.cards.map((card, index) => (
              <div key={index} className="card-surface flex flex-col p-7">
                {card.title ? (
                  <span
                    aria-hidden="true"
                    className="font-mono text-label font-600 text-purple-600"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                ) : null}
                {card.title ? (
                  <h3 className="mt-3 font-syne text-subhead font-600 text-ink-950">
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
                  <ul className="mt-5 flex flex-col gap-2 border-t border-purple-100 pt-4">
                    {card.links.map((link) => (
                      <li key={link.href}>
                        <a
                          href={link.href}
                          className="group inline-flex cursor-pointer items-center gap-1.5 text-label font-600 text-purple-600 hover:text-purple-700"
                        >
                          {link.label}
                          <span
                            aria-hidden="true"
                            className="transition-transform group-hover:translate-x-0.5"
                          >
                            &rarr;
                          </span>
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
          <ol className="mt-10 flex flex-col">
            {section.steps.map((step, index) => {
              const last = index === section.steps.length - 1;
              return (
                <li key={index} className="relative flex gap-5 pb-8 last:pb-0">
                  {/* The connecting line traces the process down the numbered nodes. */}
                  {!last ? (
                    <span
                      aria-hidden="true"
                      className="absolute left-[19px] top-10 bottom-0 w-px bg-gradient-to-b from-purple-200 to-transparent"
                    />
                  ) : null}
                  <span
                    aria-hidden="true"
                    className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-600 font-mono text-label font-600 text-white shadow-[0_4px_12px_rgba(84,60,218,0.3)]"
                  >
                    {index + 1}
                  </span>
                  <div className="pt-1.5">
                    <h3 className="font-syne text-subhead font-600 text-ink-950">
                      {step.title}
                    </h3>
                    <p className="mt-1 max-w-article text-body text-neutral-600">
                      {step.body}
                    </p>
                  </div>
                </li>
              );
            })}
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
          <dl className="mt-10 flex flex-col gap-4">
            {section.items.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-purple-100 bg-white p-6 shadow-subtle"
              >
                <dt className="flex gap-3 font-syne text-subhead font-600 text-ink-950">
                  <span
                    aria-hidden="true"
                    className="select-none font-mono text-purple-600"
                  >
                    Q
                  </span>
                  {item.question}
                </dt>
                <dd className="mt-2 pl-7 text-body text-neutral-600">
                  {item.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      );
    case "cta-band":
      return (
        <div className="bg-aurora bg-dotgrid relative overflow-hidden rounded-3xl px-8 py-14 text-center md:px-12 md:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-purple-500/30 blur-3xl"
          />
          <div className="relative">
            <h2 className="mx-auto max-w-[28ch] font-syne text-section font-700 text-white">
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
        </div>
      );
    case "form":
      return (
        <div className="max-w-article">
          <h2 className="font-syne text-section font-700 text-ink-950">
            {section.heading}
          </h2>
          {/* The interactive submission and brief builder are layered in by the ContactForm slot;
              this static markup is the no-JavaScript fallback. */}
          <form className="mt-8 flex flex-col gap-5">
            {section.fields.map((field) => {
              const id = `static-${field.label.replace(/\s+/g, "-").toLowerCase()}`;
              return (
                <Field
                  key={field.label}
                  label={field.label}
                  htmlFor={id}
                  {...(field.microcopy ? { hint: field.microcopy } : {})}
                >
                  {field.options ? (
                    <Select id={id} aria-label={field.label} defaultValue="">
                      <option value="">Choose one</option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input id={id} aria-label={field.label} />
                  )}
                </Field>
              );
            })}
            <div className="rounded-2xl border border-purple-200 bg-purple-100 p-6">
              <h3 className="font-syne text-subhead font-600 text-ink-950">
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
