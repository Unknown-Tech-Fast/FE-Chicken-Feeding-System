import type { ReactNode } from "react"
import {
  Controller,
  FormProvider,
  useFormContext,
  useWatch,
  type UseFormReturn,
} from "react-hook-form"
import {
  ResourceForm,
  ResourceLoadState,
  useResourceLoad,
} from "@/components/api-record"
import { FormField, SelectInput } from "@/components/form-fields"
import { Input } from "@/components/ui/input"
import { periodeLabel } from "@/lib/format"
import {
  getTransaksiAyamOptions,
  type TransaksiAyamRow,
} from "@/utils/api/endpoints/chicken"
import type { ResourceApi } from "@/utils/api/resource"
import type { ChickenIdentityValues } from "./transaksi-ayam-schema"

type ChickenOptions = Awaited<ReturnType<typeof getTransaksiAyamOptions>>

function ChickenIdentityFields({ options }: { options?: ChickenOptions }) {
  const form = useFormContext<ChickenIdentityValues>()
  const lokasiId = useWatch({ control: form.control, name: "lokasi_id" })
  const { errors } = form.formState
  const cages = (options?.kandang ?? []).filter(
    (row) => row.lokasi_id === lokasiId
  )
  const relations = [
    {
      name: "periode_id",
      label: "Periode Bulan",
      options: (options?.periode ?? [])
        .filter((row) => row.status === "OPEN")
        .map((row) => ({
          value: String(row.id),
          label: `${periodeLabel(row)} · OPEN`,
        })),
    },
    {
      name: "lokasi_id",
      label: "Wilayah",
      options: (options?.lokasi ?? []).map((row) => ({
        value: String(row.id),
        label: `${row.kode_lokasi} · ${row.nama_lokasi}`,
      })),
    },
    {
      name: "kandang_id",
      label: "Kandang",
      options: cages.map((row) => ({
        value: String(row.id),
        label: row.kode_kandang,
      })),
    },
    {
      name: "master_ayam_id",
      label: "Fase Ayam",
      options: (options?.ayam ?? []).map((row) => ({
        value: String(row.id),
        label: `${row.kode_fase} · ${row.nama_fase}`,
      })),
    },
  ] as const
  return (
    <>
      {relations.map((relation) => (
        <FormField
          key={relation.name}
          id={relation.name}
          label={relation.label}
          required
          error={errors[relation.name]?.message}
          help={
            relation.name === "kandang_id"
              ? lokasiId
                ? cages.length
                  ? "Kandang sesuai wilayah yang dipilih."
                  : "Tidak ada kandang untuk wilayah ini."
                : "Pilih wilayah terlebih dahulu."
              : undefined
          }
        >
          <Controller
            control={form.control}
            name={relation.name}
            render={({ field }) => (
              <SelectInput
                id={relation.name}
                value={field.value ? String(field.value) : ""}
                onChange={(value) => {
                  field.onChange(Number(value))
                  if (relation.name === "lokasi_id")
                    form.setValue("kandang_id", 0, { shouldValidate: true })
                }}
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
          maxLength={100}
          aria-invalid={Boolean(errors.flock_no)}
          aria-describedby={`flock_no-help${errors.flock_no ? " flock_no-error" : ""}`}
          {...form.register("flock_no")}
        />
      </FormField>
      <FormField
        id="umur_minggu"
        label="Umur (minggu)"
        required
        error={errors.umur_minggu?.message}
      >
        <Input
          id="umur_minggu"
          type="number"
          min={0}
          max={65535}
          step={1}
          aria-invalid={Boolean(errors.umur_minggu)}
          aria-describedby={
            errors.umur_minggu ? "umur_minggu-error" : undefined
          }
          {...form.register("umur_minggu", { valueAsNumber: true })}
        />
      </FormField>
    </>
  )
}

export function ChickenCreateForm<T extends ChickenIdentityValues>({
  title,
  backTo,
  form,
  api,
  help,
  children,
}: {
  title: string
  backTo: string
  form: UseFormReturn<T>
  api: ResourceApi<T, TransaksiAyamRow>
  help: string
  children: ReactNode
}) {
  const options = useResourceLoad(getTransaksiAyamOptions)
  const hasOpenPeriod = options.data?.periode.some(
    (row) => row.status === "OPEN"
  )
  const missing =
    options.data &&
    (!hasOpenPeriod ||
      !options.data.lokasi.length ||
      !options.data.kandang.length ||
      !options.data.ayam.length)
  return (
    <FormProvider {...form}>
      <ResourceForm
        title={title}
        backTo={backTo}
        form={form}
        api={api}
        disabled={!options.data || Boolean(missing)}
        notice={
          <div className="mb-5 space-y-2">
            <p className="text-sm text-muted-foreground">{help}</p>
            {options.loading || options.error ? (
              <ResourceLoadState {...options} />
            ) : missing ? (
              <p role="alert" className="text-sm text-destructive">
                {!hasOpenPeriod
                  ? "Tidak ada periode OPEN. Aktifkan periode melalui Master Data Periode Closing."
                  : "Lengkapi Master Wilayah, Kandang, dan Ayam sebelum mengisi transaksi."}
              </p>
            ) : null}
          </div>
        }
      >
        <ChickenIdentityFields options={options.data} />
        {children}
      </ResourceForm>
    </FormProvider>
  )
}
