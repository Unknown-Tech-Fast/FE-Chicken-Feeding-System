import {
  ActiveField,
  ActiveStatusFilter,
} from "@/components/active-status-field"
import { useCallback } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useParams } from "react-router-dom"
import { FormField } from "@/components/form-fields"
import { Input } from "@/components/ui/input"
import { ActiveStatus } from "@/components/record-detail"
import {
  masterLokasiApi,
  type MasterLokasi,
} from "@/utils/api/endpoints/master-data"
import { routes } from "@/routes"
import { regionSchema, type RegionForm } from "./master-data-schema"
import {
  ResourceDetail,
  ResourceEdit,
  ResourceForm,
  ResourceList,
} from "@/components/api-record"

const listPath = routes.master_region.path
export function MasterRegionPage() {
  return (
    <ResourceList
      renderFilters={(table) => (
        <ActiveStatusFilter
          value={String(table.filters.is_active ?? "")}
          onChange={(value) => table.setFilter("is_active", value)}
        />
      )}
      title="Daftar Master Wilayah"
      api={masterLokasiApi}
      createPath={routes.master_region_create.path}
      detailPath={routes.master_region_detail.path}
      editPath={routes.master_region_edit.path}
      rowLabel={(row) => row.nama_lokasi}
      searchPlaceholder="Cari kode atau nama wilayah…"
      columns={[
        { label: "Kode Lokasi", render: (row) => row.kode_lokasi },
        { label: "Nama Lokasi", render: (row) => row.nama_lokasi },
        { label: "Jumlah Kandang", render: (row) => row.kandang_count ?? 0 },
        {
          label: "Status",
          render: (row) => <ActiveStatus active={row.is_active} />,
        },
      ]}
    />
  )
}
function RegionForm({ initial }: { initial?: MasterLokasi }) {
  const form = useForm<RegionForm>({
    resolver: zodResolver(regionSchema),
    mode: "onTouched",
    defaultValues: initial ?? {
      kode_lokasi: "",
      nama_lokasi: "",
      is_active: true,
    },
  })
  const { errors } = form.formState
  return (
    <ResourceForm
      title={initial ? "Ubah Master Wilayah" : "Tambah Master Wilayah"}
      backTo={listPath}
      api={masterLokasiApi}
      initial={initial}
      form={form}
    >
      <FormField
        id="kode_lokasi"
        label="Kode Lokasi"
        required
        error={errors.kode_lokasi?.message}
      >
        <Input
          id="kode_lokasi"
          className="h-10"
          maxLength={50}
          aria-invalid={Boolean(errors.kode_lokasi)}
          aria-describedby={
            errors.kode_lokasi ? "kode_lokasi-error" : undefined
          }
          {...form.register("kode_lokasi")}
        />
      </FormField>
      <FormField
        id="nama_lokasi"
        label="Nama Lokasi"
        required
        error={errors.nama_lokasi?.message}
      >
        <Input
          id="nama_lokasi"
          className="h-10"
          maxLength={255}
          aria-invalid={Boolean(errors.nama_lokasi)}
          aria-describedby={
            errors.nama_lokasi ? "nama_lokasi-error" : undefined
          }
          {...form.register("nama_lokasi")}
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
export function MasterRegionCreatePage() {
  return <RegionForm />
}
export function MasterRegionDetailPage() {
  const { id = "" } = useParams()
  const load = useCallback(
    (signal: AbortSignal) => masterLokasiApi.get(id, signal),
    [id]
  )
  return (
    <ResourceDetail
      backTo={listPath}
      load={load}
      title={(row) => row.nama_lokasi}
      fields={(row) => [
        { label: "ID", value: row.id },
        { label: "Kode Lokasi", value: row.kode_lokasi },
        { label: "Nama Lokasi", value: row.nama_lokasi },
        { label: "Jumlah Kandang", value: row.kandang_count ?? 0 },
        { label: "Status", value: <ActiveStatus active={row.is_active} /> },
      ]}
    />
  )
}

export function MasterRegionEditPage() {
  const { id = "" } = useParams()
  const load = useCallback(
    (signal: AbortSignal) => masterLokasiApi.get(id, signal),
    [id]
  )
  return (
    <ResourceEdit
      backTo={listPath}
      load={load}
      renderForm={(row) => <RegionForm initial={row} />}
    />
  )
}
