import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Join" };

export default function JoinPage() {
  return (
    <PlaceholderPage
      title="Join MSAIL"
      lead="Two ways in: join the Michigan Student AI Lab MCommunity group, and hop into the MSAIL Slack. Everyone is welcome, regardless of background."
    />
  );
}
