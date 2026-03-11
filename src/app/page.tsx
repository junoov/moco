import Link from "next/link";
import { BookmarkToggleButton } from "@/components/bookmark-toggle-button";
import { ReadingHistorySection } from "@/components/reading-history-section";
import { getHomepageData } from "@/lib/comic-data";

// SSR: Render di server setiap request (tidak perlu koneksi DB saat build)
export const dynamic = "force-dynamic";

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
          decoding="async"
          className="comic-card__img"
        />

        {/* Type Badge */}
        <span className="comic-card__badge comic-card__badge--type" style={{ background: typeColor }}>
          {typeText}
        </span>

        {/* Status Badge */}
        {comic.status && comic.status.toLowerCase() === "ongoing" && (
          <span className="comic-card__badge comic-card__badge--status">
            ONG
          </span>
        )}

        {/* Bottom Overlay */}
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

      {/* Title */}
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

import { FlagNav } from "@/components/flag-nav";
import { ComicFilterClient } from "@/components/comic-filter-client";

// ============================================================
// Server Component — Data di-fetch di server, bukan di browser!
// ============================================================
export default async function HomePage() {
  const data = await getHomepageData();
  const trendingList = data.trending;

  return (
    <section className="page-wrap pb-10">
      {/* Welcome Panel */}
      <div className="panel stagger" style={{ padding: "1.4rem", marginBottom: "1.2rem", marginTop: "1rem" }}>
        <p className="signal" style={{ margin: 0 }}>Live catalog</p>
        <h1 className="section-title" style={{ marginTop: "0.45rem" }}>
          Discover what readers are binging tonight
        </h1>
        <p className="muted" style={{ marginTop: "0.45rem", maxWidth: "58ch" }}>
          {data.totalComics} judul manga, manhwa, dan manhua tersedia.
        </p>
      </div>

      {/* Flag Navigation (Image request) */}
      <FlagNav />

      {/* Trending Section */}
      <section className="stagger" style={{ marginTop: "1.2rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "baseline" }}>
          <h2 className="section-title">Popular today</h2>
          <Link href="/comics" className="text-gray-400 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors">
             Lihat Semua <span className="text-lg leading-none">›</span>
          </Link>
        </div>
        <div className="comic-grid" style={{ marginTop: "0.9rem" }}>
          {trendingList.map((comic) => (
             <ComicCard key={comic.id} comic={comic} />
          ))}
        </div>
      </section>

      {/* Latest Updates with Dynamic Filter */}
      <ComicFilterClient 
        allComics={data.latestUpdates}
        manhwa={data.manhwa}
        manhua={data.manhua}
        mangaList={data.manga}
      />

      <ReadingHistorySection />
    </section>
  );
}
