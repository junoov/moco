"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { BookmarkToggleButton } from "@/components/bookmark-toggle-button";

interface Comic {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  type: string;
  status: string;
  rating: number;
  totalViews: number;
  totalChapters?: number;
}

function proxyImage(url: string | null | undefined): string {
  if (!url) return "";
  return `/api/img?url=${encodeURIComponent(url)}`;
}

function ComicCard({ comic }: { comic: Comic }) {
  const typeText = comic.type || "Manga";
  const typeColor =
    typeText.toLowerCase() === "manhwa"
      ? "var(--manhwa-badge)"
      : typeText.toLowerCase() === "manhua"
        ? "var(--manhua-badge)"
        : "var(--manga-badge)";

  return (
    <Link
      href={`/comics/${comic.slug}`}
      className="comic-card panel"
    >
      <div className="comic-card__cover">
        <img
          src={proxyImage(comic.coverUrl)}
          alt={comic.title}
          loading="lazy"
          className="comic-card__img"
        />
        <span className="comic-card__badge comic-card__badge--type" style={{ background: typeColor }}>
          {typeText}
        </span>
        {comic.status && comic.status.toLowerCase() === "ongoing" && (
          <span className="comic-card__badge comic-card__badge--status">ONG</span>
        )}
        <div className="comic-card__overlay">
          <span className="comic-card__chapters">
            {(comic.totalChapters ?? 0) > 0
              ? `${comic.totalChapters} Chapter`
              : "? Chapter"}
          </span>
          {comic.totalViews > 0 && (
            <span className="comic-card__views">
              👁 {comic.totalViews > 1000
                ? (comic.totalViews / 1000).toFixed(1) + "K"
                : comic.totalViews}
            </span>
          )}
        </div>
      </div>
      <div className="comic-card__info">
        <div className="comic-card__info-row">
          <h3 className="comic-card__title">{comic.title}</h3>
          <BookmarkToggleButton
            compact
            comic={{
              id: comic.id,
              slug: comic.slug,
              title: comic.title,
              coverUrl: comic.coverUrl,
              type: comic.type,
              status: comic.status,
              totalViews: comic.totalViews,
              totalChapters: comic.totalChapters ?? 0,
            }}
          />
        </div>
      </div>
    </Link>
  );
}

export function ComicFilterClient({
  allComics,
  manhwa,
  manhua,
  mangaList,
}: {
  allComics: Comic[];
  manhwa: Comic[];
  manhua: Comic[];
  mangaList: Comic[];
}) {
  const [activeFilter, setActiveFilter] = useState("Terbaru");
  const filters = ["Terbaru", "19+", "Populer", "Manga", "Manhwa", "Manhua"];

  const filteredComics = useMemo(() => {
    if (activeFilter === "Manga") return mangaList;
    if (activeFilter === "Manhwa") return manhwa;
    if (activeFilter === "Manhua") return manhua;
    // For Terbaru, 19+, and Populer, we just show all components for now
    // until the backend is updated to support these specific queries.
    return allComics;
  }, [activeFilter, allComics, manhwa, manhua, mangaList]);

  return (
    <section className="stagger" style={{ marginTop: "1.4rem", marginBottom: "3rem" }}>
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 mb-4" style={{ WebkitOverflowScrolling: "touch", msOverflowStyle: "none", scrollbarWidth: "none" }}>
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="filter-btn flex-shrink-0"
            data-active={activeFilter === f}
          >
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "baseline" }}>
        <h2 className="section-title uppercase">
          {activeFilter.toUpperCase()}
        </h2>
        <Link href="/comics" className="text-gray-400 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors">
          Lihat Semua <span className="text-lg leading-none">›</span>
        </Link>
      </div>

      <div className="comic-grid" style={{ marginTop: "1.2rem" }}>
        {filteredComics.map((comic) => (
          <ComicCard key={comic.slug} comic={comic} />
        ))}
      </div>
    </section>
  );
}
