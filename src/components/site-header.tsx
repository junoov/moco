import Link from "next/link";
import { Search, LogIn } from "lucide-react";
import { SearchBar } from "./search-bar";

export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 bg-[#0a0e17] z-50 border-b border-gray-800">
      <div className="site-header__inner px-4 py-3 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="font-black text-2xl tracking-tighter text-blue-500 hover:text-blue-400 transition-colors uppercase" style={{ fontFamily: "Impact, sans-serif" }}>
          KIRYUU
        </Link>
        
        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Search Button (Mobile/Desktop) */}
          <button className="w-10 h-10 rounded-full bg-[#161e2e] flex items-center justify-center text-gray-400 hover:text-white transition-colors" aria-label="Search">
            <Search size={18} />
          </button>
          
          {/* Login Button */}
          <button className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors">
            <LogIn size={16} />
            <span>Masuk</span>
          </button>
        </div>
      </div>
    </header>
  );
}
