/**
 * Shared route scaffold for the shell. Renders a page's masthead (mono section
 * index + maize accent, expanded display title, optional lead) and an explicit
 * "in progress" state with a pulsing maize signal dot. Real page sections will
 * replace the placeholder body later — this only proves the shell across routes.
 */
export function PlaceholderPage({
  index,
  eyebrow,
  title,
  lead,
  note = "Section in progress — content lands here next",
}: {
  index: string;
  eyebrow: string;
  title: string;
  lead?: string;
  note?: string;
}) {
  return (
    <section className="container-bleed flex flex-1 flex-col py-section-sm sm:py-section">
      <p className="eyebrow">
        <span className="text-maize">{index}</span>
        <span className="mx-2 text-border-strong">/</span>
        {eyebrow}
      </p>

      <h1 className="expanded mt-5 max-w-[18ch] text-h1 font-bold text-foreground">
        {title}
        <span className="maize-period" aria-hidden />
      </h1>

      {lead ? <p className="mt-6 max-w-prose text-lead text-muted">{lead}</p> : null}

      <div className="mt-12 flex items-center gap-3 border-t border-border pt-6">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-maize motion-safe:animate-pulse"
          aria-hidden
        />
        <p className="eyebrow text-faint">{note}</p>
      </div>
    </section>
  );
}
