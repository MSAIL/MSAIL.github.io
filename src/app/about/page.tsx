import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <PlaceholderPage
      title="About MSAIL"
      lead="Who we are, our admin team, and faculty mentors. A student organization devoted to artificial intelligence at the University of Michigan."
    />
  );
}
