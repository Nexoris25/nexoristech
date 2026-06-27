"use client";
/**
 * The Solution Finder (PRD 10.5): five short questions, then an instant recommendation. The match
 * is deterministic (@nexoris/recommend) so it always names real pages; the gateway adds a short
 * rationale. If the gateway is unreachable, the component still shows the deterministic match with
 * a plain fallback line, so the visitor always gets a useful answer.
 */
import { useId, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@nexoris/ui";
import {
  INDUSTRY_OPTIONS,
  HEADACHE_OPTIONS,
  COMPANY_SIZE_OPTIONS,
  URGENCY_OPTIONS,
  BUDGET_OPTIONS,
  matchRecommendation,
  type FinderAnswers,
  type Recommendation,
  type HeadacheId,
  type IndustrySlug,
  type CompanySize,
  type Urgency,
  type Budget,
} from "@nexoris/recommend";

interface FinderResult extends Recommendation {
  rationale: string;
}

function Field({
  id,
  label,
  optional,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string;
  label: string;
  optional?: boolean;
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  placeholder: string;
}): ReactNode {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-label font-600 text-ink-950">
        {label}
        {optional ? (
          <span className="font-400 text-neutral-600"> (optional)</span>
        ) : null}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="cursor-pointer rounded-card border border-purple-200 bg-white p-3 text-body text-ink-950"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SolutionFinder(): ReactNode {
  const baseId = useId();
  const [industry, setIndustry] = useState("");
  const [headache, setHeadache] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [urgency, setUrgency] = useState("");
  const [budget, setBudget] = useState("");
  const [result, setResult] = useState<FinderResult | null>(null);
  const [loading, setLoading] = useState(false);

  const ready = industry !== "" && headache !== "";

  async function onSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    if (!ready) return;
    setLoading(true);

    const answers: FinderAnswers = {
      industry: industry as IndustrySlug,
      headache: headache as HeadacheId,
      ...(companySize ? { companySize: companySize as CompanySize } : {}),
      ...(urgency ? { urgency: urgency as Urgency } : {}),
      ...(budget ? { budget: budget as Budget } : {}),
    };

    try {
      // Trailing slash matches the site convention and avoids a 308 redirect round-trip.
      const response = await fetch("/api/finder/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      if (!response.ok) throw new Error("gateway");
      const data = (await response.json()) as FinderResult;
      setResult(data);
    } catch {
      // Gateway unreachable: show the deterministic match with a plain line.
      const recommendation = matchRecommendation(answers);
      setResult({
        ...recommendation,
        rationale:
          "Here is where Nexoris Technologies would start, based on your answers. Tell us a little more and the team will come back with a clear plan and honest numbers.",
      });
    } finally {
      setLoading(false);
    }
  }

  function reset(): void {
    setResult(null);
  }

  if (result) {
    return (
      <div className="mt-8 rounded-card border border-purple-200 bg-white p-6 shadow-subtle md:p-8">
        <h3 className="font-roboto text-subhead font-700 text-ink-950">
          Here is what we suggest
        </h3>
        <p className="mt-3 max-w-article text-body text-neutral-600">
          {result.rationale}
        </p>
        <ul className="mt-6 flex flex-col gap-3">
          {result.services.map((service) => (
            <li key={service.slug}>
              <Link
                href={service.href}
                className="cursor-pointer font-600 text-purple-600 hover:text-purple-700"
              >
                {service.label} &rarr;
              </Link>
            </li>
          ))}
          <li>
            <Link
              href={result.industry.href}
              className="cursor-pointer font-600 text-purple-600 hover:text-purple-700"
            >
              How we help in {result.industry.label} &rarr;
            </Link>
          </li>
        </ul>
        <div className="mt-8 flex flex-wrap gap-4">
          <Button href="/contact">Talk to us about this</Button>
          <Button variant="secondary" onClick={reset}>
            Start over
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-8 rounded-card border border-purple-200 bg-white p-6 shadow-subtle md:p-8"
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field
          id={`${baseId}-industry`}
          label="What kind of business are you?"
          value={industry}
          onChange={setIndustry}
          options={INDUSTRY_OPTIONS}
          placeholder="Choose your industry"
        />
        <Field
          id={`${baseId}-headache`}
          label="What is frustrating you most right now?"
          value={headache}
          onChange={setHeadache}
          options={HEADACHE_OPTIONS}
          placeholder="Choose the closest one"
        />
        <Field
          id={`${baseId}-size`}
          label="How big is your team?"
          optional
          value={companySize}
          onChange={setCompanySize}
          options={COMPANY_SIZE_OPTIONS}
          placeholder="Choose a size"
        />
        <Field
          id={`${baseId}-urgency`}
          label="How soon do you want to start?"
          optional
          value={urgency}
          onChange={setUrgency}
          options={URGENCY_OPTIONS}
          placeholder="Choose a timeframe"
        />
        <Field
          id={`${baseId}-budget`}
          label="Do you have a budget in mind?"
          optional
          value={budget}
          onChange={setBudget}
          options={BUDGET_OPTIONS}
          placeholder="Choose one"
        />
      </div>
      <div className="mt-6">
        <Button type="submit" disabled={!ready || loading}>
          {loading ? "Finding the right service" : "Find the right service"}
        </Button>
      </div>
    </form>
  );
}
