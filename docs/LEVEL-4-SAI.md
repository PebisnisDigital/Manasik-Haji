# Level 4 — Berjalan dari Ka’bah ke Safa–Marwah

> Penomoran dokumen ini mengikuti tahap implementasi sebelumnya. Urutan publik terkini mengikuti [audit Nusuk](./AUDIT-ALUR-NUSUK.md): Miqat 1, Qudum 2, Sa’i 3, Mina 4, Arafah 5, Muzdalifah 6, Aqabah 7, dam 8, tahallul haji 9, Ifadah 10, tasyrik 11, Wada’ 12. Tahallul umrah hanya tersedia pada mode Umrah.

Urutan dipastikan bersama pengguna: Miqat → Kedatangan → Tawaf → **Level 4 · Sa’i**. Setelah laporan tawaf, tombol LANJUT KE LEVEL 4 menampilkan headline besar di atas arena. Pemain menekan MULAI PERJALANAN KE SAFA, lalu berjalan melalui tiga titik: keluar dari jalur tawaf, mencapai pelataran Mas’a, dan mendekati pintu Safa. Pintu baru menawarkan masuk setelah pemain tiba secara fisik. Perjalanan memakai canvas/controller yang sama; tidak ada bus atau teleportasi pemain di dalam arena.

## Progres

- `manasik-sai-approach-{avatar}-v1` menyimpan headline, tiga tujuan berjalan, dan masuk galeri. Scope peserta mengikuti `playerKey`. Reload melanjutkan dari checkpoint sebelumnya yang sudah dilewati.
- Kunci Tawaf dan Sa’i lama tidak ditulis oleh perjalanan penghubung. Sa’i yang sudah parsial dibuka pada hitungan dan sektornya semula. Tujuh putaran Tawaf harus sudah dikonfirmasi sebelum rute baru dimulai.
- Data versi lebih baru, data rusak tanpa backup, quota, dan perpindahan tab ditangani tanpa mengarang kelulusan. Peta/magic access mengarahkan Sa’i baru ke rute berjalan bila dua level pembuka dan Tawaf sudah selesai; bookmark lama dengan checkpoint Sa’i tetap dapat dibuka langsung.
- Pengguna baru tiba di dekat Safa, bukan langsung mendapat satu lintasan. Dekati penanda Safa, lalu arah perjalanan beralih ke Marwah. Lima sektor per lintasan dan tujuh lintasan memakai logika serta save yang sudah tersedia.

## Tampilan

Arena petualangan Sa’i sekarang memperlihatkan kelompok bebatuan dengan tinggi, bentuk dan material tidak seragam pada kedua ujung. Pembatas rendah memisahkan batuan dari lintasan. Papan Safa/Marwah, kolom, panel langit-langit, lengkung galeri, jendela geometris, garis lantai dan penanda hijau memperjelas tempat serta arah perjalanan. Mesh statis baru digabung menurut material untuk membatasi draw call.

Rujukan bentuk ruang: [Nusuk — Umrah Journey](https://umrah.nusuk.sa/Journey), khususnya sisa batuan Safa pada lantai dasar dan permulaan perjalanan dari Safa menuju Marwah. Ini adegan orisinal bergaya visual proyek, dengan jarak untuk permainan, bukan rekonstruksi bangunan berskala survei. Gambar sumber tidak disalin.

## Verifikasi

`npm run build` mencakup TypeScript, 257 tes inti, kebijakan rilis, backend pendaftaran, PWA dan integritas entry. Tes model memeriksa urutan/perizinan checkpoint penghubung, backup/future/quota, jalur fisik, posisi batuan di luar batas pemain, serta kompatibilitas peta dan magic access lama.

`npm run qa:sai-approach` memeriksa headline dalam canvas yang sama, perjalanan fisik lengkap ke pintu, reload tengah perjalanan, kelanjutan save Sa’i parsial, bebatuan kedua ujung pada HP, pendekatan ke garis Safa, satu lintasan penuh Safa–Marwah, jeda dan portrait. QA memakai Chrome/SwiftShader; belum merupakan uji FPS HP fisik.

## Keluar dari Marwah menuju Level 5

Setelah tujuh lintasan dan konfirmasi pembimbing, layar hasil menampilkan **PERFECT! · Level 4 · Sa’i selesai**. Hasil baru ditampilkan setelah penyimpanan berhasil. Tombol **Lanjut Level 5 · Tahallul** membuka perjalanan dalam arena Sa’i yang sama: cari pintu keluar sisi Marwah, lewati pelataran, lalu dekati tempat Tahallul. Penanda emas, peta mini dan suara/caption mengarahkan pemain. Tombol masuk Level 5 hanya muncul setelah ketiga tujuan tercapai dan pemain berada di dekat pintu.

Pintu samping memiliki celah nyata pada dinding dan batas gerak, dengan pelataran berlantai serta papan arah. Tidak ada bus pada penghubung ini. Tempat Tahallul merupakan ruang edukasi permainan, bukan klaim posisi geografis layanan nyata.

`manasik-tahallul-approach-{avatar}-v1` menyimpan perjalanan secara terpisah dengan scope peserta. Reload kembali ke titik terakhir; pause dan portrait menghentikan gerak. Membuka ulang Sa’i setelah masuk Tahallul menampilkan hasil Sa’i; kembali/maju browser tetap dapat dipakai. Save tujuh lintasan, peragaan Tahallul parsial, pilihan karakter dan rambut yang sudah dicukur tidak direset oleh penghubung. Pendamping Level 5 mengikuti Pak Husen/Bu Salma.

Verifikasi tambahan: `npm run qa:tahallul-approach` menjalankan akhir lintasan ketujuh, konfirmasi pembimbing, PERFECT, seluruh perjalanan fisik, reload, pause, back/forward, checkpoint potong rambut lama, joystick sentuh, portrait, pendamping perempuan dan review Sa’i. Save QA terisolasi dari pengguna. Tes model mencakup urutan checkpoint, batas pintu, versi lebih baru, backup dan quota. Build kini mencakup 264 tes inti.
