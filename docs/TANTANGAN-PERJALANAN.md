# Kondisi tubuh dan ujian perjalanan

## Audit dan arah perubahan

Permintaan pemain: perjalanan terasa monoton bila hanya mengikuti penanda dan menekan aksi. Sistem lama sudah punya urutan ibadah, checkpoint, dialog, NPC, bus, aktivitas sampingan dan reward; belum ada kondisi tubuh, persediaan terbatas atau kebutuhan mencari tempat pemulihan.

GameDev Router memilih `survival-crafting`, `save-systems` dan `game-ui-ux`. Penerapannya mempertahankan Three.js 0.185.1, dunia, karakter dan progres lama. Tidak menambah crafting atau membangun ulang level. Fokus iterasi ini adalah siklus **menjelajah → menghadapi ujian → memilih bekal atau fasilitas → pulih → melanjutkan misi**.

## Mekanik yang tersedia

- Kesehatan, stamina, kenyang, air tubuh dan kebersihan. Kekuatan dihitung dari kesehatan, nutrisi dan kebersihan. Kondisi rendah mengurangi kecepatan; stamina/nutrisi rendah membatasi sprint di kawasan dan tiga petualangan rute lama.
- Tas berisi makanan dan air, maksimum empat porsi dan empat botol. Makan/minum menghabiskan satu item setelah aksi satu detik selesai. Membatalkan aksi tidak menghabiskan item.
- Pos berbendera hijau menyediakan isi bekal (2 detik), istirahat (3 detik), dan mandi di sanitasi (4 detik). Pemain harus berada dalam radius 2,2 meter. Mandi saat ini berupa interaksi fasilitas dengan indikator waktu, belum animasi tubuh mandi.
- Penanda tas jingga muncul ketika bekal tercecer. Pemain harus berjalan kembali mengambilnya; pengambilan hanya memberi persediaan sekali.
- Ujian selesai menambah hitungan **ketangguhan perjalanan**. Reward dan validasi ibadah lama tetap memakai sistem aslinya.

| Ujian | Dampak | Cara menyelesaikan | Bab awal |
|---|---|---|---|
| Bekal tercecer | Satu makanan dan satu botol hilang sementara | Dekati tas jingga dan ambil | Kawasan, Miqat, persiapan ihram Haji, Wada |
| Terik | Air −27, stamina −18 | Minum dan istirahat di pos | Kedatangan, Arafah, Ifadah |
| Kelelahan | Stamina −42, kenyang −15 | Makan dan istirahat di pos | Sa’i, Muzdalifah |
| Debu | Kebersihan −40 | Mandi di sanitasi; minum bila tubuh kekurangan air | Tahallul, Mina |
| Arus padat | Kecepatan ×0,65 di lingkaran jingga | Terus berjalan tenang atau keluar melalui samping; tempuh 32 meter lagi | Tawaf, Aqabah |

Ada satu ujian tersimpan per bab, bukan penalti acak yang terus menumpuk. Ujian yang belum selesai ikut ke bab berikutnya dan dapat diselesaikan di fasilitas bab tersebut. Setelah itu bab saat ini dapat memunculkan ujiannya sendiri. Sebelas level persiapan klasik memakai variasi bekal, kelelahan dan debu. Bab pendek memakai ambang 1,5–10 meter; level klasik 3 meter; rute panjang 24 meter.

## Keseimbangan dan pemulihan

Kebutuhan hanya turun saat permainan aktif. Tidak ada pengurangan selama tab tersembunyi, menu tas, dialog, pause atau layar rotasi HP. Tidak ada kebutuhan offline. Berjalan menguras stamina jauh lebih lambat daripada sprint; diam memulihkan stamina. Bus tidak dihitung sebagai jarak berjalan.

Kesehatan minimum 20 dan kecepatan dasar minimum 55% sebelum pengaruh area padat. Pemain tetap dapat mencapai pos ketika seluruh bekal habis. Pos tidak meminta mata uang sehingga perjalanan dapat dipulihkan. Tes simulasi pada tiga iklim memastikan peringatan air datang setelah beberapa menit berjalan dan masih menyisakan lebih dari 150 detik sebelum kosong. Nilai ini perlu playtest manusia untuk penyesuaian tingkat kesulitan.

## Penyimpanan dan kontrol

`manasik-life-v1` memakai scope akun/tenant yang sama dengan save pemain, terpisah dari quest, checkpoint, sertifikat dan reward. Data tervalidasi, cadangan save sebelumnya, perlindungan versi lebih baru dan penanganan kuota diterapkan. Perubahan tab lain membatalkan aksi tas yang tertunda; pemeriksaan nilai sebelum menulis membantu mencegah konsumsi berdasarkan data lama. Ini penyimpanan lokal browser dengan deteksi konflik, bukan transaksi server atau sinkronisasi kondisi tubuh ke cloud.

HUD **Tas & kondisi** menampilkan kekuatan, stamina, kenyang, air, persediaan dan jarak pos. Dialog menghentikan input, menjaga fokus keyboard, menggunakan tombol minimal 44 px dan bisa digulir di HP landscape. Rotasi portrait membatalkan aksi tertunda dan menutup tas.

## Validasi

Jalankan `npm run test:core`, `npm run qa:life`, `npm run qa:adventure`, `npm run qa:places`, dan `npm run build`. Untuk produksi, gunakan `node tools/life-qa.mjs --production`, `node tools/classic-cast-qa.mjs`, `node tools/place-presentation-qa.mjs --production` dan `node tools/campaign-qa.mjs --production`. Jalankan suite browser secara berurutan.

- 18 tes model kondisi tubuh mencakup lima solusi ujian, persediaan habis, radius fasilitas, tidak ada penalti saat pause, pemulihan kelelahan, variasi iklim, waktu peringatan kebutuhan, kompatibilitas/cadangan/future save dan kegagalan penyimpanan. Pemain yang sudah cukup air tidak dipaksa membuang minuman untuk menyelesaikan sanitasi.
- Suite lengkap 249 tes lulus sebelum perapian UI terakhir dan tambahan satu kasus sanitasi. Build akhir mengulang 170 tes inti dalam 26 file, termasuk seluruh 18 tes kondisi, serta lima tes kebijakan rilis. Pemeriksaan PWA/integritas: 22 entry, 110 file, 16 rute publik, dan isolasi halaman privat lulus.
- Enam kelompok QA kondisi development lulus: konsumsi bertimer dan pembatalan; jalan nyata memicu bekal tercecer, mengambil tas sekali, mendatangi pos, isi bekal/istirahat/mandi; future save; backup dan kuota; konflik tab; kontrol landscape/rotasi. Lima kelompok produksi mengulang aspek tas/save/UI; jalan ke fasilitas memakai diagnostik posisi development dan diuji pada suite development.
- Tujuh kelompok regresi petualangan lama serta tiga kelompok kawasan bus lulus. Ini termasuk checkpoint nyata Tawaf/Sa’i, interaksi Tahallul perempuan, bus hingga parkir/turun, reward 100, save lama, dua pointer sentuh dan orientasi.
- Semua 12 bab, dua arena sekunder dan dialog mobile lulus smoke/interaksi panel. Semua 11 level persiapan klasik lulus startup dan membuka tas, bergantian avatar; ini tidak mengulang setiap misi persiapan.
- Kampanye produksi lulus sepuluh kelompok, berakhir 12/12 dan 710 koin, termasuk 42 lontaran nafar awal serta 21 lontaran tambahan nafar tsani pada landscape. Bab 03–05 menggunakan fixture selesai dalam suite kampanye dan diuji terpisah pada regresi rute. Ifadah/Sa’i/Wada dimulai dari 6/7 dan menjalankan satu putaran/lintasan terakhir, bukan endurance 7/7 dari awal.

Perapian terakhir hanya memperjelas jumlah bekal pada panel dan memperbaiki susunan HUD klasik/tablet. Build kemudian diperbarui dan QA produksi tas serta 11 level klasik diulang. Laporan gabungan: `qa-output/life-audit-validation.json`. Pengujian memakai konteks Chrome terisolasi dan SwiftShader; tidak mengubah save browser pemain dan tidak membuktikan FPS HP fisik. Keseruan, kenyamanan jangka panjang dan animasi tindakan tubuh masih memerlukan playtest/iterasi berikutnya.
