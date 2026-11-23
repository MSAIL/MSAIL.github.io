/**
 * The site as machines read it: LLM crawlers, answer engines, and agents
 * acting for a student who asked "how do I join an AI club at Michigan?".
 *
 * Every string comes from the same src/data files the pages render, so these
 * copies cannot drift from the HTML. Only what the pages publish goes out:
 * internal `flag` notes, the outgoing roster and the unconfirmed faculty
 * mentor stay in the source.
 *
 * Outputs, all written by `next build`:
 *   /llms.txt                index in the llmstxt.org layout
 *   /<page>/index.html.md    each page as Markdown (the llms.txt convention)
 *   /llms-full.txt           every page's Markdown in one file
 *   /msail.json              the same content as versioned JSON
 *   /agent-skills/msail/SKILL.md  an Agent Skill for answering MSAIL questions
 *   /.well-known/ard.json    Agentic Resource Discovery manifest listing that skill
 *   schema.org JSON-LD       site graph in the root layout, page graphs in PageShell
 * scripts/check-agent-files.mjs validates all of it after every build.
 */
import type { Channel } from "@/data/site";
import { home, site } from "@/data/site";
import { about } from "@/data/about";
import { directionsUrl, initiatives, mlDiscussionArchive } from "@/data/initiatives";
import { talksArchive, talksMeta } from "@/data/talks";
import { alumni, alumniMeta } from "@/data/alumni";
import { agingSections, learningConcepts, resourcesMeta } from "@/data/resources";
import {
  constitutionArticles,
  constitutionMeta,
  constitutionTerminology,
} from "@/data/constitution";
import { sponsorsMeta } from "@/data/sponsors";
import type { PageKey } from "@/data/pages";
import { pageOrder, pages } from "@/data/pages";
import { contentDate } from "@/lib/content-dates";
import { AGENT_TOOL_NAMES } from "@/lib/agent-tool-names";

/** Bump when a field in msail.json is renamed or removed; additions keep the version. */
const JSON_VERSION = 1;
const TIMEZONE = "America/Detroit";
/** The shorter name the hero and Maize Pages use; agents should treat it as the same org. */
const ALT_NAME = "Michigan Student AI Lab";

const url = (path: string) => `${site.url}${path}`;
const SKILL_PATH = "/agent-skills/msail/SKILL.md";
const pageUrl = (key: PageKey) => url(pages[key].path);
const markdownUrl = (key: PageKey) => `${pageUrl(key)}index.html.md`;
const today = () => new Date().toISOString().slice(0, 10);
const para = (s?: string) => (s ? [s, ""] : []);
/** Joins lines and collapses blank runs, so an absent optional part never leaves a gap. */
const tidy = (lines: string[]) => `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;

/** Fails the build, rather than shipping a half-empty file, if a channel goes missing. */
function channel(key: Channel["key"]) {
  const c = site.channels.find((x) => x.key === key);
  if (!c) throw new Error(`site.channels has no "${key}" entry`);
  return c;
}

const adminEmail = channel("email").value;

const talkYears = Array.from(new Set(talksArchive.map((t) => t.year)))
  .filter((y): y is number => y !== null)
  .sort((a, b) => b - a);
const talkSpan = `${Math.min(...talkYears)} to ${Math.max(...talkYears)}`;

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * "Thursdays 6 to 8pm" -> { day: "Thursday", start: "18:00", end: "20:00" }.
 * A start without am/pm takes the end's, unless that would start after the
 * end ("11 to 1pm"). Unfamiliar phrasings return null rather than a guess,
 * and the build check fails if any initiative's time stops parsing.
 */
export function parseWhen(when: string): { day: string; start: string; end: string } | null {
  const m =
    /^([a-z]+?)s?\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:to|-|–)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i.exec(
      when.trim(),
    );
  if (!m) return null;
  const day = DAYS.find((d) => d.toLowerCase() === m[1].toLowerCase());
  if (!day) return null;
  const minutes = (h: string, min: string | undefined, meridiem: string) =>
    ((Number(h) % 12) + (meridiem.toLowerCase() === "pm" ? 12 : 0)) * 60 + Number(min ?? 0);
  const end = minutes(m[5], m[6], m[7]);
  let start = minutes(m[2], m[3], m[4] ?? m[7]);
  if (!m[4] && start >= end) start = minutes(m[2], m[3], m[7].toLowerCase() === "pm" ? "am" : "pm");
  if (start >= end) return null;
  const clock = (t: number) =>
    `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  return { day, start: clock(start), end: clock(end) };
}

const summary = () =>
  `${site.longName} (${site.name}) is a student organization at the ${site.university} ` +
  `in Ann Arbor, founded in ${site.foundedYear} and devoted to artificial intelligence ` +
  `research. Students run reading groups and project teams, and the site archives the ` +
  `${talksArchive.length} talks the club hosted from ${talkSpan}. Any University of ` +
  `Michigan student can join.`;

/* ------------------------------------------------------------ page bodies */

/** A page's content below its heading and lead. `h` is the section heading prefix. */
type Body = (h: string) => string[];

const channelLines = () => site.channels.map((c) => `- ${c.label} (${c.value}): ${c.href}`);

function leaderLine(p: (typeof about.roster.people)[number]): string {
  const contact = [`email ${p.email}`];
  if (p.linkedin) contact.push(`LinkedIn ${p.linkedin}`);
  if (p.website) contact.push(`website ${p.website}`);
  return `- ${p.name}, ${p.role}: ${contact.join("; ")}`;
}

function initiativeLines(h: string): string[] {
  const out = [`${h} ${initiatives.term}`, "", "Meeting times are Ann Arbor local time (Eastern).", ""];
  for (const i of initiatives.items) {
    out.push(`${h}# ${i.name}`, "", `${i.level}. Led by ${i.lead}.`);
    if (i.when) {
      out.push(i.room ? `Meets ${i.when} in ${i.room.code} (${i.room.building}).` : `Meets ${i.when}.`);
    }
    out.push("", i.description, "");
    const links = i.links.map((l) => `- ${l.label}: ${l.href}`);
    if (i.room) links.unshift(`- Walking directions to ${i.room.code}: ${directionsUrl(i.room)}`);
    if (links.length) out.push(...links, "");
  }
  return out;
}

const BODIES: Record<PageKey, Body> = {
  home: (h) => [
    about.mission,
    "",
    home.story,
    "",
    `${h} ${initiatives.term} initiatives`,
    "",
    ...initiatives.items.map(
      (i) => `- ${i.name} (${i.level}${i.when ? `; meets ${i.when}` : ""}): ${i.description}`,
    ),
    "",
    `Rooms, leads and links: ${markdownUrl("initiatives")}`,
    "",
    `${h} Talk archive`,
    "",
    `${talksArchive.length} talks from ${talkSpan}, listed in full at ${markdownUrl("talks")}. ${talksMeta.note}`,
    "",
    `${h} Find us`,
    "",
    `${site.name} is open to every University of Michigan student. Slack is the most active channel.`,
    "",
    ...channelLines(),
  ],
  about: (h) => [
    about.history,
    "",
    `${h} Leadership, ${about.roster.term}`,
    "",
    ...about.roster.people.map(leaderLine),
    "",
    `${h} Governance`,
    "",
    `The ${site.name} constitution: ${markdownUrl("constitution")}`,
  ],
  initiatives: (h) => [
    ...initiativeLines(h),
    `${h} ML Discussion: ${mlDiscussionArchive.term} material`,
    "",
    mlDiscussionArchive.intro,
    "",
    ...mlDiscussionArchive.lessons.map(
      (l) => `- ${l.title}: ${l.links.map((k) => `[${k.label}](${k.href})`).join(", ")}`,
    ),
  ],
  join: () => ["Slack is the most active channel.", "", ...channelLines()],
  talks: (h) => [
    ...[...talkYears, null].flatMap((year) => {
      const group = talksArchive.filter((t) => t.year === year);
      if (!group.length) return [];
      return [`${h} ${year ?? "Date unconfirmed"}`, "", ...group.map((t) => `- ${t.title}, ${t.speaker}`), ""];
    }),
    talksMeta.note,
  ],
  resources: (h) => [
    `${h} Start here`,
    "",
    ...learningConcepts.flatMap((g) => [
      `${h}# ${g.title}`,
      "",
      ...g.items.map((r) => `- [${r.label}](${r.href})`),
      "",
    ]),
    `${h} More in the library`,
    "",
    "These sections from the old library are being updated and will return soon.",
    "",
    ...agingSections.map((s) => `- ${s.title}: ${s.summary}`),
    "",
    ...para(resourcesMeta.note),
  ],
  alumni: () => alumni.map((a) => `- ${a.name} (${a.term})`),
  sponsors: () => [sponsorsMeta.notice],
  constitution: (h) => [
    ...para(constitutionMeta.note),
    `${h} Terminology`,
    "",
    ...constitutionTerminology.map((t) => `- ${t.term}: ${t.definition}`),
    "",
    ...constitutionArticles.flatMap((a) => [`${h} ${a.heading}`, "", ...a.paragraphs.flatMap((p) => [p, ""])]),
  ],
};

/* ------------------------------------------------------------- Markdown */

/** One page as Markdown, served at <page URL>index.html.md. */
export function pageMarkdown(key: PageKey): string {
  const page = pages[key];
  const changed = contentDate(key);
  return tidy([
    `# ${page.heading}`,
    "",
    `> ${page.description}`,
    "",
    `Canonical page: ${pageUrl(key)}`,
    ...(changed ? [`Content last changed: ${changed.slice(0, 10)}`] : []),
    `From the ${site.longName} (${site.name}) site. Every page, for agents: ${url("/llms.txt")}`,
    "",
    ...para(page.lead),
    ...BODIES[key]("##"),
  ]);
}

/** The Response a page's index.html.md route handler returns. */
export function markdownResponse(key: PageKey): Response {
  return new Response(pageMarkdown(key), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}

/** /llms-full.txt: every page's Markdown in one file, in navigation order. */
export function llmsFullTxt(): string {
  const lines = [
    `# ${site.longName} (${site.name})`,
    "",
    `> ${summary()}`,
    "",
    `Every page of ${site.url} as Markdown, regenerated from the site's data on every deploy (last ${today()}). Each section names the term or date it is current for. Index: ${url("/llms.txt")}. JSON: ${url("/msail.json")}.`,
    "",
  ];
  for (const key of pageOrder) {
    const page = pages[key];
    lines.push(
      `## ${key === "home" ? "Home" : page.heading}`,
      "",
      `Page: ${pageUrl(key)}`,
      "",
      ...para(page.lead),
      ...BODIES[key]("###"),
      "",
    );
  }
  return tidy(lines);
}

/** /llms.txt, in the llmstxt.org layout: H1, blockquote summary, facts, linked sections. */
export function llmsTxt(): string {
  const slack = channel("slack");
  const maize = channel("maizepages");
  const instagram = channel("instagram");
  const linkedin = channel("linkedin");
  const start = learningConcepts[0];
  return tidy([
    `# ${site.longName} (${site.name})`,
    "",
    `> ${summary()}`,
    "",
    "Key facts:",
    "",
    `- Join: the Slack workspace is the most active channel. Invite link: ${slack.href}`,
    `- Also on Maize Pages (${maize.href}), Instagram ${instagram.value} (${instagram.href}) and LinkedIn (${linkedin.href}). Email: ${adminEmail}`,
    `- Names used: ${site.longName}, ${ALT_NAME}, ${site.name}`,
    `- ${initiatives.term} initiatives (Ann Arbor time): ${initiatives.items
      .map((i) => (i.when ? `${i.name} (${i.when})` : i.name))
      .join("; ")}`,
    `- Leadership, ${about.roster.term}: ${about.roster.people.map((p) => `${p.name} (${p.role})`).join(", ")}`,
    ...(start
      ? [`- New to AI: the Resources page says to start with ${start.title}: ${start.items.map((r) => r.label).join("; ")}`]
      : []),
    `- Talks: ${talksMeta.note} The site lists the ${talksArchive.length} talks ${site.name} hosted from ${talkSpan}.`,
    `- For agents: every page has a Markdown copy at its URL plus index.html.md (linked below), and browser agents get read-only WebMCP tools on document.modelContext: ${AGENT_TOOL_NAMES.join(", ")}.`,
    `- Freshness: initiatives and leadership are for ${initiatives.term}; the talk archive covers ${talkSpan}; the constitution was last amended ${constitutionMeta.lastUpdated}. These files are regenerated from the site's data on every deploy (last ${today()}).`,
    "",
    "## Pages",
    "",
    ...pageOrder.map(
      (key) => `- [${key === "home" ? "Home" : pages[key].title}](${markdownUrl(key)}): ${pages[key].description}`,
    ),
    "",
    "## Join and contact",
    "",
    ...site.channels.map((c) => `- [${c.label}](${c.href}): ${c.value}`),
    "",
    "## Optional",
    "",
    `- [Full site as Markdown](${url("/llms-full.txt")}): every page in one file, including the full talk archive, resources and constitution`,
    `- [Site data as JSON](${url("/msail.json")}): the same content with stable, versioned field names, for tools and agents`,
    `- [Agent Skill](${url(SKILL_PATH)}): instructions any agent can load to answer questions about ${site.name} from this data`,
  ]);
}

/* ----------------------------------------------------------------- JSON */

/** Everything the site publishes, as JSON with stable field names. */
export function siteData() {
  return {
    version: JSON_VERSION,
    name: site.longName,
    shortName: site.name,
    alternateNames: [ALT_NAME, site.name],
    url: site.url,
    summary: summary(),
    mission: about.mission,
    history: about.history,
    story: home.story,
    university: site.university,
    city: "Ann Arbor, Michigan, USA",
    timezone: TIMEZONE,
    founded: site.foundedYear,
    eligibility: "Open to every University of Michigan student.",
    /** When these files were generated. Each section names the term or date it is current for. */
    generated: today(),
    join: {
      howTo:
        `Join the Slack workspace, the most active channel, with the invite link below, ` +
        `and follow ${site.name} on Maize Pages. Questions go to ${adminEmail}.`,
      channels: site.channels.map(({ key, label, value, href }) => ({ key, label, handle: value, url: href })),
    },
    leadership: {
      term: about.roster.term,
      people: about.roster.people.map((p) => ({
        name: p.name,
        role: p.role,
        email: p.email,
        linkedin: p.linkedin ?? null,
        website: p.website ?? null,
      })),
    },
    initiatives: {
      term: initiatives.term,
      items: initiatives.items.map((i) => {
        const schedule = i.when ? parseWhen(i.when) : null;
        return {
          name: i.name,
          level: i.level,
          lead: i.lead,
          description: i.description,
          meets: i.when ?? null,
          schedule: schedule ? { ...schedule, repeats: "weekly", timezone: TIMEZONE } : null,
          room: i.room
            ? { code: i.room.code, building: i.room.building, directions: directionsUrl(i.room) }
            : null,
          links: i.links.map((l) => ({ label: l.label, url: l.href })),
        };
      }),
    },
    mlDiscussionArchive: {
      term: mlDiscussionArchive.term,
      intro: mlDiscussionArchive.intro,
      lessons: mlDiscussionArchive.lessons.map((l) => ({
        title: l.title,
        links: l.links.map((k) => ({ label: k.label, url: k.href })),
      })),
    },
    talks: {
      note: talksMeta.note,
      hosted: talkSpan,
      count: talksArchive.length,
      items: talksArchive.map((t) => ({ title: t.title, speaker: t.speaker, year: t.year })),
    },
    resources: {
      intro: resourcesMeta.intro,
      /** The "Start here" groups, in the order the page suggests them. */
      groups: learningConcepts.map((g) => ({
        title: g.title,
        items: g.items.map((r) => ({ label: r.label, url: r.href })),
      })),
      beingUpdated: agingSections.map((s) => ({ title: s.title, summary: s.summary })),
    },
    alumni: {
      intro: alumniMeta.intro,
      people: alumni.map((a) => ({ name: a.name, term: a.term })),
    },
    sponsors: { notice: sponsorsMeta.notice },
    constitution: {
      lastAmended: constitutionMeta.lastUpdated,
      terminology: constitutionTerminology,
      articles: constitutionArticles,
      note: constitutionMeta.note,
    },
    pages: pageOrder.map((key) => ({
      key,
      title: pages[key].heading,
      url: pageUrl(key),
      markdown: markdownUrl(key),
      description: pages[key].description,
      lastModified: contentDate(key) ?? null,
    })),
    machineReadable: {
      llmsTxt: url("/llms.txt"),
      llmsFullTxt: url("/llms-full.txt"),
      json: url("/msail.json"),
      pageMarkdown: "Append index.html.md to any page URL.",
      webmcp: { api: "document.modelContext", tools: [...AGENT_TOOL_NAMES] },
      agentSkill: url(SKILL_PATH),
      ardManifest: url("/.well-known/ard.json"),
    },
  };
}

export type SiteData = ReturnType<typeof siteData>;

/* ------------------------------------------------------------ schema.org */

const ORG_ID = url("/#organization");
const WEBSITE_ID = url("/#website");

/** JSON for a <script type="application/ld+json">, with "<" escaped so no data can close the element. */
export const jsonLdHtml = (graph: unknown) => JSON.stringify(graph).replace(/</g, "\\u003c");

/**
 * The site-wide graph in the root layout. The @ids let search and answer
 * engines merge it with what they already hold about the organization, and
 * the page graphs point back to it. knowsAbout lists only topics the site's
 * own content covers.
 */
export function organizationGraph() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: site.longName,
        alternateName: [site.name, ALT_NAME],
        url: site.url,
        logo: url("/msail-logo.png"),
        image: url("/og.jpg"),
        description: about.mission,
        email: adminEmail,
        foundingDate: String(site.foundedYear),
        address: {
          "@type": "PostalAddress",
          addressLocality: "Ann Arbor",
          addressRegion: "MI",
          addressCountry: "US",
        },
        parentOrganization: {
          "@type": "CollegeOrUniversity",
          name: site.university,
          url: "https://umich.edu",
          sameAs: "https://en.wikipedia.org/wiki/University_of_Michigan",
        },
        sameAs: [channel("instagram").href, channel("linkedin").href, channel("maizepages").href],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "general inquiries",
          email: adminEmail,
          url: pageUrl("join"),
        },
        potentialAction: {
          "@type": "JoinAction",
          name: `Join the ${site.name} Slack`,
          target: channel("slack").href,
        },
        knowsAbout: [
          "Artificial intelligence",
          "Machine learning",
          "Deep learning",
          "Computer vision",
          "Natural language processing",
          "Reinforcement learning",
          "AI alignment",
          "Interpretability",
        ],
        member: about.roster.people.map((p) => ({
          "@type": "OrganizationRole",
          roleName: p.role,
          member: {
            "@type": "Person",
            name: p.name,
            ...(p.linkedin ? { sameAs: p.linkedin } : {}),
          },
        })),
      },
      {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: site.url,
        name: site.longName,
        alternateName: site.name,
        inLanguage: "en-US",
        publisher: { "@id": ORG_ID },
      },
    ],
  };
}

const PAGE_TYPES: Record<PageKey, string> = {
  home: "WebPage",
  about: "AboutPage",
  initiatives: "CollectionPage",
  join: "ContactPage",
  talks: "CollectionPage",
  resources: "CollectionPage",
  alumni: "CollectionPage",
  sponsors: "WebPage",
  constitution: "WebPage",
};

/**
 * A page's own graph: its WebPage type, breadcrumbs, and the entities only
 * that page lists. Initiatives and talks are deliberately not marked up as
 * Events: Google requires exact dates for those, and the site has terms and
 * years, not dates.
 */
export function pageGraph(key: PageKey) {
  const page = pages[key];
  const href = pageUrl(key);
  const modified = contentDate(key);
  const alumniId = `${href}#alumni`;
  const webPage: Record<string, unknown> = {
    "@type": PAGE_TYPES[key],
    "@id": `${href}#webpage`,
    url: href,
    name: key === "home" ? page.title : `${page.title} · ${site.name}`,
    description: page.description,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORG_ID },
    inLanguage: "en-US",
  };
  if (modified) webPage.dateModified = modified;
  if (key === "about" || key === "join") webPage.mainEntity = { "@id": ORG_ID };
  if (key === "alumni") webPage.mainEntity = { "@id": alumniId };

  const nodes: Record<string, unknown>[] = [webPage];
  if (key !== "home") {
    webPage.breadcrumb = { "@id": `${href}#breadcrumb` };
    nodes.push({
      "@type": "BreadcrumbList",
      "@id": `${href}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: url("/") },
        { "@type": "ListItem", position: 2, name: page.title, item: href },
      ],
    });
  }
  if (key === "alumni") {
    nodes.push({
      "@type": "ItemList",
      "@id": alumniId,
      name: `${site.name} alumni`,
      numberOfItems: alumni.length,
      itemListElement: alumni.map((a, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Person",
          name: a.name,
          description: `${site.name} member, ${a.term}`,
          alumniOf: { "@id": ORG_ID },
        },
      })),
    });
  }
  return { "@context": "https://schema.org", "@graph": nodes };
}

/* ------------------------------------------------- Agent Skill and ARD */

/** The newest content date across every page, for "last updated" stamps. */
function latestContentDate(): string | undefined {
  const dates = pageOrder.map((key) => contentDate(key)).filter((d): d is string => Boolean(d));
  return dates.sort((a, b) => Date.parse(b) - Date.parse(a))[0];
}

/**
 * /agent-skills/msail/SKILL.md, an Agent Skill (agentskills.io layout: YAML
 * front matter with name and description, then instructions). It carries no
 * term-specific facts on purpose: it tells an agent where the live data is
 * and how to answer from it, so it never goes stale.
 */
export function skillMarkdown(): string {
  const description =
    `Answer questions about ${site.name}, the ${site.longName} at the ${site.university}: ` +
    "how to join, this term's initiatives and meeting times, leadership, the talk archive and " +
    "learning resources, using the club's own published data. Use when someone asks about " +
    `${site.name}, the ${ALT_NAME}, or student AI clubs at the ${site.university}.`;
  return tidy([
    "---",
    "name: msail",
    // JSON strings are valid YAML double-quoted scalars, so colons inside are safe.
    `description: ${JSON.stringify(description)}`,
    "---",
    "",
    `# ${site.name}`,
    "",
    `The ${site.longName} (${site.name}, also "${ALT_NAME}") is a student AI and machine learning club at the ${site.university} in Ann Arbor, founded in ${site.foundedYear}. Official site: ${site.url}`,
    "",
    "## Read the facts from the site, not from memory",
    "",
    "Officers, meeting times and the Slack invite change every term, so fetch them fresh:",
    "",
    `1. ${url("/msail.json")}: everything as JSON (version ${JSON_VERSION}). The Slack invite is the \`join.channels\` entry whose \`key\` is \`slack\`. Meeting days and times are \`initiatives.items[].schedule\` (24-hour clock, ${TIMEZONE}). Officers are \`leadership.people\`, talks are \`talks.items\`, and \`resources.groups\` lists learning resources in the order the site suggests them.`,
    `2. ${url("/llms.txt")}: a short index with the key facts and a Markdown copy of every page.`,
    `3. ${url("/llms-full.txt")}: every page in one Markdown file.`,
    `4. In a browser on ${site.url}, every page offers read-only WebMCP tools on document.modelContext: ${AGENT_TOOL_NAMES.join(", ")}.`,
    "",
    "## Answering well",
    "",
    "- Joining: give the Slack invite from msail.json. Invites expire, so never reuse one remembered from elsewhere. Any University of Michigan student can join.",
    `- Times: meeting times are Ann Arbor local time (${TIMEZONE}). Say so when the person may be somewhere else.`,
    `- Talks: the archive covers ${talkSpan} and new talks are paused. The site lists titles and speakers but links no recordings, so do not promise any.`,
    "- When sending a person somewhere, link the page (for example https://msail.github.io/initiatives/), not the JSON or Markdown copy.",
    `- Older pages about ${site.name} describe earlier years, and the old eecs.umich.edu/msail/ site no longer exists. Prefer ${site.url} for anything current, and say so when sources disagree.`,
  ]);
}

/**
 * /.well-known/ard.json, the Agentic Resource Discovery manifest (ARD v0.91,
 * agenticresourcediscovery.org): it lists the skill above so agent registries
 * and Lighthouse's agentic audits can find it. The publisher segment of the
 * identifier is the serving domain, as the spec requires.
 */
export function ardManifest() {
  const updatedAt = latestContentDate();
  return {
    entries: [
      {
        identifier: `urn:air:${new URL(site.url).host}:skills:msail`,
        displayName: `${site.name} site guide`,
        type: "application/agent-skills+md",
        url: url(SKILL_PATH),
        description: `How to answer questions about ${site.name}, the ${site.longName}, from its live site data: joining, initiatives and meeting times, leadership, talks and resources.`,
        representativeQueries: [
          `How do I join ${site.name}, the ${ALT_NAME}?`,
          "What AI clubs can I join at the University of Michigan?",
          `When and where does ${site.name}'s alignment and interpretability group meet?`,
          `Who leads ${site.name} this term?`,
          `Did ${site.name} host a talk about AlphaFold?`,
        ],
        capabilities: [...AGENT_TOOL_NAMES],
        tags: ["University of Michigan", "Ann Arbor", "student organization", "artificial intelligence", "machine learning"],
        version: String(JSON_VERSION),
        ...(updatedAt ? { updatedAt } : {}),
      },
    ],
  };
}
