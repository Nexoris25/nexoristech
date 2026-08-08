/**
 * The Oge workspace. A full-screen version of the assistant for longer sessions: the same grounded,
 * permission-scoped answers as the floating widget, in a calmer, larger canvas. Oge reads the signed-in
 * user's live data and only ever reports what their role can see (§3.2).
 */
import type { ReactNode } from "react";
import { requireStaff } from "../../../lib/auth.js";
import { OgeChat } from "../../../components/OgeChat.js";
import { OgeMark } from "../../../components/OgeMark.js";

export const dynamic = "force-dynamic";

export default async function OgeWorkspace(): Promise<ReactNode> {
  const staff = await requireStaff();
  const firstName = staff.name.split(/\s+/)[0] ?? staff.name;

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-4xl flex-col">
      <div className="flex items-center gap-3">
        <OgeMark size={40} className="rounded-xl" />
        <div>
          <h1 className="text-[1.4rem] font-700 text-slate-900">Oge</h1>
          <p className="text-[0.85rem] text-slate-500">Your Nexoris Technologies assistant. Answers come from your live data, within what your role can see.</p>
        </div>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#14112e] p-4 shadow-subtle">
        <OgeChat variant="page" firstName={firstName} />
      </div>
    </div>
  );
}
