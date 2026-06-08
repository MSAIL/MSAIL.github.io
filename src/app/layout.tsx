import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
