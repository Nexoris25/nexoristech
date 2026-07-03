"use client";
/**
 * AI & Systems Integration hero widget. A connection board: system nodes on each side of a central
 * "integration layer" hub, with a rotating "active" highlight that suggests data syncing through
 * each system, a pulsing hub ring, and a monitored-sync indicator. Ported from the approved
 * handoff. Respects prefers-reduced-motion (no rotating highlight). Styling: styles/integration-widget.css.
 */
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

interface Node {
  label: string;
  sub: string;
  icon: ReactNode;
}

const LEFT: Node[] = [
  {
    label: "CRM",
    sub: "Customers",
    icon: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="3.4" />
      </>
    ),
  },
  {
    label: "Accounting",
    sub: "Invoices",
    icon: (
      <>
        <path d="M3 3v18h18" />
        <path d="M7 14l3-3 3 2 4-5" />
      </>
    ),
  },
  {
    label: "Commerce",
    sub: "Orders",
    icon: (
      <>
        <path d="M6 8h12l-1 12H7z" />
        <path d="M9 8V6a3 3 0 0 1 6 0v2" />
      </>
    ),
  },
];

const RIGHT: Node[] = [
  {
    label: "ERP",
    sub: "Operations",
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
  },
  {
    label: "Payments",
    sub: "Settlements",
    icon: (
      <>
        <rect x="2" y="6" width="20" height="12" rx="2" />
        <path d="M2 10h20" />
      </>
    ),
  },
  {
    label: "Messaging",
    sub: "WhatsApp",
    icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  },
];

const TOTAL = LEFT.length + RIGHT.length;

export function ConnectionBoard(): ReactNode {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const t = setInterval(() => setActive((a) => (a + 1) % TOTAL), 1300);
    return () => clearInterval(t);
  }, []);

  const renderNode = (n: Node, index: number): ReactNode => (
    <div className={`intw-node${active === index ? " active" : ""}`} key={n.label}>
      <svg viewBox="0 0 24 24">{n.icon}</svg>
      <span className="nx">
        <b>{n.label}</b>
        <span>{n.sub}</span>
      </span>
    </div>
  );

  return (
    <div className="intw reveal" aria-label="Integration overview">
      <div className="intw-t">One record, entered once, everywhere it should be</div>
      <div className="intw-grid">
        <div className="intw-side">{LEFT.map((n, i) => renderNode(n, i))}</div>
        <div className="intw-center">
          <div className="intw-hub">
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
            </svg>
          </div>
          <div className="intw-hubl">
            Nexoris
            <br />
            integration layer
          </div>
        </div>
        <div className="intw-side">{RIGHT.map((n, i) => renderNode(n, LEFT.length + i))}</div>
      </div>
      <div className="intw-sync">
        <span className="live" aria-hidden="true" />
        Synced · monitored · alerts on if it breaks
      </div>
    </div>
  );
}
