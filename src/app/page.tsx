"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

interface Comic {
  id: string;
  title: string;
  slug: string;
  coverImage: string;
  type: string;
  status: string;
  rating: number;
  views: number;
  totalChapters: number;
  lastChapter?: string;
  lastChapterSlug?: string;
}

interface HomepageData {
  trending: Comic[];
  manhwa: Comic[];
  manhua: Comic[];
  manga: Comic[];
}

function proxyImage(url: string): string {
  if (!url) return "";
  return `/api/img?url=${encodeURIComponent(url)}`;
}

function ComicCard({ comic }: { comic: Comic }) {
  const typeText = comic.type || "Manga";
  const typeColor = typeText.toLowerCase() === 'manhwa' 
    ? 'var(--manhwa-badge)' 
    : typeText.toLowerCase() === 'manhua' 
    ? 'var(--manhua-badge)' 
    : 'var(--manga-badge)';
    
  return (
    <Link
      href={`/comics/${comic.slug}`}
      className="panel"
      style={{ 
        display: "block", 
        padding: 0, 
        transition: "transform 200ms ease, box-shadow 200ms ease",
        textDecoration: "none",
        color: "inherit"
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 20px -5px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'none';
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow)';
      }}
    >
      <div style={{ position: "relative", width: "100%", paddingBottom: "140%", overflow: "hidden", borderTopLeftRadius: "var(--radius-lg)", borderTopRightRadius: "var(--radius-lg)" }}>
        <img
          src={proxyImage(comic.coverImage)}
          alt={comic.title}
          loading="lazy"
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        
        {/* Type Badge */}
        <div style={{ position: "absolute", top: "6px", left: "6px", background: typeColor, color: "#fff", fontSize: "0.55rem", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase", outline: "2px solid var(--bg-2)" }}>
          {typeText}
        </div>
        
        {/* Status Badge */}
        {comic.status && comic.status.toLowerCase() === "ongoing" && (
          <div style={{ position: "absolute", top: "6px", right: "6px", background: "var(--success)", color: "#fff", fontSize: "0.55rem", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase" }}>
            ONG
          </div>
        )}
        
        {/* Bottom Metadata Overlay */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%)", padding: "30px 6px 6px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <span style={{ color: "#fff", fontSize: "0.65rem", fontWeight: 600 }}>
            {comic.totalChapters > 0 ? `${comic.totalChapters} Chapter` : "? Chapter"}
          </span>
          {comic.views > 0 && (
             <span style={{ color: "var(--text-dim)", fontSize: "0.65rem", display: "flex", alignItems: "center", gap: "3px" }}>
               👁 {comic.views > 1000 ? (comic.views / 1000).toFixed(1) + 'K' : comic.views}
             </span>
          )}
        </div>
      </div>
      
      {/* Title section */}
      <div style={{ padding: "8px" }}>
        <h3 style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: "var(--text-strong)", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: "2.2rem" }}>
          {comic.title}
        </h3>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [data, setData] = useState<HomepageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/comics", { cache: "no-store" });
        const json = (await response.json()) as
          | { status: true; data: HomepageData }
          | { status: false; message?: string };

        if (!response.ok || !json.status) {
          throw new Error(json.status ? "Failed to fetch comics" : (json.message ?? "Failed to fetch comics"));
        }

        if (!cancelled) {
          setData(json.data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unexpected error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const [activeFilter, setActiveFilter] = useState("All");
  const filters = ["All", "Manga", "Manhwa", "Manhua"];

  const filteredComics = useMemo(() => {
    if (!data) return [];

    if (activeFilter === "Manga") return data.manga.slice(0, 18);
    if (activeFilter === "Manhwa") return data.manhwa.slice(0, 18);
    if (activeFilter === "Manhua") return data.manhua.slice(0, 18);

    const merged = [...data.manhwa, ...data.manhua, ...data.manga];
    const bySlug = new Map<string, Comic>();
    merged.forEach((comic) => {
      if (!bySlug.has(comic.slug)) {
        bySlug.set(comic.slug, comic);
      }
    });

    return Array.from(bySlug.values()).slice(0, 18);
  }, [data, activeFilter]);

  return (
    <section className="page-wrap">
      <div className="panel stagger" style={{ padding: "1.4rem", marginBottom: "1.2rem" }}>
        <p className="signal" style={{ margin: 0 }}>Live catalog</p>
        <h1 className="section-title" style={{ marginTop: "0.45rem" }}>
          Discover what readers are binging tonight
        </h1>
        <p className="muted" style={{ marginTop: "0.45rem", maxWidth: "58ch" }}>
          Freshly scraped manga, manhwa, and manhua with chapter-first navigation.
        </p>
      </div>

      {loading ? (
        <div className="panel stagger" style={{ padding: "1.2rem" }}>
          <p className="muted" style={{ margin: 0 }}>Loading comics feed...</p>
        </div>
      ) : null}

      {error ? (
        <div className="panel stagger" style={{ padding: "1.2rem", borderColor: "#4e2f2f" }}>
          <p style={{ margin: 0, color: "#ffb8a3" }}>Could not load comics: {error}</p>
        </div>
      ) : null}

      {data ? (
        <>
          <section className="stagger" style={{ marginTop: "1.2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "baseline" }}>
              <h2 className="section-title">Trending picks</h2>
              <p className="muted" style={{ margin: 0 }}>Top 10 now</p>
            </div>
            <div
              style={{
                marginTop: "0.9rem",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))",
                gap: "1rem",
              }}
            >
              {data.trending.slice(0, 10).map((comic) => (
                <ComicCard key={comic.id} comic={comic} />
              ))}
            </div>
          </section>

          <section className="stagger" style={{ marginTop: "1.4rem" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginBottom: "1.2rem" }}>
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className="hover:opacity-80"
                  style={{
                    background: activeFilter === f ? "var(--text-strong)" : "var(--surface)",
                    color: activeFilter === f ? "var(--bg)" : "var(--text-muted)",
                    border: "1px solid var(--border)",
                    padding: "0.4rem 1.2rem",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {f}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "baseline" }}>
              <h2 className="section-title">
                {activeFilter === "All" ? "Latest across formats" : `${activeFilter} Terbaru`}
              </h2>
              <p className="muted" style={{ margin: 0 }}>{filteredComics.length} titles</p>
            </div>

            <div 
              style={{ 
                marginTop: "1.2rem",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(145px, 1fr))",
                gap: "1rem",
              }}
            >
              {filteredComics.map((comic) => (
                <ComicCard key={comic.slug} comic={comic} />
              ))}
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}
