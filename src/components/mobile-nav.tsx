"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid, Tag, Bookmark, History } from "lucide-react";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--bg-0)]/80 backdrop-blur-xl border-t border-[var(--line-soft)] pb-safe pt-2 md:hidden">
      <div className="flex justify-around items-center px-2 pb-2">
        <Link href="/" className="flex flex-col items-center gap-1 w-16 group">
          <div className={`p-1 rounded-full transition-transform ${pathname === "/" ? "text-[var(--accent)] scale-110" : "text-[var(--text-dim)] group-hover:text-white"}`}>
            <Home size={22} strokeWidth={pathname === "/" ? 2.5 : 2} />
          </div>
          <span className={`text-[10px] font-[family-name:var(--font-heading)] font-semibold tracking-wide transition-colors ${pathname === "/" ? "text-[var(--accent)]" : "text-[var(--text-dim)]"}`}>
            Home
          </span>
        </Link>
        <Link href="/comics" className="flex flex-col items-center gap-1 w-16 group">
          <div className={`p-1 rounded-full transition-transform ${pathname === "/comics" ? "text-[var(--accent)] scale-110" : "text-[var(--text-dim)] group-hover:text-white"}`}>
            <Grid size={22} strokeWidth={pathname === "/comics" ? 2.5 : 2} />
          </div>
          <span className={`text-[10px] font-[family-name:var(--font-heading)] font-semibold tracking-wide transition-colors ${pathname === "/comics" ? "text-[var(--accent)]" : "text-[var(--text-dim)]"}`}>
            All
          </span>
        </Link>

        <Link href="/bookmarks" className="flex flex-col items-center gap-1 w-16 relative group">
          <div className={`p-1 rounded-full transition-transform ${pathname === "/bookmarks" ? "text-[var(--accent)] scale-110" : "text-[var(--text-dim)] group-hover:text-white"}`}>
            <Bookmark size={22} strokeWidth={pathname === "/bookmarks" ? 2.5 : 2} />
            <div className="absolute top-1 right-4 w-2 h-2 bg-[var(--accent)] rounded-full border-2 border-[var(--bg-0)]"></div>
          </div>
          <span className={`text-[10px] font-[family-name:var(--font-heading)] font-semibold tracking-wide transition-colors ${pathname === "/bookmarks" ? "text-[var(--accent)]" : "text-[var(--text-dim)]"}`}>
            Simpan
          </span>
        </Link>
        <Link href="/history" className="flex flex-col items-center gap-1 w-16 relative group">
          <div className={`p-1 rounded-full transition-transform ${pathname === "/history" ? "text-[var(--accent)] scale-110" : "text-[var(--text-dim)] group-hover:text-white"}`}>
            <History size={22} strokeWidth={pathname === "/history" ? 2.5 : 2} />
            <div className="absolute top-1 right-4 w-2 h-2 bg-[var(--accent)] rounded-full border-2 border-[var(--bg-0)]"></div>
          </div>
          <span className={`text-[10px] font-[family-name:var(--font-heading)] font-semibold tracking-wide transition-colors ${pathname === "/history" ? "text-[var(--accent)]" : "text-[var(--text-dim)]"}`}>
            Riwayat
          </span>
        </Link>
      </div>
    </nav>
  );
}
