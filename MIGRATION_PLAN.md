# 🔄 Rencana Migrasi Scraper ke v1.kiryuu.to

> ✅ **Status: AMAN** — Tidak ada Cloudflare Challenge di domain ini.
> Situs menggunakan WordPress tema Madara (HTML klasik), sangat mudah di-scrape.

---

## 📊 ANALISIS STRUKTUR v1.kiryuu.to

### URL Pattern yang Ditemukan:
| Halaman | URL |
|---|---|
| **Homepage** | `https://v1.kiryuu.to/` |
| **Daftar Manga (Popular)** | `https://v1.kiryuu.to/manga/?order=popular&page=1` |
| **Daftar Manga (Latest)** | `https://v1.kiryuu.to/manga/?order=latest&page=1` |
| **Detail Komik** | `https://v1.kiryuu.to/manga/{slug}/` |
| **Baca Chapter** | `https://v1.kiryuu.to/manga/{slug}/chapter-{num}.{id}/` |
| **Search** | `https://v1.kiryuu.to/?s={query}` |

### Info yang Tersedia di Halaman Detail:
- Judul, Cover Image, Sinopsis (deskripsi)
- Tipe (Manga/Manhwa/Manhua), Status (Ongoing/Completed)
- Genre, Author, Released Year, Total Views
- Daftar Chapter (lengkap dengan link)

### Info di Halaman Chapter:
- Gambar manga (di dalam container reader)
- Navigasi Prev/Next chapter
- Format slug chapter: `chapter-{number}.{uniqueId}`

---

## FASE 1: Persiapan Environment

- [ ] **1.1** Ubah `TARGET_DOMAIN` di `.env`:
  ```
  TARGET_DOMAIN="https://v1.kiryuu.to"
  ```
- [ ] **1.3** (Opsional) Reset database jika ingin data bersih:
  ```sql
  TRUNCATE TABLE "Chapter", "_ComicGenres", "Genre", "Comic" RESTART IDENTITY CASCADE;
  ```
  > Atau biarkan data Komiku tetap ada, data Kiryuu yang baru akan ditambahkan di sampingnya.

---

## FASE 2: Modifikasi `src/lib/scraper.ts`

Karena v1.kiryuu.to pakai WordPress Madara (HTML biasa), kita hanya perlu **menyesuaikan CSS Selector** di fungsi parser. Tidak perlu rombak total.

### Yang Perlu Diubah:
- [ ] **2.1** Ganti `TARGET_DOMAIN` default ke `"https://v1.kiryuu.to"`
- [ ] **2.2** Ganti `API_DOMAIN` (tidak dibutuhkan lagi, hapus saja)
- [ ] **2.3** Tulis ulang `parseDaftarCards()` untuk tema Madara (selector berbeda dari Komiku)
  - Selector listing: `.page-item-detail` atau `.manga-item` 
  - Cover: `.item-thumb img`
  - Title: `.post-title h3 a`
  - Type badge: selector di dalam card
- [ ] **2.4** Tulis ulang `getComicDetail()`:
  - Judul: `.post-title h1`
  - Cover: `.summary_image img`
  - Sinopsis: `.description-summary .summary__content p`
  - Genre: `.genres-content a`
  - Status: `.post-status .summary-content`
  - Chapter list: `.wp-manga-chapter a`
- [ ] **2.5** Tulis ulang `getChapterImages()`:
  - Container gambar: `.reading-content img` atau `.page-break img`
  - Navigasi: link prev/next di dalam breadcrumb/nav
- [ ] **2.6** Tulis ulang `getComicsList()`:
  - URL: `${TARGET_DOMAIN}/manga/?order={order}&page={page}`
  - Paginasi sudah built-in via query parameter
- [ ] **2.7** Tulis ulang `searchComics()`:
  - URL: `${TARGET_DOMAIN}/?s={query}&post_type=wp-manga`
- [ ] **2.8** Hapus fungsi parser lama Komiku yang tidak dipakai lagi:
  - `parseBgeCards()`, `parseHomepageRanking()`, `parseInfoTable()`, dll

---

## FASE 3: Penyesuaian Crawler & API

- [ ] **3.1** Ubah `sourceUrl` di `crawler.ts` ke `https://v1.kiryuu.to/manga/${slug}/`
- [ ] **3.2** Sesuaikan format slug chapter (Kiryuu: `chapter-1.153249`, Komiku: `komik-chapter-1`)
- [ ] **3.3** Update Image Proxy Referer di `/api/img/route.ts` ke `https://v1.kiryuu.to`
- [ ] **3.4** Perbarui `EXCLUDE_SLUGS` jika ada komik yang mau dilewati

---

## FASE 4: Testing

- [ ] **4.1** Test scrape 1 komik:
  ```bash
  npx tsx src/scripts/crawler.ts --slug=magic-emperor
  ```
- [ ] **4.2** Test scrape homepage:
  ```bash
  npx tsx src/scripts/crawler.ts
  ```
- [ ] **4.3** Test mode popular:
  ```bash
  npx tsx src/scripts/crawler.ts --popular --pages=2
  ```
- [ ] **4.4** Cek gambar muncul di browser (buka web localhost:3000)

---

## ⏱️ ESTIMASI

| Item | Estimasi |
|---|---|
| **Waktu Pengerjaan** | 1-2 Jam |
| **Tingkat Kesulitan** | ⭐⭐ (2/5) — HTML biasa, sangat mudah |
| **Risiko Gagal** | Rendah — Tidak ada Cloudflare |
| **Kebutuhan Tools Tambahan** | Tidak ada — Cukup axios + cheerio yang sudah ada |

---

> **Status:** Siap dikerjakan! Bilang **"Lanjut Fase 2"** untuk mulai modifikasi scraper.
