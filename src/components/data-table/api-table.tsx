import type { ReactNode } from "react"
import type { UseTableQueryResult } from "@/hooks/use-table-query"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function ApiTable<T extends { id: number }>({
  title,
  query,
  columns,
  errorText,
  actions,
}: {
  title: string
  query: UseTableQueryResult<T>
  columns: { label: string; render: (row: T) => ReactNode }[]
  errorText: string
  actions?: (row: T) => ReactNode
}) {
  return (
    <section
      aria-label={title}
      className="overflow-hidden rounded-xl border bg-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
        <h2 className="font-semibold">{title}</h2>
        <Button
          variant="outline"
          disabled={query.isFetching}
          onClick={query.refetch}
        >
          Muat ulang
        </Button>
      </div>
      {query.error && !query.isFetching ? (
        <div className="space-y-3 p-5">
          <p role="alert">{errorText}</p>
          <Button variant="outline" onClick={query.refetch}>
            Coba lagi
          </Button>
        </div>
      ) : (
        <>
          <Table aria-busy={query.isFetching}>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.label}>{column.label}</TableHead>
                ))}
                {actions && <TableHead>Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {query.rows.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((column) => (
                    <TableCell key={column.label}>
                      {column.render(row)}
                    </TableCell>
                  ))}
                  {actions && <TableCell>{actions(row)}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {query.isFetching ? (
            <p role="status" className="p-5 text-sm">
              Memuat data…
            </p>
          ) : (
            query.rows.length === 0 && (
              <p role="status" className="p-5 text-sm text-muted-foreground">
                Tidak ada data yang sesuai.
              </p>
            )
          )}
        </>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t p-5 text-sm">
        <p aria-live="polite">
          {query.totalItems} data · Halaman {query.page} dari{" "}
          {Math.max(1, query.totalPages)}
        </p>
        <label className="flex items-center gap-2">
          Per halaman
          <select
            aria-label="Jumlah data per halaman"
            className="h-10 rounded-lg border bg-background px-2"
            value={query.pageSize}
            onChange={(event) => query.setPageSize(Number(event.target.value))}
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size}>{size}</option>
            ))}
          </select>
        </label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={query.isFetching || query.page <= 1}
            onClick={() => query.setPage(query.page - 1)}
          >
            Sebelumnya
          </Button>
          <Button
            variant="outline"
            disabled={query.isFetching || query.page >= query.totalPages}
            onClick={() => query.setPage(query.page + 1)}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </section>
  )
}
