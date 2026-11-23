/**
 * The site as machines read it: LLM crawlers, answer engines, and agents
 * acting for a student who asked "how do I join an AI club at Michigan?".
 *
 * Every string comes from the same src/data files the pages render, so these
 * copies cannot drift from the HTML. Only what the pages publish goes out:
 * internal `flag` notes, the outgoing roster and the unconfirmed faculty
 * mentor stay in the source. Served as static files by the route handlers in
 * src/app/llms.txt, src/app/llms-full.txt and src/app/msail.json, and as the
 * schema.org graph in the root layout.
 */
import type { Channel } from "@/data/site";
import { site } from "@/data/site";
import { about } from "@/data/about";
import { initiatives, mlDiscussionArchive, directionsUrl } from "@/data/initiatives";
import { talksArchive, talksMeta } from "@/data/talks";
import { alumni, alumniMeta } from "@/data/alumni";
import { learningConcepts, agingSections, resourcesMeta } from "@/data/resources";
import {
  constitutionArticles,
  constitutionMeta,
  constitutionTerminology,
} from "@/data/constitution";
import { sponsorsMeta } from "@/data/sponsors";

const url = (path: string) => `${site.url}${path}`;
const today = () => new Date().toISOString().slice(0, 10);
const para = (s?: string) => (s ? [s, ""] : []);

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

const summary = () =>
  `${site.longName} (${site.name}) is a student organization at the ${site.university} ` +
  `in Ann Arbor, founded in ${site.foundedYear} and devoted to artificial intelligence ` +
  `research. Students run reading groups and project teams, and the club keeps an archive ` +
  `of ${talksArchive.length} recorded talks from ${talkSpan}. Any University of Michigan ` +
  `student can join.`;

const PAGES = [
  {
    path: "/",
    title: "Home",
    summary: `What ${site.name} is, this term's initiatives, six talks from the archive, and every channel.`,
  },
  {
    path: "/about/",
    title: "About",
    summary: `Mission, history, and the ${about.roster.term} leadership team with roles and contact links.`,
  },
  {
    path: "/initiatives/",
    title: "Initiatives",
    summary: `${initiatives.term} projects, courses and reading groups with level, lead, meeting time and room, plus the ML Discussion lesson archive (${mlDiscussionArchive.term}).`,
  },
  {
    path: "/join/",
    title: "Join",
    summary: "How to join: the Slack invite, Maize Pages, and every other channel.",
  },
  {
    path: "/talks/",
    title: "Talks",
    summary: `All ${talksArchive.length} recorded talks from ${talkSpan} by year, with speakers. ${talksMeta.note}`,
  },
  {
    path: "/resources/",
    title: "Resources",
    summary: `Courses and guides: ${learningConcepts.map((g) => g.title).join(", ")}.`,
  },
  {
    path: "/alumni/",
    title: "Alumni",
    summary: `${alumni.length} past members and the terms they were active.`,
  },
  {
    path: "/sponsors/",
    title: "Sponsors",
    summary: `Sponsorship details are being put together; partners can email ${adminEmail}.`,
  },
  {
    path: "/constitution/",
    title: "Constitution",
    summary: "The governing document: terminology and articles.",
  },
];

/** Everything the site publishes, as JSON with stable field names. */
export function siteData() {
  return {
    name: site.longName,
    shortName: site.name,
    url: site.url,
    summary: summary(),
    mission: about.mission,
    history: about.history,
    university: site.university,
    city: "Ann Arbor, Michigan, USA",
    founded: site.foundedYear,
    eligibility: "Open to every University of Michigan student.",
    updated: today(),
    join: {
      howTo:
        `Join the Slack workspace, the most active channel, with the invite link below, ` +
        `and follow ${site.name} on Maize Pages. Questions go to ${adminEmail}.`,
      channels: site.channels.map(({ key, label, value, href }) => ({
        key,
        label,
        handle: value,
        url: href,
      })),
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
      items: initiatives.items.map((i) => ({
        name: i.name,
        level: i.level,
        lead: i.lead,
        description: i.description,
        meets: i.when ?? null,
        room: i.room
          ? { code: i.room.code, building: i.room.building, directions: directionsUrl(i.room) }
          : null,
        links: i.links.map((l) => ({ label: l.label, url: l.href })),
      })),
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
      count: talksArchive.length,
      items: talksArchive.map((t) => ({ title: t.title, speaker: t.speaker, year: t.year })),
    },
    resources: {
      intro: resourcesMeta.intro,
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
      terminology: constitutionTerminology,
      articles: constitutionArticles,
      note: constitutionMeta.note,
    },
    pages: PAGES.map((p) => ({ title: p.title, url: url(p.path), summary: p.summary })),
    machineReadable: {
      llmsTxt: url("/llms.txt"),
      llmsFullTxt: url("/llms-full.txt"),
      json: url("/msail.json"),
    },
  };
}

export type SiteData = ReturnType<typeof siteData>;

/** /llms.txt, in the llmstxt.org layout: H1, blockquote summary, facts, linked sections. */
export function llmsTxt(): string {
  const slack = channel("slack");
  const maize = channel("maizepages");
  const instagram = channel("instagram");
  const linkedin = channel("linkedin");
  return [
    `# ${site.longName} (${site.name})`,
    "",
    `> ${summary()}`,
    "",
    "Key facts:",
    "",
    `- Join: the Slack workspace is the most active channel. Invite link: ${slack.href}`,
    `- Also on Maize Pages (${maize.href}), Instagram ${instagram.value} (${instagram.href}) and LinkedIn (${linkedin.href}). Email: ${adminEmail}`,
    `- ${initiatives.term} initiatives: ${initiatives.items
      .map((i) => (i.when ? `${i.name} (${i.when})` : i.name))
      .join("; ")}`,
    `- Leadership, ${about.roster.term}: ${about.roster.people
      .map((p) => `${p.name} (${p.role})`)
      .join(", ")}`,
    `- Talks: ${talksMeta.note} The archive holds ${talksArchive.length} talks from ${talkSpan}.`,
    `- This file, llms-full.txt and msail.json are generated from the site's own data on every deploy. Last built ${today()}.`,
    "",
    "## Pages",
    "",
    ...PAGES.map((p) => `- [${p.title}](${url(p.path)}): ${p.summary}`),
    "",
    "## Join and contact",
    "",
    ...site.channels.map((c) => `- [${c.label}](${c.href}): ${c.value}`),
    "",
    "## Optional",
    "",
    `- [Full site as Markdown](${url("/llms-full.txt")}): every page's content in one file, including the full talk archive, resources and constitution`,
    `- [Site data as JSON](${url("/msail.json")}): the same content with stable field names, for tools and agents`,
    "",
  ].join("\n");
}

/** /llms-full.txt: every page's published content in one Markdown file. */
export function llmsFullTxt(): string {
  const out: string[] = [];
  const push = (...lines: string[]) => out.push(...lines);

  push(
    `# ${site.longName} (${site.name})`,
    "",
    `> ${summary()}`,
    "",
    `Source: ${site.url}, generated from the site's data (built ${today()}). Short index: ${url("/llms.txt")}. JSON: ${url("/msail.json")}.`,
    "",
  );

  push("## About", "", about.mission, "", about.history, "");
  push(`### Leadership, ${about.roster.term}`, "");
  for (const p of about.roster.people) {
    const contact = [`email ${p.email}`];
    if (p.linkedin) contact.push(`LinkedIn ${p.linkedin}`);
    if (p.website) contact.push(`website ${p.website}`);
    push(`- ${p.name}, ${p.role}: ${contact.join("; ")}`);
  }
  push("");

  push(
    "## How to join",
    "",
    "Open to every University of Michigan student. The Slack workspace is the most active channel.",
    "",
    ...site.channels.map((c) => `- ${c.label} (${c.value}): ${c.href}`),
    "",
  );

  push(`## Initiatives, ${initiatives.term}`, "");
  for (const i of initiatives.items) {
    push(`### ${i.name}`, "", `${i.level}. Led by ${i.lead}.`);
    if (i.when) {
      const where = i.room
        ? ` in ${i.room.code} (${i.room.building}); directions: ${directionsUrl(i.room)}`
        : "";
      push(`Meets ${i.when}${where}.`);
    }
    push("", i.description, "");
    if (i.links.length) push(...i.links.map((l) => `- ${l.label}: ${l.href}`), "");
  }

  push(`## ML Discussion lesson archive, ${mlDiscussionArchive.term}`, "", mlDiscussionArchive.intro, "");
  for (const l of mlDiscussionArchive.lessons) {
    push(`- ${l.title}: ${l.links.map((k) => `[${k.label}](${k.href})`).join(", ")}`);
  }
  push("");

  push("## Talks archive", "", talksMeta.note, "");
  for (const year of [...talkYears, null]) {
    const group = talksArchive.filter((t) => t.year === year);
    if (!group.length) continue;
    push(`### ${year ?? "Date unconfirmed"}`, "", ...group.map((t) => `- ${t.title}, ${t.speaker}`), "");
  }

  push("## Resources", "", ...para(resourcesMeta.intro));
  for (const g of learningConcepts) {
    push(`### ${g.title}`, "", ...g.items.map((r) => `- [${r.label}](${r.href})`), "");
  }
  push(
    "### Being updated",
    "",
    ...agingSections.map((s) => `- ${s.title}: ${s.summary}`),
    "",
    ...para(resourcesMeta.note),
  );

  push("## Alumni", "", ...para(alumniMeta.intro), ...alumni.map((a) => `- ${a.name} (${a.term})`), "");
  push("## Sponsors", "", sponsorsMeta.notice, "");

  push(
    "## Constitution",
    "",
    "### Terminology",
    "",
    ...constitutionTerminology.map((t) => `- ${t.term}: ${t.definition}`),
    "",
  );
  for (const a of constitutionArticles) {
    push(`### ${a.heading}`, "", ...a.paragraphs.flatMap((p) => [p, ""]));
  }
  push(...para(constitutionMeta.note));

  return out.join("\n");
}

/**
 * The schema.org graph for the root layout. Ids let search engines and answer
 * engines merge this with what they already hold about the organization.
 * Topics in knowsAbout are only the ones the site's own content covers.
 */
export function organizationGraph() {
  const orgId = url("/#organization");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": orgId,
        name: site.longName,
        alternateName: [site.name, "Michigan Student AI Lab"],
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
          startDate: about.roster.term,
          member: {
            "@type": "Person",
            name: p.name,
            ...(p.linkedin ? { sameAs: p.linkedin } : {}),
          },
        })),
      },
      {
        "@type": "WebSite",
        "@id": url("/#website"),
        url: site.url,
        name: site.longName,
        alternateName: site.name,
        inLanguage: "en-US",
        publisher: { "@id": orgId },
      },
    ],
  };
}
