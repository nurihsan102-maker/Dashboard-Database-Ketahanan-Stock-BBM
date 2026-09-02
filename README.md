# Dashboard Ketahanan Pasokan BBM

Dashboard analisis ketahanan stock Pertamina Retail dari file excel laporan pukul 12:00 dan 18:00 WIB.

## Fitur

1. Upload file excel, sistem membaca langsung dan menyimpan hasil parsing ke database. File asli tidak disimpan.
2. Panel kiri untuk kelola riwayat data lengkap dengan tanggal dan tipe laporan, bisa diedit dan dihapus.
3. Section Lengkap dan Terpisah dengan filter produk, ownership, dan region.
4. Kartu Ketahanan Stock Pertamina Retail per tanggal dan jam.
5. Tabel Status Stock per region dengan indikator naik turun dan tindak lanjut otomatis.
6. Tabel Coverage Day per region.
7. Perbandingan gap antara laporan 1200 dan 1800 pada tanggal yang sama.

## Setup

npm install
cp .env.example .env.local
npm run dev

## Environment variables

| Variabel | Keterangan |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | URL project Supabase |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Anon key Supabase |

## Catatan parsing

Parser di lib/parseExcel.ts mendeteksi tiga jenis sheet berdasarkan kata kunci di isi sheet, yaitu Ketahanan Stock, Status Stock, dan Coverage Day. Jika struktur file excel asli berbeda dari contoh laporan, heuristik di file tersebut perlu disesuaikan dengan file nyata.
