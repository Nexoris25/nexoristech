/**
 * Vision fallback for alt text.
 *
 * The alt-text call used a single Gemini slot, the one on the Project B key. When that project hit
 * its quota the endpoint returned a 500 and every uploaded image quietly took filename-derived alt
 * text instead, while the Project A key sat unused. That is invisible from the CMS: the editor sees
 * "Home hero" and no reason why. This was found by exercising the endpoint after the Nest 11
 * upgrade and getting `vision 429`.
 *
 * These tests pin the fallback: try each configured project, stop early on a rejection that every
 * project would repeat, and report the last real failure rather than a bare error.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { ContentService } from "./content.service.js";

const PNG = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

/** A ContentService whose environment has both Gemini projects keyed. */
function service(env: Record<string, string> = {}): ContentService {
  const s = new ContentService();
  Object.defineProperty(s, "env", {
    value: { GEMINI_API_KEY_PROJECT_A: "key-a", GEMINI_API_KEY_PROJECT_B: "key-b", ...env },
    writable: true,
  });
  return s;
}

const ok = (text: string): Response =>
  ({ ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }) }) as unknown as Response;
const fail = (status: number): Response => ({ ok: false, status }) as unknown as Response;

/** The key each call was made with, read back from the request headers. */
function keysUsed(spy: ReturnType<typeof vi.fn>): string[] {
  return spy.mock.calls.map((c) => {
    const init = c[1] as { headers: Record<string, string> };
    return init.headers["x-goog-api-key"] ?? "";
  });
}

afterEach(() => { vi.restoreAllMocks(); });

describe("altText vision fallback", () => {
  it("returns the first project's answer without calling the second", async () => {
    const spy = vi.fn().mockResolvedValue(ok("A dashboard showing monthly revenue"));
    vi.stubGlobal("fetch", spy);

    await expect(service().altText(PNG, "image/png")).resolves.toBe("A dashboard showing monthly revenue");
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("falls through to the other project when the first is rate limited", async () => {
    // This is the exact production case: 429 on one project, quota available on the other.
    const spy = vi.fn()
      .mockResolvedValueOnce(fail(429))
      .mockResolvedValueOnce(ok("Two engineers reviewing code on a monitor"));
    vi.stubGlobal("fetch", spy);

    await expect(service().altText(PNG, "image/png")).resolves.toBe("Two engineers reviewing code on a monitor");
    expect(spy).toHaveBeenCalledTimes(2);
    // Two distinct project keys, not the same one twice.
    expect(new Set(keysUsed(spy)).size).toBe(2);
  });

  it("gives up immediately when the image itself is rejected", async () => {
    // A 400 is about the payload, so every project would answer the same way. Retrying only
    // burns quota and delays the caller's fallback.
    const spy = vi.fn().mockResolvedValue(fail(400));
    vi.stubGlobal("fetch", spy);

    await expect(service().altText(PNG, "image/png")).rejects.toThrow(/vision 400/);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("names the last failure so the log says why, not just that it failed", async () => {
    const spy = vi.fn().mockResolvedValue(fail(429));
    vi.stubGlobal("fetch", spy);

    await expect(service().altText(PNG, "image/png")).rejects.toThrow(/vision 429 on GEMINI_API_KEY_PROJECT_/);
  });

  it("skips a project with no key rather than failing the chain", async () => {
    const spy = vi.fn().mockResolvedValue(ok("A server rack"));
    vi.stubGlobal("fetch", spy);

    const s = service({ GEMINI_API_KEY_PROJECT_B: "" });
    await expect(s.altText(PNG, "image/png")).resolves.toBe("A server rack");
    expect(keysUsed(spy).every((k) => k === "key-a")).toBe(true);
  });

  it("reports no vision key when neither project is configured", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);

    const s = service({ GEMINI_API_KEY_PROJECT_A: "", GEMINI_API_KEY_PROJECT_B: "" });
    await expect(s.altText(PNG, "image/png")).rejects.toThrow(/no vision key/);
    expect(spy).not.toHaveBeenCalled();
  });

  it("still strips the lead-in and the 125 character cap", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(ok("Photo of " + "a".repeat(200))));
    const alt = await service().altText(PNG, "image/png");
    expect(alt.startsWith("Photo of")).toBe(false);
    expect(alt.length).toBeLessThanOrEqual(125);
  });
});
