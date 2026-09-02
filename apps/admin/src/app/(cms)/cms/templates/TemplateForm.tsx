"use client";
/**
 * Create / edit template (CMS Programmatic SEO design). Left: template information, the ordered section
 * structure, and the variables (token + label) used for generation. Right: settings and a live structure
 * preview. Sections and variables are editable lists stored as JSON. Native POST to /api/cms/templates.
 * Responsive to 360px.
 */
import { useState } from "react";
import type { ReactNode } from "react";
import { Plus, X, GripVertical } from "lucide-react";

interface Variable { token: string; label: string }
interface Initial { id?: string; name?: string; type?: string; description?: string; sections?: string[]; variables?: Variable[]; active?: boolean; inProposals?: boolean }
const field = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[0.86rem] text-slate-900 placeholder:text-slate-400 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15 resize-none";
const label = "text-[0.8rem] font-600 text-slate-700";
const TYPES = ["Landing Page", "Comparison", "Pricing", "Article"];

export function TemplateForm({ initial }: { initial?: Initial }): ReactNode {
  const edit = Boolean(initial?.id);
  const [name, setName] = useState(initial?.name ?? "");
  const [sections, setSections] = useState<string[]>(initial?.sections?.length ? initial.sections : ["Hero Section", "Benefits Section", "Call To Action"]);
  const [variables, setVariables] = useState<Variable[]>(initial?.variables?.length ? initial.variables : [{ token: "{service}", label: "Primary service offered" }, { token: "{industry}", label: "Target industry" }]);
  const [active, setActive] = useState(initial?.active ?? true);
  const [inProposals, setInProposals] = useState(initial?.inProposals ?? true);

  const setSection = (i: number, v: string): void => setSections((s) => s.map((x, j) => (j === i ? v : x)));
  const setVar = (i: number, k: keyof Variable, v: string): void => setVariables((s) => s.map((x, j) => (j === i ? { ...x, [k]: v } : x)));

  return (
    <form action="/api/cms/templates" method="post">
      {edit ? <input type="hidden" name="id" value={initial!.id} /> : null}
      <input type="hidden" name="sections" value={JSON.stringify(sections.filter(Boolean))} />
      <input type="hidden" name="variables" value={JSON.stringify(variables.filter((v) => v.token))} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex min-w-0 flex-col gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Template Information</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5"><span className={label}>Template Name <span className="text-[#EF4444]">*</span></span><input name="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Service + Industry" className={field} /></label>
              <label className="flex flex-col gap-1.5"><span className={label}>Template Type</span><select name="type" defaultValue={initial?.type ?? "Landing Page"} className={`cursor-pointer ${field}`}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
              <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Description</span><textarea name="description" defaultValue={initial?.description ?? ""} rows={2} placeholder="Landing page for showcasing a service within a specific industry." className={field} /></label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
            <div className="flex items-center justify-between"><h2 className="text-[0.95rem] font-700 text-slate-900">Template Structure</h2><button type="button" onClick={() => setSections((s) => [...s, "New Section"])} className="inline-flex items-center gap-1 rounded-lg border border-[#543CDA]/30 px-2.5 py-1.5 text-[0.78rem] font-600 text-[#543CDA] hover:bg-[#EEEBFC]"><Plus size={13} /> Add Section</button></div>
            <div className="mt-3 flex flex-col gap-2">
              {sections.map((s, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                  <GripVertical size={15} className="shrink-0 text-slate-300" />
                  <input value={s} onChange={(e) => setSection(i, e.target.value)} className="min-w-0 flex-1 border-none bg-transparent text-[0.84rem] font-600 text-slate-700 focus:outline-none" />
                  <button type="button" onClick={() => setSections((x) => x.filter((_, j) => j !== i))} aria-label="Remove section" className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-200 hover:text-[#DC2626]"><X size={15} /></button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
            <div className="flex items-center justify-between"><h2 className="text-[0.95rem] font-700 text-slate-900">Template Variables</h2><button type="button" onClick={() => setVariables((v) => [...v, { token: "{new}", label: "" }])} className="inline-flex items-center gap-1 rounded-lg border border-[#543CDA]/30 px-2.5 py-1.5 text-[0.78rem] font-600 text-[#543CDA] hover:bg-[#EEEBFC]"><Plus size={13} /> Add Variable</button></div>
            <div className="mt-3 flex flex-col gap-2">
              {variables.map((v, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-2">
                  <input value={v.token} onChange={(e) => setVar(i, "token", e.target.value)} placeholder="{token}" className="w-28 shrink-0 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 font-mono text-[0.78rem] text-[#543CDA] focus:border-[#543CDA] focus:outline-none" />
                  <input value={v.label} onChange={(e) => setVar(i, "label", e.target.value)} placeholder="What this variable means" className="min-w-0 flex-1 rounded-md border border-slate-200 px-2 py-1.5 text-[0.82rem] text-slate-700 focus:border-[#543CDA] focus:outline-none" />
                  <button type="button" onClick={() => setVariables((x) => x.filter((_, j) => j !== i))} aria-label="Remove variable" className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-[#DC2626]"><X size={15} /></button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Settings</h2>
            <div className="mt-3 flex flex-col gap-3">
              <Toggle name="active" title="Active" sub="Available for use." checked={active} set={setActive} />
              <Toggle name="in_proposals" title="Show in Proposals" sub="Oge can propose pages from this template." checked={inProposals} set={setInProposals} />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-subtle sm:p-5">
            <h2 className="text-[0.8rem] font-600 text-slate-500">Live Structure Preview</h2>
            <ol className="mt-3 flex flex-col gap-2">
              {sections.filter(Boolean).map((s, i) => (
                <li key={i} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[0.82rem] font-600 text-slate-700"><span className="mr-2 text-slate-500">{i + 1}.</span>{s}</li>
              ))}
            </ol>
          </section>

          <div className="flex items-center justify-end gap-2">
            <a href="/cms/templates" className="rounded-lg border border-slate-200 px-5 py-2.5 text-[0.85rem] font-600 text-slate-600 hover:bg-slate-50">Cancel</a>
            <button type="submit" className="rounded-lg bg-[#543CDA] px-6 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]">{edit ? "Save Template" : "Create Template"}</button>
          </div>
        </div>
      </div>
    </form>
  );
}

function Toggle({ name, title, sub, checked, set }: { name: string; title: string; sub: string; checked: boolean; set: (v: boolean) => void }): ReactNode {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-3">
      <span><span className="block text-[0.85rem] font-600 text-slate-800">{title}</span><span className="block text-[0.76rem] text-slate-500">{sub}</span></span>
      <input type="checkbox" name={name} checked={checked} onChange={(e) => set(e.target.checked)} className="peer sr-only" />
      <span aria-hidden="true" className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-[#543CDA]" : "bg-slate-300"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? "left-[1.4rem]" : "left-0.5"}`} /></span>
    </label>
  );
}
