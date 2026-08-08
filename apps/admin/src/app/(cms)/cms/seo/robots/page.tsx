import type { ReactNode } from "react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { cmsDb } from "../../../../../lib/cms-db.js";
import { RobotsEditor, DEFAULT_ROBOTS } from "./RobotsEditor.js";

export const dynamic = "force-dynamic";

export default async function RobotsPage(): Promise<ReactNode> {
  await requireCmsAccess();
  let content = DEFAULT_ROBOTS;
  let lastSaved: string | null = null;
  try {
    const { rows } = await cmsDb().query<{ data: { content?: string }; updated_at: string }>("SELECT data, updated_at::text FROM cms_setting WHERE scope='robots'");
    if (rows[0]?.data?.content) { content = rows[0].data.content; lastSaved = rows[0].updated_at; }
  } catch { /* use default */ }

  return (
    <div>
      <h1 className="text-[1.4rem] font-700 text-slate-900">Robots.txt</h1>
      <p className="mt-1 text-[0.86rem] text-slate-500">Edit and manage your robots.txt file.</p>
      <div className="mt-5"><RobotsEditor initial={content} lastSaved={lastSaved} /></div>
    </div>
  );
}
