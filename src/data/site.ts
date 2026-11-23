/**
 * MSAIL site data, the typed content layer for the layout shell.
 *
 * Everything the nav, footer, and hero need lives here so a future student
 * maintainer can edit copy, links, and the channel list WITHOUT touching React.
 * Page-section content (rosters, talks, initiatives) will get its own data /
 * MDX files later; this file is the shell + global identity + homepage hero.
 *
 * Sources of truth: CONTENT.md (live-site inventory) + official U-M brand.
 */

import type { Flag } from "./content-status";
import { flag } from "./content-status";
import { talksArchive } from "./talks";

export type NavLink = {
  label: string;
  href: `/${string}`;
  /** One-line description for the mobile menu. */
  blurb: string;
};

export type Channel = {
  key: "slack" | "maizepages" | "instagram" | "linkedin" | "email";
  label: string;
  /** The human-readable handle/address shown in mono. */
  value: string;
  href: string;
  /** Internal provenance for the link (never rendered). */
  flag?: Flag;
};

export const site = {
  name: "MSAIL",
  longName: "Michigan Student Artificial Intelligence Lab",
  university: "University of Michigan",
  /** Canonical origin: GitHub Pages, served from the domain root. */
  url: "https://msail.github.io",
  /** MSAIL was founded in 2008 (per the founder). */
  foundedYear: 2008,

  tagline: "A student community for AI research at the University of Michigan.",
  mission:
    "We strive to spread our passion for AI throughout the University of Michigan student body, regardless of demographic or academic standing.",

  /** Primary navigation. The href for each must have a route under src/app. */
  nav: [
    { label: "About", href: "/about", blurb: "Who we are, our team, and faculty mentors." },
    { label: "Initiatives", href: "/initiatives", blurb: "Projects and groups you can join this term." },
    { label: "Talks", href: "/talks", blurb: "Our speaker series and talk archive." },
    { label: "Resources", href: "/resources", blurb: "Our AI/ML learning library." },
    { label: "Alumni", href: "/alumni", blurb: "Where MSAIL members have gone." },
  ] satisfies NavLink[],

  /** The single primary call-to-action, the real join funnel. */
  cta: { label: "Join", href: "/join" as const },

  /**
   * Every real MSAIL channel. Instagram + LinkedIn postdate the CONTENT.md
   * inventory (which found no socials on the old live site); Maize Pages
   * replaced the old MCommunity link as the org-directory channel.
   */
  channels: [
    {
      key: "slack",
      label: "Slack",
      value: "msail-team",
      href: "https://join.slack.com/t/msail-team/shared_invite/zt-4guf3p89z-lPCl1BVoZEG0cMBygVYLhw",
      flag: flag(
        "verified",
        "EXPIRES 2026-12-16: that is the expiry Slack reported for this invite when it was checked signed-out on 2026-11-16 (it loads the join page). Swapped in that day by Sanat because the 2026-09-01 link was dead on the live site; the 2026-06-09 link before it had gone stale too. Replace this one with a link whose expiry is set to Never (Slack: Invite people, Edit link settings). To test a link, open it in a private window: a dead one says \"This link is no longer active\". curl gets a 403 either way, and a browser already signed in to the workspace is redirected past the error.",
      ),
    },
    {
      key: "maizepages",
      label: "Maize Pages",
      value: "Michigan Student AI Lab",
      href: "https://maizepages.umich.edu/organization/msail",
    },
    {
      key: "instagram",
      label: "Instagram",
      value: "@michiganailab",
      href: "https://www.instagram.com/michiganailab/",
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      value: "company/msail1",
      href: "https://www.linkedin.com/company/msail1/",
    },
    {
      key: "email",
      label: "Email",
      value: "msail-admin@umich.edu",
      href: "mailto:msail-admin@umich.edu",
    },
  ] satisfies Channel[],
} as const;

/** Footer link groups (derived from nav so there's a single source of truth). */
export const footerColumns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Explore",
    links: [...site.nav.slice(0, 4).map((n) => ({ label: n.label, href: n.href }))],
  },
  {
    title: "Get involved",
    links: [
      { label: "Join MSAIL", href: site.cta.href },
      { label: "Sponsor us", href: "/sponsors" },
      { label: "Alumni", href: "/alumni" },
    ],
  },
];

/**
 * Homepage hero. A short serif headline over the live rectified-flow figure,
 * one concrete subline, then two CTAs (solid maize primary + glass secondary).
 */
export const home = {
  headline: "Michigan Student AI Lab",
  subline:
    `Reading groups, build-from-scratch projects, and a ${talksArchive.length}-talk archive, run by students at the University of Michigan since 2008.`,

  ctas: [
    { label: "Join MSAIL", href: "/join", variant: "maize" as const },
    { label: "See past talks", href: "/talks", variant: "outline" as const },
  ],
} as const;
