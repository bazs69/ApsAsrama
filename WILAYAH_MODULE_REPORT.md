# Laporan Pengembangan: Modul Wilayah Administratif

Pengembangan Modul Wilayah Administratif (Enhancement) telah selesai dilakukan sesuai dengan arahan dan praktik terbaik, tanpa mengubah data fungsionalitas yang ada. Laporan ini merangkum hal-hal yang telah ditambahkan dan ditingkatkan dalam sistem.

## 1. Perubahan Database (`prisma/schema.prisma`)
- **Tabel `AuditLog` Baru:** Ditambahkan tabel `AuditLog` yang berfungsi untuk menyimpan histori perubahan data di dalam sistem, menggunakan tipe data JSON untuk menyimpan _snapshot_ sebelum dan sesudah perubahan secara terstruktur.
- **Relasi pada Model `Resident`:** Menambahkan lima _foreign keys_ opsional (`asalCountryId`, `asalProvinceId`, `asalRegencyId`, `asalDistrictId`, `asalVillageId`) pada tabel `Resident`. Relasi ini bertumpu pada _master data_ wilayah administratif secara _cascade_.
- **Retro-compatibility:** Isian _string_ lama (`kotaAsal`) tetap dibiarkan eksis di _schema_ untuk menjaga kompatibilitas mundur sehingga sistem lama tidak rusak sebelum _backfill_ selesai dilakukan.

## 2. API Endpoint Baru (Cascading)
Akses API RESTful read-only telah ditambahkan untuk mendukung _fetching_ dinamis komponen UI pihak klien tanpa mengorbankan keamanan:
- `/api/referensi/countries`
- `/api/referensi/provinces` (Mendukung query `?countryId=...`)
- `/api/referensi/regencies` (Mendukung query `?provinceId=...`)
- `/api/referensi/districts` (Mendukung query `?regencyId=...`)
- `/api/referensi/villages` (Mendukung query `?districtId=...`)

Setiap endpoint mendukung fitur _pagination_ (`?page=`) dan _server-side search_ (`?search=`), dengan perlindungan _error handling_ yang konsisten.

## 3. Sistem RBAC & Keamanan
- Penambahan, pengeditan, penghapusan, dan pembacaan Wilayah Administratif sepenuhnya mengikuti RBAC dinamis:
  - `wilayah.view`
  - `wilayah.create`
  - `wilayah.update`
  - `wilayah.delete`
- Setiap tindakan mutasi data API dan Server Action memicu pembuatan catatan di tabel `AuditLog` yang memuat `action`, `entityType`, `entityId`, nilai lama/baru, serta ID akun yang mengeksekusinya.
- Endpoint ini tidak dapat diakses tanpa sesi (_Server Session Validasi_ di tingkat API & NextAuth).

## 4. UI/UX: Dashboard Wilayah & Import Data
- **Dashboard Metrik:** Menyertakan kartu statistik (Total Negara, Provinsi, Kabupaten, Kecamatan, Desa) di *header* halaman `/dashboard/referensi/wilayah`.
- **Cascading Filter:** Navigasi hirarkis. Saat berada di Tab Kecamatan, Anda dapat menyaring data berdasarkan Kabupaten/Kota, yang juga otomatis disaring oleh level provinsi. Hal ini mencegah pengguna disuguhkan jutaan baris data sekaligus.
- **Import Data (XLSX):** Tersedia fitur _Import Excel_ yang dirancang khusus:
  1. *Library* murni `xlsx` membaca data dari klien.
  2. Data ditampung, divalidasi keutuhannya, dan _preview_ disajikan kepada pengguna.
  3. Pemrosesan masuk menggunakan _Prisma Transaction_ agar aman dari parsial *insert* apabila gagal.
  4. Semua keberhasilan *import* akan tercatat di log audit.

## 5. Integrasi Formulir Pendaftaran Santri
- Komponen formulir (`FormulirClient.tsx`) telah di-refaktor: Isian teks bebas untuk **Kota Asal** telah diubah menjadi 5 komponen dropdown berjenjang (Negara ➔ Provinsi ➔ Kabupaten ➔ Kecamatan ➔ Desa).
- Pemuatan data dilakukan menggunakan API yang dirancang untuk merespon dalam hitungan milidetik secara asinkron (*fetch effect*). Saat parent dropdown berubah, semua relasi di bawahnya otomatis dikosongkan dan diambilkan data *child* yang relevan, lengkap dengan *loading states*.
- _Payload_ yang baru mencakup kolom-kolom _foreign keys_ ini saat mengeksekusi aksi penyimpanan data.

## Panduan Impor Data (Tips)
Untuk mengimpor data secara masif, ikuti struktur *header* *file* Excel ini (Bebas kapitalisasi):
- Kolom A: `Code` (contoh: "35.12")
- Kolom B: `Name` (contoh: "Kabupaten Malang")

_Proses impor dibatasi 10,000 baris sekali unggah untuk performa yang wajar pada Prisma Transaction._
