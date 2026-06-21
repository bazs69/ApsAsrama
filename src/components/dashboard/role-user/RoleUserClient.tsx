"use client"

import { useState, useMemo } from "react"
import { Users, Plus, Edit, Trash2, ShieldCheck, ChevronRight, ChevronDown } from "lucide-react"
import { createRole, updateRole, deleteRole } from "@/app/actions/roles"
import toast from "react-hot-toast"

export interface Permission {
  id: string;
  module: string;
  action: string;
}

export interface RolePermission {
  permission: Permission;
}

export interface Role {
  id: string;
  name: string;
  isSystem: boolean;
  permissions: RolePermission[];
  _count?: {
    users: number;
  };
}

export default function RoleUserClient({ initialRoles, allPermissions }: { initialRoles: Role[], allPermissions: Permission[] }) {
  const [roles] = useState<Role[]>(initialRoles)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  
  const [formData, setFormData] = useState({ name: "" })
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set())

  // Group permissions by module
  const permissionTree = useMemo(() => {
    const tree: Record<string, Permission[]> = {}
    allPermissions.forEach(p => {
      const moduleName = p.module || "Lainnya"
      if (!tree[moduleName]) tree[moduleName] = []
      tree[moduleName].push(p)
    })
    return tree
  }, [allPermissions])

  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(Object.keys(permissionTree)))

  const toggleModule = (mod: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(mod)) next.delete(mod)
      else next.add(mod)
      return next
    })
  }

  const handleModuleCheck = (mod: string, checked: boolean) => {
    setSelectedPerms(prev => {
      const next = new Set(prev)
      permissionTree[mod].forEach(p => {
        if (checked) next.add(p.id)
        else next.delete(p.id)
      })
      return next
    })
  }

  const handlePermCheck = (permId: string, checked: boolean) => {
    setSelectedPerms(prev => {
      const next = new Set(prev)
      if (checked) next.add(permId)
      else next.delete(permId)
      return next
    })
  }

  const openAddModal = () => {
    setEditingRole(null)
    setFormData({ name: "" })
    setSelectedPerms(new Set())
    setIsModalOpen(true)
  }

  const openEditModal = (role: Role) => {
    setEditingRole(role)
    setFormData({ name: role.name })
    const perms = new Set(role.permissions.map(rp => rp.permission.id))
    setSelectedPerms(perms as Set<string>)
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingRole) {
        await updateRole(editingRole.id, {
          name: formData.name,
          permissions: Array.from(selectedPerms)
        })
        toast.success("Role berhasil diupdate")
      } else {
        await createRole({
          name: formData.name,
          permissions: Array.from(selectedPerms)
        })
        toast.success("Role berhasil ditambahkan")
      }
      setIsModalOpen(false)
      window.location.reload()
    } catch (err) {
      if (err instanceof Error) toast.error(err.message || "Terjadi kesalahan")
      else toast.error("Terjadi kesalahan")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus role ini?")) return
    try {
      await deleteRole(id)
      toast.success("Role berhasil dihapus")
      window.location.reload()
    } catch (err) {
      if (err instanceof Error) toast.error(err.message || "Gagal menghapus role")
      else toast.error("Gagal menghapus role")
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Manajemen Role & Akses</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Kelola peran pengguna dan hak akses sistem</p>
          </div>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl transition-all font-medium"
        >
          <Plus className="w-5 h-5" />
          <span>Tambah Role</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map(role => (
          <div key={role.id} className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group">
            {role.isSystem && (
              <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                Sistem
              </div>
            )}
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{role.name}</h3>
            <div className="flex items-center space-x-2 text-zinc-500 dark:text-zinc-400 mb-4">
              <Users className="w-4 h-4" />
              <span className="text-sm">{role._count?.users || 0} Pengguna</span>
            </div>
            
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {role.permissions?.length} Hak Akses
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(role)}
                  className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                  title="Edit Role"
                >
                  <Edit className="w-4 h-4" />
                </button>
                {!role.isSystem && (
                  <button
                    onClick={() => handleDelete(role.id)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Hapus Role"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {editingRole ? "Edit Role" : "Tambah Role Baru"}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Nama Role</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ name: e.target.value })}
                  disabled={editingRole?.isSystem}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all disabled:opacity-50"
                  placeholder="Misal: Wali Santri"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">Hak Akses (Permissions)</label>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden max-h-96 overflow-y-auto bg-zinc-50 dark:bg-zinc-900/50">
                  {Object.entries(permissionTree).map(([mod, perms]) => {
                    const isExpanded = expandedModules.has(mod)
                    const allChecked = perms.every(p => selectedPerms.has(p.id))
                    const someChecked = perms.some(p => selectedPerms.has(p.id))
                    
                    return (
                      <div key={mod} className="border-b border-zinc-200 dark:border-zinc-800 last:border-0">
                        <div className="flex items-center p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                          <button
                            type="button"
                            onClick={() => toggleModule(mod)}
                            className="p-1 mr-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          <label className="flex items-center space-x-3 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={allChecked}
                              ref={el => { if (el) el.indeterminate = !allChecked && someChecked }}
                              onChange={(e) => handleModuleCheck(mod, e.target.checked)}
                              className="w-4 h-4 text-primary-600 rounded border-zinc-300 focus:ring-primary-500"
                            />
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{mod}</span>
                          </label>
                        </div>
                        
                        {isExpanded && (
                          <div className="pl-12 pr-4 pb-3 grid grid-cols-2 gap-2 bg-white dark:bg-zinc-900">
                            {perms.map(p => (
                              <label key={p.id} className="flex items-center space-x-3 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg cursor-pointer transition-colors">
                                <input
                                  type="checkbox"
                                  checked={selectedPerms.has(p.id)}
                                  onChange={(e) => handlePermCheck(p.id, e.target.checked)}
                                  className="w-4 h-4 text-primary-600 rounded border-zinc-300 focus:ring-primary-500"
                                />
                                <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                  {p.action === "View" ? "Lihat (View)" :
                                   p.action === "Create" ? "Tambah (Create)" :
                                   p.action === "Update" ? "Ubah (Update)" :
                                   p.action === "Delete" ? "Hapus (Delete)" :
                                   p.action === "Export" ? "Ekspor (Export)" :
                                   p.action}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-all font-medium shadow-sm"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
