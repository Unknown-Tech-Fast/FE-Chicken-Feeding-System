import { useCallback } from "react"
import { FormProvider, useForm, useFormContext } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useParams } from "react-router-dom"
import {
  ResourceEdit,
  ResourceForm,
  ResourceLoadState,
  useResourceLoad,
} from "@/components/api-record"
import { FormField } from "@/components/form-fields"
import { Input } from "@/components/ui/input"
import { formatNumber, periodeLabel } from "@/lib/format"
import {
  chickenApi,
  monthlyTransactionApi,
  type TransaksiAyamRow,
} from "@/utils/api/endpoints/chicken"
import { periodeClosingApi } from "@/utils/api/endpoints/periode-closing"
import { routes } from "@/routes"
import {
  TRANSAKSI_AYAM_MOVEMENT_FIELDS,
  transaksiAyamSchema,
  transaksiAyamCreateSchema,
  TRANSAKSI_AYAM_CREATE_DEFAULT_VALUES,
  type TransaksiAyamFormValues,
  type TransaksiAyamCreateValues,
} from "./transaksi-ayam-schema"
import { ChickenCreateForm } from "./chicken-create-form"

function ChickenMovementFields() {
  const form = useFormContext<TransaksiAyamFormValues>()
  const { errors } = form.formState
  return TRANSAKSI_AYAM_MOVEMENT_FIELDS.map((field) => (
    <FormField
      key={field.name}
      id={field.name}
      label={field.label}
      required
      error={errors[field.name]?.message}
      help={
        field.name === "koreksi_ekor"
          ? "Koreksi boleh bernilai negatif."
          : undefined
      }
    >
      <Input
        id={field.name}
        className="h-10"
        type="number"
        step={1}
        min={field.name === "koreksi_ekor" ? undefined : 0}
        aria-invalid={Boolean(errors[field.name])}
        aria-describedby={
          errors[field.name]
            ? `${field.name}-error`
            : field.name === "koreksi_ekor"
              ? "koreksi_ekor-help"
              : undefined
        }
        {...form.register(field.name, { valueAsNumber: true })}
      />
    </FormField>
  ))
}

function ChickenTransactionForm({ initial }: { initial: TransaksiAyamRow }) {
  const loadPeriod = useCallback(
    (signal: AbortSignal) =>
      periodeClosingApi.get(String(initial.periode_id), signal),
    [initial.periode_id]
  )
  const period = useResourceLoad(loadPeriod)
  const form = useForm<TransaksiAyamFormValues>({
    resolver: zodResolver(transaksiAyamSchema),
    mode: "onTouched",
    defaultValues: {
      in_ekor: initial.in_ekor,
      out_ekor: initial.out_ekor,
      mati_ekor: initial.mati_ekor,
      jual_ekor: initial.jual_ekor,
      koreksi_ekor: initial.koreksi_ekor,
    },
  })
  const closed = period.data && period.data.status !== "OPEN"
  return (
    <FormProvider {...form}>
      <ResourceForm
        title="Ubah Mutasi Transaksi Ayam"
        backTo={routes.chicken_inquiry.path}
        api={chickenApi}
        initial={initial}
        form={form}
        disabled={!period.data || Boolean(closed)}
        notice={
          <div className="mb-6 space-y-4">
            <dl className="grid gap-4 text-sm sm:grid-cols-2">
              {[
                [
                  "Periode",
                  period.data ? periodeLabel(period.data) : initial.periode_id,
                ],
                ["Wilayah", initial.kandang?.lokasi?.nama_lokasi ?? "-"],
                [
                  "Kandang",
                  initial.kandang?.kode_kandang ?? initial.kandang_id,
                ],
                [
                  "Fase Ayam",
                  initial.master_ayam?.nama_fase ?? initial.master_ayam_id,
                ],
                ["Flock No", initial.flock_no || "-"],
                ["Umur (minggu)", formatNumber(initial.umur_minggu)],
                ["Saldo Awal (ekor)", formatNumber(initial.so_ekor)],
                ["Saldo Akhir Tersimpan (ekor)", formatNumber(initial.sa_ekor)],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="mt-1 font-medium break-words">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="text-sm text-muted-foreground">
              Saldo awal dikelola oleh sistem. Saldo akhir dihitung otomatis
              setelah mutasi disimpan.
            </p>
            {period.loading || period.error ? (
              <ResourceLoadState {...period} />
            ) : closed ? (
              <p role="alert" className="text-sm text-destructive">
                Periode sudah CLOSED. Mutasi hanya dapat diubah pada periode
                OPEN.
              </p>
            ) : null}
          </div>
        }
      >
        <ChickenMovementFields />
      </ResourceForm>
    </FormProvider>
  )
}

export function TransaksiAyamCreatePage() {
  const form = useForm<TransaksiAyamCreateValues>({
    resolver: zodResolver(transaksiAyamCreateSchema),
    mode: "onTouched",
    defaultValues: TRANSAKSI_AYAM_CREATE_DEFAULT_VALUES,
  })
  return (
    <ChickenCreateForm
      title="Input Transaksi Bulanan"
      backTo={routes.chicken_inquiry.path}
      form={form}
      api={monthlyTransactionApi}
      help="Pilih periode OPEN dan isi mutasi bulanan. Saldo awal dan saldo akhir dikelola otomatis oleh sistem."
    >
      <ChickenMovementFields />
    </ChickenCreateForm>
  )
}

export function TransaksiAyamEditPage() {
  const { id = "" } = useParams()
  const load = useCallback(
    (signal: AbortSignal) => chickenApi.get(id, signal),
    [id]
  )
  return (
    <ResourceEdit
      backTo={routes.chicken_inquiry.path}
      load={load}
      renderForm={(row) => <ChickenTransactionForm initial={row} />}
    />
  )
}
export default TransaksiAyamCreatePage
