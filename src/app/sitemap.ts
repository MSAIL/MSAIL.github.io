import type { MetadataRoute } from "next";
import { pageOrder, pages } from "@/data/pages";
import { site } from "@/data/site";
import { contentDate } from "@/lib/content-dates";

// Required for metadata routes under output: "export".
export const dynamic = "force-static";

/**
 * Every public page, with the trailing slashes GitHub Pages serves. lastmod
 * is the last commit that changed what the page shows (src/lib/content-dates),
 * and is left out rather than guessed when git history is unavailable.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return pageOrder.map((key) => {
    const lastModified = contentDate(key);
    return { url: `${site.url}${pages[key].path}`, ...(lastModified ? { lastModified } : {}) };
  });
}
