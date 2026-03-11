"use client";

import { Search, Loader2, X } from "lucide-react";
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length >= 3) {
        fetchResults(query);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const fetchResults = async (searchQuery: string) => {
    setLoading(true);
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
    <div ref={containerRef}>
      {/* Search IconButton */}
      <button 
        onClick={() => setIsSearchOpen(!isSearchOpen)}
        className="w-10 h-10 rounded-full bg-[#161e2e] flex items-center justify-center text-gray-400 hover:text-white transition-colors" 
        aria-label="Search"
      >
        {isSearchOpen ? <X size={18} /> : <Search size={18} />}
      </button>

      {/* Expandable Search Input and Results Dropdown */}
      {isSearchOpen && (
        <div className="absolute top-[100%] left-0 w-full bg-[#0f1523] border-b border-gray-800 p-3 z-50 shadow-xl shadow-black/50">
          <div className="flex items-center bg-[#161e2e] border border-gray-700/50 rounded-lg px-3 py-2">
            <Search size={16} className="text-gray-400 mr-2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Cari manhwa/manga/manhua..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-gray-200 text-sm w-full flex-1 placeholder:text-gray-500"
            />
            {loading && <Loader2 size={14} className="animate-spin text-blue-500 ml-2" />}
          </div>

          {/* Search Results Dropdown inside the overlay */}
          {query.length > 0 && (
            <div className="mt-3 bg-[#101726] border border-gray-800 rounded-lg overflow-hidden max-h-[65vh] overflow-y-auto custom-scrollbar">
              {loading && results.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-xs">
                  Mencari komik...
                </div>
              ) : results.length > 0 ? (
                <div>
                  {results.map((result) => (
                    <Link
                      key={result.slug}
                      href={`/comics/${result.slug}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex gap-3 p-3 border-b border-gray-800 hover:bg-white/5 transition-colors"
                    >
                      <img
                        src={proxyImage(result.coverImage)}
                        alt={result.title}
                        className="w-12 h-16 object-cover rounded shadow-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.jpg";
                        }}
                      />
                      <div className="flex flex-col flex-1 min-w-0 justify-center">
                        <span className="text-sm font-semibold text-gray-200 truncate pr-2">
                          {result.title}
                        </span>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                          <span className="capitalize bg-[#161e2e] text-blue-400 px-2 py-0.5 rounded-md border border-gray-800 font-medium tracking-wide text-[10px]">
                            {result.type}
                          </span>
                          {result.totalChapters ? <span>Ch. {result.totalChapters}</span> : null}
                        </div>
                      </div>
                    </Link>
                  ))}
                  
                  {/* View All Search Results Link (Optional) */}
                   <Link 
                    href={`/comics`} // You can create a /search?q=${query} page later
                    onClick={() => setIsSearchOpen(false)}
                    className="block w-full p-2.5 text-center text-xs font-semibold text-blue-500 hover:bg-blue-500/10 transition-colors"
                  >
                    Lihat Semua Komik
                  </Link>

                </div>
              ) : query.length >= 3 ? (
                <div className="p-4 text-center text-gray-500 text-xs">
                  Aduh, komik "{query}" tidak ditemukan!
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 text-xs">
                  Ketik minimal 3 huruf...
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
