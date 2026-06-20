/**
 * Grant the Public role read access to the published content the website consumes (PRD 6.2). Run
 * on every bootstrap and idempotent: it only creates a permission that is missing, so it is safe to
 * re-run and survives restarts. Write access stays with authenticated editors in the admin.
 */
import type { Core } from "@strapi/strapi";

const COLLECTION_READ = [
  "api::author.author",
  "api::category.category",
  "api::insight.insight",
  "api::testimonial.testimonial",
  "api::case-study.case-study",
  "api::job.job",
  "api::pseo-page.pseo-page",
];

const SINGLE_READ = [
  "api::privacy-policy.privacy-policy",
  "api::terms-of-service.terms-of-service",
  "api::cookie-policy.cookie-policy",
];

export async function grantPublicReadPermissions(
  strapi: Core.Strapi,
): Promise<void> {
  const publicRole = await strapi.db
    .query("plugin::users-permissions.role")
    .findOne({ where: { type: "public" } });
  if (!publicRole) return;

  const actions = [
    ...COLLECTION_READ.flatMap((uid) => [`${uid}.find`, `${uid}.findOne`]),
    ...SINGLE_READ.map((uid) => `${uid}.find`),
  ];

  for (const action of actions) {
    const existing = await strapi.db
      .query("plugin::users-permissions.permission")
      .findOne({ where: { action, role: publicRole.id } });
    if (!existing) {
      await strapi.db
        .query("plugin::users-permissions.permission")
        .create({ data: { action, role: publicRole.id } });
      strapi.log.info(`[permissions] granted public ${action}`);
    }
  }
}
