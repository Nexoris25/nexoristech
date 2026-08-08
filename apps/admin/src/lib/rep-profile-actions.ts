"use server";
/**
 * The Sales Rep Profile configuration (PRD 5.6, 5.7). A CRM Admin sets the industries a rep owns,
 * their capacity cap, their territory, and their weekly and monthly targets. The profile holds only
 * configuration: the name, email, and department are read live from HR (here, the staff record) and
 * never copied. Saving writes an audit row. People are created and granted access in People &
 * Access, never here.
 */
import { revalidatePath } from "next/cache";
import { INDUSTRIES } from "@nexoris/recommend";
import { db } from "./db.js";
import { requireAdmin } from "./auth.js";
import { TARGET_METRICS, type ProfileState } from "./crm-constants.js";

const INDUSTRY_SLUGS = new Set<string>(INDUSTRIES.map((i) => i.slug));

export async function updateRepProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const admin = await requireAdmin();
  const staffId = String(formData.get("staffId") ?? "");
  if (!staffId) return { error: "Missing rep." };

  const industries = formData
    .getAll("industry")
    .map((v) => String(v))
    .filter((slug) => INDUSTRY_SLUGS.has(slug));

  const capacityRaw = String(formData.get("capacityCap") ?? "").trim();
  let capacityCap: number | null = null;
  if (capacityRaw) {
    const parsed = Number.parseInt(capacityRaw, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { error: "Capacity must be a whole number, or left blank." };
    }
    capacityCap = parsed;
  }

  const territory = String(formData.get("territory") ?? "").trim() || null;

  const pool = db();
  const { rows } = await pool.query<{
    id: string;
    role: string;
    industries: string[];
    capacity_cap: number | null;
    territory: string | null;
  }>("SELECT id, role, industries, capacity_cap, territory FROM staff WHERE id = $1", [staffId]);
  const rep = rows[0];
  if (!rep) return { error: "That person no longer exists." };
  if (rep.role !== "salesperson") {
    return { error: "Only a salesperson has a Sales Rep Profile." };
  }

  await pool.query(
    "UPDATE staff SET industries = $1, capacity_cap = $2, territory = $3 WHERE id = $4",
    [industries, capacityCap, territory, staffId],
  );

  // Upsert each target from the form. A blank or invalid field is stored as 0 (no target set).
  for (const metric of TARGET_METRICS) {
    const raw = String(formData.get(`target_${metric.key}`) ?? "").trim();
    const parsed = raw ? Number.parseInt(raw, 10) : 0;
    const target = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    await pool.query(
      `INSERT INTO sales_target (staff_id, period, metric, target, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (staff_id, period, metric)
       DO UPDATE SET target = EXCLUDED.target, updated_by = EXCLUDED.updated_by, updated_at = now()`,
      [staffId, metric.period, metric.key, target, admin.id],
    );
  }

  await pool.query(
    `INSERT INTO audit_log (actor_id, action, entity, entity_id, before, after)
     VALUES ($1, 'profile-update', 'staff', $2, $3::jsonb, $4::jsonb)`,
    [
      admin.id,
      staffId,
      JSON.stringify({
        industries: rep.industries,
        capacityCap: rep.capacity_cap,
        territory: rep.territory,
      }),
      JSON.stringify({ industries, capacityCap, territory }),
    ],
  );

  revalidatePath(`/crm/reps/${staffId}`);
  revalidatePath("/crm/reps");
  revalidatePath("/crm/performance");
  return { ok: true };
}
