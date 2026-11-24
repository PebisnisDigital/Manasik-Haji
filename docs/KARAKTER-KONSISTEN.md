# Karakter pemain yang konsisten

Acuan: karakter laki-laki dalam arena Ifadah pada gambar pengguna. Semua pemain memakai geometri wajah, kerangka 19 tulang, warna kulit, tinggi dan animasi dasar yang sama melalui `PlayerRenderer`. Perubahan hanya pada pakaian, pilihan laki-laki/perempuan, serta hasil tahallul. NPC tetap dapat memiliki warna pakaian dan penampilan yang berbeda.

## Perjalanan penampilan

- Awal perjalanan/gerbang: pakaian biasa. Laki-laki memakai atasan biru, celana dan sepatu gelap, serta rambut normal. Perempuan tetap berpakaian tertutup dan berhijab.
- Persiapan Miqat: pakaian biasa; setelah menyelesaikan persiapan, pakaian ihram berlaku pada perjalanan berikutnya. Arena ritual memakai pakaian ritual yang sudah ada.
- Peragaan cukur laki-laki: rambut hilang ketika peragaan selesai. Kepala tetap botak saat reload, pindah level, kembali ke gerbang atau mengganti pakaian. Mengulang misi tidak menumbuhkan rambut kembali.
- Pilihan memendekkan rambut yang sudah ada tetap tersedia; hasilnya rambut pendek. Jika pemain sebelumnya sudah mencukur, pilihan ini tidak menumbuhkan rambut kembali.
- Perempuan tetap memakai hijab dan peragaan potong ujung rambut; penyelesaian tahallul perempuan tidak membotaki karakter laki-laki.

Renderer dipakai di lobby, kawasan/bus, walker arena lapangan, Tawaf dan Sa’i inti, tiga petualangan lama, adegan kecil, serta pemain perjalanan persiapan klasik. Animasi/collision/misi/checkpoint lama tetap memakai sistemnya. Bentuk visual tetap stylized sesuai acuan, bukan model photoreal baru.

## Penyimpanan

`manasik-player-appearance-v1` memakai scope helper pemain yang sudah ada. Data hanya berisi versi, keadaan rambut, serta pakaian ihram. Primary dan backup tervalidasi. Future version pada keduanya tidak ditimpa. Kegagalan simpan dilaporkan sebagai false. Keadaan kepala botak bersifat menetap dan tidak mundur saat mengganti pakaian atau mengulang demonstrasi.

Save lama tetap dibaca: tahallul laki-laki yang sudah selesai memakai metode yang tersimpan; checkpoint inti setelah demonstrasi cukur, termasuk Ifadah/Mina/Wada, tetap tampil botak. Pembacaan tersebut tidak menulis ulang ID, nama, tahap, putaran, checkpoint, reward atau sertifikat lama.

Perubahan penampilan menggunakan event, bukan pembacaan localStorage setiap frame. Geometry/VAT pemain dibangun ulang hanya jika penampilannya berubah. Renderer NPC dan instancing lama tetap digunakan. Semua LOD mendukung rambut serta pakaian biasa dengan kerangka yang sama.

## Verifikasi

Sebelas tes penampilan mencakup validasi, perubahan pakaian, kepala botak menetap, pilihan trim, aturan karakter perempuan, future data pada primary/backup, pemulihan, kuota, pembacaan checkpoint lama tanpa migrasi, serta geometri/skin weights untuk tiga LOD. Ditambah 13 tes gerbang/perjalanan dan 180 tes sebelumnya: 204 tes inti pada 29 file.

`npm run qa:characters` menguji interaksi cukur sungguhan dari checkpoint 2/3, hasil langsung pada model pemain, reload, gerbang, kawasan, Sa’i, Ifadah 1/7, perjalanan klasik, serta karakter perempuan. Tambahkan `-- --production` untuk build. Laporan: `qa-output/character-consistency[-production]-qa.json`. Screenshot sebelum/sesudah dan arena acuan berada di folder yang sama. Pengujian grafis menggunakan Chrome/SwiftShader; ini bukan pengukuran kinerja HP fisik.

Pemeriksaan tambahan mempertahankan klik langsung pada tubuh pemandu setelah model lobby disatukan (`tools/guide-pointer-qa.mjs`). Status cukur pada cadangan yang valid juga dilindungi terhadap snapshot pakaian lama dan kegagalan penulisan primary. Regresi gabungan gerbang, karakter, pengaturan, kawasan, tiga petualangan, 11 persiapan klasik, dan pemulihan kampanye: `qa-output/entry-regression.json`.
