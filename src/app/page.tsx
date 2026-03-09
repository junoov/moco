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
  return `/api/img?url=${encodeURIComponent(url)}`;
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

  const latest = useMemo(() => {
    if (!data) {
      return [] as Comic[];
    }

    const merged = [...data.manhwa, ...data.manhua, ...data.manga];
    const bySlug = new Map<string, Comic>();
    merged.forEach((comic) => {
      if (!bySlug.has(comic.slug)) {
        bySlug.set(comic.slug, comic);
      }
    });

    return Array.from(bySlug.values()).slice(0, 12);
  }, [data]);

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
                gridTemplateColumns: "repeat(auto-fit, minmax(156px, 1fr))",
                gap: "0.85rem",
              }}
            >
              {data.trending.slice(0, 10).map((comic) => (
                <Link
                  href={`/comics/${comic.slug}`}
                  key={comic.id}
                  className="panel"
                  style={{ padding: "0.65rem", display: "block", transition: "transform 160ms ease" }}
                >
                  <img
                    src={proxyImage(comic.coverImage)}
                    alt={comic.title}
                    className="cover"
                    loading="lazy"
                    style={{ width: "100%", height: "220px" }}
                  />
                  <p style={{ margin: "0.65rem 0 0", color: "var(--text-strong)", fontSize: "0.92rem", fontWeight: 600 }}>
                    {comic.title}
                  </p>
                  <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.78rem" }}>
                    {comic.type} · {comic.totalChapters} ch
                  </p>
                </Link>
              ))}
            </div>
          </section>

          <section className="stagger" style={{ marginTop: "1.4rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "baseline" }}>
              <h2 className="section-title">Latest across formats</h2>
              <p className="muted" style={{ margin: 0 }}>{latest.length} titles</p>
            </div>

            <div style={{ display: "grid", gap: "0.7rem", marginTop: "0.85rem" }}>
              {latest.map((comic) => (
                <Link
                  key={comic.slug}
                  href={`/comics/${comic.slug}`}
                  className="panel"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "72px 1fr auto",
                    gap: "0.8rem",
                    alignItems: "center",
                    padding: "0.6rem",
                  }}
                >
                  <img
                    src={proxyImage(comic.coverImage)}
                    alt={comic.title}
                    className="cover"
                    loading="lazy"
                    style={{ width: "72px", height: "96px" }}
                  />
                  <div>
                    <p style={{ margin: 0, color: "var(--text-strong)", fontWeight: 600 }}>{comic.title}</p>
                    <p className="muted" style={{ margin: "0.35rem 0 0", fontSize: "0.82rem" }}>
                      {comic.type} · {comic.status || "Unknown status"}
                    </p>
                  </div>
                  <span className="cta cta--ghost" style={{ minHeight: "2.3rem", paddingInline: "0.9rem" }}>
                    View
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}
