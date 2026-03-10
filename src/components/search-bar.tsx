"use client";

import { Search, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

interface SearchResult {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  type: string;
  totalChapters?: number;
}

function proxyImage(url: string): string {
  if (!url) return "";
  return `/api/img?url=${encodeURIComponent(url)}`;
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length >= 3) {
        fetchResults(query);
      } else {
        setResults([]);
        setIsOpen(query.trim().length > 0);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const fetchResults = async (searchQuery: string) => {
    setLoading(true);
    setIsOpen(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.status) {
        setResults(data.data.slice(0, 5));
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="search-box">
      {/* Search Input Box */}
      <div className="search-box__input-wrap">
        <Search size={16} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="Cari manhwa/manga..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.length > 0) setIsOpen(true);
          }}
          className="search-box__input"
        />
        {loading && <Loader2 size={14} className="animate-spin" color="var(--text-muted)" />}
      </div>

      {/* Dropdown Results */}
      {isOpen && query.length > 0 && (
        <div className="search-box__dropdown">
          {loading && results.length === 0 ? (
            <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Mencari komik...
            </div>
          ) : results.length > 0 ? (
            <div style={{ maxHeight: "350px", overflowY: "auto" }}>
              {results.map((result) => (
                <Link
                  key={result.slug}
                  href={`/comics/${result.slug}`}
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: "flex",
                    gap: "0.8rem",
                    padding: "0.8rem",
                    borderBottom: "1px solid var(--border-subtle)",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "background 0.2s",
                  }}
                  className="hover:bg-white/5"
                >
                  <img
                    src={proxyImage(result.coverImage)}
                    alt={result.title}
                    style={{
                      width: "45px",
                      height: "60px",
                      objectFit: "cover",
                      borderRadius: "4px",
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.jpg";
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-strong)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {result.title}
                    </span>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.3rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      <span style={{ textTransform: "capitalize", background: "var(--surface)", padding: "2px 6px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                        {result.type}
                      </span>
                      {result.totalChapters ? <span>Ch. {result.totalChapters}</span> : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : query.length >= 3 ? (
             <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Judul tidak ditemukan
            </div>
          ) : (
            <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Ketik minimal 3 huruf...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
