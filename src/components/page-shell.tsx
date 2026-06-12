/**
 * Shared route scaffold for every content page: a thick maize rule, a bold
 * display title, an optional lead, the page body, and an optional small
 * footnote (only rendered when a page passes one).
 */
export function PageShell({
  title,
  lead,
  note,
  children,
}: {
  title: string;
  lead?: string;
  note?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="container-bleed flex flex-1 flex-col py-section-sm sm:py-section">
      <div className="h-1 w-20 bg-maize" />

      <h1 className="font-display mt-7 max-w-[18ch] text-h1 text-ink">{title}</h1>

      {lead ? <p className="mt-6 max-w-prose text-lead text-muted">{lead}</p> : null}

      {children}

      {note ? (
        <p className="mt-12 border-t border-border pt-6 text-meta text-faint">{note}</p>
      ) : null}
    </section>
  );
}
