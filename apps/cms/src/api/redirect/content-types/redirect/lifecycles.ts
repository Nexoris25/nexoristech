/**
 * Redirect validation (PRD Stage 7): no loops and no chains. A redirect may not point to itself,
 * its destination may not be another enabled redirect's source, and its source may not already be
 * another redirect's destination. This keeps the redirect graph one hop deep so a request never
 * bounces through a chain.
 */
// @strapi/utils is resolved at runtime as a core dependency but ships without bundled types here.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - no type declarations for @strapi/utils in this setup
import { errors } from "@strapi/utils";

interface RedirectRow {
  id: number;
  source: string;
  destination: string;
}

interface LifecycleEvent {
  params: { data: { source?: string; destination?: string }; where?: { id?: number } };
}

async function validate(event: LifecycleEvent): Promise<void> {
  const source = (event.params.data.source ?? "").trim();
  const destination = (event.params.data.destination ?? "").trim();
  if (!source || !destination) return;

  if (source === destination) {
    throw new errors.ValidationError("A redirect cannot point to itself.");
  }

  const others = (await strapi.db
    .query("api::redirect.redirect")
    .findMany({ where: { enabled: true } })) as RedirectRow[];
  const editingId = event.params.where?.id;
  const rest = others.filter((r) => r.id !== editingId);

  if (rest.some((r) => r.source === destination)) {
    throw new errors.ValidationError(
      "The destination is itself a redirect source, which would create a chain.",
    );
  }
  if (rest.some((r) => r.destination === source)) {
    throw new errors.ValidationError(
      "This source is already a redirect destination, which would create a chain.",
    );
  }
}

export default {
  async beforeCreate(event: LifecycleEvent): Promise<void> {
    await validate(event);
  },
  async beforeUpdate(event: LifecycleEvent): Promise<void> {
    await validate(event);
  },
};
