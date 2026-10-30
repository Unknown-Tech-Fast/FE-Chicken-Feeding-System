# chicken-project-fe

Frontend Chicken Project — React 19 + Vite + Tailwind v4 + shadcn/ui, dalam satu app (bukan monorepo).

## Menjalankan

```bash
pnpm install
cp .env.example .env.local   # isi VITE_API_URL ke backend Laravel
pnpm dev
```

Script lain: `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm format`, `pnpm preview`.

## Struktur

```
src/
├── components/
│   ├── ui/              # komponen shadcn/ui (button, table, dialog, ...)
│   ├── app-layout.tsx   # shell layout + sidebar
│   ├── toaster.tsx      # <Toaster /> global (sonner)
│   └── theme-provider.tsx
├── hooks/               # useIsMobile
├── lib/utils.ts         # re-export cn
├── pages/               # halaman per menu
├── styles/globals.css   # token desain + Tailwind
├── utils/api/           # layer API (lihat index-usage.md)
├── routes.ts            # path + title + description per halaman
└── routes-sidebar.ts    # struktur menu sidebar
```

## Menambah komponen shadcn

Jalankan dari root project:

```bash
pnpm dlx shadcn@latest add button
```

Komponen masuk ke `src/components/ui/`, diatur lewat `components.json` (alias `@/components/ui`).

## Memakai komponen

```tsx
import { Button } from "@/components/ui/button"
```

## Layer API

Semua request lewat `src/utils/api`. Contoh:

```tsx
import { getTransaksiAyam } from "@/utils/api"
```

Detail lengkap ada di [`src/utils/api/index-usage.md`](src/utils/api/index-usage.md).

## Login dan sesi

Salin `.env.example` ke `.env.local`, lalu arahkan `VITE_API_URL` ke URL backend Laravel yang diakhiri `/api/`. Restart Vite setelah mengganti konfigurasi. Untuk origin FE dan backend yang berbeda, backend harus mengizinkan origin FE serta header `Authorization` melalui CORS.

Halaman `/login` memakai `POST auth/login` dengan email, password, dan device_name. Token Sanctum disimpan di `localStorage.access_token` agar sesi bertahan setelah refresh; password tidak disimpan. Semua request privat melalui instance Axios mengirim `Authorization: Bearer <token>`. Karena token dapat diakses JavaScript, hindari injeksi HTML yang tidak tepercaya dan gunakan HTTPS pada deployment.

Saat aplikasi dibuka, `GET auth/me` memvalidasi token sebelum halaman privat ditampilkan. Respons 401 menghapus token dan mengarahkan ke login; gangguan jaringan menampilkan tombol coba lagi tanpa membuang token. Setelah login, pengguna kembali ke alamat internal yang sebelumnya dituju. Perubahan token di tab lain menyelaraskan sesi dengan memuat ulang tab.

Menu pengguna menampilkan profil dari backend. Logout memanggil `POST auth/logout` untuk mencabut token sebelum menghapus sesi lokal. Jika server tidak terjangkau, sesi dipertahankan agar logout dapat dicoba lagi. Backend saat ini tidak menyediakan refresh token, sehingga tidak ada mekanisme refresh token di FE. Proteksi route FE tetap harus dilengkapi otorisasi endpoint di backend.

## Catatan konfigurasi

- `pnpm-workspace.yaml` **bukan** monorepo — hanya tempat setting pnpm (`allowBuilds`).
- `eslint.config.js` memakai `projectService`, jadi butuh `tsconfigRootDir` yang di-set ke root project ini.

## Integrasi master

Master Ayam, Kandang, dan Wilayah selalu memakai API Laravel dari `VITE_API_URL`, termasuk saat `VITE_USE_MOCK_API=true` untuk modul lain. Endpoint: `master-ayam`, `master-kandang`, dan `master-lokasi`; tersedia daftar/detail (GET), tambah (POST), ubah (PUT), dan hapus (DELETE). Gunakan tombol Ubah atau Hapus pada kolom Aksi di tabel daftar. Halaman Detail hanya menampilkan informasi. Penghapusan memerlukan konfirmasi dan menampilkan penolakan 409 dari BE bila data sudah digunakan.

Pencarian, filter aktif/nonaktif, dan pagination diproses server. Urutan mengikuti BE karena endpoint master belum menerima parameter pengurutan. Respons `{ data, pagination }` dinormalisasi di layer API.

Form mengirim nama field snake_case dan menampilkan pesan validasi 422 pada field terkait. Kapasitas kandang wajib berupa bilangan bulat nonnegatif. Pilihan wilayah diambil dari seluruh halaman `master-lokasi`, termasuk wilayah tidak aktif yang ditandai pada pilihan. Kode fase ayam berupa teks (maksimal 30 karakter mengikuti kolom migration); COA persediaan opsional berupa teks karena BE belum menyediakan endpoint master COA.

Verifikasi integrasi dilakukan dengan TypeScript, ESLint, build Vite, dan browser terhadap server HTTP tiruan berstatus dalam memori. Alur tambah/ubah/hapus belum dijalankan terhadap database asli.
## Inquiry transaksi ayam bulanan

Menu Inquiry Transaksi Ayam selalu memakai group endpoint `transaksi-ayam-bulanan` dari `VITE_API_URL`, termasuk saat modul lain memakai mock. Tersedia daftar/detail (GET), tambah (POST), ubah (PUT), dan hapus (DELETE). Tombol Ubah/Hapus berada pada tabel index; detail hanya menampilkan informasi.

Pencarian menggunakan `flock_no`. Filter yang tersedia adalah `periode_id`, `kandang_id`, dan `master_ayam_id`, dengan pagination `page`/`per_page`. Pilihan periode diambil dari `periode-closing`, kandang dari `master-kandang`, dan fase ayam dari `master-ayam`; seluruh halaman pilihan dimuat. Form tidak dapat disimpan jika data relasi belum tersedia. Periode closing dapat dibuat melalui menu Master Data > Periode Closing.

Payload mengikuti field BE: `periode_id`, `kandang_id`, `master_ayam_id`, `flock_no`, `umur_minggu`, `so_ekor`, `in_ekor`, `out_ekor`, `sa_ekor`, `mati_ekor`, `jual_ekor`, dan `koreksi_ekor`. Flock No boleh kosong, umur 0–65535, jumlah ekor nonnegatif, dan koreksi boleh negatif. Saldo awal dan akhir mengikuti input yang dikirim. Pesan duplikasi kombinasi periode/kandang/fase/flock ditampilkan dari respons validasi 422. Penghapusan transaksi yang sudah memiliki alokasi biaya menampilkan penolakan 409 dari BE.

Komponen daftar, formulir, dan pemuatan record dipakai bersama dengan master melalui `src/components/api-record.tsx`; pola request CRUD berada di `src/utils/api/resource.ts`. Verifikasi browser dilakukan melalui server HTTP tiruan dalam memori, tanpa operasi tulis ke database asli.
## Master Periode Closing

Menu Master Data > Periode Closing memakai group endpoint `periode-closing` untuk daftar, detail, tambah, ubah, dan hapus. Aksi Ubah/Hapus berada di tabel index. Daftar mendukung filter `tahun`, `bulan`, `status`, serta pagination; endpoint ini tidak menyediakan pencarian teks.

Form mengikuti BE: tahun 2000–9999, bulan 1–12, status OPEN/CLOSED, dan total biaya operasional nonnegatif. Nilai biaya dikirim sebagai string desimal dengan maksimal 18 digit sebelum titik dan 2 digit desimal, sesuai kolom decimal(20,2), agar nominal tidak kehilangan presisi. Informasi `locked_at`/`locked_by` ditampilkan pada detail; perubahan status mengikuti CRUD BE tanpa menambahkan proses penguncian di FE.

Periode yang dibuat tersedia saat membuka form transaksi ayam. Jika periode belum tersedia, form transaksi menyediakan tautan Tambah periode closing. Validasi duplikasi tahun/bulan ditampilkan dari respons 422; periode yang sudah dipakai transaksi menampilkan penolakan hapus 409 dari BE.

Verifikasi: TypeScript, ESLint, build Vite, dan uji browser melalui server HTTP tiruan dalam memori, termasuk filter, CRUD, ketepatan nominal desimal, dan pilihan periode pada transaksi ayam. Tidak ada operasi tulis ke database asli.
## Inquiry Account dan impor ledger

Inquiry Account memakai API ledger pada group imports: daftar ledger, unggah Excel, status/progres, dan catatan impor per halaman. Upload mendukung .xlsx/.xls hingga 50 MB tanpa membaca workbook di browser. Status dapat dilanjutkan setelah refresh melalui URL yang memuat ID impor. File identik membuka status impor yang sudah tercatat dari respons 409.

Lihat [panduan integrasi ledger](docs/ledger-integration.md) untuk endpoint, pengujian, format sheet, serta dua masalah sumber BE yang perlu diselaraskan: model binding status/error dan path pemicu worker lama. Uji FE memakai HTTP tiruan; tidak ada operasi tulis ke database asli.