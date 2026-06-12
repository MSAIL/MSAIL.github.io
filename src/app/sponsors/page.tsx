import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { AwaitingNotice } from "@/components/content-blocks";
import { sponsorsMeta } from "@/data/sponsors";

export const metadata: Metadata = {
  title: "Sponsors",
  description:
    "Partner with MSAIL — reach hundreds of University of Michigan students building and researching in AI.",
};

export default function SponsorsPage() {
  return (
    <PageShell
      title="Sponsor MSAIL"
      lead="Partner with one of the largest student AI communities at the University of Michigan. Reach hundreds of students building and researching in AI."
    >
      <div className="mt-10">
        <AwaitingNotice label="Sponsorship details coming soon">
          {sponsorsMeta.notice}
        </AwaitingNotice>
      </div>
    </PageShell>
  );
}
