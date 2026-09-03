"use client";
/**
 * Feedback while a form is submitting, everywhere at once.
 *
 * This admin submits through native forms posting to route handlers, which is the right choice —
 * it survives an Origin the proxy rewrites, where Server Actions do not. What it costs is the one
 * thing a client-side submit gives you free: between pressing Save and the page changing there is a
 * round trip to a remote database, and nothing on screen said anything was happening. People press
 * Save twice, which on a create form is two records.
 *
 * One listener on the document rather than a prop threaded through forty forms. It marks the form
 * and the button that submitted it, and refuses a second submit of a form already in flight.
 *
 * The button is deliberately NOT disabled. Several of these carry their meaning in the submitter —
 * `name="intent" value="publish"` against `value="draft"` — and a disabled control is not submitted,
 * so disabling it here would drop the very value that says what the person asked for. Pointer
 * events are removed in CSS instead, which stops the second click without touching the payload.
 */
import { useEffect } from "react";
import type { ReactNode } from "react";

export function FormBusy(): ReactNode {
  useEffect(() => {
    const onSubmit = (event: Event): void => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      // A form already on its way. Stop the duplicate rather than sending it.
      if (form.dataset["busy"] === "1") {
        event.preventDefault();
        return;
      }
      form.dataset["busy"] = "1";
      const submitter = (event as SubmitEvent).submitter;
      if (submitter instanceof HTMLElement) submitter.dataset["busy"] = "1";
    };

    /*
     * Coming back to a page through the browser's history restores it exactly as it was left,
     * including a form still marked busy from the submit that navigated away. Clearing on pageshow
     * means the back button does not hand somebody a form they can no longer submit.
     */
    const clear = (): void => {
      for (const el of Array.from(document.querySelectorAll<HTMLElement>('[data-busy="1"]'))) {
        delete el.dataset["busy"];
      }
    };

    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("pageshow", clear);
    return () => {
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("pageshow", clear);
    };
  }, []);

  return null;
}
