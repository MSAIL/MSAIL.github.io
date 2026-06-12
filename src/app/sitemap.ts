import type { MetadataRoute } from "next";

// Required for metadata routes under output: "export".
export const dynamic = "force-static";

const BASE = "https://msail.github.io";

/** Every public route, with the trailing slashes GitHub Pages serves. */
const routes = [
  "/",
  "/about/",
  "/initiatives/",
  "/talks/",
  "/resources/",
  "/alumni/",
  "/sponsors/",
  "/join/",
  "/contact/",
  "/constitution/",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((path) => ({ url: `${BASE}${path}` }));
}
