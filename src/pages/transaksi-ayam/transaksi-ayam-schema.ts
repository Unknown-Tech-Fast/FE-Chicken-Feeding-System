import { z } from "zod"
import type {
  TransaksiAyamInput,
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

export const transaksiAyamSchema = z.object({
  periode_id: relationId("periode"),
  kandang_id: relationId("kandang"),
  master_ayam_id: relationId("fase ayam"),
  flock_no: z.string().trim().max(100, "Flock No maksimal 100 karakter"),
  umur_minggu: nonnegativeInteger("Umur").max(
    65535,
    "Umur maksimal 65535 minggu"
  ),
  so_ekor: nonnegativeInteger("Saldo awal"),
  in_ekor: nonnegativeInteger("Ayam masuk"),
  out_ekor: nonnegativeInteger("Ayam keluar"),
  sa_ekor: nonnegativeInteger("Saldo akhir"),
  mati_ekor: nonnegativeInteger("Ayam mati"),
  jual_ekor: nonnegativeInteger("Ayam dijual"),
  koreksi_ekor: z
    .number({ message: "Koreksi harus berupa angka" })
    .int("Koreksi harus bilangan bulat"),
})
export type TransaksiAyamFormValues = z.infer<typeof transaksiAyamSchema>
export const TRANSAKSI_AYAM_DEFAULT_VALUES: TransaksiAyamInput = {
  periode_id: 0,
  kandang_id: 0,
  master_ayam_id: 0,
  flock_no: "",
  umur_minggu: 0,
  so_ekor: 0,
  in_ekor: 0,
  out_ekor: 0,
  sa_ekor: 0,
  mati_ekor: 0,
  jual_ekor: 0,
  koreksi_ekor: 0,
}
export const transaksiLabel = (row: TransaksiAyamRow) =>
  row.flock_no || `Transaksi #${row.id}`

export const TRANSAKSI_AYAM_COUNT_FIELDS = [
  { name: "umur_minggu", label: "Umur (minggu)", max: 65535 },
  { name: "so_ekor", label: "Saldo Awal (ekor)" },
  { name: "in_ekor", label: "Ayam Masuk (ekor)" },
  { name: "out_ekor", label: "Ayam Keluar (ekor)" },
  { name: "sa_ekor", label: "Saldo Akhir (ekor)" },
  { name: "mati_ekor", label: "Ayam Mati (ekor)" },
  { name: "jual_ekor", label: "Ayam Dijual (ekor)" },
  { name: "koreksi_ekor", label: "Koreksi (ekor)" },
] as const
