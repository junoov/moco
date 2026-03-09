# 🔄 Rencana Migrasi Scraper dari Kiryuu.online ke Komiku.org

Dokumen ini berisi langkah-langkah sistematis untuk memindahkan target pengambilan data (scraping) dari Kiryuu (yang berbasis Next.js) ke Komiku.org (yang berbasis HTML klasik / WordPress).

---

## FASE 1: Persiapan & Pembersihan Database
Karena struktur URL (slug) dan format ID antara Kiryuu dan Komiku berbeda, sangat disarankan untuk mengosongkan database terlebih dahulu agar tidak terjadi bentrok data.

- [ ] **Langkah 1.1:** Hentikan semua proses crawler yang sedang berjalan.
- [ ] **Langkah 1.2:** Ubah `TARGET_DOMAIN` di file `.env` menjadi `"https://komiku.org"`.
- [ ] **Langkah 1.3:** Reset isi database di Supabase.
  * *Perintah:* `npx prisma db push --force-reset`

---

## FASE 2: Rombak Total `src/lib/scraper.ts`
Fungsi scraper saat ini sangat bergantung pada pembacaan kode "RSC Payload" milik Next.js (Kiryuu). Karena Komiku.org menggunakan HTML biasa, seluruh logika scraper harus diganti menggunakan `cheerio` untuk mencari elemen HTML (seperti `div`, `img`, `a`).

Fungsi utama yang harus dirombak ulang dari nol:
- [ ] **`getHomepage()`**: Mengambil daftar komik terbaru dari halaman depan Komiku.
  - *Target DOM:* Cari `div` khusus list komik terbaru (biasanya berkelas `bge` atau sejenisnya di Komiku).
- [ ] **`getComicDetail(slug)`**: Mengambil judul, cover, sinopsis, genre, dan daftar chapter komik.
  - *Target DOM:* Cari elemen tabel info, dan daftar loop `<li>` atau `<tr>` untuk chapter.
- [ ] **`getChapterImages(comicSlug, chapterSlug)`**: Mengambil daftar URL gambar dalam satu halaman chapter.
  - *Target DOM:* Cari kontainer gambar membaca (biasanya `<div id="Baca_Komik"> img`).
- [ ] **`searchComics(query)`**: Fungsi pencarian komik di Komiku.
- [ ] **`getComicsList()`**: Fungsi daftar komik (Manhwa/Manga page).

*Catatan:* Semua fungsi pembantu RSC seperti `decodeRscPayload` dan `normalizeRscValue` bisa **dihapus** karena sudah tidak terpakai.

---

## FASE 3: Penyesuaian API & Frontend
Walaupun API sudah bagus karena menghubungkan database, ada beberapa logika kecil yang mem-bypass ke `scraper.ts`.

- [ ] **Periksa file:** `src/app/api/comics/[slug]/[chapter]/route.ts`
  Pastikan fitur ganti domain otomatis tidak rusak dengan URL gambar dari Komiku.org (Komiku biasanya menyimpan gambar di CDN seperti `cdn.komiku.co.id`).
  *Update regex replace agar juga menangkap struktur CDN Komiku.*

---

## FASE 4: Pengetesan & Penyesuaian Crawler
Setiap website memiliki tingkat penolakan (rate limit) yang berbeda.

- [ ] **Langkah 4.1:** Ubah `EXCLUDE_SLUGS` di `src/scripts/crawler.ts` jika ada komik spesifik di Komiku yang ingin dilewati.
- [ ] **Langkah 4.2:** Lakukan percobaan scraping pada 1 komik:
  * *Perintah:* `npx tsx src/scripts/crawler.ts --slug=komik-one-piece` (sesuaikan slug dengan format Komiku)
- [ ] **Langkah 4.3:** Jika file gambar gagal dimuat akibat proteksi "Hotlinking" dari Komiku, tambahkan *Image Proxy* ringan di `next.config.ts` atau buat endpoint sederhana yang mem-bypass referrer.
- [ ] **Langkah 4.4:** Jalankan `Homepage Crawl` untuk mengeksekusi update harian.

---

> **Estinasi Waktu Pengerjaan:** 1-3 Jam (Sangat bergantung pada kecepatan mencari Class/ID HTML dari struktur web Komiku.org).
> **Status:** Siap dieksekusi! Jika kamu mau mulai, bilang: *"Ayo kerjakan Fase 1"* atau *"Buatkan kode scraper baru untuk Fase 2"*.
