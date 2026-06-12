import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { AwaitingNotice } from "@/components/content-blocks";
import { initiativesMeta } from "@/data/initiatives";

export const metadata: Metadata = {
  title: "Initiatives",
  description:
    "MSAIL projects, reading groups, and hands-on tracks — from replicating architectures to laid-back paper discussions.",
};

export default function InitiativesPage() {
  return (
    <PageShell
      title="Projects & Initiatives"
      lead="The projects, reading groups, and hands-on tracks you can join this term — from replicating architectures to laid-back paper discussions."
    >
      <div className="mt-10">
        <AwaitingNotice label="New initiatives incoming">
          {initiativesMeta.notice}
        </AwaitingNotice>
      </div>
    </PageShell>
  );
}
