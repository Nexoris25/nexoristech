/**
 * Reading Mailjet's answer.
 *
 * The case worth a test is the one that is easy to get wrong: Mailjet accepts a batch with HTTP 200
 * and reports each message's fate inside the body, so a refused recipient looks like a success at the
 * transport layer. Reporting that as sent would tell an admin an invitation went out when the provider
 * had rejected it, and the copyable-link fallback would never be offered.
 */
import { describe, expect, it } from "vitest";
import { parseBatch } from "./email.js";

describe("parseBatch", () => {
  it("accepts a successful send", () => {
    expect(parseBatch(JSON.stringify({ Messages: [{ Status: "success" }] }))).toBeNull();
  });

  it("catches a refusal that arrived as HTTP 200", () => {
    const body = JSON.stringify({
      Messages: [
        {
          Status: "error",
          Errors: [{ ErrorMessage: '"From" email address is not an authorised sender.' }],
        },
      ],
    });
    expect(parseBatch(body)).toBe(
      'provider reported error: "From" email address is not an authorised sender.',
    );
  });

  it("reports a refusal with no message attached", () => {
    expect(parseBatch(JSON.stringify({ Messages: [{ Status: "error" }] }))).toBe(
      "provider reported error",
    );
  });

  it("joins several errors on one message", () => {
    const body = JSON.stringify({
      Messages: [{ Status: "error", Errors: [{ ErrorMessage: "one" }, { ErrorMessage: "two" }] }],
    });
    expect(parseBatch(body)).toBe("provider reported error: one; two");
  });

  it("treats an empty batch as a failure, not a send", () => {
    expect(parseBatch(JSON.stringify({ Messages: [] }))).toBe("provider returned no message status");
  });

  it("does not fail a send over a 200 in an unexpected shape", () => {
    // The transport accepted it. Inventing a failure here would turn a delivered invitation into a
    // reported error, and the provider's own dashboard is the record either way.
    expect(parseBatch("not json at all")).toBeNull();
    expect(parseBatch("{}")).toBe("provider returned no message status");
  });
});
