# Audit dan peningkatan suasana perjalanan

Patokan yang dipilih pengguna: kawasan bus yang sudah ada, dengan bangunan berlapis, material batu, kaca, penunjuk lokasi, jemaah beraktivitas, dan percakapan. Tetap Three.js 0.185.1 / Vite, memakai aset prosedural yang sudah ada. Tidak mengubah engine, namespace save, checkpoint, reward, atau urutan ibadah.

## Hasil audit

| Keluarga arena | Temuan | Perubahan |
|---|---|---|
| Distrik / perjalanan bus | Bangunan, fasilitas, dialog, karakter VAT sudah menjadi acuan | Pertahankan; wajah mendapat peningkatan dari mesh bersama |
| Bab 03–05 lama | Tokoh silinder/kepala bola; animasi tubuh terbatas; pelataran dan layanan kosong | Gunakan karakter VAT yang sama dengan distrik, detail perimeter, material dan cahaya lebih seimbang |
| Miqat, persiapan ihram, layanan akhir | Ruang dengan dinding dan kolom sederhana | Jendela, kabinet, panel lokasi, bingkai, lapisan material |
| Arafah, Mina, Muzdalifah | Tenda/alas dan jemaah sederhana; sedikit konteks kawasan | Fasilitas tepi perkemahan, pos, bangku, pagar, vegetasi; ganti jemaah dengan karakter VAT |
| Jamarat | Sasaran tersedia, lingkungan minim | Struktur layanan, pagar pengaman, kanopi, penunjuk pos di luar ruang berjalan |
| Haram dan Sa’i untuk Ifadah/Wada | Aset arsitektur lama lebih kaya, sudah layak dipertahankan | Tambah detail tepi yang konsisten, wajah bersama dan radio rombongan |
| Persiapan klasik, 11 level yang sudah playable | Ruang dan dialog sudah kontekstual; wajah tanpa detail | Pertahankan ruangan/interaksi; tambahkan mata, alis, hidung, telinga, bibir |

## Pelaksanaan

1. Peningkatan manusia memakai rig 19 tulang yang sama, dengan wajah dan ibu jari pada LOD dekat; jarak jauh mempertahankan siluet ringan. Mesh dan tekstur animasi tetap dibuat secara lokal. Memperbaiki konversi warna ganda pada palet renderer karakter.
2. Detail kawasan dibagi menurut keluarga arena dan digabung per material. Geometri dekorasi berada di luar batas berjalan; tidak menambahkan collider tersembunyi atau menggeser misi.
3. Dua belas percakapan rombongan ditulis sesuai bab. Radio memberi konteks cerita dan bantuan, tanpa aksi yang dapat memberi checkpoint atau koin. Dialog menghentikan gerakan dan membersihkan input saat dibuka/ditutup.
4. Validasi: kontrak mesh/LOD, ruang berjalan, batas draw call, cerita tiap bab; kemudian browser desktop/mobile, checkpoint lama dan build produksi. Hasil aktual dicatat setelah pengujian.

Peningkatan ini mengejar konsistensi dan keterbacaan petualangan dengan aset prosedural. Karakter belum merupakan manusia fotorealistis, belum memiliki gerak bibir atau motion capture. Bila kelak memakai model GLB manusia, model harus punya izin distribusi, rig/animasi kompatibel, LOD serta tekstur terkompresi, lalu diuji pada HP fisik sebelum menggantikan pemeran yang ada.

## Temuan karakter dari inspeksi visual

Kamera QA jarak dekat menemukan permukaan kepala dan anggota tubuh lama menghadap ke dalam karena arah pembentukan ring berbeda dari pakaian. Permukaan belakang jilbab terlihat menutupi wajah. Generator kini menyelaraskan arah segitiga dengan normal keluar sebelum proses VAT; pengujian memeriksa setiap segitiga di ketiga LOD untuk kedua avatar. Wajah terlihat dari depan dan sudut tiga perempat, tanpa mengganti rig atau animasi lama.

Tambahan tampilan: kamera arena lama disesuaikan ke jarak 5,6 m untuk tubuh manusia yang lebih proporsional; penanda Sa’i dibuat kecil dan melayang di atas kepala. Tombol radio ditempatkan di bawah peta mini agar tidak menimpa notifikasi checkpoint. Avatar Tawaf/Sa’i lama mewarisi pilihan perjalanan yang valid secara baca-saja; format checkpoint rute tetap sama.

## Verifikasi iterasi ini

- Seluruh 218 tes regresi lama lolos. Empat belas tes baru lolos, mencakup kontrak mesh, LOD, normal/arah segitiga, ruang berjalan, ruang orbit kamera, batas mesh dekorasi, dan percakapan untuk semua bab. Build terakhir menjalankan ulang 152 tes inti dalam 25 file serta 5 tes kebijakan rilis.
- Tujuh kelompok QA petualangan lama lolos: gerakan desktop, kamera, pause/resume, checkpoint dan unlock Tawaf/Sa’i, peragaan Tahallul perempuan, dua sentuhan independen, orientasi, pemulihan save, serta startup halaman lama.
- Sepuluh kelompok kampanye Haji lolos pada produksi: seluruh sembilan segmen baru, 12/12 di peta, reward 710, pilihan nafar awal/tsani, checkpoint dan save lama. Bab 03–05 memakai fixture selesai di suite kampanye; penyelesaian checkpoint nyata diuji terpisah pada suite petualangan lama. Ifadah/Sa’i/Wada melanjutkan dari 6/7 dan menyelesaikan satu putaran/lintasan nyata, bukan endurance 7/7 dari awal.
- Pada build dengan dekorasi final, 14 konteks arena dan dialog mobile lolos, termasuk seluruh bab dan arena kedua pada Ifadah/Aqabah. Chat tidak mengubah save, gerakan diblokir saat chat terbuka, Escape berfungsi, pilihan >=44px dan rotasi ke portrait menutup dialog.
- Semua 11 level persiapan klasik lolos startup produksi, bergantian avatar, tanpa fallback 3D dan tanpa mengubah quest. Ini smoke test; tidak mengulang setiap misi persiapan. Kawasan bus dan aktivitas sampingan lolos regresi produksi.
- Inspeksi karakter dari depan, tiga perempat dan tubuh penuh memakai pipeline VAT yang sama. Tidak ada error browser pada suite yang dicatat.
- Build lolos pemeriksaan PWA dan integritas rilis: 22 halaman masuk, 16 rute game publik, isolasi halaman privat dan tidak ada file dev dalam paket. Uji kampanye lengkap dilakukan sebelum penyesuaian terakhir posisi dekorasi; tes geometri dan startup/dialog pada build final memeriksa penyesuaian tersebut. Perubahan terakhir sesudahnya hanya kebijakan bayangan arena lama: Sedang memakai refleksi, Tinggi menambah bayangan statis.

Laporan mesin ada di qa-output/arena-audit-validation.json serta laporan yang dirujuk di dalamnya. Reproduksi: npm test, npm run build, npm run qa:adventure, node tools/campaign-qa.mjs --production, npm run qa:places -- --production, node tools/classic-cast-qa.mjs, node tools/district-production-qa.mjs, dan node tools/human-portrait-qa.mjs. Suite browser dijalankan bergantian, dengan server development 5173 dan preview 4173.

Pengukuran SwiftShader dipakai untuk menemukan beban dan memeriksa draw call. Itu bukan bukti frame rate HP atau GPU fisik. Pengujian Android/iOS fisik serta peninjauan materi manasik oleh pembimbing masih menjadi pekerjaan sebelum rilis publik.

### Beban render yang dicatat

| Arena | Draw call per frame pada preset Sedang |
|---|---:|
| tawaf | 76 |
| sai | 123 |
| tahallul | 22 |

Dekorasi bersama menambah paling banyak delapan mesh, digabung menurut material. Refleksi arena lama tersedia pada Sedang/Tinggi; bayangan statis arena lama dibatasi ke Tinggi setelah profil renderer perangkat lunak. Angka waktu sampel tidak dipakai sebagai klaim FPS perangkat fisik. Paket produksi akhir berisi 107 file (1443666 byte), dengan 22 halaman masuk.
