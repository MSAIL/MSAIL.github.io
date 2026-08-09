/**
 * Shared presentational blocks for the data-driven content pages: a section
 * heading and an "awaiting fresh content" notice for sections whose real
 * content is still incoming (roster, initiatives, sponsors).
 */

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-h3 text-navy">{children}</h2>;
}

/** A quiet placeholder for content that's intentionally not landed yet. */
export function AwaitingNotice({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-tile px-6 py-5">
      <p className="text-meta text-navy">{label}</p>
      <p className="mt-2 max-w-prose text-body text-ink-2">{children}</p>
    </div>
  );
}
