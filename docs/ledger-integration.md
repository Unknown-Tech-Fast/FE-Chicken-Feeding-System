# Integrasi Inquiry Account dan Ledger

## Endpoint BE yang digunakan

- `GET imports/ledger-entries`: daftar ledger dengan pagination Laravel.
- `POST imports/ledger`: unggah multipart pada field `file`; respons 202 berisi ID impor.
- `GET imports/ledger/{id}`: status, progres, jumlah baris, durasi, dan jumlah catatan.
- `GET imports/ledger/{id}/errors`: catatan baris dengan pagination Laravel.

Inquiry Account selalu memakai API nyata, termasuk saat modul lain memakai mock. Filter mengikuti BE: `source_sheet`, `jenis_transaksi`, `coa_code`, `from`, `to`, dan `import_id`. Pagination dibatasi maksimal 100 baris per request. Debit, kredit, dan mutasi ditampilkan dari string desimal BE tanpa konversi float.

BE belum menyediakan endpoint detail satu ledger, ubah, atau hapus ledger. Detail dibuka dari baris hasil daftar dalam dialog, tanpa mengambil seluruh data atau membuat endpoint tambahan.

## Excel besar

FE menerima satu file .xlsx/.xls, tidak kosong, maksimal 51200 KiB (50 MiB), sesuai batas validasi BE. File dikirim langsung sebagai FormData tanpa pembacaan workbook di browser atau konversi base64. Batas PHP/proxy harus cukup untuk file dan overhead multipart.

Sheet dan awal data mengikuti PrepareLedgerImport:
- OVK: baris 4.
- PAKAN.OVD: baris 5.
- AYAM: baris 4.

BE membagi pemrosesan menjadi job per 1.000 baris. FE tidak memecah file menjadi request terpisah karena API tidak menyediakan protokol unggah potongan. Validasi BE juga menyebut CSV, tetapi job memilih nama sheet Excel tersebut; UI menggunakan Excel sesuai alur job yang tersedia.

Timeout request upload dinonaktifkan khusus unggahan agar file besar tidak terputus oleh timeout standar 30 detik. Progres pengiriman dan pemrosesan ditampilkan terpisah. Tombol Batal unggah menghentikan pengiriman HTTP, bukan membatalkan job yang mungkin sudah diterima server.

Tidak ada retry POST otomatis. Jika penerimaan server tidak pasti setelah koneksi putus atau unggahan dibatalkan, unggah file identik kembali: BE mengembalikan 409 beserta impor yang sudah tercatat. FE membuka status impor itu dan tidak menganggapnya sebagai impor baru. Duplikasi ini juga berlaku pada impor yang gagal; API tidak menyediakan retry job.

## Pemantauan

Setelah penerimaan, URL menjadi `/transaksi-account/create?import={id}`. Refresh atau membuka ulang alamat melanjutkan pemantauan. FE memakai URL status dari definisi route, tidak mengikuti `status_url` yang tidak konsisten pada respons upload saat ini.

Polling berlangsung setiap 2 detik setelah request sebelumnya selesai, berhenti pada completed/completed_with_errors/failed, dan dibatalkan saat meninggalkan halaman. Gangguan status menghentikan polling dan menyediakan tombol coba lagi; tombol ini hanya mengulangi GET status. Payload status divalidasi, termasuk kesesuaian ID, agar respons kosong atau salah tidak ditampilkan sebagai impor selesai.

Catatan baris ditampilkan per halaman setelah proses selesai. Catatan dapat mencakup baris duplikat yang dilewati, sehingga jumlah catatan tidak diasumsikan sama dengan failed_rows. API status saat ini tidak mengembalikan skipped_rows; FE tidak mengarang jumlahnya.

## Dua masalah pada sumber BE saat integrasi

1. Route status dan error menggunakan parameter `{import}`, tetapi controller menerima `LedgerImport $ledgerImport`. Implicit model binding memerlukan nama yang cocok. Ubah kedua placeholder menjadi `{ledgerImport}` beserta `whereNumber('ledgerImport')`, atau selaraskan parameter controller. URI konkret tetap sama. FE mendeteksi respons status dengan ID kosong/tidak cocok dan menampilkan kesalahan.
2. `QUEUE_WORKER_BAT` pada LedgerImportController dan direktori pada start-queue-worker.bat masih mengarah ke folder D: lama. Path pemicu perlu menunjuk file BAT pada project yang aktif, dan BAT dapat memakai `cd /d "%~dp0"`. Worker yang sudah berjalan tetap dapat memproses antrean meskipun pemicu mengembalikan false. FE menampilkan pemberitahuan bila worker_triggered=false.

Respons upload juga membentuk status_url sebagai /api/ledger-imports/{id}, sedangkan route yang tersedia adalah /api/imports/ledger/{id}. FE memakai route yang tersedia. Masalah-masalah ini dicatat dari pembacaan kode; sumber BE tidak diubah dalam tugas FE ini.

## Verifikasi

TypeScript, ESLint, build Vite, dan browser diuji dengan server HTTP tiruan yang menyimpan state dalam memori. Unggahan payload uji 20 MiB dikirim sebagai multipart melalui HTTP nyata; ini menguji jalur pengiriman, bukan parser Excel BE. Uji lain mencakup batas >50 MiB, submit ganda, progres, reload/resume, polling berurutan dan berhenti, duplikat 409, pembatalan, HTTP 413/422/429, status malformed/gagal, pagination ledger/catatan, filter impor pada request pertama, format uang besar, dan layout mobile.

Tidak ada upload ke BE asli, worker, migrasi, seeder, atau operasi tulis database yang dijalankan.
