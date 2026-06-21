# Laporan Implementasi: Enhancement Modal Data Santri

Pembaruan pada **Modal Data Santri (Resident Detail Modal)** telah selesai diimplementasikan tanpa merusak alur kerja aplikasi saat ini. Semua persyaratan *non-breaking* telah dipenuhi.

## 1. Perubahan UI/UX Utama
- **Ukuran Modal Diperbesar**: Mengubah batas maksimal lebar modal menjadi `max-w-6xl` (1200px) dan batas tinggi `max-h-[85vh]` untuk memberikan ruang ekstra. Scrollbar hanya muncul di area konten menggunakan `overflow-y-auto`.
- **Header Profil Santri**: Mengeluarkan elemen foto dan ringkasan biodata utama dari dalam tab dan meletakkannya di header persis di bawah tombol *close*. Header ini mencakup:
  - Foto Santri.
  - Nama Lengkap, NIM, NIUP.
  - Badge Status warna-warni (*Reusable component `StatusBadge`*).
  - Indikator Penempatan (Daerah / Kamar), Angkatan, dan Nomor HP.
- **Dukungan Clipboard**: Menambahkan tombol *Copy* kecil di sebelah NIM dan NIUP, lengkap dengan *toast notification* ("NIM berhasil disalin!").

## 2. Penyusunan Konten Tab
- **Tab Biodata**: Diubah dari susunan daftar memanjang vertikal (*vertical list*) menjadi tata letak **Grid 2-Kolom** (*modern look*) yang mengelompokkan Identitas Utama dan Kelahiran.
- **Tab Riwayat (Timeline)**: Menambahkan tab baru yang menampilkan *vertical timeline*. Mengingat tidak adanya *history table* khusus, riwayat awal digenerasikan melalui *field* `createdAt` (Santri Didaftarkan) dan `room` (Penempatan Kamar Saat Ini), disusun agar fleksibel diperluas (*extensible*).
- **Tab Audit Log**: Menambahkan tab baru yang hanya me-render daftar perubahan audit (*action history*) dari database spesifik untuk entitas `RESIDENT` santri tersebut. Menggunakan state internal dan `Skeleton Loading` saat menarik data.

## 3. Integrasi Keamanan (RBAC)
Pengecekan keamanan secara dinamis berjalan di klien (*Client Component*) melalui ekstraksi status sesi (*useSession*):
- **SANTRI_UPDATE**: Tombol di *footer* `[ Edit Data ]` dan `[ Pindah Kamar ]` hanya akan tampil / berfungsi apabila *user* yang aktif memiliki *permission* `santri.update` (atau berstatus `SUPER_ADMIN`).
- **AUDIT_VIEW**: Tab *Audit Log* disembunyikan sepenuhnya dari pandangan operator biasa. Hanya *user* dengan peran `AUDIT_VIEW` atau `SUPER_ADMIN` yang dapat melihat tab ini dan memuat isinya.

## 4. File yang Dimodifikasi & Ditambahkan
1. **`src/components/dashboard/ResidentDetailModal.tsx`**
   - Rombak total struktur JSX sesuai dengan kebutuhan layout 1200px.
   - Pendaftaran komponen `<StatusBadge />` yang responsif.
   - Penambahan `useSession` Next-Auth.
2. **`src/components/dashboard/ResidentsClient.tsx`**
   - Pembaruan antarmuka (interface) `Resident` agar sinkron dengan TypeScript dan prop Modal.
3. **`src/app/actions/audit.ts`**
   - Pembuatan fungsi *Server Action* baru `getEntityAuditLogs(entityType, entityId)` untuk mengkueri tabel *Prisma AuditLog*.

## Checklist Pengujian (Testing Checklist)
Silakan lakukan verifikasi secara mandiri melalui *dashboard*:
- [ ] Buka Daftar Santri, pastikan alur klik (Klik baris → Modal) tetap normal.
- [ ] Verifikasi tampilan *Header Profil*, pastikan *Badge Status* merender warna Hijau untuk `ACTIVE` dan warna terang untuk status lainnya.
- [ ] Klik icon *copy* pada NIM/NIUP dan pastikan *Toast* muncul dan teks tersalin.
- [ ] Cek tab Biodata; pastikan Umur terhitung dengan benar dari tanggal lahir.
- [ ] Periksa tab Audit Log dengan akun Admin; pastikan *loading spinner* sesaat muncul dan data log berhasil tertarik.
- [ ] Login menggunakan akun tanpa *permission* `santri.update`; pastikan tombol *Edit Data* hilang dari Footer.
