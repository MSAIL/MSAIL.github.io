import { execFileSync } from "node:child_process";
import type { PageKey } from "@/data/pages";

/**
 * When each page's content last changed, from git: the newest commit that
 * touched the files that page shows. Feeds the sitemap's <lastmod>, the page
 * JSON-LD dateModified, and the agent files. Styling and layout commits are
 * deliberately left out; search engines want the last meaningful change.
 */
const SOURCES: Record<PageKey, string[]> = {
  home: ["src/app/page.tsx", "src/data/site.ts", "src/data/initiatives.ts", "src/data/talks.ts"],
  about: ["src/app/about/page.tsx", "src/data/about.ts", "public/team"],
  initiatives: ["src/app/initiatives/page.tsx", "src/data/initiatives.ts"],
  join: ["src/app/join/page.tsx", "src/data/site.ts", "src/components/connect-links.tsx"],
  talks: ["src/app/talks/page.tsx", "src/data/talks.ts"],
  resources: ["src/app/resources/page.tsx", "src/data/resources.ts"],
  alumni: ["src/app/alumni/page.tsx", "src/data/alumni.ts", "public/alumni"],
  sponsors: ["src/app/sponsors/page.tsx", "src/data/sponsors.ts"],
  constitution: ["src/app/constitution/page.tsx", "src/data/constitution.ts"],
};

function git(args: string[]): string | null {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

let fullHistory: boolean | null = null;
const cache = new Map<PageKey, string | undefined>();

/**
 * ISO 8601 date-time, or undefined when git or full history is unavailable.
 * A shallow clone would date every page to the newest commit, which is worse
 * than no date at all, so CI checks out with fetch-depth: 0.
 */
export function contentDate(key: PageKey): string | undefined {
  if (cache.has(key)) return cache.get(key);
  fullHistory ??= git(["rev-parse", "--is-shallow-repository"]) === "false";
  const date = fullHistory
    ? git(["log", "-1", "--format=%cI", "--", ...SOURCES[key]]) || undefined
    : undefined;
  cache.set(key, date);
  return date;
}
