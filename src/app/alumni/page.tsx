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
      {/* Same card skeleton and grid as the About page's leadership cards, in
          an archival register: warmer glass, portraits toned like older
          prints, and the sunset avatar faded for anyone without a photo. */}
      <ul className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
        {alumni.map((a) => (
          <li
            key={a.name}
            className="flex flex-col overflow-hidden rounded-xl border border-[#efe6cd]/80 bg-[#fdf8ec]/45 text-center shadow-card backdrop-blur-md"
          >
            {a.photo ? (
              // alt stays empty: the name is the very next text node.
              <Image
                src={a.photo}
                alt=""
                width={320}
                height={320}
                className="aspect-square w-full object-cover [filter:sepia(0.14)_saturate(0.88)]"
              />
            ) : (
              /* No portrait on file for this person — show initials, never a
                 stand-in photo. */
              <div
                aria-hidden
                className="avatar-fallback-alumni flex aspect-square w-full items-center justify-center text-[3.25rem] font-bold text-white"
              >
                {initials(a.name)}
              </div>
            )}
            <div className="flex flex-col gap-0.5 px-4 pb-5 pt-4">
              <span className="text-body font-semibold text-ink">{a.name}</span>
              <span className="text-meta text-ink-2">{a.term}</span>
            </div>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}
