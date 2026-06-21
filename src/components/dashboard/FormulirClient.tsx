"use client"

import { useState, useEffect, useTransition } from "react"
import { createResident } from "@/app/actions/residents"
import Image from "next/image"
import { ResidentStatus, RoomStatus } from "@prisma/client"
import { AlertCircle, Loader2, CheckCircle2, User, Hash, ShieldCheck, Phone } from "lucide-react"

interface Room {
  id: string
  number: string
  capacity: number
  status: RoomStatus
  residents: { id: string }[]
}

type DaerahNode = { id: string, name: string, rooms: Room[] }
type WilayahNode = { id: string, name: string, daerahs: DaerahNode[] }

export default function FormulirClient({
  areaHierarchy,
  fakultasOptions,
  prodiOptions,
  angkatanOptions
}: {
  areaHierarchy: WilayahNode[]
  fakultasOptions: {id: string, name: string}[]
  prodiOptions: {id: string, name: string, fakultasId: string}[]
  angkatanOptions: {id: string, name: string, prodiId: string}[]
}) {
  // Form fields
  const [name, setName] = useState("")
  const [nim, setNim] = useState("")
  const [niup, setNiup] = useState("")
  const [angkatan, setAngkatan] = useState("")
  const [prodi, setProdi] = useState("")
  const [wilayah, setWilayah] = useState("")
  const [daerah, setDaerah] = useState("")
  const [kotaAsal, setKotaAsal] = useState("")
  
  // Wilayah Administratif
  const [asalCountryId, setAsalCountryId] = useState("")
  const [asalProvinceId, setAsalProvinceId] = useState("")
  const [asalRegencyId, setAsalRegencyId] = useState("")
  const [asalDistrictId, setAsalDistrictId] = useState("")
  const [asalVillageId, setAsalVillageId] = useState("")

  const [countries, setCountries] = useState<{ id: string, name: string }[]>([])
  const [provinces, setProvinces] = useState<{ id: string, name: string }[]>([])
  const [regencies, setRegencies] = useState<{ id: string, name: string }[]>([])
  const [districts, setDistricts] = useState<{ id: string, name: string }[]>([])
  const [villages, setVillages] = useState<{ id: string, name: string }[]>([])
  const [loadingWilayah, setLoadingWilayah] = useState("")

  useEffect(() => {
    fetch("/api/referensi/countries").then(r => r.json()).then(d => setCountries(d.data || []))
  }, [])

  useEffect(() => {
    if (!asalCountryId) { setTimeout(() => setProvinces([]), 0); return }
    setTimeout(() => setLoadingWilayah("provinsi"), 0)
    fetch(`/api/referensi/provinces?countryId=${asalCountryId}`).then(r => r.json()).then(d => {
      setTimeout(() => {
        setProvinces(d.data || [])
        setLoadingWilayah("")
      }, 0)
    })
  }, [asalCountryId])

  useEffect(() => {
    if (!asalProvinceId) { setTimeout(() => setRegencies([]), 0); return }
    setTimeout(() => setLoadingWilayah("kabupaten"), 0)
    fetch(`/api/referensi/regencies?provinceId=${asalProvinceId}`).then(r => r.json()).then(d => {
      setTimeout(() => {
        setRegencies(d.data || [])
        setLoadingWilayah("")
      }, 0)
    })
  }, [asalProvinceId])

  useEffect(() => {
    if (!asalRegencyId) { setTimeout(() => setDistricts([]), 0); return }
    setTimeout(() => setLoadingWilayah("kecamatan"), 0)
    fetch(`/api/referensi/districts?regencyId=${asalRegencyId}`).then(r => r.json()).then(d => {
      setTimeout(() => {
        setDistricts(d.data || [])
        setLoadingWilayah("")
      }, 0)
    })
  }, [asalRegencyId])

  useEffect(() => {
    if (!asalDistrictId) { setTimeout(() => setVillages([]), 0); return }
    setTimeout(() => setLoadingWilayah("desa"), 0)
    fetch(`/api/referensi/villages?districtId=${asalDistrictId}`).then(r => r.json()).then(d => {
      setTimeout(() => {
        setVillages(d.data || [])
        setLoadingWilayah("")
      }, 0)
    })
  }, [asalDistrictId])

  const [fakultas, setFakultas] = useState("")
  const [phone, setPhone] = useState("")
  const [roomId, setRoomId] = useState("")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const status = ResidentStatus.ACTIVE

  // Form cascading selections
  const [selectedWilayahId, setSelectedWilayahId] = useState("")
  const [selectedDaerahId, setSelectedDaerahId] = useState("")
  const [selectedFakultasId, setSelectedFakultasId] = useState("")
  const [selectedProdiId, setSelectedProdiId] = useState("")

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Cascading options
  const availableDaerahs = areaHierarchy.find(w => w.id === selectedWilayahId)?.daerahs || []
  const allRoomsInDaerah = availableDaerahs.find(d => d.id === selectedDaerahId)?.rooms || []
  const availableRoomsInDaerah = allRoomsInDaerah.filter(room => {
    const hasCapacity = room.residents.length < room.capacity
    const isAvailable = room.status === RoomStatus.AVAILABLE
    return isAvailable && hasCapacity
  })

  const resetForm = () => {
    setName("")
    setNim("")
    setNiup("")
    setAngkatan("")
    setProdi("")
    setWilayah("")
    setDaerah("")
    setKotaAsal("")
    setFakultas("")
    setPhone("")
    setRoomId("")
    setAsalCountryId("")
    setAsalProvinceId("")
    setAsalRegencyId("")
    setAsalDistrictId("")
    setAsalVillageId("")
    setSelectedWilayahId("")
    setSelectedDaerahId("")
    setSelectedFakultasId("")
    setSelectedProdiId("")
    setPhotoFile(null)
    setPhotoUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    startTransition(async () => {
      let finalPhotoUrl = ""
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        try {
          const resUpload = await fetch("/api/upload", { method: "POST", body: formData });
          const data = await resUpload.json();
          if (data.success) {
            finalPhotoUrl = data.url;
          } else {
             setError("Gagal mengunggah foto santri.")
             return;
          }
        } catch {
             setError("Gagal mengunggah foto santri.")
             return;
        }
      }

      const res = await createResident({ 
        name, nim, niup, angkatan, prodi, wilayah, daerah, kotaAsal, fakultas, phone, roomId, status, photo: finalPhotoUrl || null,
        asalCountryId, asalProvinceId, asalRegencyId, asalDistrictId, asalVillageId
      })

      if (res.error) {
        if (res.error.includes("already registered")) {
          setError("Santri dengan NIM atau NIUP ini sudah terdaftar di sistem.")
        } else if (res.error.includes("full capacity")) {
          setError("Kamar yang dipilih sudah penuh.")
        } else if (res.error.includes("maintenance")) {
          setError("Kamar yang dipilih sedang dalam perbaikan.")
        } else {
          setError(res.error)
        }
      } else if (res.success) {
        setSuccess(true)
        resetForm()
        setTimeout(() => setSuccess(false), 5000)
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Formulir Pendaftaran Santri</h1>
        <p className="text-zinc-550 dark:text-zinc-400 text-sm">Daftarkan santri baru ke dalam sistem asrama.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center space-x-3 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center space-x-3 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p>Santri berhasil didaftarkan ke sistem.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              
              {/* Kategori 1: Data Diri */}
              <div className="md:col-span-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 border-b border-zinc-100 dark:border-zinc-850 pb-1 flex items-center">
                👤 Data Diri Santri
              </div>

              <div className="md:col-span-2">
                 <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider block mb-1.5">Foto Santri</label>
                 <div className="flex items-center gap-4">
                   <div className="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-zinc-700">
                     {photoUrl ? (
                        <Image src={photoUrl} alt="Foto" width={64} height={64} unoptimized className="w-full h-full object-cover" />
                     ) : (
                        <User className="w-8 h-8 text-zinc-400" />
                     )}
                   </div>
                   <input type="file" accept="image/*" onChange={(e) => {
                     if (e.target.files?.[0]) {
                       setPhotoFile(e.target.files[0])
                       setPhotoUrl(URL.createObjectURL(e.target.files[0]))
                     }
                   }} className="text-sm text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/20 dark:file:text-primary-400" />
                 </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider block mb-1.5">Nama Lengkap</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-zinc-800 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-transparent transition-all text-sm"
                    placeholder="Contoh: Ahmad Abdullah"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider block mb-1.5">Nomor Telepon</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-zinc-800 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-transparent transition-all text-sm"
                    placeholder="Contoh: 08123456789"
                  />
                </div>
              </div>

              {/* Kategori 2: Data Akademik */}
              <div className="md:col-span-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mt-3 border-b border-zinc-100 dark:border-zinc-850 pb-1 flex items-center">
                🎓 Data Akademik & Pesantren
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider block mb-1.5">NIM (Nomor Induk Mahasiswa)</label>
                <div className="relative">
                  <Hash className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-zinc-800 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-transparent transition-all text-sm"
                    placeholder="Masukkan NIM..."
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider block mb-1.5">NIUP (Nomor Induk Pesantren - Opsional)</label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
                  <input
                    type="text"
                    value={niup}
                    onChange={(e) => setNiup(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-zinc-800 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-transparent transition-all text-sm"
                    placeholder="Masukkan NIUP..."
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider block mb-1.5">Wilayah Asrama</label>
                <div className="relative">
                  <select
                    value={selectedWilayahId}
                    onChange={(e) => {
                      const wId = e.target.value;
                      setSelectedWilayahId(wId);
                      setSelectedDaerahId("");
                      setRoomId("");
                      const w = areaHierarchy.find(x => x.id === wId);
                      setWilayah(w ? w.name : "");
                      setDaerah("");
                    }}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-4 text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Pilih Wilayah...</option>
                    {areaHierarchy.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">▼</div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider block mb-1.5">Daerah Asrama</label>
                <div className="relative">
                  <select
                    value={selectedDaerahId}
                    onChange={(e) => {
                      const dId = e.target.value;
                      setSelectedDaerahId(dId);
                      setRoomId("");
                      const d = availableDaerahs.find(x => x.id === dId);
                      setDaerah(d ? d.name : "");
                    }}
                    disabled={!selectedWilayahId}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-4 text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all text-sm appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="">Pilih Daerah...</option>
                    {availableDaerahs.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">▼</div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider block mb-1.5">Kota Asal (Legacy)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={kotaAsal}
                    onChange={(e) => setKotaAsal(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-4 text-zinc-800 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all text-sm"
                    placeholder="Contoh: Surabaya"
                  />
                </div>
              </div>

              {/* Cascading Wilayah Asal Administratif */}
              <div className="md:col-span-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 border-b border-zinc-100 dark:border-zinc-850 pb-1 flex items-center mt-4">
                🌍 Wilayah Asal Santri
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider block mb-1.5 flex justify-between">
                  Negara Asal {loadingWilayah === "negara" && <Loader2 className="w-3 h-3 animate-spin inline-block ml-1" />}
                </label>
                <select 
                  value={asalCountryId} 
                  onChange={e => {
                    setAsalCountryId(e.target.value);
                    setAsalProvinceId(""); setAsalRegencyId(""); setAsalDistrictId(""); setAsalVillageId("");
                  }} 
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary-500/40"
                >
                  <option value="">Pilih Negara...</option>
                  {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider block mb-1.5 flex justify-between">
                  Provinsi {loadingWilayah === "provinsi" && <Loader2 className="w-3 h-3 animate-spin inline-block ml-1" />}
                </label>
                <select 
                  value={asalProvinceId} 
                  disabled={!asalCountryId}
                  onChange={e => {
                    setAsalProvinceId(e.target.value);
                    setAsalRegencyId(""); setAsalDistrictId(""); setAsalVillageId("");
                  }} 
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary-500/40 disabled:opacity-50"
                >
                  <option value="">Pilih Provinsi...</option>
                  {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider block mb-1.5 flex justify-between">
                  Kabupaten/Kota {loadingWilayah === "kabupaten" && <Loader2 className="w-3 h-3 animate-spin inline-block ml-1" />}
                </label>
                <select 
                  value={asalRegencyId} 
                  disabled={!asalProvinceId}
                  onChange={e => {
                    setAsalRegencyId(e.target.value);
                    setAsalDistrictId(""); setAsalVillageId("");
                  }} 
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary-500/40 disabled:opacity-50"
                >
                  <option value="">Pilih Kabupaten/Kota...</option>
                  {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider block mb-1.5 flex justify-between">
                  Kecamatan {loadingWilayah === "kecamatan" && <Loader2 className="w-3 h-3 animate-spin inline-block ml-1" />}
                </label>
                <select 
                  value={asalDistrictId} 
                  disabled={!asalRegencyId}
                  onChange={e => {
                    setAsalDistrictId(e.target.value);
                    setAsalVillageId("");
                  }} 
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary-500/40 disabled:opacity-50"
                >
                  <option value="">Pilih Kecamatan...</option>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider block mb-1.5 flex justify-between">
                  Desa/Kelurahan {loadingWilayah === "desa" && <Loader2 className="w-3 h-3 animate-spin inline-block ml-1" />}
                </label>
                <select 
                  value={asalVillageId} 
                  disabled={!asalDistrictId}
                  onChange={e => setAsalVillageId(e.target.value)} 
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-4 text-sm focus:ring-2 focus:ring-primary-500/40 disabled:opacity-50"
                >
                  <option value="">Pilih Desa/Kelurahan...</option>
                  {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider block mb-1.5">Fakultas</label>
                <div className="relative">
                  <select
                    value={selectedFakultasId}
                    onChange={(e) => {
                      const fId = e.target.value
                      setSelectedFakultasId(fId)
                      setSelectedProdiId("")
                      
                      const fOpt = fakultasOptions.find(x => x.id === fId)
                      setFakultas(fOpt ? fOpt.name : "")
                      setProdi("")
                      setAngkatan("")
                    }}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-4 text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Pilih Fakultas...</option>
                    {fakultasOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">▼</div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider block mb-1.5">Program Studi</label>
                <div className="relative">
                  <select
                    value={selectedProdiId}
                    onChange={(e) => {
                      const pId = e.target.value
                      setSelectedProdiId(pId)
                      
                      const pOpt = prodiOptions.find(x => x.id === pId)
                      setProdi(pOpt ? pOpt.name : "")
                      setAngkatan("")
                    }}
                    disabled={!selectedFakultasId}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-4 text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all text-sm appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="">Pilih Program Studi...</option>
                    {prodiOptions
                      .filter(opt => opt.fakultasId === selectedFakultasId)
                      .map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)
                    }
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">▼</div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider block mb-1.5">Angkatan</label>
                <div className="relative">
                  <select
                    value={angkatan}
                    onChange={(e) => setAngkatan(e.target.value)}
                    disabled={!selectedProdiId}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-4 text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all text-sm appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="">Pilih Angkatan...</option>
                    {angkatanOptions
                      .filter(opt => opt.prodiId === selectedProdiId)
                      .map(opt => <option key={opt.id} value={opt.name}>{opt.name}</option>)
                    }
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">▼</div>
                </div>
              </div>

              {/* Kategori 3: Penempatan Kamar */}
              <div className="md:col-span-2 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mt-3 border-b border-zinc-100 dark:border-zinc-850 pb-1 flex items-center">
                🛏️ Penempatan Kamar
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-450 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                  <span>Pilih Kamar</span>
                  {availableRoomsInDaerah.length > 0 && (
                    <span className="text-emerald-500 lowercase text-[9px] font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                      {availableRoomsInDaerah.length} tersedia
                    </span>
                  )}
                </label>
                <div className="relative">
                  <select
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    disabled={!selectedDaerahId}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 px-4 text-zinc-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all text-sm appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="">{selectedDaerahId ? (availableRoomsInDaerah.length > 0 ? "Pilih Kamar..." : "Kamar Penuh") : "Pilih Daerah Terlebih Dahulu"}</option>
                    {availableRoomsInDaerah.map(room => (
                      <option key={room.id} value={room.id}>
                        Kamar {room.number} (Tersedia: {room.capacity - room.residents.length})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">▼</div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-end">
              <button
                type="submit"
                disabled={isPending}
                className="bg-primary-600 hover:bg-primary-700 dark:bg-primary-600 dark:hover:bg-primary-500 text-white rounded-xl py-2.5 px-6 font-semibold shadow-md shadow-primary-500/20 flex items-center justify-center space-x-2 transition-all text-sm disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>Daftarkan Santri</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
