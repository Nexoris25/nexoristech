import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("../../../lib/rate-limit.js", () => ({
  rateLimit: () => true,
  clientIp: () => "test",
}));
import { POST } from "./route.js";

afterEach(() => vi.unstubAllGlobals());
const request = (body: unknown) =>
  new NextRequest("http://localhost/api/contact/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
describe("contact enquiry consent", () => {
  it.each(["oge-chat", "newsletter"])(
    "preserves the existing %s intake contract",
    async (source) => {
      const upstream = vi.fn().mockResolvedValue(Response.json({ ok: true }));
      vi.stubGlobal("fetch", upstream);
      const response = await POST(
        request({ source, message: "Existing flow" }),
      );
      expect(response.status).toBe(200);
      expect(JSON.parse(upstream.mock.calls[0]![1].body)).toEqual({
        source,
        message: "Existing flow",
      });
    },
  );
  it.each([undefined, false, "true"])(
    "rejects non-explicit consent %s before forwarding",
    async (consent) => {
      const upstream = vi.fn();
      vi.stubGlobal("fetch", upstream);
      const response = await POST(
        request({ name: "Test", message: "A project", consent }),
      );
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: "consent-required" });
      expect(upstream).not.toHaveBeenCalled();
    },
  );
  it("records accepted enquiry consent without changing the gateway field contract", async () => {
    const upstream = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal("fetch", upstream);
    const response = await POST(
      request({
        name: "Test",
        email: "test@example.com",
        message: "A project",
        consent: true,
      }),
    );
    expect(response.status).toBe(200);
    const forwarded = JSON.parse(upstream.mock.calls[0]![1].body);
    expect(forwarded.consent).toBeUndefined();
    expect(forwarded.email).toBe("test@example.com");
    expect(forwarded.message).toMatch(/^A project\n\nEnquiry consent: agreed/);
    expect(forwarded.message).toContain("/privacy-policy/");
  });
});
