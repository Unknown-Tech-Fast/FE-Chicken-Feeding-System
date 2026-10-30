import { request } from "./http"
import { normalizePaginated } from "./pagination"
import type { ApiResponse, Paginated, QueryParams } from "./types"

export function createResourceApi<T, R extends { id: number }>(path: string) {
  return {
    async list(params: QueryParams = {}, signal?: AbortSignal) {
      const response = await request<unknown>(
        { url: path, params, signal },
        { silent: true }
      )
      return normalizePaginated<R>(
        response,
        Number(params.page ?? 1),
        Number(params.per_page ?? 10)
      )
    },
    async get(id: string, signal?: AbortSignal) {
      const response = await request<ApiResponse<R>>(
        { url: `${path}/${encodeURIComponent(id)}`, signal },
        { silent: true }
      )
      return response.data
    },
    async save(data: T, id?: number) {
      const response = await request<ApiResponse<R>>(
        {
          url: id === undefined ? path : `${path}/${id}`,
          method: id === undefined ? "POST" : "PUT",
          data,
        },
        { silent: true }
      )
      return response.data
    },
    remove(id: number) {
      return request<ApiResponse<null>>(
        { url: `${path}/${id}`, method: "DELETE" },
        { silent: true }
      )
    },
  }
}
export type ResourceApi<T, R extends { id: number }> = ReturnType<
  typeof createResourceApi<T, R>
>

export async function getAllPages<T>(
  list: (params: QueryParams, signal?: AbortSignal) => Promise<Paginated<T>>,
  signal: AbortSignal
) {
  const rows: T[] = []
  let page = 1
  let totalPages: number
  do {
    const result = await list({ page, per_page: 100 }, signal)
    rows.push(...result.items)
    totalPages = result.totalPages
    page++
  } while (page <= totalPages)
  return rows
}
