/**
 * Sealing a secret before it goes in the database.
 *
 * Settings that hold a credential are configured through the platform's own UI, which means the
 * credential has to be stored somewhere. Stored as text it is readable by anything that can read the
 * table: a backup, a replica, a support query, a screenshot of a psql session. Sealing it means that
 * a copy of the database on its own is not enough to send mail as this company.
 *
 * AES-256-GCM, which is the standard authenticated construction: it encrypts and it detects tampering,
 * so a row edited by hand fails to open rather than decrypting to something else. Node's own crypto,
 * no dependency.
 *
 * The key lives in ADMIN_SETTINGS_KEY as 64 hex characters (32 bytes) and never in the database, which
 * is the entire point of the split. Generate one with:
 *
 *   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
 *
 * Losing the key does not lose the platform: re-enter the credential in Settings and it is sealed
 * again under the new key. Changing it invalidates every sealed value, which is what rotation means.
 *
 * The sealed form is `v1.<iv>.<tag>.<ciphertext>`, all base64url. The version prefix is there so a
 * future change of construction can be recognised rather than guessed at.
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const VERSION = "v1";
/** GCM's standard nonce length. 12 bytes is what the mode is specified around. */
const IV_BYTES = 12;

function key(): Buffer | null {
  const raw = process.env.ADMIN_SETTINGS_KEY;
  if (!raw || !/^[0-9a-fA-F]{64}$/.test(raw.trim())) return null;
  return Buffer.from(raw.trim(), "hex");
}

/** True when secrets can be sealed and opened. Callers use this to explain what is missing. */
export function sealingAvailable(): boolean {
  return key() !== null;
}

/**
 * Seal a secret. Returns null when no key is configured, so a caller stores nothing rather than
 * storing something readable: a credential written in the clear because setup was incomplete is worse
 * than a credential not written at all.
 */
export function seal(plaintext: string): string | null {
  const k = key();
  if (!k) return null;
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", k, iv);
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return [
    VERSION,
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    body.toString("base64url"),
  ].join(".");
}

/**
 * Open a sealed secret, or null if it cannot be opened.
 *
 * Null covers every failure for the same reason: a wrong key, a truncated value, a tampered row and a
 * value sealed under a previous key are all "this credential is not usable", and telling them apart in
 * a return type would only invite a caller to log the difference.
 */
export function open(sealed: string | null | undefined): string | null {
  const k = key();
  if (!k || !sealed) return null;
  const parts = sealed.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", k, Buffer.from(parts[1] as string, "base64url"));
    decipher.setAuthTag(Buffer.from(parts[2] as string, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(parts[3] as string, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

/**
 * The tail of a credential, for recognition.
 *
 * Enough for an operator to tell the key they just rotated to from the one that was there before, and
 * not enough to be worth stealing. Four characters, and only ever of a key, never of a secret.
 */
export function hint(value: string): string {
  const trimmed = value.trim();
  return trimmed.length <= 4 ? "" : trimmed.slice(-4);
}
