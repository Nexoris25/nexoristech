/**
 * Keyless Google authentication (no downloaded JSON key). Uses Application Default Credentials, which the
 * google-auth-library discovers automatically from, in order of preference: a runtime service account
 * (Cloud Run / GCE / Workload Identity Federation) in production, or `gcloud auth application-default
 * login` locally. Returns a short-lived OAuth access token, or null when nothing is configured — callers
 * then fall back to sample data, so the app never breaks and no secret is ever required in the repo.
 *
 * One-time local setup (run by the account owner, not committed):
 *   gcloud auth application-default login \
 *     --scopes=openid,https://www.googleapis.com/auth/webmasters.readonly,https://www.googleapis.com/auth/analytics.readonly
 */
import { GoogleAuth } from "google-auth-library";

const SCOPES = [
  "https://www.googleapis.com/auth/webmasters.readonly", // Search Console
  "https://www.googleapis.com/auth/analytics.readonly", // GA4 Data API
];

let auth: GoogleAuth | undefined;

/** An access token from ADC, or null if no credentials are available. Never throws. */
export async function googleAccessToken(): Promise<string | null> {
  try {
    if (!auth) auth = new GoogleAuth({ scopes: SCOPES });
    const token = await auth.getAccessToken();
    return typeof token === "string" && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}
