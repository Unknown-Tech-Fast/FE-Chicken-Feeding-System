import { z } from "zod"
import type {
  OpeningBalanceInput,
  TransaksiAyamRow,
} from "@/utils/api/endpoints/chicken"

const nonnegativeInteger = (label: string) =>
  z
    .number({ message: `${label} harus berupa angka` })
    .int(`${label} harus bilangan bulat`)
    .min(0, `${label} tidak boleh negatif`)
const relationId = (label: string) =>
  z
    .number({ message: `Pilih ${label}` })
    .int()
    .positive(`Pilih ${label}`)

export const chickenIdentitySchema = z.object({
  periode_id: relationId("periode"),
  lokasi_id: relationId("wilayah"),
  kandang_id: relationId("kandang"),
  master_ayam_id: relationId("fase ayam"),
  flock_no: z.string().trim().max(100, "Flock No maksimal 100 karakter"),
  umur_minggu: nonnegativeInteger("Umur").max(
    65535,
    "Umur maksimal 65535 minggu"
  ),
})
export type ChickenIdentityValues = z.infer<typeof chickenIdentitySchema>
export const openingBalanceSchema = chickenIdentitySchema.extend({
  so_ekor: nonnegativeInteger("Saldo awal"),
})
export type OpeningBalanceFormValues = z.infer<typeof openingBalanceSchema>

export const transaksiAyamSchema = z.object({
  in_ekor: nonnegativeInteger("Ayam masuk"),
  out_ekor: nonnegativeInteger("Ayam keluar"),
  mati_ekor: nonnegativeInteger("Ayam mati"),
  jual_ekor: nonnegativeInteger("Ayam dijual"),
  koreksi_ekor: z
    .number({ message: "Koreksi harus berupa angka" })
    .int("Koreksi harus bilangan bulat"),
})
export type TransaksiAyamFormValues = z.infer<typeof transaksiAyamSchema>
export const transaksiAyamCreateSchema = chickenIdentitySchema.extend(
  transaksiAyamSchema.shape
)
export type TransaksiAyamCreateValues = z.infer<
  typeof transaksiAyamCreateSchema
>
export const OPENING_BALANCE_DEFAULT_VALUES: OpeningBalanceInput = {
  periode_id: 0,
  lokasi_id: 0,
  kandang_id: 0,
  master_ayam_id: 0,
  flock_no: "",
  umur_minggu: 0,
  so_ekor: 0,
}
export const TRANSAKSI_AYAM_CREATE_DEFAULT_VALUES: TransaksiAyamCreateValues = {
  periode_id: 0,
  lokasi_id: 0,
  kandang_id: 0,
  master_ayam_id: 0,
  flock_no: "",
  umur_minggu: 0,
  in_ekor: 0,
  out_ekor: 0,
  mati_ekor: 0,
  jual_ekor: 0,
  koreksi_ekor: 0,
}
export const transaksiLabel = (row: TransaksiAyamRow) =>
  row.flock_no || `Transaksi #${row.id}`

export const TRANSAKSI_AYAM_MOVEMENT_FIELDS = [
  { name: "in_ekor", label: "Ayam Masuk (ekor)" },
  { name: "out_ekor", label: "Ayam Keluar (ekor)" },
  { name: "mati_ekor", label: "Ayam Mati (ekor)" },
  { name: "jual_ekor", label: "Ayam Dijual (ekor)" },
  { name: "koreksi_ekor", label: "Koreksi (ekor)" },
] as const

export const TRANSAKSI_AYAM_COUNT_FIELDS = [
  { name: "umur_minggu", label: "Umur (minggu)" },
  { name: "so_ekor", label: "Saldo Awal (ekor)" },
  ...TRANSAKSI_AYAM_MOVEMENT_FIELDS,
  { name: "sa_ekor", label: "Saldo Akhir (ekor)" },
] as const
