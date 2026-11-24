# Level 5 — Aksi tahallul pada karakter

> Penomoran dokumen ini mengikuti tahap implementasi sebelumnya. Urutan publik terkini mengikuti [audit Nusuk](./AUDIT-ALUR-NUSUK.md): Miqat 1, Qudum 2, Sa’i 3, Mina 4, Arafah 5, Muzdalifah 6, Aqabah 7, dam 8, tahallul haji 9, Ifadah 10, tasyrik 11, Wada’ 12. Tahallul umrah hanya tersedia pada mode Umrah.

Sesudah Sa’i, pemain menemui pembimbing, mendatangi kursi cukur atau ruang perempuan, memilih cara tahallul, lalu duduk. Potong rambut berlangsung pada karakter 3D di arena: petugas bergerak, mesin cukur/gunting menyentuh kepala, rambut laki-laki berkurang per bagian dan potongannya jatuh. Kamera mendekat dengan halus; panel aksi kecil tetap memperlihatkan arena. Setelah selesai, pemain berdiri dan berjalan kembali ke rombongan.

Tuntunan umum mengacu pada [Nusuk — Umrah Journey, Shave Hair or Trim](https://umrah.nusuk.sa/Journey): setelah Tawaf dan Sa’i, laki-laki mencukur seluruh kepala atau memendekkan rambut; perempuan memotong sekitar 1–2 cm ujung rambut. Pilihan perempuan hanya memotong ujung, dengan petugas perempuan di ruang tertutup. Karakter tetap tertutup dan gerak petugas berlangsung di belakang penutup privasi. Tempat layanan dan jaraknya merupakan tata ruang permainan.

Tiga bagian aksi adalah pembagian kontrol/progres game untuk menjangkau kepala, bukan ketentuan jumlah rambut dalam ibadah. Tiap tombol memulai gerakan selama 2,6 detik waktu permainan. Tombol dikunci selama gerakan, dan checkpoint baru diberikan setelah animasi selesai serta penyimpanan berhasil. Pause, portrait, tab tersembunyi, dan panel bantuan menghentikan waktu aksi. Berdiri atau reload di tengah aksi mengembalikan bagian tersebut ke checkpoint terakhir.

## Kompatibilitas

Format `manasik-tahallul-quest-v1` dan `cuts: 0..3` tetap sama. Save lama 1/3 atau 2/3 dilanjutkan pada bagian berikutnya. Pilihan shave menyimpan kepala botak melalui sistem penampilan bersama; trim menyimpan rambut pendek. Pada umroh mandiri, kepala yang sudah botak tidak ditumbuhi rambut kembali saat memutar ulang adegan. Pada perjalanan haji, Level 5 memendekkan rambut dan cukur botak berlangsung pada fase puncak; tampilan save lama yang terlanjur botak dikoreksi tanpa mengulang misi. Lihat [alur Mina dan Arafah](LEVEL-6-7-MINA-ARAFAH.md). Save Sa’i tidak ditulis oleh aksi Tahallul. Data masa depan pada primary maupun backup tidak ditimpa oleh aksi baru.

Body, wajah, ukuran dan tulang menggunakan `CharacterMesh`/`Rig` proyek yang sama. Hanya pemain serta petugas dekat yang memakai `SkinnedMesh` hidup saat duduk; kerumunan tetap memakai renderer yang tersedia. IK dua sendi menjaga tangan petugas dekat alat. Kursi, ruang privasi, gunting, mesin cukur dan rambut merupakan geometri prosedural orisinal; tidak ada aset eksternal yang diunduh.

## Verifikasi

`npm run build`: TypeScript, 274 tes inti, kebijakan rilis, pendaftaran, PWA dan integritas aset.

`npm run qa:tahallul-action`: Chrome produksi dengan save terisolasi; aksi cukur dari save lama, pause, reload pertengahan progres, rambut botak permanen, opsi memendekkan, ruang perempuan, kontrol sentuh, portrait dan kembali ke rombongan. Screenshot aksi disimpan di `qa-output`. Pengujian HP memakai emulasi browser/SwiftShader, bukan perangkat HP fisik.

## Tempat cukur yang ramai

Enam stasiun jemaah laki-laki dan dua stasiun perempuan ditambahkan di luar dua kursi pemain, masing-masing dengan pelanggan dan petugas tersendiri. Ada jemaah menunggu, bangku, kursi cukur, papan pelayanan dan kanopi. Pelanggan latar datang, duduk, menjalani tiga bagian potong rambut, berdiri lalu pergi. Kursi kosong sejenak sebelum pelanggan berikutnya masuk; rambut tidak tumbuh kembali pada orang yang masih duduk.

Progres latar tidak membaca atau menulis save rambut dan misi pemain. Petugas latar memakai geometri detail sedang, animasi diperbarui 5–12 kali per detik menurut jarak, serta penyembunyian pada jarak jauh. Kursi/dinding/kanopi digabung per material. Profil pintu masuk produksi menghasilkan 103 draw call dan 25.134 triangle pada Chrome SwiftShader; waktu frame rata-rata sekitar 118 ms pada backend perangkat lunak ini. Ini data diagnostik, bukan klaim FPS ponsel.
