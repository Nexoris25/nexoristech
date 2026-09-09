/**
 * A job posting (PRD Stage 8): the role detail with JobPosting schema and an apply call to action.
 * CMS-driven via ISR; notFound for an unknown slug.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { buildMetadata, buildPageGraph, deriveMetaTitle, fitMetaDescription } from "@nexoris/seo";
import { sanitiseHtml, wrapTables } from "../../../lib/render-html.js";
import type { JobInput } from "@nexoris/seo";
import { JsonLd } from "../../../components/JsonLd.js";
import { getJob, getJobSlugs } from "../../../lib/cms.js";
import "../../../styles/job.css";

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
    title: deriveMetaTitle(job.title, 37),
    description:
      fitMetaDescription(job.summary ?? `An open role at Nexoris Technologies: ${job.title}.`).text,
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
    description: sanitiseHtml(job.description ?? job.summary ?? job.title),
    ...(job.employmentType ? { employmentType: job.employmentType } : {}),
    ...(job.publishedAt ? { datePosted: job.publishedAt } : {}),
    ...(job.location ? { locationLocality: job.location } : {}),
  };

  const applyHref = job.applyUrl
    ? job.applyUrl
    : job.applyEmail
      ? `mailto:${job.applyEmail}`
      : "/contact";
  const external = Boolean(job.applyUrl);
  const employment = job.employmentType
    ? (EMPLOYMENT_LABELS[job.employmentType] ?? job.employmentType)
    : undefined;

  return (
    <div className="svc-page job-page">
      <JsonLd graph={buildPageGraph({ page: { routeClass: "job", path: `/careers/${slug}`, name: job.title, description: job.summary ?? job.title, breadcrumbs: [{ name: "Careers", path: "/careers" }, { name: job.title, path: `/careers/${slug}` }] }, job: jobInput })} />

      <section className="job-hero" aria-label={job.title}>
        <div className="glow" />
        <div className="wrap">
          <nav className="crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <Link href="/careers">Careers</Link>
            <span className="sep">/</span>
            <span className="here">{job.title}</span>
          </nav>
          <div className="job-head">
            {job.department ? <span className="team-pill">{job.department}</span> : null}
            <h1>
              <span className="hero-accent">{job.title}</span>
            </h1>
            <div className="job-facts">
              {job.location ? (
                <span className="fact">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                  {job.location}
                </span>
              ) : null}
              {job.remote ? (
                <span className="fact">
                  <svg viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="12" rx="2" />
                    <path d="M8 20h8M12 16v4" />
                  </svg>
                  Remote-friendly
                </span>
              ) : null}
              {employment ? (
                <span className="fact">
                  <svg viewBox="0 0 24 24">
                    <rect x="3" y="7" width="18" height="13" rx="2" />
                    <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  {employment}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="band" aria-label="Role details">
        <div className="wrap">
          <div className="job-layout">
            <div className="job-body">
              {job.description ? (
                /<\w+[\s>]/.test(job.description) ? <div dangerouslySetInnerHTML={{ __html: wrapTables(sanitiseHtml(job.description)) }} /> : <ReactMarkdown remarkPlugins={[remarkGfm]}>{job.description}</ReactMarkdown>
              ) : (
                <p>
                  Full details for this role are being finalised. In the meantime, reach out and we
                  will tell you everything you want to know.
                </p>
              )}
            </div>

            <aside className="apply">
              <div className="apply-h">
                <b>Apply for this role</b>
                <span>A real person reads every application, and you hear back within one week.</span>
              </div>
              <div className="apply-b">
                <a
                  className="btn btn-primary"
                  href={applyHref}
                  {...(external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {job.applyEmail && !job.applyUrl ? "Email your application" : "Start your application"}{" "}
                  <span className="arr">&rarr;</span>
                </a>
                <p className="apply-note">
                  Send your CV and something you have built or written. We reply to every
                  application.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
