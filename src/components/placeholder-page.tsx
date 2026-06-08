/**
 * Shared route scaffold for the shell: a mono section index, a thick maize rule,
 * an expanded serif title, optional lead, and an explicit "in progress" note.
 * Real page sections replace the placeholder body later — this only proves the
 * shell renders consistently across routes.
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
      <p className="eyebrow text-faint">
        {index} — {eyebrow}
      </p>

      <div className="mt-5 h-1 w-16 bg-maize" />

      <h1 className="font-display mt-7 max-w-[18ch] text-h1 font-semibold text-ink">{title}</h1>

      {lead ? <p className="mt-6 max-w-prose text-lead text-muted">{lead}</p> : null}

      <p className="eyebrow mt-12 border-t border-border pt-6 text-faint">{note}</p>
    </section>
  );
}
