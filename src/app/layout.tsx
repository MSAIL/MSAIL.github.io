import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AgentTools } from "@/components/agent-tools";
import { jsonLdHtml, organizationGraph } from "@/lib/agent-index";
import { sharedOpenGraph } from "@/lib/page-metadata";
import { pages } from "@/data/pages";
import { site } from "@/data/site";

/* Google Analytics 4 measurement ID (property "msail.github.io" under the
   MSAIL account). Empty string = no analytics script is rendered at all. */
const GA_ID = "G-RJWNYW6P41";

/* The site's one typeface: Satoshi (Fontshare), self-hosted variable font
   300–900. There is no second font on purpose. IBM Plex Mono used to load
   here for metadata labels, and after the labels moved to Satoshi its woff2
   was still being preloaded on every page for nothing. */
const satoshi = localFont({
  src: "./fonts/Satoshi-Variable.woff2",
  weight: "300 900",
  display: "swap",
  variable: "--font-satoshi",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: pages.home.title,
    template: "%s · MSAIL",
  },
  description: pages.home.description,
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
  // from trailingSlash: true), so every page gets its own canonical, og:url
  // and Markdown alternate, and og:title/twitter:title derive from each page's
  // templated <title>. Content pages set their description through
  // pageMetadata(), which repeats sharedOpenGraph because Next replaces nested
  // metadata objects instead of merging them.
  alternates: {
    canonical: "./",
    types: {
      "text/markdown": "./index.html.md",
      "application/json": "/msail.json",
    },
  },
  // Search and answer engines may quote as much of a page as they need.
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: { ...sharedOpenGraph, description: pages.home.description },
  twitter: {
    card: "summary_large_image",
  },
};

/* The site-wide schema.org graph (Organization + WebSite), built from
   src/data by the module that writes llms.txt and msail.json. Each page adds
   its own graph (WebPage type, breadcrumbs) through PageShell. */
const jsonLd = jsonLdHtml(organizationGraph());

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
      className={`${satoshi.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* ARD discovery link; React hoists it into <head>. */}
        <link rel="ard" type="application/json" href="/.well-known/ard.json" />
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
            {/* Every step lives inside this one filter on purpose. Chrome keeps
                only the url() when a backdrop-filter list mixes a reference
                with functions, so a `blur(7px) url(#lens) saturate(215%)`
                silently collapsed to the bare reference and the capsule lost
                its blur and saturation entirely. Blur, bend, and saturate are
                therefore all done here, in order. */}
            <filter
              id="msail-lens"
              x="-25%"
              y="-60%"
              width="150%"
              height="220%"
              colorInterpolationFilters="sRGB"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.005 0.014"
                numOctaves="2"
                seed="11"
                result="warp"
              />
              <feGaussianBlur in="warp" stdDeviation="4" result="softWarp" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="soft" />
              <feDisplacementMap
                in="soft"
                in2="softWarp"
                scale="58"
                xChannelSelector="R"
                yChannelSelector="G"
                result="bent"
              />
              <feColorMatrix in="bent" type="saturate" values="2.1" result="rich" />
              <feComponentTransfer in="rich">
                <feFuncR type="linear" slope="1.04" />
                <feFuncG type="linear" slope="1.04" />
                <feFuncB type="linear" slope="1.04" />
              </feComponentTransfer>
            </filter>
          </defs>
        </svg>
        <style>{`@supports (backdrop-filter: url("#msail-lens")) {
  .glass-island {
    -webkit-backdrop-filter: url("#msail-lens");
    backdrop-filter: url("#msail-lens");
  }
}
@media (prefers-reduced-transparency: reduce) {
  .glass-island {
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
        <AgentTools />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
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
