import { describe, it, expect } from "vitest";
import { buildPageGraph } from "./graph.js";
import { articleNode, jobPostingNode } from "./content.js";
import { organizationNode } from "./site.js";
describe("complete editorial entity graphs", () => {
  it("merges a profile into its WebPage entity with breadcrumbs and person", () => {
    const graph = buildPageGraph({ page: {routeClass:"author",path:"/sample-author",name:"Sample Author",description:"A writer",breadcrumbs:[{name:"Sample Author",path:"/sample-author"}]}, profile:{slug:"sample-author",name:"Sample Author"} });
    const nodes = graph["@graph"] as Record<string,unknown>[];
    const profiles = nodes.filter(n=>n["@type"] === "ProfilePage");
    expect(profiles).toHaveLength(1);
    expect(profiles[0]?.breadcrumb).toBeDefined();
    expect(profiles[0]?.mainEntity).toMatchObject({"@type":"Person",name:"Sample Author"});
    const ids=nodes.map(n=>n["@id"]).filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("describes a company byline as an Organization", () => {
    expect(articleNode({path:"/insights/test",headline:"Test",description:"A test",author:{name:"Nexoris Technologies",type:"Organization"}}).author).toMatchObject({"@type":"Organization"});
  });
  it("supplies the real logo and avoids invented job locations", () => {
    expect(organizationNode().logo).toMatchObject({url:"https://nexoristech.com/brand/nexoris-logo-purple.png"});
    expect(jobPostingNode({path:"/careers/test",title:"Test",description:"Details"}).jobLocation).toBeUndefined();
  });
});
