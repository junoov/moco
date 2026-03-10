import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getPaginatedComics } from "@/lib/comic-data";
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
    <Link href={`/comics/${comic.slug}`} className="comic-card panel">
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

export default async function ComicsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const parsedPage = Number.parseInt(params.page || "1", 10);

  const { comics, currentPage, totalPages, totalComics, pageSize } =
    await getPaginatedComics(parsedPage, 24);

  const fromIndex = totalComics === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toIndex = Math.min(currentPage * pageSize, totalComics);

  return (
    <section className="page-wrap">
      <div className="panel stagger" style={{ padding: "1.4rem", marginBottom: "1.2rem" }}>
        <p className="signal" style={{ margin: 0 }}>Complete catalog</p>
        <h1 className="section-title" style={{ marginTop: "0.45rem" }}>
          Semua Komik
        </h1>
        <p className="muted" style={{ marginTop: "0.45rem", maxWidth: "58ch" }}>
          Menampilkan {fromIndex}-{toIndex} dari {totalComics} judul.
        </p>
      </div>

      <section className="stagger" style={{ marginTop: "1.2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "baseline" }}>
          <h2 className="section-title">Catalog Page {currentPage}</h2>
          <p className="muted" style={{ margin: 0 }}>{comics.length} titles</p>
        </div>

        {comics.length > 0 ? (
          <div className="comic-grid" style={{ marginTop: "0.9rem" }}>
            {comics.map((comic) => (
              <ComicCard key={comic.id} comic={comic} />
            ))}
          </div>
        ) : (
          <div className="panel" style={{ padding: "1rem", marginTop: "0.9rem", textAlign: "center" }}>
            <p className="muted" style={{ margin: 0 }}>Belum ada komik untuk halaman ini.</p>
          </div>
        )}

        <div className="comics-pager">
          {currentPage > 1 ? (
            <Link href={`/comics?page=${currentPage - 1}`} className="cta cta--ghost">
              <ArrowLeft size={16} style={{ marginRight: "0.35rem" }} />
              Prev
            </Link>
          ) : (
            <span className="cta cta--ghost comics-pager__disabled">
              <ArrowLeft size={16} style={{ marginRight: "0.35rem" }} />
              Prev
            </span>
          )}

          <p className="muted comics-pager__label">Page {currentPage} / {totalPages}</p>

          {currentPage < totalPages ? (
            <Link href={`/comics?page=${currentPage + 1}`} className="cta">
              Next
              <ArrowRight size={16} style={{ marginLeft: "0.35rem" }} />
            </Link>
          ) : (
            <span className="cta comics-pager__disabled">
              Next
              <ArrowRight size={16} style={{ marginLeft: "0.35rem" }} />
            </span>
          )}
        </div>
      </section>
    </section>
  );
}
