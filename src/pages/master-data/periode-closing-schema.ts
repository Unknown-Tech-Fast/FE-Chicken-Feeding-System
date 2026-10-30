import { z } from "zod"

export const periodeClosingSchema = z.object({
  tahun: z
    .number({ message: "Tahun harus berupa angka" })
    .int("Tahun harus bilangan bulat")
    .min(2000, "Tahun minimal 2000")
    .max(9999, "Tahun maksimal 9999"),
  bulan: z
    .number({ message: "Pilih bulan" })
    .int()
    .min(1, "Pilih bulan")
    .max(12, "Pilih bulan"),
  status: z.enum(["OPEN", "CLOSED"], { message: "Pilih status periode" }),
  total_biaya_operasional: z
    .string()
    .trim()
    .regex(
      /^\d{1,18}(\.\d{1,2})?$/,
      "Isi biaya nonnegatif dengan maksimal 18 digit dan 2 angka desimal, gunakan titik."
    ),
})
export type PeriodeClosingForm = z.infer<typeof periodeClosingSchema>
