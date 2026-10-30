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
  masterAyamApi,
  type MasterAyam,
} from "@/utils/api/endpoints/master-data"
import { routes } from "@/routes"
import { chickenPhaseSchema, type ChickenPhaseForm } from "./master-data-schema"
import {
  ResourceDetail,
  ResourceEdit,
  ResourceForm,
  ResourceList,
} from "@/components/api-record"

const listPath = routes.master_chicken.path
export function MasterChickenPage() {
  return (
    <ResourceList
      renderFilters={(table) => (
        <ActiveStatusFilter
          value={String(table.filters.is_active ?? "")}
          onChange={(value) => table.setFilter("is_active", value)}
        />
      )}
      title="Daftar Master Ayam"
      api={masterAyamApi}
      createPath={routes.master_chicken_create.path}
      detailPath={routes.master_chicken_detail.path}
      editPath={routes.master_chicken_edit.path}
      rowLabel={(row) => row.nama_fase}
      searchPlaceholder="Cari kode atau nama fase…"
      columns={[
        { label: "Kode Fase", render: (row) => row.kode_fase },
        { label: "Nama Fase", render: (row) => row.nama_fase },
        {
          label: "Default Umur Deplesi",
          render: (row) => row.default_umur_deplesi,
        },
        { label: "COA Persediaan", render: (row) => row.coa_persediaan || "-" },
        {
          label: "Status",
          render: (row) => <ActiveStatus active={row.is_active} />,
        },
      ]}
    />
  )
}
function ChickenForm({ initial }: { initial?: MasterAyam }) {
  const form = useForm<ChickenPhaseForm>({
    resolver: zodResolver(chickenPhaseSchema),
    mode: "onTouched",
    defaultValues: initial ?? {
      kode_fase: "",
      nama_fase: "",
      default_umur_deplesi: 0,
      coa_persediaan: null,
      is_active: true,
    },
  })
  const { errors } = form.formState
  return (
    <ResourceForm
      title={initial ? "Ubah Master Ayam" : "Tambah Master Ayam"}
      backTo={listPath}
      api={masterAyamApi}
      initial={initial}
      form={form}
    >
      <FormField
        id="kode_fase"
        label="Kode Fase"
        required
        error={errors.kode_fase?.message}
      >
        <Input
          id="kode_fase"
          className="h-10"
          maxLength={30}
          aria-invalid={Boolean(errors.kode_fase)}
          aria-describedby={errors.kode_fase ? "kode_fase-error" : undefined}
          {...form.register("kode_fase")}
        />
      </FormField>
      <FormField
        id="nama_fase"
        label="Nama Fase"
        required
        error={errors.nama_fase?.message}
      >
        <Input
          id="nama_fase"
          className="h-10"
          maxLength={150}
          aria-invalid={Boolean(errors.nama_fase)}
          aria-describedby={errors.nama_fase ? "nama_fase-error" : undefined}
          {...form.register("nama_fase")}
        />
      </FormField>
      <FormField
        id="default_umur_deplesi"
        label="Default Umur Deplesi"
        required
        error={errors.default_umur_deplesi?.message}
      >
        <Input
          id="default_umur_deplesi"
          className="h-10"
          type="number"
          min={0}
          step={1}
          aria-invalid={Boolean(errors.default_umur_deplesi)}
          aria-describedby={
            errors.default_umur_deplesi
              ? "default_umur_deplesi-error"
              : undefined
          }
          {...form.register("default_umur_deplesi", { valueAsNumber: true })}
        />
      </FormField>
      <FormField
        id="coa_persediaan"
        label="COA Persediaan"
        error={errors.coa_persediaan?.message}
        help="Opsional. Isi kode COA persediaan jika tersedia."
      >
        <Controller
          control={form.control}
          name="coa_persediaan"
          render={({ field }) => (
            <Input
              {...field}
              id="coa_persediaan"
              className="h-10"
              maxLength={50}
              value={field.value ?? ""}
              onChange={(event) =>
                field.onChange(
                  event.target.value.trim() ? event.target.value : null
                )
              }
              aria-invalid={Boolean(errors.coa_persediaan)}
              aria-describedby={`coa_persediaan-help${errors.coa_persediaan ? " coa_persediaan-error" : ""}`}
            />
          )}
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
export function MasterChickenCreatePage() {
  return <ChickenForm />
}
export function MasterChickenDetailPage() {
  const { id = "" } = useParams()
  const load = useCallback(
    (signal: AbortSignal) => masterAyamApi.get(id, signal),
    [id]
  )
  return (
    <ResourceDetail
      backTo={listPath}
      load={load}
      title={(row) => row.nama_fase}
      fields={(row) => [
        { label: "ID", value: row.id },
        { label: "Kode Fase", value: row.kode_fase },
        { label: "Nama Fase", value: row.nama_fase },
        { label: "Default Umur Deplesi", value: row.default_umur_deplesi },
        { label: "COA Persediaan", value: row.coa_persediaan || "-" },
        { label: "Status", value: <ActiveStatus active={row.is_active} /> },
      ]}
    />
  )
}

export function MasterChickenEditPage() {
  const { id = "" } = useParams()
  const load = useCallback(
    (signal: AbortSignal) => masterAyamApi.get(id, signal),
    [id]
  )
  return (
    <ResourceEdit
      backTo={listPath}
      load={load}
      renderForm={(row) => <ChickenForm initial={row} />}
    />
  )
}
