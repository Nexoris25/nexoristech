"use client";
import { useId, useState } from "react";
import Link from "next/link";
import { industryGroups } from "../../content/catalogue.js";
import { SectorIcon } from "../company/SectorIcon.js";
export function IndustryDirectory() {
  const [group, setGroup] = useState("All sectors");
  const [query, setQuery] = useState("");
  const id = useId();
  const items = industryGroups
    .filter((g) => group === "All sectors" || g.heading === group)
    .flatMap((g) => g.items)
    .filter((item) =>
      item.label.toLowerCase().includes(query.trim().toLowerCase()),
    );
  return (
    <div className="industry-directory">
      <div className="directory-tools">
        <div
          className="directory-filters"
          role="group"
          aria-label="Filter industries"
        >
          {["All sectors", ...industryGroups.map((g) => g.heading)].map(
            (name) => (
              <button
                key={name}
                type="button"
                aria-pressed={group === name}
                aria-controls={id}
                onClick={() => setGroup(name)}
              >
                {name}
              </button>
            ),
          )}
        </div>
        <label className="directory-search">
          <span>Find your industry</span>
          <input
            type="search"
            placeholder="Search industries"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-controls={id}
          />
        </label>
      </div>
      <div className="directory-links" id={id}>
        {items.map((item) => (
          <Link key={item.href} href={item.href}>
            <SectorIcon href={item.href} />
            <span>{item.label}</span>
            <span className="directory-arrow" aria-hidden="true">
              ↗
            </span>
          </Link>
        ))}
      </div>
      <p className="directory-status" role="status">
        {items.length === 0
          ? "No matching sector in this directory. We can still help with your industry."
          : query
            ? `${items.length} matching ${items.length === 1 ? "sector" : "sectors"}.`
            : "Explore a sector to see what we can build."}
      </p>
      <div className="directory-contact">
        <p>
          <strong>Your industry is not listed?</strong> We build around your
          business, whatever the sector.
        </p>
        <Link className="link-arrow" href="/contact/">
          Tell us what you need <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
