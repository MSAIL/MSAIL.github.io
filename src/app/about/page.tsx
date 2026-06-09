import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";
import { AwaitingNotice, SectionHeading } from "@/components/content-blocks";
import { about } from "@/data/about";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <PlaceholderPage title="About MSAIL" lead={about.mission}>
      <div className="mt-10 flex flex-col gap-10">
        <p className="max-w-prose text-body text-muted">{about.history}</p>

        <section className="flex flex-col gap-4">
          <SectionHeading>Faculty mentor</SectionHeading>
          <div className="border-t border-border pt-4">
            <p className="text-body font-semibold text-ink">{about.facultyMentor.person.name}</p>
            <p className="text-meta text-muted">{about.facultyMentor.person.role}</p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionHeading>Admin team</SectionHeading>
          <AwaitingNotice label="Roster refresh in progress">
            {about.roster.flag.note}
          </AwaitingNotice>
        </section>
      </div>
    </PlaceholderPage>
  );
}
