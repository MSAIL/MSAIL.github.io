import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { ConnectLinks } from "@/components/connect-links";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach the MSAIL admin team at msail-admin@umich.edu, or find us on Slack, Maize Pages, Instagram, and LinkedIn.",
};

export default function ContactPage() {
  return (
    <PageShell
      title="Contact"
      lead="Reach the MSAIL admin team at msail-admin@umich.edu, or find us on Slack, Maize Pages, Instagram, and LinkedIn."
    >
      <ConnectLinks />
    </PageShell>
  );
}
