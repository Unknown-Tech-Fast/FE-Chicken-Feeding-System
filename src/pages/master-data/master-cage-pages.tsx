import {
  ActiveField,
  ActiveStatusFilter,
} from "@/components/active-status-field"
import { useCallback } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useParams } from "react-router-dom"
import { FormField, SelectInput } from "@/components/form-fields"
import { Input } from "@/components/ui/input"
import { ActiveStatus } from "@/components/record-detail"
import {
  getMasterLokasiOptions,
  masterKandangApi,
  type MasterKandang,
} from "@/utils/api/endpoints/master-data"
import { routes } from "@/routes"
import { cageSchema, type CageForm } from "./master-data-schema"
import {
  ResourceDetail,
  ResourceEdit,
  ResourceForm,
  ResourceList,
  ResourceLoadState,
  useResourceLoad,
} from "@/components/api-record"

const listPath = routes.master_cage.path
export function MasterCagePage() {
  return (
    <ResourceList
      renderFilters={(table) => (
        <ActiveStatusFilter
          value={String(table.filters.is_active ?? "")}
          onChange={(value) => table.setFilter("is_active", value)}
        />
      )}
      title="Daftar Master Kandang"
      api={masterKandangApi}
      createPath={routes.master_cage_create.path}
      detailPath={routes.master_cage_detail.path}
      editPath={routes.master_cage_edit.path}
      rowLabel={(row) => row.kode_kandang}
      searchPlaceholder="Cari kode kandang…"
      columns={[
        {
          label: "Wilayah/Lokasi",
          render: (row) =>
            row.lokasi
              ? `${row.lokasi.kode_lokasi} · ${row.lokasi.nama_lokasi}`
              : `Lokasi #${row.lokasi_id}`,
        },
        { label: "Kode Kandang", render: (row) => row.kode_kandang },
        { label: "Kapasitas (ekor)", render: (row) => row.kapasitas ?? "-" },
        {
          label: "Status",
          render: (row) => <ActiveStatus active={row.is_active} />,
        },
      ]}
    />
  )
}
function CageForm({ initial }: { initial?: MasterKandang }) {
  const locations = useResourceLoad(getMasterLokasiOptions)
  const form = useForm<CageForm>({
    resolver: zodResolver(cageSchema),
    mode: "onTouched",
    defaultValues: initial
      ? { ...initial, kapasitas: initial.kapasitas ?? undefined }
      : { lokasi_id: 0, kode_kandang: "", kapasitas: 0, is_active: true },
  })
  const { errors } = form.formState
  return (
    <ResourceForm
      title={initial ? "Ubah Master Kandang" : "Tambah Master Kandang"}
      backTo={listPath}
      api={masterKandangApi}
      initial={initial}
      form={form}
      disabled={!locations.data?.length}
      notice={
        locations.loading || locations.error || locations.data?.length === 0 ? (
          <div className="mb-5 space-y-3">
            {locations.loading || locations.error ? (
              <ResourceLoadState {...locations} />
            ) : locations.data?.length === 0 ? (
              <p role="status" className="text-sm">
                Belum ada wilayah.{" "}
                <Link
                  className="text-primary underline"
                  to={routes.master_region_create.path}
                >
                  Tambah wilayah terlebih dahulu
                </Link>
                .
              </p>
            ) : null}
          </div>
        ) : null
      }
    >
      <FormField
        id="lokasi_id"
        label="Wilayah/Lokasi"
        required
        error={errors.lokasi_id?.message}
      >
        <Controller
          control={form.control}
          name="lokasi_id"
          render={({ field }) => (
            <SelectInput
              id="lokasi_id"
              value={field.value ? String(field.value) : ""}
              onChange={(value) => field.onChange(Number(value))}
              onBlur={field.onBlur}
              required
              invalid={Boolean(errors.lokasi_id)}
              options={(locations.data ?? []).map((row) => ({
                value: String(row.id),
                label: `${row.kode_lokasi} · ${row.nama_lokasi}${row.is_active ? "" : " (Tidak aktif)"}`,
              }))}
            />
          )}
        />
      </FormField>
      <FormField
        id="kode_kandang"
        label="Kode Kandang"
        required
        error={errors.kode_kandang?.message}
      >
        <Input
          id="kode_kandang"
          className="h-10"
          maxLength={50}
          aria-invalid={Boolean(errors.kode_kandang)}
          aria-describedby={
            errors.kode_kandang ? "kode_kandang-error" : undefined
          }
          {...form.register("kode_kandang")}
        />
      </FormField>
      <FormField
        id="kapasitas"
        label="Kapasitas (ekor)"
        required
        error={errors.kapasitas?.message}
      >
        <Input
          id="kapasitas"
          className="h-10"
          type="number"
          min={0}
          step={1}
          aria-invalid={Boolean(errors.kapasitas)}
          aria-describedby={errors.kapasitas ? "kapasitas-error" : undefined}
          {...form.register("kapasitas", { valueAsNumber: true })}
        />
      </FormField>
      <Controller
        control={form.control}
        name="is_active"
        render={({ field }) => (
          <ActiveField
            checked={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />
    </ResourceForm>
  )
}
export function MasterCageCreatePage() {
  return <CageForm />
}
export function MasterCageDetailPage() {
  const { id = "" } = useParams()
  const load = useCallback(
    (signal: AbortSignal) => masterKandangApi.get(id, signal),
    [id]
  )
  return (
    <ResourceDetail
      backTo={listPath}
      load={load}
      title={(row) => row.kode_kandang}
      fields={(row) => [
        { label: "ID", value: row.id },
        { label: "Kode Kandang", value: row.kode_kandang },
        {
          label: "Wilayah/Lokasi",
          value: row.lokasi
            ? `${row.lokasi.kode_lokasi} · ${row.lokasi.nama_lokasi}`
            : `Lokasi #${row.lokasi_id}`,
        },
        { label: "Kapasitas (ekor)", value: row.kapasitas ?? "-" },
        { label: "Status", value: <ActiveStatus active={row.is_active} /> },
      ]}
    />
  )
}

export function MasterCageEditPage() {
  const { id = "" } = useParams()
  const load = useCallback(
    (signal: AbortSignal) => masterKandangApi.get(id, signal),
    [id]
  )
  return (
    <ResourceEdit
      backTo={listPath}
      load={load}
      renderForm={(row) => <CageForm initial={row} />}
    />
  )
}
