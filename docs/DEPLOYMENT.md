# Deployment Guide (Production V1)

Panduan ini berisi langkah-langkah untuk melakukan *deploy* aplikasi Next.js ke lingkungan Production, baik melalui bare-metal PM2 maupun Docker.

## 1. Instalasi Lingkungan
Pastikan server memiliki:
- Node.js 22 LTS (jika menggunakan PM2)
- Docker & Docker Compose (jika menggunakan Docker)
- PostgreSQL 15+
- Nginx

## 2. Clone Repository & Install Dependencies
```bash
git clone https://github.com/your-repo/aps-asrama.git
cd aps-asrama
npm ci
```

## 3. Environment Setup
Salin file `.env.example` ke `.env` dan isi variabel produksi.
```bash
cp .env.example .env
nano .env
```
Pastikan `DATABASE_URL`, `NEXTAUTH_SECRET`, dan `NEXTAUTH_URL` terisi benar. Set `NODE_ENV=production`.

## 4. Migrate Database & Seeding
```bash
npx prisma migrate deploy
npx prisma db seed
```

## 5. Build Aplikasi
```bash
npm run build
```

---

## 6. Opsi A: Menjalankan dengan PM2 (Bare-Metal)
Gunakan PM2 untuk *auto-restart* dan manajemen klaster.
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 6. Opsi B: Menjalankan dengan Docker Compose
Jika menggunakan arsitektur Docker:
```bash
docker-compose up -d --build
```
Ini akan otomatis membangun image *standalone* Alpine dan mengaitkannya dengan *healthcheck*.

---

## 7. Nginx & SSL
Pasang file konfigurasi Nginx dari `nginx.conf` proyek ke `/etc/nginx/nginx.conf` atau *sites-available*.
Restart Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```
Gunakan *Certbot* untuk mendapatkan sertifikat HTTPS gratis (Let's Encrypt):
```bash
sudo certbot --nginx -d yourdomain.com
```

## 8. Rollback
Jika terjadi *error* kritis setelah *deploy*:
1. Kembalikan kode: `git checkout <previous_stable_commit>`
2. (Opsional) kembalikan database menggunakan *Backup Guide*.
3. Bangun ulang: `npm run build`
4. PM2: `pm2 reload all` / Docker: `docker-compose up -d --build`
