/**
 * The home testimonials section (PRD 12). Client testimonials from the content API. Renders
 * nothing until the CMS has published testimonials.
 */
import type { ReactNode } from "react";
import { getTestimonials } from "../lib/cms.js";

export async function Testimonials(): Promise<ReactNode> {
  const testimonials = await getTestimonials(6);
  if (testimonials.length === 0) return null;

  return (
    <ul className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {testimonials.map((testimonial, index) => (
        <li
          key={`${testimonial.authorName}-${index}`}
          className="flex flex-col rounded-card border border-purple-200 p-6"
        >
          <blockquote className="flex-1 text-body text-ink-950">
            “{testimonial.quote}”
          </blockquote>
          <div className="mt-4 text-label">
            <span className="font-600 text-ink-950">
              {testimonial.authorName}
            </span>
            {testimonial.authorRole || testimonial.company ? (
              <span className="block text-neutral-600">
                {[testimonial.authorRole, testimonial.company]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
