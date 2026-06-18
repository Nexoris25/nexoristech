/**
 * Embeds a JSON-LD @graph document in a script tag, escaped so the JSON cannot break out of
 * the tag. One block per page (PRD 9.2).
 */
import type { ReactNode } from "react";
import { serializeJsonLd } from "@nexoris/seo";
import type { JsonLdNode } from "@nexoris/seo";

export function JsonLd({ graph }: { graph: JsonLdNode }): ReactNode {
  return (
    <script
      type="application/ld+json"
      // The content is already escaped by serializeJsonLd.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(graph) }}
    />
  );
}
