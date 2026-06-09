import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Sponsors" };

export default function SponsorsPage() {
  return (
    <PlaceholderPage
      title="Sponsor MSAIL"
      lead="Partner with one of the largest student AI communities at the University of Michigan. Sponsorship and collaboration details land here soon."
    />
  );
}
