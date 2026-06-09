/**
 * Shared route scaffold for the shell: a thick maize rule, a bold display title,
 * an optional lead, and a small "in progress" note. Real page sections replace
 * the placeholder body later; this only proves the shell renders across routes.
 */
export function PlaceholderPage({
  title,
  lead,
  note = "This section is in progress. Content lands here next.",
}: {
  title: string;
  lead?: string;
  note?: string;
}) {
  return (
    <section className="container-bleed flex flex-1 flex-col py-section-sm sm:py-section">
      <div className="h-1 w-20 bg-maize" />

      <h1 className="font-display mt-7 max-w-[18ch] text-h1 font-extrabold text-ink">{title}</h1>

      {lead ? <p className="mt-6 max-w-prose text-lead text-muted">{lead}</p> : null}

      <p className="mt-12 border-t border-border pt-6 text-meta text-faint">{note}</p>
    </section>
  );
}
