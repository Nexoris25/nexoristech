/**
 * Site footer for the Nexoris Technologies marketing site, ported from the approved design
 * handoff (2026-06-27). Four columns: brand (logo + wordmark always shown, description, address,
 * socials), Services, Industries, Company, then a bottom bar. Styling lives in styles/design.css.
 */
import type { ReactNode } from "react";
import Link from "next/link";

const services = [
  { label: "AI Product Development", href: "/ai-product-development" },
  { label: "Chatbots & Assistants", href: "/ai-chatbots-virtual-assistants" },
  { label: "Process Automation", href: "/business-process-automation" },
  { label: "Data & Analytics", href: "/data-dashboards-predictive-analytics" },
  { label: "Managed Operations", href: "/managed-technology-operations" },
];

const industries = [
  { label: "Retail & E-Commerce", href: "/retail-ecommerce-software" },
  { label: "Financial Services & Fintech", href: "/fintech-software" },
  { label: "Healthcare & Clinics", href: "/healthcare-software" },
  { label: "Logistics & Supply Chain", href: "/logistics-software" },
  { label: "Government & Public Sector", href: "/government-digital-solutions" },
];

const company = [
  { label: "About", href: "/about" },
  { label: "How we work", href: "/how-we-work" },
  { label: "Case studies", href: "/case-studies" },
  { label: "Insights", href: "/insights" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];

const socials = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/nexoris-technologies",
    path: "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.65h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.4c0-1.3-.03-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21H9z",
  },
  {
    label: "Facebook",
    href: "https://web.facebook.com/people/Nexoris-Technologies/61575547172687/",
    path: "M14 9h3V5.5h-3c-2.3 0-4 1.8-4 4V11H7.5v3.5H10V22h4v-7.5h2.7l.5-3.5H14V9.5c0-.3.2-.5.5-.5z",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/nexoristechnologies/",
    path: "ig",
  },
  {
    label: "X",
    href: "https://x.com/Nexoristech",
    path: "M17.5 3h3.2l-7 8 8.2 10h-6.4l-5-6.1L8 21H4.7l7.5-8.6L4.3 3h6.6l4.5 5.7zM16.4 19h1.7L8 4.9H6.2z",
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@nexoristechnologies",
    path: "M16 3c.35 2.1 1.6 3.7 3.7 4v3c-1.4 0-2.7-.4-3.7-1.1V15a6 6 0 1 1-6-6c.34 0 .67.03 1 .08v3.15c-.32-.1-.65-.16-1-.16a3 3 0 1 0 3 3V3z",
  },
];

function FooterCol({
  heading,
  items,
  more,
}: {
  heading: string;
  items: { label: string; href: string }[];
  more: { label: string; href: string };
}): ReactNode {
  return (
    <div className="foot-col">
      <h2>{heading}</h2>
      {items.map((i) => (
        <Link key={i.href} href={i.href}>
          {i.label}
        </Link>
      ))}
      <Link className="foot-more" href={more.href}>
        {more.label}
      </Link>
    </div>
  );
}

export function SiteFooter(): ReactNode {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-top">
          <div className="foot-brand">
            <Link className="brand" href="/">
              <img className="logo" src="/logo-mark-white.png" alt="Nexoris Technologies" />{" "}
              <span className="wm">
                Nexoris <span>Technologies</span>
              </span>
            </Link>
            <p>
              We design and build custom software for businesses in Nigeria and abroad.
            </p>
            <div className="addr">
              5, Mojisola Dokpesi Street, Badore, Ajah,
              <br />
              Lagos, Nigeria
              <br />
              <a href="tel:+2349138133224">+234 913 813 3224</a>
              <br />
              <a href="mailto:hello@nexoristech.com">hello@nexoristech.com</a>
            </div>
            <div className="socials">
              {socials.map((s) => (
                <a
                  key={s.label}
                  className="soc"
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                >
                  {s.path === "ig" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <rect x="3" y="3" width="18" height="18" rx="5.2" />
                      <circle cx="12" cy="12" r="4.2" />
                      <circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d={s.path} />
                    </svg>
                  )}
                </a>
              ))}
            </div>
          </div>

          <FooterCol
            heading="Services"
            items={services}
            more={{ label: "The four ways we help", href: "/#services" }}
          />
          <FooterCol
            heading="Industries"
            items={industries}
            more={{ label: "View all industries", href: "/#industries" }}
          />

          <div className="foot-col">
            <h2>Company</h2>
            {company.map((c) => (
              <Link key={c.href} href={c.href}>
                {c.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="foot-bottom">
          <span className="mono">
            &copy; {new Date().getFullYear()} Nexoris Technologies Ltd &middot; nexoristech.com
          </span>
          <div className="links">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-of-service">Terms of Service</Link>
            <Link href="/cookie-policy">Cookie settings</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
