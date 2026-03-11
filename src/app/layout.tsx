import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#09090b",
};

export const metadata: Metadata = {
  title: {
    default: "MOCO KOMIK - Baca Manga, Manhwa, Manhua Online",
    template: "%s | MOCO KOMIK",
  },
  description: "Baca manga, manhwa, dan manhua terbaru gratis di MOCO KOMIK. Update setiap hari dengan koleksi terlengkap.",
  keywords: ["manga", "manhwa", "manhua", "baca komik", "komik online", "moco komik"],
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "MOCO KOMIK",
    title: "MOCO KOMIK - Baca Manga, Manhwa, Manhua Online",
    description: "Baca manga, manhwa, dan manhua terbaru gratis di MOCO KOMIK.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} ${plusJakartaSans.variable}`}>
      <head>
        {/* Preconnect to image proxy origin for faster LCP */}
        <link rel="preconnect" href="https://thumbnail.komiku.org" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://thumbnail.komiku.org" />
        <link rel="dns-prefetch" href="https://flagcdn.com" />
      </head>
      <body className="antialiased min-h-screen bg-[var(--bg-0)] text-[var(--text-base)] pb-20 md:pb-0 font-sans selection:bg-blue-500/30 selection:text-white">
        <div className="flex flex-col min-h-screen">
          <SiteHeader />
          <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 md:px-8 mt-4 md:mt-8">
            {children}
          </main>
          <MobileNav />
        </div>
      </body>
    </html>
  );
}

