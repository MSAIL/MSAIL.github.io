import type { Flag } from "./content-status";
import { flag, AWAITING_REFRESH } from "./content-status";

/**
 * Projects & Initiatives (CONTENT.md §1.3) — a 🚩 PRIORITY refresh target.
 *
 * The live page lists only 4 description-only cards with no status, term, or
 * outcomes, and overlaps the "ML Discussion" page. Per org leadership, fresh
 * initiatives are incoming, so the page renders an "awaiting Matthew"
 * placeholder. The OUTGOING set is preserved here (flagged stale) for migration.
 */
export type Initiative = {
  name: string;
  description: string;
  level: string;
  /** Outgoing lead — re-confirm or replace with the incoming roster. */
  lead: string;
};

export const initiativesMeta: { flag: Flag; notice: string } = {
  flag: flag("awaiting", "New initiatives incoming. " + AWAITING_REFRESH),
  /** User-facing copy for the placeholder (the flag note stays internal). */
  notice:
    "We're putting together this term's projects and reading groups. Join " +
    "the Slack to hear about them first.",
};

/** Outgoing live initiatives — STALE; carry-forward reference only. */
export const outgoingInitiatives: { flag: Flag; items: Initiative[] } = {
  flag: flag("stale", "Outgoing live initiatives (no status/term/repos); refresh with incoming set."),
  items: [
    { name: "Transformer Project", description: "Replicate the GPT-2 transformer architecture and build it into a personal project.", level: "Advanced", lead: "Yuchen Wang" },
    { name: "CNN Project", description: "Replicate a CNN architecture from scratch and build it into a personal project.", level: "Beginner", lead: "David Smith" },
    { name: "Education", description: "Earn certifications from DeepLearning.AI in a drop-in format.", level: "Open / drop-in", lead: "Omkar Nayak" },
    { name: "ML News", description: "Laid-back paper and machine-learning news discussion (overlaps the ML Discussion group).", level: "Open / drop-in", lead: "Alexander Bowler" },
  ],
};
