import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Talks" };

export default function TalksPage() {
  return (
    <PlaceholderPage
      title="Talks & Speaker Series"
      lead="An archive of MSAIL talks. Researchers, students, and guests on the ideas shaping modern AI."
    />
  );
}
