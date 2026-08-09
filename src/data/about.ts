import { flag } from "./content-status";

/**
 * About page content. Sources: live homepage "What is MSAIL?" + the live
 * `/aboutus/` page (CONTENT.md §1.1–1.2), captured in `../current-site-backup`.
 *
 * The live roster is a 🚩 PRIORITY refresh target — the current site shows
 * "Copyright MSAIL 2023" and a roster that predates this year's team. Per org
 * leadership, a NEW admin/leadership roster is incoming. So the page renders an
 * "awaiting Matthew" placeholder for the live team, while the OUTGOING roster is
 * preserved here (flagged stale) so nothing is lost in the swap.
 */
export type Person = { name: string; role: string; email: string; linkedin?: string; website?: string };

export const about = {
  /** Verified live mission copy (lightly tightened). */
  mission:
    "MSAIL is a student organization devoted to artificial intelligence research. " +
    "We strive to spread our passion for AI throughout the University of Michigan " +
    "student body, regardless of demographic or academic standing.",

  /** Founded 2008 is confirmed on the live Alumni page; the activities are the live site's own list. */
  history:
    "Founded in 2008, MSAIL runs talks, reading groups, and student projects.",

  /** Live copy claims "over 400 members" — kept but unverified for this year. */
  membership: {
    claim: "A community of 400+ members across the University of Michigan.",
    flag: flag("unverified", 'Live "over 400 members" figure — confirm it still holds this year.'),
  },

  /**
   * Faculty mentor per the live About page. UNVERIFIED for this year (and the
   * "Assistant Professor" rank may be stale by now), so the page withholds it
   * alongside the roster until the incoming team confirms it. Do not render
   * `person` until the flag is resolved to "verified".
   */
  facultyMentor: {
    person: {
      name: "Dr. Wei Hu",
      role: "Assistant Professor, Computer Science & Engineering",
      email: "",
    } satisfies Person,
    flag: flag("unverified", "Live faculty mentor; re-confirm alongside the incoming roster."),
  },

  /**
   * The Fall 2026 leadership team, from Matthew McClure's roster sheet
   * (Drive folder "Fall 2026", sheet last modified 2026-07-31). Emails are
   * published only where the sheet lists one; phone numbers are never
   * published. Headshots exist in the folder but are intentionally held
   * back until the team confirms them.
   */
  roster: {
    flag: flag(
      "verified",
      "Fall 2026 admins per Matthew's roster sheet (2026-07-31). Headshots on hold; Usman Ghani's role not listed in the sheet.",
    ),
    term: "Fall 2026",
    people: [
      { name: "Matthew McClure", role: "President", email: "mattai@umich.edu" },
      { name: "Santosh Desai", role: "Project Lead", email: "" },
      { name: "Dmitriy Ivkov", role: "Project Lead", email: "" },
      { name: "Shamanth Shastry", role: "Industry Project Lead", email: "sshamant@umich.edu" },
      { name: "Sofiya Goncharova", role: "ML News Lead", email: "sogon@umich.edu" },
      { name: "Srinitya Pamulapati", role: "Communications & Finance", email: "" },
      { name: "Sanat Gupta", role: "Website", email: "sanatt@umich.edu", website: "https://thesanatgupta.com" },
      { name: "Usman Ghani", role: "Admin", email: "" },
    ] as Person[],
  },

  /**
   * Outgoing live roster (11 admins + faculty), captured so the swap loses
   * nothing. STALE — do not present as the current team; for migration only.
   */
  outgoingRoster: {
    flag: flag("stale", "Outgoing roster from the live `/aboutus/` page — superseded by incoming team."),
    people: [
      { name: "Nathan Kawamoto", role: "Co-president", email: "njkamoto@umich.edu" },
      { name: "Usman Ghani", role: "Co-president", email: "mghani@umich.edu" },
      { name: "Aman Nagesh", role: "Recruiting / Outreach", email: "amannag@umich.edu" },
      { name: "Nivedhitha Dondati Purushotham", role: "Mentorship & Web Experience Lead", email: "nividp@umich.edu" },
      { name: "Abubakar Siddi", role: "Industry Project Lead", email: "siddiq@umich.edu" },
      { name: "Grace Wu", role: "Industry Project Co-Lead", email: "gracejwu@umich.edu" },
      { name: "Yuchen Wang", role: "Project Lead", email: "wangyuch@umich.edu" },
      { name: "David Smith", role: "Project Lead", email: "smitd@umich.edu" },
      { name: "Omkar Nayak", role: "Education", email: "omkarn@umich.edu" },
      { name: "Sathvika A", role: "Industry Project Coordinator", email: "sayyappr@umich.edu" },
      { name: "Alexander Bowler", role: "ML Papers and News", email: "albowler@umich.edu" },
    ] satisfies Person[],
  },
} as const;

export type About = typeof about;
