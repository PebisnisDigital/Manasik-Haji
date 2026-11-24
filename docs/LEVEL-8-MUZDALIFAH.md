# Level 8 · Mabit Muzdalifah

> Penomoran dokumen ini mengikuti tahap implementasi sebelumnya. Urutan publik terkini mengikuti [audit Nusuk](./AUDIT-ALUR-NUSUK.md): Miqat 1, Qudum 2, Sa’i 3, Mina 4, Arafah 5, Muzdalifah 6, Aqabah 7, dam 8, tahallul haji 9, Ifadah 10, tasyrik 11, Wada’ 12. Tahallul umrah hanya tersedia pada mode Umrah.

## Audit awal

Level sebelumnya memiliki arena malam, karakter dengan WASD/joystick, pendekatan otomatis ke satu lokasi, serta tujuh kerikil yang disimpan melalui checkpoint core step 7. Tujuh pengambilan berasal dari tombol pada lokasi yang sama. Belum ada rangkaian salat, bantuan jemaah, pencarian kerikil di ruang permainan, pergantian malam–fajar, atau kegiatan mabit/Subuh. Perjalanan antarlevel memakai sistem bus kawasan yang tersedia.

## Perubahan gameplay

Alur utama: titik kumpul Arafah setelah matahari terbenam → bus malam → terminal Muzdalifah → rombongan → tempat salat → Magrib tiga rakaat → Isya dua rakaat → pos air/bekal → bantu jemaah menemukan alas → kenali kerikil kecil → tujuh pengambilan pada titik terpisah → bermalam → Subuh dua rakaat → dzikir/doa fajar → kumpul menuju Aqabah sebelum matahari terbit.

Bus memakai kendaraan, kontrol, route checkpoint, dan terminal yang sudah ada. Warna langit/cahaya malam hanya diaktifkan untuk transfer `hajj:muzdalifah`; transfer lain mempertahankan tampilannya. Rute adalah ilustrasi perjalanan, bukan rekonstruksi jarak geografis. Pemandu tetap mengikuti pilihan avatar.

Arena memiliki area salat dengan jemaah, alas istirahat, pos air, lampu, bulan/bintang dan penanda keberangkatan. Jemaah bantuan benar-benar mengikuti hingga alas. Pos air menambah persediaan dan memulihkan air tubuh; istirahat memulihkan stamina. Pilihan batu besar memberi koreksi tanpa memajukan kegiatan. Tujuh kerikil berada di koordinat berbeda dan hanya dihitung setelah aksi merunduk/pengambilan 1,5 detik selesai. Kerikil bergerak dari tanah menuju pemain dan hilang setelah tersimpan.

Salat memakai urutan gerak/rakaat yang tersedia. Malam dipadatkan menjadi delapan detik istirahat aktif, kemudian Subuh, delapan detik dzikir/doa dan fajar terang. Aksi salat/istirahat/doa tidak dimaksudkan sebagai ukuran durasi ibadah nyata. Alur utama tidak memberikan rukhsah otomatis berdasarkan gender avatar; ketentuan peserta yang lemah dijelaskan sebagai arahan pembimbing.

## Progres dan kompatibilitas

`manasik-muzdalifah-activities-v1:{runId}` menyimpan versi 1, id run, indeks kegiatan, waktu aksi dan jumlah kerikil. Key memakai scope peserta/tenant yang sudah ada. Backup valid dipakai jika primary rusak; versi masa depan dan quota gagal tidak ditimpa atau dianggap lulus.

Checkpoint core lama 0–7 kerikil menjadi jumlah awal ketika record kegiatan baru belum ada. Kerikil lama tidak diulang. Core step 7 dan key checkpoint lama tetap digunakan; jumlah tujuh disinkronkan saat pemain menekan penyelesaian setelah seluruh kegiatan. Commit lama tetap memerlukan checkpoint tujuh sebelum melanjutkan step 8. Core dan checkpoint level lain tidak ditulis. Mode latihan lama tanpa campaign tetap memakai alur aslinya.

Level yang telah lulus menyediakan **Mainkan kegiatan Muzdalifah lagi** dengan id latihan terpisah, tanpa menghapus kelulusan, avatar, rambut, atau memberikan reward level tambahan. Reload selama campaign melanjutkan kegiatan dan jumlah kerikil terakhir tersimpan. Jeda, portrait, panel tas/bantuan dan tab tersembunyi menghentikan waktu aksi. Tidak ada pengambilan kerikil otomatis hanya dengan mendekati lokasi.

## Rujukan

- [Nusuk — Hajj Journey](https://hajj.nusuk.sa/Journey): perjalanan dari Arafah setelah matahari terbenam, bermalam di Muzdalifah dan persiapan tujuh kerikil.
- [Al-Haramain — Explanation and Clarification of Hajj](https://risala.prh.gov.sa/ar/contents/114): Magrib tiga dan Isya dua rakaat setelah tiba, Subuh dan dzikir hingga pagi terang, berangkat sebelum matahari terbit. Kerikil tidak harus berasal dari Muzdalifah dan tidak perlu dicuci. Lokasi pencarian, bantuan jemaah dan pilihan penanda merupakan kegiatan permainan.

## Verifikasi

Build: TypeScript, 302 tes inti, kebijakan rilis, pendaftaran, PWA dan integritas aset. Tes model memeriksa urutan salat, rakaat, rute controller asli ke tiap aktivitas/pengambilan, progres tujuh kerikil, durasi aksi, pergantian fajar, backup, versi masa depan, quota dan kompatibilitas checkpoint lama.

`npm run qa:muzdalifah` menggunakan save terisolasi dan browser produksi: transisi hasil Arafah → perjalanan bus malam yang dikemudikan → turun/pemandu → seluruh kegiatan; jeda/reload pertengahan pengambilan; sisa kerikil dari save perempuan lama, portrait, fajar, kelulusan, latihan ulang dan regresi akhir Arafah. Pengujian HP memakai emulasi browser, bukan pengukuran perangkat fisik. Save pengguna tidak diubah.
