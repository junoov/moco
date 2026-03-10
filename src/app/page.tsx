import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ComicFilterClient } from "@/components/comic-filter-client";

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
        <h3 className="comic-card__title">{comic.title}</h3>
      </div>
    </Link>
  );
}

// ============================================================
// Server Component — Data di-fetch di server, bukan di browser!
// ============================================================
export default async function HomePage() {
  // Semua query ini berjalan di server Vercel, BUKAN di browser user
  const [trending, manhwa, manhua, manga, totalComics] = await Promise.all([
    prisma.comic.findMany({
      orderBy: { totalViews: "desc" },
      take: 10,
      include: { _count: { select: { chapters: true } } },
    }),
    prisma.comic.findMany({
      where: { type: { equals: "Manhwa", mode: "insensitive" } },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: { _count: { select: { chapters: true } } },
    }),
    prisma.comic.findMany({
      where: { type: { equals: "Manhua", mode: "insensitive" } },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: { _count: { select: { chapters: true } } },
    }),
    prisma.comic.findMany({
      where: { type: { equals: "Manga", mode: "insensitive" } },
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: { _count: { select: { chapters: true } } },
    }),
    prisma.comic.count(),
  ]);

  // Map ke format sederhana
  const mapComic = (c: any): Comic => ({
    ...c,
    totalChapters: c._count?.chapters ?? 0,
  });

  const trendingList = trending.map(mapComic);
  const allComics = [
    ...manhwa.map(mapComic),
    ...manhua.map(mapComic),
    ...manga.map(mapComic),
  ];

  // Deduplicate
  const bySlug = new Map<string, Comic>();
  allComics.forEach((c) => {
    if (!bySlug.has(c.slug)) bySlug.set(c.slug, c);
  });
  const uniqueAll = Array.from(bySlug.values());

  return (
    <section className="page-wrap">
      <div className="panel stagger" style={{ padding: "1.4rem", marginBottom: "1.2rem" }}>
        <p className="signal" style={{ margin: 0 }}>Live catalog</p>
        <h1 className="section-title" style={{ marginTop: "0.45rem" }}>
          Discover what readers are binging tonight
        </h1>
        <p className="muted" style={{ marginTop: "0.45rem", maxWidth: "58ch" }}>
          {totalComics} judul manga, manhwa, dan manhua tersedia.
        </p>
      </div>

      {/* Trending Section */}
      <section className="stagger" style={{ marginTop: "1.2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "baseline" }}>
          <h2 className="section-title">Trending picks</h2>
          <p className="muted" style={{ margin: 0 }}>Top 10 now</p>
        </div>
        <div className="comic-grid" style={{ marginTop: "0.9rem" }}>
          {trendingList.map((comic) => (
            <ComicCard key={comic.id} comic={comic} />
          ))}
        </div>
      </section>

      {/* Filter + All Comics — Client-side interactivity */}
      <ComicFilterClient
        allComics={uniqueAll}
        manhwa={manhwa.map(mapComic)}
        manhua={manhua.map(mapComic)}
        mangaList={manga.map(mapComic)}
      />
    </section>
  );
}


