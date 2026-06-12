import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { ConnectLinks } from "@/components/connect-links";

export const metadata: Metadata = {
  title: "Join",
  description:
    "How to join MSAIL: the Slack workspace, Maize Pages, and our other channels. Everyone is welcome.",
};

export default function JoinPage() {
  return (
    <PageShell
      title="Join MSAIL"
      lead="Join the MSAIL Slack and find us on Maize Pages, or follow us on the channels below. Everyone is welcome."
    >
      <ConnectLinks />
    </PageShell>
  );
}
