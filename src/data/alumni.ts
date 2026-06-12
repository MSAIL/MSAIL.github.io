import type { Flag } from "./content-status";
import { flag, AWAITING_REFRESH } from "./content-status";

/**
 * Alumni — VERIFIED names + membership terms, captured from the live Alumni page
 * (`../current-site-backup/alumni/`). 15 past members.
 *
 * Flagged gap (CONTENT.md §1.9 / §3): the live page lists names + dates but NO
 * outcomes (company / grad school / role). "Where they went" is the single
 * highest-value recruiting add, so `outcome` is modeled here but left null
 * pending fresh info from org leadership + an alumni call-out. Portraits were
 * carried over from the backup gallery (see `photosFlag`).
 */
export type Alum = {
  name: string;
  /** Membership term(s), verbatim from the live page. */
  term: string;
  /** Where they went — MISSING on the live site; null until collected. */
  outcome: string | null;
  /**
   * Portrait under public/alumni/ (uniform 320×320 square crops, carried over
   * from the live-site backup's alumni gallery). null = no portrait exists for
   * this person yet — the page renders an initials tile, never a substitute photo.
   */
  photo: string | null;
};

export const alumni: Alum[] = [
  { name: "Robert Aung", term: "Fall 2020", outcome: null, photo: "/alumni/robert-aung.jpg" },
  { name: "Andrew Awad", term: "Winter 2021", outcome: null, photo: "/alumni/andrew-awad.jpg" },
  { name: "Kierra Davis", term: "Winter 2021", outcome: null, photo: "/alumni/kierra-davis.jpg" },
  { name: "Nikhil Devraj", term: "Fall 2020", outcome: null, photo: "/alumni/nikhil-devraj.jpg" },
  { name: "Isaac Fung", term: "Winter 2022", outcome: null, photo: "/alumni/isaac-fung.jpg" },
  { name: "Abhay Shakhapur", term: "Winter 2024", outcome: null, photo: "/alumni/abhay-shakhapur.jpg" },
  { name: "Andrew Li", term: "Winter 2024", outcome: null, photo: "/alumni/andrew-li.jpg" },
  { name: "Anthony Liang", term: "Winter 2020 (BS), Winter 2021 (MS)", outcome: null, photo: "/alumni/anthony-liang.jpg" },
  { name: "Patrick Morgan", term: "Winter 2021", outcome: null, photo: "/alumni/patrick-morgan.jpg" },
  { name: "Ashwin Sreevatsa", term: "Winter 2022", outcome: null, photo: "/alumni/ashwin-sreevatsa.jpg" },
  { name: "Sean Stapleton", term: "Fall 2020", outcome: null, photo: "/alumni/sean-stapleton.jpg" },
  { name: "Kevin Wang", term: "Fall 2021", outcome: null, photo: "/alumni/kevin-wang.jpg" },
  { name: "Nina Li", term: "Winter 2023", outcome: null, photo: "/alumni/nina-li.jpg" },
  { name: "Chloe Snyders", term: "Winter 2023", outcome: null, photo: "/alumni/chloe-snyders.jpg" },
  { name: "William Wang", term: "Winter 2024", outcome: null, photo: "/alumni/william-wang.jpg" },
];

export const alumniMeta: {
  intro: string;
  outcomesFlag: Flag;
  outcomesNotice: string;
  photosFlag: Flag;
} = {
  // Verified live copy (lightly tightened).
  intro:
    "MSAIL dates back to 2008, with a long line of members who went on to do " +
    "great things across research and industry. Are you a past member? Let the " +
    "admin team know and we'll feature you here.",
  outcomesFlag: flag(
    "awaiting",
    "Member outcomes (company / grad school / role) are MISSING on the live site " +
      "and are the highest-ROI recruiting add. " + AWAITING_REFRESH,
  ),
  /** User-facing copy for the placeholder (the flag note stays internal). */
  outcomesNotice:
    "We're collecting where MSAIL alumni have landed — companies, grad schools, " +
    "and roles will appear here soon. Alumni: email msail-admin@umich.edu to be featured.",
  photosFlag: flag(
    "verified",
    "All 15 portraits carried over 2026-06-11 from ../current-site-backup/alumni/portraits/ " +
      "(filename + adjacent-name mapping verified against the old page HTML), " +
      "normalized to 320×320 squares in public/alumni/.",
  ),
};
