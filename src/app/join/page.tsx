import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { ConnectLinks } from "@/components/connect-links";

export const metadata: Metadata = {
  title: "Join",
  description:
    "Join MSAIL: find the Michigan Student AI Lab on Maize Pages and hop into the Slack. Everyone is welcome, regardless of background.",
};

export default function JoinPage() {
  return (
    <PageShell
      title="Join MSAIL"
      lead="The fastest ways in are the MSAIL Slack and Maize Pages — or follow along on the channels below. Everyone is welcome, regardless of background."
    >
      <ConnectLinks />
    </PageShell>
  );
}
