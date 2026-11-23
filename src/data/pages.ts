/**
 * Every public page's identity in one place: path, <title>, visible heading,
 * lead, and the one-line description used for the meta and Open Graph tags,
 * the page's Markdown copy, llms.txt and msail.json. Pages read their metadata
 * and PageShell props from here, so a heading or description changes once.
 */
import { about } from "./about";
import { alumniMeta } from "./alumni";
import { initiatives } from "./initiatives";
import { resourcesMeta } from "./resources";
import { talksArchive } from "./talks";

export type PageKey =
  | "home"
  | "about"
  | "initiatives"
  | "join"
  | "talks"
  | "resources"
  | "alumni"
  | "sponsors"
  | "constitution";

export type PageInfo = {
  /** As served and canonicalized: trailing slash (trailingSlash: true). */
  path: string;
  /** The <title> segment; the root layout's template appends " · MSAIL". */
  title: string;
  /** The page's <h1>. For home, the hero lockup's text. */
  heading: string;
  /** The paragraph under the heading, where the page has one. */
  lead?: string;
  /** Meta and Open Graph description, and the summary agents see first. */
  description: string;
};

export const pages: Record<PageKey, PageInfo> = {
  home: {
    path: "/",
    title: "MSAIL · Michigan Student Artificial Intelligence Lab",
    heading: "MSAIL: Michigan Student AI Lab",
    description:
      "MSAIL, the Michigan Student Artificial Intelligence Lab, is a student AI and machine learning club at the University of Michigan in Ann Arbor, with reading groups, project teams and a talk archive. Open to every U-M student.",
  },
  about: {
    path: "/about/",
    title: "About",
    heading: "About MSAIL",
    lead: about.mission,
    description: `What MSAIL is: a student organization devoted to AI research at the University of Michigan, founded in 2008, and its ${about.roster.term} leadership team.`,
  },
  initiatives: {
    path: "/initiatives/",
    title: "Initiatives",
    heading: "Projects & Initiatives",
    lead: "The projects, courses, and reading groups MSAIL runs, plus the ML Discussion archive.",
    description: `MSAIL's ${initiatives.term} projects, courses, and reading groups, with meeting times, rooms, and leads, plus the ML Discussion archive of slides, notebooks, and recordings.`,
  },
  join: {
    path: "/join/",
    title: "Join",
    heading: "Join MSAIL",
    lead: "Join the MSAIL Slack and find us on Maize Pages, or follow us on the channels below. Everyone is welcome.",
    description:
      "How to join MSAIL: the Slack workspace, Maize Pages, and our other channels. Everyone is welcome.",
  },
  talks: {
    path: "/talks/",
    title: "Talks",
    heading: "Talks",
    lead: "An archive of the talks MSAIL hosted from 2020 to 2024.",
    description: `All ${talksArchive.length} talks MSAIL hosted from 2020 to 2024, by year, with speakers.`,
  },
  resources: {
    path: "/resources/",
    title: "Resources",
    heading: "Resources",
    lead: resourcesMeta.intro,
    description:
      "The MSAIL learning library: courses and guides for deep learning, computer vision, NLP, and reinforcement learning.",
  },
  alumni: {
    path: "/alumni/",
    title: "Alumni",
    heading: "Alumni",
    lead: alumniMeta.intro,
    description:
      "Past members of MSAIL, the Michigan Student Artificial Intelligence Lab, going back to 2008.",
  },
  sponsors: {
    path: "/sponsors/",
    title: "Sponsors",
    heading: "Sponsor MSAIL",
    lead: "Reach hundreds of Michigan students who build and research AI.",
    description:
      "Sponsor MSAIL and reach hundreds of University of Michigan students working in AI.",
  },
  constitution: {
    path: "/constitution/",
    title: "Constitution",
    heading: "MSAIL Governance: A Brief Constitution",
    lead: "The governing document of the Michigan Student Artificial Intelligence Lab.",
    description:
      "MSAIL governance: the constitution of the Michigan Student Artificial Intelligence Lab.",
  },
};

/** Navigation order, used by the sitemap, llms.txt and msail.json. */
export const pageOrder: PageKey[] = [
  "home",
  "about",
  "initiatives",
  "join",
  "talks",
  "resources",
  "alumni",
  "sponsors",
  "constitution",
];
