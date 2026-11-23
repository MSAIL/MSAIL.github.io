import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { CtaLink } from "@/components/cta-link";

export const metadata: Metadata = {
  title: "Page not found",
  // The 404 stands in for whatever path was asked for, so it must not claim a
  // canonical URL or a Markdown copy (alternates is replaced, not merged).
  robots: { index: false, follow: true },
  alternates: {},
};

export default function NotFound() {
  return (
    <PageShell title="Page not found" lead="That page doesn't exist.">
      <div className="mt-10">
        <CtaLink href="/" variant="outline">
          Back to the homepage
        </CtaLink>
      </div>
    </PageShell>
  );
}
