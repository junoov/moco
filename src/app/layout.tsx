import type { Metadata } from "next";
import { Chakra_Petch, Outfit } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";

const displayFont = Chakra_Petch({
  variable: "--font-display",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

const bodyFont = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MOCO KOMIK",
  description: "Live-scraped manga reader built with Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body className="antialiased min-h-screen relative overflow-x-hidden selection:bg-accent selection:text-black pb-20 md:pb-0">
        <div className="noise-bg pointer-events-none fixed inset-0 z-[-1]"></div>
        <div className="grid-bg pointer-events-none fixed inset-0 z-[-2]"></div>
        <SiteHeader />
        <main className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 z-10 relative">
          {children}
        </main>
        <MobileNav />
      </body>
    </html>
  );
}
