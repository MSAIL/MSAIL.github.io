import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { AwaitingNotice } from "@/components/content-blocks";
import { initiativesMeta } from "@/data/initiatives";

export const metadata: Metadata = {
  title: "Initiatives",
  description:
    "The projects and reading groups MSAIL runs at the University of Michigan.",
};

export default function InitiativesPage() {
  return (
    <PageShell
      title="Projects & Initiatives"
      lead="The projects and reading groups you can join this term."
    >
      <div className="mt-10">
        <AwaitingNotice label="New initiatives incoming">
          {initiativesMeta.notice}
        </AwaitingNotice>
      </div>
    </PageShell>
  );
}
