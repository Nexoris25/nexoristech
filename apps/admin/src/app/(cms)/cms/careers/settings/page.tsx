import type { ReactNode } from "react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { cmsDb } from "../../../../../lib/cms-db.js";
import { CareersSettings, type CareersConfig } from "./CareersSettings.js";

export const dynamic = "force-dynamic";

const DEFAULTS: CareersConfig = {
  pageTitle: "Careers at Nexoris Technologies",
  pageIntro: "Join a team building useful software for real businesses. See our open roles below.",
  requirePortfolio: true, requireCoverLetter: false, notifyOnApply: true,
  brandColor: "#543CDA", showTeamPhotos: true,
  aiEnabled: true, aiFitScore: true, aiVerification: true, aiCandidateAnalysis: true,
  metaTitle: "Careers at Nexoris Technologies", metaDescription: "Explore open roles and join the Nexoris Technologies team.",
};

export default async function CareersSettingsPage(): Promise<ReactNode> {
  await requireCmsAccess();
  let config = DEFAULTS;
  try {
    const { rows } = await cmsDb().query<{ data: CareersConfig }>("SELECT data FROM cms_setting WHERE scope='careers'");
    if (rows[0]?.data) config = { ...DEFAULTS, ...rows[0].data };
  } catch { /* use defaults */ }
  return (
    <div>
      <h1 className="text-[1.4rem] font-700 text-slate-900">Careers Settings</h1>
      <p className="mt-1 text-[0.86rem] text-slate-500">Configure the careers module and how Oge assists with hiring.</p>
      <div className="mt-5"><CareersSettings initial={config} /></div>
    </div>
  );
}
