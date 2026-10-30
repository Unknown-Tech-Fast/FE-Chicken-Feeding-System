export const apiPath = {
  chicken: {
    list: "transaksi-ayam-bulanan",
    detail: (id: string | number) => `transaksi-ayam-bulanan/${id}`,
    create: "transaksi-ayam-bulanan",
  },
  account: {
    inquiry: "imports/ledger-entries",
    upload: "imports/ledger",
    status: (id: number) => `imports/ledger/${id}`,
    errors: (id: number) => `imports/ledger/${id}/errors`,
  },
  reporting: {
    chickenExport: "finance/pivot/export/excel",
    ovkExport: "finance/ovk/export-pivot",
    ovkPreview: "finance/ovk/preview-pivot",
    feedExport: "finance/pakan-ovd/export-pivot",
    feedPreview: "finance/pakan-ovd/preview-pivot",
  },
  auth: {
    login: "auth/login",
    refresh: "auth/refresh",
    profile: "auth/me",
  },
} as const
