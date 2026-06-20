import type { Core } from "@strapi/strapi";
import { grantPublicReadPermissions } from "./bootstrap/public-permissions";
import { registerWebhooks } from "./webhooks/notify";
import { registerPublishGuard } from "./pseo/publish-guard";
import { registerReservedSlugGuard } from "./guards/reserved-slugs";

export default {
  /**
   * Runs before the application is initialized. Registers the publish webhooks (revalidate the
   * website and re-ingest into Oge), the programmatic-page quality gate, and the reserved-slug
   * guard that protects every routable path.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    registerWebhooks(strapi);
    registerPublishGuard(strapi);
    registerReservedSlugGuard(strapi);
  },

  /**
   * Runs before the application starts. Ensures the Public role can read published content so the
   * website's content API calls succeed without a manual admin step.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPublicReadPermissions(strapi);
  },
};
