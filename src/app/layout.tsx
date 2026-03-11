import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

import { MobileNav } from "@/components/mobile-nav";

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
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <div className="flex flex-col min-h-screen bg-[#0a0e17] text-gray-200 pb-20">
          <SiteHeader />
          <main className="flex-1 w-full max-w-[1200px] mx-auto px-4">{children}</main>
          <MobileNav />
        </div>
      </body>
    </html>
  );
}
