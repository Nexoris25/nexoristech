/**
 * The careers hub (PRD Stage 8): the open roles from the CMS. ISR-driven, with a warm empty state
 * when there are no current openings.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Container, Section } from "@nexoris/ui";
import { buildMetadata } from "@nexoris/seo";
import { getJobs } from "../../lib/cms.js";

export const revalidate = 300;

export function generateMetadata(): Metadata {
  return buildMetadata({
    title: "Careers | Nexoris Technologies",
    description:
      "Join Nexoris Technologies. We build custom software, automation, and AI for businesses in Nigeria and beyond. See our current open roles.",
    path: "/careers",
    ogType: "website",
    noindex: false,
  });
}

export default async function CareersPage(): Promise<ReactNode> {
  const jobs = await getJobs();

  return (
    <Section>
      <Container>
        <p className="text-eyebrow uppercase text-purple-600">Careers</p>
        <h1 className="mt-2 max-w-[24ch] font-roboto text-hero font-700 text-ink-950">
          Build things that matter, with people who care.
        </h1>
        <p className="mt-4 max-w-[60ch] text-body text-neutral-600">
          We are a small team doing serious work for businesses across Nigeria
          and beyond. If that sounds like you, we would like to hear from you.
        </p>

        {jobs.length === 0 ? (
          <p className="mt-10 text-body text-neutral-600">
            We do not have open roles right now. If you think you would be a
            strong fit anyway, write to us at business@nexoristech.com and tell
            us what you do.
          </p>
        ) : (
          <ul className="mt-10 flex flex-col gap-4">
            {jobs.map((job) => (
              <li key={job.slug}>
                <Link
                  href={`/careers/${job.slug}`}
                  className="group flex flex-col gap-1 rounded-card border border-purple-200 p-6 transition hover:border-purple-600"
                >
                  <span className="font-roboto text-subhead font-700 text-ink-950 group-hover:text-purple-700">
                    {job.title}
                  </span>
                  <span className="text-label text-neutral-600">
                    {[
                      job.department,
                      job.location,
                      job.remote ? "Remote" : undefined,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  {job.summary ? (
                    <span className="mt-1 text-body text-neutral-700">
                      {job.summary}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </Section>
  );
}
