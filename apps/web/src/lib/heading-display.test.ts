import { it, expect } from "vitest";
import { headingsOf, splitSections, withHeadingIds, decodeHtmlText } from "./render-html.js";
it("decodes heading labels without breaking existing incoming anchors", () => {
  const html = '<h2>Design &amp; delivery</h2><p>Body</p>';
  expect(headingsOf(html)).toEqual([{text:"Design & delivery",id:"design-amp-delivery"}]);
  expect(withHeadingIds(html)).toContain('id="design-amp-delivery"');
  expect(splitSections(html)[0]?.heading).toBe("Design & delivery");
});
it("decodes numeric entities for display without interpreting markup", () => {
  expect(decodeHtmlText("It&#8217;s &#x26; &lt;safe&gt;")).toBe("It’s & <safe>");
  expect(decodeHtmlText("&#99999999;")).toBe("&#99999999;");
});
