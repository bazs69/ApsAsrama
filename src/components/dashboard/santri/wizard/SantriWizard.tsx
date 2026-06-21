"use client"

import { useState, useEffect, useTransition } from "react"
import { createResident, updateResident } from "@/app/actions/residents"
import { ResidentStatus, RoomStatus } from "@prisma/client"
import { Loader2, CheckCircle2, User, Save, Check, ChevronRight, ChevronLeft, LogOut, AlertCircle, FileText } from "lucide-react"
import Image from "next/image"
import toast from "react-hot-toast"

interface Room {
  id: string
  number: string
  capacity: number
  status: RoomStatus
  residents: { id: string }[]
}

type DaerahNode = { id: string, name: string, rooms: Room[] }
type WilayahNode = { id: string, name: string, daerahs: DaerahNode[] }

export type WizardFormData = {
  name: string; nim: string; niup: string; phone: string; tempatLahir: string; tanggalLahir: string; gender: string; nik: string; photoUrl: string;
  asalCountryId: string; asalProvinceId: string; asalRegencyId: string; asalDistrictId: string; asalVillageId: string; alamatLengkap: string; kodePos: string; kotaAsal: string;
  fakultasId: string; prodiId: string; angkatanId: string; fakultas: string; prodi: string; angkatan: string;
  wilayahId: string; daerahId: string; wilayah: string; daerah: string; roomNumber: string; roomId: string; status: ResidentStatus;
}

const defaultFormData: WizardFormData = {
  name: "", nim: "", niup: "", phone: "", tempatLahir: "", tanggalLahir: "", gender: "", nik: "", photoUrl: "",
  asalCountryId: "", asalProvinceId: "", asalRegencyId: "", asalDistrictId: "", asalVillageId: "", alamatLengkap: "", kodePos: "", kotaAsal: "",
  fakultasId: "", prodiId: "", angkatanId: "", fakultas: "", prodi: "", angkatan: "",
  wilayahId: "", daerahId: "", wilayah: "", daerah: "", roomNumber: "", roomId: "", status: ResidentStatus.ACTIVE
}

const STEPS = [
  { id: 1, title: "Biodata Pribadi" },
  { id: 2, title: "Domisili" },
  { id: 3, title: "Pendidikan" },
  { id: 4, title: "Status Asrama" },
  { id: 5, title: "Ringkasan" }
]

export type SantriWizardMode = "create" | "edit";

export type SantriInitialData = {
  [K in keyof Omit<WizardFormData, "tanggalLahir" | "status">]?: string | null;
} & {
  photo?: string | null;
  tanggalLahir?: Date | string | null;
  status?: ResidentStatus | null;
};

interface SantriWizardProps {
  mode?: SantriWizardMode;
  residentId?: string;
  initialData?: SantriInitialData;
  initialStep?: number;
  onCancel?: () => void;
  areaHierarchy: WilayahNode[];
  fakultasOptions: {id: string, name: string}[];
  prodiOptions: {id: string, name: string, fakultasId: string}[];
  angkatanOptions: {id: string, name: string, prodiId: string}[];
}

export default function SantriWizard({
  mode = "create",
  residentId,
  initialData,
  initialStep = 1,
  onCancel,
  areaHierarchy,
  fakultasOptions,
  prodiOptions,
  angkatanOptions
}: SantriWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [formData, setFormData] = useState<WizardFormData>(defaultFormData)
  const [originalData, setOriginalData] = useState<WizardFormData | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  // Initialization
  useEffect(() => {
    queueMicrotask(() => {
      if (mode === "edit" && initialData) {
        const parsedData: WizardFormData = {
          name: initialData.name || "",
          nim: initialData.nim || "",
          niup: initialData.niup || "",
          phone: initialData.phone || "",
          tempatLahir: initialData.tempatLahir || "",
          tanggalLahir: initialData.tanggalLahir ? new Date(initialData.tanggalLahir).toISOString().split('T')[0] : "",
          gender: initialData.gender || "",
          nik: initialData.nik || "",
          photoUrl: initialData.photo || "",
          asalCountryId: initialData.asalCountryId || "",
          asalProvinceId: initialData.asalProvinceId || "",
          asalRegencyId: initialData.asalRegencyId || "",
          asalDistrictId: initialData.asalDistrictId || "",
          asalVillageId: initialData.asalVillageId || "",
          alamatLengkap: initialData.alamatLengkap || "",
          kodePos: initialData.kodePos || "",
          kotaAsal: initialData.kotaAsal || "",
          fakultasId: initialData.fakultasId || "",
          prodiId: initialData.prodiId || "",
          angkatanId: initialData.angkatanId || "",
          fakultas: initialData.fakultas || "",
          prodi: initialData.prodi || "",
          angkatan: initialData.angkatan || "",
          wilayahId: initialData.wilayahId || "",
          daerahId: initialData.daerahId || "",
          wilayah: initialData.wilayah || "",
          daerah: initialData.daerah || "",
          roomNumber: initialData.roomNumber || "",
          roomId: initialData.roomId || "",
          status: initialData.status || ResidentStatus.ACTIVE
        }
        setFormData(parsedData)
        setOriginalData(parsedData)
      } else if (mode === "create") {
        const draft = localStorage.getItem("santriWizardDraft")
        if (draft) {
          try {
            const parsed = JSON.parse(draft)
            setFormData((prev) => ({ ...prev, ...parsed }))
          } catch {
            // ignore
          }
        }
      }
      setIsLoaded(true)
    })
  }, [mode, initialData])

  // Track Unsaved Changes
  useEffect(() => {
    queueMicrotask(() => {
      if (mode === "edit" && originalData && isLoaded) {
        const isChanged = JSON.stringify(formData) !== JSON.stringify(originalData) || photoFile !== null
        setHasUnsavedChanges(isChanged)
      } else if (mode === "create" && isLoaded) {
        const dataToSave = { ...formData, photoUrl: "" }
        localStorage.setItem("santriWizardDraft", JSON.stringify(dataToSave))
        setHasUnsavedChanges(true)
      }
    })
  }, [formData, isLoaded, originalData, photoFile, mode])

  const nextStep = () => setCurrentStep(p => Math.min(p + 1, STEPS.length))
  const prevStep = () => setCurrentStep(p => Math.max(p - 1, 1))

  const handleStepClick = (stepId: number) => {
    if (mode === "edit") {
      setCurrentStep(stepId)
    }
  }

  const handleValidation = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.nim) {
        toast.error("Nama dan NIM wajib diisi!")
        return false
      }
    }
    return true
  }

  const goNext = () => {
    if (handleValidation()) nextStep()
  }

  const handleCancelClick = () => {
    if (hasUnsavedChanges) {
      setShowExitConfirm(true)
    } else {
      if (onCancel) onCancel()
    }
  }

  const handleSubmit = async () => {
    if (!handleValidation()) return;
    setError("")
    setSuccess(false)

    startTransition(async () => {
      let finalPhotoUrl = formData.photoUrl
      if (photoFile) {
        const fileData = new FormData();
        fileData.append("file", photoFile);
        try {
          const resUpload = await fetch("/api/upload", { method: "POST", body: fileData });
          const d = await resUpload.json();
          if (d.success) finalPhotoUrl = d.url;
          else {
            toast.error("Gagal mengunggah foto.");
            return;
          }
        } catch {
          toast.error("Gagal mengunggah foto.");
          return;
        }
      }

      const payload = {
        ...formData,
        photo: finalPhotoUrl || null
      }

      let res;
      if (mode === "edit" && residentId) {
        res = await updateResident(residentId, payload)
      } else {
        res = await createResident(payload)
      }

      if (res.error) {
        setError(res.error)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        toast.error(res.error)
      } else if (res.success) {
        setSuccess(true)
        if (mode === "create") {
          setFormData(defaultFormData)
          setPhotoFile(null)
          localStorage.removeItem("santriWizardDraft")
          setCurrentStep(1)
        } else {
          setOriginalData(formData)
          setPhotoFile(null)
          setHasUnsavedChanges(false)
        }
        window.scrollTo({ top: 0, behavior: 'smooth' })
        toast.success(mode === "edit" ? "Data santri berhasil diperbarui!" : "Santri berhasil didaftarkan!")
        setTimeout(() => {
          setSuccess(false)
          if (mode === "edit" && onCancel) {
            onCancel() // close modal on success
          }
        }, 2000)
      }
    })
  }

  if (!isLoaded) return <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      
      {/* Exit Confirm Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowExitConfirm(false)} />
          <div className="bg-white rounded-xl shadow-xl border border-zinc-200 w-full max-w-sm relative z-10 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="font-bold text-lg text-zinc-900">Perubahan belum disimpan</h3>
            <p className="text-zinc-500 text-sm">Keluar tanpa menyimpan?</p>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setShowExitConfirm(false)} className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg">Kembali</button>
              <button onClick={() => { setShowExitConfirm(false); if (onCancel) onCancel() }} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg">Tetap Keluar</button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Progress */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {mode === "create" ? "Formulir Pendaftaran Santri" : "Edit Data Santri"}
        </h1>
        <p className="text-slate-500 text-sm mb-6">
          {mode === "create" ? "Pendaftaran santri baru terintegrasi wilayah dan akademik." : "Perbarui informasi santri. Klik tab langsung untuk melompat."}
        </p>
        
        <div className="relative flex justify-between items-center mb-2">
          {STEPS.map((s) => (
            <div 
              key={s.id} 
              className={`flex flex-col items-center relative z-10 w-full ${mode === 'edit' ? 'cursor-pointer hover:opacity-80' : ''}`}
              onClick={() => handleStepClick(s.id)}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all
                ${currentStep > s.id 
                  ? "bg-emerald-500 text-white" 
                  : currentStep === s.id 
                    ? "bg-blue-600 text-white ring-4 ring-blue-100" 
                    : "bg-slate-100 text-slate-400"}`}
              >
                {currentStep > s.id ? <Check className="w-4 h-4" /> : s.id}
              </div>
              <span className={`text-xs mt-2 font-semibold absolute top-10 text-center w-24 ${currentStep >= s.id || mode === 'edit' ? "text-slate-700" : "text-slate-400"}`}>{s.title}</span>
            </div>
          ))}
          <div className="absolute top-4 left-0 w-full h-1 bg-slate-100 -z-0">
            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}></div>
          </div>
        </div>
        <div className="h-8"></div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 p-4 rounded-xl flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p>{mode === "create" ? "Santri berhasil didaftarkan ke sistem." : "Perubahan berhasil disimpan."}</p>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 min-h-[400px]">
        {currentStep === 1 && <Step1Biodata formData={formData} setFormData={setFormData} photoFile={photoFile} setPhotoFile={setPhotoFile} />}
        {currentStep === 2 && <Step2Domisili formData={formData} setFormData={setFormData} />}
        {currentStep === 3 && <Step3Pendidikan formData={formData} setFormData={setFormData} fakultasOptions={fakultasOptions} prodiOptions={prodiOptions} angkatanOptions={angkatanOptions} />}
        {currentStep === 4 && <Step4Asrama formData={formData} setFormData={setFormData} areaHierarchy={areaHierarchy} />}
        {currentStep === 5 && <Step5Ringkasan formData={formData} photoFile={photoFile} mode={mode} originalData={originalData} />}
      </div>

      {/* Navigation Footer */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sticky bottom-4 z-40">
        
        <div className="flex gap-2">
          {mode === "edit" && onCancel && (
            <button onClick={handleCancelClick} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2">
              <LogOut className="w-4 h-4" /> Batal
            </button>
          )}
          <button 
            onClick={prevStep}
            disabled={currentStep === 1 || isPending}
            className="px-5 py-2.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
        </div>
        
        <div className="flex gap-2 ml-auto">
          {currentStep < STEPS.length && (
            <button 
              onClick={goNext}
              className="px-6 py-2.5 rounded-xl font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 shadow-sm transition-all flex items-center gap-2"
            >
              Lanjut <ChevronRight className="w-4 h-4" />
            </button>
          )}
          
          {(currentStep === STEPS.length || mode === "edit") && (
            <button 
              onClick={handleSubmit}
              disabled={isPending || (!hasUnsavedChanges && mode === "edit")}
              className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:bg-slate-400"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {mode === "create" ? "Simpan Santri" : "Simpan Perubahan"}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}

interface Step1Props {
  formData: WizardFormData
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>
  photoFile: File | null
  setPhotoFile: React.Dispatch<React.SetStateAction<File | null>>
}

function Step1Biodata({ formData, setFormData, setPhotoFile }: Step1Props) {
  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setPhotoFile(e.target.files[0])
      setFormData({ ...formData, photoUrl: URL.createObjectURL(e.target.files[0]) })
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Informasi Pribadi</h2>
      
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold text-slate-500 uppercase">Foto Santri</label>
          <div className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center overflow-hidden relative cursor-pointer hover:bg-slate-100 transition-colors">
            {formData.photoUrl ? (
              <Image src={formData.photoUrl} alt="Preview" fill className="object-cover" unoptimized />
            ) : (
              <User className="w-8 h-8 text-slate-400" />
            )}
            <input type="file" accept="image/*" onChange={handlePhoto} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          <p className="text-[10px] text-slate-400 text-center max-w-[8rem]">Klik untuk upload foto</p>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Ahmad Fulan" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">NIM <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.nim} onChange={e => setFormData({...formData, nim: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Nomor Induk Mahasiswa" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">NIUP</label>
            <input type="text" value={formData.niup} onChange={e => setFormData({...formData, niup: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Nomor Induk Pesantren" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">NIK (KTP)</label>
            <input type="text" value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Nomor Induk Kependudukan" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Nomor Telepon</label>
            <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500" placeholder="081234..." />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Jenis Kelamin</label>
            <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500">
              <option value="">Pilih...</option>
              <option value="LAKI_LAKI">Laki-Laki</option>
              <option value="PEREMPUAN">Perempuan</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Tempat Lahir</label>
            <input type="text" value={formData.tempatLahir} onChange={e => setFormData({...formData, tempatLahir: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Kota Kelahiran" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Tanggal Lahir</label>
            <input type="date" value={formData.tanggalLahir} onChange={e => setFormData({...formData, tanggalLahir: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>
    </div>
  )
}

interface Step2Props {
  formData: WizardFormData
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>
}

interface RegionNode {
  id: string
  name: string
}

function Step2Domisili({ formData, setFormData }: Step2Props) {
  const [countries, setCountries] = useState<RegionNode[]>([])
  const [provinces, setProvinces] = useState<RegionNode[]>([])
  const [regencies, setRegencies] = useState<RegionNode[]>([])
  const [districts, setDistricts] = useState<RegionNode[]>([])
  const [villages, setVillages] = useState<RegionNode[]>([])
  const [loading, setLoading] = useState("")

  useEffect(() => {
    fetch("/api/referensi/countries").then(r => r.json()).then(d => setCountries(d.data || []))
  }, [])

  useEffect(() => {
    if (!formData.asalCountryId) { queueMicrotask(() => setProvinces([])); return }
    queueMicrotask(() => setLoading("prov"))
    fetch(`/api/referensi/provinces?countryId=${formData.asalCountryId}`).then(r => r.json()).then(d => { setProvinces(d.data || []); setLoading("") })
  }, [formData.asalCountryId])

  useEffect(() => {
    if (!formData.asalProvinceId) { queueMicrotask(() => setRegencies([])); return }
    queueMicrotask(() => setLoading("kab"))
    fetch(`/api/referensi/regencies?provinceId=${formData.asalProvinceId}`).then(r => r.json()).then(d => { setRegencies(d.data || []); setLoading("") })
  }, [formData.asalProvinceId])

  useEffect(() => {
    if (!formData.asalRegencyId) { queueMicrotask(() => setDistricts([])); return }
    queueMicrotask(() => setLoading("kec"))
    fetch(`/api/referensi/districts?regencyId=${formData.asalRegencyId}`).then(r => r.json()).then(d => { setDistricts(d.data || []); setLoading("") })
  }, [formData.asalRegencyId])

  useEffect(() => {
    if (!formData.asalDistrictId) { queueMicrotask(() => setVillages([])); return }
    queueMicrotask(() => setLoading("desa"))
    fetch(`/api/referensi/villages?districtId=${formData.asalDistrictId}`).then(r => r.json()).then(d => { setVillages(d.data || []); setLoading("") })
  }, [formData.asalDistrictId])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Domisili & Wilayah Asal</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center justify-between mb-1.5">
            Negara Asal {loading === "negara" && <Loader2 className="w-3 h-3 animate-spin" />}
          </label>
          <select value={formData.asalCountryId} onChange={e => setFormData({...formData, asalCountryId: e.target.value, asalProvinceId: "", asalRegencyId: "", asalDistrictId: "", asalVillageId: ""})} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500">
            <option value="">Pilih Negara...</option>
            {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center justify-between mb-1.5">
            Provinsi {loading === "prov" && <Loader2 className="w-3 h-3 animate-spin" />}
          </label>
          <select value={formData.asalProvinceId} disabled={!formData.asalCountryId} onChange={e => setFormData({...formData, asalProvinceId: e.target.value, asalRegencyId: "", asalDistrictId: "", asalVillageId: ""})} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
            <option value="">Pilih Provinsi...</option>
            {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center justify-between mb-1.5">
            Kabupaten/Kota {loading === "kab" && <Loader2 className="w-3 h-3 animate-spin" />}
          </label>
          <select value={formData.asalRegencyId} disabled={!formData.asalProvinceId} onChange={e => setFormData({...formData, asalRegencyId: e.target.value, asalDistrictId: "", asalVillageId: ""})} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
            <option value="">Pilih Kabupaten/Kota...</option>
            {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center justify-between mb-1.5">
            Kecamatan {loading === "kec" && <Loader2 className="w-3 h-3 animate-spin" />}
          </label>
          <select value={formData.asalDistrictId} disabled={!formData.asalRegencyId} onChange={e => setFormData({...formData, asalDistrictId: e.target.value, asalVillageId: ""})} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
            <option value="">Pilih Kecamatan...</option>
            {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase flex items-center justify-between mb-1.5">
            Desa/Kelurahan {loading === "desa" && <Loader2 className="w-3 h-3 animate-spin" />}
          </label>
          <select value={formData.asalVillageId} disabled={!formData.asalDistrictId} onChange={e => setFormData({...formData, asalVillageId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
            <option value="">Pilih Desa/Kelurahan...</option>
            {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Kode Pos</label>
          <input type="text" value={formData.kodePos} onChange={e => setFormData({...formData, kodePos: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500" placeholder="Kode Pos" />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Alamat Lengkap</label>
          <textarea value={formData.alamatLengkap} onChange={e => setFormData({...formData, alamatLengkap: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 min-h-[80px]" placeholder="Nama Jalan, RT/RW, Perumahan..."></textarea>
        </div>
      </div>
    </div>
  )
}

interface Step3Props {
  formData: WizardFormData
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>
  fakultasOptions: {id: string, name: string}[]
  prodiOptions: {id: string, name: string, fakultasId: string}[]
  angkatanOptions: {id: string, name: string, prodiId: string}[]
}

function Step3Pendidikan({ formData, setFormData, fakultasOptions, prodiOptions, angkatanOptions }: Step3Props) {
  const availableProdi = prodiOptions.filter(p => p.fakultasId === formData.fakultasId)
  const availableAngkatan = angkatanOptions.filter(a => a.prodiId === formData.prodiId)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Informasi Pendidikan Akademik</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Fakultas</label>
          <select value={formData.fakultasId} onChange={e => {
            const f = fakultasOptions.find(x => x.id === e.target.value);
            setFormData({...formData, fakultasId: e.target.value, fakultas: f?.name || "", prodiId: "", prodi: "", angkatanId: "", angkatan: ""})
          }} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500">
            <option value="">Pilih Fakultas...</option>
            {fakultasOptions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Program Studi</label>
          <select disabled={!formData.fakultasId} value={formData.prodiId} onChange={e => {
            const p = prodiOptions.find(x => x.id === e.target.value);
            setFormData({...formData, prodiId: e.target.value, prodi: p?.name || "", angkatanId: "", angkatan: ""})
          }} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
            <option value="">Pilih Prodi...</option>
            {availableProdi.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Angkatan</label>
          <select disabled={!formData.prodiId} value={formData.angkatanId} onChange={e => {
            const a = angkatanOptions.find(x => x.id === e.target.value);
            setFormData({...formData, angkatanId: e.target.value, angkatan: a?.name || ""})
          }} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
            <option value="">Pilih Angkatan...</option>
            {availableAngkatan.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>
    </div>
  )
}

interface Step4Props {
  formData: WizardFormData
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>
  areaHierarchy: WilayahNode[]
}

function Step4Asrama({ formData, setFormData, areaHierarchy }: Step4Props) {
  const availableDaerahs = areaHierarchy.find(w => w.id === formData.wilayahId)?.daerahs || []
  const allRooms = availableDaerahs.find(d => d.id === formData.daerahId)?.rooms || []
  const availableRooms = allRooms.filter(room => room.status === RoomStatus.AVAILABLE || room.id === formData.roomId)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2">Status & Penempatan Asrama</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Status Santri</label>
          <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as ResidentStatus})} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 font-bold">
            <option value={ResidentStatus.ACTIVE}>Aktif</option>
            <option value={ResidentStatus.INACTIVE}>Keluar</option>
            <option value="CUTI">Cuti</option>
            <option value="ALUMNI">Alumni</option>
          </select>
        </div>

        <div className="md:col-span-2 mt-4"><h3 className="font-bold text-sm text-slate-600 mb-2">Pilih Penempatan</h3></div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Wilayah Asrama</label>
          <select value={formData.wilayahId} onChange={e => {
            const w = areaHierarchy.find(x => x.id === e.target.value);
            setFormData({...formData, wilayahId: e.target.value, wilayah: w?.name || "", daerahId: "", daerah: "", roomId: "", roomNumber: ""})
          }} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500">
            <option value="">Pilih Wilayah...</option>
            {areaHierarchy.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Daerah Asrama</label>
          <select disabled={!formData.wilayahId} value={formData.daerahId} onChange={e => {
            const d = availableDaerahs.find(x => x.id === e.target.value);
            setFormData({...formData, daerahId: e.target.value, daerah: d?.name || "", roomId: "", roomNumber: ""})
          }} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
            <option value="">Pilih Daerah...</option>
            {availableDaerahs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Kamar (Aktif)</label>
          <select disabled={!formData.daerahId} value={formData.roomId} onChange={e => {
            const r = availableRooms.find(x => x.id === e.target.value);
            setFormData({...formData, roomId: e.target.value, roomNumber: r?.number || ""})
          }} className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
            <option value="">Pilih Kamar...</option>
            {availableRooms.map(r => (
              <option key={r.id} value={r.id}>Kamar {r.number}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

interface Step5Props {
  formData: WizardFormData
  photoFile: File | null
  mode: SantriWizardMode
  originalData: WizardFormData | null
}

function Step5Ringkasan({ formData, photoFile: _photoFile, mode, originalData }: Step5Props) {

  const renderDiff = (label: string, field: keyof WizardFormData) => {
    const oldVal = originalData ? originalData[field] : "";
    const newVal = formData[field];
    if (oldVal === newVal) return null;

    return (
      <div className="mb-3 border-l-2 border-amber-400 pl-3">
        <p className="text-xs font-bold text-slate-500">{label}</p>
        <p className="text-sm"><span className="text-slate-400 line-through mr-2">{oldVal || "-"}</span> <span className="font-bold text-amber-700">{newVal || "-"}</span></p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-600" /> {mode === "edit" ? "Ringkasan Perubahan" : "Ringkasan Pendaftaran"}
      </h2>
      
      {mode === "create" ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Data Santri</h3>
              <div className="space-y-1.5">
                <p className="text-sm"><span className="text-slate-500 w-24 inline-block">Nama:</span> <span className="font-bold text-slate-800">{formData.name || "-"}</span></p>
                <p className="text-sm"><span className="text-slate-500 w-24 inline-block">NIM:</span> <span className="font-bold text-slate-800">{formData.nim || "-"}</span></p>
                <p className="text-sm"><span className="text-slate-500 w-24 inline-block">No. HP:</span> <span className="font-bold text-slate-800">{formData.phone || "-"}</span></p>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Pendidikan</h3>
              <div className="space-y-1.5">
                <p className="text-sm"><span className="text-slate-500 w-24 inline-block">Prodi:</span> <span className="font-bold text-slate-800">{formData.prodi || "-"}</span></p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Penempatan</h3>
              <div className="space-y-1.5">
                <p className="text-sm"><span className="text-slate-500 w-24 inline-block">Kamar:</span> <span className="font-bold text-slate-800">{formData.roomNumber || "-"}</span></p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-5">
          <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-4">Review Perubahan Field</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderDiff("Nama Lengkap", "name")}
            {renderDiff("Nomor HP", "phone")}
            {renderDiff("Status", "status")}
            {renderDiff("Kamar", "roomNumber")}
            {renderDiff("Wilayah", "wilayah")}
            {renderDiff("Fakultas", "fakultas")}
            {renderDiff("Prodi", "prodi")}
            {renderDiff("Alamat", "alamatLengkap")}
          </div>

          {JSON.stringify(formData) === JSON.stringify(originalData) && !_photoFile && (
            <p className="text-sm text-slate-500 italic">Tidak ada perubahan data.</p>
          )}
        </div>
      )}
    </div>
  )
}
