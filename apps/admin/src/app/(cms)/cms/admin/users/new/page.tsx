import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCmsAccess } from "../../../../../../lib/auth.js";
import { UserForm } from "../UserForm.js";

export const dynamic = "force-dynamic";

export default async function NewUserPage(): Promise<ReactNode> {
  await requireCmsAccess();
  return (
    <div>
      <Link href="/cms/admin/users" className="inline-flex items-center gap-1.5 text-[0.8rem] font-600 text-slate-500 hover:text-[#543CDA]"><ArrowLeft size={15} /> Back to Users</Link>
      <h1 className="mt-3 text-[1.4rem] font-700 text-slate-900">Create User</h1>
      <p className="mt-1 text-[0.86rem] text-slate-500">Add a new user and assign their role and access.</p>
      <div className="mt-5"><UserForm /></div>
    </div>
  );
}
