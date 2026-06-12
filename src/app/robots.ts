import type { MetadataRoute } from "next";

// Required for metadata routes under output: "export".
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://msail.github.io/sitemap.xml",
  };
}
