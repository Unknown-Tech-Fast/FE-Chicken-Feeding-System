import { useEffect, useState } from "react"
import {
  getLedgerImport,
  isImportFinished,
  ledgerError,
  type LedgerImportStatus,
} from "@/utils/api/endpoints/account"

export function useLedgerImport(importId: number) {
  const [result, setResult] = useState<{
    id: number
    data?: LedgerImportStatus
    error?: string
    loading: boolean
  }>()
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    async function poll() {
      try {
        const data = await getLedgerImport(importId, controller.signal)
        if (controller.signal.aborted) return
        setResult({ id: importId, data, loading: false })
        if (!isImportFinished(data.data.status))
          timer = setTimeout(() => {
            void poll()
          }, 2000)
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult((previous) => ({
            id: importId,
            data: previous?.id === importId ? previous.data : undefined,
            error: ledgerError(error),
            loading: false,
          }))
        }
      }
    }
    void poll()
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [importId, attempt])
  const current =
    result?.id === importId
      ? result
      : { id: importId, loading: true, data: undefined, error: undefined }
  return {
    ...current,
    retry: () => {
      setResult((previous) => ({
        id: importId,
        data: previous?.id === importId ? previous.data : undefined,
        loading: true,
      }))
      setAttempt((value) => value + 1)
    },
  }
}
