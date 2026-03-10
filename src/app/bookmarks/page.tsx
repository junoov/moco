"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useMemo, useSyncExternalStore } from "react";
import {
  getBookmarksRaw,
  parseBookmarks,
  removeBookmark,
  subscribeBookmarks,
  type BookmarkComic,
} from "@/lib/bookmarks";

function proxyImage(url: string | null | undefined): string {
  if (!url) return "";
  return `/api/img?url=${encodeURIComponent(url)}`;
}

function BookmarkCard({ comic }: { comic: BookmarkComic }) {
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

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            removeBookmark(comic.slug);
          }}
          className="bookmark-remove"
          aria-label={`Remove ${comic.title} from bookmarks`}
          title="Hapus bookmark"
        >
          <Trash2 size={13} />
        </button>

        <div className="comic-card__overlay">
          <span className="comic-card__chapters">
            {comic.totalChapters > 0 ? `${comic.totalChapters} Chapter` : "? Chapter"}
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
        <h3 className="comic-card__title">{comic.title}</h3>
      </div>
    </Link>
  );
}

export default function BookmarksPage() {
  const bookmarksRaw = useSyncExternalStore(
    subscribeBookmarks,
    getBookmarksRaw,
    () => "[]"
  );
  const bookmarks = useMemo<BookmarkComic[]>(
    () => parseBookmarks(bookmarksRaw),
    [bookmarksRaw]
  );

  return (
    <section className="page-wrap">
      <div className="panel stagger" style={{ padding: "1.4rem", marginBottom: "1.2rem" }}>
        <p className="signal" style={{ margin: 0 }}>Your collection</p>
        <h1 className="section-title" style={{ marginTop: "0.45rem" }}>
          Bookmarks
        </h1>
        <p className="muted" style={{ marginTop: "0.45rem", maxWidth: "58ch" }}>
          {bookmarks.length} komik tersimpan di browser ini.
        </p>
      </div>

      {bookmarks.length === 0 ? (
        <div className="panel" style={{ padding: "1.2rem", textAlign: "center" }}>
          <p className="muted" style={{ marginTop: 0 }}>Kamu belum menyimpan komik apa pun.</p>
          <Link href="/comics" className="cta" style={{ marginTop: "0.8rem" }}>
            Jelajahi Semua Komik
          </Link>
        </div>
      ) : (
        <div className="comic-grid" style={{ marginTop: "0.4rem" }}>
          {bookmarks.map((comic) => (
            <BookmarkCard key={comic.slug} comic={comic} />
          ))}
        </div>
      )}
    </section>
  );
}
