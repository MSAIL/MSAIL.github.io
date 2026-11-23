import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { pageMetadata } from "@/lib/page-metadata";
import { ConnectLinks } from "@/components/connect-links";

export const metadata: Metadata = pageMetadata("join");

export default function JoinPage() {
  return (
    <PageShell page="join">
      <ConnectLinks />
    </PageShell>
  );
}
