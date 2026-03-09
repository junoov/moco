/**
 * ========================================================
 * MANGA READER — Bot Crawler / Automated Dumping
 * ========================================================
 *
 * Skrip ini bertugas:
 * 1. Mengambil daftar komik dari komiku.org (per halaman).
 * 2. Mengambil detail setiap komik (sinopsis, genre, chapter list).
 * 3. Mengambil URL gambar setiap chapter.
 * 4. Menyimpan semuanya ke database Supabase via Prisma.
 *
 * Cara pakai:
 *   npx tsx src/scripts/crawler.ts
 *   npx tsx src/scripts/crawler.ts --full       (crawl semua halaman)
 *   npx tsx src/scripts/crawler.ts --pages=5    (crawl 5 halaman pertama)
 *   npx tsx src/scripts/crawler.ts --slug=one-piece  (crawl 1 komik spesifik)
 *
 * ========================================================
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  getHomepage,
  getComicDetail,
  getChapterImages,
  getComicsList,
  type Comic,
} from "../lib/scraper";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

// ======================================================
// Configuration
// ======================================================
const DELAY_BETWEEN_REQUESTS_MS = 1000; // Jeda antar request agar tidak kena rate-limit
const DELAY_BETWEEN_CHAPTERS_MS = 1000; // Jeda lebih lama untuk chapter (banyak image)
const MAX_CHAPTERS_PER_COMIC = 0; // 0 = semua chapter, >0 = limit (untuk testing)
const COMIC_TYPES = ["manhwa", "manga", "manhua"];

// Daftar slug komik yang INGIN DILEWATI (Skip)
const EXCLUDE_SLUGS: string[] = [
  // Tambahkan slug di sini jika ingin melewati komik tertentu
];

let totalScrapedCount = 0; // tracker jumlah manga yang di scrape di sesi ini

// ======================================================
// Helpers
// ======================================================

// Helper untuk Random Delay: Biar bot terlihat seperti manusia (contoh: acak 1.5 detik s/d 3 detik)
function randomSleep(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Untuk sementara keep fungsi sleep lama agar tidak merusak kode lain,
// namun isinya bisa dimodifikasi menggunakan random logic jika mau.
function sleep(ms: number): Promise<void> {
  const min = Math.max(0, ms - ms * 0.2); // -20%
  const max = ms + ms * 0.2; // +20%
  return randomSleep(min, max);
}

function log(emoji: string, ...args: unknown[]) {
  const timestamp = new Date().toLocaleTimeString("id-ID");
  console.log(`[${timestamp}] ${emoji}`, ...args);
}

// Helper untuk Telegram Notification
async function sendTelegramAlert(message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    console.error("Failed to send Telegram alert:", err);
  }
}

// ======================================================
// Core: Upsert Comic ke Database
// ======================================================
async function upsertComic(comic: Comic): Promise<string> {
  const existing = await prisma.comic.findUnique({
    where: { slug: comic.slug },
  });

  if (existing) {
    await prisma.comic.update({
      where: { slug: comic.slug },
      data: {
        title: comic.title,
        coverUrl: comic.coverImage,
        type: comic.type || "MANGA",
        status: comic.status || "ONGOING",
        rating: comic.rating || 0,
        totalViews: comic.views || 0,
      },
    });
    log("🔄", `Update: ${comic.title}`);
    return existing.id;
  } else {
    const created = await prisma.comic.create({
      data: {
        title: comic.title,
        slug: comic.slug,
        coverUrl: comic.coverImage,
        type: comic.type || "MANGA",
        status: comic.status || "ONGOING",
        rating: comic.rating || 0,
        totalViews: comic.views || 0,
        sourceUrl: `https://komiku.org/manga/${comic.slug}/`,
      },
    });
    log("✅", `New: ${comic.title}`);

    // Telegram Alert (Komik Baru)
    const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    await sendTelegramAlert(`🆕 <b>Manga Baru Ditambahkan!</b>\n\n📌 <b>Judul:</b> ${comic.title}\n🏷️ <b>Tipe:</b> ${comic.type}\n\n<a href="${url}/comics/${comic.slug}">Baca Sekarang</a>`);

    return created.id;
  }
}

// ======================================================
// Core: Upsert Genres
// ======================================================
async function upsertGenres(comicId: string, genres: string[]) {
  if (!genres || genres.length === 0) return;

  const genreRecords = [];
  for (const genreName of genres) {
    const slug = genreName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (!slug) continue;

    let genre = await prisma.genre.findUnique({ where: { slug } });
    if (!genre) {
      genre = await prisma.genre.create({
        data: { name: genreName, slug },
      });
      log("🏷️", `Genre baru: ${genreName}`);
    }
    genreRecords.push(genre);
  }

  // Connect genres ke comic
  await prisma.comic.update({
    where: { id: comicId },
    data: {
      genres: {
        set: genreRecords.map((g) => ({ id: g.id })),
      },
    },
  });
}

// ======================================================
// Core: Upsert Chapters
// ======================================================
async function upsertChapters(
  comicId: string,
  comicSlug: string,
  chapters: { number: number; slug: string; title?: string }[]
) {
  let saved = 0;
  let skipped = 0;

  const chaptersToProcess =
    MAX_CHAPTERS_PER_COMIC > 0
      ? chapters.slice(0, MAX_CHAPTERS_PER_COMIC)
      : chapters;

  for (const chapter of chaptersToProcess) {
    // Cek apakah chapter sudah ada
    const existing = await prisma.chapter.findUnique({
      where: {
        comicId_number: {
          comicId,
          number: chapter.number,
        },
      },
    });

    if (existing) {
      skipped++;
      continue;
    }

    // Ambil gambar chapter
    log("📖", `  Fetching images: ${comicSlug} / ${chapter.slug}...`);
    const chapterData = await getChapterImages(comicSlug, chapter.slug);

    if (chapterData && chapterData.images.length > 0) {
      await prisma.chapter.create({
        data: {
          comicId,
          number: chapter.number,
          slug: chapter.slug,
          title: chapter.title || `Chapter ${chapter.number}`,
          images: chapterData.images, // JSON array of URL strings
        },
      });
      saved++;
      log(
        "📄",
        `  Saved: Ch.${chapter.number} (${chapterData.images.length} images)`
      );

      // Telegram Alert (Chapter Baru)
      const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await sendTelegramAlert(`🔥 <b>Chapter Baru Rilis!</b>\n\n📌 <b>Manga:</b> ${comicSlug}\n📖 <b>Chapter:</b> ${chapter.number}\n\n<a href="${url}/comics/${comicSlug}/${chapter.slug}">Baca Chapter ${chapter.number}</a>`);
    } else {
      log("⚠️", `  No images for: ${chapter.slug}`);
    }

    await sleep(DELAY_BETWEEN_CHAPTERS_MS);
  }

  log(
    "📊",
    `  Chapters: ${saved} saved, ${skipped} skipped (already exist)`
  );
}

// ======================================================
// Core: Crawl satu komik secara lengkap
// ======================================================
async function crawlSingleComic(comic: Comic) {
  if (EXCLUDE_SLUGS.includes(comic.slug)) {
    log("⏭️", `--- Skip (Blacklisted): ${comic.title} (${comic.slug}) ---`);
    return;
  }

  log("🔍", `--- Crawling: ${comic.title} (${comic.slug}) ---`);

  // 1. Upsert comic dasar
  const comicId = await upsertComic(comic);

  // 2. Ambil detail (sinopsis, genre, chapters)
  const detail = await getComicDetail(comic.slug);
  if (!detail) {
    log("❌", `  Gagal ambil detail untuk: ${comic.slug}`);
    return;
  }

  // 3. Update dengan data detail
  await prisma.comic.update({
    where: { id: comicId },
    data: {
      description: detail.synopsis || null,
      author: detail.author || null,
    },
  });

  // 4. Upsert genres
  await upsertGenres(comicId, detail.genres);

  // 5. Upsert chapters + images
  if (detail.chapters.length > 0) {
    log("📚", `  Total chapters: ${detail.chapters.length}`);
    await upsertChapters(comicId, comic.slug, detail.chapters);
  } else {
    log("⚠️", `  Tidak ada chapter ditemukan`);
  }

  totalScrapedCount++; // increment karena berhasil di scrape!

  await sleep(DELAY_BETWEEN_REQUESTS_MS);
}

// ======================================================
// Mode 1: Crawl dari Homepage (quick)
// ======================================================
async function crawlHomepage() {
  log("🏠", "=== MODE: Homepage Crawl ===");

  const homepage = await getHomepage();
  const allComics = [
    ...homepage.trending,
    ...homepage.manhwa,
    ...homepage.manga,
  ];

  // Deduplicate by slug
  const uniqueMap = new Map<string, Comic>();
  allComics.forEach((c) => uniqueMap.set(c.slug, c));
  const uniqueComics = Array.from(uniqueMap.values());

  log("📋", `Total komik unik dari homepage: ${uniqueComics.length}`);

  for (let i = 0; i < uniqueComics.length; i++) {
    log("📌", `[${i + 1}/${uniqueComics.length}]`);
    await crawlSingleComic(uniqueComics[i]);
  }
}

// ======================================================
// Mode 2: Crawl dari listing pages (full)
// ======================================================
async function crawlFull(maxPages: number, order: string = "latest") {
  log("🌐", `=== MODE: Full Crawl (max ${maxPages} pages per type, order: ${order}) ===`);

  for (const type of COMIC_TYPES) {
    log("📂", `\n--- Crawling type: ${type.toUpperCase()} ---`);

    for (let page = 1; page <= maxPages; page++) {
      log("📄", `Halaman ${page}/${maxPages} (${type})...`);

      const comics = await getComicsList({ type, order, page });

      if (comics.length === 0) {
        log("🏁", `Halaman ${page} kosong, selesai untuk ${type}`);
        break;
      }

      log("📋", `Ditemukan ${comics.length} komik di halaman ${page}`);

      for (let i = 0; i < comics.length; i++) {
        log("📌", `[Page ${page} - ${i + 1}/${comics.length}]`);
        await crawlSingleComic(comics[i]);
      }

      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }
  }
}

// ======================================================
// Mode 2.5: Crawl Paling Populer (Views)
// ======================================================
async function crawlPopular(maxPages: number) {
  await crawlFull(maxPages, "views");
}

// ======================================================
// Mode 3: Crawl 1 komik spesifik
// ======================================================
async function crawlBySlug(slug: string) {
  log("🎯", `=== MODE: Single Comic (${slug}) ===`);

  const detail = await getComicDetail(slug);
  if (!detail) {
    log("❌", `Komik tidak ditemukan: ${slug}`);
    return;
  }

  const comic: Comic = {
    id: detail.id,
    title: detail.title,
    slug: detail.slug,
    coverImage: detail.coverImage,
    type: detail.type,
    status: detail.status,
    rating: detail.rating,
    views: detail.views,
    totalChapters: detail.totalChapters,
  };

  await crawlSingleComic(comic);
}

// ======================================================
// Main Entry
// ======================================================
async function main() {
  const args = process.argv.slice(2);

  log("🚀", "Manga Reader Crawler Started");
  log("⏰", `Waktu mulai: ${new Date().toLocaleString("id-ID")}`);

  const startTime = Date.now();

  try {
    if (args.includes("--all")) {
      // === MODE ALL: Popular dulu, lalu Latest ===
      const pagesArg = args.find((a) => a.startsWith("--pages="));
      const maxPages = pagesArg ? parseInt(pagesArg.split("=")[1]) : 50;

      log("🔥", "=== MODE: ALL (Popular → Latest) ===");
      log("📖", `Akan menjalankan ${maxPages} halaman per tipe, per urutan.`);

      // Tahap 1: Popular (Most Viewed)
      log("", "\n🏆🏆🏆 TAHAP 1: POPULAR (Most Viewed) 🏆🏆🏆");
      await crawlFull(maxPages, "views");

      // Tahap 2: Latest (Terbaru)
      log("", "\n📰📰📰 TAHAP 2: LATEST (Terbaru) 📰📰📰");
      await crawlFull(maxPages, "latest");

    } else if (args.includes("--full")) {
      // Full crawl (default 50 pages per type)
      const pagesArg = args.find((a) => a.startsWith("--pages="));
      const maxPages = pagesArg ? parseInt(pagesArg.split("=")[1]) : 50;
      await crawlFull(maxPages);
    } else if (args.includes("--popular")) {
      // Popular crawl (paling banyak dilihat)
      const pagesArg = args.find((a) => a.startsWith("--pages="));
      const maxPages = pagesArg ? parseInt(pagesArg.split("=")[1]) : 999;

      if (maxPages > 100) {
        log("🔥", "Menjalankan mode POPULAR ALL (akan berhenti jika halaman kosong)");
      }

      await crawlPopular(maxPages);
    } else if (args.find((a) => a.startsWith("--slug="))) {
      // Single comic
      const slug = args.find((a) => a.startsWith("--slug="))!.split("=")[1];
      await crawlBySlug(slug);
    } else if (args.find((a) => a.startsWith("--pages="))) {
      // Specific pages
      const maxPages = parseInt(
        args.find((a) => a.startsWith("--pages="))!.split("=")[1]
      );
      await crawlFull(maxPages);
    } else {
      // Default: homepage only
      await crawlHomepage();
    }

    // Print summary
    const comicCount = await prisma.comic.count();
    const chapterCount = await prisma.chapter.count();
    const genreCount = await prisma.genre.count();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    log("", "\n========================================");
    log("✅", "CRAWLING SELESAI!");
    log("", "========================================");
    log("📈", `Di-scrape Sesi Ini : ${totalScrapedCount} komik`);
    log("📊", `Total Komik di DB  : ${comicCount}`);
    log("📊", `Total Chapter di DB: ${chapterCount}`);
    log("📊", `Total Genre di DB  : ${genreCount}`);
    log("⏱️", `Waktu total        : ${elapsed} detik`);
    log("", "========================================\n");
  } catch (error) {
    log("💥", "FATAL ERROR:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
