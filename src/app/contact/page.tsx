import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <PlaceholderPage
      index="06"
      eyebrow="Contact"
      title="Contact"
      lead="Reach the MSAIL admin team at msail-admin@umich.edu, or find us on Slack and MCommunity."
    />
  );
}
