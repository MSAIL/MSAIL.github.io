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

/* Small metadata labels. Only 400 is ever rendered; don't ship unused weights. */
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: "400",
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
  // Icons come from the src/app/icon.png + apple-icon.png file conventions.
  // "./" resolves against each route's own pathname (with the trailing slash
  // from trailingSlash: true), so every page gets a correct canonical + og:url
  // — and og:title/twitter:title derive from each page's templated <title>.
  alternates: {
    canonical: "./",
  },
  openGraph: {
    description:
      "A student community for AI research at the University of Michigan.",
    url: "./",
    siteName: "MSAIL",
    type: "website",
    images: [
      {
        url: "/og.jpg",
        width: 1200,
        height: 630,
        alt: "MSAIL: Michigan Student Artificial Intelligence Lab",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
};

/** Organization schema for search engines (rendered once in the root layout). */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Michigan Student Artificial Intelligence Lab",
  alternateName: "MSAIL",
  url: "https://msail.github.io",
  logo: "https://msail.github.io/msail-mark.png",
  email: "msail-admin@umich.edu",
  foundingDate: "2008",
  sameAs: [
    "https://www.instagram.com/michiganailab/",
    "https://www.linkedin.com/company/msail1/",
    "https://maizepages.umich.edu/organization/msail",
  ],
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
        {/* tabIndex lets the skip link actually move focus here. */}
        <main id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none">
          <PageTransition>{children}</PageTransition>
        </main>
        <SiteFooter />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
