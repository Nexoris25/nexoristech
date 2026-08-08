/**
 * The CMS permission model: the roles that exist, and what each one may do.
 *
 * Three screens each described a different model, none of which the code enforced. The Permission Matrix
 * listed seven roles (Super Admin, Admin, Editor, Reviewer, Author, Contributor, Analyst) against
 * thirteen modules; the Roles list offered nine roles with permission counts of 142, 118, 71, 45, 32, 22,
 * 54, 8 and 28; the user form offered a ninth set again. The system recognises four, from
 * shell-constants MODULE_ROLES.cms, and until now granted all four identical access: `requireCmsAccess`
 * only checked that the `cms` module had been granted at all.
 *
 * So a person could be assigned "Contributor", a role no code has ever heard of, and silently receive
 * the same access as an editor. This file is the single definition all three screens read, and
 * `cmsCan` is what the gate now enforces.
 */
import { MODULE_ROLES } from "./shell-constants.js";

/** The four roles the access table actually grants. Admins are above this model and hold everything. */
export const CMS_ROLES = MODULE_ROLES.cms;
export type CmsRole = (typeof CMS_ROLES)[number];

/** What a person can be allowed to do in the CMS. */
export const CMS_CAPABILITIES = [
  "content.read",
  "content.write",
  "content.publish",
  "content.delete",
  "review.decide",
  "media.manage",
  "seo.manage",
  "ai.use",
  "admin.manage",
  "settings.manage",
] as const;
export type CmsCapability = (typeof CMS_CAPABILITIES)[number];

export const CAPABILITY_LABEL: Record<CmsCapability, string> = {
  "content.read": "View content",
  "content.write": "Create and edit content",
  "content.publish": "Publish and unpublish",
  "content.delete": "Delete content",
  "review.decide": "Approve or return in review",
  "media.manage": "Manage the media library",
  "seo.manage": "Manage SEO and programmatic pages",
  "ai.use": "Use Oge AI",
  "admin.manage": "Manage CMS users and roles",
  "settings.manage": "Change global CMS settings",
};

/**
 * The grant per role.
 *
 * A Content Writer writes but does not publish, which is the point of having an Editor. A Fact-Checker
 * decides in review and may correct copy, but does not publish or delete either. Only a CMS Admin
 * touches users, roles and settings.
 */
export const ROLE_CAPABILITIES: Record<string, readonly CmsCapability[]> = {
  "CMS Admin": CMS_CAPABILITIES,
  Editor: [
    "content.read", "content.write", "content.publish", "content.delete",
    "review.decide", "media.manage", "seo.manage", "ai.use",
  ],
  "Content Writer": ["content.read", "content.write", "media.manage", "ai.use"],
  "Fact-Checker": ["content.read", "content.write", "review.decide", "ai.use"],
};

export const ROLE_DESCRIPTION: Record<string, string> = {
  "CMS Admin": "Everything in the CMS, including users, roles and global settings.",
  Editor: "Writes, publishes and removes content, and decides in review.",
  "Content Writer": "Writes and edits, and submits for review. Cannot publish.",
  "Fact-Checker": "Checks and corrects, and decides in review. Cannot publish.",
};

/** Whether a role holds a capability. An unknown role holds nothing. */
export function roleCan(role: string | null | undefined, capability: CmsCapability): boolean {
  if (!role) return false;
  return (ROLE_CAPABILITIES[role] ?? []).includes(capability);
}

/**
 * Whether a staff member may do something in the CMS.
 *
 * Platform admins hold everything: the admin role is above the CMS model, not inside it. Anyone else
 * needs a `cms` grant whose role carries the capability. A grant with a role this file does not define
 * carries nothing, which is the safe reading of a value nothing recognises.
 */
export function cmsCan(
  staffRole: string,
  grantedCmsRole: string | null,
  capability: CmsCapability,
): boolean {
  if (staffRole === "admin") return true;
  return roleCan(grantedCmsRole, capability);
}

/** How many of the defined capabilities a role holds, for the roles list. */
export function capabilityCount(role: string): number {
  return (ROLE_CAPABILITIES[role] ?? []).length;
}
