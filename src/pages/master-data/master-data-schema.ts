import { z } from "zod"

const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} wajib diisi`)
    .max(max, `${label} maksimal ${max} karakter`)
const integer = (label: string) =>
  z
    .number({ message: `${label} harus berupa angka` })
    .int(`${label} harus bilangan bulat`)
    .min(0, `${label} tidak boleh negatif`)

export const chickenPhaseSchema = z.object({
  kode_fase: requiredText("Kode fase", 30),
  nama_fase: requiredText("Nama fase", 150),
  default_umur_deplesi: integer("Umur deplesi"),
  coa_persediaan: z
    .string()
    .trim()
    .max(50, "COA persediaan maksimal 50 karakter")
    .nullable(),
  is_active: z.boolean(),
})
export const cageSchema = z.object({
  lokasi_id: z
    .number({ message: "Pilih wilayah" })
    .int()
    .positive("Pilih wilayah"),
  kode_kandang: requiredText("Kode kandang", 50),
  kapasitas: integer("Kapasitas"),
  is_active: z.boolean(),
})
export const regionSchema = z.object({
  kode_lokasi: requiredText("Kode lokasi", 50),
  nama_lokasi: requiredText("Nama lokasi", 255),
  is_active: z.boolean(),
})
export type ChickenPhaseForm = z.infer<typeof chickenPhaseSchema>
export type CageForm = z.infer<typeof cageSchema>
export type RegionForm = z.infer<typeof regionSchema>
