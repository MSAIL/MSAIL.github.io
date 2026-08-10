/**
 * Shared route scaffold for every content page: the title and lead open on an
 * ink band (the resin field after dusk, matching the hero and footer), then
 * the body runs on the light ground, with an optional small footnote (only
 * rendered when a page passes one).
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
    <>
      {/* -mt-20 tucks the band behind the floating nav so the ink reaches the
          top of the viewport; data-nav-ink tells the nav to run light here. */}
      <section data-nav-ink className="ground-ink -mt-20">
        <div className="container-page pb-10 pt-32 sm:pb-14 sm:pt-36">
          <h1 className="font-display max-w-[22ch] text-h1 text-on-navy">{title}</h1>
          {lead ? <p className="mt-5 max-w-prose text-lead text-on-navy-muted">{lead}</p> : null}
        </div>
      </section>

      <section className="container-page flex flex-1 flex-col pb-section-sm pt-10 sm:pb-24 sm:pt-12">
        {children}

        {note ? (
          <p className="mt-14 border-t border-border pt-5 text-meta text-ink-3">{note}</p>
        ) : null}
      </section>
    </>
  );
}
