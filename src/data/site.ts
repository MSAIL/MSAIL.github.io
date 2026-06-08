/**
 * MSAIL site data — the typed content layer for the layout shell.
 *
 * Everything the nav, footer, and routes need lives here so a future student
 * maintainer can edit copy, links, and the channel list WITHOUT touching React.
 * Page-section content (rosters, talks, initiatives, …) will get its own data /
 * MDX files later; this file is just the shell + global identity.
 *
 * Sources of truth: CONTENT.md (live-site inventory) + official U-M brand.
 */

export type NavLink = {
  /** Zero-padded section index shown in the mono "data-sheet" voice (01, 02…). */
  index: string;
  label: string;
  href: `/${string}`;
  /** One-line description for the mobile menu / metadata. */
  blurb: string;
};

export type Channel = {
  key: "slack" | "mcommunity" | "email";
  label: string;
  /** The human-readable handle/address shown in mono. */
  value: string;
  href: string;
};

export const site = {
  name: "MSAIL",
  longName: "Michigan Student AI Lab",
  university: "University of Michigan",
  /** First MSAIL events ran in early 2016 (per the legacy event archive). */
  foundedYear: 2016,

  tagline:
    "A student organization exploring artificial intelligence through education, application, and research.",
  mission:
    "We strive to spread our passion for AI throughout the University of Michigan student body — regardless of demographic or academic standing.",

  /** Primary navigation. The href for each must have a route under src/app. */
  nav: [
    { index: "01", label: "About", href: "/about", blurb: "Who we are, our team, and faculty mentors." },
    { index: "02", label: "Initiatives", href: "/initiatives", blurb: "Projects and groups you can join this term." },
    { index: "03", label: "Talks", href: "/talks", blurb: "Our speaker series and talk archive." },
    { index: "04", label: "Resources", href: "/resources", blurb: "A curated AI/ML learning library." },
    { index: "05", label: "Alumni", href: "/alumni", blurb: "Where MSAIL members have gone." },
    { index: "06", label: "Contact", href: "/contact", blurb: "Reach the admin team." },
  ] satisfies NavLink[],

  /** The single primary call-to-action — the real join funnel. */
  cta: { label: "Join", href: "/join" as const },

  /** Real channels only (no socials — none exist yet, per CONTENT.md §1.11/§3). */
  channels: [
    {
      key: "slack",
      label: "Slack",
      value: "msail-team",
      href: "https://join.slack.com/t/msail-team/signup",
    },
    {
      key: "mcommunity",
      label: "MCommunity",
      value: "Michigan Student AI Lab",
      href: "https://mcommunity.umich.edu",
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
    links: [
      ...site.nav.slice(0, 4).map((n) => ({ label: n.label, href: n.href })),
    ],
  },
  {
    title: "Get involved",
    links: [
      { label: "Join MSAIL", href: site.cta.href },
      { label: "Alumni", href: "/alumni" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

/**
 * Homepage hero content. The headline is stored as styled segments so a
 * maintainer can edit the copy (and which words get the maize highlight / serif
 * italic) without touching the component.
 */
export type HeadlineSegment = { text: string; emphasis?: "highlight" | "italic" };

export const home = {
  eyebrow: "Michigan Student AI Lab",
  location: "Ann Arbor, Michigan",
  stat: "400+ members",
  headline: [
    { text: "A " },
    { text: "student", emphasis: "highlight" },
    { text: " lab for " },
    { text: "artificial intelligence", emphasis: "italic" },
    { text: "." },
  ] satisfies HeadlineSegment[],
  lead: site.tagline,
  pillars: [
    { index: "01", label: "Research", blurb: "Reading groups and replication projects." },
    { index: "02", label: "Education", blurb: "Talks, tutorials, and a curated library." },
    { index: "03", label: "Application", blurb: "Hands-on builds, from CNNs to transformers." },
  ],
} as const;
