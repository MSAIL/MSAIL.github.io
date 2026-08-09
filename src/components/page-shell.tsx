/**
 * Shared route scaffold for every content page: a serif display title, an
 * optional lead, the page body, and an optional small footnote (only rendered
 * when a page passes one).
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
    <section className="container-page flex flex-1 flex-col py-section-sm sm:py-24">
      <h1 className="font-display max-w-[22ch] text-h1 text-navy">{title}</h1>

      {lead ? <p className="mt-5 max-w-prose text-lead text-ink-2">{lead}</p> : null}

      {children}

      {note ? (
        <p className="mt-14 border-t border-border pt-5 text-meta text-ink-3">{note}</p>
      ) : null}
    </section>
  );
}
