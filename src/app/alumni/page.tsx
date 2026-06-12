import type { Metadata } from "next";
import Image from "next/image";
import { PageShell } from "@/components/page-shell";
import { alumni, alumniMeta } from "@/data/alumni";

export const metadata: Metadata = {
  title: "Alumni",
  description:
    "Past members of MSAIL, the Michigan Student Artificial Intelligence Lab, going back to 2008.",
};

/** "Robert Aung" -> "RA"; fallback tile for anyone without a portrait. */
function initials(name: string): string {
  const parts = name.split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

export default function AlumniPage() {
  return (
    <PageShell title="Alumni" lead={alumniMeta.intro}>
      <ul className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
        {alumni.map((a) => (
          <li key={a.name} className="flex flex-col gap-4 border-t border-border pt-5">
            {a.photo ? (
              <Image
                src={a.photo}
                alt={`Portrait of ${a.name}`}
                width={320}
                height={320}
                className="h-28 w-28 rounded-sm object-cover"
              />
            ) : (
              /* No portrait on file for this person — show initials, never a
                 stand-in photo. */
              <div
                aria-hidden
                className="flex h-28 w-28 items-center justify-center rounded-sm bg-paper-deep font-display text-h3 text-faint"
              >
                {initials(a.name)}
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-body font-semibold text-ink">{a.name}</span>
              <span className="text-meta text-muted">{a.term}</span>
            </div>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
