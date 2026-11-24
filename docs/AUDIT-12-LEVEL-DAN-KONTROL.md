# Audit permainan dan kontrol sederhana

Tanggal: 24 November 2026. Urutan level mengacu pada `AUDIT-ALUR-NUSUK.md`; jalur utama haji menggunakan qiran. Audit ini melanjutkan proyek Three.js/Vite yang ada, dengan format simpan dan aset yang sama.

## Audit pop-up dan notifikasi level

- Kedatangan dan garis awal merupakan checkpoint dalam Level 2. Pesan ini tidak lagi menyebut level selesai sebelum tujuh putaran tawaf dituntaskan.
- Judul hasil, ringkasan kegiatan dan tujuan berikutnya menggunakan urutan publik yang sama melalui `src/adventure/levelMessages.ts`. Nomor lama pada rekaman penyimpanan tetap dipertahankan.
- Sa’i haji menampilkan Level 3 → Level 4 Mina dan tetap dalam ihram. Mode Umrah tetap Level 4 Sa’i → Level 5 Tahallul; hasil Tahallul Umrah tidak menawarkan ihram haji/Mina.
- Level 7 Aqabah, Level 8 Dam dan Level 9 Tahallul memiliki konteks kegiatan masing-masing meskipun berbagi satu rekaman kawasan Jamarat. Notifikasi dam selesai muncul sesudah jawaban benar tersimpan.
- Pesan selesai Aqabah/Dam ditahan enam detik di bawah layar agar tidak tertimpa pembaruan penanda tujuan. Kesalahan penyimpanan tetap mendapat prioritas.
- Sambutan magic link membedakan pemain baru dan pemain dengan progres: pemain baru menuju Miqat, sementara pemain yang kembali membuka peta untuk melanjutkan checkpoint atau hasil tersimpan.
- Hasil kegiatan lapangan muncul di bawah layar. Saat Aksi membuka pilihan, dialog menampilkan level, judul kegiatan dan penjelasan yang terkait, termasuk hasil dan tujuan lanjut.
- Membuka ulang level yang selesai tidak menyatakan seluruh permainan selesai. Pesan penutup seluruh petualangan hanya muncul di akhir Wada’ jika semua 12 level lengkap; save parsial tetap menawarkan melengkapi level.
- Dialog bacaan Miqat/Tawaf menampilkan nomor level dan nama pembimbing. Dialog halaman Sa’i/Tahallul mendapat label aksesibilitas, fokus tombol dan pembatas perpindahan Tab. Panel bisa digulir dalam landscape dan tombol berukuran minimum 44 px.

Pemeriksaan khusus: `node tools/level-popup-qa.mjs` menggunakan checkpoint terpisah, klik tombol yang terlihat, serta emulasi HP landscape dan desktop. Laporan: `qa-output/level-popup-qa.json`. Pemeriksaan ini menguji isi/arah dialog dan penyimpanan, tidak mengulang semua tujuh putaran/lintasan yang telah diuji pada suite permainan sebelumnya.

Hasil audit pop-up: **18 pemeriksaan browser lolos**, tanpa galat JavaScript. Termasuk konteks semua 12 level, pembeda Haji/Umrah, jawaban salah/benar Dam, save parsial Wada’, main ulang level pada save lengkap, fokus keyboard dan sambutan magic link baru/kembali. TypeScript, build produksi, pemeriksaan PWA dan integritas rilis lolos; 321 tes inti, 5 tes kebijakan rilis dan 4 tes pendaftaran juga lolos pada audit ini. Perangkat HP fisik belum diuji.

## Perubahan tampilan

- Kiri atas: level berjalan dan hitungan kegiatan yang relevan.
- Kanan atas: satu tombol Pengaturan. Suara, kamera, grafis, bantuan dan peta dipindahkan ke menu ini jika tersedia pada arena tersebut.
- Kiri bawah: joystick. Kanan bawah: Lari dan Aksi. WASD/panah, Shift dan E tetap bekerja pada desktop.
- Petunjuk utama ditampilkan singkat di bawah. Materi bacaan dan pilihan jawaban tetap tersedia melalui dialog saat diperlukan.
- Radio percakapan rombongan, buku panduan dan bantuan kontrol tetap tersedia dari menu. Panel tutorial lama tidak lagi menumpuk di atas arena.
- Tas, indikator kondisi/kekuatan, dan penalti lelah/lapar/haus dihapus dari permainan aktif. Rekaman kondisi lama tidak dihapus atau ditulis ulang.
- Aksi menggunakan kegiatan level yang sudah ada: mendekati penanda, berinteraksi, memilih jawaban, melontar kerikil, konfirmasi cukur atau melanjutkan ritual. Jika ada beberapa pilihan, Aksi membuka pilihan tersebut.
- Saat mengemudi bus, tombol Lari berubah menjadi Rem. Joystick tetap mengendalikan arah dan laju kendaraan.
- Papan lokasi memudar saat terlalu dekat dengan kamera sehingga tidak menutup pandangan pemain.

## Cakupan level

| Level | Kegiatan yang harus dapat dimainkan |
|---|---|
| 1 Miqat & Ihram | Pembimbing, ruang pakaian, buku, niat, talbiyah; progres kembali setelah muat ulang |
| 2 Tawaf Qudum | Perjalanan ke Ka’bah, rombongan, titik penting, titik awal dan tujuh putaran |
| 3 Sa’i | Keluar dari pelataran ke Safa, tujuh lintasan dan konfirmasi akhir di Marwah |
| 4 Mina Tarwiyah | Bekal, perjalanan, tenda, salat, bantuan jemaah, bermalam dan Subuh |
| 5 Arafah | Perjalanan dari Mina, batas Arafah, salat, doa, bantuan jemaah dan menunggu terbenam |
| 6 Muzdalifah | Kedatangan malam, Magrib–Isya, bantuan jemaah, tujuh kerikil, istirahat dan fajar |
| 7 Aqabah | Koridor petugas, identifikasi Aqabah dan tujuh lontaran nyata |
| 8 Hady/Dam | Pilihan pembelajaran pelaksanaan melalui pihak berwenang; tidak ada transaksi kurban |
| 9 Tahallul Awal | Petugas melakukan tiga tahap tindakan cukur; hasil rambut tersimpan |
| 10 Ifadah | Tujuh putaran, salat tawaf dan Zamzam; Sa’i yang sudah dilakukan tidak diulang |
| 11 Tasyrik | Ula → Wustha → Aqabah masing-masing tujuh lontaran per hari; nafar awal/tsani |
| 12 Wada’ | Tujuh putaran perpisahan dan penyelesaian tersimpan |

## Verifikasi

Jalankan `npm run qa:simple` setelah `npm run build` dan preview aktif pada port 4173. Suite `tools/simple-play-qa.mjs` memakai konteks browser terpisah dari pemain. Interaksi dilakukan melalui tombol yang terlihat, keyboard atau joystick, tanpa memindahkan koordinat karakter secara langsung. Bagian `early`, `field`, `late`, `bus` dan `smoke` dijalankan berurutan untuk membatasi beban grafis.

Hasil terukur dan batas cakupan dicatat di `qa-output/simple-*-qa.json`. Perjalanan bus dan penyimpanan lama juga memiliki pemeriksaan terpisah. Emulasi landscape bukan pengukuran performa HP fisik.

Hasil akhir:

- **12 level lolos pemeriksaan alur permainan**, dalam lima kelompok browser dengan 16 pemeriksaan utama dan tanpa kesalahan JavaScript yang tidak tertangani.
- Miqat dimainkan lengkap termasuk pemulihan buku setelah muat ulang. Perjalanan ke Ka’bah, empat titik penting, **tujuh putaran Qudum dan tujuh lintasan Sa’i** dimainkan dari awal.
- Semua kegiatan Mina, Arafah, Muzdalifah dan rangkaian Aqabah–Dam–Tahallul dimainkan. Pemeriksaan kegiatan dimulai dari rekaman kedatangan terminal yang valid; satu perjalanan bus Mina → Arafah dikemudikan penuh melewati seluruh gerbang rute, parkir, turun dan menemui pemandu.
- Ifadah dan Wada’ dilanjutkan dari checkpoint **6/7**, lalu dimainkan putaran terakhirnya. Ifadah diteruskan ke salat tawaf dan Zamzam tanpa mengulang Sa’i.
- Tasyrik mencakup 42 lontaran hari 11–12, pilihan nafar awal, serta cabang nafar tsani dengan 21 lontaran tambahan hari 13.
- Joystick benar-benar menggerakkan karakter. Lari, jeda menu, perubahan grafis dan rotasi portrait/landscape diperiksa. Percakapan radio, tahallul perempuan dan checkpoint cukur umrah juga tetap bekerja.
- Save lama tetap menunjukkan **12/12 dan 710 koin**; ID dan isi rekaman lama tidak berubah.
- Build berhasil: **321 tes inti**, 5 pemeriksaan kebijakan rilis, 4 tes server pendaftaran, pemeriksaan PWA 16 rute dan integritas 22 halaman/127 berkas.

Temuan yang diperbaiki meliputi urutan pemilihan aksi ketika ritual selesai, status jeda saat memilih jawaban, penggandaan kecepatan lari pada satu arena lama, status lari yang terbawa menjadi rem saat naik bus, petunjuk konfirmasi melihat Ka’bah, akses radio melalui menu, serta papan lokasi yang menutupi kamera.

Batas pengujian: Chrome desktop dan emulasi HP landscape 844 × 390 dengan grafis rendah/SwiftShader. Pengukuran performa HP fisik, Safari/iOS, Android nyata dan pemeriksaan audio yang terdengar masih perlu dilakukan sebelum rilis luas. Pembayaran tidak termasuk perubahan ini.
