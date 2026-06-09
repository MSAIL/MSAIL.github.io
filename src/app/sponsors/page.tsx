import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";
import { AwaitingNotice } from "@/components/content-blocks";
import { sponsorsMeta } from "@/data/sponsors";

export const metadata: Metadata = { title: "Sponsors" };

export default function SponsorsPage() {
  return (
    <PlaceholderPage
      title="Sponsor MSAIL"
      lead="Partner with one of the largest student AI communities at the University of Michigan. Reach hundreds of students building and researching in AI."
    >
      <div className="mt-10">
        <AwaitingNotice label="Sponsorship details coming soon">
          {sponsorsMeta.flag.note}
        </AwaitingNotice>
      </div>
    </PlaceholderPage>
  );
}
