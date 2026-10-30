# Frontend Phase 1

Seluruh halaman Phase 1 menggunakan data contoh lokal, tanpa HTTP request atau penyimpanan. Aksi Save, Upload, dan Download menampilkan notifikasi bahwa API belum tersedia. File Excel hanya dipilih dan divalidasi ekstensi serta keberadaan isinya; belum dibaca, diproses, atau diupload.

## Modul

| Modul                  | Halaman utama                        | Alur                                                                          |
| ---------------------- | ------------------------------------ | ----------------------------------------------------------------------------- |
| Opening Balance        | `/transaksi-ayam/opening-balance`    | Index, Create melalui upload Excel, View berdasarkan ID                       |
| Transaksi Account      | `/transaksi-account/inquiry-account` | Index, Create melalui upload Excel, View dengan Debit − Kredit                |
| Inquiry Transaksi Ayam | `/transaksi-ayam/inquiry`            | Index dan View; form tambah yang sudah ada tetap tersedia dalam mode frontend |
| Master Ayam            | `/master-data/chicken`               | Index, Create dengan validasi, View                                           |
| Master Kandang         | `/master-data/cage`                  | Index, Create dengan relasi ID wilayah, View                                  |
| Master Wilayah         | `/master-data/region`                | Index, Create, View                                                           |
| Reporting              | `/reporting`                         | Tab Buku Besar, Ayam, Pakan, OVK; periode bulan berjalan dan filter dinamis   |
| Alokasi Biaya          | `/cost-allocation`                   | Coming Soon – Phase 2                                                         |

Semua tabel menyediakan pencarian, pengurutan, pagination lokal, empty state, dan tautan View. Detail dengan ID yang tidak dikenal menampilkan pesan dan tautan kembali. Lazy loading halaman memakai fallback di `src/App.tsx`. Error Boundary tetap melindungi aplikasi dan halaman.

Alamat laporan lama `/reporting/general-ledger`, `/reporting/ayam`, `/reporting/pakan`, dan `/reporting/ovk` masih membuka halaman Reporting yang sama dengan tab awal terkait. Navigasi sidebar menyediakan satu menu Reporting.

## File utama

- `src/data/mock-data.ts`: tipe dan mock wilayah, kandang, COA, rekanan, fase ayam, saldo awal, dan transaksi. Relasi antar-modul mengambil ID dari sumber yang sama. Mutasi Account dihitung oleh `accountMutation`.
- `src/lib/format.ts`: format Indonesia untuk tanggal, bulan, angka, Rupiah, dan bulan berjalan berdasarkan waktu lokal.
- `src/routes.ts`: definisi halaman index/create/detail, pencocokan parameter `:id`, dan menu sidebar induk halaman.
- `src/routes-sidebar.ts`: konfigurasi menu yang dapat diperluas.
- `src/components/data-table/mock-data-table.tsx`: tabel lokal bersama dengan aksi View.
- `src/components/excel-upload.tsx`: file picker, drag-and-drop, validasi `.xlsx`/`.xls`, dan feedback upload belum tersedia.
- `src/components/record-detail.tsx`: tampilan read-only, status aktif, dan record tidak ditemukan.
- `src/components/form-fields.tsx`, `master-form-layout.tsx`, `ui/switch.tsx`: komponen form bersama.
- `src/pages/master-data/`: index/create/detail tiga master beserta schema Zod.
- `src/pages/transaksi-ayam/`: Opening Balance serta inquiry/form transaksi ayam.
- `src/pages/transaksi-account/inquiry-account-page.tsx`: index, upload, dan detail Account.
- `src/pages/report/reporting-page.tsx`, `report-options.ts`: kategori laporan, state dan aturan filter.

## Aturan input

- LAYING memulai umur deplesi 9; fase lainnya 0. Mengganti fase memasang ulang default; pengguna dapat mengubahnya setelah itu.
- Umur deplesi harus bilangan bulat nonnegatif. Nama fase, kode fase, dan COA wajib terisi.
- Kandang menyimpan `lokasiId`, bukan nama wilayah. Kapasitas boleh kosong (`null`), atau bilangan bulat nonnegatif. Status awal aktif.
- Wilayah memerlukan kode dan nama; status awal aktif. Tidak ada input ID pada form Create.
- Filter Akun/Rekanan memulai dari Semua. Pilihan Tertentu mewajibkan akun/rekanan. Mengganti jenis laporan mereset filter terkait.
- Mengosongkan periode laporan akan memakai bulan berjalan saat Download diklik.
- Jenis Buku Besar masih menggunakan satu opsi berlabel mock karena jenis rinci belum didefinisikan.

## Verifikasi

Build TypeScript/Vite dan lint pada file Phase 1 berhasil. Smoke test di Chrome headless memeriksa enam tabel, 23 detail record, ID tidak dikenal, empty search, file picker/drag-and-drop Excel, validasi master, perubahan default deplesi, kapasitas opsional, switch aktif, empat kategori Reporting, dan mutasi negatif/nol. Dalam alur yang diperiksa tidak ada request Fetch/XHR atau exception JavaScript. Preview mobile 390px tidak menyebabkan overflow pada dokumen; tabel lebar dapat digeser secara horizontal.

## Menunggu API

- Pengambilan list/detail master dan transaksi.
- Penyimpanan form serta validasi keunikan kode dan relasi di backend.
- Parsing, validasi isi spreadsheet, upload dan impor Opening Balance/Account.
- Generate serta unduh Excel untuk setiap kategori laporan.
- Definisi jenis laporan Buku Besar yang sebenarnya.

Utility API yang sudah ada di `src/utils/api/` dipertahankan. Halaman Phase 1 tidak memakainya; penyambungan API perlu dilakukan secara eksplisit pada tahap berikutnya. Data mock tidak dimutasi oleh aksi pengguna dan tidak disimpan di localStorage.
