# Alur rambut, Mina dan Arafah

> Penomoran dokumen ini mengikuti tahap implementasi sebelumnya. Urutan publik terkini mengikuti [audit Nusuk](./AUDIT-ALUR-NUSUK.md): Miqat 1, Qudum 2, Sa’i 3, Mina 4, Arafah 5, Muzdalifah 6, Aqabah 7, dam 8, tahallul haji 9, Ifadah 10, tasyrik 11, Wada’ 12. Tahallul umrah hanya tersedia pada mode Umrah.

Alur haji tamattu’ proyek: Miqat → Tawaf/Sa’i umroh → Tahallul Umroh dengan rambut pendek → ihram haji dari Makkah → Mina → Arafah → Muzdalifah → Aqabah dan tahallul fase puncak. Memendekkan rambut pada umroh awal adalah pilihan alur permainan ini. Mode umroh mandiri tetap menyediakan cukur atau pendekkan.

## Penampilan dan save lama

Karakter baru memiliki rambut alami. Level 5 haji hanya menjalankan aksi memendekkan; pilihan botak tidak ditawarkan. NPC di tempat tahallul mengikuti pilihan rambut pendek pada alur haji. Tahallul fase Aqabah memakai aksi cukur dan menyimpan penanda opsional `hajjPeak: true` di format penampilan versi 1. Seluruh langkah misi dan `cuts` lama tetap dipakai.

Jika save lama haji sempat mencukur botak pada umroh awal, tampilan rambut dikoreksi menjadi pendek sampai fase puncak; rekaman misi lama tidak ditulis ulang. Save yang sudah mencapai Aqabah/Ifadah/Tasyrik/Wada tetap botak. Pembacaan penampilan tetap melindungi backup dan versi masa depan. Umroh mandiri mempertahankan aturan cukur yang tersedia sebelumnya.

## Level 6 · Ihram Haji & Mina

Pemain mendekati tempat persiapan, mempelajari niat dan menyiapkan ihram haji. Bus menuju Mina baru ditawarkan sesudah persiapan ini. Perjalanan menggunakan bus dan rute kawasan yang sudah ada: naik, menyetir mengikuti rute, rem, turun dan temui pembimbing terminal. Reload tidak mengulang persiapan yang telah tersimpan.

Di Mina, pemain mencari rombongan lalu mendekati penanda tenda dari jalur yang cukup lapang untuk kamera. Kegiatan Tarwiyah dimainkan melalui sebelas checkpoint: mengambil bekal dan air (persediaan tas bertambah), mengenali tempat wudu, salat Zuhur, menemui jemaah yang terpisah, mengantarnya sampai tenda, salat Asar, Magrib, Isya, beristirahat, salat Subuh, dan berkumpul menuju Arafah. Jemaah benar-benar mengikuti pemain dan harus tiba sebelum pengantaran selesai. Seluruh titik memakai jalur perkemahan yang diuji terhadap collision tenda.

Gerakan salat memakai urutan takbir, berdiri, rukuk, iktidal, dua sujud setiap rakaat, duduk dan salam. Dalam contoh Tarwiyah ini, Zuhur/Asar/Isya dua rakaat, Magrib tiga, Subuh dua; masing-masing pada waktunya tanpa jamak. Waktu dan gerakan dipadatkan untuk pembelajaran. Setelah Isya, istirahat malam berjalan enam detik waktu aktif dan memulihkan stamina, lalu pemain mengikuti Subuh dan berkumpul saat pagi 9 Zulhijah. Setelah level selesai, perjalanan bus berikutnya menuju Arafah memakai alur transfer yang sama.

Checkpoint kegiatan tersimpan per run pada `manasik-mina-camp-v1:{id}`, terpisah dari format kegiatan Mina lama. Save yang sudah lulus tidak dipaksa mengulang. Tombol **Mainkan kegiatan Mina lagi** membuka latihan dengan id terpisah, tanpa menulis ulang kelulusan atau memberikan reward level tambahan. Menu jeda, portrait, tab tersembunyi dan panel tas menghentikan waktu; reload melanjutkan interval terakhir yang tersimpan.

## Level 7 · Wukuf Arafah

Level dibuka dari titik kumpul Mina pada pagi 9 Zulhijah. Pemain menemui pembimbing, memeriksa kesiapan, lalu menaiki dan mengemudikan bus pada rute kawasan yang sudah tersedia. Intro dan radio menjelaskan perjalanan Mina → Arafah. Parkir, turun dan berbicara dengan pembimbing terminal menyimpan kedatangan sebelum membuka Arafah. Rute dan jarak adalah ilustrasi permainan.

Di Arafah ada 13 kegiatan: lapor ke rombongan, mengenali batas wilayah wukuf, isi air dan minum, berteduh, ringkasan arahan khutbah, salat Zuhur dua rakaat, Asar dua rakaat pada waktu Zuhur (jamak takdim dan qasar), pilihan pengingat doa pribadi/keluarga/sesama, menemui jemaah kelelahan, mengantarnya ke tempat teduh, dzikir/istigfar sore, doa hingga matahari terbenam, lalu titik kumpul Muzdalifah. Jemaah benar-benar mengikuti pemain dan harus tiba di tempat teduh. Air, bekal dan istirahat memengaruhi tas serta kondisi karakter yang sudah ada.

Gerakan salat memakai animasi salat yang tersedia. Doa memakai pose mengangkat tangan; khutbah dan istirahat memakai pose duduk. Tiga interval doa/dzikir masing-masing 12 detik waktu aktif game menggerakkan langit dari siang ke senja. Ini pemadatan waktu permainan, bukan ukuran ibadah nyata. Pilihan pengingat doa tidak dinilai benar/salah dan tidak menilai diterimanya ibadah. Keberangkatan dikunci hingga sesi senja selesai; Magrib–Isya dalam alur ini dilaksanakan setelah tiba di Muzdalifah.

`manasik-arafah-activities-v1:{id}` menyimpan kegiatan, waktu dan pilihan pengingat, terpisah dari save lama. Checkpoint lama fase 1/2/3 dilanjutkan ke sesi doa/sore/senja dengan waktu yang sudah tersimpan, sehingga tidak memaksa mengulang ibadah yang sebelumnya telah dimainkan. Save yang sudah lulus membuka latihan melalui **Mainkan kegiatan Arafah lagi**; kelulusan dan reward lama tidak dihapus. Pause, portrait, tab tersembunyi dan panel tas menghentikan waktu. Versi masa depan, backup rusak dan kegagalan penyimpanan tidak memberikan kelulusan palsu.

Checkpoint kegiatan disimpan terpisah per peserta dan id run, misalnya `manasik-mina-activity-v1:{id}` dan `manasik-arafah-activity-v1:{id}`. Save level yang telah selesai tetap terbaca; kegiatan tidak memberikan kelulusan saat baru membuka halaman. Timer ditulis berkala dan divalidasi sebelum membuka periode berikutnya. Backup, data rusak, quota, versi masa depan dan periode yang belum selesai tidak menghasilkan kelulusan palsu.

## Rujukan

- [Nusuk — Hajj Journey](https://hajj.nusuk.sa/Journey): Mina pada 8 Zulhijah, Arafah pada 9 Zulhijah sampai matahari terbenam, lalu Muzdalifah dan rangkaian Aqabah/tahallul.
- [Al-Haramain — Explanation and Clarification of Hajj](https://risala.prh.gov.sa/ar/contents/114): lima waktu salat di Mina dengan qasar tanpa jamak; Magrib dan Subuh tidak diqasar, lalu berangkat setelah matahari terbit. Pencarian bekal dan bantuan jemaah merupakan kegiatan cerita permainan.
- [Al-Haramain — Sacred Places, Arafat](https://services.prh.gov.sa/en/amakin_mokadasa.php?mode=fer): wukuf setelah Zuhur sampai matahari terbenam; tidak harus mendaki Jabal Rahmah.

## Verifikasi

Build: TypeScript, 294 tes inti, pendaftaran, kebijakan rilis, PWA dan integritas aset. Tes model memeriksa kebijakan rambut, perbaikan tampilan save lama tanpa menulis misi, penanda cukur puncak, urutan kegiatan, timer, pause, backup/future/quota, akses tenda serta pose doa. Tes Mina/Arafah memeriksa semua rute antar aktivitas dengan controller asli, rakaat dan jamak takdim, urutan waktu, pembukaan setelah terbenam, checkpoint kegiatan, serta perlindungan save lama/backup/versi masa depan. `tools/mina-gameplay-qa.mjs` memainkan kegiatan Mina melalui browser dengan save terisolasi, termasuk pengisian tas, pengantaran jemaah, animasi salat, pause/reload, kelulusan serta latihan ulang pada avatar perempuan dan layar HP.

`npm run qa:arafah` menguji keberangkatan dari Mina, seluruh bus yang benar-benar dikemudikan, parkir/turun/pembimbing, 13 kegiatan Arafah, pause/reload pada doa, air dalam tas, pengantaran jemaah, senja dan kelulusan; juga save perempuan lama pada emulasi HP, portrait, latihan ulang dan regresi pengantaran Mina. Tidak mengubah save pengguna.

`qa:hajj-field` menjalankan rambut pendek dari Tahallul, persiapan ihram, dua perjalanan bus nyata, berjalan ke rombongan/tenda, istirahat Mina, wukuf Zuhur–senja, jeda dan reload pertengahan waktu, lalu cukur dari checkpoint Aqabah yang valid. `tools/hajj-field-mobile-qa.mjs` memeriksa build akhir pada emulasi HP: persiapan ihram saat reload, koreksi rambut save lama dan cukur puncak, akses tenda dengan kamera lebih lapang, wukuf perempuan/portrait, serta kompatibilitas cukur umroh mandiri. Seluruh save QA terisolasi. SwiftShader dan emulasi browser bukan pengukuran FPS HP fisik.
