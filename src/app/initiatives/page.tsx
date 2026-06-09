import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";
import { AwaitingNotice } from "@/components/content-blocks";
import { initiativesMeta } from "@/data/initiatives";

export const metadata: Metadata = { title: "Initiatives" };

export default function InitiativesPage() {
  return (
    <PlaceholderPage
      title="Projects & Initiatives"
      lead="The projects, reading groups, and hands-on tracks you can join this term — from replicating architectures to laid-back paper discussions."
    >
      <div className="mt-10">
        <AwaitingNotice label="New initiatives incoming">
          {initiativesMeta.flag.note}
        </AwaitingNotice>
      </div>
    </PlaceholderPage>
  );
}
