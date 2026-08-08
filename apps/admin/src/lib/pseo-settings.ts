/**
 * Whether programmatic page generation is currently allowed to run.
 *
 * Generation could be triggered at any time with no way to stop it, which is uncomfortable for a feature
 * that writes pages onto a live site. This is the switch: while it is off, nothing generates, and the
 * screens say so rather than appearing to work and quietly doing nothing.
 *
 * The demand floor lives here too, so the rule the generator applies and the rule the screen states are
 * the same value. A keyword qualifies only at MIN_SEARCH_VOLUME or more impressions across the trailing
 * DEMAND_WINDOW_DAYS in Search Console.
 */
import { cmsDb } from "./cms-db.js";
import { MIN_SEARCH_VOLUME } from "./pseo-generator.js";

/** The window Search Console demand is measured over. */
export const DEMAND_WINDOW_DAYS = 90;

export { MIN_SEARCH_VOLUME };

export interface PseoSettings {
  /** False pauses generation entirely. */
  enabled: boolean;
  /** Who last changed it, and when, so a pause is accountable. */
  changedBy: string | null;
  changedAt: string | null;
}

const SCOPE = "pseo";

/** Generation is on unless it has been explicitly turned off. */
export const DEFAULT_PSEO_SETTINGS: PseoSettings = { enabled: true, changedBy: null, changedAt: null };

export async function pseoSettings(): Promise<PseoSettings> {
  try {
    const { rows } = await cmsDb().query<{ data: Partial<PseoSettings> }>(
      "SELECT data FROM cms_setting WHERE scope = $1", [SCOPE]);
    const d = rows[0]?.data;
    if (!d) return DEFAULT_PSEO_SETTINGS;
    return {
      enabled: d.enabled !== false,
      changedBy: d.changedBy ?? null,
      changedAt: d.changedAt ?? null,
    };
  } catch {
    // A missing settings row must not stop generation; the default is the documented behaviour.
    return DEFAULT_PSEO_SETTINGS;
  }
}

/** Turn generation on or off, recording who did it. */
export async function setPseoEnabled(enabled: boolean, actor: string): Promise<void> {
  const data: PseoSettings = { enabled, changedBy: actor, changedAt: new Date().toISOString() };
  await cmsDb().query(
    `INSERT INTO cms_setting (scope, data) VALUES ($1, $2::jsonb)
     ON CONFLICT (scope) DO UPDATE SET data = $2::jsonb`,
    [SCOPE, JSON.stringify(data)]);
}
