/**
 * Site header for the Nexoris Technologies marketing site (PRD 7).
 *
 * This is the foundational header: the logo, the primary navigation, and the Start a project
 * call to action. The keyboard-correct Services and Industries mega-flyouts (from the design
 * system) and the scroll state are wired in with the full catalogue and the Figma logo in the
 * next step. The logo currently renders as a text wordmark until the brand asset is in place.
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@nexoris/ui";

const navLinks = [
  { label: "Insights", href: "/insights" },
  { label: "About", href: "/about" },
  { label: "How we work", href: "/how-we-work" },
  { label: "Case studies", href: "/case-studies" },
];

export function SiteHeader(): ReactNode {
  return (
    <header className="sticky top-0 z-50 h-16 border-b border-purple-200 bg-white md:h-[72px]">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          {/* Solid white header uses the purple logo (PRD 7.1). The mark is decorative; the
              link's accessible name comes from the wordmark text beside it. */}
          <img
            src="/brand/nexoris-logo-purple.png"
            alt=""
            width={29}
            height={32}
            className="h-8 w-auto"
          />
          <span className="font-jakarta text-subhead font-700 text-ink-950">
            Nexoris Technologies
          </span>
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="cursor-pointer text-label font-600 text-ink-950 hover:text-purple-700"
            >
              {link.label}
            </Link>
          ))}
          <Button href="/contact">Start a project</Button>
        </nav>
      </div>
    </header>
  );
}
