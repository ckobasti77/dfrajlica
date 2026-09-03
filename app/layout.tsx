import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import { site } from "@/content/site";
import ConvexClientProvider from "@/components/providers/ConvexClientProvider";
import SmoothScroll from "@/components/SmoothScroll";

const playfair = Playfair_Display({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
  variable: "--font-playfair",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-manrope",
  display: "swap",
});

const pageTitle = `${site.name} — Козметички салон Земун`;

export const metadata: Metadata = {
  title: pageTitle,
  description: site.description,
  metadataBase: new URL(site.url),
  alternates: { canonical: "/" },
  openGraph: {
    title: pageTitle,
    description: site.description,
    url: "/",
    siteName: site.name,
    locale: "sr_RS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: pageTitle,
    description: site.description,
  },
  icons: { icon: "/favicon.ico" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "BeautySalon",
  name: site.name,
  alternateName: site.nameLatin,
  description: site.description,
  url: site.url,
  telephone: site.phone.primary.e164,
  image: `${site.url}/logos/logo.png`,
  logo: `${site.url}/logos/logo.png`,
  priceRange: "RSD",
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    addressLocality: site.address.city,
    postalCode: site.address.postal,
    addressCountry: "RS",
  },
  sameAs: [site.social.instagram.url, site.social.facebook.url],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="sr-Cyrl" className={`${playfair.variable} ${manrope.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-white text-ink">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <ConvexClientProvider>{children}</ConvexClientProvider>
        <SmoothScroll />
      </body>
    </html>
  );
}
