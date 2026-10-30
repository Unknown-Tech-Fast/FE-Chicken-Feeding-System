import { request } from "../http"
import { apiPath } from "../endpoints"

export type FinanceReport = "chicken" | "feed" | "ovk"
export type ReportFilters = {
  year?: number
  month_from?: number
  month_to?: number
  import_id?: number
}
export type PivotRows = (string | number | null)[][]
export type PivotPreview = {
  summary_title?: string
  detail_title?: string
  summary_rows?: PivotRows
  detail_rows?: PivotRows
  pivot1_rows?: PivotRows
  pivot2_rows?: PivotRows
  pivot3_rows?: PivotRows
  pivot4_rows?: PivotRows
}

export const previewFinanceReport = (
  category: "feed" | "ovk",
  params: ReportFilters
) =>
  request<{ success: boolean; data: PivotPreview }>({
    url:
      category === "feed"
        ? apiPath.reporting.feedPreview
        : apiPath.reporting.ovkPreview,
    method: "GET",
    params,
  })

export async function downloadFinanceReport(
  category: FinanceReport,
  params: ReportFilters
) {
  const blob = await request<Blob>({
    url: apiPath.reporting[`${category}Export`],
    method: "GET",
    params,
    responseType: "blob",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `laporan-${category === "feed" ? "pakan-ovd" : category}${params.year ? `-${params.year}` : ""}${params.month_from ? `-${params.month_from}-${params.month_to}` : ""}${params.import_id ? `-import-${params.import_id}` : ""}.xlsx`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
