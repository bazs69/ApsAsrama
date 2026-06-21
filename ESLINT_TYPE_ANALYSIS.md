# ESLint Type Analysis Report

## Overview
Laporan ini berisi analisis menyeluruh terkait aturan `@typescript-eslint/no-explicit-any` di seluruh proyek DormiSync. Penggunaan `any` mengkompromikan _type safety_ dari TypeScript, namun perbaikan massal memiliki risiko merusak alur data, sehingga perlu pendekatan bertahap.

Total masalah lint terkait `any` saat ini mencapai kurang lebih **179+ instances** yang tersebar di berbagai layer aplikasi.

---

## Daftar Penggunaan `any` dan Analisis

### 1. Layer Actions (Database Mutations & Queries)
**Lokasi Utama:** `src/app/actions/*.ts` (absensiApel, absensiKegiatan, area, assignments, audit, laporan, masterData, monitoring, residents, roomTransfer, rooms, settings, wilayah)
* **Alasan Penggunaan Saat Ini:** Fungsi _Server Actions_ sering menerima parameter `data` bertipe `any` dari _client_ karena skema form input tidak terdefinisi ketat. Selain itu, beberapa pengembalian dari Prisma Query (`prisma.$transaction`, hasil aggregasi) tidak di-_cast_ secara otomatis ke _interface_ yang spesifik.
* **Rekomendasi Type:** 
  - Gunakan tipe spesifik bawaan Prisma seperti `Prisma.ResidentUncheckedCreateInput`, `Prisma.AreaUpdateInput`, dsb.
  - Untuk aggregasi kompleks, buat _Custom Types_ yang diekspor dari satu _file_ terpusat (contoh: `types/dashboard.ts`).
* **Tingkat Risiko Refactor:** **HIGH**
  *(Berisiko merusak fungsionalitas CRUD secara fatal jika tipe yang dikonversi tidak cocok dengan skema Prisma saat _runtime_).*

### 2. Layer API Routes
**Lokasi Utama:** `src/app/api/referensi/*/route.ts`, `api/seed/route.ts`, `api/upload/route.ts`
* **Alasan Penggunaan Saat Ini:** Digunakan saat memparsing request body dari _Client_ `const body: any = await req.json()`, atau saat mengabaikan struktur error kustom.
* **Rekomendasi Type:** 
  - Ganti `any` menjadi antarmuka yang mendeskripsikan _payload_ spesifik, contohnya `interface UploadPayload { fileBase64: string }`.
  - Lebih direkomendasikan lagi menggunakan pustaka validasi skema seperti `Zod` untuk menjamin keamanan _type runtime_.
* **Tingkat Risiko Refactor:** **HIGH**
  *(Dapat memutus integrasi _fetch_ antara Client Component dan Server API).*

### 3. Layer Page Components (Server Components)
**Lokasi Utama:** `src/app/dashboard/*/page.tsx`
* **Alasan Penggunaan Saat Ini:** Digunakan pada tipe argumen untuk parameter bawaan Next.js 13+ (seperti `searchParams` atau `params`) atau saat mengambil data dari _Database_ lalu dipassing ke _Client Component_ yang belum memiliki antarmuka yang ketat.
* **Rekomendasi Type:** 
  - Terapkan tipe bawaan Next.js: `interface PageProps { params: { [key: string]: string }, searchParams: { [key: string]: string | string[] | undefined } }`.
* **Tingkat Risiko Refactor:** **LOW**
  *(Umumnya hanya perbaikan anotasi TypeScript, sangat minim peluang memecah fungsionalitas logika).*

### 4. Layer Client Components (UI & State)
**Lokasi Utama:** `src/components/dashboard/*.tsx` (FormulirClient, MasterDataClient, AbsensiClient, ResidentDetailModal, dsb.)
* **Alasan Penggunaan Saat Ini:** Komponen menerima _props_ dari _Server Component_ berupa struktur _object_ yang rumit, sehingga tipe disederhanakan dengan `any` atau `any[]`. Banyak juga `any` digunakan di dalam iterasi `.map((item: any) => ...)` atau `.filter()`.
* **Rekomendasi Type:** 
  - Mengekspor _Interface_ murni dari _Client Components_ bersangkutan atau menggunakan ekstrak skema model Prisma seperti `Partial<Angkatan>`, `Partial<Resident>`.
  - Hapus tipe _casting_ implisit `any` di dalam fungsi _event handler_.
* **Tingkat Risiko Refactor:** **MEDIUM**
  *(Kesalahan tipe bisa menyebabkan aplikasi React _crash_ saat _rendering_ karena mengakses _property_ yang mungkin `undefined`, seperti yang terjadi sebelumnya).*

---

## Rekomendasi Langkah Selanjutnya

Mengingat risiko yang bervariasi, disarankan untuk melakukan refactor tipe data dalam beberapa fase terpisah:
1. **Fase Page & API (LOW Risk):** Membersihkan parameter halaman dan endpoint API terlebih dahulu.
2. **Fase Client Components (MEDIUM Risk):** Mendefinisikan antarmuka (interface) di seluruh sisi antarmuka pengguna tanpa mengubah struktur data aslinya.
3. **Fase Actions Layer (HIGH Risk):** Menyempurnakan pemetaan parameter pada mutasi _database_ (Prisma).

*Catatan: Dilarang keras melakukan penggantian massal `any` dengan `unknown` karena hal tersebut secara otomatis akan memunculkan ratusan error kompilasi "Object is of type unknown".*
