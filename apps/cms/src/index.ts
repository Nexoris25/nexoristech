import type { Core } from "@strapi/strapi";
import { grantPublicReadPermissions } from "./bootstrap/public-permissions";
import { registerWebhooks } from "./webhooks/notify";

export default {
  /**
   * Runs before the application is initialized. Registers the publish webhooks that revalidate the
   * website and re-ingest content into the Oge knowledge base.
   */
  register({ strapi }: { strapi: Core.Strapi }) {
    registerWebhooks(strapi);
  },

  /**
   * Runs before the application starts. Ensures the Public role can read published content so the
   * website's content API calls succeed without a manual admin step.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPublicReadPermissions(strapi);
  },
};
