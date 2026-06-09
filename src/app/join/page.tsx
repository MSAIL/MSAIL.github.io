import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";
import { ConnectLinks } from "@/components/connect-links";

export const metadata: Metadata = { title: "Join" };

export default function JoinPage() {
  return (
    <PlaceholderPage
      title="Join MSAIL"
      lead="Two ways in: find the Michigan Student AI Lab on Maize Pages, and hop into the MSAIL Slack. Everyone is welcome, regardless of background."
    >
      <ConnectLinks />
    </PlaceholderPage>
  );
}
