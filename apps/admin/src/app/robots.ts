/**
 * The admin platform is private: nothing here should ever appear in a search index. The root layout
 * already sends `noindex, nofollow` on every page; this adds the belt-and-braces robots.txt so a crawler
 * that never renders the page still knows to stay out, including the sign-in and invite screens.
 */
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
