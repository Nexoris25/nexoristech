/**
 * Site footer for the Nexoris Technologies marketing site (PRD 7.8). Five columns plus a bottom
 * bar: the company and contact details with the white logo and social profiles; all 11 services;
 * the top 10 industries; the company links; and the start-a-conversation column with the
 * newsletter capture. The newsletter submission is wired to the lead pipeline in a later stage.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@nexoris/ui";
import {
  allServices,
  footerCompanyLinks,
  footerTopIndustries,
} from "../content/catalogue.js";
import type { NavItem } from "../content/catalogue.js";

const social = [
  { label: "WhatsApp", href: "https://wa.me/2349138133224" },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/nexoris-technologies",
  },
  { label: "X", href: "https://x.com/Nexoristech" },
  {
    label: "Instagram",
    href: "https://www.instagram.com/nexoristechnologies/",
  },
  {
    label: "Facebook",
    href: "https://web.facebook.com/people/Nexoris-Technologies/61575547172687/",
  },
  { label: "TikTok", href: "https://www.tiktok.com/@nexoristechnologies" },
  { label: "Threads", href: "https://www.threads.com/@nexoristechnologies" },
];

const legal = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms-of-service" },
  { label: "Cookie Policy", href: "/cookie-policy" },
];

function LinkColumn({
  heading,
  items,
}: {
  heading: string;
  items: NavItem[];
}): ReactNode {
  return (
    <div>
      <h2 className="text-eyebrow uppercase text-purple-200">{heading}</h2>
      <ul className="mt-4 flex flex-col gap-2">
        {items.map((item) => (
          <li key={`${item.href}-${item.label}`}>
            <Link
              href={item.href}
              className="cursor-pointer text-label text-purple-100 hover:text-white"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter(): ReactNode {
  return (
    <footer className="bg-ink-950 text-white">
      <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Column 1: company and contact. */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2">
              <img
                src="/brand/nexoris-logo-white.png"
                alt=""
                width={32}
                height={36}
                className="h-9 w-auto"
              />
              <span className="font-jakarta text-subhead font-700">
                Nexoris Technologies
              </span>
            </div>
            <p className="mt-3 text-label text-purple-100">
              We design and build custom software for businesses in Nigeria and
              abroad.
            </p>
            <div className="mt-4 flex flex-col gap-1 text-label text-purple-200">
              <span>
                5, Mojisola Dokpesi Street, Allied Garden Estate, Badore, Ajah,
                Lagos State, Nigeria
              </span>
              <a
                href="tel:+2349138133224"
                className="cursor-pointer hover:text-white"
              >
                +234 913 813 3224
              </a>
              <a
                href="mailto:hello@nexoristech.com"
                className="cursor-pointer hover:text-white"
              >
                hello@nexoristech.com
              </a>
              <a
                href="mailto:business@nexoristech.com"
                className="cursor-pointer hover:text-white"
              >
                business@nexoristech.com
              </a>
            </div>
            <ul className="mt-4 flex flex-wrap gap-3">
              {social.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer text-label font-600 text-purple-200 hover:text-white"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: services. */}
          <LinkColumn heading="Services" items={allServices} />

          {/* Column 3: industries (top 10) plus see-all. */}
          <div>
            <LinkColumn heading="Industries" items={footerTopIndustries} />
            <p className="mt-3">
              <Link
                href="/#industries"
                className="cursor-pointer text-label font-600 text-purple-100 hover:text-white"
              >
                See all 20 industries &rarr;
              </Link>
            </p>
          </div>

          {/* Column 4: company. */}
          <LinkColumn heading="Company" items={footerCompanyLinks} />

          {/* Column 5: start a conversation and newsletter. */}
          <div>
            <h2 className="text-eyebrow uppercase text-purple-200">
              Start a conversation
            </h2>
            <p className="mt-4 text-label text-purple-100">
              Tell us what you are trying to achieve. We will come back with a
              clear suggestion and honest numbers.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <Button href="/contact">Start a project</Button>
              <Button
                href="/contact"
                variant="ghost"
                className="text-purple-100 hover:bg-ink-800"
              >
                Find the right service
              </Button>
            </div>
            <form className="mt-6 flex flex-col gap-2">
              <label className="text-label text-purple-100">
                One useful idea each month. You can unsubscribe any time.
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  aria-label="Your email address"
                  placeholder="Your email address"
                  className="min-w-0 flex-1 rounded-card border border-ink-800 bg-ink-800 p-3 text-label text-white placeholder:text-purple-200"
                />
                <Button type="submit">Subscribe</Button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-ink-800 pt-6 text-label text-purple-200 md:flex-row md:items-center md:justify-between">
          <p>
            &copy; {new Date().getFullYear()} Nexoris Technologies Ltd. Built in
            Lagos. Working everywhere.
          </p>
          <ul className="flex flex-wrap gap-4">
            {legal.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="cursor-pointer hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
