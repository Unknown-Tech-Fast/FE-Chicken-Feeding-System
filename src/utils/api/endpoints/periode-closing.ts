import { createResourceApi } from "../resource"

export type PeriodeClosingInput = {
  tahun: number
  bulan: number
  status: "OPEN" | "CLOSED"
  total_biaya_operasional: string
}
export type PeriodeClosing = PeriodeClosingInput & {
  id: number
  locked_at: string | null
  locked_by: string | number | null
}
export const periodeClosingApi = createResourceApi<
  PeriodeClosingInput,
  PeriodeClosing
>("periode-closing")
