"use client";
/**
 * Case-study filter tabs. Visual state only, mirroring the handoff: the real filtering binds to the
 * content API once approved case studies exist. Until then the grid shows honest placeholders, so
 * the tabs simply reflect the selected view.
 */
import { useState } from "react";
import type { ReactNode } from "react";

const TABS = ["All", "By industry", "By service", "By outcome"];

export function CaseStudyTabs(): ReactNode {
  const [active, setActive] = useState(0);
  return (
    <div className="cs-tabs">
      {TABS.map((label, i) => (
        <button
          key={label}
          type="button"
          className={`cs-tab${i === active ? " on" : ""}`}
          aria-pressed={i === active}
          onClick={() => setActive(i)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
