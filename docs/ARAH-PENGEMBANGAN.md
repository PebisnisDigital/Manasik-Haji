# Arah pengembangan Petualangan Manasik 3D

Target produk: petualangan manasik berbasis cerita yang dapat dimainkan di browser desktop dan HP landscape. Pemain bersiap bersama rombongan, menjelajah kawasan, berinteraksi dengan NPC, membantu jemaah dan menjalani tahapan manasik melalui tujuan yang jelas. Kebebasan eksplorasi, kamera dan struktur misi menjadi arah pengalaman. Produksi konten dan aset bertambah secara bertahap di proyek Three.js yang sudah ada.

## Keputusan cakupan rilis — 22 November 2026

Pengguna memilih versi Haji lengkap: seluruh **12 bab pada peta kampanye Haji** harus playable sebelum rilis. Tiga bab lama atau beta kawasan saja tidak memenuhi cakupan ini. Roadmap persiapan klasik 35 level tetap merupakan mode terpisah; konten dan progresnya dipertahankan.

Rangkaian sasaran: Miqat & Ihram → Menemukan Ka’bah → Tawaf Umroh → Sa’i → Tahallul Umroh → Ihram Haji & Mina → Arafah → Muzdalifah → Aqabah & tahallul awal → Ifadah & Sa’i Haji → Mina & Tasyrik (dua pilihan nafar) → Tawaf Wada’. Arena manasik yang sudah ada dipakai kembali. Perluasan ini tidak memerlukan engine, dependensi, aset luar atau basis cloud baru.

Bab 01–02 dan 06–12 menggunakan record terpisah menurut bab, mitra dan akun. Bab 03–05 tetap membaca save aslinya. Peta menghitung 12 lencana dari hasil misi; tidak menganggap latihan Haji lama sebagai kelulusan bab baru. Reward baru dihitung dari bab selesai sehingga membuka ulang hasil tidak menggandakan koin. Lencana kampanye tidak menerbitkan sertifikat latihan dari potongan sesi.

Kriteria rilis: seluruh bab dapat dimulai dan ditamatkan, checkpoint/reload/transisi bertahan, kedua pilihan nafar bekerja, regresi mode lama lulus, build browser/subfolder/PWA tervalidasi, lalu kenyamanan/performa diuji pada Android dan iOS fisik. Materi manasik menggunakan panduan yang sudah ada dan masih memerlukan peninjauan pembimbing sebelum distribusi kepada jemaah. Pemeriksaan rujukan umum: [Nusuk — The Journey](https://hajj.nusuk.sa/Journey). Hasil QA otomatis dicatat terpisah dari uji perangkat dan peninjauan materi.

## Posisi saat ini

Fondasi petualangan sudah dapat dimainkan: satu kawasan, bus dengan kendali manual, lima tujuan utama, dua bantuan opsional, NPC, kamera third-person, navigasi dan checkpoint. Tawaf, Sa’i dan Tahallul tetap memakai level serta save sebelumnya. Mode persiapan klasik, latihan, akun dan fitur lama masih tersedia. Pengujian model/simulasi kini mencatat 218 tes lulus; bukti build dan alur browser ada di laporan audit. Tahap perhalusan mencakup crossfade animasi, roda bus bergerak, transisi kamera naik/turun dan percakapan NPC yang mengikuti progres.

Kampanye 12 bab kini terhubung: bab 01–02 dan 06–12 memakai arena manasik lama melalui sesi petualangan terpisah, sedangkan 03–05 mempertahankan arena/save asli. Uji browser development telah menamatkan sembilan bab baru, termasuk kedua pilihan nafar, dan memeriksa hasil 12/12 dengan fixture penyelesaian tiga bab lama. Ifadah, Sa’i Haji dan Wada diuji dari checkpoint 6/7 sampai putaran/lintasan terakhir; ini belum merupakan uji ketahanan dari 0/7 untuk seluruh rangkaian. Build produksi sudah lulus typecheck, 138 tes inti, 5 tes kebijakan rilis, audit 22 halaman dan pemeriksaan PWA. Kampanye juga lulus sepuluh kelompok uji browser produksi. Regresi tiga bab lama, navigasi lintas level, dialog NPC, pemulihan gagal simpan/grafis, Jeda/Escape dan sertifikat latihan lama lulus.

Visual menggunakan model prosedural stylized; NPC memakai perilaku sederhana dan kendaraan memakai model kinematik. Performa dan kenyamanan Android/iOS fisik serta peninjauan materi oleh pembimbing belum selesai. Status konten playable dibedakan dari kesiapan rilis publik.

## Urutan pekerjaan

| Tahap | Hasil yang dituju | Kriteria selesai |
| --- | --- | --- |
| 1. Satukan alur yang sudah tersedia | Kawasan → Tawaf → Sa’i → Tahallul → kembali ke rombongan; peta menunjukkan checkpoint dan tujuan berikutnya | Pemain baru memahami arah; save lama dapat dilanjutkan; bantuan opsional tidak memblokir level; pulang ke kawasan tersedia dari menu/penyelesaian |
| 2. Perhalus pengalaman bermain | Gerak dan transisi animasi, pergantian naik/turun bus, dialog yang lebih hidup, penataan lingkungan dan kamera | Mekanik yang sama terasa jelas dan responsif; aset konsisten; profil grafis memiliki hasil pengukuran di perangkat sasaran |
| 3. Tambah bab cerita satu per satu | Perluasan rangkaian haji pada roadmap, lengkap dengan tujuan, interaksi, checkpoint dan reward | Setiap bab diuji sampai selesai sebelum bab berikutnya; materi pembelajaran mengikuti konten yang ditinjau pembimbing; navigasi dan save tidak memutus progres |
| 4. Siapkan rilis browser | Optimasi ukuran/rendering, pengujian HP fisik, pemulihan error dan penyimpanan, distribusi build | Alur utama tuntas di desktop dan HP landscape; performa perangkat dicatat; regresi lama lulus dan build dapat direproduksi |

Tahap 1 sudah memiliki ringkasan perjalanan yang membaca save yang ada, tombol lanjut yang mempertahankan unlock lama, buku perjalanan lintas level, dan akses kembali ke kawasan. Uji browser development dan produksi sudah meliputi Sa’i → kawasan → Sa’i dengan lintasan/checkpoint/mitra yang sama, akses pulang dari ketiga level, serta pembaruan peta ketika progres berubah di tab lain. Penambahan ini tidak mengubah hitungan ritual, tidak memberi kelulusan otomatis dan tidak memindahkan pemain tanpa pilihan navigasi.

Bagian awal tahap 2 sudah diterapkan: pemain, NPC patroli dan Pak Hasan memakai transisi jalan–diam dari animasi lama; NPC patroli membelokkan arah tubuh secara halus. Roda bus berputar mengikuti jarak tempuh aktual, berbalik saat mundur, dan roda depan mengikuti kemudi. Kamera memadukan sudut/framing/fokus saat naik atau turun, mempertahankan orbit, serta langsung kembali saat respawn checkpoint. Preferensi sistem pengurangan gerakan menonaktifkan transisi baru dan perubahan FOV kecepatan. Perubahan ini tidak menambah field save atau mengubah tabrakan/kendali. Animasi karakter masuk pintu/duduk dan pengukuran HP fisik masih menjadi pekerjaan berikutnya; tahap 2 belum dianggap selesai.

Percakapan tahap 2 kini juga memiliki cabang pertanyaan untuk Farid, Salma, Hasan, Rizal dan jemaah. Pemain dapat meminta petunjuk tujuan aktif atau menanyakan peran tokoh, lalu kembali ke percakapan. Jawaban mengikuti status misi, alasan Hasan menunggu, paket yang sedang dibawa, bantuan yang selesai dan unlock level lama. Pertanyaan tidak mengubah checkpoint atau reward; penerimaan/penyerahan misi tetap memakai pilihan eksplisit. Ini percakapan yang ditulis dalam proyek, tanpa layanan chat, voice acting atau bab cerita baru. Animasi masuk kendaraan dan validasi perangkat fisik masih tersisa.


## Cakupan bab yang terhubung

| Bab | Misi/interaksi | Checkpoint dan hasil |
| --- | --- | --- |
| 01 Miqat & Ihram | Jalan ke persiapan, ikuti kartu panduan niat dan talbiyah | Selesai panduan; 50 koin |
| 02 Menemukan Ka’bah | Temui rombongan, kenali Ka’bah, temukan titik awal | Tiga kunjungan fisik tersimpan; 50 koin |
| 03 Tawaf Umroh | Arena petualangan dan pembimbing yang sudah ada | Save putaran/gate lama; hingga 110 koin |
| 04 Sa’i | Arena Safa–Marwah dan pembimbing yang sudah ada | Save lintasan/gate lama; hingga 110 koin |
| 05 Tahallul Umroh | Pembimbing, pilihan peragaan, potong rambut, kembali ke rombongan | Save avatar/metode/cuts lama; hingga 40 koin |
| 06 Ihram Haji & Mina | Persiapan ihram lalu berjalan ke perkemahan Mina | Batas bab setelah tiba di Mina; 50 koin |
| 07 Arafah | Jalan ke lokasi rombongan dan panduan doa | Batas bab sebelum Muzdalifah; 50 koin |
| 08 Muzdalifah | Jalan ke tempat bermalam, ambil tujuh kerikil | Tiap kerikil tersimpan; 50 koin |
| 09 Aqabah | Tujuh lontaran aktual, peragaan tahallul awal, panduan dam | Tiap lontaran dan transisi tersimpan; 50 koin |
| 10 Ifadah & Sa’i Haji | Tujuh putaran dan tujuh lintasan pada arena lama | Hitungan tersimpan per putaran/lintasan; 50 koin |
| 11 Mina & Tasyrik | Mabit, tiga jumrah per hari, pilihan nafar awal/tsani | 21 lontaran per hari, tahap tersimpan; 50 koin |
| 12 Wada | Tujuh putaran penutup pada arena lama | Hitungan per putaran, hasil bab dan total kampanye; 50 koin |

Koin maksimal dari 12 bab adalah 710; bantuan kawasan tetap dihitung terpisah dalam sistemnya yang lama. Lencana tidak digandakan saat membuka hasil bab kembali. Save kampanye baru bersifat lokal di browser; tidak dikirim sebagai sesi latihan lengkap ke akun/cloud.

## Status menuju rilis

- Selesai: konten playable pada 12 bab, checkpoint/reward, dua pilihan nafar, navigasi, kompatibilitas save lama dan build browser.
- Selesai: uji otomatis model/simulasi, alur browser development/produksi, pemulihan error dan regresi fitur yang terdampak.
- Belum dilakukan: pengukuran Android/iOS fisik, pemeriksaan kenyamanan dengan browser perangkat asli, dan peninjauan materi oleh pembimbing.
- Belum dilakukan: publikasi ke hosting. Perubahan saat ini lokal; belum dipush atau dideploy.

Pintu masuk: jalankan dev/preview lalu buka adventure-map.html. Bu Salma mengutamakan peta kampanye 12 bab; akses langsung Tawaf/Sa’i/Tahallul lama tetap ada. Bab pertama mengikuti karakter yang tersimpan, dan bab lapangan menyediakan Jeda dengan Escape untuk menutupnya. Bukti pengujian berada pada qa-output, termasuk release-readiness.json; direktori ini memang diabaikan Git.

## Batas pekerjaan setiap tahap

Fitur, aset dan progres lama dipertahankan. Perubahan save memakai validasi/backup atau record terpisah. Kemajuan dilaporkan berdasarkan alur yang benar-benar dapat dimainkan, hasil pengujian dan batas yang masih tersisa. Skala kota, kepadatan NPC dan kualitas aset disesuaikan dengan kemampuan browser/perangkat; target frame rate harus dibuktikan dengan pengukuran, bukan diasumsikan dari tampilan desktop.

Detail teknis dan bukti pengujian ada di [GAMEDEV-AUDIT.md](GAMEDEV-AUDIT.md) dan [DISTRICT.md](DISTRICT.md).


## Konsistensi kawasan dan karakter — 22 November 2026

Detail perjalanan bus menjadi acuan visual bersama. Keluarga arena mendapat fasad, material dan fasilitas lingkungan sesuai ruangnya; semua 12 bab mendapat radio percakapan pembimbing. Tokoh sederhana pada arena lama dan lapangan diganti dengan karakter VAT yang sudah dipakai distrik. Wajah, ibu jari, warna kulit dan arah permukaan mesh diperbaiki pada renderer bersama; pemeran persiapan klasik mempertahankan gesture lama dengan detail wajah tambahan.

Lihat [audit dan implementasi arena](PENINGKATAN-ARENA.md) untuk cakupan, manifest aset, pengujian, batas visual dan peningkatan model manusia berikutnya. Ini mempertahankan misi, aset arsitektur asli, checkpoint serta reward yang sudah ada.

## Ujian perjalanan dan kebutuhan karakter — 22 November 2026

Permainan kini menambahkan keputusan selama menjelajah: mengelola tenaga dan bekal, menghadapi terik, debu, kelelahan, kepadatan, atau mengambil kembali bekal tercecer. Pos bekal/sanitasi memberikan pemulihan yang membutuhkan kedekatan dan waktu aksi. Sistem dipakai bersama oleh kawasan bus, 12 bab Haji, arena ibadah utama dan 11 level persiapan klasik.

Ujian perjalanan mempunyai progres ketangguhan sendiri. Kebutuhan dibekukan saat menu/dialog/pause, tidak menguras tubuh secara offline, dan tidak menghapus checkpoint ibadah. Desain dan batas implementasi dijelaskan pada [TANTANGAN-PERJALANAN.md](TANTANGAN-PERJALANAN.md). Tahap ini menambah tekanan dan pilihan pemain; penyesuaian tingkat kesulitan selanjutnya perlu playtest untuk menilai keseruan, bukan hanya pengujian fungsi.

## Pintu masuk permainan

Halaman utama kini menjadi cover permainan: pilih Haji/Umroh, karakter, suara, volume dan grafis, lalu masuk ke peta node. Haji memakai 12 bab yang sudah ada; Umroh memakai lima tahap playable dari sistem Umroh. Mode bebas, kawasan bus dan level persiapan dipertahankan. Rincian alur, kompatibilitas dan pengujian ada di [MENU-PETUALANGAN.md](MENU-PETUALANGAN.md).
