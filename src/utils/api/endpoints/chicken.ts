import { periodeClosingApi, type PeriodeClosing } from "./periode-closing"
import { apiPath } from "../endpoints"
import { request } from "../http"
import type { ApiResponse } from "../types"

import { createResourceApi, getAllPages } from "../resource"
import type { MasterAyam, MasterKandang } from "./master-data"
import { masterAyamApi, masterKandangApi, masterLokasiApi } from "./master-data"

export type ChickenIdentityInput = {
  periode_id: number
  lokasi_id: number
  kandang_id: number
  master_ayam_id: number
  flock_no: string
  umur_minggu: number
}
export type OpeningBalanceInput = ChickenIdentityInput & { so_ekor: number }
export type TransaksiAyamInput = {
  in_ekor: number
  out_ekor: number
  mati_ekor: number
  jual_ekor: number
  koreksi_ekor: number
}
export type TransaksiAyamCreateInput = ChickenIdentityInput & TransaksiAyamInput
export type TransaksiAyamRow = Omit<OpeningBalanceInput, "lokasi_id"> &
  TransaksiAyamInput & {
    id: number
    sa_ekor: number
    periode?: PeriodeClosing | null
    kandang?: MasterKandang | null
    master_ayam?: MasterAyam | null
  }
const resource = createResourceApi<TransaksiAyamInput, TransaksiAyamRow>(
  apiPath.chicken.list
)

async function requireOpenPeriod(id: number) {
  const periode = await periodeClosingApi.get(String(id))
  if (periode.status !== "OPEN")
    throw new Error("Periode sudah ditutup. Pilih periode berstatus OPEN.")
}

async function postTransaction(
  data: OpeningBalanceInput | TransaksiAyamCreateInput
) {
  const response = await request<ApiResponse<TransaksiAyamRow>>(
    { url: apiPath.chicken.create, method: "POST", data },
    { silent: true }
  )
  return response.data
}

const identityPayload = (data: ChickenIdentityInput): ChickenIdentityInput => ({
  periode_id: data.periode_id,
  lokasi_id: data.lokasi_id,
  kandang_id: data.kandang_id,
  master_ayam_id: data.master_ayam_id,
  flock_no: data.flock_no,
  umur_minggu: data.umur_minggu,
})

export const openingBalanceApi = {
  ...resource,
  async save(data: OpeningBalanceInput, id?: number) {
    if (id !== undefined)
      throw new Error("Saldo awal tidak dapat diubah melalui update transaksi.")
    await requireOpenPeriod(data.periode_id)
    return postTransaction({ ...identityPayload(data), so_ekor: data.so_ekor })
  },
}

export const chickenApi = {
  ...resource,
  async save(data: TransaksiAyamInput, id?: number) {
    if (id === undefined)
      throw new Error("Pilih data transaksi yang akan diubah.")
    const current = await resource.get(String(id))
    await requireOpenPeriod(current.periode_id)
    const { in_ekor, out_ekor, mati_ekor, jual_ekor, koreksi_ekor } = data
    return resource.save(
      { in_ekor, out_ekor, mati_ekor, jual_ekor, koreksi_ekor },
      id
    )
  },
}
export const getTransaksiAyam = chickenApi.list
export const getTransaksiAyamById = (
  id: string | number,
  signal?: AbortSignal
) => chickenApi.get(String(id), signal)
export const monthlyTransactionApi = {
  ...resource,
  async save(data: TransaksiAyamCreateInput, id?: number) {
    if (id !== undefined)
      throw new Error("Gunakan form Ubah untuk memperbarui transaksi bulanan.")
    await requireOpenPeriod(data.periode_id)
    const { in_ekor, out_ekor, mati_ekor, jual_ekor, koreksi_ekor } = data
    return postTransaction({
      ...identityPayload(data),
      in_ekor,
      out_ekor,
      mati_ekor,
      jual_ekor,
      koreksi_ekor,
    })
  },
}
export const createTransaksiAyam = (body: TransaksiAyamCreateInput) =>
  monthlyTransactionApi.save(body)

export async function getTransaksiAyamOptions(signal: AbortSignal) {
  const [periode, kandang, ayam, lokasi] = await Promise.all([
    getAllPages(periodeClosingApi.list, signal),
    getAllPages(masterKandangApi.list, signal),
    getAllPages(masterAyamApi.list, signal),
    getAllPages(masterLokasiApi.list, signal),
  ])
  return { periode, kandang, ayam, lokasi }
}
