import { useMemo, useState, type FormEvent } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { useTableQuery } from "@/hooks/use-table-query"
import { ApiTable } from "@/components/data-table/api-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  getInquiryAccount,
  ledgerError,
  type LedgerEntry,
} from "@/utils/api/endpoints/account"
import { formatDate, formatDecimalRupiah } from "@/lib/format"
import { routes } from "@/routes"
import {
  EMPTY_LEDGER_FILTERS,
  LEDGER_SHEETS,
  LEDGER_TYPES,
  ledgerFiltersSchema,
  parseLedgerFilters,
  type LedgerFilters,
} from "./ledger-schema"

export function InquiryAccountPage() {
  const [params, setParams] = useSearchParams()
  const parsed = parseLedgerFilters(params)
  if (!parsed.success)
    return (
      <section className="space-y-3 rounded-xl border bg-card p-5">
        <p role="alert">{parsed.error.issues[0].message}</p>
        <Button onClick={() => setParams({})}>Hapus filter</Button>
      </section>
    )
  return (
    <LedgerInquiry
      key={params.toString()}
      initialFilters={parsed.data}
      onApply={(filters) =>
        setParams(
          Object.fromEntries(
            Object.entries(filters).filter(([, value]) => value !== "")
          )
        )
      }
    />
  )
}
function LedgerInquiry({
  initialFilters,
  onApply,
}: {
  initialFilters: LedgerFilters
  onApply: (filters: LedgerFilters) => void
}) {
  const map = useMemo(
    () => ({ defaultFilters: initialFilters }),
    [initialFilters]
  )
  const query = useTableQuery({ fetcher: getInquiryAccount, map })
  const [filters, setFilters] = useState(initialFilters)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<LedgerEntry | null>(null)
  function apply(event: FormEvent) {
    event.preventDefault()
    const parsed = ledgerFiltersSchema.safeParse(filters)
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }
    setError("")
    query.reset()
    onApply(parsed.data)
  }
  function setFilter(key: keyof LedgerFilters, value: string) {
    setFilters((previous) => ({ ...previous, [key]: value }))
  }
  return (
    <>
      <section className="rounded-xl border bg-card p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Filter Buku Besar</h2>
          <Button
            nativeButton={false}
            render={<Link to={routes.accounts_create.path} />}
          >
            Import Excel
          </Button>
        </div>
        <form onSubmit={apply} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="grid gap-2 text-sm">
              Sheet
              <select
                className="h-10 min-w-0 rounded-lg border bg-background px-3"
                aria-label="Filter sheet"
                value={filters.source_sheet}
                onChange={(event) =>
                  setFilter("source_sheet", event.target.value)
                }
              >
                <option value="">Semua</option>
                {LEDGER_SHEETS.map((sheet) => (
                  <option key={sheet}>{sheet}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              Jenis Transaksi
              <select
                className="h-10 min-w-0 rounded-lg border bg-background px-3"
                aria-label="Filter jenis transaksi"
                value={filters.jenis_transaksi}
                onChange={(event) =>
                  setFilter("jenis_transaksi", event.target.value)
                }
              >
                <option value="">Semua</option>
                {LEDGER_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2 text-sm">
              Kode COA
              <Input
                aria-label="Filter kode COA"
                className="h-10"
                value={filters.coa_code}
                maxLength={100}
                onChange={(event) => setFilter("coa_code", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm">
              Dari Tanggal
              <Input
                aria-label="Dari tanggal"
                className="h-10"
                type="date"
                value={filters.from}
                onChange={(event) => setFilter("from", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm">
              Sampai Tanggal
              <Input
                aria-label="Sampai tanggal"
                className="h-10"
                type="date"
                min={filters.from || undefined}
                value={filters.to}
                onChange={(event) => setFilter("to", event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm">
              ID Impor
              <Input
                aria-label="Filter ID impor"
                className="h-10"
                type="number"
                min={1}
                step={1}
                value={filters.import_id}
                onChange={(event) => setFilter("import_id", event.target.value)}
              />
            </label>
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit">Terapkan filter</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFilters(EMPTY_LEDGER_FILTERS)
                setError("")
                query.reset()
                onApply(EMPTY_LEDGER_FILTERS)
              }}
            >
              Reset filter
            </Button>
          </div>
        </form>
        {initialFilters.import_id && (
          <div className="mt-4 text-sm">
            <Link
              className="text-primary underline"
              to={`${routes.accounts_create.path}?import=${initialFilters.import_id}`}
            >
              Lihat status impor #{initialFilters.import_id}
            </Link>
          </div>
        )}
      </section>
      <ApiTable
        title="Daftar Ledger"
        query={query}
        errorText={ledgerError(query.error)}
        columns={[
          {
            label: "Tanggal",
            render: (row) =>
              row.transaction_date
                ? formatDate(row.transaction_date.slice(0, 10))
                : "-",
          },
          { label: "Sheet", render: (row) => row.source_sheet },
          {
            label: "Nomor Dokumen",
            render: (row) => row.document_number || "-",
          },
          {
            label: "COA",
            render: (row) => `${row.coa_code ?? "-"} · ${row.coa_name ?? "-"}`,
          },
          { label: "Rekanan", render: (row) => row.partner_name || "-" },
          { label: "Jenis Transaksi", render: (row) => row.jenis_transaksi },
          { label: "Debit", render: (row) => formatDecimalRupiah(row.debit) },
          { label: "Kredit", render: (row) => formatDecimalRupiah(row.credit) },
          { label: "Mutasi", render: (row) => formatDecimalRupiah(row.mutasi) },
        ]}
        actions={(row) => (
          <Button
            variant="outline"
            size="sm"
            aria-label={`Detail ledger ${row.id}`}
            onClick={() => setSelected(row)}
          >
            Detail
          </Button>
        )}
      />
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      >
        <DialogContent className="max-h-[85svh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Ledger #{selected?.id}</DialogTitle>
            <DialogDescription>
              Informasi baris dari buku besar hasil impor.
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <dl className="grid gap-4 sm:grid-cols-2">
              {[
                ["ID Impor", selected.import_id],
                ["Nama File", selected.import?.original_filename],
                [
                  "Sheet / Baris Sumber",
                  `${selected.source_sheet} / ${selected.source_row}`,
                ],
                ["Tanggal", selected.transaction_date?.slice(0, 10)],
                ["Nomor Dokumen", selected.document_number],
                ["COA Code", selected.coa_code],
                ["COA Name", selected.coa_name],
                ["Rekanan", selected.partner_name],
                ["Deskripsi", selected.deskripsi_transaksi],
                ["Referensi", selected.reference],
                ["Divisi", selected.division],
                ["Lokasi", selected.location],
                ["Tipe Transaksi", selected.tipe_transaksi],
                ["Tipe Internal", selected.internal_type],
                ["Jenis Rekening", selected.account_type],
                ["Status", selected.status],
                ["Jenis Transaksi", selected.jenis_transaksi],
                ["Debit", formatDecimalRupiah(selected.debit)],
                ["Kredit", formatDecimalRupiah(selected.credit)],
                ["Mutasi", formatDecimalRupiah(selected.mutasi)],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="mt-1 font-medium break-words">
                    {value ?? "-"}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
export default InquiryAccountPage
