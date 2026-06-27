"use client";
/**
 * The interactive Contact form (PRD 10.5, 11). It renders the approved fields from the content
 * module, composes a lead, and posts it to the Oge lead intake through the /api/contact proxy,
 * which scores and stores it. On success it shows the approved after-submit message; if the
 * gateway is unreachable it tells the visitor how to reach the team directly, so a lead is never
 * silently lost. The scoring stays server-side and is never shown here.
 */
import { useId, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Button, Field, Input, Select, Textarea } from "@nexoris/ui";
import type { Section } from "../content/types.js";

type FormSection = Extract<Section, { kind: "form" }>;

const MESSAGE_LABEL = "What do you need?";

export function ContactForm({ section }: { section: FormSection }): ReactNode {
  const baseId = useId();
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);

  const get = (label: string): string => values[label]?.trim() ?? "";
  const set = (label: string, value: string): void =>
    setValues((prev) => ({ ...prev, [label]: value }));

  const ready =
    get("Your name") !== "" &&
    get("Email address") !== "" &&
    get(MESSAGE_LABEL) !== "";

  function composeMessage(): string {
    const extras: string[] = [];
    const industry = get("Your industry");
    const budget = get("Budget range (optional)");
    const timeframe = get("When do you want to start?");
    if (industry) extras.push(`Industry: ${industry}`);
    if (budget) extras.push(`Budget: ${budget}`);
    if (timeframe) extras.push(`Timeframe: ${timeframe}`);
    const main = get(MESSAGE_LABEL);
    return extras.length > 0 ? `${main}\n\n${extras.join("\n")}` : main;
  }

  async function onSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    if (!ready || submitting) return;
    setSubmitting(true);
    setError(false);

    const lead = {
      source: "contact-form",
      page: "/contact",
      name: get("Your name"),
      email: get("Email address"),
      phone: get("Phone (optional)") || undefined,
      company: get("Company or organisation") || undefined,
      message: composeMessage(),
    };

    try {
      const response = await fetch("/api/contact/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
      if (!response.ok) throw new Error("intake");
      setDone(true);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div
        className="max-w-article rounded-card border border-purple-200 bg-purple-100 p-6"
        role="status"
      >
        <h2 className="font-roboto text-section font-700 text-ink-950">
          {section.heading}
        </h2>
        <p className="mt-4 text-body text-ink-950">{section.afterSubmit}</p>
      </div>
    );
  }

  return (
    <div className="max-w-article">
      <h2 className="font-roboto text-section font-700 text-ink-950">
        {section.heading}
      </h2>
      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-5">
        {section.fields.map((field) => {
          const fieldId = `${baseId}-${field.label.replace(/\s+/g, "-").toLowerCase()}`;
          return (
            <Field
              key={field.label}
              label={field.label}
              htmlFor={fieldId}
              {...(field.microcopy ? { hint: field.microcopy } : {})}
            >
              {field.options ? (
                <Select
                  id={fieldId}
                  value={get(field.label)}
                  onChange={(event) => set(field.label, event.target.value)}
                >
                  <option value="">Choose one</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              ) : field.label === MESSAGE_LABEL ? (
                <Textarea
                  id={fieldId}
                  value={get(field.label)}
                  onChange={(event) => set(field.label, event.target.value)}
                />
              ) : (
                <Input
                  id={fieldId}
                  type={
                    field.label === "Email address"
                      ? "email"
                      : field.label.startsWith("Phone")
                        ? "tel"
                        : "text"
                  }
                  value={get(field.label)}
                  onChange={(event) => set(field.label, event.target.value)}
                />
              )}
            </Field>
          );
        })}

        <div className="rounded-2xl border border-purple-200 bg-purple-100 p-6">
          <h3 className="font-roboto text-subhead font-600 text-ink-950">
            {section.briefBuilder.heading}
          </h3>
          <p className="mt-2 text-body text-neutral-600">
            {section.briefBuilder.body}
          </p>
        </div>

        {error ? (
          <p className="text-body text-purple-700" role="alert">
            We could not send that just now. Please email
            business@nexoristech.com or try again in a moment.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-4">
          <Button type="submit" disabled={!ready || submitting}>
            {submitting ? "Sending" : section.submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
