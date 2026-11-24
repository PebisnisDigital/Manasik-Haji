# Gerbang, Bu Salma, dan perjalanan ke misi

**Catatan historis:** alur terkini memakai Pak Husen untuk pemain laki-laki, Bu Salma untuk pemain perempuan, dan pendaftaran transfer manual. Lihat [Gerbang pendaftaran](./GERBANG-PENDAFTARAN.md). Isi di bawah mencatat iterasi sebelumnya.

Permintaan terbaru menunda pembayaran. Versi ini berfokus pada alur bermain: gerbang 3D → persiapan → pertemuan Bu Salma → perjalanan bus → misi. Tidak ada pungutan, QRIS contoh, status bayar palsu, pengumpulan nomor WhatsApp, atau tombol yang mengaku sudah mengirim akses.

## Alur pemain

1. `index.html` dan `index.html?lobby=1` menampilkan gerbang 3D lama dengan petunjuk tiga langkah dan tombol mulai. Pemain yang sudah mengikuti pengarahan dapat melanjutkan perjalanan.
2. `index.html?setup=1` mempertahankan pilihan Haji/Umroh, karakter, suara, volume, dan grafis. Nama panggilan bersifat opsional. Pengaturan mengarah ke pertemuan pemandu.
3. `index.html?guide=1` memakai courtyard yang sama. Pemain dapat berjalan atau menekan Temui Bu Salma untuk mendekati NPC perempuan. Dialog tidak memiliki batas waktu. Empat bagian menjelaskan tujuan, kebutuhan tubuh/bekal, kontrol, checkpoint, dan keberangkatan. Pemain bisa kembali membaca bagian sebelumnya atau menutup dialog.
4. Pemain baru berangkat dengan bus ke misi pertama. Perjalanan Haji yang sudah memiliki checkpoint menuju peta untuk melanjutkan tanpa mereset data.
5. Mode `district.html?transfer=hajj:miqat` memakai dunia kawasan dan bus yang sudah ada. Rute sekitar 160 m melewati jalan selatan, barat, utara, lalu terminal timur. Pemain mengemudikan sendiri. Garis rute, petunjuk belokan, joystick, rem, pause dan kamera lama tetap berfungsi.
6. Setelah parkir dan berhenti, pemain turun, menemui Bu Salma, dan menekan Mulai Level. Kedatangan pertama tercatat; membuka checkpoint misi tidak memaksa mengulang perjalanan bus tersebut.

Peta Haji dan tautan lanjut yang menggunakan HUD petualangan mengarahkan misi baru melalui perjalanan bus setelah pemain mengikuti pengarahan. Jalur Umroh menggunakan lima tahap yang sama; transisi tahap berikutnya memeriksa kedatangan sebelum membuka arena. Tautan bookmark lama tetap bekerja. Rute kota adalah kawasan latihan fiktif, bukan ukuran atau jalur transportasi ibadah nyata.

## Data dan kompatibilitas

- `manasik-travel-story-v1` menggunakan scope akun/tenant dari helper pemain. Isinya nama panggilan, status pengarahan, dan daftar kedatangan; tidak berisi pembayaran atau reward.
- `manasik-transfer-<program>:<stop>-v1` menggunakan scope kawasan yang sudah ada. Tahap dan nomor waypoint disimpan terpisah untuk setiap tujuan. Checkpoint mengembalikan bus ke titik rute yang sudah dicapai, bukan mengubah misi kawasan lama.
- Penyimpanan story tervalidasi, memiliki backup, menolak future version pada primary maupun backup, serta melaporkan kegagalan kuota. Format core, quest, kehidupan, reward dan sertifikat tetap digunakan.
- Tulisan tampilan menggunakan Level. Nama pintu geografis seperti Bab as-Salam tetap merupakan nama tempat, bukan label progres.
- Lobby latihan terdahulu tetap dapat dibuka melalui `index.html?legacyLobby=1`.

## Rencana akses berbayar (ditunda)

Konsep berikut disimpan untuk tahap berikutnya: tiket Rp100.000, kode diskon, QRIS, akses pribadi yang dapat dipakai kembali, dan kirim link melalui WhatsApp. Implementasi pembayaran tidak masuk build ini. Nantinya harga/diskon, notifikasi provider, penerbitan tiket dan pemeriksaan akses harus berada di server; localStorage tidak boleh menjadi bukti pembayaran. Link pribadi perlu dapat dicabut dan sesi aman. Pengiriman WhatsApp memerlukan akun pengirim dan template layanan yang terhubung.

## Pengujian

`npm run test:core` mencakup 204 tes: 180 sebelumnya, 13 tes story/rute, dan 11 tes penampilan. Tes baru memeriksa validasi, backup/future data, kuota, isolasi checkpoint lama, perjalanan satu kali per tujuan, kelayakan stop, dan collision bus sepanjang rute. `npm run qa:entry` menguji alur gerbang hingga arena dengan input nyata; tambahkan `-- --production` untuk build. Laporan browser berada di `qa-output/travel-entry[-production]-qa.json`. Uji browser dijalankan berurutan. Chrome/SwiftShader memeriksa fungsi dan layout; perangkat HP fisik tetap membutuhkan playtest.

