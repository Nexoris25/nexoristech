/**
 * Author controller (PRD Stage 8). The core controller exposes the standard read endpoints; the
 * public read permission is granted to the Public role so apps/web can fetch authors.
 */
import { factories } from "@strapi/strapi";

export default factories.createCoreController("api::author.author");
