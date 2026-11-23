#!/usr/bin/env node
// Validates everything the site publishes for crawlers and AI agents, against
// the static export in out/. CI runs it after `next build`, so a broken
// llms.txt, a dangling link or invalid structured data stops the deploy
// instead of shipping. Usage: node scripts/check-agent-files.mjs [outDir]
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const OUT = process.argv[2] ?? "out";
const SITE = "https://msail.github.io";
const problems = [];
const fail = (message) => problems.push(message);
const read = (rel) => readFileSync(join(OUT, rel), "utf8");

/** A site URL's file in out/, resolved the way GitHub Pages resolves it. */
function fileFor(url) {
  if (url !== SITE && !url.startsWith(`${SITE}/`)) return null;
  let path = decodeURI(new URL(url).pathname);
  if (path.endsWith("/")) path += "index.html";
  return path.slice(1);
}
const inBuild = (url) => {
  const file = fileFor(url);
  return file !== null && existsSync(join(OUT, file));
};

// 1. Sitemap: the list of pages everything else is checked against.
const sitemap = read("sitemap.xml");
const pageUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (pageUrls.length < 9) fail(`sitemap.xml lists ${pageUrls.length} pages, expected at least 9`);
for (const [, value] of sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) {
  if (Number.isNaN(Date.parse(value))) fail(`sitemap.xml <lastmod> is not a date: ${value}`);
}

// 2. llms.txt in the llmstxt.org layout.
const llms = read("llms.txt");
const lines = llms.split("\n");
const firstH2 = lines.findIndex((l) => l.startsWith("## "));
if (!/^# \S/.test(lines[0])) fail("llms.txt must open with an H1");
if (firstH2 < 0) fail("llms.txt has no H2 sections");
if (!lines.slice(1, firstH2).some((l) => l.startsWith("> "))) fail("llms.txt needs a blockquote summary before the first H2");
if (lines.slice(1, firstH2).some((l) => l.startsWith("#"))) fail("llms.txt has a heading between the H1 and the first H2");
const sections = lines.filter((l) => l.startsWith("## ")).map((l) => l.slice(3));
if (sections.includes("Optional") && sections.at(-1) !== "Optional") fail("llms.txt: 'Optional' must be the last section");
const linkItem = /^- \[([^\]]+)\]\(([^)\s]+)\)(?:: .+)?$/;
for (const l of lines.slice(firstH2)) {
  if (l.startsWith("- ") && !linkItem.test(l)) fail(`llms.txt list item is not "- [name](url): notes": ${l.slice(0, 90)}`);
}

// 3. Every page: its HTML head, its Markdown copy, its structured data.
const ISO_DATE = /^\d{4}(-\d{2}(-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?)?)?$/;
for (const url of pageUrls) {
  const file = fileFor(url);
  if (!file || !existsSync(join(OUT, file))) {
    fail(`${url}: ${file} is not in ${OUT}`);
    continue;
  }
  const html = read(file);
  const markdown = `${url}index.html.md`;
  if (!inBuild(markdown)) fail(`${url}: missing its Markdown copy ${markdown}`);
  else if (!read(fileFor(markdown)).includes(`Canonical page: ${url}`)) fail(`${markdown}: does not name its canonical page`);
  const canonical = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map((m) => m[1]);
  if (canonical.length !== 1 || canonical[0] !== url) fail(`${url}: canonical is ${JSON.stringify(canonical)}`);
  if (!html.includes(`<link rel="alternate" type="text/markdown" href="${markdown}"/>`)) {
    fail(`${url}: no <link rel="alternate" type="text/markdown"> pointing at ${markdown}`);
  }
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
  if (description.length < 50) fail(`${url}: meta description missing or under 50 characters`);
  if (html.match(/<meta property="og:description" content="([^"]*)"/)?.[1] !== description) {
    fail(`${url}: og:description differs from the meta description`);
  }
  if ((html.match(/<h1[\s>]/g) ?? []).length !== 1) fail(`${url}: expected exactly one <h1>`);
  if (!/<link rel="ard"[^>]*href="\/\.well-known\/ard\.json"/.test(html)) fail(`${url}: no <link rel="ard"> to the ARD manifest`);

  const graphs = [];
  for (const [, body] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      graphs.push(JSON.parse(body));
    } catch (error) {
      fail(`${url}: JSON-LD does not parse: ${error.message}`);
    }
  }
  if (graphs.length !== 2) fail(`${url}: expected the site and page JSON-LD blocks, found ${graphs.length}`);
  const defined = new Set();
  const referenced = new Set();
  const walk = (value, key) => {
    if (Array.isArray(value)) return value.forEach((v) => walk(v, key));
    if (value && typeof value === "object") {
      const keys = Object.keys(value);
      if (keys.length === 1 && keys[0] === "@id") referenced.add(value["@id"]);
      else if (value["@id"]) defined.add(value["@id"]);
      for (const [k, v] of Object.entries(value)) walk(v, k);
    } else if (typeof value === "string" && /Date$|^date/.test(key ?? "") && !ISO_DATE.test(value)) {
      fail(`${url}: JSON-LD ${key} is not an ISO 8601 date: ${value}`);
    }
  };
  graphs.forEach((g) => walk(g));
  for (const id of referenced) if (!defined.has(id)) fail(`${url}: JSON-LD points at ${id}, which nothing on the page defines`);
}

// 4. Every agent file: no rendering artifacts, and every link into the site resolves.
const agentFiles = [
  "llms.txt",
  "llms-full.txt",
  "msail.json",
  ".well-known/ard.json",
  "agent-skills/msail/SKILL.md",
  ...pageUrls.map((u) => fileFor(`${u}index.html.md`)),
];
for (const file of agentFiles) {
  if (!existsSync(join(OUT, file))) {
    fail(`missing ${file}`);
    continue;
  }
  const text = read(file);
  if (/\bundefined\b|\[object Object\]|\bNaN\b/.test(text)) fail(`${file}: contains "undefined", "NaN" or "[object Object]"`);
  for (const [match] of text.matchAll(/https:\/\/msail\.github\.io[^\s)"\]>,]*/g)) {
    const link = match.replace(/[.;:]+$/, "");
    if (!inBuild(link)) fail(`${file}: links to ${link}, which is not in the build`);
  }
}

// 5. msail.json: the contract tools and agents depend on.
const data = JSON.parse(read("msail.json"));
if (data.version !== 1) fail(`msail.json version is ${data.version}: change it on purpose, then update this check`);
const jsonPages = data.pages.map((p) => p.url).sort();
if (JSON.stringify(jsonPages) !== JSON.stringify([...pageUrls].sort())) fail("msail.json pages do not match sitemap.xml");
const slack = data.join.channels.find((c) => c.key === "slack")?.url;
if (!slack || !llms.includes(slack)) fail("the Slack invite is missing from msail.json or llms.txt, or they disagree");
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
for (const item of data.initiatives.items) {
  if (!item.meets) continue;
  const s = item.schedule;
  if (!s) {
    fail(`msail.json: "${item.name}" meets "${item.meets}", which no longer parses into a schedule; extend parseWhen()`);
    continue;
  }
  const clock = /^([01]\d|2[0-3]):[0-5]\d$/;
  if (!DAYS.includes(s.day) || !clock.test(s.start) || !clock.test(s.end) || s.start >= s.end) {
    fail(`msail.json: impossible schedule for "${item.name}": ${JSON.stringify(s)}`);
  }
  if (!item.meets.toLowerCase().startsWith(s.day.toLowerCase())) fail(`msail.json: "${item.name}" schedule says ${s.day} but meets "${item.meets}"`);
}

// 6. robots.txt, the 404 page, the IndexNow key.
const robots = read("robots.txt");
if (!/^Sitemap: https:\/\/msail\.github\.io\/sitemap\.xml$/m.test(robots)) fail("robots.txt does not declare the sitemap");
if (!robots.includes(`${SITE}/llms.txt`)) fail("robots.txt does not point agents at llms.txt");
if (/^Disallow:\s*\/\s*$/m.test(robots)) fail("robots.txt disallows the whole site");
const notFound = read("404.html");
if (!/<meta name="robots" content="noindex/.test(notFound)) fail("404.html can be indexed");
if (/<link rel="canonical"/.test(notFound)) fail("404.html declares a canonical URL");
for (const keyFile of readdirSync(OUT).filter((f) => /^[0-9a-f]{32}\.txt$/.test(f))) {
  if (read(keyFile).trim() !== keyFile.slice(0, -4)) fail(`IndexNow key file ${keyFile} does not contain its own key`);
}

// 7. The ARD manifest (rules from ARD v0.91 and Lighthouse's ard-schema audit) and the skill it lists.
const ard = JSON.parse(read(".well-known/ard.json"));
if (!Array.isArray(ard.entries) || ard.entries.length === 0) fail("ard.json needs a non-empty entries array");
for (const entry of ard.entries ?? []) {
  const label = `ard.json entry ${entry.displayName ?? entry.identifier ?? "?"}`;
  if (!/^urn:air:msail\.github\.io(:[a-zA-Z0-9._-]+)+$/.test(entry.identifier ?? "")) fail(`${label}: identifier must be urn:air:msail.github.io:<namespace>:<name>`);
  if (!entry.displayName || !entry.type) fail(`${label}: displayName and type are required`);
  if (("url" in entry) === ("data" in entry)) fail(`${label}: needs exactly one of url and data`);
  if (entry.url && !inBuild(entry.url)) fail(`${label}: ${entry.url} is not in the build`);
  const queries = entry.representativeQueries;
  if (!Array.isArray(queries) || queries.length < 2 || queries.length > 5) fail(`${label}: needs 2 to 5 representativeQueries`);
  if (entry.updatedAt && Number.isNaN(Date.parse(entry.updatedAt))) fail(`${label}: updatedAt is not a date-time`);
}
if (/^Agentmap:/m.test(robots)) fail("robots.txt has an Agentmap line, which Lighthouse's robots.txt validator rejects");
const skill = read("agent-skills/msail/SKILL.md");
const frontMatter = skill.match(/^---\nname: ([a-z0-9-]+)\ndescription: (".*")\n---\n/);
if (!frontMatter || frontMatter[1] !== "msail") fail('SKILL.md must open with front matter "name: msail" (its folder name) and a quoted description');
else if (JSON.parse(frontMatter[2]).length > 1024) fail("SKILL.md description is over 1024 characters");

if (problems.length) {
  console.error(`check-agent-files: ${problems.length} problem(s)\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  process.exit(1);
}
console.log(`check-agent-files: ok (${pageUrls.length} pages, ${agentFiles.length} agent files)`);
