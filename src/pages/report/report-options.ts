export const reportCategories = ["ledger", "chicken", "feed", "ovk"] as const
export type ReportCategory = (typeof reportCategories)[number]

export const reportOptions = {
  ledger: { label: "Buku Besar" },
  chicken: { label: "Ayam" },
  feed: { label: "Pakan / OVD" },
  ovk: { label: "OVK" },
} as const
