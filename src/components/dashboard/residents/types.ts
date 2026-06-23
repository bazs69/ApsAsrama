import { ResidentStatus, RoomStatus } from "@prisma/client"

export { ResidentStatus, RoomStatus }

export interface Room {
  id: string
  number: string
  capacity: number
  status: RoomStatus
  residents: { id: string }[]
}

export interface Resident {
  id: string
  name: string
  nim: string | null
  niup: string | null
  angkatan: string | null
  nik?: string | null
  wilayah: string | null
  daerah: string | null
  prodi: string | null
  kotaAsal: string | null
  fakultas: string | null
  phone: string | null
  roomId: string | null
  status: ResidentStatus
  room: {
    id: string
    number: string
  } | null
  photo?: string | null
  tempatLahir?: string | null
  tanggalLahir?: string | Date | null
  gender?: string | null
  createdAt?: string | Date | null
  assignments?: {
    id: string
    position: string
    satker: { name: string }
  }[]
}

export type DaerahNode = { id: string, name: string, rooms: Room[] }
export type WilayahNode = { id: string, name: string, daerahs: DaerahNode[] }
