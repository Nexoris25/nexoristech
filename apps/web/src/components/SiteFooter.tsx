/**
 * Site footer for the Nexoris Technologies marketing site (PRD 7.8).
 *
 * Foundational footer with the company line, contact details, the legal links, the social
 * profiles, and the bottom bar. The full five-column composition (all 11 services, the top 10
 * industries, the newsletter capture) is completed alongside the header. The logo renders as a
 * text wordmark until the brand asset is in place.
 */
import type { ReactNode } from "react";
import Link from "next/link";

const social = [
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

export function SiteFooter(): ReactNode {
  return (
    <footer className="bg-ink-950 text-white">
      <div className="mx-auto max-w-[1200px] px-4 py-16 md:px-8">
        <div className="flex items-center gap-2">
          {/* The ink-950 footer uses the white logo (PRD 7.8). Mark is decorative; the wordmark
              text carries the name. */}
          <img
            src="/brand/nexoris-logo-white.png"
            alt=""
            width={36}
            height={40}
            className="h-10 w-auto"
          />
          <p className="font-jakarta text-subhead font-700">
            Nexoris Technologies
          </p>
        </div>
        <p className="mt-3 max-w-[48ch] text-body text-purple-100">
          We design and build custom software for businesses in Nigeria and
          abroad.
        </p>
        <div className="mt-6 flex flex-col gap-1 text-label text-purple-200">
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
        <ul className="mt-6 flex flex-wrap gap-4">
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
