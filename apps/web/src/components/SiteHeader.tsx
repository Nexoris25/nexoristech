"use client";
/**
 * Site header for the Nexoris Technologies marketing site, ported from the approved design
 * handoff (2026-06-27). Dark sticky bar with blur, Services and Industries mega flyouts and a
 * Company dropdown that open on hover and on click (Esc and outside-click close), plus a
 * full-screen mobile drawer. Styling lives in styles/design.css; this owns structure and
 * behaviour. The wordmark hides at <=1080px (design rule) via the .nav-links breakpoint.
 */
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  companyLinks,
  industriesFeatured,
  industryGroups,
  servicesColumnOne,
  servicesColumnTwo,
  servicesFeatured,
  WHATSAPP_HREF,
} from "../content/catalogue.js";

type FlyoutId = "services" | "industries" | "company";

export function SiteHeader(): ReactNode {
  const [open, setOpen] = useState<FlyoutId | null>(null);
  const [drawer, setDrawer] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Outside-click and Escape close any open flyout.
  useEffect(() => {
    function onClick(e: MouseEvent): void {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpen(null);
    }
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") setOpen(null);
    }
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer]);

  const toggle = (id: FlyoutId): void => setOpen((cur) => (cur === id ? null : id));
  const cls = (id: FlyoutId, base: string): string =>
    `${base}${open === id ? " open" : ""}`;

  return (
    <>
      <header>
        <div className="wrap nav">
        <Link className="brand" href="/" aria-label="Nexoris Technologies home">
          <img className="logo" src="/logo-mark-white.png" alt="Nexoris Technologies logo" />
          <span className="wm">
            Nexoris <span>Technologies</span>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Primary" ref={navRef}>
          <div
            className={cls("services", "has-flyout has-mega")}
            onMouseLeave={() => setOpen((c) => (c === "services" ? null : c))}
          >
            <button
              className="navlink"
              aria-haspopup="true"
              aria-expanded={open === "services"}
              onClick={() => toggle("services")}
            >
              Services <span className="cv" />
            </button>
            <div className="flyout mega mega-services">
              <div className="mcol">
                <p className="mh">Most asked for</p>
                {servicesColumnOne.map((s) => (
                  <Link key={s.href} className="mitem" href={s.href}>
                    <b>{s.label}</b>
                    {s.summary ? <span>{s.summary}</span> : null}
                  </Link>
                ))}
              </div>
              <div className="mcol">
                <p className="mh">More services</p>
                {servicesColumnTwo.map((s) => (
                  <Link key={s.href} className="mitem" href={s.href}>
                    <b>{s.label}</b>
                    {s.summary ? <span>{s.summary}</span> : null}
                  </Link>
                ))}
              </div>
              <div className="mfeat">
                <span className="mf-ic">
                  <svg viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" />
                  </svg>
                </span>
                <p className="mf-title">Not sure which fits?</p>
                <p>{servicesFeatured.text}</p>
                <Link className="btn btn-primary" href={servicesFeatured.cta.href}>
                  {servicesFeatured.cta.label}
                </Link>
              </div>
            </div>
          </div>

          <div
            className={cls("industries", "has-flyout has-mega")}
            onMouseLeave={() => setOpen((c) => (c === "industries" ? null : c))}
          >
            <button
              className="navlink"
              aria-haspopup="true"
              aria-expanded={open === "industries"}
              onClick={() => toggle("industries")}
            >
              Industries <span className="cv" />
            </button>
            <div className="flyout mega mega-industries">
              {industryGroups.map((group) => (
                <div key={group.heading} className="mcol">
                  <p className="mh">{group.heading}</p>
                  {group.items.map((item) => (
                    <Link key={item.href} className="mitem" href={item.href}>
                      <b>{item.label}</b>
                    </Link>
                  ))}
                </div>
              ))}
              <div className="mfeat">
                <span className="mf-ic">
                  <svg viewBox="0 0 24 24">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                <p className="mf-title">Not listed here?</p>
                <p>{industriesFeatured.text}</p>
                <Link className="btn btn-primary" href={industriesFeatured.cta.href}>
                  {industriesFeatured.cta.label}
                </Link>
              </div>
            </div>
          </div>

          <Link className="navlink" href="/insights">
            Insights
          </Link>

          <div
            className={cls("company", "has-flyout has-dropdown")}
            onMouseLeave={() => setOpen((c) => (c === "company" ? null : c))}
          >
            <button
              className="navlink"
              aria-haspopup="true"
              aria-expanded={open === "company"}
              onClick={() => toggle("company")}
            >
              Company <span className="cv" />
            </button>
            <div className="flyout dropdown">
              {companyLinks.map((c) => (
                <Link key={c.href} href={c.href}>
                  {c.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="nav-right">
          <Link className="btn btn-primary" href="/contact">
            Start a project
          </Link>
          <button
            className="nav-toggle"
            aria-label={drawer ? "Close menu" : "Open menu"}
            aria-expanded={drawer}
            onClick={() => setDrawer((d) => !d)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
      </header>

      <div className={`drawer${drawer ? " open" : ""}`} onClick={() => setDrawer(false)}>
        <div className="drawer-scroll" onClick={(e) => e.stopPropagation()}>
          <details className="acc">
            <summary>
              Services <span className="pm">+</span>
            </summary>
            <div className="acc-body">
              {[...servicesColumnOne, ...servicesColumnTwo].map((s) => (
                <Link key={s.href} href={s.href} onClick={() => setDrawer(false)}>
                  {s.label}
                </Link>
              ))}
            </div>
          </details>
          <details className="acc">
            <summary>
              Industries <span className="pm">+</span>
            </summary>
            <div className="acc-body">
              {industryGroups.flatMap((g) => g.items).map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setDrawer(false)}>
                  {item.label}
                </Link>
              ))}
            </div>
          </details>
          <Link className="dlink" href="/insights" onClick={() => setDrawer(false)}>
            Insights
          </Link>
          <details className="acc">
            <summary>
              Company <span className="pm">+</span>
            </summary>
            <div className="acc-body">
              {companyLinks.map((c) => (
                <Link key={c.href} href={c.href} onClick={() => setDrawer(false)}>
                  {c.label}
                </Link>
              ))}
            </div>
          </details>
        </div>
        <div className="drawer-cta">
          <Link className="btn btn-primary" href="/contact" onClick={() => setDrawer(false)}>
            Start a project <span className="arr">&rarr;</span>
          </Link>
          <a className="btn btn-wa" href={WHATSAPP_HREF}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2zm5.5 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1.1.1-1.7-.1-.4-.1-1-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.4-1.1-2.7s.7-1.9.9-2.2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.1.1.3 0 .5l-.4.5c-.2.2-.4.4-.2.7.2.3.7 1.1 1.5 1.8 1 .9 1.8 1.1 2.1 1.3.2.1.4.1.5-.1l.7-.8c.2-.2.3-.2.6-.1l1.9.9c.3.1.4.2.5.3.1.3.1.6-.1 1.2z" />
            </svg>{" "}
            WhatsApp
          </a>
        </div>
      </div>
    </>
  );
}
