import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireCmsAccess } from "../../../../../lib/auth.js";
import { cmsDb } from "../../../../../lib/cms-db.js";
import { TestimonialForm } from "../TestimonialForm.js";

export const dynamic = "force-dynamic";

interface Row { id: string; title: string; customer_title: string | null; company: string | null; rating: number | null; body: string | null; featured: boolean; status: string; display_order: number; featured_image: string | null; featured_image_alt: string | null }

export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }): Promise<ReactNode> {
  await requireCmsAccess();
  const { id } = await params;
  const { rows } = await cmsDb().query<Row>(
    `SELECT id, title, customer_title, company, rating, body, featured, status, display_order,
            featured_image, featured_image_alt
       FROM cms_content WHERE id=$1 AND kind='testimonial'`, [id]);
  const r = rows[0];
  if (!r) notFound();
  return (
    <div>
      <Link href="/cms/testimonials" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-slate-500 hover:text-[#543CDA]"><ArrowLeft size={15} /> Back to Testimonials</Link>
      <h1 className="mt-3 text-[1.4rem] font-700 text-slate-900">Edit Testimonial</h1>
      <p className="mt-1 text-[0.86rem] text-slate-500">{r.title}{r.company ? ` · ${r.company}` : ""}</p>
      <div className="mt-5">
        <TestimonialForm initial={{
          id: r.id, title: r.title, customerTitle: r.customer_title ?? "", company: r.company ?? "",
          rating: r.rating ?? 5, body: r.body ?? "", featured: r.featured, status: r.status, displayOrder: r.display_order,
          featuredImage: r.featured_image ?? "", featuredImageAlt: r.featured_image_alt ?? "",
        }} />
      </div>
    </div>
  );
}
