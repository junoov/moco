# 📋 TASK LIST — Manga Reader

> Daftar bug & fitur yang belum selesai.
> **Kerjakan dari atas ke bawah!**

---

## 🔴 BUG-1: Chapter Komik Tidak Bisa Dibuka (PRIORITAS TERTINGGI)

### Masalah
Chapter manga/komik **tidak muncul** di halaman detail dan **tidak tersimpan** oleh crawler.
Fungsi `getComicDetail()` di `src/lib/scraper.ts` return `chapters: []` (kosong).

### Penyebab
Regex chapter di scraper tidak cocok dengan format data RSC kiryuu.online.

### Cara Memperbaiki

**Step 1:** Download HTML halaman detail untuk debug
```bash
node -e "const axios=require('axios'); axios.get('https://kiryuu.online/manga/komik-one-piece-indo',{headers:{'User-Agent':'Mozilla/5.0'}}).then(r=>require('fs').writeFileSync('debug_detail.html',r.data))"
```

**Step 2:** Decode RSC payload dari file tersebut
```bash
node -e "const fs=require('fs'); const html=fs.readFileSync('debug_detail.html','utf8'); const chunks=[]; const re=/self\.__next_f\.push\(\[1,\s*\"((?:\\\\.|[^\"\\\\])*)\"\]\)/g; let m; while((m=re.exec(html))!==null){try{chunks.push(JSON.parse('[\"'+m[1]+'\"]')[0])}catch{chunks.push(m[1])}} const raw=chunks.join('').replace(/\\\\\"/g,'\"').replace(/\\\\\//g,'/'); fs.writeFileSync('debug_payload.txt',raw); console.log('Payload length:',raw.length)"
```

**Step 3:** Cari format chapter di dalam payload
```bash
node -e "const raw=require('fs').readFileSync('debug_payload.txt','utf8'); const idx=raw.indexOf('chapter'); console.log(raw.slice(Math.max(0,idx-100), idx+500))"
```
Perhatikan format asli datanya. Kemungkinan field-nya bukan `"number":1,"slug":"..."` tapi field urutan yang berbeda, misal `"slug":"...","number":1` atau pakai nama field lain.

**Step 4:** Setelah tau format aslinya, edit regex di `src/lib/scraper.ts`
- Buka file `src/lib/scraper.ts`
- Cari fungsi `getComicDetail()` (sekitar baris 285-394)
- Edit regex `chapterRegex` (baris ~329) dan `altChapterRegex` (baris ~342) agar cocok dengan format yang kamu temukan di Step 3

**Step 5:** Test hasilnya
```bash
npx tsx -e "import {getComicDetail} from './src/lib/scraper'; getComicDetail('komik-one-piece-indo').then(d => console.log('Title:', d?.title, '| Chapters:', d?.chapters.length, '| First:', d?.chapters[0]?.slug))"
```
✅ Berhasil kalau output menunjukkan `Chapters: > 0`

**Step 6:** Test chapter images juga
```bash
npx tsx -e "import {getChapterImages} from './src/lib/scraper'; getChapterImages('komik-one-piece-indo','one-piece-chapter-1176').then(d => console.log('Images:', d?.images.length))"
```
✅ Berhasil kalau output menunjukkan `Images: > 0`

**Step 7:** Hapus file debug
```bash
del debug_detail.html debug_payload.txt
```

---

## 🟡 TASK-1: Re-run Crawler Setelah Bug Fix
Setelah BUG-1 selesai, jalankan ulang crawler agar chapter masuk ke database:
```bash
# Test 1 komik dulu
npx tsx src/scripts/crawler.ts --slug=komik-one-piece-indo

# Kalau berhasil, crawl semua dari homepage
npx tsx src/scripts/crawler.ts

# Atau crawl lebih banyak (3 halaman per tipe)
npx tsx src/scripts/crawler.ts --pages=3
```

---

## 🟡 FASE 6: Migrasi API ke Database-first (SELESAI ✅)

### ~TASK-4: Ubah `/api/comics` → baca dari database~
- Selesai! Homepage kini loading instan dari Prisma dengan scraper sebagai fallback.

### ~TASK-5: Ubah `/api/comics/[slug]` → baca dari database~
- Selesai! Halaman detail komik mengambil data & join dengan table chapters + genres.

### ~TASK-6: Ubah `/api/comics/[slug]/[chapter]` → baca dari database~
- Selesai! Halaman baca menyimpan array gambar dan navigasi prev/next.

### ~TASK-7: Ubah `/api/search` → baca dari database~
- Selesai! Search menggunakan pencarian 'contains' yang tidak case-sensitive.

### ~TASK-8: Tambah fallback live-scrape~
- Selesai! Semuanya otomatis pakai `getHomepage()` dll jika Prisma return null/kosong.

---

## 🟢 TASK-3: Fitur Tambahan (Opsional)
- [ ] Bookmarking (localStorage)
- [ ] Reading history
- [ ] Lazy loading gambar
- [ ] PWA offline
- [ ] Deploy ke Vercel
- [ ] Cron job crawler otomatis

---

## 📂 File Referensi
| File | Kegunaan |
|------|----------|
| `PLANNING.md` | Arsitektur & status semua fase |
| `TASK.md` | **FILE INI** — daftar kerja |
| `src/lib/scraper.ts` | Fungsi scraping (yang perlu di-fix) |
| `src/lib/prisma.ts` | Koneksi database Prisma |
| `src/scripts/crawler.ts` | Bot crawler |
