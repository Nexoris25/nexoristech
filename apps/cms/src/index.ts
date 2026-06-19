import type { Core } from "@strapi/strapi";
import { grantPublicReadPermissions } from "./bootstrap/public-permissions";

export default {
  /**
   * Runs before the application is initialized.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * Runs before the application starts. Ensures the Public role can read published content so the
   * website's content API calls succeed without a manual admin step.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await grantPublicReadPermissions(strapi);
  },
};
