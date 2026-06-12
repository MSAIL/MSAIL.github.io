import type { Flag } from "./content-status";
import { flag, AWAITING_REFRESH } from "./content-status";

/**
 * Sponsors / partners (CONTENT.md §3: missing-but-expected).
 *
 * No sponsor content exists on the live site. The page invites partnership and
 * holds a placeholder until sponsor names/logos are provided.
 */
export const sponsorsMeta: { flag: Flag; notice: string } = {
  flag: flag("awaiting", "No sponsors on the live site yet; names/logos pending. " + AWAITING_REFRESH),
  /** User-facing copy for the placeholder (the flag note stays internal). */
  notice:
    "We're putting sponsorship details together. Interested in partnering? " +
    "Email msail-admin@umich.edu.",
};
