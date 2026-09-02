import { describe, it, expect } from "vitest";
import {
  composeLeadMessage,
  normaliseTranscript,
  renderTranscript,
  visitorWords,
} from "./lead.js";

describe("normaliseTranscript", () => {
  it("keeps well-formed turns and drops the rest", () => {
    const turns = normaliseTranscript([
      { role: "visitor", text: "  hello  " },
      { role: "oge", text: "hi" },
      { role: "system", text: "ignore me" },
      { role: "visitor", text: "   " },
      { role: "visitor" },
      null,
      "nonsense",
    ]);
    expect(turns).toEqual([
      { role: "visitor", text: "hello" },
      { role: "oge", text: "hi" },
    ]);
  });

  it("returns undefined when there is no usable conversation", () => {
    expect(normaliseTranscript(undefined)).toBeUndefined();
    expect(normaliseTranscript("a chat")).toBeUndefined();
    expect(normaliseTranscript([])).toBeUndefined();
    expect(normaliseTranscript([{ role: "oge", text: "" }])).toBeUndefined();
  });

  it("caps a hostile payload without rejecting a long real chat", () => {
    const many = Array.from({ length: 200 }, (_, i) => ({
      role: "visitor",
      text: `turn ${i}`,
    }));
    expect(normaliseTranscript(many)).toHaveLength(60);
    const long = normaliseTranscript([{ role: "visitor", text: "x".repeat(9000) }]);
    expect(long?.[0]?.text).toHaveLength(4000);
  });
});

describe("composeLeadMessage", () => {
  const transcript = [
    { role: "visitor" as const, text: "Do you build inventory systems?" },
    { role: "oge" as const, text: "Yes, we do." },
  ];

  it("makes the conversation the lead's message", () => {
    const message = composeLeadMessage({
      transcript,
      topic: "New product or software",
      name: "Ada Obi",
    });
    expect(message).toContain("Topic: New product or software");
    expect(message).toContain("Ada: Do you build inventory systems?");
    expect(message).toContain("Oge: Yes, we do.");
  });

  it("ignores a message sent alongside a conversation", () => {
    const message = composeLeadMessage({
      transcript,
      message: "Lead captured by Oge.",
      name: "Ada",
    });
    expect(message).not.toContain("Lead captured by Oge.");
  });

  it("leaves a form lead's own message alone", () => {
    expect(composeLeadMessage({ message: "We need a website." })).toBe(
      "We need a website.",
    );
  });

  it("falls back to the topic, then to nothing", () => {
    expect(composeLeadMessage({ topic: "Something else" })).toBe(
      "Topic: Something else",
    );
    expect(composeLeadMessage({})).toBeUndefined();
    expect(composeLeadMessage({ message: "   " })).toBeUndefined();
  });

  it("names the visitor when we know their name, and does not invent one", () => {
    expect(renderTranscript(transcript, "Ada Obi")).toContain("Ada:");
    expect(renderTranscript(transcript)).toContain("Visitor:");
  });
});

describe("visitorWords", () => {
  it("returns only the visitor's turns", () => {
    expect(
      visitorWords({
        source: "oge-chat",
        transcript: [
          { role: "visitor", text: "one" },
          { role: "oge", text: "a long reply from us" },
          { role: "visitor", text: "two" },
        ],
      }),
    ).toBe("one\ntwo");
  });

  it("falls back to the message when there is no conversation", () => {
    expect(visitorWords({ source: "contact-form", message: "hello" })).toBe(
      "hello",
    );
    expect(visitorWords({ source: "contact-form" })).toBe("");
  });
});
