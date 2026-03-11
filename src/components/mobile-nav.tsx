"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, Tag, Bookmark, History } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0e17] border-t border-gray-800 pb-safe pt-2">
      <div className="flex justify-around items-center px-2 pb-2">
        <Link href="/" className="flex flex-col items-center gap-1 w-16">
          <div className={`p-1 rounded-full ${pathname === "/" ? "text-blue-500" : "text-gray-500 hover:text-gray-400"}`}>
            <Home size={22} strokeWidth={pathname === "/" ? 2.5 : 2} />
          </div>
          <span className={`text-[10px] font-medium ${pathname === "/" ? "text-blue-500" : "text-gray-500"}`}>
            Home
          </span>
        </Link>
        <Link href="/comics" className="flex flex-col items-center gap-1 w-16">
          <div className={`p-1 rounded-full ${pathname === "/comics" ? "text-blue-500" : "text-gray-500 hover:text-gray-400"}`}>
            <Grid size={22} strokeWidth={pathname === "/comics" ? 2.5 : 2} />
          </div>
          <span className={`text-[10px] font-medium ${pathname === "/comics" ? "text-blue-500" : "text-gray-500"}`}>
            All
          </span>
        </Link>
        <Link href="/genres" className="flex flex-col items-center gap-1 w-16">
          <div className={`p-1 rounded-full ${pathname === "/genres" ? "text-blue-500" : "text-gray-500 hover:text-gray-400"}`}>
            <Tag size={22} strokeWidth={pathname === "/genres" ? 2.5 : 2} />
          </div>
          <span className={`text-[10px] font-medium ${pathname === "/genres" ? "text-blue-500" : "text-gray-500"}`}>
            Genre
          </span>
        </Link>
        <Link href="/bookmarks" className="flex flex-col items-center gap-1 w-16 relative">
          <div className={`p-1 rounded-full ${pathname === "/bookmarks" ? "text-blue-500" : "text-gray-500 hover:text-gray-400"}`}>
            <Bookmark size={22} strokeWidth={pathname === "/bookmarks" ? 2.5 : 2} />
            <div className="absolute top-1 right-4 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#0a0e17]"></div>
          </div>
          <span className={`text-[10px] font-medium ${pathname === "/bookmarks" ? "text-blue-500" : "text-gray-500"}`}>
            Simpan
          </span>
        </Link>
        <Link href="/history" className="flex flex-col items-center gap-1 w-16 relative">
          <div className={`p-1 rounded-full ${pathname === "/history" ? "text-blue-500" : "text-gray-500 hover:text-gray-400"}`}>
            <History size={22} strokeWidth={pathname === "/history" ? 2.5 : 2} />
            <div className="absolute top-1 right-4 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#0a0e17]"></div>
          </div>
          <span className={`text-[10px] font-medium ${pathname === "/history" ? "text-blue-500" : "text-gray-500"}`}>
            Riwayat
          </span>
        </Link>
      </div>
    </nav>
  );
}
