"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Eye, Layers, Star, BookOpen } from "lucide-react";
import { ComicDetail } from "@/lib/scraper";

function proxyImage(url: string): string {
  if (!url) return "";
  return `/api/img?url=${encodeURIComponent(url)}`;
}

export default function ComicDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [comic, setComic] = useState<ComicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchComic() {
      try {
        setLoading(true);
        const res = await fetch(`/api/comics/${slug}`);
        const json = await res.json();

        if (!res.ok || !json.status) {
          throw new Error(json.message || "Failed to load comic");
        }

        if (mounted) {
          setComic(json.data);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchComic();
    return () => {
      mounted = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="page-wrap flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin mb-4" />
        <p className="muted">Summoning comic data...</p>
      </div>
    );
  }

  if (error || !comic) {
    return (
      <div className="page-wrap">
        <div className="panel p-6 border-red-900/50 bg-red-950/20 text-center">
          <p className="text-red-400 font-medium mb-4">{error || "Comic not found"}</p>
          <Link href="/" className="cta cta--ghost inline-flex">Return Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap pb-20">
      <Link href="/" className="inline-flex items-center gap-2 text-[var(--text-dim)] hover:text-white mb-6 transition-colors font-medium text-sm">
        <ArrowLeft size={16} /> Back to catalog
      </Link>

      {/* Hero Section */}
      <div className="panel p-5 grid detail-hero gap-6 mb-8 relative overflow-hidden">
        {/* Blurred Background effect */}
        <div 
          className="absolute inset-0 opacity-10 blur-3xl saturate-150 pointer-events-none"
          style={{ 
            backgroundImage: `url(${proxyImage(comic.coverImage)})`,
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        />
        
        <div className="relative z-10 w-full max-w-[220px] mx-auto sm:mx-0">
          <img
            src={proxyImage(comic.coverImage)}
            alt={comic.title}
            className="w-full aspect-[2/3] object-cover rounded-[var(--radius-md)] border border-[var(--line)] shadow-2xl"
          />
        </div>

        <div className="relative z-10 flex flex-col justify-center">
          <div className="flex flex-wrap gap-2 items-center mb-3">
            <span className="px-2.5 py-1 rounded-md bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold uppercase tracking-wider">
              {comic.type || "Manga"}
            </span>
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${comic.status === "Ongoing" ? "bg-green-500/10 text-green-400" : "bg-blue-500/10 text-blue-400"}`}>
              {comic.status || "Unknown"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 leading-tight">
            {comic.title}
          </h1>
          
          {comic.author && (
            <p className="text-[var(--text-dim)] mb-4 text-sm bg-[var(--line-soft)]/40 inline-block px-3 py-1 rounded-full border border-[var(--line)]">
              By <span className="text-white font-medium">{comic.author}</span>
            </p>
          )}

          <div className="flex flex-wrap gap-4 text-sm text-[var(--text-dim)] mb-5 bg-[#090d12]/40 p-3 rounded-lg border border-[var(--line-soft)]">
            <div className="flex items-center gap-1.5" title="Total Chapters">
              <Layers size={16} className="text-[var(--accent-soft)]" />
              <span>{comic.totalChapters} Chs</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {comic.genres?.map((val) => (
              <span key={val} className="px-3 py-1 bg-[var(--line-soft)] border border-[var(--line)] rounded-full text-xs text-[var(--text-base)]">
                {val}
              </span>
            ))}
          </div>
          
          <div className="mt-auto flex gap-3">
             {comic.chapters.length > 0 && (
                <Link 
                  href={`/comics/${comic.slug}/${comic.chapters[comic.chapters.length - 1]?.slug}`}
                  className="cta flex-1 shadow-lg shadow-orange-500/20"
                >
                  Read First Chapter
                </Link>
             )}
          </div>
        </div>
      </div>

      {/* Synopsis Section */}
      <section className="mb-10">
        <h2 className="section-title mb-4 flex items-center gap-2">
          <BookOpen className="text-[var(--accent)]" size={20} /> Synopsis
        </h2>
        <div className="panel p-5 bg-[var(--bg-1)]/50">
          <p className="text-[var(--text-base)] leading-relaxed text-[0.95rem]">
            {comic.synopsis || "No synopsis available."}
          </p>
        </div>
      </section>

      {/* Chapters Array */}
      <section>
        <div className="flex justify-between items-end mb-4">
          <h2 className="section-title flex items-center gap-2">
            <Layers className="text-[var(--accent)]" size={20} /> Chapters
          </h2>
          <span className="text-sm font-medium text-[var(--text-dim)]">{comic.chapters.length} available</span>
        </div>
        
        <div className="panel overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "var(--line) transparent" }}>
            <ul className="divide-y divide-[var(--line-soft)] m-0 p-0 list-none">
              {comic.chapters.map((ch, idx) => (
                <li key={ch.slug} className="group flex">
                  <Link 
                    href={`/comics/${comic.slug}/${ch.slug}`}
                    className="flex-1 px-5 py-4 flex items-center justify-between hover:bg-[var(--line-soft)]/30 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-[var(--text-strong)] group-hover:text-[var(--accent-soft)] transition-colors inline-block m-0">
                        {ch.title || `Chapter ${ch.number}`}
                      </p>
                    </div>
                    <span className="text-xs bg-[var(--line-soft)] text-[var(--text-dim)] px-2 py-1 rounded flex gap-1 items-center font-mono opacity-60 group-hover:opacity-100 transition-opacity">
                      Read <ArrowLeft size={12} className="rotate-180" />
                    </span>
                  </Link>
                </li>
              ))}
              {comic.chapters.length === 0 && (
                <li className="p-8 text-center text-[var(--text-dim)]">No chapters available at the moment.</li>
              )}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
