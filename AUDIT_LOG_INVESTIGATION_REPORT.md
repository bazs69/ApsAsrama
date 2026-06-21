# AUDIT LOG INVESTIGATION REPORT

## 1. Root Cause: Mengapa Riwayat Tidak Muncul

### Masalah 1 — Permission `audit.view` Tidak Ada di Database

Tab **Audit Log** di `ResidentDetailModal.tsx` hanya muncul jika user memiliki permission `"audit.view"`:

```tsx
const hasAuditView = permissions.includes("audit.view") || permissions.includes("SUPER_ADMIN")
if (hasAuditView) tabs.push("Audit Log")
```

Namun permission `audit.view` **tidak didaftarkan** di `DEFAULT_PERMISSIONS` pada kedua file seed:
- `prisma/seed.ts`
- `src/app/api/seed/route.ts`

Akibatnya, permission tersebut tidak ada di database, tidak bisa di-assign ke role manapun, sehingga tab **Audit Log** tidak pernah muncul untuk user manapun.

> **Tab Riwayat** hanya menampilkan **histori pindah kamar** (`ResidentRoomHistory`), bukan perubahan data field seperti nomor HP.

### Masalah 2 — Format Penyimpanan Audit Log Kurang Informatif

`updateResident()` sebelumnya menyimpan audit log dengan format:
- `oldValue`: string JSON semua field lama
- `newValue`: string JSON semua field baru + `changedFields`

Tapi UI hanya menampilkan kolom `action` dan `performedBy`, **tanpa menampilkan field apa yang berubah dan nilai before/after-nya**.

### Masalah 3 — Tab Riwayat ≠ Tab Audit Log

Ada kerancuan antara dua tab yang berbeda fungsi:
| Tab | Sumber Data | Fungsi |
|-----|-------------|--------|
| **Riwayat** | `ResidentRoomHistory` | Histori perpindahan kamar |
| **Audit Log** | `AuditLog` | Seluruh perubahan data field santri |

User mengira Tab Riwayat = perubahan data, padahal itu hanya histori kamar.

---

## 2. File yang Diperbaiki

| File | Perubahan |
|------|-----------|
| `prisma/seed.ts` | + Menambahkan `{ module: "Audit Log", action: "View", code: "audit.view" }` |
| `src/app/api/seed/route.ts` | + Menambahkan `audit.view` ke `DEFAULT_PERMISSIONS` array |
| `src/app/actions/audit.ts` | ✅ Diperluas dengan `getAuditLogs()` (paginated, filterable) dan `getAuditLogActions()` |
| `src/app/actions/residents.ts` | ✅ `updateResident()` diperbaiki: hanya melacak TRACKED_FIELDS yang bermakna, format simpan lebih bersih sebagai Prisma JSON object (`{ ...oldValues }`, `{ ...newValues, changedFields }`) |
| `src/components/dashboard/ResidentDetailModal.tsx` | ✅ Tab Audit Log diperbarui untuk menampilkan **per-field diff** (nama field, nilai lama dicoret merah, nilai baru hijau) |
| `src/components/dashboard/Sidebar.tsx` | ✅ Menambahkan link **Audit Log** dengan ikon `ShieldCheck`, hanya tampil jika user punya `audit.view` |
| `src/app/dashboard/audit-logs/page.tsx` | 🆕 Halaman baru `/dashboard/audit-logs` |
| `src/components/dashboard/audit-log/AuditLogClient.tsx` | 🆕 Client component dengan tabel, filter tanggal/aksi/user, search, dan pagination |

---

## 3. Fitur Audit Log yang Dicatat Setelah Perbaikan

Setiap kali `updateResident()` dipanggil (misalnya mengubah nomor HP via Edit Santri Wizard), sistem secara otomatis membuat record `AuditLog`:

```json
{
  "action": "UPDATE_RESIDENT",
  "entityType": "RESIDENT",
  "entityId": "<uuid-santri>",
  "performedBy": "operator@asrama.id",
  "oldValue": { "phone": "08123456789" },
  "newValue": {
    "phone": "08234567890",
    "changedFields": ["phone"]
  },
  "createdAt": "2026-06-21T10:51:00.000Z"
}
```

Field yang dilacak (`TRACKED_FIELDS`):
`name`, `nim`, `niup`, `phone`, `angkatan`, `prodi`, `wilayah`, `daerah`, `kotaAsal`, `fakultas`, `status`, `roomId`, `gender`, `nik`, `tempatLahir`, `tanggalLahir`, `alamatLengkap`, `kodePos`, `photo`

---

## 4. Halaman `/dashboard/audit-logs`

Fitur:
- 🔍 **Search** — mencari berdasarkan User, Entity ID, atau isi JSON
- 🎯 **Filter Aksi** — dropdown berisi aksi yang tersedia di DB
- 👤 **Filter User/Email** — pencarian partial text
- 📅 **Filter Tanggal** — dari tanggal / sampai tanggal
- 📄 **Pagination** — 25 entri per halaman
- 🔄 **Tombol Refresh**

---

## 5. Cara Pengujian

### A. Aktifkan permission `audit.view`

1. Buka browser → `http://localhost:3000/api/seed` (atau sudah di-seed otomatis)
2. Masuk ke **Role & Hak Akses** → Edit role SUPER_ADMIN atau role yang digunakan
3. Centang **Audit Log → Lihat (View)**
4. **Logout dan Login kembali** untuk merefresh token session

### B. Test perubahan nomor HP

1. Buka **Data Santri** → klik detail salah satu santri
2. Klik **Edit** → masuk ke SantriWizard mode edit
3. Ubah **Nomor HP** → klik Simpan
4. Buka kembali detail santri → klik tab **Audit Log**
5. Harusnya terlihat entry dengan:
   - Aksi: **Diubah**
   - Field: **No. HP**
   - Nilai Lama: (nomor lama dicoret merah)
   - Nilai Baru: (nomor baru hijau)

### C. Test halaman Audit Log global

1. Klik **Audit Log** di Sidebar
2. Gunakan filter untuk menyaring berdasarkan tanggal / user / aksi
3. Klik expand pada kolom **Perubahan** untuk melihat detail field diff
