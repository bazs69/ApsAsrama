import * as XLSX from "xlsx"
import { importHeaders } from "@/components/dashboard/residents/constants"
import { ResidentStatus } from "@/components/dashboard/residents/types"
import type { Resident } from "@/components/dashboard/residents/types"

export function exportResidentsToCSV(residents: Resident[]) {
  const headers = ["No", "NIM", "NIUP", "Nama Lengkap", "Wilayah", "Kamar", "Prodi", "Angkatan", "Nomor Telepon", "Status"]
  const rows = residents.map((res, idx) => [
    String(idx + 1),
    res.nim || "-",
    res.niup || "-",
    res.name,
    res.wilayah || "-",
    res.room ? `Kamar ${res.room.number}` : "Belum Ada Kamar",
    res.prodi || "-",
    res.angkatan || "-",
    res.phone || "-",
    res.status === ResidentStatus.ACTIVE ? "Aktif" : "Alumni"
  ])

  // Generate CSV content using BOM for proper Excel utf-8 encoding support
  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", `Laporan_Data_Santri_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function downloadResidentImportTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    [...importHeaders],
    ["Ahmad Santoso", "", "NP-2026-0001", "3578000000000001", "LAKI_LAKI", "Surabaya", "2000-01-01", "08123456789", "Ilmu Komputer", "Teknik Informatika", "2021", "Al-Ghazali", "Blok A", "A1", "Jl. Mawar No.1", "Surabaya", "60111"],
    ["Siti Aminah", "", "", "3578000000000002", "PEREMPUAN", "Malang", "2001-02-02", "", "", "Sistem Informasi", "2022", "", "", "", "Jl. Melati No.2", "Malang", "65112"]
  ])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Template Import")
  XLSX.writeFile(wb, "Template_Import_Santri.xlsx")
}

export function printResidentsPDF(residents: Resident[]) {
  const printWindow = window.open("", "_blank")
  if (!printWindow) return

  const htmlContent = `
      <html>
        <head>
          <title>Laporan Daftar Santri - DormiSync</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; padding: 40px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; color: #111827; }
            .header p { margin: 5px 0 0 0; font-size: 14px; color: #6b7280; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e5e7eb; padding: 12px; text-align: left; font-size: 13px; }
            th { background-color: #f9fafb; font-weight: 600; color: #374151; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
            .badge-active { background-color: #d1fae5; color: #065f46; }
            .badge-inactive { background-color: #f3f4f6; color: #374151; }
            .footer { margin-top: 40px; text-align: right; font-size: 11px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>LAPORAN DAFTAR SANTRI ASRAMA</h1>
            <p>Sistem Informasi Manajemen Asrama DormiSync • Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>NIM</th>
                <th>NIUP</th>
                <th>Nama Lengkap</th>
                <th>Wilayah</th>
                <th>Kamar</th>
                <th>Prodi</th>
                <th>Angkatan</th>
                <th>Nomor Telepon</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${residents.map((res, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${res.nim || "-"}</td>
                  <td>${res.niup || "-"}</td>
                  <td style="font-weight: 600;">${res.name}</td>
                  <td>${res.wilayah || "-"}</td>
                  <td>${res.room ? `Kamar ${res.room.number}` : "Belum Ada Kamar"}</td>
                  <td>${res.prodi || "-"}</td>
                  <td>${res.angkatan || "-"}</td>
                  <td>${res.phone || "-"}</td>
                  <td>
                    <span class="badge ${res.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}">
                      ${res.status === 'ACTIVE' ? 'Aktif' : 'Alumni'}
                    </span>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="footer">
            Dicetak secara otomatis melalui Sistem Asrama DormiSync pada ${new Date().toLocaleString('id-ID')}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `
  printWindow.document.write(htmlContent)
  printWindow.document.close()
}
