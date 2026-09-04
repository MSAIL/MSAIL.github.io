import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/* Google Analytics 4 measurement ID (property "msail.github.io" under the
   MSAIL account). Empty string = no analytics script is rendered at all. */
const GA_ID = "G-RJWNYW6P41";

/* UI + body text: Satoshi (Fontshare), self-hosted variable font 300–900. */
const satoshi = localFont({
  src: "./fonts/Satoshi-Variable.woff2",
  weight: "300 900",
  display: "swap",
  variable: "--font-satoshi",
});

/* Metadata labels only. Only 400 is ever rendered; don't ship unused weights. */
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
  logo: "https://msail.github.io/msail-logo.png",
  email: "msail-admin@umich.edu",
  foundingDate: "2008",
  sameAs: [
    "https://www.instagram.com/michiganailab/",
    "https://www.linkedin.com/company/msail1/",
    "https://maizepages.umich.edu/organization/msail",
  ],
};

export const viewport: Viewport = {
  // Every route opens on the ink band, so the browser chrome (iOS Safari
  // bars, Android address bar) blends with the night ground, not against it.
  themeColor: "#06294d",
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
      className={`${satoshi.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* The lens that makes the glass refract instead of frost. An SVG
            displacement map bends whatever is behind the capsule while a very
            small blur keeps the detail, which is what separates glass from
            frosting. It lives here, not in globals.css, for two reasons: a
            `url(#id)` inside an external stylesheet resolves against that
            stylesheet rather than the document, and keeping the rule beside the
            filter it names stops one from being deleted without the other.
            Browsers that reject `url()` inside backdrop-filter (Safari at time
            of writing) skip the @supports block and keep the plain low blur
            from globals.css, which is still see-through. */}
        <svg aria-hidden="true" focusable="false" width="0" height="0" className="absolute">
          <defs>
            <filter id="msail-lens" x="-25%" y="-60%" width="150%" height="220%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.003 0.022"
                numOctaves="1"
                seed="11"
                result="warp"
              />
              <feGaussianBlur in="warp" stdDeviation="6" result="softWarp" />
              <feDisplacementMap
                in="SourceGraphic"
                in2="softWarp"
                scale="22"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
        <style>{`@supports (backdrop-filter: url("#msail-lens")) {
  .glass-island, .glass-pill {
    -webkit-backdrop-filter: blur(7px) url("#msail-lens") saturate(215%) brightness(1.04);
    backdrop-filter: blur(7px) url("#msail-lens") saturate(215%) brightness(1.04);
  }
}
@media (prefers-reduced-transparency: reduce) {
  .glass-island, .glass-pill {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}`}</style>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-sm focus:border focus:border-border focus:bg-page focus:px-4 focus:text-label focus:text-ink"
        >
          Skip to content
        </a>
        <SiteHeader />
        {/* tabIndex lets the skip link actually move focus here. The top
            padding clears the floating island nav; the homepage hero pulls
            itself back up under it so the canvas reaches the very top. */}
        <main id="main" tabIndex={-1} className="flex flex-1 flex-col pt-20 outline-none">
          {children}
        </main>
        <SiteFooter />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {/* lazyOnload: analytics has no business inside the load window — as
            afterInteractive, gtag's 170KB eval was a chunk of our TBT. */}
        {GA_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="lazyOnload"
            />
            <Script id="ga-init" strategy="lazyOnload">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
