# Backup & Recovery Guide

Dokumen ini menjelaskan strategi pencadangan (backup) dan pemulihan (restore) untuk sistem database PostgreSQL Production.

## Backup Strategy

### Daily Backup
Lakukan pencadangan harian pada jam non-sibuk (misal: 02:00 AM) menggunakan `pg_dump`.

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgres"
DATE=$(date +"%Y%m%d_%H%M%S")
DB_NAME="mydb"
DB_USER="johndoe"

# Dump database dengan format custom
pg_dump -U $DB_USER -d $DB_NAME -F c -f $BACKUP_DIR/db_backup_$DATE.dump
```

### Weekly Backup
Pencadangan mingguan dapat disimpan ke *off-site storage* (misal: S3 atau server terpisah) untuk mencegah kehilangan data jika server utama rusak secara fisik.

## Restore Strategy

Jika terjadi kerusakan data, gunakan `pg_restore` untuk mengembalikan database dari file *dump*.

```bash
# Pastikan tidak ada koneksi yang aktif ke database
pg_restore -U johndoe -d mydb -1 /var/backups/postgres/db_backup_20260702_020000.dump
```
Catatan: Opsi `-1` menjalankan restore dalam satu transaksi, sehingga jika terjadi *error*, seluruh proses dibatalkan (aman).

## Rollback Migration

Jika *deployment* baru menyertakan migrasi Prisma yang merusak data:
1. Pastikan versi aplikasi di-rollback terlebih dahulu (melalui git atau Docker tag lama).
2. Jika migrasi tidak destruktif, aplikasikan data *restore* di atas.
3. Untuk memaksa Prisma kembali sinkron:
   ```bash
   npx prisma migrate resolve --rolled-back <migration_name>
   ```

## Disaster Recovery Verification Checklist

1. [ ] Matikan *traffic* masuk ke aplikasi (bisa via Nginx maintenance mode).
2. [ ] Lakukan *Restore* database dari *backup* terbaru.
3. [ ] Verifikasi ketersediaan tabel kritis (users, roles, residents).
4. [ ] Lakukan uji login menggunakan akun Admin.
5. [ ] Verifikasi bahwa Audit Logs terakhir sebelum *crash* ada.
6. [ ] Jika sukses, buka kembali *traffic* Nginx.
