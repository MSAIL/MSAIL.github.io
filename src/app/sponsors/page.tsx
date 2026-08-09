import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { AwaitingNotice } from "@/components/content-blocks";
import { sponsorsMeta } from "@/data/sponsors";

export const metadata: Metadata = {
  title: "Sponsors",
  description:
    "Sponsor MSAIL and reach hundreds of University of Michigan students working in AI.",
};

export default function SponsorsPage() {
  return (
    <PageShell
      title="Sponsor MSAIL"
      lead="Reach hundreds of Michigan students who build and research AI."
    >
      <div className="mt-10">
        <AwaitingNotice label="Sponsorship details incoming">
          {sponsorsMeta.notice}
        </AwaitingNotice>
      </div>
    </PageShell>
  );
}
