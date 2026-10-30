import { useCallback } from "react"
import { useParams } from "react-router-dom"
import {
  ResourceDetail,
  ResourceList,
  ResourceLoadState,
  useResourceLoad,
} from "@/components/api-record"
import {
  chickenApi,
  getTransaksiAyamOptions,
  type TransaksiAyamRow,
} from "@/utils/api/endpoints/chicken"
import { formatNumber, periodeLabel } from "@/lib/format"
import { routes } from "@/routes"
import {
  TRANSAKSI_AYAM_COUNT_FIELDS,
  transaksiLabel,
} from "./transaksi-ayam-schema"
import type { TableQueryMap } from "@/utils/api/query"

const queryMap: TableQueryMap = { searchKey: "flock_no" }
const countFields = TRANSAKSI_AYAM_COUNT_FIELDS
const period = (row: TransaksiAyamRow) =>
  row.periode ? periodeLabel(row.periode) : `Periode #${row.periode_id}`
const cage = (row: TransaksiAyamRow) =>
  row.kandang?.kode_kandang ?? `Kandang #${row.kandang_id}`
const phase = (row: TransaksiAyamRow) =>
  row.master_ayam?.nama_fase ?? `Fase #${row.master_ayam_id}`

export function TransaksiAyamPage() {
  const options = useResourceLoad(getTransaksiAyamOptions)
  return (
    <ResourceList
      title="Daftar Transaksi Ayam Bulanan"
      api={chickenApi}
      createPath={routes.chicken_create.path}
      detailPath={routes.chicken_detail.path}
      editPath={routes.chicken_edit.path}
      rowLabel={transaksiLabel}
      searchPlaceholder="Cari Flock No…"
      queryMap={queryMap}
      renderFilters={(table) => (
        <>
          {[
            {
              key: "periode_id",
              label: "Periode",
              rows: (options.data?.periode ?? []).map((row) => ({
                id: row.id,
                label: periodeLabel(row),
              })),
            },
            {
              key: "kandang_id",
              label: "Kandang",
              rows: (options.data?.kandang ?? []).map((row) => ({
                id: row.id,
                label: row.kode_kandang,
              })),
            },
            {
              key: "master_ayam_id",
              label: "Fase Ayam",
              rows: (options.data?.ayam ?? []).map((row) => ({
                id: row.id,
                label: row.nama_fase,
              })),
            },
          ].map((filter) => (
            <label
              key={filter.key}
              className="flex max-w-full min-w-0 items-center gap-2 text-sm"
            >
              {filter.label}
              <select
                aria-label={`Filter ${filter.label}`}
                className="h-10 max-w-52 min-w-0 rounded-lg border bg-background px-3"
                disabled={!options.data}
                value={String(table.filters[filter.key] ?? "")}
                onChange={(event) =>
                  table.setFilter(filter.key, event.target.value)
                }
              >
                <option value="">Semua</option>
                {filter.rows.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
          {(options.loading || options.error) && (
            <div className="basis-full">
              <ResourceLoadState {...options} />
            </div>
          )}
        </>
      )}
      columns={[
        { label: "Periode Bulan", render: period },
        {
          label: "Wilayah",
          render: (row) => row.kandang?.lokasi?.nama_lokasi ?? "-",
        },
        { label: "Kandang", render: cage },
        { label: "Fase Ayam", render: phase },
        { label: "Flock No", render: (row) => row.flock_no || "-" },
        ...countFields.map((field) => ({
          label: field.label,
          render: (row: TransaksiAyamRow) => formatNumber(row[field.name]),
        })),
      ]}
    />
  )
}
export function TransaksiAyamDetailPage() {
  const { id = "" } = useParams()
  const load = useCallback(
    (signal: AbortSignal) => chickenApi.get(id, signal),
    [id]
  )
  return (
    <ResourceDetail
      backTo={routes.chicken_inquiry.path}
      load={load}
      title={(row) => `Detail ${transaksiLabel(row)}`}
      fields={(row) => [
        { label: "ID", value: row.id },
        { label: "Periode Bulan", value: period(row) },
        { label: "Status Periode", value: row.periode?.status ?? "-" },
        { label: "Wilayah", value: row.kandang?.lokasi?.nama_lokasi ?? "-" },
        { label: "Kandang", value: cage(row) },
        { label: "Fase Ayam", value: phase(row) },
        { label: "Flock No", value: row.flock_no || "-" },
        ...countFields.map((field) => ({
          label: field.label,
          value: formatNumber(row[field.name]),
        })),
      ]}
    />
  )
}
export default TransaksiAyamPage
