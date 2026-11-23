import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { pageMetadata } from "@/lib/page-metadata";
import { AwaitingNotice } from "@/components/content-blocks";
import { sponsorsMeta } from "@/data/sponsors";

export const metadata: Metadata = pageMetadata("sponsors");

export default function SponsorsPage() {
  return (
    <PageShell page="sponsors">
      <div className="mt-10">
        <AwaitingNotice label="Sponsorship details incoming">
          {sponsorsMeta.notice}
        </AwaitingNotice>
      </div>
    </PageShell>
  );
}
