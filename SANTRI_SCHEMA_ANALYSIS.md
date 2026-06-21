# Laporan Analisis Schema Santri (Resident) untuk Multi-Step Wizard

## 1. Struktur Model Saat Ini
Berdasarkan `prisma/schema.prisma`, model `Resident` menyimpan data santri. Sebagian besar datanya saat ini masih bertipe `String` (beberapa di antaranya merupakan peninggalan *legacy* sebelum relasi *master data* dibuat).

### Field yang Sudah Ada:
**Data Pribadi & Identitas:**
- `id` (String, UUID)
- `name` (String)
- `nim` (String, Unique)
- `niup` (String?, Unique)
- `photo` (String?)
- `phone` (String?)

**Pendidikan (Masih berupa String statis):**
- `fakultas` (String?)
- `prodi` (String?)
- `angkatan` (String?)

**Asrama / Status (Campuran String & Relasi):**
- `asrama` (String?)
- `wilayah` (String?) - Merujuk ke Wilayah Pondok
- `daerah` (String?) - Merujuk ke Daerah Pondok
- `roomId` (String?) - FK ke `Room`
- `status` (ResidentStatus: ACTIVE / INACTIVE)

**Asal / Domisili (Campuran String & Relasi Wilayah Administratif):**
- `kotaAsal` (String?) - Legacy
- `asalCountryId`, `asalProvinceId`, `asalRegencyId`, `asalDistrictId`, `asalVillageId` (String?) - Relasi FK ke Master Data Wilayah Administratif.

---

## 2. Analisis Relasi

1. **Wilayah Administratif:** Sudah didukung sepenuhnya secara relasional melalui 5 FK (`asalCountryId` s.d `asalVillageId`).
2. **Kamar:** Sudah direlasikan dengan FK `roomId` yang terhubung ke tabel `Room`.
3. **Daerah & Wilayah Pondok:** Tabel `Wilayah` dan `Daerah` sudah ada, dan relasinya berada pada tingkat Kamar (`Room -> Daerah -> Wilayah`). Namun, *field* di `Resident` masih berupa `String` statis (`wilayah`, `daerah`, `asrama`). Rekomendasi: *Field* *string* ini dipertahankan hanya untuk *backward compatibility* dan nantinya diambil secara otomatis berdasarkan Kamar yang dipilih.
4. **Pendidikan:** Master data untuk Pendidikan (`Fakultas`, `Prodi`, `Angkatan`) sudah tersedia di skema. Namun, model `Resident` **belum** memiliki relasi *Foreign Key* ke tabel-tabel ini.

---

## 3. Mapping Kebutuhan Multi-Step Wizard

### Step 1: Biodata (Data Diri)
- **Field Tersedia:** `name`, `nim`, `niup`, `phone`, `photo`.
- **Identifikasi Kekurangan:**
  - `gender` (Jenis Kelamin - L/P)
  - `tempatLahir` (Tempat Lahir)
  - `tanggalLahir` (Tanggal Lahir)
  - `nik` (Nomor Induk Kependudukan - opsional)
  - *Catatan: Jika kebutuhan pondok sederhana, atribut ini dapat ditambahkan di kemudian hari. Namun sangat disarankan menambahkannya sekarang sebelum Wizard dibuat.*

### Step 2: Domisili (Wilayah Administratif)
- **Field Tersedia:** `asalCountryId`, `asalProvinceId`, `asalRegencyId`, `asalDistrictId`, `asalVillageId`.
- **Identifikasi Kekurangan:**
  - `alamatLengkap` (String) untuk mencatat nama jalan, RT, RW.
  - `kodePos` (String)

### Step 3: Pendidikan (Akademik)
- **Field Tersedia:** `fakultas`, `prodi`, `angkatan` (Semua String).
- **Identifikasi Kekurangan:** Tidak ada FK ke tabel Master Data Pendidikan.
  - **Rekomendasi:** Tambahkan `fakultasId`, `prodiId`, `angkatanId` sebagai relasi FK, dan pertahankan *field* `String` hanya sebagai *legacy*.

### Step 4: Status Santri (Penempatan Asrama)
- **Field Tersedia:** `status`, `roomId`, `wilayah`, `daerah`, `asrama`.
- **Identifikasi Kekurangan:** Pada pemilihan penempatan kamar, *dropdown* Wilayah dan Daerah perlu mem-filter `Room` menggunakan relasi `Room.daerahId`, lalu menyimpan hasilnya ke `roomId`. Atribut *legacy* dapat diotomatisasi (*auto-fill*) melalui sinkronisasi *backend*.

### Step 5: Ringkasan (Review)
- Tidak ada penambahan *field* tabel. Digunakan murni pada UI untuk menampilkan ringkasan data dari Step 1 hingga 4.

---

## 4. Rekomendasi Penambahan / Migrasi *Schema*

Meskipun saat ini belum ada modifikasi *database*, sangat direkomendasikan untuk menambahkan setidaknya *field* berikut pada `prisma/schema.prisma` di tahap Implementasi nanti:

```prisma
// Penambahan Biodata
tempatLahir   String?
tanggalLahir  DateTime?
gender        String?    // LAKI_LAKI / PEREMPUAN
nik           String?

// Penambahan Domisili Jalan
alamatLengkap String?
kodePos       String?

// Transisi Relasi Akademik (Opsional, sangat direkomendasikan)
fakultasId    String?
fakultasRef   Fakultas? @relation(fields: [fakultasId], references: [id])
prodiId       String?
prodiRef      Prodi?    @relation(fields: [prodiId], references: [id])
angkatanId    String?
angkatanRef   Angkatan? @relation(fields: [angkatanId], references: [id])
```

Jika rekomendasi *schema* ini disetujui, perubahan ini akan diterapkan pada *Implementation Plan* sebelum membangun UI Wizard.
