import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Resources" };

export default function ResourcesPage() {
  return (
    <PlaceholderPage
      title="Resource Library"
      lead="A curated library for learning AI and ML, with foundational courses, campus involvement, conferences, and meta-skills for research."
    />
  );
}
