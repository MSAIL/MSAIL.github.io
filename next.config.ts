import type { NextConfig } from "next";

/**
 * MSAIL site — static export for GitHub Pages at the root domain
 * (https://msail.github.io). Because it serves from the domain root,
 * there is intentionally NO basePath / assetPrefix.
 *
 * - output: "export"        → emit a fully static site into ./out on `next build`
 * - images.unoptimized      → required; the Next image optimizer can't run on a static host
 * - trailingSlash: true     → emit /about/index.html so paths resolve as directories on Pages
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
