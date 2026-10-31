import { lazy, type ComponentType, type LazyExoticComponent } from "react"
import { matchPath } from "react-router-dom"

const TransaksiAyamPage = lazy(
  () => import("@/pages/transaksi-ayam/transaksi-ayam-page")
)
const TransaksiAyamCreatePage = lazy(
  () => import("@/pages/transaksi-ayam/transaksi-ayam-create-page")
)
const TransaksiAyamEditPage = lazy(() =>
  import("@/pages/transaksi-ayam/transaksi-ayam-create-page").then((m) => ({
    default: m.TransaksiAyamEditPage,
  }))
)

const TransaksiAyamDetailPage = lazy(() =>
  import("@/pages/transaksi-ayam/transaksi-ayam-page").then((m) => ({
    default: m.TransaksiAyamDetailPage,
  }))
)
const OpeningBalancePage = lazy(
  () => import("@/pages/transaksi-ayam/transaksi-ayam-opening-balance-page")
)
const OpeningBalanceCreatePage = lazy(() =>
  import("@/pages/transaksi-ayam/transaksi-ayam-opening-balance-page").then(
    (m) => ({ default: m.OpeningBalanceCreatePage })
  )
)
const OpeningBalanceDetailPage = lazy(() =>
  import("@/pages/transaksi-ayam/transaksi-ayam-opening-balance-page").then(
    (m) => ({ default: m.OpeningBalanceDetailPage })
  )
)
const AccountPage = lazy(
  () => import("@/pages/transaksi-account/inquiry-account-page")
)
const AccountCreatePage = lazy(
  () => import("@/pages/transaksi-account/ledger-import-page")
)

const ReportingPage = lazy(() => import("@/pages/report/reporting-page"))
const CostAllocationPage = lazy(() =>
  import("@/pages/cost-allocation-page").then((m) => ({
    default: m.CostAllocationPage,
  }))
)
const MasterChickenPage = lazy(() =>
  import("@/pages/master-data/master-chicken-pages").then((m) => ({
    default: m.MasterChickenPage,
  }))
)
const MasterChickenCreatePage = lazy(() =>
  import("@/pages/master-data/master-chicken-pages").then((m) => ({
    default: m.MasterChickenCreatePage,
  }))
)
const MasterChickenDetailPage = lazy(() =>
  import("@/pages/master-data/master-chicken-pages").then((m) => ({
    default: m.MasterChickenDetailPage,
  }))
)
const MasterCagePage = lazy(() =>
  import("@/pages/master-data/master-cage-pages").then((m) => ({
    default: m.MasterCagePage,
  }))
)
const MasterCageCreatePage = lazy(() =>
  import("@/pages/master-data/master-cage-pages").then((m) => ({
    default: m.MasterCageCreatePage,
  }))
)
const MasterCageDetailPage = lazy(() =>
  import("@/pages/master-data/master-cage-pages").then((m) => ({
    default: m.MasterCageDetailPage,
  }))
)
const MasterRegionPage = lazy(() =>
  import("@/pages/master-data/master-region-pages").then((m) => ({
    default: m.MasterRegionPage,
  }))
)
const MasterRegionCreatePage = lazy(() =>
  import("@/pages/master-data/master-region-pages").then((m) => ({
    default: m.MasterRegionCreatePage,
  }))
)
const MasterRegionDetailPage = lazy(() =>
  import("@/pages/master-data/master-region-pages").then((m) => ({
    default: m.MasterRegionDetailPage,
  }))
)

const MasterChickenEditPage = lazy(() =>
  import("@/pages/master-data/master-chicken-pages").then((m) => ({
    default: m.MasterChickenEditPage,
  }))
)
const MasterCageEditPage = lazy(() =>
  import("@/pages/master-data/master-cage-pages").then((m) => ({
    default: m.MasterCageEditPage,
  }))
)
const MasterRegionEditPage = lazy(() =>
  import("@/pages/master-data/master-region-pages").then((m) => ({
    default: m.MasterRegionEditPage,
  }))
)

const PeriodeClosingPage = lazy(() =>
  import("@/pages/master-data/periode-closing-pages").then((m) => ({
    default: m.PeriodeClosingPage,
  }))
)
const PeriodeClosingCreatePage = lazy(() =>
  import("@/pages/master-data/periode-closing-pages").then((m) => ({
    default: m.PeriodeClosingCreatePage,
  }))
)
const PeriodeClosingDetailPage = lazy(() =>
  import("@/pages/master-data/periode-closing-pages").then((m) => ({
    default: m.PeriodeClosingDetailPage,
  }))
)
const PeriodeClosingEditPage = lazy(() =>
  import("@/pages/master-data/periode-closing-pages").then((m) => ({
    default: m.PeriodeClosingEditPage,
  }))
)

type RouteEntry = {
  path: string
  title: string
  description: string
  component: LazyExoticComponent<ComponentType> | ComponentType
  sidebarRoute?: string
}

export const routes = {
  chicken: {
    path: "/transaksi-ayam",
    title: "Transaksi Ayam",
    description: "Daftar transaksi ayam.",
    component: TransaksiAyamPage,
    sidebarRoute: "chicken_inquiry",
  },
  chicken_create: {
    path: "/transaksi-ayam/create",
    title: "Input Transaksi Bulanan",
    description:
      "Input ayam masuk, keluar, mati, jual, dan koreksi untuk periode OPEN.",
    component: TransaksiAyamCreatePage,
    sidebarRoute: "chicken_inquiry",
  },
  chicken_opening_balance: {
    path: "/transaksi-ayam/opening-balance",
    title: "Opening Balance",
    description: "Saldo awal ayam per periode, wilayah, dan kandang.",
    component: OpeningBalancePage,
  },
  chicken_opening_balance_create: {
    path: "/transaksi-ayam/opening-balance/create",
    title: "Input Opening Balance",
    description: "Input saldo awal ayam untuk periode OPEN.",
    component: OpeningBalanceCreatePage,
    sidebarRoute: "chicken_opening_balance",
  },
  chicken_opening_balance_detail: {
    path: "/transaksi-ayam/opening-balance/:id",
    title: "Detail Opening Balance",
    description: "Informasi saldo awal ayam.",
    component: OpeningBalanceDetailPage,
    sidebarRoute: "chicken_opening_balance",
  },
  chicken_inquiry: {
    path: "/transaksi-ayam/inquiry",
    title: "Inquiry Transaksi Ayam",
    description: "Riwayat pergerakan ayam per kandang dan flock.",
    component: TransaksiAyamPage,
  },
  chicken_edit: {
    path: "/transaksi-ayam/inquiry/:id/edit",
    title: "Ubah Mutasi Transaksi Ayam",
    description: "Input ayam masuk, keluar, mati, jual, dan koreksi.",
    component: TransaksiAyamEditPage,
    sidebarRoute: "chicken_inquiry",
  },

  chicken_detail: {
    path: "/transaksi-ayam/inquiry/:id",
    title: "Detail Transaksi Ayam",
    description: "Informasi pergerakan ayam.",
    component: TransaksiAyamDetailPage,
    sidebarRoute: "chicken_inquiry",
  },
  accounts: {
    path: "/transaksi-account/inquiry-account",
    title: "Transaksi Account",
    description: "Transaksi akuntansi dan mutasi debit dikurangi kredit.",
    component: AccountPage,
  },
  accounts_create: {
    path: "/transaksi-account/create",
    title: "Upload Transaksi Account",
    description: "Input transaksi akuntansi melalui file Excel.",
    component: AccountCreatePage,
    sidebarRoute: "accounts",
  },
  cost_allocation: {
    path: "/cost-allocation",
    title: "Alokasi Biaya",
    description: "Coming Soon – Phase 2.",
    component: CostAllocationPage,
  },
  reporting: {
    path: "/reporting",
    title: "Reporting",
    description: "Laporan Buku Besar, Ayam, Pakan, dan OVK dalam satu halaman.",
    component: ReportingPage,
  },
  report_general_ledger: {
    path: "/reporting/general-ledger",
    title: "Reporting",
    description: "Laporan Buku Besar, Ayam, Pakan, dan OVK.",
    component: ReportingPage,
    sidebarRoute: "reporting",
  },
  report_ovk: {
    path: "/reporting/ovk",
    title: "Reporting",
    description: "Laporan Buku Besar, Ayam, Pakan, dan OVK.",
    component: ReportingPage,
    sidebarRoute: "reporting",
  },
  report_pakan: {
    path: "/reporting/pakan",
    title: "Reporting",
    description: "Laporan Buku Besar, Ayam, Pakan, dan OVK.",
    component: ReportingPage,
    sidebarRoute: "reporting",
  },
  report_ayam: {
    path: "/reporting/ayam",
    title: "Reporting",
    description: "Laporan Buku Besar, Ayam, Pakan, dan OVK.",
    component: ReportingPage,
    sidebarRoute: "reporting",
  },
  master_period: {
    path: "/master-data/periode-closing",
    title: "Periode Closing",
    description: "Pengelolaan periode dan status closing bulanan.",
    component: PeriodeClosingPage,
    sidebarRoute: "master_period",
  },
  master_period_create: {
    path: "/master-data/periode-closing/create",
    title: "Tambah Periode Closing",
    description: "Pengelolaan periode dan status closing bulanan.",
    component: PeriodeClosingCreatePage,
    sidebarRoute: "master_period",
  },
  master_period_detail: {
    path: "/master-data/periode-closing/:id",
    title: "Detail Periode Closing",
    description: "Pengelolaan periode dan status closing bulanan.",
    component: PeriodeClosingDetailPage,
    sidebarRoute: "master_period",
  },
  master_period_edit: {
    path: "/master-data/periode-closing/:id/edit",
    title: "Ubah Periode Closing",
    description: "Pengelolaan periode dan status closing bulanan.",
    component: PeriodeClosingEditPage,
    sidebarRoute: "master_period",
  },

  master_chicken: {
    path: "/master-data/chicken",
    title: "Master Ayam",
    description: "Fase ayam, umur deplesi, dan COA persediaan.",
    component: MasterChickenPage,
  },
  master_chicken_create: {
    path: "/master-data/chicken/create",
    title: "Create Master Ayam",
    description: "Input fase ayam dan aturan deplesi.",
    component: MasterChickenCreatePage,
    sidebarRoute: "master_chicken",
  },
  master_chicken_edit: {
    path: "/master-data/chicken/:id/edit",
    title: "Ubah Master Ayam",
    description: "Perubahan data master ayam.",
    component: MasterChickenEditPage,
    sidebarRoute: "master_chicken",
  },

  master_chicken_detail: {
    path: "/master-data/chicken/:id",
    title: "Detail Master Ayam",
    description: "Informasi fase ayam.",
    component: MasterChickenDetailPage,
    sidebarRoute: "master_chicken",
  },
  master_cage: {
    path: "/master-data/cage",
    title: "Master Kandang",
    description: "Kandang, kapasitas, dan wilayah operasional.",
    component: MasterCagePage,
  },
  master_cage_create: {
    path: "/master-data/cage/create",
    title: "Create Master Kandang",
    description: "Input kandang dan relasi wilayah.",
    component: MasterCageCreatePage,
    sidebarRoute: "master_cage",
  },
  master_cage_edit: {
    path: "/master-data/cage/:id/edit",
    title: "Ubah Master Kandang",
    description: "Perubahan data master kandang.",
    component: MasterCageEditPage,
    sidebarRoute: "master_cage",
  },

  master_cage_detail: {
    path: "/master-data/cage/:id",
    title: "Detail Master Kandang",
    description: "Informasi kandang dan wilayah.",
    component: MasterCageDetailPage,
    sidebarRoute: "master_cage",
  },
  master_region: {
    path: "/master-data/region",
    title: "Master Wilayah",
    description: "Wilayah dan lokasi peternakan.",
    component: MasterRegionPage,
  },
  master_region_create: {
    path: "/master-data/region/create",
    title: "Create Master Wilayah",
    description: "Input kode dan nama lokasi peternakan.",
    component: MasterRegionCreatePage,
    sidebarRoute: "master_region",
  },
  master_region_edit: {
    path: "/master-data/region/:id/edit",
    title: "Ubah Master Wilayah",
    description: "Perubahan data master wilayah.",
    component: MasterRegionEditPage,
    sidebarRoute: "master_region",
  },

  master_region_detail: {
    path: "/master-data/region/:id",
    title: "Detail Master Wilayah",
    description: "Informasi wilayah peternakan.",
    component: MasterRegionDetailPage,
    sidebarRoute: "master_region",
  },
} as const satisfies Record<string, RouteEntry>

export type RouteKey = keyof typeof routes

export const findRouteKey = (pathname: string): RouteKey | undefined => {
  const clean = pathname.replace(/\/+$/, "") || "/"
  const keys = Object.keys(routes) as RouteKey[]
  return (
    keys.find((key) => routes[key].path === clean) ??
    keys.find((key) => matchPath({ path: routes[key].path, end: true }, clean))
  )
}
