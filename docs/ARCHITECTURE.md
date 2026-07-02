# System Architecture Overview

Sistem APS Asrama adalah aplikasi berbasis Next.js dengan Server Actions dan ORM Prisma, yang berfokus pada ketahanan (reliability), keamanan berlapis (RBAC), dan pemisahan logika bisnis (Business Layer).

## Folder Structure
```
src/
├── app/
│   ├── actions/       # Server Actions (Entry Point dari UI)
│   ├── api/           # Route Handlers (REST & Health)
│   └── dashboard/     # UI Pages
├── components/        # Reusable React Components
└── lib/
    ├── auth/          # Sistem Token JWT & Session Invalidation Store
    ├── business/      # Domain Logic (UserBusiness, ResidentBusiness, dll)
    ├── health/        # Agregator System Health 
    ├── notifications/ # Notification Dispatcher
    ├── prisma/        # Koneksi database & Query Error Mapper
    ├── queue/         # Bulk Import Dispatcher
    └── security/      # RBAC, Rate Limiter, secureAction Wrapper
```

## Authentication & Authorization Flow
1. **Authentication**: Menggunakan NextAuth dengan strategi JWT. Saat login, `auth.ts` menarik profil dan *roles*. Session divalidasi dengan `MemorySessionInvalidationStore` untuk menendang (*kick-out*) akun kedaluwarsa secara O(1).
2. **Authorization**: Hak akses granular dilindungi oleh `src/lib/security/permissions.ts`.
3. **secureAction**: Fungsi *wrapper* universal di `src/lib/security/secureAction.ts` yang bertugas sebagai *gatekeeper*. Fungsi ini memastikan *user* terotentikasi, punya izin spesifik, mencatat Audit Log otomatis, menangani _error_ terpusat, dan menyerap eksekutor bisnis.

## Business Layer & Server Actions
*Server Actions* hanya berfungsi sebagai pengurai (parser) masukan dan lapisan jaringan. Algoritma rumit, validasi referensi silang, dan *business rule* ditempatkan di dalam class *Business* di `/lib/business` untuk memudahkan *Unit Testing*.

## Prisma & Database
Skema Prisma menyimpan fondasi data relasional (*PostgreSQL*). Skema ini bersifat ketat (*Zero Regression rule*), artinya optimasi fitur aplikasi yang kompleks harus dilakukan melalui perbaikan pola abstraksi, bukan dengan merusak keutuhan migrasi. *Keyset (Cursor) Pagination* diterapkan untuk kueri bervolume tinggi seperti log audit.

## Dispatcher, Adapter & Monitoring
Untuk menyiapkan migrasi sistem ke arsitektur *Microservices/Event-Driven* V2, semua fitur infrastruktur dibungkus pola *Adapter/Dispatcher*:
- `importDispatcher.ts`: Menangani antrean (saat ini diteruskan sinkron).
- `notificationDispatcher.ts`: Pemancar pesan asinkron yang dibatasi fail-safe.
- `rateLimiterAdapter.ts`: Pembatas laju aksi per pengguna via *Token Bucket*.
- `monitorAdapter.ts`: Titik abstraksi untuk pengiriman status aplikasi (APM).

## Migration Path: Production V2 (Redis & BullMQ & Kubernetes)
Arsitektur ini didesain 100% siap untuk pergeseran mesin infrastruktur (Production V2).
1. **Redis**: Dapat langsung dipasangkan pada `rateLimiterAdapter.ts` dan `sessionInvalidationStore.ts` tanpa mengubah 1 baris pun di dalam *Business Layer*.
2. **BullMQ**: Dapat dipasang ke dalam `importDispatcher` dan `notificationDispatcher` untuk menjalankan tugas-tugas berat di *worker node* terpisah.
3. **Kubernetes**: Berkat abstraksi penyimpanan sesi memori ke Redis (Kelak) dan `Dockerfile` berformat `standalone`, arsitektur ini sudah berwujud *Stateless Server* yang aman digandakan (*Horizontal Scaling*).
