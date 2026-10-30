const numberFormatter = new Intl.NumberFormat("id-ID")
const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
})

export const formatNumber = (value: number) => numberFormatter.format(value)
export const formatRupiah = (value: number) => rupiahFormatter.format(value)
export const currentMonth = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}
export const formatMonth = (value: string) => {
  const [year, month] = value.split("-").map(Number)
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, 1))
}
export const formatDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number)
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day))
}

export const periodeLabel = (periode: { tahun: number; bulan: number }) =>
  formatMonth(`${periode.tahun}-${String(periode.bulan).padStart(2, "0")}`)

export const formatDecimalRupiah = (value: string) => {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(value)
  if (!match) return value
  return `Rp ${match[1]}${numberFormatter.format(BigInt(match[2]))},${(match[3] ?? "").padEnd(2, "0")}`
}
