import { useRef, useState, type FormEvent } from "react"
import { useLocation } from "react-router-dom"
import { FormField } from "@/components/form-fields"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  downloadFinanceReport,
  previewFinanceReport,
  type FinanceReport,
  type PivotPreview,
  type PivotRows,
  type ReportFilters,
} from "@/utils/api/endpoints/reporting"
import {
  reportCategories,
  reportOptions,
  type ReportCategory,
} from "./report-options"

function PreviewTable({
  title,
  rows,
  amountStart,
}: {
  title: string
  rows: PivotRows
  amountStart: number
}) {
  return (
    <div className="space-y-3">
      <h4 className="font-medium">{title}</h4>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Tidak ada data untuk filter ini.
        </p>
      ) : (
        <div
          className="max-h-96 overflow-auto rounded-md border"
          tabIndex={0}
          role="region"
          aria-label={title}
        >
          <table className="w-full text-sm">
            <caption className="sr-only">{title}</caption>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="border-b last:border-0">
                  {row.map((cell, index) => (
                    <td
                      key={index}
                      className={cn(
                        "px-3 py-2 whitespace-nowrap tabular-nums",
                        typeof cell === "number" &&
                          index >= amountStart &&
                          "text-right",
                        typeof cell === "number" &&
                          index >= amountStart &&
                          cell < 0 &&
                          "text-red-700 dark:text-red-400",
                        typeof cell === "number" &&
                          index >= amountStart &&
                          cell > 0 &&
                          "text-green-700 dark:text-green-400"
                      )}
                    >
                      {typeof cell === "number" && index >= amountStart
                        ? formatNumber(cell)
                        : (cell ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ReportPreview({ data }: { data: PivotPreview }) {
  const tables: {
    title: string
    rows: PivotRows | undefined
    amountStart: number
  }[] = [
    {
      title: data.summary_title ?? "Ringkasan OVK",
      rows: data.summary_rows,
      amountStart: 1,
    },
    {
      title: data.detail_title ?? "Detail OVK",
      rows: data.detail_rows,
      amountStart: 4,
    },
    {
      title: "Mutasi Bulanan per Akun",
      rows: data.pivot1_rows,
      amountStart: 1,
    },
    {
      title: "Mutasi per Bulan, Akun, dan Lokasi Farm",
      rows: data.pivot2_rows,
      amountStart: 3,
    },
    {
      title: "Akun Analitik per Bulan dan Tipe Internal",
      rows: data.pivot3_rows,
      amountStart: 4,
    },
    {
      title: "Rekap Pembelian per Rekanan",
      rows: data.pivot4_rows,
      amountStart: 3,
    },
  ]
  return (
    <div className="space-y-6 border-t pt-5">
      {tables
        .filter((table) => table.rows !== undefined)
        .map((table) => (
          <PreviewTable
            key={table.title}
            title={table.title}
            rows={table.rows!}
            amountStart={table.amountStart}
          />
        ))}
    </div>
  )
}

function ReportForm({ category }: { category: FinanceReport }) {
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [monthFrom, setMonthFrom] = useState("1")
  const [monthTo, setMonthTo] = useState("12")
  const [importId, setImportId] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState<"download" | "preview" | null>(null)
  const [preview, setPreview] = useState<PivotPreview | null>(null)
  const pending = useRef(false)
  const hasPeriod = category !== "chicken"
  const hasImport = category !== "ovk"

  function changeFilter(setter: (value: string) => void, value: string) {
    setter(value)
    setPreview(null)
    setError("")
  }

  async function generate(action: "download" | "preview") {
    if (pending.current) return
    const filters: ReportFilters = {}
    if (hasPeriod) {
      if (
        (year !== "" &&
          (!/^\d{4}$/.test(year) ||
            Number(year) < 2000 ||
            Number(year) > 2100)) ||
        (category === "ovk" && year === "")
      ) {
        setError("Tahun harus antara 2000 dan 2100.")
        return
      }
      if (
        ![monthFrom, monthTo].every(
          (value) =>
            /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 12
        ) ||
        Number(monthFrom) > Number(monthTo)
      ) {
        setError(
          "Bulan harus antara 1 dan 12. Bulan awal tidak boleh melebihi bulan akhir."
        )
        return
      }
      if (year) filters.year = Number(year)
      filters.month_from = Number(monthFrom)
      filters.month_to = Number(monthTo)
    }
    if (hasImport && importId) {
      if (
        !/^[1-9]\d*$/.test(importId) ||
        !Number.isSafeInteger(Number(importId))
      ) {
        setError("ID import harus berupa bilangan bulat positif.")
        return
      }
      filters.import_id = Number(importId)
    }
    pending.current = true
    setBusy(action)
    setError("")
    setPreview(null)
    try {
      if (action === "preview" && category !== "chicken") {
        const result = await previewFinanceReport(category, filters)
        if (!result.success) throw new Error("Preview gagal dimuat.")
        setPreview(result.data)
      } else {
        await downloadFinanceReport(category, filters)
      }
    } catch {
      setError(
        action === "preview"
          ? "Preview gagal dimuat. Periksa filter atau coba lagi."
          : "Unduhan gagal. Periksa filter atau coba lagi."
      )
    } finally {
      pending.current = false
      setBusy(null)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    void generate("download")
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-6 p-5 md:p-6"
      aria-busy={busy !== null}
    >
      <div>
        <h3 className="text-lg font-semibold">
          Laporan {reportOptions[category].label}
        </h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {category === "chicken"
            ? "Laporan pivot Ayam mencakup seluruh periode dalam data import yang dipilih."
            : "Pilih tahun dan rentang bulan untuk laporan pivot."}
        </p>
      </div>
      <fieldset disabled={busy !== null} className="grid gap-5 md:grid-cols-2">
        <legend className="sr-only">Filter laporan</legend>
        {hasPeriod && (
          <>
            <FormField
              id={`${category}-year`}
              label="Tahun"
              required={category === "ovk"}
              help={
                category === "feed"
                  ? "Kosongkan untuk seluruh tahun."
                  : undefined
              }
            >
              <Input
                id={`${category}-year`}
                type="number"
                min={2000}
                max={2100}
                step={1}
                required={category === "ovk"}
                value={year}
                onChange={(event) => changeFilter(setYear, event.target.value)}
                aria-describedby={
                  category === "feed" ? `${category}-year-help` : undefined
                }
              />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField id={`${category}-from`} label="Bulan Awal" required>
                <Input
                  id={`${category}-from`}
                  type="number"
                  min={1}
                  max={12}
                  step={1}
                  required
                  value={monthFrom}
                  onChange={(event) =>
                    changeFilter(setMonthFrom, event.target.value)
                  }
                />
              </FormField>
              <FormField id={`${category}-to`} label="Bulan Akhir" required>
                <Input
                  id={`${category}-to`}
                  type="number"
                  min={1}
                  max={12}
                  step={1}
                  required
                  value={monthTo}
                  onChange={(event) =>
                    changeFilter(setMonthTo, event.target.value)
                  }
                />
              </FormField>
            </div>
          </>
        )}
        {hasImport && (
          <FormField
            id={`${category}-import`}
            label="ID Import"
            help="Opsional. Kosongkan untuk seluruh import."
          >
            <Input
              id={`${category}-import`}
              type="number"
              min={1}
              step={1}
              value={importId}
              onChange={(event) =>
                changeFilter(setImportId, event.target.value)
              }
              aria-describedby={`${category}-import-help`}
            />
          </FormField>
        )}
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-col items-start justify-between gap-4 border-t pt-5 sm:flex-row sm:items-center">
        <p className="text-sm text-muted-foreground" role="status">
          {busy
            ? busy === "preview"
              ? "Memuat preview…"
              : "Menyiapkan unduhan…"
            : "Format keluaran: Excel (.xlsx)"}
        </p>
        <div className="flex flex-wrap gap-3">
          {hasPeriod && (
            <Button
              type="button"
              variant="outline"
              disabled={busy !== null}
              onClick={() => void generate("preview")}
            >
              Preview Laporan
            </Button>
          )}
          <Button type="submit" disabled={busy !== null}>
            Download Report (Excel)
          </Button>
        </div>
      </div>
      {preview && <ReportPreview data={preview} />}
    </form>
  )
}

export function ReportingPage() {
  const { pathname } = useLocation()
  const initialCategory: ReportCategory = pathname.endsWith("/ayam")
    ? "chicken"
    : pathname.endsWith("/pakan")
      ? "feed"
      : pathname.endsWith("/ovk")
        ? "ovk"
        : "ledger"
  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="border-b p-5 md:px-6">
        <h2 className="font-semibold">Pusat Laporan</h2>
      </div>
      <Tabs key={pathname} defaultValue={initialCategory} className="gap-0">
        <div className="overflow-x-auto border-b px-5 py-3 md:px-6">
          <TabsList
            aria-label="Kategori laporan"
            className="min-w-max gap-1 rounded-full"
          >
            {reportCategories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="rounded-full px-4"
              >
                {reportOptions[category].label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {reportCategories.map((category) => (
          <TabsContent key={category} value={category} keepMounted>
            {category === "ledger" ? (
              <div className="space-y-2 p-5 md:p-6">
                <h3 className="text-lg font-semibold">Laporan Buku Besar</h3>
                <p className="text-sm text-muted-foreground">
                  Laporan Buku Besar belum tersedia.
                </p>
              </div>
            ) : (
              <ReportForm category={category} />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}
export default ReportingPage
