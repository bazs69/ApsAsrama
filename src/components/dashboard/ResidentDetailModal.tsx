"use client"

import { X, Copy, Check, Clock, Edit2, MoveRight, Printer, AlertCircle, Loader2, ArrowRight } from "lucide-react"
import { useState, useEffect, useTransition } from "react"
import Image from "next/image"
import { ResidentStatus } from "@prisma/client"
import toast from "react-hot-toast"
import { getEntityAuditLogs } from "@/app/actions/audit"
import { transferResidentRoom, getResidentRoomHistory, getAvailableRooms } from "@/app/actions/roomTransfer"

interface Resident {
  id: string
  name: string
  nim: string | null
  niup: string | null
  angkatan: string | null
  nik?: string | null
  prodi: string | null
  wilayah: string | null
  daerah: string | null
  kotaAsal: string | null
  fakultas: string | null
  phone: string | null
  roomId: string | null
  status: ResidentStatus
  photo?: string | null
  tempatLahir?: string | null
  tanggalLahir?: string | Date | null
  gender?: string | null
  createdAt?: string | Date | null
  room: { id: string; number: string } | null
  assignments?: { id: string; position: string; satker: { name: string } }[]
}

interface ResidentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  resident: Resident | null
  onEdit?: () => void
  permissions?: string[]
}

export const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; className: string }> = {
    ACTIVE:   { label: "Aktif",   className: "bg-emerald-100 text-emerald-700 border border-emerald-200" },
    INACTIVE: { label: "Keluar",  className: "bg-red-100 text-red-700 border border-red-200" },
    CUTI:     { label: "Cuti",    className: "bg-yellow-100 text-yellow-700 border border-yellow-200" },
    ALUMNI:   { label: "Alumni",  className: "bg-blue-100 text-blue-700 border border-blue-200" },
  }
  const config = map[status] ?? { label: status, className: "bg-zinc-100 text-zinc-700 border border-zinc-200" }
  return (
    <span className={`${config.className} px-2.5 py-0.5 rounded-full text-xs font-bold uppercase`}>
      {config.label}
    </span>
  )
}

// ─── Pindah Kamar Modal ──────────────────────────────────────────────────────
function RoomTransferModal({
  resident,
  onClose,
  onSuccess
}: {
  resident: Resident
  onClose: () => void
  onSuccess: (data: { newRoom: { id: string; number: string }; newWilayah: string | null; newDaerah: string | null }) => void
}) {
  const [rooms, setRooms] = useState<{ id: string; number: string; capacity: number; residents: unknown[]; daerah?: { name: string; wilayah?: { name: string } | null } | null }[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRoomId, setSelectedRoomId] = useState("")
  const [alasan, setAlasan] = useState("")
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getAvailableRooms().then(res => {
      if (res.success && res.rooms) setRooms(res.rooms)
      setLoading(false)
    })
  }, [])

  const handleSubmit = () => {
    if (!selectedRoomId) { toast.error("Pilih kamar tujuan terlebih dahulu."); return }
    startTransition(async () => {
      const res = await transferResidentRoom({
        residentId: resident.id,
        newRoomId: selectedRoomId,
        alasan
      })
      if (res.error) {
        toast.error(res.error)
      } else if (res.success) {
        toast.success("Santri berhasil dipindahkan!")
        onSuccess({ newRoom: res.newRoom!, newWilayah: res.newWilayah!, newDaerah: res.newDaerah! })
      }
    })
  }

  const selectedRoom = rooms.find(r => r.id === selectedRoomId)

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-amber-50 dark:bg-amber-900/10">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <MoveRight className="w-5 h-5 text-amber-600" /> Pindah Kamar
            </h3>
            <p className="text-sm text-zinc-500 mt-0.5">Santri: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{resident.name}</span></p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* From */}
          <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <div className="text-center flex-1">
              <p className="text-xs text-zinc-500 mb-1 font-semibold">Kamar Saat Ini</p>
              <p className="font-bold text-zinc-800 dark:text-zinc-200">{resident.room ? `Kamar ${resident.room.number}` : "Belum ditempatkan"}</p>
              <p className="text-xs text-zinc-500">{resident.daerah || "-"} / {resident.wilayah || "-"}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div className="text-center flex-1">
              <p className="text-xs text-zinc-500 mb-1 font-semibold">Kamar Tujuan</p>
              {selectedRoom ? (
                <>
                  <p className="font-bold text-amber-700 dark:text-amber-400">Kamar {selectedRoom.number}</p>
                  <p className="text-xs text-zinc-500">{selectedRoom.daerah?.name || "-"} / {selectedRoom.daerah?.wilayah?.name || "-"}</p>
                </>
              ) : (
                <p className="text-zinc-400 text-sm">Belum dipilih</p>
              )}
            </div>
          </div>

          {/* Room Picker */}
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5">Pilih Kamar Tujuan <span className="text-red-500">*</span></label>
            {loading ? (
              <div className="flex items-center gap-2 text-zinc-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Memuat kamar tersedia...</div>
            ) : (
              <select
                value={selectedRoomId}
                onChange={e => setSelectedRoomId(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
              >
                <option value="">-- Pilih Kamar --</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id} disabled={r.id === resident.roomId}>
                    Kamar {r.number} — {r.daerah?.wilayah?.name} / {r.daerah?.name} (Sisa: {r.capacity - r.residents.length}/{r.capacity})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Alasan */}
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5">Alasan Perpindahan</label>
            <textarea
              value={alasan}
              onChange={e => setAlasan(e.target.value)}
              placeholder="Opsional — misalnya: permintaan sendiri, pengelompokan ulang..."
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-amber-500/40 focus:outline-none min-h-[80px] resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-3 bg-zinc-50 dark:bg-zinc-900/50">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-zinc-600 bg-white border border-zinc-300 rounded-xl hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !selectedRoomId}
            className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoveRight className="w-4 h-4" />}
            Pindahkan Sekarang
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Print / PDF ─────────────────────────────────────────────────────────────
function printResidentCard(resident: Resident) {
  const identityValue = resident.niup || resident.nim || resident.id
  const nimLabel = resident.nim || "-"

  const photoHtml = resident.photo
    ? `<img src="${resident.photo}" alt="Foto" style="width:100px;height:100px;object-fit:cover;border-radius:12px;border:2px solid #e5e7eb;" />`
    : `<div style="width:100px;height:100px;border-radius:12px;border:2px solid #e5e7eb;display:flex;align-items:center;justify-content:center;background:#f3f4f6;font-size:40px;">👤</div>`

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(identityValue)}&color=1e293b`

  const statusLabel = { ACTIVE: "Aktif", INACTIVE: "Keluar", CUTI: "Cuti", ALUMNI: "Alumni" }[resident.status] ?? resident.status

  const birthDate = resident.tanggalLahir
    ? new Date(resident.tanggalLahir).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
    : "-"

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Data Santri — ${resident.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #111827; padding: 24px; }
    .card { max-width: 680px; margin: 0 auto; border: 1.5px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 24px; display: flex; gap: 20px; align-items: center; }
    .header-info { flex: 1; color: white; }
    .header-info h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
    .header-info .meta { font-size: 13px; opacity: 0.85; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 8px; background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3); }
    .body { padding: 20px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }
    .field label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; display: block; margin-bottom: 2px; }
    .field span { font-size: 14px; font-weight: 600; color: #111827; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
    .qr-section { display: flex; justify-content: flex-end; align-items: flex-end; gap: 12px; padding-top: 8px; }
    .qr-label { font-size: 10px; color: #9ca3af; text-align: center; margin-top: 4px; }
    .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 12px 20px; font-size: 11px; color: #9ca3af; display: flex; justify-content: space-between; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      ${photoHtml}
      <div class="header-info">
        <h1>${resident.name}</h1>
        <div class="meta">NIM: ${nimLabel} &nbsp;|&nbsp; NIUP: ${resident.niup || "-"}</div>
        <div class="meta">Angkatan ${resident.angkatan || "-"} &nbsp;•&nbsp; ${resident.prodi || "-"}</div>
        <div class="status-badge">${statusLabel}</div>
      </div>
      <img src="${qrSrc}" alt="QR" style="width:80px;height:80px;border-radius:8px;background:white;padding:4px;" />
    </div>

    <div class="body">
      <div class="grid">
        <div class="field"><label>Jenis Kelamin</label><span>${resident.gender === "LAKI_LAKI" ? "Laki-Laki" : resident.gender === "PEREMPUAN" ? "Perempuan" : "-"}</span></div>
        <div class="field"><label>Tanggal Lahir</label><span>${birthDate}</span></div>
        <div class="field"><label>Tempat Lahir</label><span>${resident.tempatLahir || resident.kotaAsal || "-"}</span></div>
        <div class="field"><label>Nomor HP</label><span>${resident.phone || "-"}</span></div>
      </div>
      <hr class="divider" />
      <div class="grid">
        <div class="field"><label>Wilayah</label><span>${resident.wilayah || "-"}</span></div>
        <div class="field"><label>Daerah</label><span>${resident.daerah || "-"}</span></div>
        <div class="field"><label>Kamar</label><span>${resident.room ? "Kamar " + resident.room.number : "-"}</span></div>
        <div class="field"><label>Fakultas</label><span>${resident.fakultas || "-"}</span></div>
      </div>
    </div>

    <div class="footer">
      <span>Dicetak pada: ${new Date().toLocaleString("id-ID")}</span>
      <span>Sistem Informasi Asrama</span>
    </div>
  </div>

  <div class="no-print" style="margin-top:16px;text-align:center;">
    <button onclick="window.print()" style="padding:10px 24px;background:#2563eb;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;margin-right:8px;">
      🖨️ Cetak
    </button>
    <button onclick="downloadPDF()" style="padding:10px 24px;background:#10b981;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;margin-right:8px;">
      ⬇️ Download PDF
    </button>
    <button onclick="window.close()" style="padding:10px 24px;background:#f3f4f6;color:#374151;border:1px solid #d1d5db;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
      Tutup
    </button>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <script>
    function downloadPDF() {
      const element = document.querySelector('.card');
      const opt = {
        margin:       10,
        filename:     'Data_Santri_${identityValue}.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    }
  </script>
</body>
</html>`

  const win = window.open("", "_blank", "width=720,height=700,scrollbars=yes")
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function ResidentDetailModal({
  isOpen, onClose, resident, onEdit, permissions = []
}: ResidentDetailModalProps) {
  const hasAuditView = permissions.includes("audit.view") || permissions.includes("SUPER_ADMIN")
  const hasUpdateSantri = permissions.includes("santri.update") || permissions.includes("SUPER_ADMIN")

  const [activeTab, setActiveTab] = useState("Biodata")
  const [copiedNim, setCopiedNim] = useState(false)
  const [copiedNiup, setCopiedNiup] = useState(false)
  const [auditLogs, setAuditLogs] = useState<{ id: string; action: string; performedBy: string | null; createdAt: Date; newValue: unknown; oldValue: unknown }[]>([])
  const [loadingAudit, setLoadingAudit] = useState(false)
  const [roomHistory, setRoomHistory] = useState<{ id: string; createdAt: Date; fromRoom: string | null; toRoom: string | null; alasan: string | null; transferedBy: string | null }[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [showRoomTransfer, setShowRoomTransfer] = useState(false)
  const [localResident, setLocalResident] = useState<Resident | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setActiveTab("Biodata")
        setAuditLogs([])
        setRoomHistory([])
        setShowRoomTransfer(false)
      }, 0)
    }
    if (isOpen && resident) setTimeout(() => setLocalResident(resident), 0)
  }, [isOpen, resident])

  useEffect(() => {
    if (isOpen && activeTab === "Audit Log" && hasAuditView && (localResident || resident)) {
      const id = (localResident || resident)!.id
      setTimeout(() => setLoadingAudit(true), 0)
      getEntityAuditLogs("RESIDENT", id).then(res => {
        setTimeout(() => {
          if (res.success && res.logs) setAuditLogs(res.logs)
          setLoadingAudit(false)
        }, 0)
      })
    }
  }, [isOpen, activeTab, hasAuditView, localResident, resident])

  useEffect(() => {
    if (isOpen && activeTab === "Riwayat" && (localResident || resident)) {
      const id = (localResident || resident)!.id
      setTimeout(() => setLoadingHistory(true), 0)
      getResidentRoomHistory(id).then(res => {
        setTimeout(() => {
          if (res.success && res.history) setRoomHistory(res.history)
          setLoadingHistory(false)
        }, 0)
      })
    }
  }, [isOpen, activeTab, localResident, resident])

  if (!isOpen || !resident) return null
  const r = localResident || resident
  const identityValue = r.niup || r.nim || r.id

  const tabs = ["Biodata", "Riwayat", "Penugasan", "Domisili", "Pendidikan"]
  if (hasAuditView) tabs.push("Audit Log")

  const handleCopy = (text: string, type: "nim" | "niup") => {
    navigator.clipboard.writeText(text)
    if (type === "nim") { setCopiedNim(true); setTimeout(() => setCopiedNim(false), 2000) }
    else { setCopiedNiup(true); setTimeout(() => setCopiedNiup(false), 2000) }
    toast.success(`${type.toUpperCase()} berhasil disalin!`)
  }

  const birthDateStr = r.tanggalLahir
    ? new Date(r.tanggalLahir).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
    : "-"

  const createdDateStr = r.createdAt
    ? new Date(r.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })
    : "-"

  let age = "-"
  const currentYear = new Date().getFullYear()
  if (r.tanggalLahir && currentYear > 0) {
    const bd = new Date(r.tanggalLahir)
    if (!isNaN(bd.getTime())) {
      const y = currentYear - bd.getFullYear()
      age = `${y} Tahun`
    }
  }

  return (
    <>
      {/* Room Transfer Sub-Modal */}
      {showRoomTransfer && (
        <RoomTransferModal
          resident={r}
          onClose={() => setShowRoomTransfer(false)}
          onSuccess={({ newRoom, newWilayah, newDaerah }) => {
            setLocalResident(prev => prev ? {
              ...prev,
              roomId: newRoom.id,
              room: newRoom,
              wilayah: newWilayah,
              daerah: newDaerah
            } : prev)
            setShowRoomTransfer(false)
          }}
        />
      )}

      {/* Main Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="w-full max-w-6xl bg-white dark:bg-zinc-900 rounded-xl overflow-hidden relative z-10 flex flex-col shadow-2xl max-h-[85vh]">

          {/* Close */}
          <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 p-1.5 rounded-full z-20 transition-colors">
            <X className="w-5 h-5" />
          </button>

          {/* Profile Header */}
          <div className="p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex flex-row gap-4 sm:gap-6 items-center max-h-[140px]">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white dark:bg-zinc-800 rounded-xl overflow-hidden flex items-center justify-center border-4 border-white dark:border-zinc-700 shadow-md flex-shrink-0">
              {r.photo ? (
                <Image src={r.photo} alt={r.name} width={96} height={96} unoptimized className="object-cover w-20 h-20 sm:w-24 sm:h-24" />
              ) : (
                <div className="text-4xl sm:text-5xl">👤</div>
              )}
            </div>
            <div className="flex-1 space-y-2 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 truncate">{r.name}</h2>
                <div className="hidden sm:block"><StatusBadge status={r.status} /></div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-1 sm:gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-sm">
                  <span className="font-semibold text-zinc-500">NIM:</span>
                  <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{r.nim || "-"}</span>
                  {r.nim && (
                    <button onClick={() => handleCopy(r.nim!, "nim")} className="ml-1 text-zinc-400 hover:text-blue-500">
                      {copiedNim ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
                {r.niup && (
                  <div className="flex items-center gap-1 sm:gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg shadow-sm">
                    <span className="font-semibold text-zinc-500">NIUP:</span>
                    <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{r.niup}</span>
                    <button onClick={() => handleCopy(r.niup!, "niup")} className="ml-1 text-zinc-400 hover:text-blue-500">
                      {copiedNiup ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
                <div className="block sm:hidden"><StatusBadge status={r.status} /></div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm pt-0.5">
                <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <span>📍</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-300 truncate max-w-[150px] sm:max-w-none">
                    {r.daerah || r.wilayah || "Asrama"} / {r.room ? `Kamar ${r.room.number}` : "-"}
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <span>🎓</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-300">Angkatan {r.angkatan || "-"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                  <span>📱</span>
                  <span className="font-medium text-zinc-800 dark:text-zinc-300">{r.phone || "-"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-6 border-b border-zinc-200 dark:border-zinc-800 flex overflow-x-auto gap-4 bg-white dark:bg-zinc-900">
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-2 py-4 text-sm font-semibold transition-colors relative whitespace-nowrap ${activeTab === tab ? "text-blue-600 dark:text-blue-400" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-white dark:bg-zinc-900">

            {/* BIODATA */}
            {activeTab === "Biodata" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 animate-in fade-in duration-300">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 border-b pb-2">Identitas Utama</h3>
                    {[["Nama Lengkap", r.name], ["Jenis Kelamin", r.gender === "LAKI_LAKI" ? "Laki-Laki" : r.gender === "PEREMPUAN" ? "Perempuan" : r.gender || "Laki-Laki"], ["NIK (KTP)", r.nik || "-"]].map(([l, v]) => (
                      <div key={l} className="grid grid-cols-3 gap-2 mb-3">
                        <span className="text-sm text-zinc-500">{l}</span>
                        <span className="col-span-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4 border-b pb-2">Kelahiran</h3>
                    {[["Tempat Lahir", r.tempatLahir || r.kotaAsal || "-"], ["Tanggal Lahir", birthDateStr], ["Umur", age]].map(([l, v]) => (
                      <div key={l} className="grid grid-cols-3 gap-2 mb-3">
                        <span className="text-sm text-zinc-500">{l}</span>
                        <span className="col-span-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-center items-center">
                  <div className="w-36 h-36 p-2 bg-white border border-zinc-200 rounded-xl shadow-sm">
                    <Image
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(identityValue)}&color=1e293b`}
                      alt="QR Code" width={160} height={160} unoptimized className="w-full h-full object-contain"
                    />
                    <p className="text-center text-[10px] text-zinc-400 mt-1">QR Identitas</p>
                  </div>
                </div>
              </div>
            )}

            {/* RIWAYAT */}
            {activeTab === "Riwayat" && (
              <div className="animate-in fade-in duration-300">
                {loadingHistory ? (
                  <div className="flex items-center gap-2 text-zinc-400 p-8 justify-center"><Loader2 className="w-5 h-5 animate-spin" /> Memuat riwayat...</div>
                ) : (
                  <div className="relative border-l-2 border-zinc-200 dark:border-zinc-700 ml-4 py-2 space-y-6">
                    {roomHistory.map((h) => (
                      <div key={h.id} className="relative pl-6">
                        <div className="absolute w-4 h-4 rounded-full bg-amber-500 border-4 border-white dark:border-zinc-900 -left-[9px] top-1"></div>
                        <div className="text-sm text-zinc-500 font-medium mb-1">
                          {new Date(h.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
                        </div>
                        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 shadow-sm">
                          <p className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                            Pindah Kamar
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-normal">
                              {h.fromRoom ? `Kamar ${h.fromRoom}` : "—"} → Kamar {h.toRoom}
                            </span>
                          </p>
                          {h.alasan && <p className="text-sm text-zinc-500 mt-1">Alasan: {h.alasan}</p>}
                          <p className="text-xs text-zinc-400 mt-1">Oleh: {h.transferedBy || "Sistem"}</p>
                        </div>
                      </div>
                    ))}

                    {/* Registration event */}
                    <div className="relative pl-6">
                      <div className="absolute w-4 h-4 rounded-full bg-emerald-500 border-4 border-white dark:border-zinc-900 -left-[9px] top-1"></div>
                      <div className="text-sm text-zinc-500 font-medium mb-1">{createdDateStr}</div>
                      <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 shadow-sm">
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200">Santri Didaftarkan</p>
                        <p className="text-sm text-zinc-500 mt-1">Data awal masuk ke dalam sistem.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PENUGASAN */}
            {activeTab === "Penugasan" && (
              <div className="animate-in fade-in duration-300">
                {r.assignments && r.assignments.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {r.assignments.map(a => (
                      <div key={a.id} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-800/30">
                        <div className="font-bold text-zinc-800 dark:text-zinc-200 text-lg mb-1">{a.satker?.name || "-"}</div>
                        <span className="inline-block px-2.5 py-1 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-md">{a.position}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                    <Clock className="w-10 h-10 text-zinc-300 mb-3" />
                    <p className="text-zinc-500 font-medium">Belum ada riwayat penugasan.</p>
                  </div>
                )}
              </div>
            )}

            {/* DOMISILI */}
            {activeTab === "Domisili" && (
              <div className="animate-in fade-in duration-300">
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">Penempatan Asrama</h4>
                  <div className="space-y-2 text-sm">
                    {[["Wilayah", r.wilayah || "-"], ["Daerah", r.daerah || "-"], ["Kamar", r.room ? `Kamar ${r.room.number}` : "-"]].map(([l, v]) => (
                      <div key={l} className="flex justify-between">
                        <span className="text-blue-600/70 dark:text-blue-400/70">{l}:</span>
                        <span className="font-medium text-blue-900 dark:text-blue-200">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* PENDIDIKAN */}
            {activeTab === "Pendidikan" && (
              <div className="animate-in fade-in duration-300">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-xl">
                  <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 mb-3">Status Akademik</h4>
                  <div className="space-y-2 text-sm">
                    {[["Fakultas", r.fakultas || "-"], ["Program Studi", r.prodi || "-"], ["Angkatan", r.angkatan || "-"]].map(([l, v]) => (
                      <div key={l} className="flex justify-between">
                        <span className="text-emerald-600/70 dark:text-emerald-400/70">{l}:</span>
                        <span className="font-medium text-emerald-900 dark:text-emerald-200">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* AUDIT LOG */}
            {activeTab === "Audit Log" && (
              <div className="animate-in fade-in duration-300">
                {loadingAudit ? (
                  <div className="flex flex-col items-center justify-center p-12 space-y-3">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-zinc-500 text-sm">Memuat catatan audit...</p>
                  </div>
                ) : auditLogs.length > 0 ? (
                  <div className="space-y-3">
                    {auditLogs.map(log => {
                      const newVal = typeof log.newValue === "string"
                        ? (() => { try { return JSON.parse(log.newValue) } catch { return null } })()
                        : log.newValue
                      const oldVal = typeof log.oldValue === "string"
                        ? (() => { try { return JSON.parse(log.oldValue) } catch { return null } })()
                        : log.oldValue

                      const changedFields: string[] = newVal?.changedFields || []

                      const FIELD_LABELS: Record<string, string> = {
                        name: "Nama", nim: "NIM", niup: "NIUP", phone: "No. HP",
                        angkatan: "Angkatan", prodi: "Program Studi", wilayah: "Wilayah",
                        daerah: "Daerah", kotaAsal: "Kota Asal", fakultas: "Fakultas",
                        status: "Status", roomId: "Kamar", gender: "Jenis Kelamin",
                        nik: "NIK", tempatLahir: "Tempat Lahir", tanggalLahir: "Tanggal Lahir",
                        alamatLengkap: "Alamat Lengkap", kodePos: "Kode Pos", photo: "Foto"
                      }

                      return (
                        <div key={log.id} className="rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                          {/* Log header */}
                          <div className="flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-700">
                            <div className="flex items-center gap-2.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                {log.action === "UPDATE_RESIDENT" ? "Diubah" :
                                 log.action === "CREATE_RESIDENT" ? "Ditambahkan" :
                                 log.action === "DELETE_RESIDENT" ? "Dihapus" : log.action}
                              </span>
                              <span className="text-xs text-zinc-500">
                                oleh <span className="font-semibold text-zinc-700 dark:text-zinc-300">{log.performedBy || "System"}</span>
                              </span>
                            </div>
                            <span className="text-xs text-zinc-400">
                              {new Date(log.createdAt).toLocaleString("id-ID", {
                                day: "2-digit", month: "short", year: "numeric",
                                hour: "2-digit", minute: "2-digit"
                              })}
                            </span>
                          </div>

                          {/* Changed fields */}
                          {changedFields.length > 0 ? (
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                              {changedFields.map(field => (
                                <div key={field} className="px-4 py-2.5 flex items-start gap-3 text-sm">
                                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 min-w-[110px] pt-0.5">
                                    {FIELD_LABELS[field] || field}
                                  </span>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="line-through text-red-500/80 text-xs bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">
                                      {String(oldVal?.[field] ?? "—")}
                                    </span>
                                    <ArrowRight className="w-3 h-3 text-zinc-400 flex-shrink-0" />
                                    <span className="text-emerald-700 dark:text-emerald-400 text-xs bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded font-medium">
                                      {String(newVal?.[field] ?? "—")}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="px-4 py-3 text-xs text-zinc-400 italic">Data dicatat tanpa perubahan field spesifik.</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                    <AlertCircle className="w-10 h-10 text-zinc-300 mb-3" />
                    <p className="text-zinc-500 font-medium">Belum ada catatan audit untuk santri ini.</p>
                    <p className="text-zinc-400 text-sm mt-1">Setiap perubahan data akan tercatat di sini secara otomatis.</p>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="p-4 px-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-end gap-3 bg-zinc-50 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => printResidentCard(r)}
              className="px-4 py-2.5 text-sm font-semibold text-zinc-700 bg-white border border-zinc-300 rounded-xl hover:bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            {hasUpdateSantri && (
              <button
                type="button"
                onClick={() => setShowRoomTransfer(true)}
                className="px-4 py-2.5 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-900/50 dark:text-amber-400 transition-colors flex items-center gap-2"
              >
                <MoveRight className="w-4 h-4" />
                <span className="hidden sm:inline">Pindah Kamar</span>
              </button>
            )}

            {hasUpdateSantri && (
              <button
                type="button"
                onClick={onEdit}
                className="px-4 py-2.5 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-900/50 dark:text-blue-400 transition-colors flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                <span className="hidden sm:inline">Edit Data</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-zinc-800 rounded-xl hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors ml-auto sm:ml-2"
            >
              Tutup
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
