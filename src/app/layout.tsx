import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { MobileNav } from "@/components/mobile-nav";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-heading",
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
    <html lang="id" className={`${inter.variable} ${plusJakartaSans.variable}`}>
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
