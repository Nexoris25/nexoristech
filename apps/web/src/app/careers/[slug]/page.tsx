/**
 * A job posting (PRD Stage 8): the role detail with JobPosting schema and an apply call to action.
 * CMS-driven via ISR; notFound for an unknown slug.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, Container, Section } from "@nexoris/ui";
import { buildMetadata, buildGraph, jobPostingNode } from "@nexoris/seo";
import type { JobInput } from "@nexoris/seo";
import { JsonLd } from "../../../components/JsonLd.js";
import { Markdown } from "../../../components/Markdown.js";
import { getJob, getJobSlugs } from "../../../lib/cms.js";

export const revalidate = 300;
export const dynamicParams = true;

const EMPLOYMENT_LABELS: Record<string, string> = {
  FULL_TIME: "Full time",
  PART_TIME: "Part time",
  CONTRACTOR: "Contract",
  INTERN: "Internship",
  TEMPORARY: "Temporary",
};

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await getJobSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) return { title: "Role not found | Nexoris Technologies" };
  return buildMetadata({
    title: `${job.title} | Nexoris Technologies`,
    description:
      job.summary ??
      `An open role at Nexoris Technologies: ${job.title}.`,
    path: `/careers/${slug}`,
    ogType: "website",
    noindex: false,
  });
}

export default async function JobPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<ReactNode> {
  const { slug } = await params;
  const job = await getJob(slug);
  if (!job) notFound();

  const jobInput: JobInput = {
    path: `/careers/${slug}`,
    title: job.title,
    description: job.summary ?? job.title,
    ...(job.employmentType ? { employmentType: job.employmentType } : {}),
    ...(job.publishedAt ? { datePosted: job.publishedAt } : {}),
    ...(job.location ? { locationLocality: job.location } : {}),
  };

  const applyHref = job.applyUrl
    ? job.applyUrl
    : job.applyEmail
      ? `mailto:${job.applyEmail}`
      : "/contact";

  return (
    <>
      <JsonLd graph={buildGraph([jobPostingNode(jobInput)])} />
      <Section>
        <Container className="max-w-article">
          <nav className="text-label text-neutral-600" aria-label="Breadcrumb">
            <Link href="/careers" className="cursor-pointer hover:text-purple-700">
              Careers
            </Link>
            <span aria-hidden="true"> / </span>
            <span>{job.title}</span>
          </nav>

          <h1 className="mt-6 font-syne text-hero font-700 text-ink-950">
            {job.title}
          </h1>
          <p className="mt-2 text-label text-neutral-600">
            {[
              job.department,
              job.location,
              job.remote ? "Remote" : undefined,
              job.employmentType
                ? (EMPLOYMENT_LABELS[job.employmentType] ?? job.employmentType)
                : undefined,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>

          {job.description ? (
            <div className="mt-8">
              <Markdown>{job.description}</Markdown>
            </div>
          ) : null}

          <div className="mt-10">
            <Button href={applyHref}>Apply for this role</Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
