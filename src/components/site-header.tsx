import Link from "next/link";
import { BookOpen } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" className="brand hover:opacity-90 transition-opacity">
          <div className="brand__glyph">
            <BookOpen size={20} color="#090d12" />
          </div>
          <div className="brand__text">
            <strong>MangaReader</strong>
            <small>Live Komiku Scraper</small>
          </div>
        </Link>
        <nav style={{ display: "flex", gap: "1.2rem", alignItems: "center" }}>
           <Link href="/" className="muted hover:text-[var(--text-strong)] transition-colors text-sm font-medium">Home</Link>
           <Link href="#" className="muted hover:text-[var(--text-strong)] transition-colors text-sm font-medium">Bookmarks</Link>
        </nav>
      </div>
    </header>
  );
}
