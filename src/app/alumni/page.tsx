import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Alumni" };

export default function AlumniPage() {
  return (
    <PlaceholderPage
      title="Alumni"
      lead="Where MSAIL members have gone. The people who learned, built, and researched with us, and what they went on to do."
    />
  );
}
