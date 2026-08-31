/**
 * Which Action Center items a person has already read.
 *
 * The items are derived from live data on every request, so there is no row to carry a "read" flag.
 * Only the reading is stored, keyed on the item's own stable identifier. See migration 0035 for why
 * it is the right way round.
 *
 * Every function here fails soft. A notification badge is not worth a 500: if the table cannot be
 * read, the honest fallback is to treat nothing as read, which shows the alert again rather than
 * hiding something the person has not seen.
 */
import { db } from "./db.js";

/** The item ids this staff member has read. */
export async function readItemIds(staffId: string): Promise<Set<string>> {
  try {
    const { rows } = await db().query<{ item_id: string }>(
      "SELECT item_id FROM notification_read WHERE staff_id = $1",
      [staffId],
    );
    return new Set(rows.map((r) => r.item_id));
  } catch (e) {
    console.error(`[notifications] could not read state: ${e instanceof Error ? e.message : String(e)}`);
    return new Set();
  }
}

/**
 * Mark items read for this staff member.
 *
 * Idempotent: opening the same alert twice, or pressing "mark all as read" when most are already
 * read, must not fail. The conflict clause keeps the first read_at, which is the time the person
 * actually saw it.
 */
export async function markRead(staffId: string, itemIds: readonly string[]): Promise<void> {
  const ids = itemIds.map((id) => id.trim()).filter((id) => id.length > 0 && id.length <= 200);
  if (ids.length === 0) return;
  try {
    await db().query(
      `INSERT INTO notification_read (staff_id, item_id)
       SELECT $1, unnest($2::text[])
       ON CONFLICT (staff_id, item_id) DO NOTHING`,
      [staffId, ids],
    );
  } catch (e) {
    console.error(`[notifications] could not mark read: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/** Mark items unread again, for a person who wants one back in their list. */
export async function markUnread(staffId: string, itemIds: readonly string[]): Promise<void> {
  const ids = itemIds.filter((id) => id.length > 0);
  if (ids.length === 0) return;
  try {
    await db().query(
      "DELETE FROM notification_read WHERE staff_id = $1 AND item_id = ANY($2::text[])",
      [staffId, ids],
    );
  } catch (e) {
    console.error(`[notifications] could not mark unread: ${e instanceof Error ? e.message : String(e)}`);
  }
}
