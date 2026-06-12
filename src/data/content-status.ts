/**
 * Provenance + freshness flags for the typed content layer.
 *
 * Every piece of migrated content carries where it came from and how much to
 * trust it, so a future maintainer (and the next redesign) can tell verified
 * history from stale copy from "not landed yet" at a glance — in the data, not
 * buried in a doc. Sources of truth: CONTENT.md (live-site inventory) and the
 * `../current-site-backup` capture of msail.github.io.
 */
export type ContentStatus =
  /** Confirmed against the live-site backup or CONTENT.md. Safe to publish. */
  | "verified"
  /** Real but known-outdated — carry forward, but it needs a refresh. */
  | "stale"
  /** Captured, but a spelling / email alias / date isn't independently confirmed. */
  | "unverified"
  /** Intentionally empty — fresh content is incoming from Matthew. */
  | "awaiting";

/**
 * INTERNAL ONLY. `note` is maintainer-facing provenance — never render it in
 * page JSX. Pages show the separate, user-facing `notice` strings that the
 * data files export alongside their flags.
 */
export type Flag = { status: ContentStatus; note: string };

/** Standard internal note for sections whose real content is incoming. */
export const AWAITING_REFRESH =
  "Fresh content is incoming from org leadership — this refresh is in progress.";

export const flag = (status: ContentStatus, note: string): Flag => ({ status, note });
