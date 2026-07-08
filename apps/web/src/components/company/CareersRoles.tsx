"use client";
/**
 * The open-roles list for the Careers page, ported from the handoff. Roles come from Strapi
 * (passed in as JobCard[]); the team tabs are derived from the roles that actually exist, and each
 * team shows an honest empty state when it has none. Client-only for the tab filtering.
 */
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import type { JobCard } from "../../lib/cms.js";

const TEAM_COLORS: Record<string, string> = {
  engineering: "#543CDA",
  design: "#2D6BE0",
  product: "#168F7C",
  growth: "#8A45D0",
  data: "#0B7A99",
};

function teamColor(department: string | undefined): string {
  if (!department) return "#6a55f2";
  return TEAM_COLORS[department.toLowerCase()] ?? "#6a55f2";
}

function EmptyState(): ReactNode {
  return (
    <div className="cr-empty">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <rect x="8" y="2" width="8" height="4" rx="1" />
      </svg>
      <h3>Nothing open in this team right now.</h3>
      <p>
        Good people are always worth meeting. Email us at{" "}
        <a href="mailto:careers@nexoristech.com">careers@nexoristech.com</a> and tell us what you are
        great at.
      </p>
    </div>
  );
}

export function CareersRoles({ jobs }: { jobs: JobCard[] }): ReactNode {
  const teams = useMemo(() => {
    const seen = new Map<string, string>();
    for (const job of jobs) {
      if (job.department) {
        const key = job.department.toLowerCase();
        if (!seen.has(key)) seen.set(key, job.department);
      }
    }
    return [...seen.values()];
  }, [jobs]);

  const [active, setActive] = useState("all");

  if (jobs.length === 0) {
    return (
      <>
        <div className="cr-toolbar reveal">
          <div className="cr-tabs">
            <button type="button" className="cr-tab on" aria-pressed="true">
              All teams
            </button>
          </div>
          <span className="cr-cms-note">Listings served from the CMS</span>
        </div>
        <EmptyState />
      </>
    );
  }

  const visible =
    active === "all"
      ? jobs
      : jobs.filter((j) => (j.department ?? "").toLowerCase() === active);

  return (
    <>
      <div className="cr-toolbar reveal">
        <div className="cr-tabs">
          <button
            type="button"
            className={`cr-tab${active === "all" ? " on" : ""}`}
            aria-pressed={active === "all"}
            onClick={() => setActive("all")}
          >
            All teams
          </button>
          {teams.map((team) => (
            <button
              key={team}
              type="button"
              className={`cr-tab${active === team.toLowerCase() ? " on" : ""}`}
              aria-pressed={active === team.toLowerCase()}
              onClick={() => setActive(team.toLowerCase())}
            >
              {team}
            </button>
          ))}
        </div>
        <span className="cr-cms-note">Listings served from the CMS</span>
      </div>

      {visible.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="cr-role-list reveal">
          {visible.map((job) => (
            <Link className="cr-role-row" href={`/careers/${job.slug}`} key={job.slug}>
              <div>
                <h3>{job.title}</h3>
                <div className="cr-role-tags">
                  {job.department ? (
                    <span className="cr-rtag">
                      <i style={{ background: teamColor(job.department) }} />
                      {job.department}
                    </span>
                  ) : null}
                  {job.location ? (
                    <span className="cr-rtag">
                      {job.location}
                      {job.remote ? " / Remote-friendly" : ""}
                    </span>
                  ) : job.remote ? (
                    <span className="cr-rtag">Remote-friendly</span>
                  ) : null}
                  {job.employmentType ? (
                    <span className="cr-rtag">{job.employmentType}</span>
                  ) : null}
                </div>
              </div>
              <div className="cr-ra">
                {job.department ? <span className="cr-team-pill">{job.department}</span> : null}
                <span className="link-arrow">
                  View role <span className="arr">&rarr;</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
