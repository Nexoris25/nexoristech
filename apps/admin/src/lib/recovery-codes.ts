/**
 * Recovery codes: the way somebody resets their own password when no mail provider is configured.
 *
 * The shape of the problem. A password reset has to prove the person is who they say, and the proof
 * cannot be the password, because the password is the thing they have lost. Email is the usual proof.
 * Without it the only alternatives are an administrator vouching for them, which needs somebody else
 * to be available and to judge a voice on a phone, or something the person was given earlier and kept.
 * This is the second.
 *
 * Why the codes look the way they do:
 *
 *   * Twenty characters of Crockford's base32, which is 100 bits from the system CSPRNG. Enough that
 *     guessing is not a threat model, which is what lets the stored form be a flat hash.
 *
 *   * Crockford's alphabet excludes I, L, O and U. The first three because they are misread as 1 and
 *     0 when copied off a screen or read down a phone, and U so the generator cannot produce an
 *     unfortunate word. Input is normalised the same way, so somebody typing O for 0 is understood
 *     rather than told their code is wrong.
 *
 *   * Grouped in fives with hyphens for reading and transcription. Hyphens and case are stripped on
 *     the way in, so the grouping is presentation and never part of the secret.
 *
 * What is never possible: recovering a code after it is shown. Only the hash is stored, so a person
 * who loses their codes falls back to asking an administrator for a reset link, which is the loop
 * that already exists. That is the intended shape rather than a gap; codes that could be re-read from
 * the database would be a password list in a second table.
 */
import { createHash, randomInt } from "node:crypto";
import { db } from "./db.js";

/** Crockford base32 without I, L, O, U. */
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_LENGTH = 20;
const GROUP = 5;

/** How many are issued at once. Ten is enough to lose most of them and still have one. */
export const CODE_COUNT = 10;

/** One code, grouped for reading: XXXXX-XXXXX-XXXXX-XXXXX. */
function generateCode(): string {
  let raw = "";
  // randomInt is rejection-sampled by Node, so no modulo bias across the 32-character alphabet.
  for (let i = 0; i < CODE_LENGTH; i += 1) raw += ALPHABET[randomInt(ALPHABET.length)];
  return (raw.match(new RegExp(`.{1,${GROUP}}`, "g")) ?? []).join("-");
}

/**
 * The comparable form of a code as typed.
 *
 * Everything presentational is removed and the classic misreadings are folded in, so a code copied by
 * hand off a screen still matches: O and o become 0, I, l and L become 1. This mapping is why the
 * alphabet excludes those letters, since a code can then never contain a character that normalises to
 * something else.
 */
export function normaliseCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[\s-]/g, "")
    .replace(/O/g, "0")
    .replace(/[IL]/g, "1");
}

/** What is stored. Never the code. */
function hashCode(code: string): string {
  return createHash("sha256").update(normaliseCode(code)).digest("hex");
}

/**
 * Issue a fresh set, replacing any the person already had.
 *
 * Returns the plain codes, which is the only moment they exist outside the person's own keeping. The
 * caller must show them once and must not log or store them.
 *
 * Replacing rather than adding: a regenerated set means the old ones are gone, which is what somebody
 * regenerating because they think an old list leaked expects to have happened.
 */
export async function issueRecoveryCodes(staffId: string): Promise<string[]> {
  const codes = Array.from({ length: CODE_COUNT }, generateCode);
  const client = await db().connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM recovery_code WHERE staff_id = $1", [staffId]);
    for (const code of codes) {
      await client.query("INSERT INTO recovery_code (staff_id, code_hash) VALUES ($1, $2)", [
        staffId,
        hashCode(code),
      ]);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
  return codes;
}

/** How many unused codes a person has left, for their account page. */
export async function remainingCodes(staffId: string): Promise<number> {
  const { rows } = await db().query<{ n: string }>(
    "SELECT count(*)::text n FROM recovery_code WHERE staff_id = $1 AND used_at IS NULL",
    [staffId],
  );
  return Number(rows[0]?.n ?? 0);
}

/**
 * Spend a code, returning the staff it belonged to, or null.
 *
 * The update is the check. Marking it used in the same statement that finds it means two requests
 * racing the same code cannot both succeed: the second matches no row, because `used_at IS NULL` is
 * no longer true by the time it looks. Verifying first and then marking would leave exactly that gap,
 * and a single-use code that can be used twice under load is not single-use.
 *
 * The email is part of the condition so a code cannot be used against an account it was not issued
 * for, even though the codes are unique. It also means a stolen code is useless without knowing whose
 * it is.
 */
export async function consumeRecoveryCode(
  email: string,
  code: string,
): Promise<{ staffId: string; name: string } | null> {
  const normalised = normaliseCode(code);
  // Too short to be one of ours: refuse without a database round trip.
  if (normalised.length !== CODE_LENGTH) return null;

  const { rows } = await db().query<{ staff_id: string; name: string }>(
    `UPDATE recovery_code r
        SET used_at = now()
       FROM staff s
      WHERE r.staff_id = s.id
        AND r.code_hash = $1
        AND r.used_at IS NULL
        AND lower(s.email) = lower($2)
        AND s.active = true
    RETURNING r.staff_id, s.name`,
    [hashCode(code), email],
  );
  const row = rows[0];
  return row ? { staffId: row.staff_id, name: row.name } : null;
}
