import axios, { type AxiosProgressEvent } from "axios"
import { z } from "zod"
import { request, extractMessage } from "../http"
import { apiPath } from "../endpoints"
import { normalizePaginated } from "../pagination"
import type { QueryParams } from "../types"

export const LEDGER_UPLOAD_MAX_BYTES = 51200 * 1024
export type LedgerEntry = {
  id: number
  import_id: number
  source_sheet: string
  source_row: number
  month_number: number | null
  tipe_transaksi: string | null
  division: string | null
  location: string | null
  status: string | null
  internal_type: string | null
  account_type: string | null
  coa_code: string | null
  coa_name: string | null
  partner_name: string | null
  deskripsi_transaksi: string | null
  reference: string | null
  document_number: string | null
  transaction_date: string | null
  debit: string
  credit: string
  jenis_transaksi: string
  mutasi: string
  source_payload?: Record<string, unknown>
  import?: { id: number; original_filename: string } | null
}
export type LedgerImportError = {
  id: number
  source_sheet: string | null
  source_row: number | null
  column_name: string | null
  raw_value: string | null
  message: string
}
const stateSchema = z.enum([
  "queued",
  "processing",
  "completed",
  "completed_with_errors",
  "failed",
])
export type LedgerImportState = z.infer<typeof stateSchema>
const count = z.number().int().nonnegative()
const statusSchema = z.object({
  data: z.object({
    id: z.number().int().positive(),
    original_filename: z.string(),
    status: stateSchema,
    total_rows: count,
    processed_rows: count,
    successful_rows: count,
    failed_rows: count,
    total_chunks: count,
    processed_chunks: count,
    error_message: z.string().nullable(),
    started_at: z.string().nullable(),
    finished_at: z.string().nullable(),
  }),
  entries_count: count,
  errors_count: count,
  progress_percent: z.number().min(0).max(100),
  duration_seconds: z.number().nonnegative().nullable(),
  duration_minutes: z.number().nonnegative().nullable(),
})
export type LedgerImportStatus = z.infer<typeof statusSchema>
const acceptedSchema = z.object({
  data: z.object({
    id: z.number().int().positive(),
    status: stateSchema,
    worker_triggered: z.boolean().optional(),
  }),
})
export const isImportFinished = (status: LedgerImportState) =>
  status === "completed" ||
  status === "completed_with_errors" ||
  status === "failed"
export function ledgerError(error: unknown) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 413)
      return "Server menolak ukuran file. Hubungi pengelola untuk memeriksa batas unggahan server."
    if (error.response?.status === 429)
      return "Terlalu banyak permintaan. Tunggu sebentar sebelum mencoba lagi."
    if (!error.response)
      return "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi."
    return extractMessage(error)
  }
  return error instanceof Error
    ? error.message
    : "Terjadi kesalahan. Silakan coba lagi."
}
export function validateLedgerFile(file: File) {
  if (!/\.(xlsx|xls)$/i.test(file.name))
    return "Pilih file Excel berformat .xlsx atau .xls."
  if (file.size === 0) return "File kosong. Pilih file Excel yang berisi data."
  if (file.size > LEDGER_UPLOAD_MAX_BYTES)
    return "Ukuran file melebihi batas 50 MB."
  return ""
}
export async function getInquiryAccount(
  params: QueryParams = {},
  signal?: AbortSignal
) {
  const response = await request<unknown>(
    { url: apiPath.account.inquiry, params, signal },
    { silent: true }
  )
  return normalizePaginated<LedgerEntry>(
    response,
    Number(params.page ?? 1),
    Number(params.per_page ?? 10)
  )
}
export async function uploadLedger(
  file: File,
  signal: AbortSignal,
  onProgress: (event: AxiosProgressEvent) => void
) {
  const body = new FormData()
  body.append("file", file)
  try {
    const response = await request<unknown>(
      {
        url: apiPath.account.upload,
        method: "POST",
        data: body,
        timeout: 0,
        signal,
        onUploadProgress: onProgress,
      },
      { silent: true }
    )
    const parsed = acceptedSchema.safeParse(response)
    if (!parsed.success)
      throw new Error(
        "Respons penerimaan impor tidak valid. Hubungi pengelola backend sebelum mengunggah ulang."
      )
    return { ...parsed.data.data, duplicate: false }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      const parsed = acceptedSchema.safeParse(error.response.data)
      if (parsed.success) return { ...parsed.data.data, duplicate: true }
    }
    throw error
  }
}
export async function getLedgerImport(id: number, signal: AbortSignal) {
  const response = await request<unknown>(
    { url: apiPath.account.status(id), signal },
    { silent: true }
  )
  const parsed = statusSchema.safeParse(response)
  if (!parsed.success || parsed.data.data.id !== id) {
    throw new Error(
      "Respons status impor tidak valid. Hubungi pengelola untuk memeriksa endpoint status impor di backend."
    )
  }
  return parsed.data
}
export async function getLedgerImportErrors(
  id: number,
  params: QueryParams = {},
  signal?: AbortSignal
) {
  const response = await request<unknown>(
    { url: apiPath.account.errors(id), params, signal },
    { silent: true }
  )
  return normalizePaginated<LedgerImportError>(
    response,
    Number(params.page ?? 1),
    Number(params.per_page ?? 10)
  )
}
