import type { Metadata } from "next";
import type { PageKey } from "@/data/pages";
import { pages } from "@/data/pages";

/**
 * Open Graph fields every page shares. Next replaces a nested metadata object
 * wholesale instead of merging it, so a page that sets its own description
 * must repeat these; keeping them here means they only change once.
 * og:title and the Twitter tags are derived by Next from each page's title
 * and Open Graph block.
 */
export const sharedOpenGraph = {
  url: "./",
  siteName: "MSAIL",
  type: "website" as const,
  images: [
    {
      url: "/og.jpg",
      width: 1200,
      height: 630,
      alt: "MSAIL: Michigan Student Artificial Intelligence Lab",
    },
  ],
};

/** A content page's metadata, from the page registry. Home uses the root layout's. */
export function pageMetadata(key: Exclude<PageKey, "home">): Metadata {
  const page = pages[key];
  return {
    title: page.title,
    description: page.description,
    openGraph: { ...sharedOpenGraph, description: page.description },
  };
}
