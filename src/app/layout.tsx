import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageTransition } from "@/components/page-transition";

/**
 * No-FOUC theme init: applies a saved "light" choice before first paint. Dark
 * is the default, so the common case needs no work and never flashes.
 */
const themeInit = `(function(){try{var t=localStorage.getItem('msail-theme');if(t==='light'){document.documentElement.setAttribute('data-theme','light');}else{document.documentElement.removeAttribute('data-theme');}}catch(e){}})();`;

/**
 * One variable grotesk for the whole site. Archivo ships a width axis (wdth
 * 62–125), so the same family covers body text (normal width) and the wide
 * "expanded" display masthead via `font-stretch: 125%` (see the `expanded`
 * utility in globals.css). One family, two voices.
 */
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-archivo",
});

/** A genuinely clean lab mono for eyebrows, labels, section numbers, and meta. */
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
  themeColor: "#070a0f",
  colorScheme: "dark light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${plexMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:border focus:border-border focus:bg-surface focus:px-4 focus:py-2 focus:text-label focus:text-foreground"
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
