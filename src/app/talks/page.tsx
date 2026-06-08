import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Talks" };

export default function TalksPage() {
  return (
    <PlaceholderPage
      index="03"
      eyebrow="Talks"
      title="Talks & Speaker Series"
      lead="An archive of MSAIL talks — researchers, students, and guests on the ideas shaping modern AI."
    />
  );
}
