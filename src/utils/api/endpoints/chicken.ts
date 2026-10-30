import { periodeClosingApi, type PeriodeClosing } from "./periode-closing"
import { apiPath } from "../endpoints"

import { createResourceApi, getAllPages } from "../resource"
import type { MasterAyam, MasterKandang } from "./master-data"
import { masterAyamApi, masterKandangApi } from "./master-data"

export type TransaksiAyamInput = {
  periode_id: number
  kandang_id: number
  master_ayam_id: number
  flock_no: string
  umur_minggu: number
  so_ekor: number
  in_ekor: number
  out_ekor: number
  sa_ekor: number
  mati_ekor: number
  jual_ekor: number
  koreksi_ekor: number
}
export type TransaksiAyamRow = TransaksiAyamInput & {
  id: number
  periode?: PeriodeClosing | null
  kandang?: MasterKandang | null
  master_ayam?: MasterAyam | null
}
export const chickenApi = createResourceApi<
  TransaksiAyamInput,
  TransaksiAyamRow
>(apiPath.chicken.list)
export const getTransaksiAyam = chickenApi.list
export const getTransaksiAyamById = (
  id: string | number,
  signal?: AbortSignal
) => chickenApi.get(String(id), signal)
export const createTransaksiAyam = (body: TransaksiAyamInput) =>
  chickenApi.save(body)

export async function getTransaksiAyamOptions(signal: AbortSignal) {
  const [periode, kandang, ayam] = await Promise.all([
    getAllPages(periodeClosingApi.list, signal),
    getAllPages(masterKandangApi.list, signal),
    getAllPages(masterAyamApi.list, signal),
  ])
  return { periode, kandang, ayam }
}
