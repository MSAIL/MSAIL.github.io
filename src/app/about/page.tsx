import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { AwaitingNotice, SectionHeading } from "@/components/content-blocks";
import { ArrowIcon } from "@/components/icons";
import { about } from "@/data/about";

export const metadata: Metadata = {
  title: "About",
  description:
    "What MSAIL is: a student organization devoted to AI research at the University of Michigan, founded in 2008.",
};

export default function AboutPage() {
  return (
    <PageShell title="About MSAIL" lead={about.mission}>
      <div className="mt-10 flex flex-col gap-10">
        <p className="max-w-prose text-body text-muted">{about.history}</p>

        {/* The mentor + roster are withheld together until the incoming team
            confirms both (the captured data is flagged unverified/stale). */}
        <section className="flex flex-col gap-4">
          <SectionHeading>Leadership &amp; faculty mentor</SectionHeading>
          <AwaitingNotice label="New roster incoming">{about.roster.notice}</AwaitingNotice>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading>Governance</SectionHeading>
          <Link
            href="/constitution"
            className="group inline-flex w-fit min-h-11 items-center gap-2 border-t border-border pt-4 text-body text-ink transition-colors hover:text-navy hover:underline"
          >
            Read the MSAIL constitution
            <ArrowIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </section>
      </div>
    </PageShell>
  );
}
