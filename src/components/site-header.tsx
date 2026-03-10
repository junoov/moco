import Link from "next/link";
import { BookOpen } from "lucide-react";
import { SearchBar } from "./search-bar";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner site-header__inner--layout">
        <Link href="/" className="brand hover:opacity-90 transition-opacity">
          <div className="brand__glyph">
            <BookOpen size={20} color="#090d12" />
          </div>
          <div className="brand__text">
            <strong>MangaReader</strong>
            <small>Live Komiku Scraper</small>
          </div>
        </Link>
        <nav className="site-header__nav">
          <SearchBar />
          <div className="site-header__links">
            <Link href="/" className="muted hover:text-[var(--text-strong)] transition-colors text-sm font-medium">Home</Link>
            <Link href="/comics" className="muted hover:text-[var(--text-strong)] transition-colors text-sm font-medium">Comics</Link>
            <Link href="/bookmarks" className="muted hover:text-[var(--text-strong)] transition-colors text-sm font-medium">Bookmarks</Link>
            <Link href="/history" className="muted hover:text-[var(--text-strong)] transition-colors text-sm font-medium">History</Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
