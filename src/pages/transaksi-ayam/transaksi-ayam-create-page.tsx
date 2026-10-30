import { periodeLabel } from "@/lib/format"
import { useCallback } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useParams } from "react-router-dom"
import {
  ResourceEdit,
  ResourceForm,
  ResourceLoadState,
  useResourceLoad,
} from "@/components/api-record"
import { FormField, SelectInput } from "@/components/form-fields"
import { Input } from "@/components/ui/input"
import {
  chickenApi,
  getTransaksiAyamOptions,
  type TransaksiAyamRow,
} from "@/utils/api/endpoints/chicken"
import { routes } from "@/routes"
import {
  TRANSAKSI_AYAM_COUNT_FIELDS,
  transaksiAyamSchema,
  TRANSAKSI_AYAM_DEFAULT_VALUES,
  type TransaksiAyamFormValues,
} from "./transaksi-ayam-schema"

const countFields = TRANSAKSI_AYAM_COUNT_FIELDS

function ChickenTransactionForm({ initial }: { initial?: TransaksiAyamRow }) {
  const options = useResourceLoad(getTransaksiAyamOptions)
  const form = useForm<TransaksiAyamFormValues>({
    resolver: zodResolver(transaksiAyamSchema),
    mode: "onTouched",
    defaultValues: initial ?? TRANSAKSI_AYAM_DEFAULT_VALUES,
  })
  const { errors } = form.formState
  const missing =
    options.data &&
    (!options.data.periode.length ||
      !options.data.kandang.length ||
      !options.data.ayam.length)
  const relationFields = [
    {
      name: "periode_id",
      label: "Periode Bulan",
      options: (options.data?.periode ?? []).map((row) => ({
        value: String(row.id),
        label: `${periodeLabel(row)} · ${row.status}`,
      })),
    },
    {
      name: "kandang_id",
      label: "Kandang",
      options: (options.data?.kandang ?? []).map((row) => ({
        value: String(row.id),
        label: `${row.kode_kandang}${row.lokasi ? " · " + row.lokasi.nama_lokasi : ""}${row.is_active ? "" : " (Tidak aktif)"}`,
      })),
    },
    {
      name: "master_ayam_id",
      label: "Fase Ayam",
      options: (options.data?.ayam ?? []).map((row) => ({
        value: String(row.id),
        label: `${row.kode_fase} · ${row.nama_fase}${row.is_active ? "" : " (Tidak aktif)"}`,
      })),
    },
  ] as const
  return (
    <ResourceForm
      title={initial ? "Ubah Transaksi Ayam" : "Tambah Transaksi Ayam"}
      backTo={routes.chicken_inquiry.path}
      api={chickenApi}
      initial={initial}
      form={form}
      disabled={!options.data || Boolean(missing)}
      notice={
        options.loading || options.error ? (
          <div className="mb-5">
            <ResourceLoadState {...options} />
          </div>
        ) : missing ? (
          <div role="status" className="mb-5 space-y-2 text-sm">
            {!options.data?.periode.length && (
              <p>
                Periode closing belum tersedia.{" "}
                <Link
                  className="text-primary underline"
                  to={routes.master_period_create.path}
                >
                  Tambah periode closing
                </Link>
                .
              </p>
            )}
            {!options.data?.kandang.length && (
              <p>
                Master kandang belum tersedia.{" "}
                <Link
                  className="text-primary underline"
                  to={routes.master_cage_create.path}
                >
                  Tambah kandang
                </Link>
                .
              </p>
            )}
            {!options.data?.ayam.length && (
              <p>
                Master ayam belum tersedia.{" "}
                <Link
                  className="text-primary underline"
                  to={routes.master_chicken_create.path}
                >
                  Tambah fase ayam
                </Link>
                .
              </p>
            )}
          </div>
        ) : undefined
      }
    >
      {relationFields.map((relation) => (
        <FormField
          key={relation.name}
          id={relation.name}
          label={relation.label}
          required
          error={errors[relation.name]?.message}
        >
          <Controller
            control={form.control}
            name={relation.name}
            render={({ field }) => (
              <SelectInput
                id={relation.name}
                value={field.value ? String(field.value) : ""}
                onChange={(value) => field.onChange(Number(value))}
                onBlur={field.onBlur}
                required
                invalid={Boolean(errors[relation.name])}
                options={relation.options}
              />
            )}
          />
        </FormField>
      ))}
      <FormField
        id="flock_no"
        label="Flock No"
        help="Opsional. Boleh dikosongkan."
        error={errors.flock_no?.message}
      >
        <Input
          id="flock_no"
          className="h-10"
          maxLength={100}
          aria-invalid={Boolean(errors.flock_no)}
          aria-describedby={`flock_no-help${errors.flock_no ? " flock_no-error" : ""}`}
          {...form.register("flock_no")}
        />
      </FormField>
      {countFields.map((field) => (
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
            max={"max" in field ? field.max : undefined}
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
      ))}
    </ResourceForm>
  )
}
export function TransaksiAyamCreatePage() {
  return <ChickenTransactionForm />
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
