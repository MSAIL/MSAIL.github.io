import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Initiatives" };

export default function InitiativesPage() {
  return (
    <PlaceholderPage
      title="Projects & Initiatives"
      lead="The projects, reading groups, and hands-on tracks you can join this term, from replicating architectures to laid-back paper discussions."
    />
  );
}
