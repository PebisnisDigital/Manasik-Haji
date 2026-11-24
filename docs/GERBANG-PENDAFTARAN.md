# Gerbang pendaftaran HAJII.DIGITAL

Alur terbaru menggantikan halaman depan dan panduan Bu Salma bersama yang dijelaskan pada dokumen sebelumnya. Pilihan ini menentukan pendamping, bukan pilihan Haji/Umroh:

| Karakter pemain | Penjaga gerbang, pemandu pendaftaran, radio bus, pendamping terminal |
|---|---|
| Laki-laki | Pak Husen |
| Perempuan | Bu Salma |

## Alur pemain

1. Buka `index.html`. Gerbang 3D tampil dengan pilihan karakter.
2. Pilih karakter, lalu berjalan menuju penjaga yang sesuai, klik tokohnya, atau gunakan tombol **Temui…**. Penjaga lain mengarahkan pemain ke pendampingnya.
3. Percakapan lima bagian: perkenalan, tujuan/misi, kontrol PC/HP dan bus, bekal/kondisi tubuh, lalu cara mendaftar. Pemain dapat kembali membaca atau meninggalkan percakapan.
4. Pemandu memberikan formulir nama peserta, WhatsApp, pilihan Haji/Umroh, dan persetujuan penyimpanan data pendaftaran. Suara/grafis/karakter juga tetap dapat diatur dari gerbang.
5. Server menyimpan nomor pendaftaran dengan status **pending**. Petunjuk: tiket Rp100.000, BCA **1480945529**, a.n. **VINI J**. Nomor rekening bisa disalin.
6. Pemain mengirim nama pengirim dan waktu/referensi transfer: status menjadi **reported / menunggu pemeriksaan admin**. Laporan pemain tidak mengaktifkan tiket.
7. Setelah admin memeriksa mutasi bank dan menyetujui nomor tersebut, status **approved** memunculkan popup **BUKA MAGIC LINK** di formulir. Status diperiksa berkala tanpa menghapus isian yang sedang diketik. Admin juga mendapatkan magic link dari perintah persetujuan dan dapat mengirimkannya secara manual kepada pendaftar.
8. Klik magic link: server memeriksa token dan memulihkan karakter/perjalanan. Popup **Selamat bermain di HAJJI.DIGITAL** berisi doa agar menjadi haji mabrur dan penuh keberkahan. Permainan menunggu tombol **MULAI MAIN**.
9. Pemain mulai di depan ruang Miqat & Ihram bersama Pak Husen/Bu Salma. **Belum naik bus**. Enam tujuan fisik: temui pembimbing → masuk ruangan → pakaian ihram → buku dan niat → talbiyah → lapor kepada pembimbing. WASD/stik HP atau bantuan berjalan menuju penanda; interaksi hanya aktif setelah mendekat.
10. Buku diambil, contoh niat dibaca, lalu pemain menjawab cek pemahaman. Talbiyah dipelajari dalam tiga bagian dan bacaan lengkap. Pakaian berubah pada ruang ganti; rambut tidak berubah. Buku dapat dibuka kembali dari bantuan.
11. Menyelesaikan semua tujuan mengisi progres Miqat lama (0 → 1) satu kali. Tombol LANJUT LEVEL 2 mengajak pembimbing berjalan dari posisi yang sama ke pelataran Ka’bah, tanpa bus atau perpindahan ke peta. Peta tetap tersedia sebagai pilihan. Bus tetap tersedia untuk perjalanan lain. Checkpoint Miqat baru terpisah menurut program/karakter; checkpoint Tawaf/Sa’i, id lama, dan rambut yang sudah tahallul dipertahankan. Reload melanjutkan tujuan terakhir yang selesai.

Pada localhost terdapat penanda pengujian: **jangan mentransfer uang hanya untuk mencoba alur**. QA memakai database terpisah dan laporan transfer buatan, tanpa transaksi bank.

## Menjalankan lokal

Node 26 yang tersedia pada workspace menyediakan `node:sqlite`; tidak ada paket backend tambahan.

```powershell
npm run registration:server
npm run preview
```

API berjalan pada `127.0.0.1:4180`. Vite dev 5173 dan preview 4173 meneruskan `/api/registration` ke API tersebut. Server yang sama dapat menyajikan `dist` di 4180. Jalankan ulang preview bila konfigurasi proxy berubah. UI menampilkan gagal tersambung dan tombol coba lagi bila API belum berjalan; tidak mengaku berhasil menyimpan atau membayar.

Data ada pada **private-data/registration.sqlite**, diabaikan Git dan tidak berada dalam `dist/public`. Cookie acak HttpOnly, SameSite=Strict menghubungkan browser dengan pendaftaran. Server menyimpan hash token, bukan token aslinya. API mengirim `Cache-Control: no-store`; service worker tidak menyimpan respons API. Nama/WhatsApp tidak dimasukkan ke localStorage atau cache PWA. Nama peserta/nomor kontak hanya untuk pendaftaran; belum ada pengiriman WhatsApp.

Admin lokal memeriksa nama pengirim, rekening tujuan, nominal, waktu/referensi pada mutasi bank sesungguhnya, kemudian:

```powershell
npm run registration:admin -- list
npm run registration:admin -- approve HJ-XXXXXXXXXXXX --bank-checked
```

Perintah hanya bisa menyetujui pendaftaran berstatus `reported`. Tidak ada API persetujuan untuk pemain. Jangan menyetujui pendaftaran sungguhan berdasarkan laporan pemain saja. `REGISTRATION_DB` dapat mengubah lokasi database; server dan admin harus memakai lokasi yang sama.

Perintah `approve` kini mencetak **magic link pribadi**. Set `REGISTRATION_PUBLIC_URL` ke URL `index.html` HTTPS milik game sebelum mengirim link ke pemain di luar komputer lokal. Link localhost hanya bisa dibuka pada komputer yang menjalankan server.

```powershell
# Terbitkan link tambahan untuk tiket yang sudah disetujui
npm run registration:admin -- link HJ-XXXXXXXXXXXX
# Cabut semua link dan sesi akses dari link tersebut
npm run registration:admin -- revoke-links HJ-XXXXXXXXXXXX
```

Token acak hanya disimpan sebagai hash di SQLite. Token dikirim di fragmen URL, bukan query server, lalu ditukar dengan cookie HttpOnly lewat POST. Fragmen dibersihkan setelah dibaca. Satu link bisa dipakai berkali-kali, termasuk di browser/perangkat lain, selama tiket aktif dan link tidak dicabut. Penukaran link tidak mengeluarkan browser lama. Progres permainan masih lokal per browser; magic link tidak menyinkronkan checkpoint antarperangkat.

## Demo setelah pembayaran dan QRIS

Di preview localhost, buka obrolan penjaga lalu klik **Coba akses setelah pembayaran · DEMO**. Popup memperagakan akses setelah pembayaran dengan tombol **BUKA MAGIC LINK DEMO**. Bisa juga membuka `index.html?demo=magic`; karakter mengikuti pengaturan tersimpan. Tidak ada pendaftaran/tiket yang diubah menjadi lunas atau transfer uang. Demo membuka sambutan dan Level 1 yang benar-benar playable; tujuan yang diselesaikan menyimpan progres permainan pada browser ini.

Untuk QRIS sungguhan, provider pembayaran dan webhook terverifikasi belum tersambung. Ketika backend nantinya menerima pembayaran sah dan mengaktifkan tiket, komponen formulir yang sama sudah bisa memunculkan popup link otomatis. Mengubah pilihan/tombol atau query browser tidak mengesahkan pembayaran QRIS. Transfer bank saat ini tetap memerlukan pemeriksaan admin, lalu link dapat dikirim manual; WhatsApp otomatis belum tersedia.

## Kompatibilitas dan batas implementasi

- Formulir tidak menulis ulang core save, reward, checkpoint Sa’i/Tawaf, statistik hidup, atau penampilan. Karakter laki-laki yang sudah tahallul tetap botak.
- Checkpoint lama mempunyai tautan lanjut tersendiri; perubahan formulir tidak memaksa pembelian ulang atau menghapus latihan lama. `?legacyLobby=1` tetap tersedia.
- QRIS sungguhan, diskon, serta pengiriman akses WhatsApp otomatis belum diaktifkan. Magic link dari admin dapat digunakan lagi jika cookie hilang; penerbitan ulang link yang hilang masih dilakukan admin.
- Ini implementasi lokal alur pendaftaran dan verifikasi manual, **belum gerbang pembayaran untuk rilis publik**. Halaman/asset arena lama masih dapat diakses langsung agar bookmark/progres tetap berfungsi. Proteksi akses semua arena/asset, pemulihan akses, aturan pembelian, backup data, operasional admin, HTTPS/cookie Secure, dan konfigurasi hosting perlu diselesaikan sebelum menerima pembayaran publik. Pengaturan origin server untuk hosting tersedia melalui `REGISTRATION_ORIGINS`, dengan `REGISTRATION_SECURE_COOKIE=1` di HTTPS. API saat ini dipasang pada root domain; hosting di subdirektori perlu pemetaan proxy path yang sesuai.

## Verifikasi

- `npm run build`: pemeriksaan TypeScript, 257 tes inti, 5 tes kebijakan rilis, dan 4 tes backend pendaftaran/akses, lalu build/PWA/integritas semua entry.
- `npm run qa:magic`: magic link kedua karakter, sambutan dan MULAI MAIN menuju Miqat, penggunaan ulang di browser lain, link salah/dicabut, retry saat offline, checkpoint Ifadah/Sa’i/rambut lama, dan demo HP tanpa perubahan pembayaran. Data uji terpisah di `qa-output/magic-qa.sqlite`.
- `npm run qa:gate`: kedua pilihan karakter, klik model penjaga, percakapan, formulir, bank, laporan tidak dianggap lunas, persetujuan admin buatan, Miqat dengan pendamping sesuai, HP landscape/portrait, layar lebar, penyimpanan lama dan API offline. QA memiliki API 4181/database `qa-output/gate-qa.sqlite`, terpisah dari data pengguna.
- `npm run qa:tawaf-connected`: sambungan Level 2 → 3 dalam arena yang sama, empat penanda penting, save tawaf parsial, hitungan arah/sektor, putaran ketujuh, jeda/reload, dan kelulusan sebelum membuka Sa’i.
- `npm run qa:arrival`: sambungan Level 1 → 2 dalam canvas yang sama, pembimbing berjalan/menunggu, lima penemuan fisik, rombongan benar/salah, Ka’bah benar-benar terlihat di kamera, garis awal, checkpoint reload, progres lama, dan masuk latihan tawaf.
- `npm run qa:miqat`: Level 1 kedua karakter/program, jalan fisik ke setiap tujuan, pakaian, buku, jawaban niat salah/benar, semua bagian talbiyah, checkpoint reload, penyelesaian satu kali, progres lama, HP landscape/portrait dan fokus dialog.
- `npm run qa:entry -- --production`: fokus pada rute fisik bus lengkap, checkpoint reload, turun di terminal dan masuk arena. Pendaftaran diperiksa pada suite `qa:gate`.

Pengujian browser menggunakan Chrome + SwiftShader. Perangkat HP fisik dan pembayaran sungguhan belum diuji.
