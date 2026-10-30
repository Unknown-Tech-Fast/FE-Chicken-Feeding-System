import { useCallback } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useParams } from "react-router-dom"
import {
  ResourceDetail,
  ResourceEdit,
  ResourceForm,
  ResourceList,
} from "@/components/api-record"
import { FormField, SelectInput } from "@/components/form-fields"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { currentMonth, periodeLabel, formatDecimalRupiah } from "@/lib/format"
import { routes } from "@/routes"
import {
  periodeClosingApi,
  type PeriodeClosing,
} from "@/utils/api/endpoints/periode-closing"
import {
  periodeClosingSchema,
  type PeriodeClosingForm,
} from "./periode-closing-schema"

const listPath = routes.master_period.path
const months = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
  label: new Intl.DateTimeFormat("id-ID", { month: "long" }).format(
    new Date(2000, index, 1)
  ),
}))
const statuses = [
  { value: "OPEN", label: "OPEN" },
  { value: "CLOSED", label: "CLOSED" },
]
function PeriodStatus({ status }: { status: PeriodeClosing["status"] }) {
  return (
    <Badge variant={status === "OPEN" ? "secondary" : "outline"}>
      {status}
    </Badge>
  )
}
export function PeriodeClosingPage() {
  return (
    <ResourceList
      title="Daftar Periode Closing"
      api={periodeClosingApi}
      createPath={routes.master_period_create.path}
      detailPath={routes.master_period_detail.path}
      editPath={routes.master_period_edit.path}
      rowLabel={periodeLabel}
      renderFilters={(table) => (
        <>
          <label className="flex items-center gap-2 text-sm">
            Tahun
            <Input
              aria-label="Filter tahun"
              className="h-10 w-28"
              type="number"
              min={2000}
              max={9999}
              step={1}
              placeholder="Semua"
              value={String(table.filters.tahun ?? "")}
              onChange={(event) => table.setFilter("tahun", event.target.value)}
            />
          </label>
          <label className="flex min-w-0 items-center gap-2 text-sm">
            Bulan
            <select
              aria-label="Filter bulan"
              className="h-10 min-w-0 rounded-lg border bg-background px-3"
              value={String(table.filters.bulan ?? "")}
              onChange={(event) => table.setFilter("bulan", event.target.value)}
            >
              <option value="">Semua</option>
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            Status
            <select
              aria-label="Filter status periode"
              className="h-10 rounded-lg border bg-background px-3"
              value={String(table.filters.status ?? "")}
              onChange={(event) =>
                table.setFilter("status", event.target.value)
              }
            >
              <option value="">Semua</option>
              {statuses.map((status) => (
                <option key={status.value}>{status.value}</option>
              ))}
            </select>
          </label>
        </>
      )}
      columns={[
        { label: "Periode", render: periodeLabel },
        {
          label: "Status",
          render: (row) => <PeriodStatus status={row.status} />,
        },
        {
          label: "Total Biaya Operasional",
          render: (row) => formatDecimalRupiah(row.total_biaya_operasional),
        },
      ]}
    />
  )
}
function PeriodForm({ initial }: { initial?: PeriodeClosing }) {
  const [tahun, bulan] = currentMonth().split("-").map(Number)
  const form = useForm<PeriodeClosingForm>({
    resolver: zodResolver(periodeClosingSchema),
    mode: "onTouched",
    defaultValues: initial
      ? {
          tahun: initial.tahun,
          bulan: initial.bulan,
          status: initial.status,
          total_biaya_operasional: initial.total_biaya_operasional,
        }
      : { tahun, bulan, status: "OPEN", total_biaya_operasional: "0.00" },
  })
  const { errors } = form.formState
  return (
    <ResourceForm
      title={initial ? "Ubah Periode Closing" : "Tambah Periode Closing"}
      backTo={listPath}
      api={periodeClosingApi}
      initial={initial}
      form={form}
    >
      <FormField
        id="tahun"
        label="Tahun"
        required
        error={errors.tahun?.message}
      >
        <Input
          id="tahun"
          type="number"
          className="h-10"
          min={2000}
          max={9999}
          step={1}
          aria-invalid={Boolean(errors.tahun)}
          aria-describedby={errors.tahun ? "tahun-error" : undefined}
          {...form.register("tahun", { valueAsNumber: true })}
        />
      </FormField>
      <FormField
        id="bulan"
        label="Bulan"
        required
        error={errors.bulan?.message}
      >
        <Controller
          control={form.control}
          name="bulan"
          render={({ field }) => (
            <SelectInput
              id="bulan"
              required
              value={String(field.value)}
              onChange={(value) => field.onChange(Number(value))}
              onBlur={field.onBlur}
              invalid={Boolean(errors.bulan)}
              options={months}
            />
          )}
        />
      </FormField>
      <FormField
        id="status"
        label="Status Periode"
        required
        error={errors.status?.message}
      >
        <Controller
          control={form.control}
          name="status"
          render={({ field }) => (
            <SelectInput
              id="status"
              required
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              invalid={Boolean(errors.status)}
              options={statuses}
            />
          )}
        />
      </FormField>
      <FormField
        id="total_biaya_operasional"
        label="Total Biaya Operasional (Rp)"
        required
        error={errors.total_biaya_operasional?.message}
        help="Gunakan titik untuk desimal, misalnya 150000.50."
      >
        <Input
          id="total_biaya_operasional"
          className="h-10"
          inputMode="decimal"
          maxLength={21}
          aria-invalid={Boolean(errors.total_biaya_operasional)}
          aria-describedby={`total_biaya_operasional-help${errors.total_biaya_operasional ? " total_biaya_operasional-error" : ""}`}
          {...form.register("total_biaya_operasional")}
        />
      </FormField>
    </ResourceForm>
  )
}
export function PeriodeClosingCreatePage() {
  return <PeriodForm />
}
export function PeriodeClosingDetailPage() {
  const { id = "" } = useParams()
  const load = useCallback(
    (signal: AbortSignal) => periodeClosingApi.get(id, signal),
    [id]
  )
  return (
    <ResourceDetail
      backTo={listPath}
      load={load}
      title={periodeLabel}
      fields={(row) => [
        { label: "ID", value: row.id },
        { label: "Periode", value: periodeLabel(row) },
        { label: "Status", value: <PeriodStatus status={row.status} /> },
        {
          label: "Total Biaya Operasional",
          value: formatDecimalRupiah(row.total_biaya_operasional),
        },
        {
          label: "Waktu Penguncian",
          value: row.locked_at
            ? new Date(row.locked_at).toLocaleString("id-ID")
            : "-",
        },
        { label: "Dikunci Oleh", value: row.locked_by ?? "-" },
      ]}
    />
  )
}
export function PeriodeClosingEditPage() {
  const { id = "" } = useParams()
  const load = useCallback(
    (signal: AbortSignal) => periodeClosingApi.get(id, signal),
    [id]
  )
  return (
    <ResourceEdit
      backTo={listPath}
      load={load}
      renderForm={(row) => <PeriodForm initial={row} />}
    />
  )
}
