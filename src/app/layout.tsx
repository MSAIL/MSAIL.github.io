import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageTransition } from "@/components/page-transition";

/** Display: characterful editorial serif, with the optical-size axis enabled so
 *  big headlines get Fraunces' dramatic high-contrast cut (see globals.css). */
const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-fraunces",
});

/** Text: a clean, warm grotesk. */
const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hanken",
});

/** Labels / metadata. */
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-plex-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://msail.github.io"),
  title: {
    default: "MSAIL — Michigan Student AI Lab",
    template: "%s · MSAIL",
  },
  description:
    "The Michigan Student AI Lab (MSAIL) is a student organization at the University of Michigan exploring artificial intelligence through education, application, and research.",
  keywords: [
    "MSAIL",
    "Michigan Student AI Lab",
    "University of Michigan",
    "artificial intelligence",
    "machine learning",
    "student organization",
  ],
  openGraph: {
    title: "MSAIL — Michigan Student AI Lab",
    description:
      "A student organization at the University of Michigan exploring AI through education, application, and research.",
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
      className={`${fraunces.variable} ${hanken.variable} ${plexMono.variable} h-full antialiased`}
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
