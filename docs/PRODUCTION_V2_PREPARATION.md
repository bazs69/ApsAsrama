# Production V2 Preparation Guide

Dokumen ini berisi panduan dan *checklist* arsitektur abstraksi (Adapters) yang disiapkan pada Tahap 5D.4 untuk mempermudah migrasi ke infrastruktur **Production V2** (seperti penggunaan Redis, Sentry, BullMQ) tanpa perlu melakukan *refactor* besar pada *Business Layer*.

## Architecture Adapters

Sistem saat ini tidak lagi bergantung secara langsung pada *local state* atau implementasi memori. Semua modul bisnis dan aksi server memanggil fungsi melalui *Adapter Layer*.

### 1. Monitoring Adapter
**Lokasi**: `src/lib/monitoring/monitorAdapter.ts`
- **Fungsi**: Membungkus pencatatan (*logging/monitoring*) untuk _Error, Security, Mutation_, dll.
- **V2 Migration**: Ganti implementasi internal (`monitor.trackError`) agar memanggil SDK eksternal seperti `@sentry/nextjs` atau *Datadog APM*.

### 2. Notification Dispatcher
**Lokasi**: `src/lib/notifications/notificationDispatcher.ts`
- **Fungsi**: Memisahkan logika pembuatan notifikasi dari aksi *Server* yang memanggilnya. Saat ini masih _synchronous_.
- **V2 Migration**: Ubah isi `dispatchNotification` dari pemanggilan langsung fungsi DB menjadi *push message* ke dalam sistem *Queue* (misalnya Redis / BullMQ / RabbitMQ) untuk dieksekusi secara asinkron (*Event Bus*).

### 3. RateLimiter Adapter
**Lokasi**: `src/lib/security/rateLimiterAdapter.ts`
- **Fungsi**: Melakukan pembatasan akses (*rate limit*) API. Mengisolasi pemakaian `MemoryStore`.
- **V2 Migration**: Ganti instansiasi `crudStore` dari `MemoryStore` menjadi `RedisStore` (atau ekuivalennya) yang berbagi _state_ ke seluruh klaster pod/server.

### 4. Pagination Strategy
**Lokasi**: `src/lib/pagination/paginationStrategy.ts`
- **Fungsi**: Kontrak (*Interface*) standar untuk memformat respon paginasi.
- **V2 Migration**: Tambahkan implementasi *class* `CursorPaginationStrategy` untuk endpoint data masif (>1.000.000 *records*) tanpa mengganggu struktur `OffsetPaginationStrategy` yang masih bisa dipakai untuk tabel kecil.

### 5. Health Utilities
**Lokasi**: `src/lib/health/systemHealth.ts`
- **Fungsi**: Memeriksa *health check* berbagai komponen vital server.
- **V2 Migration**: Ganti `isCacheHealthy()` dan `isQueueHealthy()` (yang saat ini merupakan *placeholder `return true`*) dengan koneksi uji ke Redis atau antrean RabbitMQ.

---

## Migration Checklist (To-Do for V2)

- [ ] **Redis Integration**: 
  - Install `ioredis` atau `redis`.
  - Pasang di `rateLimiterAdapter.ts` dan `systemHealth.ts`.
- [ ] **Background Queue**: 
  - Gunakan `bullmq` untuk asinkronisasi `notificationDispatcher.ts`.
- [ ] **External Monitoring**: 
  - Hubungkan *DataDog* / *Sentry* pada `monitorAdapter.ts`.
- [ ] **Cursor Pagination**: 
  - Terapkan di *endpoints* tabel bervolume raksasa seperti `AuditLog`.
- [ ] **Strict ENV Validation**: 
  - Evolusi utilitas `env.ts` menggunakan Zod Schema agar aplikasi menolak untuk menyala (fail-fast) bila ada kunci rahasia/lingkungan yang terlewat.

---
*Generated internally for zero-regression scale transitions.*
