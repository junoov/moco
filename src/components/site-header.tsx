import Link from "next/link";
import { Search } from "lucide-react";
import { SearchBar } from "./search-bar";

export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 bg-[#0a0e17] z-50 border-b border-gray-800">
      <div className="site-header__inner px-4 py-3 flex items-center justify-between">
        {/* Brand Logo */}
        <Link 
          href="/" 
          className="font-black text-2xl tracking-widest uppercase flex items-center gap-1 hover:opacity-80 transition-opacity"
        >
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-500">MOCO</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-200 to-gray-400">KOMIK</span>
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
