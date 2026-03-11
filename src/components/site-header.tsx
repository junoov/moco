import Link from "next/link";
import { Search } from "lucide-react";
import { SearchBar } from "./search-bar";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[var(--bg-0)]/80 backdrop-blur-md border-b border-[var(--line)] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Brand Logo */}
        <Link 
          href="/" 
          className="font-display font-black text-2xl tracking-widest uppercase flex items-center gap-1 hover:opacity-80 transition-opacity"
        >
          <span className="text-[var(--accent)] drop-shadow-[0_0_10px_rgba(0,240,255,0.6)]">MOCO</span>
          <span className="text-white">KOMIK</span>
        </Link>
        
        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Search Box */}
          <SearchBar />
        </div>
      </div>
    </header>
  );
}
