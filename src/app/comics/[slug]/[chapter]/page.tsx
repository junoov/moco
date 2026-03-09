"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Home, List } from "lucide-react";
import { ChapterData } from "@/lib/scraper";

function proxyImage(url: string): string {
  if (!url) return "";
  return `/api/img?url=${encodeURIComponent(url)}`;
}

export default function ChapterReaderPage({
  params,
}: {
  params: Promise<{ slug: string; chapter: string }>;
}) {
  const { slug, chapter } = use(params);
  const [data, setData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/comics/${slug}/${chapter}`);
        const json = await res.json();

        if (!res.ok || !json.status) {
          throw new Error(json.message || "Failed to load images");
        }

        if (mounted) {
          setData(json.data);
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

    load();
    return () => {
      mounted = false;
    };
  }, [slug, chapter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pb-20">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin mb-4" />
        <p className="muted font-mono animate-pulse text-sm tracking-widest uppercase">
          Injecting chapter payload...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-wrap text-center">
         <div className="panel p-8 border-red-900/50 bg-red-950/20 inline-block">
          <p className="text-red-400 font-medium mb-4">{error || "Failed to fetch chapter"}</p>
          <Link href={`/comics/${slug}`} className="cta cta--ghost">
            <ArrowLeft size={16} className="mr-2" /> Back to detail
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06080b]">
      {/* Top Navbar logic within Reader */}
      <div className="sticky top-0 z-40 bg-[var(--panel)]/80 backdrop-blur-md border-b border-[var(--line-soft)] shadow-xl p-3 flex justify-between items-center px-4 md:px-6">
        <div className="flex gap-2">
          <Link
            href="/"
            className="w-10 h-10 rounded-full bg-[var(--bg-0)] flex items-center justify-center text-[var(--text-dim)] hover:text-white transition-colors border border-[var(--line-soft)]"
            title="Home"
          >
            <Home size={18} />
          </Link>
          <Link
            href={`/comics/${slug}`}
            className="w-10 h-10 rounded-full bg-[var(--bg-0)] flex items-center justify-center text-[var(--text-dim)] hover:text-white transition-colors border border-[var(--line-soft)]"
            title="Comic Detail"
          >
            <List size={18} />
          </Link>
        </div>

        <div className="text-center font-medium max-w-[50vw]">
          <h1 className="text-[var(--text-strong)] text-sm md:text-base truncate m-0 leading-tight">
            {data.comicTitle}
          </h1>
          <h2 className="text-[var(--text-dim)] text-xs md:text-sm m-0">
            Chapter {data.chapterNumber}
          </h2>
        </div>

        {/* Prev/Next buttons in header */}
        <div className="flex gap-2">
          {data.prevChapter ? (
            <Link
              href={`/comics/${slug}/${data.prevChapter}`}
              className="px-3 h-10 rounded-full bg-[var(--bg-0)] flex items-center justify-center text-[var(--text-dim)] hover:text-white transition-colors border border-[var(--line-soft)] text-xs font-semibold uppercase font-mono tracking-wider gap-1"
            >
              <ArrowLeft size={14} /> <span className="hidden sm:inline">Prev</span>
            </Link>
          ) : (
             <div className="px-3 md:w-20 w-10"></div>
          )}
          {data.nextChapter ? (
            <Link
              href={`/comics/${slug}/${data.nextChapter}`}
              className="px-3 h-10 rounded-full bg-[var(--bg-0)] flex items-center justify-center text-[var(--text-dim)] hover:text-white transition-colors border border-[var(--line-soft)] text-xs font-semibold uppercase font-mono tracking-wider gap-1 hover:border-[var(--accent-soft)]"
            >
              <span className="hidden sm:inline">Next</span> <ArrowRight size={14} />
            </Link>
          ) : (
             <div className="px-3 md:w-20 w-10"></div>
          )}
        </div>
      </div>

      {/* Reader Strip */}
      <div className="reader-strip my-4 shadow-2xl">
        {data.images.map((img, idx) => (
          <div key={idx} className="relative w-full aspect-[2/3] bg-[#0c1219] flex items-center justify-center text-[var(--line-soft)] border-b border-[#000]">
             {/* Base loading skeleton / grid before image loads completely */}
            <div className="absolute inset-0 bg-[#0c1219] flex items-center justify-center -z-10" 
                 style={{ backgroundImage: "radial-gradient(#151e2b 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
               <span className="font-mono text-xs opacity-50">Page {idx + 1}</span>
            </div>
            
            <img
              src={proxyImage(img)}
              alt={`Page ${idx + 1}`}
              className="w-full h-auto block"
              loading={idx < 3 ? "eager" : "lazy"} 
              onError={(e) => {
                 (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMDkxMjE5IiBzdHJva2U9IiMyMDMwNDQiIHN0cm9rZS13aWR0aD0iMSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjUiIGZpbGw9IiM4ZDljYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBGYWlsZWQ8L3RleHQ+PC9zdmc+';
              }}
            />
          </div>
         ))}

         {data.images.length === 0 && (
           <div className="p-20 text-center text-[var(--text-dim)] bg-[var(--bg-1)]">
             <p>No images found for this chapter.</p>
           </div>
         )}
      </div>

      {/* Bottom Navigation */}
      <div className="max-w-[400px] mx-auto p-4 flex gap-4 pb-20 stagger">
         {data.prevChapter && (
           <Link href={`/comics/${slug}/${data.prevChapter}`} className="cta cta--ghost flex-1 opacity-70 hover:opacity-100 shadow-md">
             <ArrowLeft size={16} className="mr-2" /> Prev Ch
           </Link>
         )}
         
         {data.nextChapter && (
           <Link href={`/comics/${slug}/${data.nextChapter}`} className="cta flex-1 shadow-lg shadow-orange-500/20 text-center uppercase tracking-wide text-xs">
             Next Chapter <ArrowRight size={16} className="ml-2" />
           </Link>
         )}
         
         {!data.nextChapter && (
           <Link href={`/comics/${slug}`} className="cta cta--ghost flex-1 opacity-70 hover:opacity-100 shadow-md">
             Return to Info
           </Link>
         )}
      </div>
    </div>
  );
}
