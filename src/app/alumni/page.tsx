import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";
import { AwaitingNotice } from "@/components/content-blocks";
import { alumni, alumniMeta } from "@/data/alumni";

export const metadata: Metadata = { title: "Alumni" };

export default function AlumniPage() {
  return (
    <PlaceholderPage title="Alumni" lead={alumniMeta.intro}>
      <ul className="mt-10 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        {alumni.map((a) => (
          <li key={a.name} className="flex flex-col border-t border-border py-3">
            <span className="text-body font-semibold text-ink">{a.name}</span>
            <span className="text-meta text-muted">{a.term}</span>
            {a.outcome ? <span className="text-meta text-faint">{a.outcome}</span> : null}
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-col gap-4">
        <AwaitingNotice label="Member outcomes — coming soon">
          {alumniMeta.outcomesFlag.note}
        </AwaitingNotice>
        <AwaitingNotice label="Portraits — coming soon">
          {alumniMeta.photosFlag.note}
        </AwaitingNotice>
      </div>
    </PlaceholderPage>
  );
}
