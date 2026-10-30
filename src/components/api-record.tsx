import { useEffect, useRef, useState, type ReactNode } from "react"
import { Link, generatePath, useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import type { FieldValues, Path, UseFormReturn } from "react-hook-form"
import { toast } from "sonner"
import type { TableQueryMap } from "@/utils/api/query"
import type { UseTableQueryResult } from "@/hooks/use-table-query"
import { useTableQuery } from "@/hooks/use-table-query"
import { extractMessage } from "@/utils/api/http"
import type { ResourceApi } from "@/utils/api/resource"
import { SearchInput } from "@/components/data-table/search-input"

import { Button } from "@/components/ui/button"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function resourceError(error: unknown) {
  if (axios.isAxiosError(error))
    return error.response
      ? extractMessage(error)
      : "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi."
  return "Terjadi kesalahan. Silakan coba lagi."
}

export function useResourceLoad<T>(load: (signal: AbortSignal) => Promise<T>) {
  const [result, setResult] = useState<{
    data?: T
    error?: unknown
    loading: boolean
  }>({ loading: true })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setResult({ data, loading: false })
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setResult({ error, loading: false })
      }
    )
    return () => controller.abort()
  }, [load, attempt])
  return {
    ...result,
    retry: () => {
      setResult({ loading: true })
      setAttempt((value) => value + 1)
    },
  }
}

export function ResourceLoadState({
  loading,
  error,
  retry,
}: {
  loading: boolean
  error?: unknown
  retry: () => void
}) {
  if (loading)
    return (
      <p role="status" className="rounded-xl border bg-card p-6">
        Memuat data…
      </p>
    )
  const missing = axios.isAxiosError(error) && error.response?.status === 404
  return (
    <div className="space-y-3 rounded-xl border bg-card p-6">
      <p role="alert">
        {missing ? "Data tidak ditemukan." : resourceError(error)}
      </p>
      {!missing && (
        <Button variant="outline" onClick={retry}>
          Coba lagi
        </Button>
      )}
    </div>
  )
}

type Column<T> = { label: string; render: (row: T) => ReactNode }
export function ResourceList<T, R extends { id: number }>({
  title,
  api,
  columns,
  createPath,
  detailPath,
  editPath,
  rowLabel,
  searchPlaceholder,
  queryMap,
  renderFilters,
}: {
  title: string
  api: ResourceApi<T, R>
  columns: Column<R>[]
  createPath: string
  detailPath: string
  editPath: string
  rowLabel: (row: R) => string
  searchPlaceholder?: string
  queryMap?: TableQueryMap
  renderFilters?: (table: UseTableQueryResult<R>) => ReactNode
}) {
  const table = useTableQuery({ fetcher: api.list, map: queryMap })
  const [selected, setSelected] = useState<R | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const pending = useRef(false)
  async function remove() {
    if (!selected || pending.current) return
    pending.current = true
    setDeleting(true)
    setDeleteError("")
    try {
      await api.remove(selected.id)
      toast.success("Data berhasil dihapus.")
      setSelected(null)
      if (table.rows.length === 1 && table.page > 1)
        table.setPage(table.page - 1)
      else table.refetch()
    } catch (cause) {
      setDeleteError(resourceError(cause))
    } finally {
      pending.current = false
      setDeleting(false)
    }
  }
  return (
    <section
      aria-label={title}
      className="overflow-hidden rounded-xl border bg-card"
    >
      <div className="flex flex-col gap-4 border-b p-5 md:p-6">
        <h2 className="font-semibold">{title}</h2>
        <div className="flex flex-wrap items-center gap-3">
          {searchPlaceholder && (
            <SearchInput
              value={table.search}
              onChange={table.setSearch}
              placeholder={searchPlaceholder}
              isBusy={table.isFetching}
            />
          )}
          {renderFilters?.(table)}
          <Button
            nativeButton={false}
            render={<Link to={createPath} />}
            className="sm:ml-auto"
          >
            Tambah
          </Button>
        </div>
      </div>
      {table.error && !table.isFetching ? (
        <ResourceLoadState
          loading={false}
          error={table.error}
          retry={table.refetch}
        />
      ) : (
        <>
          <Table aria-busy={table.isFetching}>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.label}>{column.label}</TableHead>
                ))}
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {table.rows.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((column) => (
                    <TableCell key={column.label}>
                      {column.render(row)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        nativeButton={false}
                        render={
                          <Link
                            to={generatePath(detailPath, {
                              id: String(row.id),
                            })}
                            aria-label={`Lihat detail ${rowLabel(row)}`}
                          />
                        }
                      >
                        Detail
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        nativeButton={false}
                        render={
                          <Link
                            to={generatePath(editPath, { id: String(row.id) })}
                            aria-label={`Ubah ${rowLabel(row)}`}
                          />
                        }
                      >
                        Ubah
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        aria-label={`Hapus ${rowLabel(row)}`}
                        disabled={deleting}
                        onClick={() => {
                          setDeleteError("")
                          setSelected(row)
                        }}
                      >
                        Hapus
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {table.isFetching ? (
            <p role="status" className="p-6 text-sm">
              Memuat data…
            </p>
          ) : (
            table.rows.length === 0 && (
              <p role="status" className="p-6 text-sm text-muted-foreground">
                Tidak ada data yang sesuai.
              </p>
            )
          )}
        </>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t p-5 text-sm">
        <p aria-live="polite">
          {table.totalItems} data · Halaman {table.page} dari{" "}
          {Math.max(1, table.totalPages)}
        </p>
        <label className="flex items-center gap-2">
          Per halaman
          <select
            className="h-10 rounded-lg border bg-background px-2"
            aria-label="Jumlah data per halaman"
            value={table.pageSize}
            onChange={(event) => table.setPageSize(Number(event.target.value))}
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size}>{size}</option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={table.isFetching || table.page <= 1}
            onClick={() => table.setPage(table.page - 1)}
          >
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            disabled={table.isFetching || table.page >= table.totalPages}
            onClick={() => table.setPage(table.page + 1)}
          >
            Berikutnya
          </Button>
        </div>
      </div>
      <AlertDialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open && !pending.current) setSelected(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Hapus {selected ? rowLabel(selected) : "data"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Data yang dihapus tidak dapat dikembalikan. Server akan menolak
              penghapusan jika data masih digunakan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p role="alert" className="text-sm text-destructive">
              {deleteError}
            </p>
          )}
          <AlertDialogFooter>
            <Button
              variant="outline"
              disabled={deleting}
              onClick={() => setSelected(null)}
            >
              Batal
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={remove}>
              {deleting ? "Menghapus…" : "Ya, hapus"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

export function ResourceForm<T extends FieldValues, R extends { id: number }>({
  title,
  backTo,
  form,
  api,
  initial,
  children,
  disabled = false,
  notice,
}: {
  title: string
  backTo: string
  form: UseFormReturn<T>
  api: ResourceApi<T, R>
  initial?: R
  children: ReactNode
  disabled?: boolean
  notice?: ReactNode
}) {
  const navigate = useNavigate()
  const pending = useRef(false)
  const [error, setError] = useState("")
  async function save(values: T) {
    if (pending.current) return
    pending.current = true
    setError("")
    try {
      await api.save(values, initial?.id)
      toast.success(
        initial ? "Perubahan berhasil disimpan." : "Data berhasil ditambahkan."
      )
      navigate(backTo)
    } catch (cause) {
      setError(resourceError(cause))
      if (axios.isAxiosError(cause) && cause.response?.status === 422) {
        const errors = cause.response.data?.errors as
          Record<string, string[]> | undefined
        for (const [name, messages] of Object.entries(errors ?? {})) {
          if (
            name in values &&
            Array.isArray(messages) &&
            typeof messages[0] === "string"
          ) {
            form.setError(name as Path<T>, {
              type: "server",
              message: messages[0],
            })
          }
        }
      }
    } finally {
      pending.current = false
    }
  }
  return (
    <section className="rounded-xl border bg-card">
      <div className="border-b p-5 md:p-6">
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Kolom bertanda * wajib diisi.
        </p>
      </div>
      <form
        noValidate
        onSubmit={(event) => {
          void form.handleSubmit(save)(event)
        }}
        aria-busy={form.formState.isSubmitting}
        className="p-5 md:p-6"
      >
        {notice}
        <fieldset
          disabled={form.formState.isSubmitting || disabled}
          className="grid min-w-0 gap-5 sm:grid-cols-2"
        >
          {children}
        </fieldset>
        {error && (
          <p role="alert" className="mt-5 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="mt-7 flex justify-end gap-2 border-t pt-5">
          <Button
            variant="outline"
            disabled={form.formState.isSubmitting}
            nativeButton={false}
            render={<Link to={backTo} />}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || disabled}
          >
            {form.formState.isSubmitting ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </form>
    </section>
  )
}

export function ResourceEdit<R>({
  backTo,
  load,
  renderForm,
}: {
  backTo: string
  load: (signal: AbortSignal) => Promise<R>
  renderForm: (row: R) => ReactNode
}) {
  return (
    <MasterRecordPage backTo={backTo} load={load}>
      {renderForm}
    </MasterRecordPage>
  )
}

export function ResourceDetail<R>({
  backTo,
  load,
  title,
  fields,
}: {
  backTo: string
  load: (signal: AbortSignal) => Promise<R>
  title: (row: R) => string
  fields: (row: R) => { label: string; value: ReactNode }[]
}) {
  return (
    <MasterRecordPage backTo={backTo} load={load}>
      {(row) => (
        <section className="rounded-xl border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
            <h2 className="font-semibold">{title(row)}</h2>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link to={backTo} />}
            >
              Kembali ke daftar
            </Button>
          </div>
          <dl className="grid gap-5 p-5 sm:grid-cols-2">
            {fields(row).map((field) => (
              <div key={field.label} className="min-w-0">
                <dt className="text-sm text-muted-foreground">{field.label}</dt>
                <dd className="mt-1 text-sm font-medium break-words">
                  {field.value ?? "-"}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </MasterRecordPage>
  )
}

function MasterRecordPage<R>({
  backTo,
  load,
  children,
}: {
  backTo: string
  load: (signal: AbortSignal) => Promise<R>
  children: (row: R) => ReactNode
}) {
  const { id } = useParams()
  return (
    <LoadedMasterRecord key={id} backTo={backTo} load={load}>
      {children}
    </LoadedMasterRecord>
  )
}
function LoadedMasterRecord<R>({
  backTo,
  load,
  children,
}: {
  backTo: string
  load: (signal: AbortSignal) => Promise<R>
  children: (row: R) => ReactNode
}) {
  const result = useResourceLoad(load)
  if (!result.data)
    return (
      <>
        <ResourceLoadState {...result} />
        <Button
          className="mt-3"
          variant="outline"
          nativeButton={false}
          render={<Link to={backTo} />}
        >
          Kembali ke daftar
        </Button>
      </>
    )
  return children(result.data)
}
