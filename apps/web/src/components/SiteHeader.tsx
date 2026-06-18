"use client";
/**
 * Site header for the Nexoris Technologies marketing site (PRD 7.1 to 7.7).
 *
 * Sticky header, transparent over the dark hero and solid white with a soft shadow once the
 * page scrolls, with the logo switching white to purple at the same point. The Services and
 * Industries mega-flyouts and the Company dropdown are keyboard-correct disclosures from the
 * design system. On mobile a hamburger opens the full-screen drawer with accordions and a
 * sticky Start a project and WhatsApp bar.
 */
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  AccordionItem,
  Button,
  Flyout,
  MegaMenu,
  MegaMenuItem,
  MobileNav,
} from "@nexoris/ui";
import {
  WHATSAPP_HREF,
  companyLinks,
  industriesFeatured,
  industryGroups,
  servicesColumnOne,
  servicesColumnTwo,
  servicesFeatured,
} from "../content/catalogue.js";
import type { NavItem } from "../content/catalogue.js";

function ServicesPanel(): ReactNode {
  return (
    <div className="w-[min(86vw,680px)]">
      <MegaMenu columns={2}>
        <div>
          {servicesColumnOne.map((item) => (
            <MegaMenuItem
              key={item.href}
              as={Link}
              href={item.href}
              label={item.label}
              {...(item.summary ? { description: item.summary } : {})}
            />
          ))}
        </div>
        <div>
          {servicesColumnTwo.map((item) => (
            <MegaMenuItem
              key={item.href}
              as={Link}
              href={item.href}
              label={item.label}
              {...(item.summary ? { description: item.summary } : {})}
            />
          ))}
        </div>
      </MegaMenu>
      <div className="mt-4 flex flex-col gap-3 rounded-card bg-purple-100 p-4 md:flex-row md:items-center md:justify-between">
        <p className="text-label text-ink-950">{servicesFeatured.text}</p>
        <Button href={servicesFeatured.cta.href}>
          {servicesFeatured.cta.label}
        </Button>
      </div>
    </div>
  );
}

function IndustriesPanel(): ReactNode {
  return (
    <div className="w-[min(90vw,920px)]">
      <MegaMenu columns={4}>
        {industryGroups.map((group) => (
          <div key={group.heading}>
            <p className="px-3 pb-1 text-eyebrow uppercase text-neutral-600">
              {group.heading}
            </p>
            {group.items.map((item) => (
              <MegaMenuItem
                key={item.href}
                as={Link}
                href={item.href}
                label={item.label}
              />
            ))}
          </div>
        ))}
      </MegaMenu>
      <div className="mt-4 flex flex-col gap-3 rounded-card bg-purple-100 p-4 md:flex-row md:items-center md:justify-between">
        <p className="text-label text-ink-950">{industriesFeatured.text}</p>
        <Button href={industriesFeatured.cta.href} variant="ghost">
          {industriesFeatured.cta.label}
        </Button>
      </div>
    </div>
  );
}

function CompanyPanel(): ReactNode {
  return (
    <div className="w-56">
      <MegaMenu columns={1}>
        {companyLinks.map((item) => (
          <MegaMenuItem
            key={item.href}
            as={Link}
            href={item.href}
            label={item.label}
          />
        ))}
      </MegaMenu>
    </div>
  );
}

function MobileNavLinks({ items }: { items: NavItem[] }): ReactNode {
  return (
    <ul className="flex flex-col gap-1 pb-2">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="block min-h-[44px] cursor-pointer rounded-card px-3 py-2 text-body text-ink-950 hover:bg-purple-100"
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function SiteHeader(): ReactNode {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = (): void => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const triggerClass = scrolled
    ? "text-ink-950"
    : "text-white hover:text-purple-100";

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 h-16 transition-colors md:h-[72px]",
        scrolled ? "bg-white shadow-medium" : "bg-transparent",
      ].join(" ")}
    >
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          {/* The logo switches with the header state (PRD 7.1). Mark is decorative; the wordmark
              carries the accessible name. */}
          <img
            src={
              scrolled
                ? "/brand/nexoris-logo-purple.png"
                : "/brand/nexoris-logo-white.png"
            }
            alt=""
            width={29}
            height={32}
            className="h-8 w-auto"
          />
          <span
            className={`font-jakarta text-subhead font-700 ${scrolled ? "text-ink-950" : "text-white"}`}
          >
            Nexoris Technologies
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          <Flyout label="Services" triggerClassName={triggerClass}>
            <ServicesPanel />
          </Flyout>
          <Flyout label="Industries" triggerClassName={triggerClass}>
            <IndustriesPanel />
          </Flyout>
          <Link
            href="/insights"
            className={`rounded-card px-3 py-2 text-label font-600 ${triggerClass}`}
          >
            Insights
          </Link>
          <Flyout label="Company" triggerClassName={triggerClass}>
            <CompanyPanel />
          </Flyout>
          <Button href="/contact" className="ml-2">
            Start a project
          </Button>
        </nav>

        <div className="lg:hidden">
          <MobileNav
            footer={
              <div className="flex flex-col gap-3">
                <Button href="/contact">Start a project</Button>
                <Button href={WHATSAPP_HREF} variant="secondary">
                  WhatsApp
                </Button>
              </div>
            }
          >
            <AccordionItem title="Services">
              <MobileNavLinks
                items={[...servicesColumnOne, ...servicesColumnTwo]}
              />
            </AccordionItem>
            <AccordionItem title="Industries">
              {industryGroups.map((group) => (
                <div key={group.heading} className="pb-2">
                  <p className="px-3 pt-2 text-eyebrow uppercase text-neutral-600">
                    {group.heading}
                  </p>
                  <MobileNavLinks items={group.items} />
                </div>
              ))}
            </AccordionItem>
            <AccordionItem title="Company">
              <MobileNavLinks items={companyLinks} />
            </AccordionItem>
            <div className="pt-2">
              <Link
                href="/insights"
                className="block min-h-[44px] rounded-card px-3 py-2 text-subhead font-600 text-ink-950 hover:bg-purple-100"
              >
                Insights
              </Link>
            </div>
          </MobileNav>
        </div>
      </div>
    </header>
  );
}
