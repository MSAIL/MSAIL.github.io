import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Alumni" };

export default function AlumniPage() {
  return (
    <PlaceholderPage
      index="05"
      eyebrow="Alumni"
      title="Alumni"
      lead="Where MSAIL members have gone — the people who learned, built, and researched with us, and what they went on to do."
    />
  );
}
