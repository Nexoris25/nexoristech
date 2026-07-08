"use client";
/**
 * Interactive Contact form, ported from the approved handoff (Contact.html) with its exact fields,
 * smart keyword hint, and "shape my notes into a brief" helper. It composes a lead and posts it to
 * the Oge lead intake through the /api/contact proxy (unchanged contract: name, email, phone,
 * company, message). On success it shows the approved acknowledgement; if the gateway is
 * unreachable it tells the visitor how to reach the team directly so a lead is never lost. Server
 * scoring stays server-side and is never shown here.
 */
import { useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";

const INDUSTRIES = [
  "Retail & E-Commerce",
  "Restaurants & QSR",
  "Hospitality & Short-Lets",
  "Real Estate",
  "Automotive",
  "Events & Weddings",
  "Media & Entertainment",
  "Healthcare & Clinics",
  "Education & EdTech",
  "Fitness, Beauty & Wellness",
  "Professional Services",
  "Insurance",
  "Logistics & Supply Chain",
  "Manufacturing",
  "Construction & Engineering",
  "Agriculture & Agritech",
  "Financial Services & Fintech",
  "Government & Public Sector",
  "NGOs & Non-Profits",
  "Faith Organisations",
  "Something else",
];

const START_OPTIONS = [
  "As soon as possible",
  "Within three months",
  "Later this year",
  "Just exploring",
];

/** Deterministic keyword hint mirroring the handoff's smart-form assistant. */
const HINT_MAP: [RegExp, string][] = [
  [/chatbot|whatsapp|after hours|reply|enquir|24\/7|midnight/, "Sounds like AI Chatbots & Virtual Assistants could fit, answering customers at any hour."],
  [/automat|repetit|manual|retype|data entry|spreadsheet|paperwork/, "This points toward Business Process Automation, taking the busywork off your team."],
  [/dashboard|report|numbers|forecast|analytics|kpi|metric/, "This sounds like Data Dashboards & Analytics, so you can act on live numbers."],
  [/shop|store|ecommerce|e-commerce|online sales|checkout|catalog/, "AI E-Commerce may be the right starting point for selling online day and night."],
  [/integrat|connect|sync|two systems|share data|api/, "AI & Systems Integration could make the tools you already use share data automatically."],
  [/track|fleet|sensor|iot|cold room|vehicle|machine/, "IoT Development fits tracking vehicles, machines, or cold rooms live."],
  [/government|agency|ministry|citizen|public sector|council/, "GovTech Platforms is built for digital services in government and public agencies."],
  [/seo|google|found online|ranking|content|visibility/, "AI Content, SEO & GEO helps people and AI tools find you."],
  [/app|website|platform|system|build|software|portal|mobile/, "This sounds like AI Product Development, our main service, built around your business."],
];

export function ContactFormView(): ReactNode {
  const [need, setNeed] = useState("");
  const [industry, setIndustry] = useState("");
  const [start, setStart] = useState("");
  const [hint, setHint] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const needRef = useRef<HTMLTextAreaElement>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onNeedChange(value: string): void {
    setNeed(value);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => {
      const v = value.toLowerCase().trim();
      if (v.length < 12) {
        setHint("");
        return;
      }
      const match = HINT_MAP.find(([re]) => re.test(v));
      setHint(
        match
          ? match[1]
          : "Thanks, this gives us a clear starting point. We will suggest the right service on our first reply.",
      );
    }, 450);
  }

  function shapeNotes(): void {
    const v = need.trim();
    if (v.length < 12) {
      needRef.current?.focus();
      return;
    }
    const sector = industry || "your sector";
    let brief = `My goal:\n${v}\n\nCurrent situation:\nWe work in ${sector} and want this handled properly.`;
    if (start) brief += `\n\nTiming:\n${start}.`;
    brief += "\n\nA sensible first step:\nA short scoping call to agree the approach and honest numbers.";
    setNeed(brief);
    setHint("Brief shaped. Read it over and edit anything before you send.");
    needRef.current?.focus();
  }

  function composeMessage(fd: FormData): string {
    const extras: string[] = [];
    if (industry) extras.push(`Industry: ${industry}`);
    const budget = String(fd.get("budget") ?? "").trim();
    if (budget) extras.push(`Budget: ${budget}`);
    if (start) extras.push(`Timeframe: ${start}`);
    const main = String(fd.get("need") ?? "").trim();
    return extras.length > 0 ? `${main}\n\n${extras.join("\n")}` : main;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (submitting) return;
    const fd = new FormData(event.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const message = composeMessage(fd);
    if (!name || !email || !message) return;
    setSubmitting(true);
    setError(false);
    const lead = {
      source: "contact-form",
      page: "/contact",
      name,
      email,
      phone: String(fd.get("phone") ?? "").trim() || undefined,
      company: String(fd.get("company") ?? "").trim() || undefined,
      message,
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
      <div className="form-card reveal">
        <div className="thanks" role="status">
          <div className="tk-ic">
            <svg viewBox="0 0 24 24">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3>Thank you.</h3>
          <p>A real person reads every brief, and you will hear from us within one business day.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="form-card reveal">
      <form onSubmit={onSubmit} noValidate>
        <h2>Start the conversation.</h2>
        <p className="fc-sub">
          A real person reads every brief. The more you tell us, the better our first reply.
        </p>

        <div className="f-row">
          <div className="field">
            <label htmlFor="f-name">Your name</label>
            <input id="f-name" name="name" type="text" autoComplete="name" required />
          </div>
          <div className="field">
            <label htmlFor="f-email">Email address</label>
            <input id="f-email" name="email" type="email" autoComplete="email" required />
          </div>
        </div>
        <div className="f-row">
          <div className="field">
            <label htmlFor="f-phone">
              Phone <span className="opt">(optional)</span>
            </label>
            <input id="f-phone" name="phone" type="tel" autoComplete="tel" />
          </div>
          <div className="field">
            <label htmlFor="f-company">Company or organisation</label>
            <input id="f-company" name="company" type="text" autoComplete="organization" />
          </div>
        </div>
        <div className="f-row">
          <div className="field">
            <label htmlFor="f-industry">Your industry</label>
            <select
              id="f-industry"
              name="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            >
              <option value="" disabled>
                Select one
              </option>
              {INDUSTRIES.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="f-start">When do you want to start?</label>
            <select
              id="f-start"
              name="start"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            >
              <option value="" disabled>
                Select one
              </option>
              {START_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="field full">
          <label htmlFor="f-need">What do you need?</label>
          <textarea
            id="f-need"
            name="need"
            ref={needRef}
            value={need}
            onChange={(e) => onNeedChange(e.target.value)}
            placeholder="Write it the way you would say it."
            required
          />
          <span className="micro">
            Write it the way you would say it. Rough notes are fine, our assistant will help shape
            them.
          </span>
          <div className={`smart-hint${hint ? " on" : ""}`} aria-live="polite">
            <span className="sh-ic">
              <svg viewBox="0 0 24 24">
                <path d="M12 3l1.9 4.6L19 9l-4.6 1.9L12 16l-1.9-4.6L5 9l5.1-1.4z" />
              </svg>
            </span>
            <span>{hint}</span>
          </div>
        </div>
        <div className="field full">
          <label htmlFor="f-budget">
            Budget range <span className="opt">(optional)</span>
          </label>
          <input id="f-budget" name="budget" type="text" placeholder="A rough range is fine" />
          <span className="micro">
            Helps us suggest the right starting point. Skip it if you prefer.
          </span>
        </div>

        <div className="brief">
          <div className="brief-head">
            <span className="bh-ic">
              <svg viewBox="0 0 24 24">
                <path d="M12 3l1.9 4.6L19 9l-4.6 1.9L12 16l-1.9-4.6L5 9l5.1-1.4z" />
                <path d="M5 19h14" />
              </svg>
            </span>
            <h3>Want help shaping this?</h3>
          </div>
          <p>
            Type your rough notes and our assistant will arrange them into a clear brief: your goal,
            your current situation, and a sensible first step. You review and edit everything before
            it sends. Nothing goes out without your approval.
          </p>
          <div className="brief-btns">
            <button type="button" className="btn btn-primary" onClick={shapeNotes}>
              Shape my notes into a brief
            </button>
            <button type="submit" className="btn btn-glass">
              Send as written
            </button>
          </div>
        </div>

        {error ? (
          <p className="form-error" role="alert">
            We could not send that just now. Please email business@nexoristech.com or try again in a
            moment.
          </p>
        ) : null}

        <div className="submit-row">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Sending" : "Send my brief"} <span className="arr">&rarr;</span>
          </button>
          <span className="privacy-note">
            Your details stay with us and are handled in line with the NDPR.
          </span>
        </div>
      </form>
    </div>
  );
}
