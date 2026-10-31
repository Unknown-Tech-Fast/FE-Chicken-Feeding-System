import assert from "node:assert/strict"
import { after, beforeEach, test } from "node:test"
import { fileURLToPath } from "node:url"
import { createServer } from "vite"
import { AxiosError } from "axios"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { MemoryRouter } from "react-router-dom"

// All requests terminate at this adapter. These tests never contact a backend.
const server = await createServer({
  configFile: false,
  resolve: {
    alias: { "@": fileURLToPath(new URL("../src", import.meta.url)) },
  },
  server: { middlewareMode: true, hmr: false, watch: null },
})
after(() => server.close())
const {
  chickenApi,
  openingBalanceApi,
  monthlyTransactionApi,
  createTransaksiAyam,
} = await server.ssrLoadModule("/src/utils/api/endpoints/chicken.ts")
const { axiosInstance } = await server.ssrLoadModule("/src/utils/api/http.ts")
const { openingBalanceSchema, transaksiAyamSchema, transaksiAyamCreateSchema } =
  await server.ssrLoadModule(
    "/src/pages/transaksi-ayam/transaksi-ayam-schema.ts"
  )

const opening = {
  periode_id: 1,
  lokasi_id: 2,
  kandang_id: 3,
  master_ayam_id: 4,
  flock_no: "F-01",
  umur_minggu: 10,
  so_ekor: 100,
}
const movement = {
  in_ekor: 10,
  out_ekor: 5,
  mati_ekor: 2,
  jual_ekor: 3,
  koreksi_ekor: -1,
}
const { so_ekor: openingStock, ...identity } = opening
assert.equal(openingStock, 100)
const monthly = { ...identity, ...movement }
let calls
let periodStatus
let failure
beforeEach(() => {
  calls = []
  periodStatus = "OPEN"
  failure = undefined
  axiosInstance.defaults.adapter = async (config) => {
    const body = config.data ? JSON.parse(config.data) : undefined
    calls.push({ method: config.method, url: config.url, body })
    if (failure) throw failure
    let data
    if (config.method === "get" && config.url === "periode-closing/1")
      data = { id: 1, status: periodStatus }
    else if (
      config.method === "get" &&
      config.url === "transaksi-ayam-bulanan/9"
    )
      data = { ...opening, ...movement, id: 9, sa_ekor: 99 }
    else if (
      config.method === "post" &&
      config.url === "transaksi-ayam-bulanan"
    )
      data = { ...opening, id: 9 }
    else if (
      config.method === "put" &&
      config.url === "transaksi-ayam-bulanan/9"
    )
      data = { id: 9, ...movement }
    else throw new Error(`Unexpected request: ${config.method} ${config.url}`)
    return {
      data: { success: true, data },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    }
  }
})

test("Opening Balance posts identity and opening stock only, even with extra source fields", async () => {
  await openingBalanceApi.save({ ...opening, ...movement, sa_ekor: 999 })
  assert.deepEqual(calls, [
    { method: "get", url: "periode-closing/1", body: undefined },
    { method: "post", url: "transaksi-ayam-bulanan", body: opening },
  ])
})

test("Opening Balance rechecks a period that closed after form loading", async () => {
  periodStatus = "CLOSED"
  await assert.rejects(openingBalanceApi.save(opening), /Periode sudah ditutup/)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].method, "get")
})

test("Inquiry updates only five movement values and preserves identity and balances", async () => {
  await chickenApi.save({ ...opening, ...movement, sa_ekor: 999 }, 9)
  assert.deepEqual(calls, [
    { method: "get", url: "transaksi-ayam-bulanan/9", body: undefined },
    { method: "get", url: "periode-closing/1", body: undefined },
    { method: "put", url: "transaksi-ayam-bulanan/9", body: movement },
  ])
})

test("Inquiry cannot write to a CLOSED period", async () => {
  periodStatus = "CLOSED"
  await assert.rejects(chickenApi.save(movement, 9), /Periode sudah ditutup/)
  assert.ok(calls.every((call) => call.method === "get"))
})

test("Missing or unknown period status fails closed", async () => {
  periodStatus = undefined
  await assert.rejects(openingBalanceApi.save(opening), /Periode sudah ditutup/)
  assert.ok(calls.every((call) => call.method === "get"))
})

test("Update requires an existing record and Opening Balance cannot update", async () => {
  await assert.rejects(chickenApi.save(movement), /Pilih data transaksi/)
  await assert.rejects(
    openingBalanceApi.save(opening, 9),
    /Saldo awal tidak dapat diubah/
  )
  assert.equal(calls.length, 0)
})

test("Inquiry creates a monthly transaction through POST without opening or closing stock", async () => {
  await createTransaksiAyam({ ...opening, ...movement, sa_ekor: 999 })
  assert.deepEqual(calls, [
    { method: "get", url: "periode-closing/1", body: undefined },
    { method: "post", url: "transaksi-ayam-bulanan", body: monthly },
  ])
  assert.equal("so_ekor" in calls[1].body, false)
  assert.equal("sa_ekor" in calls[1].body, false)
})

test("Monthly create rechecks OPEN status and refuses a CLOSED period", async () => {
  periodStatus = "CLOSED"
  await assert.rejects(
    monthlyTransactionApi.save(monthly),
    /Periode sudah ditutup/
  )
  assert.equal(calls.length, 1)
  assert.ok(calls.every((call) => call.method === "get"))
})

test("Monthly create validates identity and movements, without requiring balances", () => {
  assert.deepEqual(transaksiAyamCreateSchema.parse(monthly), monthly)
  assert.deepEqual(
    transaksiAyamCreateSchema.parse({ ...monthly, so_ekor: 100, sa_ekor: 999 }),
    monthly
  )
  for (const field of [
    "periode_id",
    "lokasi_id",
    "kandang_id",
    "master_ayam_id",
  ]) {
    assert.equal(
      transaksiAyamCreateSchema.safeParse({ ...monthly, [field]: 0 }).success,
      false
    )
  }
  assert.equal(
    transaksiAyamCreateSchema.safeParse({ ...monthly, in_ekor: -1 }).success,
    false
  )
  assert.equal(
    transaksiAyamCreateSchema.safeParse({ ...monthly, koreksi_ekor: -3 })
      .success,
    true
  )
})

test("Monthly create propagates duplicate validation without silently updating an existing record", async () => {
  const duplicate = new AxiosError(
    "Duplicate",
    "ERR_BAD_REQUEST",
    undefined,
    undefined,
    {
      status: 422,
      data: { errors: { kandang_id: ["Data kombinasi ini sudah ada."] } },
    }
  )
  const original = axiosInstance.defaults.adapter
  axiosInstance.defaults.adapter = async (config) => {
    if (config.method === "post") {
      calls.push({
        method: config.method,
        url: config.url,
        body: JSON.parse(config.data),
      })
      throw duplicate
    }
    return original(config)
  }
  await assert.rejects(
    monthlyTransactionApi.save(monthly),
    (error) => error === duplicate
  )
  assert.deepEqual(
    calls.map((call) => call.method),
    ["get", "post"]
  )
})

test("Period lookup failure prevents saving and remains available to the form", async () => {
  failure = new AxiosError("Network Error", "ERR_NETWORK")
  await assert.rejects(
    openingBalanceApi.save(opening),
    (error) => error === failure
  )
  assert.equal(calls.length, 1)
  assert.equal(calls[0].method, "get")
})

test("Opening Balance validates required relations, age, and nonnegative whole stock", () => {
  assert.deepEqual(
    openingBalanceSchema.parse({ ...opening, ...movement }),
    opening
  )
  for (const field of [
    "periode_id",
    "lokasi_id",
    "kandang_id",
    "master_ayam_id",
  ]) {
    assert.equal(
      openingBalanceSchema.safeParse({ ...opening, [field]: 0 }).success,
      false
    )
  }
  for (const so_ekor of [-1, 1.5, NaN])
    assert.equal(
      openingBalanceSchema.safeParse({ ...opening, so_ekor }).success,
      false
    )
  assert.equal(
    openingBalanceSchema.safeParse({ ...opening, umur_minggu: 65536 }).success,
    false
  )
  assert.equal(
    openingBalanceSchema.safeParse({ ...opening, flock_no: "" }).success,
    true
  )
})

test("Mutation validation allows negative correction and removes balances", () => {
  assert.deepEqual(
    transaksiAyamSchema.parse({ ...opening, ...movement, sa_ekor: 999 }),
    movement
  )
  for (const field of ["in_ekor", "out_ekor", "mati_ekor", "jual_ekor"]) {
    assert.equal(
      transaksiAyamSchema.safeParse({ ...movement, [field]: -1 }).success,
      false
    )
    assert.equal(
      transaksiAyamSchema.safeParse({ ...movement, [field]: 1.5 }).success,
      false
    )
  }
  assert.equal(
    transaksiAyamSchema.safeParse({ ...movement, koreksi_ekor: -1.5 }).success,
    false
  )
})

test("Inquiry button opens the monthly create route and form exposes movements without balance inputs", async () => {
  const { TransaksiAyamPage } = await server.ssrLoadModule(
    "/src/pages/transaksi-ayam/transaksi-ayam-page.tsx"
  )
  const { TransaksiAyamCreatePage } = await server.ssrLoadModule(
    "/src/pages/transaksi-ayam/transaksi-ayam-create-page.tsx"
  )
  const render = (Page) =>
    renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Page)))
  const inquiry = render(TransaksiAyamPage)
  assert.match(inquiry, /href="\/transaksi-ayam\/create"/)
  assert.match(inquiry, /Input Transaksi Bulanan/)
  assert.doesNotMatch(inquiry, /Input Opening Balance/)
  const form = render(TransaksiAyamCreatePage)
  for (const field of Object.keys(movement))
    assert.ok(form.includes(`name="${field}"`), `${field} input must exist`)
  for (const field of [
    "periode_id",
    "lokasi_id",
    "kandang_id",
    "master_ayam_id",
    "flock_no",
    "umur_minggu",
  ])
    assert.ok(form.includes(`id="${field}"`), `${field} field must exist`)
  assert.doesNotMatch(form, /name="(?:so_ekor|sa_ekor)"/)
  assert.equal(calls.length, 0)
})
