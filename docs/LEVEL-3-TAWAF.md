# Level 3 — Tawaf Umroh di arena yang tersambung

> Penomoran dokumen ini mengikuti tahap implementasi sebelumnya. Urutan publik terkini mengikuti [audit Nusuk](./AUDIT-ALUR-NUSUK.md): Miqat 1, Qudum 2, Sa’i 3, Mina 4, Arafah 5, Muzdalifah 6, Aqabah 7, dam 8, tahallul haji 9, Ifadah 10, tasyrik 11, Wada’ 12. Tahallul umrah hanya tersedia pada mode Umrah.

Tombol **LANJUT LEVEL 3 · Tawaf Umroh** pada akhir Level 2 mempertahankan pemain, canvas, dan pelataran yang sama. Perjalanan Haji tidak membuka arena pengganti atau menaikkan pemain ke bus pada sambungan ini. Jalur Umroh lama dan bookmark arena lama tetap tersedia.

## Alur bermain

1. Datangi empat penanda pengenalan: Hajar Aswad/garis awal, Maqam Ibrahim, Hijr Ismail, dan Rukun Yamani. Cari tempatnya sendiri menggunakan petunjuk radio, lalu buka penjelasan saat mendekat. Pembimbing tidak hadir sebagai NPC dan tidak perlu ditunggu. Penanda tempat muncul dalam jarak delapan meter; bantuan petunjuk membuka penanda selama 12 detik tanpa memindahkan pemain. Penjelajahan tidak menambah putaran.
2. Kembali ke garis awal. Pilih **MULAI TAWAF · 7 PUTARAN**, atau lanjutkan checkpoint lama bila sudah ada.
3. Berjalan dengan WASD/stik atau **Ikuti jalur tawaf**. Jalur latihan mengitari bagian luar struktur di arena, dengan Ka’bah di sebelah kiri. Setiap putaran melewati delapan sektor secara berurutan. Bantuan berjalan mengikuti titik kecil di sepanjang lengkungan, bukan memindahkan pemain.
4. Sesudah tujuh putaran, konfirmasikan hasil melalui radio dari tempat pemain berada. Baru setelah itu Level 3 selesai. Tombol berikutnya menampilkan headline LEVEL 4 · SA’I, lalu membuka perjalanan berjalan kaki menuju pintu Safa dalam arena yang sama. Setelah sampai, pemain masuk ke galeri Sa’i.

Kamera bebas dapat digeser 360° dan ditundukkan/diangkat (pitch −64° sampai +60°). Geser ke atas untuk melihat langit; tombol Lihat menara & langit memberi pandangan ke siluet menara jam. Kamera tetap berada di atas lantai. Tombol bacaan menyediakan zikir dan makna dari data bacaan proyek. Jeda, bacaan, tas, tab tersembunyi, dan HP portrait menghentikan hitungan. Setelah berhenti, pemain dapat memakai bantuan berjalan lagi.

## Progres dan hitungan

- Pengenalan tempat memakai checkpoint peserta/karakter `manasik-continuous-tawaf-{avatar}-v1`. Membuka kembali halaman melanjutkan penemuan terakhir yang selesai.
- Putaran dan sektor tetap memakai save Tawaf lama `manasik-tawaf-quest-v1`, termasuk lap parsial. Tidak ada pemindahan atau penghapusan save lama saat memasuki Level 3.
- Hitungan memakai perpindahan sudut nyata, arah yang benar, kedekatan pada sektor berurutan, dan jalur yang ditentukan. Diam di garis awal, berjalan terbalik, bolak-balik di satu tempat, atau meloncat posisi tidak memberi putaran.
- Setelah keluar jalur, pemain kembali ke checkpoint terakhir sebelum hitungan berlanjut. Jika melanjutkan sektor lama setelah tur pengenalan, pemain berjalan kembali ke checkpoint itu tanpa memperoleh hitungan perjalanan pulang.
- Putaran dibatasi tujuh. Konfirmasi radio memakai tahap selesai lama, sehingga reward peta tetap berasal dari progres yang sama dan tidak digandakan.
- Data versi lebih baru dan data rusak tanpa backup tidak ditimpa dengan sesi baru. Kegagalan penyimpanan ditampilkan kepada pemain. Progres Miqat, kedatangan, Ifadah, Sa’i, dan rambut setelah Tahallul dipertahankan.

## Verifikasi

Tes model menjalankan tujuh sirkuit penuh, arah terbalik, diam/bolak-balik di garis awal, shortcut, pemulihan checkpoint, seluruh jalur penanda, versi data lebih baru, quota, dan penyelesaian satu kali. Pengujian browser `npm run qa:tawaf-connected` berjalan ke empat tempat, melanjutkan sektor lama, memeriksa jeda/reload/bacaan, menjalankan putaran ketujuh lengkap, dan membuka Sa’i pada layar HP. `npm run qa:tawaf-atmosphere` memeriksa pencarian manual tanpa NPC, radio/teks, jeda keramaian, kamera ke atas, panorama, fallback tanpa speech synthesis, checkpoint lama, serta tombol HP. Pengujian suara browser menggunakan mock untuk memeriksa instruksi dan volume; kualitas suara yang terdengar bergantung pada suara Indonesia yang tersedia di perangkat. Browser QA menggunakan Chrome dengan SwiftShader; pengukuran FPS pada HP fisik belum dilakukan.

## Suasana kawasan

96 / 168 / 224 jemaah bergerak tawaf sesuai grafis Rendah / Sedang / Tinggi. Profil rombongan Asia, Eropa, Afrika dan Arab masing-masing berisi variasi penampilan; warna kulit tidak dipakai untuk menebak negara seseorang. Tinggi, postur, kecepatan, pakaian dan fase langkah bervariasi. Jalur memutari struktur pusat dan menghindari kios Zamzam; jemaah melambat dekat pemain tanpa menjadi penghalang keras.

Crowd memakai VAT instancing/LOD proyek dan hanya jemaah baru dalam frustum kamera yang dikirim untuk digambar. Menara jam dan bangunan pendamping merupakan geometri orisinal bergaya visual proyek, bukan rekonstruksi survei. Panel radio memakai pengaturan suara/volume awal, caption persisten, ulang petunjuk, dan ambience tawaf sintetis yang sudah ada. Ambience mengecil selama instruksi suara. Pembimbing laki-laki tetap Pak Husen dan pembimbing perempuan tetap Bu Salma.

### Pengukuran render lokal

Profil adegan yang sama dijalankan tiga kali selama tiga detik pada Chrome headless + SwiftShader, viewport 844×390, DPR 0,65, grafis rendah. Rata-rata interval RAF per sampel: sebelum penambahan 64,1–78,5 ms; keramaian/detail baru tanpa culling 97,1–116,6 ms; sesudah culling 79,2–105,6 ms. P95 sesudah culling masih 200,4–283,8 ms pada renderer software ini. Penambahan detail tetap lebih berat dari versi awal dan data pendek ini dipengaruhi kompilasi shader; angka tersebut bukan klaim FPS HP. Laporan mentah tersedia di qa-output/tawaf-atmosphere-profile-{before,after,optimized}.json. Target HP fisik tetap perlu diukur.

Sesudah penempatan barisan dipindah ke sisi dalam untuk memperjelas keramaian, pengukuran final mencatat rata-rata interval RAF 81,4–107,0 ms dan P95 200,4–267,1 ms pada konfigurasi software yang sama. Laporan: qa-output/tawaf-atmosphere-profile-final.json. Angka prototipe sebelumnya tidak menggambarkan penempatan barisan final; keduanya tidak menjadi jaminan FPS perangkat pemain.
