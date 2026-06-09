/**
 * Shared presentational blocks for the data-driven content pages: a section
 * heading and an "awaiting fresh content" notice for sections whose real content
 * is still incoming (roster, initiatives, sponsors, alumni outcomes/photos).
 */

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-display text-h3 font-bold text-ink">{children}</h2>
  );
}

/** A tasteful placeholder for content that's intentionally not landed yet. */
export function AwaitingNotice({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-dashed border-border-strong bg-paper-deep px-5 py-5">
      <p className="text-meta font-semibold uppercase tracking-[0.12em] text-maize-deep">
        {label}
      </p>
      <p className="mt-2 max-w-prose text-body text-muted">{children}</p>
    </div>
  );
}
