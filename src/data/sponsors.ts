import type { Flag } from "./content-status";
import { flag, AWAITING_MATTHEW } from "./content-status";

/**
 * Sponsors / partners (CONTENT.md §3: missing-but-expected).
 *
 * No sponsor content exists on the live site. The page invites partnership and
 * holds an "awaiting Matthew" placeholder until sponsor names/logos are provided.
 */
export const sponsorsMeta: { flag: Flag } = {
  flag: flag("awaiting", "No sponsors on the live site yet; names/logos pending. " + AWAITING_MATTHEW),
};
