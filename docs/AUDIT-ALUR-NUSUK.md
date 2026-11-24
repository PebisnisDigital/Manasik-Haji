# Audit alur haji mengikuti Nusuk

## Temuan

Peta sebelumnya memiliki 12 level game, tetapi bukan pembagian 12 langkah pada halaman Hajj Journey milik Nusuk. Kedatangan Ka’bah dipisah dari tawaf; tahallul umrah awal memiliki level sendiri; Aqabah, dam dan tahallul haji justru digabung. Teks nomor level juga tersebar pada headline, perjalanan bus, halaman kegiatan dan hasil misi.

Alur sebelumnya secara materi memakai tamattu’: umrah, keluar ihram, lalu masuk ihram haji. Permintaan terbaru menghapus tahallul umrah awal dan mengikuti rangkaian utama Nusuk. Jalur haji yang kini dimainkan dinyatakan **qiran**, sehingga pemain tetap dalam ihram sejak miqat. Mode Umrah tersendiri mempertahankan tahallulnya.

## Urutan publik baru

| Level | Kegiatan | Waktu / hubungan |
|---|---|---|
| 1 | Miqat dan ihram haji qiran | Niat haji dan umrah sekaligus, sebelum batas miqat |
| 2 | Tawaf Qudum | Kedatangan, rombongan dan titik awal menjadi kegiatan dalam level; tujuh putaran dan panduan salat tawaf |
| 3 | Sa’i Safa–Marwah | Sa’i haji, tujuh lintasan, berakhir di Marwah; lanjut Mina tanpa tahallul awal |
| 4 | Mina, Tarwiyah | 8 Zulhijah hingga Subuh 9; tetap dalam ihram, tanpa niat masuk ihram ulang |
| 5 | Arafah | 9 Zulhijah; wukuf hingga matahari terbenam |
| 6 | Muzdalifah | Malam 10 hingga fajar; salat, mabit, Subuh dan perjalanan Mina |
| 7 | Aqabah | 10 Zulhijah; tujuh lontaran, kemudian keluar area lontar |
| 8 | Hady / dam haji | Panduan melalui pihak berwenang; bukan transaksi kurban |
| 9 | Tahallul awal haji | Petugas cukur, kepala laki-laki dicukur; perempuan dipotong ujung rambut dengan privasi |
| 10 | Tawaf Ifadah | Tujuh putaran dan salat tawaf; Sa’i yang sudah selesai pada Level 3 tidak diulang |
| 11 | Mina dan jumrah tasyrik | 11–12, ditambah 13 untuk nafar tsani; Ula → Wustha → Aqabah |
| 12 | Tawaf Wada’ | Sesudah rangkaian Mina, sebelum meninggalkan Makkah |

Urutan Aqabah–hady–cukur–Ifadah adalah urutan contoh yang dipilih; game tidak menyatakan bahwa kelonggaran urutan amalan hari Nahr tidak berlaku. Jika save latihan lama belum memiliki Sa’i awal, jalur Ifadah lama tetap menyediakan Sa’i sebelum selesai.

## Implementasi dan perlindungan progres

- `nusukModel.ts` menjadi sumber penomoran dan daftar 12 level yang terlihat pemain; `nusukRoute.ts` membaca checkpoint lama tanpa migrasi destruktif.
- Kedatangan dan Tawaf menjadi satu level. Sa’i langsung membuka Mina tanpa persyaratan tahallul umrah.
- Aqabah, dam dan cukur memiliki tiga status publik yang dibaca dari rangkaian kegiatan yang sama. Pemain tidak berpindah ke tempat berbeda hanya karena nomor level berubah.
- Nama id internal, tahapan core, URL lama, record aktivitas, aset, avatar, lencana dan reward yang sudah diperoleh tetap dibaca. Nama `tahallul` pada daftar lama dipertahankan sebagai kompatibilitas dan untuk mode Umrah, bukan sebagai level dalam jalur haji baru.
- Bookmark haji menuju tahallul umrah dialihkan ke persiapan Mina. Tombol dari Sa’i dan magic link tidak lagi mengarahkan pemain ke tahallul awal.
- Niat pada buku Miqat haji berubah menjadi qiran; Mina hanya pemeriksaan bekal dan pakaian, bukan masuk ihram baru.
- Ifadah sesudah Sa’i awal membuka kegiatan salat tawaf dan Zamzam, kemudian menyelesaikan level. Tidak dibuat checkpoint Sa’i kedua yang fiktif. Save latihan lama tanpa Sa’i awal tetap dapat menjalankan Sa’i.

## Sumber

- [Nusuk Hajj Journey](https://hajj.nusuk.sa/Journey): urutan 12 langkah utama.
- [Nusuk Hajj Rituals](https://hajj.nusuk.sa/nusuk/hajj-rituals): perbedaan tamattu’, ifrad dan qiran; qiran berniat haji dan umrah bersama.
- [Nusuk Umrah Journey](https://umrah.nusuk.sa/Journey): tahallul sesudah tawaf dan Sa’i tetap ada pada program Umrah tersendiri.
- [Al-Haramain: Explanation and Clarification](https://risala.prh.gov.sa/ar/contents/114): qiran tetap dalam ihram; Sa’i sekali yang sudah dilakukan setelah Qudum mencukupi, hady, urutan hari Nahr dan batas tahallul awal.

## Verifikasi

Tes model memeriksa urutan 12 level, niat qiran, pembukaan Mina tanpa potong rambut awal, tiga status hari Nahr, read-only terhadap save lama, serta penyelesaian Ifadah dengan Sa’i terdahulu tanpa membuat hitungan palsu. QA produksi memakai save terisolasi untuk peta desktop, HP landscape, sambungan Sa’i–Mina, Umrah mandiri, Ifadah dan save lama 12/12. Laporan ada di `qa-output/nusuk-route-qa.json`.
