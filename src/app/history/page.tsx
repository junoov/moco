"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useMemo, useSyncExternalStore } from "react";
import {
  clearHistory,
  getHistoryRaw,
  parseHistory,
  removeHistory,
  subscribeHistory,
} from "@/lib/history";

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

export default function HistoryPage() {
  const historyRaw = useSyncExternalStore(subscribeHistory, getHistoryRaw, () => "[]");
  const history = useMemo(() => parseHistory(historyRaw), [historyRaw]);

  return (
    <section className="page-wrap">
      <div className="panel stagger" style={{ padding: "1.4rem", marginBottom: "1.2rem" }}>
        <p className="signal" style={{ margin: 0 }}>Reading timeline</p>
        <h1 className="section-title" style={{ marginTop: "0.45rem" }}>
          History
        </h1>
        <p className="muted" style={{ marginTop: "0.45rem", maxWidth: "58ch" }}>
          {history.length} judul pernah kamu buka.
        </p>
      </div>

      {history.length > 0 && (
        <div className="history-toolbar panel">
          <p className="muted" style={{ margin: 0 }}>Riwayat tersimpan lokal di browser ini.</p>
          <button type="button" className="history-clear-btn" onClick={clearHistory}>
            <Trash2 size={14} />
            Hapus semua
          </button>
        </div>
      )}

      {history.length === 0 ? (
        <div className="panel" style={{ marginTop: "0.9rem", padding: "1rem", textAlign: "center" }}>
          <p className="muted" style={{ marginTop: 0 }}>Belum ada history bacaan.</p>
          <Link href="/comics" className="cta" style={{ marginTop: "0.8rem" }}>
            Mulai baca komik
          </Link>
        </div>
      ) : (
        <div className="comic-grid" style={{ marginTop: "0.9rem" }}>
          {history.map((item) => {
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
                  <button
                    type="button"
                    className="bookmark-remove"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      removeHistory(item.slug);
                    }}
                    aria-label={`Hapus ${item.title} dari history`}
                    title="Hapus dari history"
                  >
                    <Trash2 size={13} />
                  </button>
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
