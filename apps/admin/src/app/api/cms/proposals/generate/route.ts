/**
 * Run the programmatic SEO proposal generator (PRD 9.4, 9.6). Walks the real service and industry
 * catalogue across the Nigerian hubs, keeps only combinations the catalogue actually maps, scores each
 * against live Search Console demand, and writes the ranked result into the proposal queue for a human
 * to approve. Existing pending proposals for the same keyword are refreshed rather than duplicated, and
 * anything already approved or rejected is left alone. Proposes only: nothing is published here.
 */
import type { NextRequest } from "next/server";
import { cmsDb } from "../../../../../lib/cms-db.js";
import { getCmsStaffFor } from "../../../../../lib/auth.js";
import { generateProposals } from "../../../../../lib/pseo-generator.js";
import { pseoSettings, DEMAND_WINDOW_DAYS } from "../../../../../lib/pseo-settings.js";
import { seeOtherAt, pathBuilder } from "../../../../../lib/redirect.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<Response> {
  const staff = await getCmsStaffFor("seo.manage");
  const back = pathBuilder("/cms/proposals");
  if (!staff) return seeOtherAt(back);

  // The pause switch. Generation writes pages onto a live site, so it has to be stoppable, and a paused
  // run says so rather than appearing to work and producing nothing.
  const settings = await pseoSettings();
  if (!settings.enabled) {
    back.searchParams.set("paused", "1");
    return seeOtherAt(back);
  }

  const f = await request.formData().catch(() => null);
  // Demand is measured over the same trailing window the screens quote, so the rule that is applied and
  // the rule that is stated cannot drift apart.
  const days = Number(f?.get("days")) || DEMAND_WINDOW_DAYS;
  const limit = Math.min(500, Number(f?.get("limit")) || 200);

  const candidates = await generateProposals(days, limit);
  const pool = cmsDb();
  let written = 0;
  let withDemand = 0;

  for (const c of candidates) {
    if (c.impressions > 0) withDemand += 1;
    // The table stores priority as a label and confidence as a 0-100 score.
    const priorityLabel = c.priority >= 60 ? "High" : c.priority >= 30 ? "Medium" : "Low";
    // Refresh a pending proposal for the same keyword; never disturb one already decided.
    const { rowCount } = await pool.query(
      `UPDATE cms_proposal
          SET industry=$2, search_volume=$3, priority=$4, rationale=$5, confidence=$6
        WHERE keyword=$1 AND status='Pending'`,
      [c.keyword, c.industryLabel, c.impressions, priorityLabel, c.rationale, c.priority]);
    if (rowCount === 0) {
      const { rowCount: exists } = await pool.query("SELECT 1 FROM cms_proposal WHERE keyword=$1", [c.keyword]);
      if (exists) continue; // already approved or rejected: respect the decision
      await pool.query(
        `INSERT INTO cms_proposal (keyword, industry, search_volume, difficulty, priority, status, cpc, confidence, rationale)
         VALUES ($1,$2,$3,$4,$5,'Pending',$6,$7,$8)`,
        [c.keyword, c.industryLabel, c.impressions, null, priorityLabel, null, c.priority, c.rationale]);
    }
    written += 1;
  }

  back.searchParams.set("generated", String(written));
  back.searchParams.set("demand", String(withDemand));
  return seeOtherAt(back);
}
