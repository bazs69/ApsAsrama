# Laporan Implementasi: Formulir Santri Multi-Step Wizard

Implementasi Pendaftaran Santri Baru berbasis **Multi-Step Wizard** telah berhasil dilaksanakan tanpa memutus kompatibilitas (*breaking changes*) dengan struktur data lama. Berikut adalah rincian pelaksanaan dari implementasi tersebut:

## 1. Pembaruan Struktur Database (Non-Destructive Migration)
- **Penambahan Atribut Biodata:** 
  - `tempatLahir` (String)
  - `tanggalLahir` (DateTime)
  - `gender` (String, jenis kelamin L/P)
  - `nik` (String, Nomor Induk Kependudukan)
- **Penambahan Atribut Domisili (Pelengkap Wilayah):**
  - `alamatLengkap` (String)
  - `kodePos` (String)
- **Transisi Relasi Akademik:**
  - Ditambahkan relasi *Foreign Key* (FK) opsional: `fakultasId`, `prodiId`, `angkatanId`.
  - Kolom *string* lama (`fakultas`, `prodi`, `angkatan`) tidak dihapus dan terus digunakan secara paralel untuk kompatibilitas ke belakang (*backward compatibility*).

## 2. Refactoring Backend Action & API
- **Sinkronisasi Ganda (Double-Write Strategy):**
  Aksi `createResident` dan `updateResident` pada `src/app/actions/residents.ts` telah diatur untuk menerima parameter *Foreign Key* baru. Saat disimpan ke dalam basis data, *Action* juga akan menyalin *string* referensi ke dalam kolom *legacy* lama secara transparan.

## 3. Pembangunan Multi-Step Wizard
Sebuah antarmuka UX baru, `SantriWizard.tsx`, telah dibangun untuk memandu administrator dalam mendaftarkan santri. Terdiri dari 5 tahap progresif:
1. **Biodata Pribadi:** Input Nama, NIM, NIUP, NIK, Jenis Kelamin, Tempat & Tanggal Lahir, serta fitur *upload* foto santri secara terpusat.
2. **Domisili & Wilayah Asal:** Menyajikan *cascading dropdown* Wilayah Administratif yang sudah terintegrasi sebelumnya (Negara ➔ Provinsi ➔ Kab/Kota ➔ Kecamatan ➔ Desa), ditambah *input* Alamat Lengkap dan Kode Pos.
3. **Pendidikan Akademik:** Menampilkan *cascading dropdown* untuk memilih jenjang pendidikan santri (Fakultas ➔ Program Studi ➔ Angkatan) berdasarkan Master Data, dengan penjelasan visual UI bahwa sistem menyimpan *string* *legacy* di balik layar secara transparan.
4. **Penempatan Asrama:** Menampilkan filter pencarian Kamar Kosong secara berjenjang (Wilayah Pondok ➔ Daerah Pondok ➔ Kamar). Validasi ketersediaan kapasitas kamar juga berjalan secara *real-time*.
5. **Ringkasan:** Menampilkan seluruh rangkuman formulir untuk di-*review* sebelum klik tombol "Simpan Data Santri".

## 4. Keamanan Form (Auto-Save Draft)
Ditambahkan mekanisme perlindungan UX untuk form pendaftaran agar mencegah hilangnya data akibat *reload* tak terduga. *Local Storage Autosave* diterapkan sehingga input pengguna sementara tersimpan di *browser* sampai form final disubmit.

## 5. Integrasi ke Panel Dashboard
Halaman `src/app/dashboard/formulir/page.tsx` telah disesuaikan agar me-*render* `SantriWizard` tanpa lagi bergantung pada komponen `FormulirClient` lama. Seluruh fungsi dan *routing* berhasil dilestarikan.
