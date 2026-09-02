"use client";
/**
 * Create / edit author form (CMS design). Left column: Personal Information, Professional Information,
 * the short bio with its Oge draft button, and then the author page itself in the rich text editor.
 * Right column: a live profile preview, the headshot, the Oge assistant for the page, and settings.
 * Submits as a native POST to /api/cms/authors.
 *
 * The short bio and the page are two different things and both are needed. The bio is the paragraph that
 * appears under every article the author wrote; it has to stay short. The page is where the author's
 * background, work and credentials are actually set out — the page a reader or a search engine looks at
 * to decide whether the byline means anything. It gets the same editor and the same SEO panel as any
 * other page on the site, because it is judged as one.
 */
import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Sparkles, Star, Loader2 } from "lucide-react";
import { ImageUpload } from "../../../../components/cms/ImageUpload.js";
import { RichTextEditor, type RichTextApi } from "../../../../components/cms/RichTextEditor.js";
import { OgeAssistant } from "../../../../components/cms/OgeAssistant.js";
import { metaChecks, metaFindings, metaScore } from "../../../../lib/meta-quality.js";

interface Initial {
  id?: string; name?: string; email?: string; role?: string; jobTitle?: string; department?: string;
  location?: string; yearsExperience?: number; expertise?: string; bio?: string; headshotUrl?: string; headshotAlt?: string;
  showOnWebsite?: boolean; featured?: boolean; active?: boolean;
  faqs?: { question: string; answer: string }[];
  profileHtml?: string; metaTitle?: string; metaDescription?: string; linkedinUrl?: string; xUrl?: string;
}
const field = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[0.86rem] text-slate-900 placeholder:text-slate-400 focus:border-[#543CDA] focus:outline-none focus:ring-2 focus:ring-[#543CDA]/15 resize-none";
const label = "text-[0.8rem] font-600 text-slate-700";

/** The website has no stored author slug; it derives one from the display name. Mirror it exactly. */
const nameSlug = (n: string): string => n.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function composeBio(name: string, role: string, expertise: string, years: string): string {
  const first = name.trim().split(/\s+/)[0] || "This author";
  const skills = expertise.split(",").map((s) => s.trim()).filter(Boolean);
  const skillPart = skills.length >= 2 ? `${skills.slice(0, -1).join(", ")} and ${skills[skills.length - 1]}` : skills[0] ?? "technology";
  const y = Number(years);
  const exp = y > 0 ? ` With ${y} year${y === 1 ? "" : "s"} of hands-on work, ` : " ";
  return `${first} is ${role ? `a ${role.toLowerCase()}` : "a contributor"} at Nexoris Technologies, writing about ${skillPart}.${exp}${first} turns hard ideas into clear, useful reading for the people who need them. The goal is simple: help you understand what matters and act on it with confidence.`;
}

export function AuthorForm({ initial }: { initial?: Initial }): ReactNode {
  const edit = Boolean(initial?.id);
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState(initial?.role ?? "Author");
  const [jobTitle, setJobTitle] = useState(initial?.jobTitle ?? "");
  const [expertise, setExpertise] = useState(initial?.expertise ?? "");
  const [years, setYears] = useState(String(initial?.yearsExperience ?? ""));
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [headshot, setHeadshot] = useState(initial?.headshotUrl ?? "");
  const [showOnWebsite, setShow] = useState(initial?.showOnWebsite ?? true);
  const [featured, setFeatured] = useState(initial?.featured ?? false);
  const [active, setActive] = useState(initial?.active ?? true);
  // Generated FAQs were shown and then dropped: nothing passed storeFaqs, so they never reached
  // the form and never reached the database. They ride along in a hidden field now, saved by the
  // same submit as everything else rather than needing their own action.
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>(initial?.faqs ?? []);
  const [bioBusy, setBioBusy] = useState(false);
  const [profile, setProfile] = useState(initial?.profileHtml ?? "");
  const [metaTitle, setMetaTitle] = useState(initial?.metaTitle ?? "");
  const [metaDesc, setMetaDesc] = useState(initial?.metaDescription ?? "");
  const rte = useRef<RichTextApi | null>(null);

  const draftBio = async (): Promise<void> => {
    setBioBusy(true);
    try {
      const res = await fetch("/api/cms/oge/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "author-bio", authorName: name, authorRole: jobTitle || role, expertise: expertise.split(",").map((s) => s.trim()).filter(Boolean) }),
      });
      if (res.ok) { const j = (await res.json()) as { result: string }; if (j.result) { setBio(j.result); return; } }
      setBio(composeBio(name, role, expertise, years));
    } catch { setBio(composeBio(name, role, expertise, years)); }
    finally { setBioBusy(false); }
  };

  // The same shape of check the insight editor scores against, asked of an author page: is it long
  // enough to be a page, is it structured, does it say who this is, and is it set up for search.
  const profileText = profile.replace(/<[^>]+>/g, " ");
  const profileWords = profileText.split(/\s+/).filter(Boolean).length;
  const checks = [
    Boolean(name.trim()),
    Boolean(bio.trim()),
    Boolean(headshot),
    ...metaChecks({ title: name, metaTitle, metaDesc }),
    profileWords >= 300,
    /<h[23]/i.test(profile),
    profileText.toLowerCase().includes(name.trim().toLowerCase()) && Boolean(name.trim()),
  ];
  const findings = metaFindings({ title: name, metaTitle, metaDesc });
  const seoScore = metaScore(checks);

  const initials = useMemo(() => name.trim().split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "NA", [name]);
  const chips = expertise.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <form action="/api/cms/authors" method="post">
      {edit ? <input type="hidden" name="id" value={initial!.id} /> : null}
      {/* The meta fields live in the Oge panel's SEO tab and submit from here, so there is one field
          per value rather than two that can disagree. */}
      <input type="hidden" name="meta_title" value={metaTitle} />
      <input type="hidden" name="meta_description" value={metaDesc} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Personal Information</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5"><span className={label}>Full Name <span className="text-[#EF4444]">*</span></span><input name="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Ada Obi" className={field} /></label>
              <label className="flex flex-col gap-1.5"><span className={label}>Email Address</span><input name="email" type="email" defaultValue={initial?.email ?? ""} placeholder="name@nexoris.tech" className={field} /></label>
              <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Location</span><input name="location" defaultValue={initial?.location ?? ""} placeholder="e.g. Lagos, Nigeria" className={field} /></label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Professional Information</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5"><span className={label}>Role <span className="text-[#EF4444]">*</span></span>
                <select name="role" value={role} onChange={(e) => setRole(e.target.value)} className={`cursor-pointer ${field}`}><option>Author</option><option>Senior Author</option><option>Editor</option><option>Fact-Checker</option><option>Contributor</option><option>Guest Writer</option></select>
              </label>
              <label className="flex flex-col gap-1.5"><span className={label}>Job Title</span><input name="job_title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Head of Content" className={field} /></label>
              <label className="flex flex-col gap-1.5"><span className={label}>Department</span><input name="department" defaultValue={initial?.department ?? ""} placeholder="e.g. Marketing" className={field} /></label>
              <label className="flex flex-col gap-1.5"><span className={label}>Years of Experience</span><input name="years_experience" type="number" min={0} max={60} value={years} onChange={(e) => setYears(e.target.value)} placeholder="e.g. 6" className={field} /></label>
              <label className="flex flex-col gap-1.5 sm:col-span-2"><span className={label}>Areas of Expertise</span><input name="expertise" value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="Comma separated, e.g. AI, Fintech, Product" className={field} /><span className="text-[0.74rem] text-slate-500">Separate each area with a comma. These show as chips on the profile.</span></label>
              <label className="flex flex-col gap-1.5"><span className={label}>LinkedIn <span className="font-400 text-slate-400">(optional)</span></span><input name="linkedin_url" type="url" defaultValue={initial?.linkedinUrl ?? ""} placeholder="https://www.linkedin.com/in/username" className={field} /></label>
              <label className="flex flex-col gap-1.5"><span className={label}>X <span className="font-400 text-slate-400">(optional)</span></span><input name="x_url" type="url" defaultValue={initial?.xUrl ?? ""} placeholder="https://x.com/username" className={field} /></label>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="flex items-center justify-between"><span className={label}>Bio</span>
                  <button type="button" disabled={bioBusy} onClick={() => void draftBio()} className="inline-flex items-center gap-1.5 rounded-md bg-[#EEEBFC] px-2.5 py-1 text-[0.74rem] font-600 text-[#543CDA] hover:bg-[#e3ddfb] disabled:opacity-60">{bioBusy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Draft with Oge</button>
                </span>
                <textarea name="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={5} placeholder="A short, warm introduction to this author..." className={field} />
                <span className="text-[0.74rem] text-slate-500">Oge drafts a starting point from the details above. Edit it to sound like the author. This is the paragraph that appears under each of their articles.</span>
              </div>
            </div>
          </section>

          {/* The author page itself. The short bio above is a byline; this is the page. */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[0.95rem] font-700 text-slate-900">Author Page</h2>
              <span className="text-[0.74rem] text-slate-500">Published at /authors/{nameSlug(name) || "name"}</span>
            </div>
            <p className="mt-1 text-[0.78rem] leading-relaxed text-slate-600">
              Write the full profile here: background, the work they have done, the qualifications behind
              it, and anything a reader would want before trusting an article with their name on it. Use
              the assistant on the right to optimise it, then save.
            </p>
            <div className="mt-3">
              <RichTextEditor name="profile_html" initialHtml={initial?.profileHtml ?? ""}
                onChange={setProfile} registerApi={(api) => { rte.current = api; }} />
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.8rem] font-600 text-slate-500">Profile Preview</h2>
            <div className="mt-4 flex flex-col items-center text-center">
              {headshot ? <img src={headshot} alt="" className="h-20 w-20 rounded-full object-cover" /> : <span className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-[#543CDA] to-[#6A55F2] font-mono text-[1.1rem] font-700 text-white">{initials}</span>}
              <p className="mt-3 text-[1.05rem] font-700 text-slate-900">{name || "Author Name"}</p>
              <p className="text-[0.82rem] text-slate-500">{jobTitle || role}</p>
              {chips.length ? <div className="mt-3 flex flex-wrap justify-center gap-1.5">{chips.slice(0, 4).map((c) => <span key={c} className="rounded-md bg-slate-100 px-2 py-0.5 text-[0.72rem] font-500 text-slate-600">{c}</span>)}</div> : null}
              {bio ? <p className="mt-3 max-w-[18rem] text-[0.78rem] leading-relaxed text-slate-500">{bio}</p> : null}
              <div className="mt-4 flex items-center gap-2">
                {featured ? <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[0.72rem] font-600 text-[#B45309]"><Star size={12} /> Featured</span> : null}
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[0.72rem] font-600 ${active ? "bg-[#DCFCE7] text-[#15803D]" : "bg-slate-100 text-slate-600"}`}>{active ? "Active" : "Inactive"}</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="mb-3 text-[0.95rem] font-700 text-slate-900">Author Headshot</h2>
            <ImageUpload name="headshot_url" altName="headshot_alt" label="" folder="Team" aspect="aspect-square"
              initialUrl={initial?.headshotUrl ?? ""} initialAlt={initial?.headshotAlt ?? ""} onChange={(u) => setHeadshot(u)} />
          </section>

          {/* The same assistant the rest of the CMS uses, working on the author page. The Author Bio tab
              writes the short bio above; SEO writes the meta fields; FAQs append to the page. */}
          <OgeAssistant
            tabs={["seo", "author-bio", "faqs", "more"]}
            getContext={() => ({
              title: name, body: profile, authorName: name, authorRole: jobTitle || role,
              expertise: expertise.split(",").map((x) => x.trim()).filter(Boolean),
            })}
            seo={{ score: seoScore, findings, metaTitle, setMetaTitle, metaDesc, setMetaDesc}}
            bios={{
              authorName: name, authorBio: bio, factCheckerBio: "",
              setAuthorBio: setBio, setFactCheckerBio: () => undefined,
            }}
            apply={{
              seo: (r) => { setMetaTitle(r.metaTitle); setMetaDesc(r.metaDescription); },
              insertBottom: (html: string) => rte.current?.appendHtml(html),
              getBody: () => profile,
              storeFaqs: (items) => setFaqs(items),
            }}
          />

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-subtle">
            <h2 className="text-[0.95rem] font-700 text-slate-900">Settings</h2>
            <div className="mt-3 flex flex-col gap-3">
              <Toggle name="show_on_website" checked={showOnWebsite} set={setShow} title="Show on website" sub="List this author publicly with their articles." />
              <Toggle name="featured" checked={featured} set={setFeatured} title="Featured author" sub="Highlight this author across the site." />
              <Toggle name="active" checked={active} set={setActive} title="Active" sub="Inactive authors are hidden and cannot be assigned." />
            </div>
          </section>

          {/* An author has no draft state either; "active" is what decides whether they can be
              assigned and shown. Unpublishing hides the profile without deleting a person who has
              bylines on published articles. */}
          <input type="hidden" name="faqs" value={JSON.stringify(faqs)} />

          {/* Publishing an author is one button rather than a pair of toggles somebody has to know
              the meaning of. It is deliberately not the same thing as "active": an unpublished
              author keeps their byline on articles they wrote and can still be assigned, they just
              have no public page of their own. Unpublishing a person is not retiring them. */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <a href="/cms/authors" className="rounded-lg border border-slate-200 px-5 py-2.5 text-[0.85rem] font-600 text-slate-600 hover:bg-slate-50">Cancel</a>
            {edit && initial?.showOnWebsite ? (
              <button type="submit" name="intent" value="unpublish"
                className="rounded-lg border border-[#DC2626]/30 px-5 py-2.5 text-[0.85rem] font-600 text-[#DC2626] hover:bg-red-50">
                Unpublish
              </button>
            ) : null}
            <button type="submit" name="intent" value="save" className="rounded-lg border border-slate-200 px-5 py-2.5 text-[0.85rem] font-600 text-slate-700 hover:bg-slate-50">
              {edit ? "Save Changes" : "Save"}
            </button>
            <button type="submit" name="intent" value="publish" className="rounded-lg bg-[#543CDA] px-6 py-2.5 text-[0.85rem] font-600 text-white hover:bg-[#4330B8]">
              {edit && initial?.showOnWebsite ? "Update Published Page" : "Publish"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function Toggle({ name, checked, set, title, sub }: { name: string; checked: boolean; set: (v: boolean) => void; title: string; sub: string }): ReactNode {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span><span className="block text-[0.85rem] font-600 text-slate-800">{title}</span><span className="block text-[0.76rem] text-slate-500">{sub}</span></span>
      <input type="checkbox" name={name} checked={checked} onChange={(e) => set(e.target.checked)} className="peer sr-only" />
      <span aria-hidden="true" className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-[#543CDA]" : "bg-slate-300"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${checked ? "left-[1.4rem]" : "left-0.5"}`} /></span>
    </label>
  );
}
