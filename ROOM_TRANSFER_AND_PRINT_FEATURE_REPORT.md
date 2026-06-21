# ROOM_TRANSFER_AND_PRINT_FEATURE_REPORT.md

## Status Implementasi Lama

| Tombol | Status Lama | Keterangan |
|--------|-------------|------------|
| **Cetak** | ❌ Tidak berfungsi | Tombol ada di footer, tapi tidak ada `onClick` handler |
| **Pindah Kamar** | ❌ Placeholder | Handler hanya memanggil `alert("Fitur sedang dalam pengembangan")` |

---

## File yang Diperbaiki / Dibuat

| File | Aksi | Keterangan |
|------|------|------------|
| `prisma/schema.prisma` | ✏️ Diperbarui | Tambah model `ResidentRoomHistory` + relasi ke `Resident` |
| `src/app/actions/roomTransfer.ts` | 🆕 Dibuat | 3 server actions: `transferResidentRoom`, `getResidentRoomHistory`, `getAvailableRooms` |
| `src/components/dashboard/ResidentDetailModal.tsx` | ✏️ Refactor | Implementasi penuh: Pindah Kamar modal + Cetak PDF + Tab Riwayat |

---

## Model Baru: ResidentRoomHistory

```prisma
model ResidentRoomHistory {
  id           String   @id @default(uuid())
  residentId   String
  resident     Resident @relation(fields: [residentId], references: [id], onDelete: Cascade)
  fromRoomId   String?
  fromRoom     String?   // nomor kamar asal (string copy)
  toRoomId     String?
  toRoom       String?   // nomor kamar tujuan (string copy)
  fromWilayah  String?
  fromDaerah   String?
  toWilayah    String?
  toDaerah     String?
  alasan       String?  @db.Text
  transferedBy String?
  createdAt    DateTime @default(now())
}
```

> [!NOTE]
> Model menyimpan salinan string nomor kamar (`fromRoom`, `toRoom`) sehingga riwayat tetap terbaca meskipun kamar dihapus di kemudian hari.

---

## Fitur 1: Pindah Kamar

### Alur

```text
Detail Modal → Klik [Pindah Kamar]
  → Sub-modal RoomTransferModal terbuka
     → Tampilkan: Kamar Saat Ini ──▶ Kamar Tujuan
     → Dropdown semua kamar AVAILABLE
     → Textarea alasan (opsional)
  → Klik [Pindahkan Sekarang]
     → Server Action: transferResidentRoom()
        1. Validasi kapasitas kamar
        2. Update Resident (roomId, wilayah, daerah, asrama)
        3. INSERT ResidentRoomHistory
        4. INSERT AuditLog (action: ROOM_TRANSFER)
        5. Release status kamar lama → AVAILABLE jika kosong
     → Optimistic UI update di modal (tanpa refresh halaman)
     → Toast sukses
```

### RBAC

Tombol hanya tampil jika user memiliki permission `santri.update` atau role `SUPER_ADMIN`.

### Penanganan Error

- Kamar sudah penuh → error toast
- Kamar sama dengan kamar sekarang → error toast
- Kamar tidak ditemukan → error toast

---

## Fitur 2: Cetak PDF

### Implementasi

Menggunakan fungsi `printResidentCard()` yang membuka **popup window** baru dengan HTML yang dioptimalkan untuk dicetak.

### Konten Kartu

| Element | Detail |
|---------|--------|
| **Foto Santri** | Dari URL Cloudinary atau emoji avatar placeholder |
| **Nama Lengkap** | Header utama |
| **NIM** | Header |
| **NIUP** | Header |
| **Status** | Badge berwarna |
| **QR Code** | Dari `api.qrserver.com` dengan data NIUP (atau NIM fallback) |
| **Jenis Kelamin** | Biodata |
| **Tanggal Lahir** | Biodata |
| **Tempat Lahir** | Biodata |
| **Nomor HP** | Biodata |
| **Wilayah / Daerah** | Penempatan |
| **Kamar** | Penempatan |
| **Fakultas** | Akademik |
| **Timestamp cetak** | Footer |

### Cara Pakai

1. Klik tombol **[Cetak]** di footer modal
2. Window baru terbuka dengan preview kartu
3. Klik tombol **🖨️ Cetak** di window popup (atau Ctrl+P)
4. Atau simpan sebagai PDF via dialog cetak browser

---

## Fitur 3: Tab Riwayat (Baru)

Tab baru **Riwayat** ditambahkan di Detail Modal yang menampilkan:

- Timeline perpindahan kamar
- Event "Santri Didaftarkan" (tanggal createdAt)
- Setiap item menampilkan: tanggal, dari/ke kamar, alasan, dan operator yang melakukan transfer

---

## Audit Log

Setiap perpindahan kamar menghasilkan record di tabel `AuditLog`:

```json
{
  "action": "ROOM_TRANSFER",
  "entityType": "RESIDENT",
  "entityId": "resident-id",
  "performedBy": "admin@example.com",
  "oldValue": { "roomId": "old-id", "room": "A01", "wilayah": "Al-Ghazali", "daerah": "Blok A" },
  "newValue": { "roomId": "new-id", "room": "B05", "wilayah": "Al-Farabi", "daerah": "Blok B", "alasan": "Permintaan sendiri" }
}
```

Record ini dapat dilihat di tab **Audit Log** di Detail Modal.

---

## Cara Pengujian

### Pindah Kamar

1. Buka `/dashboard/residents`
2. Klik baris santri → Detail Modal terbuka
3. Klik tombol **[Pindah Kamar]** (warna amber)
4. Sub-modal terbuka — konfirmasi menampilkan kamar saat ini
5. Pilih kamar tujuan dari dropdown (hanya kamar AVAILABLE yang tampil)
6. Isi alasan (opsional)
7. Klik **[Pindahkan Sekarang]**
8. Konfirmasi: toast hijau muncul, data modal langsung diperbarui tanpa refresh
9. Buka tab **Riwayat** → konfirmasi event perpindahan tercatat
10. Buka tab **Audit Log** → konfirmasi record `ROOM_TRANSFER` ada

### Cetak

1. Buka Detail Modal santri mana pun
2. Klik tombol **[Cetak]** (ikon Printer)
3. Window popup terbuka dengan kartu santri
4. Klik tombol **🖨️ Cetak** di popup
5. Konfirmasi: foto, nama, QR code, dan semua data tampil dengan benar

### Validasi Error Pindah Kamar

- Pilih kamar yang sudah penuh → tombol tidak tersedia (di-filter oleh action) atau toast error muncul
- Pilih kamar yang sama → toast error "Santri sudah berada di kamar ini"
