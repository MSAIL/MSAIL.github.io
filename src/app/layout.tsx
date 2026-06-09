import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Bricolage_Grotesque, Space_Grotesk, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { displayFont } from "@/data/site";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageTransition } from "@/components/page-transition";

/* Display option A (default): a bold grotesk with real character. Used heavy. */
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-bricolage",
});

/* Display option B: the alternative. Flip via `displayFont` in src/data/site.ts. */
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

/* Text: a clean, warm grotesk. */
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hanken",
});

/* Small labels / metadata. */
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-plex-mono",
});

const displayFamily =
  displayFont === "space" ? "var(--font-space-grotesk)" : "var(--font-bricolage)";

export const metadata: Metadata = {
  metadataBase: new URL("https://msail.github.io"),
  title: {
    default: "MSAIL · Michigan Student Artificial Intelligence Lab",
    template: "%s · MSAIL",
  },
  description:
    "The Michigan Student Artificial Intelligence Lab (MSAIL) is a student community for AI research at the University of Michigan.",
  keywords: [
    "MSAIL",
    "Michigan Student Artificial Intelligence Lab",
    "University of Michigan",
    "artificial intelligence",
    "machine learning",
    "student organization",
  ],
  icons: {
    icon: "/msail-mark.png",
    apple: "/msail-mark.png",
  },
  openGraph: {
    title: "MSAIL · Michigan Student Artificial Intelligence Lab",
    description:
      "A student community for AI research at the University of Michigan.",
    url: "https://msail.github.io",
    siteName: "MSAIL",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#00274c",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${spaceGrotesk.variable} ${hanken.variable} ${plexMono.variable} h-full antialiased`}
      style={{ "--font-display-active": displayFamily } as CSSProperties}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:border focus:border-border focus:bg-paper-raised focus:px-4 focus:py-2 focus:text-label focus:text-ink"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex flex-1 flex-col">
          <PageTransition>{children}</PageTransition>
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
