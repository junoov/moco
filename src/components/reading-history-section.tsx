"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { parseHistory, getHistoryRaw, subscribeHistory } from "@/lib/history";

function proxyImage(url: string | null | undefined): string {
  if (!url) return "";
  return `/api/img?url=${encodeURIComponent(url)}`;
}

function getTypeColor(type: string): string {
  const normalized = type.toLowerCase();
  if (normalized === "manhwa") return "var(--manhwa-badge)";
  if (normalized === "manhua") return "var(--manhua-badge)";
  return "var(--manga-badge)";
}

export function ReadingHistorySection() {
  const historyRaw = useSyncExternalStore(subscribeHistory, getHistoryRaw, () => "[]");
  const history = useMemo(() => parseHistory(historyRaw), [historyRaw]);
  const recent = history.slice(0, 8);

  return (
    <section className="stagger" style={{ marginTop: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "baseline" }}>
        <h2 className="section-title">History</h2>
        <Link href="/history" className="muted hover:text-[var(--text-strong)] transition-colors text-sm font-medium">
          View all
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="panel" style={{ marginTop: "0.9rem", padding: "1rem", textAlign: "center" }}>
          <p className="muted" style={{ margin: 0 }}>Belum ada riwayat baca. Buka detail komik untuk mengisi history.</p>
        </div>
      ) : (
        <div className="comic-grid" style={{ marginTop: "0.9rem" }}>
          {recent.map((item) => {
            const typeText = item.type || "Manga";

            return (
              <Link key={item.slug} href={`/comics/${item.slug}`} className="comic-card panel">
              <div className="comic-card__cover">
                <img
                  src={proxyImage(item.coverUrl)}
                  alt={item.title}
                  loading="lazy"
                  className="comic-card__img"
                />
                <span className="comic-card__badge comic-card__badge--type" style={{ background: getTypeColor(typeText) }}>
                  {typeText}
                </span>
                <div className="comic-card__overlay">
                  <span className="comic-card__chapters">
                    {item.totalChapters > 0 ? `${item.totalChapters} Chapter` : "? Chapter"}
                  </span>
                </div>
              </div>
              <div className="comic-card__info">
                <h3 className="comic-card__title">{item.title}</h3>
                <p className="muted" style={{ margin: "0.2rem 0 0", fontSize: "0.7rem" }}>
                  {new Date(item.viewedAt).toLocaleString("id-ID")}
                </p>
              </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
