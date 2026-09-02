import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireCmsAccess } from "../../../../../../lib/auth.js";
import { cmsDb } from "../../../../../../lib/cms-db.js";
import { AuthorForm } from "../../AuthorForm.js";
import { requireUuid } from "../../../../../../lib/route-params.js";

export const dynamic = "force-dynamic";

interface Row { id: string; name: string; email: string | null; role: string; job_title: string | null; department: string | null; location: string | null; years_experience: number | null; expertise: string[]; bio: string | null; headshot_url: string | null; headshot_alt: string | null; show_on_website: boolean; featured: boolean; active: boolean; profile_html: string | null; meta_title: string | null; meta_description: string | null; linkedin_url: string | null; x_url: string | null; faqs: { question: string; answer: string }[] | null }

export default async function EditAuthorPage({ params }: { params: Promise<{ id: string }> }): Promise<ReactNode> {
  await requireCmsAccess();
  const { id } = await params;
  requireUuid(id);
  const { rows } = await cmsDb().query<Row>(
    `SELECT id, name, email, role, job_title, department, location, years_experience, expertise, bio,
            headshot_url, headshot_alt, show_on_website, featured, active,
            profile_html, meta_title, meta_description, linkedin_url, x_url, faqs
       FROM cms_author WHERE id=$1`, [id]);
  const a = rows[0];
  if (!a) notFound();

  return (
    <div>
      <Link href={`/cms/authors/${a.id}`} className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-slate-500 hover:text-[#543CDA]"><ArrowLeft size={15} /> Back to Profile</Link>
      <h1 className="mt-3 text-[1.4rem] font-700 text-slate-900">Edit Author</h1>
      <p className="mt-1 text-[0.86rem] text-slate-500">Update {a.name}&apos;s profile and public visibility.</p>
      <div className="mt-5">
        <AuthorForm initial={{
          id: a.id, name: a.name, email: a.email ?? "", role: a.role, jobTitle: a.job_title ?? "",
          department: a.department ?? "", location: a.location ?? "", yearsExperience: a.years_experience ?? 0,
          expertise: a.expertise.join(", "), bio: a.bio ?? "", headshotUrl: a.headshot_url ?? "", headshotAlt: a.headshot_alt ?? "",
          showOnWebsite: a.show_on_website, featured: a.featured, active: a.active,
          profileHtml: a.profile_html ?? "", metaTitle: a.meta_title ?? "", metaDescription: a.meta_description ?? "",
          linkedinUrl: a.linkedin_url ?? "", xUrl: a.x_url ?? "",
          faqs: Array.isArray(a.faqs) ? a.faqs : [],
        }} />
      </div>
    </div>
  );
}
