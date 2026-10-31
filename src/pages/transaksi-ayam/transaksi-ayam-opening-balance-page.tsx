import { useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useParams } from "react-router-dom"
import { ResourceDetail, ResourceList } from "@/components/api-record"
import { FormField } from "@/components/form-fields"
import { Input } from "@/components/ui/input"
import { formatNumber, periodeLabel } from "@/lib/format"
import { routes } from "@/routes"
import { openingBalanceApi } from "@/utils/api/endpoints/chicken"
import type { TableQueryMap } from "@/utils/api/query"
import {
  openingBalanceSchema,
  OPENING_BALANCE_DEFAULT_VALUES,
  transaksiLabel,
  type OpeningBalanceFormValues,
} from "./transaksi-ayam-schema"
import { ChickenCreateForm } from "./chicken-create-form"

const queryMap: TableQueryMap = { searchKey: "flock_no" }

export function TransaksiAyamOpeningBalancePage() {
  return (
    <ResourceList
      title="Daftar Opening Balance"
      api={openingBalanceApi}
      createPath={routes.chicken_opening_balance_create.path}
      createLabel="Input Opening Balance"
      detailPath={routes.chicken_opening_balance_detail.path}
      allowDelete={false}
      rowLabel={transaksiLabel}
      searchPlaceholder="Cari Flock No…"
      queryMap={queryMap}
      columns={[
        {
          label: "Periode Bulan",
          render: (row) =>
            row.periode ? periodeLabel(row.periode) : row.periode_id,
        },
        {
          label: "Status Periode",
          render: (row) => row.periode?.status ?? "-",
        },
        {
          label: "Wilayah",
          render: (row) => row.kandang?.lokasi?.nama_lokasi ?? "-",
        },
        {
          label: "Kandang",
          render: (row) => row.kandang?.kode_kandang ?? row.kandang_id,
        },
        {
          label: "Fase Ayam",
          render: (row) => row.master_ayam?.nama_fase ?? row.master_ayam_id,
        },
        { label: "Flock No", render: (row) => row.flock_no || "-" },
        {
          label: "Umur (minggu)",
          render: (row) => formatNumber(row.umur_minggu),
        },
        {
          label: "Saldo Awal (ekor)",
          render: (row) => formatNumber(row.so_ekor),
        },
      ]}
    />
  )
}

export function OpeningBalanceCreatePage() {
  const form = useForm<OpeningBalanceFormValues>({
    resolver: zodResolver(openingBalanceSchema),
    mode: "onTouched",
    defaultValues: OPENING_BALANCE_DEFAULT_VALUES,
  })
  const error = form.formState.errors.so_ekor?.message
  return (
    <ChickenCreateForm
      title="Input Opening Balance"
      backTo={routes.chicken_opening_balance.path}
      form={form}
      api={openingBalanceApi}
      help="Pilih periode OPEN dan isi saldo awal. Mutasi dicatat melalui Inquiry Transaksi Ayam."
    >
      <FormField id="so_ekor" label="Saldo Awal (ekor)" required error={error}>
        <Input
          id="so_ekor"
          type="number"
          min={0}
          step={1}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "so_ekor-error" : undefined}
          {...form.register("so_ekor", { valueAsNumber: true })}
        />
      </FormField>
    </ChickenCreateForm>
  )
}

export function OpeningBalanceDetailPage() {
  const { id = "" } = useParams()
  const load = useCallback(
    (signal: AbortSignal) => openingBalanceApi.get(id, signal),
    [id]
  )
  return (
    <ResourceDetail
      title={(row) => `Opening Balance ${transaksiLabel(row)}`}
      backTo={routes.chicken_opening_balance.path}
      load={load}
      fields={(row) => [
        {
          label: "Periode Bulan",
          value: row.periode ? periodeLabel(row.periode) : row.periode_id,
        },
        { label: "Status Periode", value: row.periode?.status ?? "-" },
        { label: "Wilayah", value: row.kandang?.lokasi?.nama_lokasi ?? "-" },
        {
          label: "Kandang",
          value: row.kandang?.kode_kandang ?? row.kandang_id,
        },
        {
          label: "Fase Ayam",
          value: row.master_ayam?.nama_fase ?? row.master_ayam_id,
        },
        { label: "Flock No", value: row.flock_no || "-" },
        { label: "Umur (minggu)", value: formatNumber(row.umur_minggu) },
        { label: "Saldo Awal (ekor)", value: formatNumber(row.so_ekor) },
      ]}
    />
  )
}
export default TransaksiAyamOpeningBalancePage
