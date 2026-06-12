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
    { label: "Contact", href: "/contact", blurb: "Reach the admin team." },
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
      href: "https://msail-team.slack.com/join/shared_invite/zt-2amxfx9xj-Twwm6uuT1YCuBfKXn62v8Q",
      flag: flag(
        "unverified",
        "Shared invite added 2026-06-09; Slack bot-walls automated checks. Confirm the invite is set to never expire (Slack admin → invitations), or swap in a no-expiry link.",
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
      { label: "Contact", href: "/contact" },
    ],
  },
];

/**
 * Homepage hero. The full name is the headline; the MSAIL acronym is tied to it
 * with a maize highlight. One concrete subline, then two CTAs.
 */
export const home = {
  acronym: "MSAIL",
  headline: "Michigan Student Artificial Intelligence Lab",
  subline: site.tagline, // single source of truth: the site-wide tagline

  ctas: [
    { label: "Join MSAIL", href: "/join", variant: "primary" as const },
    { label: "Sponsor / work with us", href: "/sponsors", variant: "ghost" as const },
  ],
  affiliation: ["University of Michigan", "Ann Arbor, Michigan", "Established 2008"],
} as const;
