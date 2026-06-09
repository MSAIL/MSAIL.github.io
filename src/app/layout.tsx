import type { Metadata, Viewport } from "next";
import { Inter, Anton, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageTransition } from "@/components/page-transition";

/* Body + UI text: clean, readable. */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/* Display headlines + the MSAIL wordmark: Anton (display-only, single weight). */
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-anton",
});

/* Small metadata labels. */
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-plex-mono",
});

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
      className={`${inter.variable} ${anton.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-sm focus:border focus:border-border focus:bg-paper-raised focus:px-4 focus:text-label focus:text-ink"
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
