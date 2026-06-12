import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <PageShell
      title="Page not found"
      lead="That route doesn't exist yet. Head back to the homepage or pick a section from the navigation."
      note="Lost? Use the navigation above to get back on track."
    />
  );
}
