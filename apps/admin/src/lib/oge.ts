/**
 * Server-to-server client to the Oge gateway's CRM Worker assists (PRD 3.2). Authenticated by the
 * internal shared secret. Returns null on any failure so the caller can fall back gracefully.
 */
const GATEWAY = process.env.OGE_GATEWAY_URL ?? "http://localhost:4000";

export interface DraftInput {
  name?: string;
  company?: string;
  message: string;
  matchedServices?: string[];
  industry?: string;
}

export interface DraftResult {
  draft: string;
  draftedBy: "ai" | "template";
}

export async function draftReply(
  input: DraftInput,
): Promise<DraftResult | null> {
  const secret = process.env.OGE_REINGEST_SHARED_SECRET;
  if (!secret) return null;
  try {
    const response = await fetch(`${GATEWAY}/crm/draft`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": secret,
      },
      body: JSON.stringify(input),
    });
    if (!response.ok) return null;
    return (await response.json()) as DraftResult;
  } catch {
    return null;
  }
}
