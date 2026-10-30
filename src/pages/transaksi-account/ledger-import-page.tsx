import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { Link, useSearchParams } from "react-router-dom"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { ApiTable } from "@/components/data-table/api-table"
import { useTableQuery } from "@/hooks/use-table-query"
import { useLedgerImport } from "@/hooks/use-ledger-import"
import {
  getLedgerImportErrors,
  isImportFinished,
  ledgerError,
  uploadLedger,
  validateLedgerFile,
  type LedgerImportState,
} from "@/utils/api/endpoints/account"
import { routes } from "@/routes"
import { formatNumber } from "@/lib/format"

const statusLabels: Record<LedgerImportState, string> = {
  queued: "Menunggu pemrosesan",
  processing: "Sedang diproses",
  completed: "Selesai",
  completed_with_errors: "Selesai dengan kesalahan",
  failed: "Gagal",
}
function ImportErrors({ importId }: { importId: number }) {
  const fetcher = useCallback(
    (
      params: Parameters<typeof getLedgerImportErrors>[1],
      signal: AbortSignal
    ) => getLedgerImportErrors(importId, params, signal),
    [importId]
  )
  const query = useTableQuery({ fetcher })
  return (
    <ApiTable
      title="Catatan Baris Impor"
      query={query}
      errorText={ledgerError(query.error)}
      columns={[
        { label: "Sheet", render: (row) => row.source_sheet ?? "-" },
        { label: "Baris", render: (row) => row.source_row ?? "-" },
        { label: "Kolom", render: (row) => row.column_name ?? "-" },
        {
          label: "Pesan",
          render: (row) => (
            <p className="max-w-lg min-w-48 whitespace-normal">{row.message}</p>
          ),
        },
        {
          label: "Nilai Sumber",
          render: (row) =>
            row.raw_value ? (
              <details>
                <summary className="cursor-pointer">Lihat nilai</summary>
                <pre className="mt-2 max-w-xs break-all whitespace-pre-wrap">
                  {row.raw_value}
                </pre>
              </details>
            ) : (
              "-"
            ),
        },
      ]}
    />
  )
}
function ImportMonitor({ importId }: { importId: number }) {
  const status = useLedgerImport(importId)
  const data = status.data
  const finished = data && isImportFinished(data.data.status)
  return (
    <>
      <section
        aria-label="Status impor ledger"
        className="space-y-5 rounded-xl border bg-card p-5"
      >
        <div>
          <h2 className="font-semibold">Impor #{importId}</h2>
          {data && (
            <p className="mt-1 text-sm break-all text-muted-foreground">
              {data.data.original_filename}
            </p>
          )}
        </div>
        {status.loading && <p role="status">Memuat status impor…</p>}
        {status.error && (
          <div className="space-y-3">
            <p role="alert">{status.error} Pembaruan otomatis dihentikan.</p>
            <Button variant="outline" onClick={status.retry}>
              Coba lagi status
            </Button>
          </div>
        )}
        {data && (
          <>
            <p role="status" className="font-medium">
              {statusLabels[data.data.status]}
            </p>
            <label htmlFor="ledger-process-progress" className="block text-sm">
              Progres pemrosesan: {Math.floor(data.progress_percent)}%
            </label>
            <progress
              id="ledger-process-progress"
              className="h-3 w-full accent-primary"
              max={100}
              value={data.progress_percent}
            />
            <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              {[
                [
                  "Baris diproses / Total",
                  `${formatNumber(data.data.processed_rows)} / ${formatNumber(data.data.total_rows)}`,
                ],
                ["Baris berhasil", formatNumber(data.data.successful_rows)],
                ["Baris gagal", formatNumber(data.data.failed_rows)],
                [
                  "Bagian diproses / Total",
                  `${data.data.processed_chunks} / ${data.data.total_chunks}`,
                ],
                ["Ledger tersimpan", formatNumber(data.entries_count)],
                ["Catatan baris", formatNumber(data.errors_count)],
                ["Durasi (menit)", data.duration_minutes ?? "-"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="mt-1 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            {data.data.error_message && (
              <p role="alert" className="text-sm break-words text-destructive">
                {data.data.error_message}
              </p>
            )}
            {data.errors_count > 0 && (
              <p className="text-sm text-muted-foreground">
                Catatan baris mencakup kesalahan dan baris duplikat yang
                dilewati.
                {!finished &&
                  " Daftar catatan tersedia setelah pemrosesan selesai."}
              </p>
            )}
          </>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            nativeButton={false}
            render={
              <Link to={`${routes.accounts.path}?import_id=${importId}`} />
            }
          >
            Lihat ledger impor ini
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link to={routes.accounts_create.path} />}
          >
            Impor file lain
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Status dapat dibuka kembali melalui alamat halaman ini. Meninggalkan
          halaman tidak menghentikan pemrosesan yang sudah diterima server.
        </p>
      </section>
      {data && finished && data.errors_count > 0 && (
        <ImportErrors key={importId} importId={importId} />
      )}
    </>
  )
}
export default function LedgerImportPage() {
  const [params, setParams] = useSearchParams()
  const rawId = params.get("import")
  const importId =
    rawId && /^[1-9]\d*$/.test(rawId) && Number.isSafeInteger(Number(rawId))
      ? Number(rawId)
      : null
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadPercent, setUploadPercent] = useState(0)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState<{
    id: number
    duplicate: boolean
    worker?: boolean
  }>()
  const controller = useRef<AbortController | null>(null)
  const [dragging, setDragging] = useState(false)
  useEffect(() => () => controller.current?.abort(), [])
  useEffect(() => {
    if (!uploading) return
    const preventUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
    }
    window.addEventListener("beforeunload", preventUnload)
    return () => window.removeEventListener("beforeunload", preventUnload)
  }, [uploading])
  function selectFiles(files: FileList | File[]) {
    if (controller.current) return
    setFile(null)
    setError("")
    if (files.length !== 1) {
      setError("Pilih tepat satu file Excel.")
      return
    }
    const selected = files[0]
    const message = validateLedgerFile(selected)
    if (message) {
      setError(message)
      return
    }
    setFile(selected)
  }
  async function upload(event: FormEvent) {
    event.preventDefault()
    if (controller.current) return
    if (!file) {
      setError("Pilih file Excel terlebih dahulu.")
      return
    }
    const message = validateLedgerFile(file)
    if (message) {
      setError(message)
      return
    }
    const uploadController = new AbortController()
    controller.current = uploadController
    setUploading(true)
    setUploadPercent(0)
    setError("")
    try {
      const accepted = await uploadLedger(
        file,
        uploadController.signal,
        (progress) => {
          if (uploadController.signal.aborted) return
          setUploadPercent(
            Math.min(
              100,
              Math.floor(
                (progress.loaded / (progress.total ?? file.size)) * 100
              )
            )
          )
        }
      )
      if (uploadController.signal.aborted) return
      setFile(null)
      setNotice({
        id: accepted.id,
        duplicate: accepted.duplicate,
        worker: accepted.worker_triggered,
      })
      setParams({ import: String(accepted.id) }, { replace: true })
    } catch (cause) {
      if (axios.isCancel(cause))
        setError(
          "Unggahan dihentikan. Jika file sudah diterima server, pemrosesan mungkin tetap berjalan. Unggah file yang sama untuk membuka status impor yang sudah ada."
        )
      else
        setError(
          ledgerError(cause) +
            " Jika server sudah menerima file, unggah kembali file yang sama untuk membuka status impor yang sudah tercatat."
        )
    } finally {
      controller.current = null
      setUploading(false)
    }
  }
  if (rawId !== null && importId === null)
    return (
      <section className="space-y-3 rounded-xl border bg-card p-5">
        <p role="alert">ID impor pada alamat halaman tidak valid.</p>
        <Button
          nativeButton={false}
          render={<Link to={routes.accounts_create.path} />}
        >
          Kembali ke unggah file
        </Button>
      </section>
    )
  if (importId)
    return (
      <div className="space-y-5">
        {notice?.id === importId && notice.duplicate && (
          <p role="status" className="rounded-xl border bg-card p-5">
            File identik sudah tercatat. Menampilkan impor #{importId} yang
            sudah ada.
          </p>
        )}
        {notice?.id === importId && notice.worker === false && (
          <p role="status" className="rounded-xl border bg-card p-5">
            File diterima, tetapi pemroses impor tidak berhasil dipicu. Hubungi
            pengelola jika status tetap menunggu pemrosesan.
          </p>
        )}
        <ImportMonitor key={importId} importId={importId} />
      </div>
    )
  return (
    <section className="rounded-xl border bg-card">
      <div className="space-y-2 border-b p-5">
        <h2 className="font-semibold">Import Excel Ledger</h2>
        <p className="text-sm text-muted-foreground">
          Satu file .xlsx atau .xls, maksimal 50 MB. Sheet yang dibaca: OVK
          mulai baris 4, PAKAN.OVD mulai baris 5, dan AYAM mulai baris 4.
        </p>
        <p className="text-sm text-muted-foreground">
          File dikirim ke server untuk diproses bertahap. Progres unggah dan
          pemrosesan ditampilkan terpisah.
        </p>
      </div>
      <form onSubmit={upload} className="space-y-5 p-5">
        <label
          htmlFor="ledger-file"
          onDragOver={(event) => {
            event.preventDefault()
            if (!uploading) setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            if (!uploading) selectFiles(event.dataTransfer.files)
          }}
          className={`flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-5 text-center focus-within:ring-2 focus-within:ring-ring ${dragging ? "border-primary bg-accent" : "border-border"}`}
        >
          <input
            id="ledger-file"
            type="file"
            className="sr-only"
            accept=".xlsx,.xls"
            disabled={uploading}
            aria-describedby="ledger-file-help"
            aria-invalid={Boolean(error)}
            onChange={(event) => {
              if (event.target.files?.length) selectFiles(event.target.files)
              event.target.value = ""
            }}
          />
          <span className="font-medium">
            Pilih file Excel atau tarik file ke sini
          </span>
          <span id="ledger-file-help" className="text-sm text-muted-foreground">
            Format .xlsx / .xls · Maksimal 50 MB
          </span>
        </label>
        {file && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium break-all">{file.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => {
                setFile(null)
                setError("")
              }}
            >
              Hapus file
            </Button>
          </div>
        )}
        {uploading && (
          <div className="space-y-2">
            <label htmlFor="ledger-upload-progress" className="text-sm">
              Progres unggah: {uploadPercent}%
            </label>
            <progress
              id="ledger-upload-progress"
              className="h-3 w-full accent-primary"
              value={uploadPercent}
              max={100}
            />
            {uploadPercent === 100 && (
              <p role="status" className="text-sm">
                Berkas terkirim, menunggu konfirmasi server…
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => controller.current?.abort()}
            >
              Batal unggah
            </Button>
          </div>
        )}
        {error && (
          <p role="alert" className="text-sm break-words text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2 border-t pt-5">
          <Button
            variant="outline"
            nativeButton={false}
            disabled={uploading}
            render={<Link to={routes.accounts.path} />}
          >
            Kembali ke daftar
          </Button>
          <Button type="submit" disabled={uploading}>
            {uploading ? "Mengunggah…" : "Unggah dan proses"}
          </Button>
        </div>
      </form>
    </section>
  )
}
