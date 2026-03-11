import Link from "next/link";
import { Search } from "lucide-react";
import { SearchBar } from "./search-bar";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[var(--bg-0)]/70 backdrop-blur-xl border-b border-[var(--line-soft)] transition-all">
      <div className="w-full max-w-[1240px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Brand Logo */}
        <Link 
          href="/" 
          className="font-[family-name:var(--font-heading)] font-extrabold text-2xl tracking-wide flex items-center gap-1.5 hover:opacity-80 transition-opacity"
        >
          <span className="text-[var(--accent)] tracking-tighter">MOCO</span>
          <span className="text-[var(--text-strong)] tracking-wider">KOMIK</span>
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
