import { describe, expect, it } from "vitest";
import { prune, buildGraph } from "./jsonld.js";
import { professionalServiceNode, siteNodes } from "./site.js";
import { breadcrumbNode } from "./page.js";
import { faqPageNode } from "./service.js";
import { articleNode } from "./content.js";
import { buildPageGraph } from "./graph.js";
import type { JsonLdNode } from "./jsonld.js";

/** Find the first node of a given @type in a graph. */
function findType(graph: JsonLdNode, type: string): JsonLdNode | undefined {
  const nodes = (graph["@graph"] as JsonLdNode[]) ?? [];
  return nodes.find((n) => n["@type"] === type);
}

describe("prune", () => {
  it("removes undefined, null, and empty arrays", () => {
    expect(prune({ a: 1, b: undefined, c: null, d: [], e: "x" })).toEqual({
      a: 1,
      e: "x",
    });
  });

  it("removes objects that become empty", () => {
    expect(prune({ a: { b: undefined }, c: 2 })).toEqual({ c: 2 });
  });

  it("keeps nested real values", () => {
    expect(prune({ a: { b: 1, c: undefined } })).toEqual({ a: { b: 1 } });
  });
});

describe("buildGraph", () => {
  it("wraps nodes with the schema.org context and a graph array", () => {
    const graph = buildGraph([{ "@type": "WebPage", name: "x" }]);
    expect(graph["@context"]).toBe("https://schema.org");
    expect(Array.isArray(graph["@graph"])).toBe(true);
  });
});

describe("site nodes", () => {
  it("emits the four site-wide nodes", () => {
    const types = siteNodes().map((n) => n["@type"]);
    expect(types).toEqual([
      "Organization",
      "ProfessionalService",
      "WebSite",
      "Person",
    ]);
  });

  it("does not fabricate a geo on ProfessionalService", () => {
    const node = prune(professionalServiceNode());
    expect(node["geo"]).toBeUndefined();
    expect(node["currenciesAccepted"]).toBe("NGN");
    expect((node["address"] as JsonLdNode)["addressCountry"]).toBe("NG");
  });
});

describe("breadcrumbNode", () => {
  it("places Home at position 1 and content after", () => {
    const node = breadcrumbNode([{ name: "About", path: "/about" }]);
    const items = node["itemListElement"] as JsonLdNode[];
    expect(items[0]?.["name"]).toBe("Home");
    expect(items[0]?.["item"]).toBe("https://nexoristech.com");
    expect(items[1]?.["name"]).toBe("About");
    expect(items[1]?.["item"]).toBe("https://nexoristech.com/about/");
  });
});

describe("faqPageNode", () => {
  it("returns undefined for an empty FAQ", () => {
    expect(faqPageNode([])).toBeUndefined();
  });

  it("builds questions for a populated FAQ", () => {
    const node = faqPageNode([
      { question: "How much?", answer: "Every project gets a scope." },
    ]);
    expect(node?.["@type"]).toBe("FAQPage");
  });
});

describe("articleNode", () => {
  it("includes the author and omits an absent reviewer", () => {
    const node = prune(
      articleNode({
        path: "/insights/reduce-no-shows",
        headline: "Reduce clinic no-shows",
        description: "A practical guide.",
        author: {
          name: "Ada",
          slug: "ada",
          linkedinUrl: "https://linkedin.com/in/ada",
        },
      }),
    );
    expect((node["author"] as JsonLdNode)["name"]).toBe("Ada");
    expect(node["reviewer"]).toBeUndefined();
    expect(node["inLanguage"]).toBe("en-NG");
  });

  it("includes the reviewer when a fact-checker is given", () => {
    const node = prune(
      articleNode({
        path: "/insights/x",
        headline: "X",
        description: "Y",
        author: { name: "Ada" },
        reviewer: { name: "Bode", slug: "bode" },
      }),
    );
    expect((node["reviewer"] as JsonLdNode)["name"]).toBe("Bode");
  });
});

describe("buildPageGraph", () => {
  it("builds a service page graph with Service and FAQPage", () => {
    const graph = buildPageGraph({
      page: {
        routeClass: "service",
        path: "/ai-product-development",
        name: "AI Product Development",
        description: "Websites, apps, and custom software.",
        breadcrumbs: [
          { name: "AI Product Development", path: "/ai-product-development" },
        ],
      },
      service: {
        name: "AI Product Development",
        path: "/ai-product-development",
      },
      faq: [{ question: "Q?", answer: "A." }],
    });
    expect(findType(graph, "Organization")).toBeDefined();
    expect(findType(graph, "WebSite")).toBeDefined();
    expect(findType(graph, "Service")).toBeDefined();
    expect(findType(graph, "FAQPage")).toBeDefined();
  });

  it("omits FAQPage when there is no FAQ", () => {
    const graph = buildPageGraph({
      page: {
        routeClass: "industry",
        path: "/fintech-software",
        name: "Fintech software",
        description: "Software for fintech.",
      },
      service: {
        name: "Fintech software",
        path: "/fintech-software",
        serviceType: "fintech software development",
        audience: "Fintech businesses",
      },
    });
    expect(findType(graph, "FAQPage")).toBeUndefined();
    expect(findType(graph, "Service")).toBeDefined();
  });

  it("subtypes the about page as AboutPage", () => {
    const graph = buildPageGraph({
      page: {
        routeClass: "about",
        path: "/about",
        name: "About Nexoris Technologies",
        description: "Who we are.",
      },
    });
    expect(findType(graph, "AboutPage")).toBeDefined();
  });
});
