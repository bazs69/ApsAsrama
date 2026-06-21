# EDIT_SANTRI_WIZARD_FINAL_REPORT.md

## Ringkasan Implementasi

Refactor Form Edit Santri dari *long-scroll CRUD form* menjadi **Smart Multi-Step Wizard** menggunakan satu komponen `SantriWizard` yang sama dengan Formulir Pendaftaran Santri.

---

## File yang Dimodifikasi

| File | Perubahan |
|------|-----------|
| `src/components/dashboard/santri/wizard/SantriWizard.tsx` | Refactor total — tambah `mode`, `residentId`, `initialData`, `initialStep`, `onCancel` props |
| `src/components/dashboard/ResidentsClient.tsx` | Hapus seluruh old edit form (~300 baris JSX + 130 baris state/handler), gantikan dengan `<SantriWizard>` |
| `src/app/actions/residents.ts` | Tambahkan Audit Log + `changedFields` logic di `updateResident` |

## File yang Dihapus / Dibersihkan

Kode berikut **dihapus** dari `ResidentsClient.tsx`:
- Semua state form lama: `name`, `nim`, `niup`, `angkatan`, `asrama`, `prodi`, `wilayah`, `daerah`, `kotaAsal`, `fakultas`, `phone`, `roomId`, `status`, `photoUrl`, `photoFile`, `selectedWilayahId`, `selectedDaerahId`, `selectedFakultasId`, `selectedProdiId`
- Fungsi `openEditModal()` (~50 baris)
- Fungsi `handleSave()` (~65 baris)
- Computed vars `availableDaerahs`, `allRoomsInDaerah`, `availableRoomsInDaerah`
- Seluruh JSX Form Edit lama (~300 baris)

---

## Komponen yang Direuse

**`SantriWizard`** sekarang menangani **Create** dan **Edit** dalam satu komponen.

```tsx
// CREATE (unchanged usage)
<SantriWizard mode="create" areaHierarchy={...} ... />

// EDIT (new)
<SantriWizard
  mode="edit"
  residentId={editingResident.id}
  initialData={editingResident}
  onCancel={() => setIsModalOpen(false)}
  areaHierarchy={...} ...
/>
```

---

## Perubahan Arsitektur

### Sebelum
```
ResidentsClient
  ├── state: 16 form fields
  ├── openEditModal() — populate all 16 states
  ├── handleSave() — manual updateResident call
  └── JSX: <form> panjang 300 baris
```

### Sesudah
```
ResidentsClient
  ├── state: editingResident (Resident | null), isModalOpen
  └── JSX: <SantriWizard mode="edit" initialData={editingResident} />

SantriWizard (shared component)
  ├── mode: "create" | "edit"
  ├── initialData prefill → populate semua field otomatis
  ├── Smart Navigation (edit mode: klik tab langsung)
  ├── Unsaved Changes Protection
  └── Step 5: Diff View (edit) / Preview (create)
```

---

## Smart Navigation (initialStep + Tab Jump)

Pada mode `edit`, semua tab progress indicator **dapat diklik langsung** tanpa harus mengikuti urutan 1→5. Operator dapat langsung lompat ke Step 4 (Status Asrama) untuk mengubah kamar tanpa melewati step lain.

```tsx
// Buka langsung ke tab Status Asrama:
<SantriWizard mode="edit" residentId={id} initialStep={4} />
```

---

## RBAC Integration

Tombol **Edit Data** di `ResidentDetailModal` hanya tampil jika user memiliki permission `santri.update` atau `SUPER_ADMIN`:

```tsx
{hasUpdateSantri && (
  <button onClick={onEdit}>Edit Data</button>
)}
```

SantriWizard sendiri hanya bisa dibuka melalui alur `Detail Modal → Edit Data → Wizard`, sehingga akses secara implisit dilindungi oleh RBAC yang ada di Modal.

---

## Audit Log Integration

Setiap kali `updateResident()` dipanggil dengan data yang berbeda dari data lama, sistem secara otomatis membuat record `AuditLog`:

```json
{
  "action": "UPDATE_RESIDENT",
  "entityType": "RESIDENT",
  "entityId": "resident-id",
  "performedBy": "admin@example.com",
  "oldValue": "{ \"phone\": \"082132843315\" }",
  "newValue": "{ \"phone\": \"081234567890\", \"changedFields\": [\"phone\"] }"
}
```

`changedFields` di-embed dalam `newValue` agar mudah dibaca di Tab Audit Log.

---

## Unsaved Changes Protection

Ketika operator menutup Wizard (klik Batal atau tombol X) saat ada perubahan belum disimpan, muncul dialog konfirmasi:

```
Perubahan belum disimpan.
Keluar tanpa menyimpan?

[Tetap Keluar]    [Kembali]
```

---

## Step 5 — Diff View (Mode Edit)

Step Ringkasan pada mode `edit` menampilkan perbandingan **nilai lama vs nilai baru** untuk semua field yang berubah:

```
Nomor HP
Lama: 082132843315  →  Baru: 081234567890
```

Jika tidak ada perubahan: pesan "Tidak ada perubahan data" ditampilkan.

---

## Tombol Simpan di Setiap Step

Pada mode `edit`, tombol `[Simpan Perubahan]` muncul di **setiap step** (sticky footer), sehingga operator tidak perlu menuju Step 5 terlebih dahulu.

Tombol otomatis `disabled` jika tidak ada perubahan yang terdeteksi.

---

## Checklist Pengujian

- [ ] Buka Daftar Santri → klik baris → Modal Detail muncul
- [ ] Klik **Edit Data** → Wizard Edit terbuka dengan semua field terisi otomatis
- [ ] Klik tab langsung (e.g., langsung ke "Status Asrama") — konfirmasi langsung bisa melompat
- [ ] Ubah Nomor HP, klik **Simpan Perubahan** dari Step 1
- [ ] Buka tab Audit Log di Detail Modal → konfirmasi record `UPDATE_RESIDENT` terbuat dengan `changedFields`
- [ ] Ubah data, klik **Batal** → dialog "Perubahan belum disimpan" muncul
- [ ] Step 5 Ringkasan menampilkan diff Lama vs Baru dengan highlight kuning
- [ ] User tanpa permission `santri.update` tidak melihat tombol Edit Data
- [ ] Formulir Pendaftaran baru (mode `create`) tetap berjalan normal
