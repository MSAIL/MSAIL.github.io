import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";
import { ConnectLinks } from "@/components/connect-links";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <PlaceholderPage
      title="Contact"
      lead="Reach the MSAIL admin team at msail-admin@umich.edu, or find us on Slack, Maize Pages, and Instagram."
    >
      <ConnectLinks />
    </PlaceholderPage>
  );
}
