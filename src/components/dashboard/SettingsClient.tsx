"use client"

import { useState, useTransition, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { updateProfile } from "@/app/actions/settings"
import Image from "next/image"
import Pagination from "@/components/ui/Pagination"
import TableSkeleton from "@/components/ui/TableSkeleton"
import EmptyState from "@/components/ui/EmptyState"
import { usePagination } from "@/hooks/usePagination"
import { useDebounce } from "@/hooks/useDebounce"
import { useOptimisticList } from "@/hooks/useOptimisticList"
import { useUsersQuery } from "@/hooks/queries/useUsersQuery"
import { useUsersMutations } from "@/hooks/mutations/useUsersMutations"
import { type UserSortField, type SortOrder } from "@/app/actions/settings"
import {
  User, Shield, Plus, X, AlertCircle, Loader2, CheckCircle,
  Eye, EyeOff, Trash2, Edit, Lock, Mail, UserCog, Crown, Users, Camera, Search, RefreshCw
} from "lucide-react"

interface CurrentUser {
  id?: string
  name?: string | null
  email?: string | null
  role?: string
  photo?: string | null
}

interface UserRow {
  id: string
  name: string
  email: string
  role: { id: string, name: string } | null
  createdAt: Date
  photo: string | null
  satkerId: string | null
}

export default function SettingsClient({
  currentUser,
  initialUsers,
  initialPagination,
  satkerList = [],
  availableRoles = [],
}: {
  currentUser: CurrentUser
  initialUsers: UserRow[]
  initialPagination: { 
    totalItems: number; 
    totalPages: number; 
    currentPage: number; 
    pageSize: number; 
    search: string; 
    sort: UserSortField; 
    order: SortOrder 
  }
  satkerList?: { id: string, name: string }[]
  availableRoles?: { id: string, name: string, isSystem?: boolean }[]
}) {
  const [activeTab, setActiveTab] = useState<"profile" | "users">("profile")
  const [isPending, startTransition] = useTransition()

  // Profile state
  const [profileName, setProfileName] = useState(currentUser.name || "")
  const [profilePhoto, setProfilePhoto] = useState(currentUser.photo || "")
  const [photoFile, setPhotoFile] = useState<File | null>(null)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Users Query
  const pathname = usePathname()
  const pagination = usePagination({
    basePath: pathname,
    initialMeta: initialPagination,
  })

  const { data: queryData, isFetching: isFetchingUsers } = useUsersQuery({
    page: pagination.currentPage,
    pageSize: pagination.pageSize,
    search: pagination.search,
    sort: pagination.sort as UserSortField,
    order: pagination.order as SortOrder,
    initialData: { data: initialUsers, metadata: initialPagination },
  })

  const currentUsers = (queryData?.data || []) as UserRow[]
  const { optimisticList: optimisticUsers, addOptimisticAction } = useOptimisticList<UserRow>(currentUsers)
  
  const totalItems = queryData?.metadata?.totalItems ?? initialPagination.totalItems
  const totalPages = queryData?.metadata?.totalPages ?? initialPagination.totalPages

  const { createMutation, updateMutation, deleteMutation } = useUsersMutations()

  // Controlled search input — debounced before writing to URL
  const [searchInput, setSearchInput] = useState(pagination.search)
  const debouncedSearch = useDebounce(searchInput, 400)

  // When debounced value changes, push to URL (which triggers re-fetch)
  const isFirstSearch = useRef(true)
  useEffect(() => {
    if (isFirstSearch.current) {
      isFirstSearch.current = false
      return
    }
    pagination.setSearch(debouncedSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  // Re-fetch users whenever URL page/pageSize/search params change.
  // React Query handles fetching automatically via useUsersQuery above!
  // We just sync search param back to pagination when debounce updates.

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editUserId, setEditUserId] = useState("")
  const [editName, setEditName] = useState("")
  const [editRoleId, setEditRoleId] = useState("")
  const [editSatkerId, setEditSatkerId] = useState("")

  // Create user form state
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPass, setNewPass] = useState("")
  const [newRoleId, setNewRoleId] = useState("")
  const [newSatkerId, setNewSatkerId] = useState("")
  const [newShowPass, setNewShowPass] = useState(false)
  const [userMsg, setUserMsg] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [formError, setFormError] = useState("")

  // --- Profile Handlers ---
  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMsg(null)

    if (newPassword && newPassword !== confirmPassword) {
      setProfileMsg({ type: "error", text: "Password baru dan konfirmasi tidak cocok." })
      return
    }

    // uploading state removed

    startTransition(async () => {
      let uploadedPhotoUrl = profilePhoto;

      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        try {
          const resUpload = await fetch("/api/upload", { method: "POST", body: formData });
          const data = await resUpload.json();
          if (data.success) {
            uploadedPhotoUrl = data.url;
            setProfilePhoto(data.url);
            setPhotoFile(null);
          } else {
             setProfileMsg({ type: "error", text: "Gagal mengunggah foto profil." })
             // uploading state removed
             return;
          }
        } catch {
             setProfileMsg({ type: "error", text: "Gagal mengunggah foto profil." })
             // uploading state removed
             return;
        }
      }

      const res = await updateProfile(currentUser.id!, {
        name: profileName,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
        photo: uploadedPhotoUrl || undefined
      })
      if (res.error) {
        setProfileMsg({ type: "error", text: res.error })
      } else {
        setProfileMsg({ type: "success", text: "Profil berhasil diperbarui!" })
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
      // uploading state removed
    })
  }

  // --- User Management Handlers ---
  const openCreateModal = () => {
    setNewName(""); setNewEmail(""); setNewPass(""); setNewRoleId(""); setNewSatkerId("")
    setFormError(""); setIsCreateOpen(true)
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    if (!newRoleId) { setFormError("Silakan pilih role/hak akses."); return }
    if (newPass.length < 8) { setFormError("Password minimal 8 karakter (termasuk huruf besar, kecil, angka, spesial)."); return }

    const selectedRole = availableRoles.find(r => r.id === newRoleId)
    
    // Optimistically close modal
    setIsCreateOpen(false)

    startTransition(async () => {
      // Optimistic update
      const tempId = `temp-${Date.now()}`
      addOptimisticAction({
        type: "create",
        payload: {
          id: tempId,
          name: newName,
          email: newEmail,
          role: selectedRole || null,
          createdAt: new Date(),
          photo: null,
          satkerId: newSatkerId || null,
        }
      })

      const payload: { name: string; email: string; password: string; roleId: string; satkerId?: string } = { name: newName, email: newEmail, password: newPass, roleId: newRoleId }
      
      if (selectedRole?.name === "KEPALA_SATKER") {
        if (!newSatkerId) {
          setFormError("Satker wajib dipilih untuk role KEPALA_SATKER.")
          setIsCreateOpen(true) // revert
          return
        }
        payload.satkerId = newSatkerId
      }

      const res = await createMutation.mutateAsync(payload)
      if (res.error) {
        setFormError(res.error)
        setIsCreateOpen(true) // revert
      } else {
        setUserMsg({ type: "success", text: `Akun "${newName}" berhasil dibuat.` })
        setTimeout(() => setUserMsg(null), 4000)
      }
    })
  }

  const openEditModal = (u: UserRow) => {
    setEditUserId(u.id); setEditName(u.name); setEditRoleId(u.role?.id || ""); setEditSatkerId((u as { satkerId?: string | null }).satkerId || "")
    setFormError(""); setIsEditOpen(true)
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    if (!editRoleId) { setFormError("Silakan pilih role/hak akses."); return }

    const selectedRole = availableRoles.find(r => r.id === editRoleId)
    setIsEditOpen(false) // Optimistically close modal

    startTransition(async () => {
      const targetUser = currentUsers.find((u: UserRow) => u.id === editUserId)
      if (targetUser) {
        addOptimisticAction({
          type: "update",
          payload: { ...targetUser, name: editName, role: selectedRole || null }
        })
      }

      const payload: { name: string; roleId: string; satkerId?: string | null } = { name: editName, roleId: editRoleId }
      
      if (selectedRole?.name === "KEPALA_SATKER") {
        if (!editSatkerId) {
          setFormError("Satker wajib dipilih untuk role KEPALA_SATKER.")
          setIsEditOpen(true)
          return
        }
        payload.satkerId = editSatkerId
      } else {
        payload.satkerId = null
      }

      const res = await updateMutation.mutateAsync({ id: editUserId, payload })
      if (res.error) {
        setFormError(res.error)
        setIsEditOpen(true) // rollback
      } else {
        setUserMsg({ type: "success", text: "Data pengguna berhasil diperbarui." })
        setTimeout(() => setUserMsg(null), 4000)
      }
    })
  }

  const handleDeleteUser = (id: string, name: string) => {
    if (!confirm(`Hapus akun "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return
    startTransition(async () => {
      // Optimistic delete
      addOptimisticAction({ type: "delete", id })

      const res = await deleteMutation.mutateAsync(id)
      if (res.error) {
        setUserMsg({ type: "error", text: res.error })
      } else {
        setUserMsg({ type: "success", text: `Akun "${name}" berhasil dihapus.` })
      }
      setTimeout(() => setUserMsg(null), 4000)
    })
  }

  const userRoleStr = typeof currentUser.role === 'string' 
    ? currentUser.role 
    : (currentUser.role as unknown as { name?: string })?.name || "UNKNOWN"

  const isAdmin = ["SUPER_ADMIN"].includes(userRoleStr)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Pengaturan</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Kelola profil akun dan pengguna sistem asrama.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1.5">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            activeTab === "profile"
              ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700"
              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
          }`}
        >
          <User className="w-4 h-4" />
          Profil Saya
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "users"
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-700"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            <UserCog className="w-4 h-4" />
            Manajemen Akun
          </button>
        )}
      </div>

      {/* ===================== TAB: PROFIL ===================== */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Avatar Card */}
          <div className="glass rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/20 relative group overflow-hidden">
              {profilePhoto ? (
                <Image src={profilePhoto} alt="Profile" fill unoptimized className="object-cover" />
              ) : (
                <span className="text-4xl font-bold text-white">
                  {profileName?.charAt(0)?.toUpperCase() || "A"}
                </span>
              )}
              <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity" title="Ubah Foto Profil">
                <Camera className="w-8 h-8 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setPhotoFile(e.target.files[0])
                    setProfilePhoto(URL.createObjectURL(e.target.files[0]))
                  }
                }} />
              </label>
            </div>
            <div>
              <p className="font-bold text-zinc-900 dark:text-white text-lg">{profileName || "Pengguna"}</p>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">{currentUser.email}</p>
              <span className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                ["ADMIN", "SUPER_ADMIN"].includes(userRoleStr)
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
              }`}>
                {["ADMIN", "SUPER_ADMIN"].includes(userRoleStr) ? <Crown className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                {userRoleStr}
              </span>
            </div>
          </div>

          {/* Form Card */}
          <div className="md:col-span-2 glass rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white mb-5">Perbarui Profil & Password</h2>

            {profileMsg && (
              <div className={`mb-4 p-3 rounded-xl text-sm flex items-center gap-2 border ${
                profileMsg.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                  : "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400"
              }`}>
                {profileMsg.type === "success" ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Nama Tampilan</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    value={currentUser.email || ""}
                    disabled
                    className="w-full bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-500 dark:text-zinc-500 text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-4">
                <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Ganti Password (Opsional)</p>
                <div className="space-y-3">
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type={showCurrentPw ? "text" : "password"}
                      placeholder="Password lama"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-11 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
                    />
                    <button type="button" onClick={() => setShowCurrentPw(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                      {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type={showNewPw ? "text" : "password"}
                      placeholder="Password baru (min. 6 karakter)"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-11 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
                    />
                    <button type="button" onClick={() => setShowNewPw(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="password"
                      placeholder="Konfirmasi password baru"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl py-3 font-semibold shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Simpan Perubahan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ===================== TAB: MANAJEMEN AKUN ===================== */}
      {activeTab === "users" && isAdmin && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
              <Users className="w-4 h-4" />
              <span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{totalItems}</span> pengguna terdaftar
              </span>
            </div>
            <button
              onClick={openCreateModal}
              className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl py-2.5 px-4 font-semibold shadow-lg shadow-primary-500/20 flex items-center gap-2 text-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Tambah Akun
            </button>
          </div>

          {/* Success/Error toast — semantic token */}
          {userMsg && (
            <div className={`p-3 rounded-xl text-sm flex items-center gap-2 border ${
              userMsg.type === "success"
                ? "bg-success-500/10 border-success-500/20 text-success-700 dark:text-success-400"
                : "bg-danger-500/10 border-danger-500/20 text-danger-700 dark:text-danger-400"
            }`}>
              {userMsg.type === "success" ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              {userMsg.text}
            </div>
          )}

          {/* Search Bar */}
          <div className="relative group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama atau email pengguna..."
              aria-label="Cari pengguna"
              className="w-full bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 transition-all"
            />
            {searchInput && (
              <button
                onClick={() => { setSearchInput(""); pagination.setSearch("") }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                aria-label="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Users Table */}
          <div className="glass rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Pengguna</th>
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Email</th>
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Role</th>
                    <th className="text-left px-5 py-3.5 text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Bergabung</th>
                    <th className="px-5 py-3.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {isFetchingUsers ? (
                    <TableSkeleton rows={5} columns={5} />
                  ) : optimisticUsers.length === 0 ? (
                    <EmptyState
                      isFiltered={!!pagination.search}
                      onClear={() => { setSearchInput(""); pagination.setSearch("") }}
                    />
                  ) : (
                    optimisticUsers.map(u => (
                      <tr key={u.id} className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-all ${u._isOptimistic ? "opacity-60 bg-zinc-50 dark:bg-zinc-900/40" : ""}`}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-white">{u.name?.charAt(0)?.toUpperCase()}</span>
                              </div>
                              {u._isOptimistic && (
                                <div className="absolute -bottom-1 -right-1 bg-white dark:bg-zinc-900 rounded-full p-0.5 shadow-sm">
                                  <RefreshCw className="w-3 h-3 text-primary-500 animate-spin" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-900 dark:text-white">{u.name}</p>
                              {u.id === currentUser.id && (
                                <span className="text-xs text-primary-500 font-medium">(Anda)</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">{u.email}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            ["ADMIN", "SUPER_ADMIN"].includes(u.role?.name || "")
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                          }`}>
                            {["ADMIN", "SUPER_ADMIN"].includes(u.role?.name || "") ? <Crown className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                            {u.role?.name || "Tanpa Role"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-zinc-500 dark:text-zinc-500 text-xs">
                          {new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => openEditModal(u)}
                              disabled={u._isOptimistic}
                              className="p-2 text-zinc-400 hover:text-info-500 hover:bg-info-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Edit"
                              aria-label={`Edit pengguna ${u.name}`}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              disabled={u.id === currentUser.id || u._isOptimistic}
                              className="p-2 text-zinc-400 hover:text-danger-500 hover:bg-danger-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Hapus"
                              aria-label={`Hapus pengguna ${u.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pagination.pageSize}
              entityName="Pengguna"
              onPageChange={pagination.goToPage}
              onPageSizeChange={pagination.changePageSize}
            />
          </div>
        </div>
      )}

      {/* Modal: Buat Akun Baru */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="w-full max-w-md glass rounded-2xl border border-zinc-200 dark:border-zinc-800 relative z-10 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Tambah Akun Baru</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Nama Lengkap</label>
                <input type="text" required value={newName} onChange={e => setNewName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
                  placeholder="Misal: Ahmad Fauzi"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Email</label>
                <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
                  placeholder="email@asrama.id"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Password Awal</label>
                <div className="relative">
                  <input type={newShowPass ? "text" : "password"} required value={newPass} onChange={e => setNewPass(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-4 pr-11 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
                    placeholder="Min. 8 karakter (A-Z, a-z, 0-9, Spesial)"
                  />
                  <button type="button" onClick={() => setNewShowPass(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                    {newShowPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Role / Hak Akses</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableRoles.map(r => (
                    <button key={r.id} type="button" onClick={() => setNewRoleId(r.id)}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${
                        newRoleId === r.id
                          ? r.name === "SUPER_ADMIN"
                            ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400"
                            : "bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400"
                          : "border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-zinc-300"
                      }`}>
                      {r.name === "SUPER_ADMIN" ? <Crown className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {availableRoles.find(r => r.id === newRoleId)?.name === "KEPALA_SATKER" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Satker Yang Dipimpin</label>
                  <select 
                    required 
                    value={newSatkerId} 
                    onChange={e => setNewSatkerId(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
                  >
                    <option value="">-- Pilih Satker --</option>
                    {satkerList.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <button type="submit" disabled={isPending}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white rounded-xl py-3 font-semibold shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Buat Akun
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Akun */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditOpen(false)} />
          <div className="w-full max-w-md glass rounded-2xl border border-zinc-200 dark:border-zinc-800 relative z-10 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Edit Pengguna</h2>
              <button onClick={() => setIsEditOpen(false)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleEditUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Nama Lengkap</label>
                <input type="text" required value={editName} onChange={e => setEditName(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Role / Hak Akses</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableRoles.map(r => (
                    <button key={r.id} type="button" onClick={() => setEditRoleId(r.id)}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition-all flex items-center justify-center gap-2 ${
                        editRoleId === r.id
                          ? r.name === "SUPER_ADMIN"
                            ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400"
                            : "bg-blue-500/10 border-blue-500/40 text-blue-600 dark:text-blue-400"
                          : "border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:border-zinc-300"
                      }`}>
                      {r.name === "SUPER_ADMIN" ? <Crown className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {availableRoles.find(r => r.id === editRoleId)?.name === "KEPALA_SATKER" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Satker Yang Dipimpin</label>
                  <select 
                    required 
                    value={editSatkerId} 
                    onChange={e => setEditSatkerId(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 px-4 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
                  >
                    <option value="">-- Pilih Satker --</option>
                    {satkerList.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <button type="submit" disabled={isPending}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl py-3 font-semibold shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Simpan Perubahan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
