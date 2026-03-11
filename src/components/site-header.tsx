import Link from "next/link";
import { Search } from "lucide-react";
import dynamic from "next/dynamic";

const SearchBar = dynamic(() => import("./search-bar").then(m => ({ default: m.SearchBar })), {
  ssr: false,
  loading: () => (
    <button className="w-10 h-10 rounded-full bg-[var(--bg-2)] flex items-center justify-center text-[var(--text-dim)]" aria-label="Search loading">
      <Search size={18} />
    </button>
  ),
});

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
