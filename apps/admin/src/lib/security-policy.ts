/**
 * The security policy, read from Global Settings and enforced where passwords and sign-ins happen.
 *
 * The settings screen carried a Security card — minimum password length, require a special character,
 * password expiry, session timeout, require MFA, lockout after N attempts — and none of it did
 * anything. Passwords were checked against a hardcoded eight characters, sessions lasted a fixed day,
 * and nothing counted a failed sign-in. A control that reports a policy it does not apply is worse than
 * no control, because it is believed.
 *
 * The three that can be enforced now are enforced here. Password expiry and MFA need enrolment and
 * rotation flows that do not exist, so they were removed from the screen rather than left as switches
 * that change nothing.
 */
import { cmsDb } from "./cms-db.js";

export interface SecurityPolicy {
  /** Minimum characters in a password. */
  minPasswordLength: number;
  /** Whether a password must contain a non-alphanumeric character. */
  requireSpecial: boolean;
  /** How long a session lasts without "keep me signed in", in seconds. */
  sessionSeconds: number;
  /** Failed sign-ins from one email before it is locked out, or 0 for no lockout. */
  lockoutAttempts: number;
}

/**
 * What applies when nothing has been configured. Deliberately not weaker than the old hardcoded rule.
 */
export const DEFAULT_POLICY: SecurityPolicy = {
  minPasswordLength: 12,
  requireSpecial: true,
  sessionSeconds: 60 * 60 * 24,
  lockoutAttempts: 5,
};

/** The settings are stored as the labels the select offers, so the number has to be read out of them. */
function firstNumber(value: unknown, fallback: number): number {
  const n = Number.parseInt(String(value ?? "").replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

interface StoredSettings {
  minPasswordLength?: string;
  requireSpecial?: boolean;
  sessionTimeout?: string;
  lockoutAttempts?: string;
}

/** Read the configured policy. Falls back to the defaults if settings cannot be read. */
export async function securityPolicy(): Promise<SecurityPolicy> {
  try {
    const { rows } = await cmsDb().query<{ data: StoredSettings }>(
      "SELECT data FROM cms_setting WHERE scope='global'");
    const d = rows[0]?.data;
    if (!d) return DEFAULT_POLICY;
    // "30 minutes" and "8 hours" both appear in the select, so the unit has to be read too.
    const raw = String(d.sessionTimeout ?? "");
    const amount = firstNumber(raw, 0);
    const sessionSeconds = amount > 0
      ? amount * (/hour/i.test(raw) ? 3600 : /day/i.test(raw) ? 86400 : 60)
      : DEFAULT_POLICY.sessionSeconds;
    return {
      minPasswordLength: firstNumber(d.minPasswordLength, DEFAULT_POLICY.minPasswordLength),
      requireSpecial: d.requireSpecial ?? DEFAULT_POLICY.requireSpecial,
      sessionSeconds,
      lockoutAttempts: /never|off|none/i.test(String(d.lockoutAttempts ?? ""))
        ? 0
        : firstNumber(d.lockoutAttempts, DEFAULT_POLICY.lockoutAttempts),
    };
  } catch {
    return DEFAULT_POLICY;
  }
}

/** Check a password against the policy. Returns the reason it fails, or null when it passes. */
export function passwordProblem(password: string, policy: SecurityPolicy): string | null {
  if (password.length < policy.minPasswordLength) {
    return `Your password must be at least ${policy.minPasswordLength} characters.`;
  }
  if (policy.requireSpecial && !/[^A-Za-z0-9]/.test(password)) {
    return "Your password must include a symbol, for example ! ? # or -.";
  }
  return null;
}
