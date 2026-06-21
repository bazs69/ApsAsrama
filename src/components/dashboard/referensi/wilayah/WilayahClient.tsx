"use client"

import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, Save, X, UploadCloud, Globe, Map, Navigation, Flag, Home } from "lucide-react"
import toast from "react-hot-toast"
import { 
  createCountry, updateCountry, deleteCountry,
  createProvince, updateProvince, deleteProvince,
  createRegency, updateRegency, deleteRegency,
  createDistrict, updateDistrict, deleteDistrict,
  createVillage, updateVillage, deleteVillage
} from "@/app/actions/wilayah"
import ImportWilayahModal from "./ImportWilayahModal"

interface DropdownItem {
  id: string;
  code: string;
  name: string;
}

interface Dropdowns {
  countries: DropdownItem[];
  provinces: DropdownItem[];
  regencies: DropdownItem[];
  districts: DropdownItem[];
}

interface Metrics {
  country: number;
  province: number;
  regency: number;
  district: number;
  village: number;
}

interface WilayahData {
  id: string;
  code: string;
  name: string;
  countryId?: string;
  provinceId?: string;
  regencyId?: string;
  districtId?: string;
  country?: { name: string };
  province?: { name: string };
  regency?: { name: string };
  district?: { name: string };
}

interface WilayahClientProps {
  activeTab: string;
  search: string;
  page: number;
  parentId: string;
  data: WilayahData[];
  total: number;
  totalPages: number;
  permissions: string[];
  dropdowns: Dropdowns;
  metrics: Metrics;
}

export default function WilayahClient({
  activeTab, search, page, parentId, data, total, totalPages, permissions, dropdowns, metrics
}: WilayahClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const hasPerm = (action: string) => permissions.includes(action.toLowerCase())
  const canCreate = hasPerm("wilayah.create")
  const canUpdate = hasPerm("wilayah.update")
  const canDelete = hasPerm("wilayah.delete")

  const [searchInput, setSearchInput] = useState(search)
  const [isImportOpen, setIsImportOpen] = useState(false)

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams()
    params.set("tab", value)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchInput) params.set("search", searchInput)
    else params.delete("search")
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleParentFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    if (val) params.set("parentId", val)
    else params.delete("parentId")
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", newPage.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  // --- Modal States ---
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit">("create")
  
  // Form States
  const [formId, setFormId] = useState("")
  const [formCode, setFormCode] = useState("")
  const [formName, setFormName] = useState("")
  const [formParentId, setFormParentId] = useState("")

  const openCreateModal = () => {
    setModalMode("create")
    setFormId("")
    setFormCode("")
    setFormName("")
    setFormParentId(parentId || "")
    setIsModalOpen(true)
  }

  const openEditModal = (item: WilayahData) => {
    setModalMode("edit")
    setFormId(item.id)
    setFormCode(item.code)
    setFormName(item.name)
    if (activeTab === "provinsi") setFormParentId(item.countryId || "")
    else if (activeTab === "kabupaten") setFormParentId(item.provinceId || "")
    else if (activeTab === "kecamatan") setFormParentId(item.regencyId || "")
    else if (activeTab === "desa") setFormParentId(item.districtId || "")
    else setFormParentId("")
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (activeTab === "negara") {
        if (modalMode === "create") await createCountry({ code: formCode, name: formName })
        else await updateCountry(formId, { code: formCode, name: formName })
      } else if (activeTab === "provinsi") {
        if (modalMode === "create") await createProvince({ code: formCode, name: formName, countryId: formParentId })
        else await updateProvince(formId, { code: formCode, name: formName, countryId: formParentId })
      } else if (activeTab === "kabupaten") {
        if (modalMode === "create") await createRegency({ code: formCode, name: formName, provinceId: formParentId })
        else await updateRegency(formId, { code: formCode, name: formName, provinceId: formParentId })
      } else if (activeTab === "kecamatan") {
        if (modalMode === "create") await createDistrict({ code: formCode, name: formName, regencyId: formParentId })
        else await updateDistrict(formId, { code: formCode, name: formName, regencyId: formParentId })
      } else if (activeTab === "desa") {
        if (modalMode === "create") await createVillage({ code: formCode, name: formName, districtId: formParentId })
        else await updateVillage(formId, { code: formCode, name: formName, districtId: formParentId })
      }
      
      toast.success("Data berhasil disimpan!")
      setIsModalOpen(false)
    } catch (err) {
      if (err instanceof Error) toast.error(err.message || "Gagal menyimpan data")
      else toast.error("Gagal menyimpan data")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data ini? Semua data di bawahnya akan ikut terhapus.")) return
    try {
      if (activeTab === "negara") await deleteCountry(id)
      else if (activeTab === "provinsi") await deleteProvince(id)
      else if (activeTab === "kabupaten") await deleteRegency(id)
      else if (activeTab === "kecamatan") await deleteDistrict(id)
      else if (activeTab === "desa") await deleteVillage(id)
      toast.success("Data berhasil dihapus!")
    } catch (err) {
      if (err instanceof Error) toast.error(err.message || "Gagal menghapus data")
      else toast.error("Gagal menghapus data")
    }
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard title="Negara" value={metrics.country} icon={Globe} color="blue" />
        <MetricCard title="Provinsi" value={metrics.province} icon={Map} color="indigo" />
        <MetricCard title="Kabupaten" value={metrics.regency} icon={Navigation} color="violet" />
        <MetricCard title="Kecamatan" value={metrics.district} icon={Flag} color="purple" />
        <MetricCard title="Desa/Kel" value={metrics.village} icon={Home} color="fuchsia" />
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">Wilayah Administratif</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Kelola data hierarki wilayah untuk referensi sistem.</p>
          </div>
        </div>
        
        {canCreate && (
          <button 
            onClick={() => setIsImportOpen(true)}
            className="w-full sm:w-auto bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <UploadCloud className="w-4 h-4 text-blue-600" />
            Import XLSX
          </button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          <TabsList className="bg-transparent h-auto p-0 flex space-x-2">
            <TabsTrigger value="negara" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:font-bold transition-all border border-transparent data-[state=active]:border-blue-100">
              Negara
            </TabsTrigger>
            <TabsTrigger value="provinsi" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:font-bold transition-all border border-transparent data-[state=active]:border-blue-100">
              Provinsi
            </TabsTrigger>
            <TabsTrigger value="kabupaten" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:font-bold transition-all border border-transparent data-[state=active]:border-blue-100">
              Kabupaten/Kota
            </TabsTrigger>
            <TabsTrigger value="kecamatan" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:font-bold transition-all border border-transparent data-[state=active]:border-blue-100">
              Kecamatan
            </TabsTrigger>
            <TabsTrigger value="desa" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:font-bold transition-all border border-transparent data-[state=active]:border-blue-100">
              Desa/Kelurahan
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          {/* Action Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row gap-4 justify-between items-center bg-slate-50/50">
            <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Cari nama atau kode wilayah..."
                  className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                />
              </form>
              
              {/* Parent Filter */}
              {activeTab !== "negara" && (
                <select 
                  value={parentId}
                  onChange={handleParentFilterChange}
                  className="w-full sm:w-64 bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                >
                  <option value="">-- Semua Induk Wilayah --</option>
                  {activeTab === "provinsi" && dropdowns.countries.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                  {activeTab === "kabupaten" && dropdowns.provinces.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                  {activeTab === "kecamatan" && dropdowns.regencies.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                  {activeTab === "desa" && dropdowns.districts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              )}
            </div>
            
            {canCreate && (
              <button 
                onClick={openCreateModal}
                className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                Tambah Data
              </button>
            )}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-4 px-6 text-center w-16">No</th>
                  <th className="py-4 px-6">Kode</th>
                  <th className="py-4 px-6">Nama Wilayah</th>
                  {activeTab === "provinsi" && <th className="py-4 px-6">Negara</th>}
                  {activeTab === "kabupaten" && <th className="py-4 px-6">Provinsi</th>}
                  {activeTab === "kecamatan" && <th className="py-4 px-6">Kabupaten/Kota</th>}
                  {activeTab === "desa" && <th className="py-4 px-6">Kecamatan</th>}
                  <th className="py-4 px-6 text-center w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <MapPin className="w-12 h-12 mb-3 text-slate-300" />
                        <p className="font-semibold text-slate-500">Tidak ada data ditemukan</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.map((item, index: number) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 text-center text-slate-500 font-medium">
                        {(page - 1) * 10 + index + 1}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-bold">
                          {item.code}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800">
                        {item.name}
                      </td>
                      
                      {activeTab === "provinsi" && <td className="py-4 px-6 text-slate-600 font-medium">{item.country?.name}</td>}
                      {activeTab === "kabupaten" && <td className="py-4 px-6 text-slate-600 font-medium">{item.province?.name}</td>}
                      {activeTab === "kecamatan" && <td className="py-4 px-6 text-slate-600 font-medium">{item.regency?.name}</td>}
                      {activeTab === "desa" && <td className="py-4 px-6 text-slate-600 font-medium">{item.district?.name}</td>}
                      
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {canUpdate && (
                            <button 
                              onClick={() => openEditModal(item)}
                              className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 0 && (
            <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
              <span className="text-sm font-medium text-slate-500">
                Menampilkan <span className="font-bold text-slate-700">{data.length}</span> dari <span className="font-bold text-slate-700">{total}</span> data
              </span>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="text-sm font-bold text-slate-700 px-4 py-2 bg-white border border-slate-300 rounded-lg shadow-sm">
                  {page} / {totalPages}
                </span>

                <button 
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </Tabs>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-8">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">
                {modalMode === "create" ? "Tambah Data" : "Edit Data"} <span className="capitalize">{activeTab}</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Kode Wilayah</label>
                <input 
                  type="text" 
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                  placeholder="Misal: 35.12.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nama Wilayah</label>
                <input 
                  type="text" 
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Masukkan nama wilayah..."
                  required
                />
              </div>

              {activeTab !== "negara" && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">
                    Induk Wilayah ({
                      activeTab === "provinsi" ? "Negara" : 
                      activeTab === "kabupaten" ? "Provinsi" : 
                      activeTab === "kecamatan" ? "Kabupaten/Kota" : "Kecamatan"
                    })
                  </label>
                  <select 
                    value={formParentId}
                    onChange={(e) => setFormParentId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    required
                  >
                    <option value="">-- Pilih Induk Wilayah --</option>
                    {activeTab === "provinsi" && dropdowns.countries.map((d) => (
                      <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                    ))}
                    {activeTab === "kabupaten" && dropdowns.provinces.map((d) => (
                      <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                    ))}
                    {activeTab === "kecamatan" && dropdowns.regencies.map((d) => (
                      <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                    ))}
                    {activeTab === "desa" && dropdowns.districts.map((d) => (
                      <option key={d.id} value={d.id}>{d.code} - {d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 bg-white rounded-lg font-bold hover:bg-slate-50 transition-colors text-sm"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all shadow-sm shadow-blue-600/20 text-sm flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import */}
      <ImportWilayahModal 
        isOpen={isImportOpen} 
        onClose={() => setIsImportOpen(false)} 
        activeTab={activeTab}
        dropdowns={dropdowns as unknown as Record<string, { id: string; code: string; name: string; }[]>}
      />

    </div>
  )
}

interface MetricCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: "blue" | "indigo" | "violet" | "purple" | "fuchsia";
}

function MetricCard({ title, value, icon: Icon, color }: MetricCardProps) {
  const bgColors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    violet: "bg-violet-50 text-violet-600 border-violet-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    fuchsia: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-100",
  }
  
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${bgColors[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">{title}</p>
        <p className="text-2xl font-black text-slate-800">{value.toLocaleString()}</p>
      </div>
    </div>
  )
}
