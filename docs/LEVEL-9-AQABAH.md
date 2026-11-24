# Level 9 · Aqabah, dam dan tahallul awal

> Penomoran dokumen ini mengikuti tahap implementasi sebelumnya. Urutan publik terkini mengikuti [audit Nusuk](./AUDIT-ALUR-NUSUK.md): Miqat 1, Qudum 2, Sa’i 3, Mina 4, Arafah 5, Muzdalifah 6, Aqabah 7, dam 8, tahallul haji 9, Ifadah 10, tasyrik 11, Wada’ 12. Tahallul umrah hanya tersedia pada mode Umrah.

## Audit

Sebelumnya Level 9 memakai arena Jamarat bersama hari tasyrik: dekati Aqabah, klik tujuh lontaran, lalu pindah ke satu demonstrasi rambut singkat. Belum ada rangkaian kegiatan perjalanan, arahan petugas, pilihan tujuan jumrah, jalur keluar atau pelayanan tahallul yang ramai. Hitungan lama tersimpan pada checkpoint core langkah 8, sedangkan langkah 9 berarti lontaran sudah selesai.

## Perubahan yang direncanakan dan diterapkan

Alur tetap memakai engine Three.js r185, karakter, kontrol jalan/joystick, bus kawasan, sistem survival dan core campaign yang tersedia.

1. Dari hasil Level 8, masuk ke persiapan keberangkatan di Muzdalifah, kemudian kemudikan bus ke Mina pada rute ilustratif kawasan.
2. Temui pembimbing sesuai avatar; periksa rombongan dan bekal.
3. Isi air dan berjalan melalui koridor Jamarat.
4. Tunggu petugas membuka jalur selama lima detik game; durasi ini bukan ketentuan ibadah.
5. Baca papan dan pilih Aqabah; pilihan Ula/Wustha memberi umpan balik tanpa penalti progres.
6. Dekati Aqabah dan lontar tujuh kerikil satu per satu dengan takbir dan lintasan ke area penampung. Tidak ada tuntutan mengenai dinding atau menembak jemaah.
7. Ikuti koridor keluar, simpan rangkaian lontaran, lalu lanjut ke pembimbing dam.
8. Pelajari hady/dam tamattu’ melalui pihak berwenang. Tidak ada transaksi atau klaim kurban telah terlaksana dari klik game.
9. Datangi petugas tahallul dan kursi cukur; tiga tindakan petugas, alat bergerak di kepala dan rambut terpotong. Ada pelanggan lain yang dilayani. Avatar laki-laki dicukur seluruh kepala pada fase puncak haji ini; perempuan dipotong ujung rambut dengan petugas perempuan dan layar privasi.
10. Pahami batas tahallul awal dan berkumpul menuju Ifadah.

## Penyimpanan dan kompatibilitas

- `manasik-aqabah-activities-v1:{coreId}`, melalui `playerKey`, menyimpan tahap, durasi, jumlah lontaran dan tindakan cukur; cadangan dipertahankan.
- Checkpoint core lama 0–7 menjadi jumlah lontaran awal. Langkah 9 lama langsung melanjutkan panduan dam, tanpa mengulang tujuh lontaran.
- Checkpoint core langkah 8 disinkronkan ke tujuh hanya ketika seluruh rangkaian lontaran dan jalur keluar selesai; core asli tetap menjadi sumber lencana dan reward.
- Setiap hitungan lontaran harus bertambah satu; potongan rambut memerlukan durasi penuh dan tiga tindakan. Penyimpanan versi lebih baru dilindungi, kegagalan penyimpanan ditampilkan.
- Jeda, tab tersembunyi dan layar portrait menghentikan durasi. Muat ulang melanjutkan tahap dan hitungan, dengan pemain kembali berjalan dari area masuk.
- Replay level selesai memakai id latihan terpisah, mempertahankan lencana, progres dan penampilan permanen.
- Arena Jamarat hari tasyrik dan alur latihan core noncampaign tetap memakai perilaku sebelumnya.

## Dasar materi

- [Nusuk: The Journey](https://hajj.nusuk.sa/Journey): Aqabah pada 10 Zulhijah, tujuh kerikil dengan takbir, hady dan cukur sebelum Ifadah.
- [Al-Haramain: Explanation and Clarification](https://risala.prh.gov.sa/ar/contents/114): kerikil jatuh di area penampung, cukur seluruh kepala atau pemendekan yang sesuai, ketentuan perempuan dan tahallul awal. Urutan contoh dalam game tidak dimaksudkan meniadakan kelonggaran urutan amalan hari Nahr.

## Verifikasi

Tes model mencakup jangkauan rute nyata di sekitar tiga penghalang jumrah, hitungan lama, larangan melewati tahap, durasi petugas/cukur, rollback, versi lebih baru, cadangan dan kegagalan penyimpanan. QA browser produksi memakai konteks terpisah agar save pengguna tidak berubah; rute bus dan pergerakan karakter benar-benar dijalankan. Laporan browser dicatat di `qa-output/aqabah-gameplay-qa.json`. Emulasi HP bukan pengukuran FPS perangkat fisik.
