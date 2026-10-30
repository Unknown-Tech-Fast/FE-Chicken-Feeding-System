import { createResourceApi, getAllPages } from "../resource"

export type MasterAyamInput = {
  kode_fase: string
  nama_fase: string
  default_umur_deplesi: number
  coa_persediaan: string | null
  is_active: boolean
}
export type MasterLokasiInput = {
  kode_lokasi: string
  nama_lokasi: string
  is_active: boolean
}
export type MasterKandangInput = {
  lokasi_id: number
  kode_kandang: string
  kapasitas: number
  is_active: boolean
}
export type MasterRecord<T> = T & { id: number }
export type MasterLokasi = MasterRecord<MasterLokasiInput> & {
  kandang_count?: number
}
export type MasterAyam = MasterRecord<MasterAyamInput>
export type MasterKandang = MasterRecord<
  Omit<MasterKandangInput, "kapasitas"> & { kapasitas: number | null }
> & { lokasi?: MasterLokasi | null }

export const masterAyamApi = createResourceApi<MasterAyamInput, MasterAyam>(
  "master-ayam"
)
export const masterKandangApi = createResourceApi<
  MasterKandangInput,
  MasterKandang
>("master-kandang")
export const masterLokasiApi = createResourceApi<
  MasterLokasiInput,
  MasterLokasi
>("master-lokasi")

export const getMasterLokasiOptions = (signal: AbortSignal) =>
  getAllPages(masterLokasiApi.list, signal)
