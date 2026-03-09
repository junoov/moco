# 🚀 Panduan Deployment Manga Reader + Bot Crawler di VPS

Panduan ini berisi langkah-langkah dari awal (nol) sampai website kamu bisa diakses lewat internet (domain.com) dan bot crawlermu jalan 24 jam nonstop di belakang layar VPS (Virtual Private Server).

> **Asumsi:** Kamu menggunakan VPS dengan OS **Ubuntu 20.04 / 22.04 LTS**.

---

## 🛠️ TAHAP 1: Persiapan VPS (Install Dependencies)

Saat baru masuk terminal/console VPS pertama kali, jalankan perintah-perintah ini untuk menginstal Node.js, git, dan PM2 (Process Manager).

**1. Update server:**
```bash
sudo apt update && sudo apt upgrade -y
```

**2. Install Node.js & npm (Versi terbaru 20.x):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

**3. Install Git & PM2:**
*(PM2 inilah alat utamanya yang bikin aplikasi dan bot kita bisa hidup selamanya, bahkan jika VPS mati lalu nyala lagi).*
```bash
sudo apt install git -y
sudo npm install -g pm2
```

---

## 📥 TAHAP 2: Clone Project (Pindahkan Web-mu)

Sekarang, ambil source code `manga-reader` kamu dari Github ke dalam VPS. Posisinya bebas, tapi umumnya kita taruh di folder `/var/www/`.

**1. Clone Project (Ganti link URL repomu):**
```bash
cd ~
git clone https://github.com/USERNAME_KAMU/manga-reader.git
cd manga-reader
```

**2. Install semua library:**
```bash
npm install
```

**3. Setup Environment Variables (.env):**
Buat file env di server, dan isikan data seperti yang ada di lokalmu.
```bash
nano .env
```
*(Paste isi .env lokalmu (DATABASE_URL Supabase dsb) ke dalam terminal teks. Kalau beres tekan `CTRL+X`, `Y`, lalu `Enter`).*

---

## 🏗️ TAHAP 3: Build & Jalankan Website Next.js

Kita akan menyalakan webnya menggunakan `PM2` supaya tidak mati saat kita tutup terminal vps.

**1. Bangun versi production-nya:**
```bash
npm run build
```

**2. Nyalakan server Next.js lewat PM2:**
```bash
# Menjalankan next start dan memberi nama process 'manga-web'
pm2 start npm --name "manga-web" -- start
```

Sekarang web kamu seharusnya sudah hidup di port `3000` dalam VPS.

---

## 🤖 TAHAP 4: Menjalankan Bot Crawler Otomatis 24 Jam

File crawler kita ada di `src/scripts/crawler.ts`. Sayangnya PM2 secara native hanya mengenali Javascript (.js), bukan Typescript (.ts). Kita butuh tools `tsx` untuk mengeksekusinya.

**1. Install TSX Server-side:**
```bash
npm install -g tsx
```

**2. Mulai PM2 untuk Bot Crawler (Contoh mode `--popular` 5 Halaman):**
*Perintah dibawah ini akan menyuruh PM2 menjalankan crawler secara terpisah.*
```bash
# Kita akan menyuruh bot ini merangkak pakai PM2:
pm2 start "npx tsx src/scripts/crawler.ts --popular --pages=5" --name "manga-bot-1"
```

**Atau, jalankan dengan penjadwalan berulang (CRON):**
Jika kamu ingin scraper ini cuma jalan otomatis misal **Setiap jam 2 pagi**, PM2 punya fiturnya:
```bash
# PM2 akan menjalankan bot ini setia jam 02:00 AM (format cron: '0 2 * * *')
pm2 start "npx tsx src/scripts/crawler.ts" --name "manga-bot-daily" --cron-restart="0 2 * * *" --no-autorestart
```

---

## 🔧 TAHAP 5: Perintah Dasar PM2 (Wajib Tahu)

Setelah semua menyala, ini dia "Sihir" dari PM2 yang harus kamu hafal:

- `pm2 list` = Melihat daftar semua yang hidup (Web & Bot).
- `pm2 logs` = Melihat tulisan/console log live dari bot/web.
- `pm2 logs manga-bot-1` = Cuma liat log dari si bot saja.
- `pm2 stop manga-bot-1` = Menghentikan sementara bot crawler.
- `pm2 restart manga-web` = Me-restat website jika ada error.

**SANGAT PENTING: AGAR AUTO-NYALA SAAT SERVER MATI LAMPU:**
Setelah mendaftar semuanya (`manga-web` dan `bot`), kamu wajib melakukan ini agar pengaturannya tersimpan saat mesin VPS di-booting ulang:
```bash
pm2 save
pm2 startup
```
(Lalu mesin akan memberimu satu baris perintah `sudo pm2 env...`. Copy baris itu, dan jalankan/paste tekan enter!)

---

## 🌐 TAHAP 6: (Opsional) Expose Web ke Domain (Nginx)

Saat ini web-mu nyala di port 3000. Pengunjung internet biasanya masuk ke web lewat Port `80` (HTTP) atau `443` (HTTPS/Gembok). Kita butuh "Pak Satpam" yaitu Nginx sebagai jembatan.

**1. Install Nginx:**
```bash
sudo apt install nginx -y
```

**2. Setting Proxy Jembatan:**
```bash
sudo nano /etc/nginx/sites-available/default
```

Hapus smua kodenya, dan ketik ini (Ganti nama domain kamu):
```nginx
server {
    listen 80;
    server_name www.domainmu.com domainmu.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Tekan `CTRL+X`, `Y`, lalu `Enter`.

**3. Restart Nginx:**
```bash
sudo systemctl restart nginx
```

Selamat! Website dan Bot kamu sekarang hidup abadi di Cloud! 🌩️
