import { z } from "zod"

export const LEDGER_SHEETS = ["OVK", "PAKAN.OVD", "AYAM"] as const
export const LEDGER_TYPES = ["PEMBELIAN", "PEMAKAIAN"] as const
const date = z.union([
  z.literal(""),
  z.iso.date({ message: "Tanggal harus valid dalam format YYYY-MM-DD." }),
])
export const ledgerFiltersSchema = z
  .object({
    source_sheet: z.union([z.literal(""), z.enum(LEDGER_SHEETS)]),
    jenis_transaksi: z.union([z.literal(""), z.enum(LEDGER_TYPES)]),
    coa_code: z.string().trim().max(100, "Kode COA maksimal 100 karakter."),
    from: date,
    to: date,
    import_id: z
      .string()
      .refine(
        (value) =>
          value === "" ||
          (/^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value))),
        "ID impor harus bilangan bulat positif."
      ),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    message: "Tanggal akhir harus sama dengan atau setelah tanggal awal.",
    path: ["to"],
  })
export type LedgerFilters = z.infer<typeof ledgerFiltersSchema>
export const EMPTY_LEDGER_FILTERS: LedgerFilters = {
  source_sheet: "",
  jenis_transaksi: "",
  coa_code: "",
  from: "",
  to: "",
  import_id: "",
}
export function parseLedgerFilters(params: URLSearchParams) {
  return ledgerFiltersSchema.safeParse(
    Object.fromEntries(
      Object.keys(EMPTY_LEDGER_FILTERS).map((key) => [
        key,
        params.get(key) ?? "",
      ])
    )
  )
}
