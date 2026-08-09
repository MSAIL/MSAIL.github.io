import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { CtaLink } from "@/components/cta-link";

export const metadata: Metadata = { title: "Page not found" };

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
