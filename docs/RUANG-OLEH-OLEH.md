# Ruang oleh-oleh Haji Digital

Tahap penutup ditambahkan ke game Three.js yang ada, setelah 12 level jalur haji qiran lengkap. Tidak ada level tambahan atau perubahan pada format simpan misi lama.

## Alur pemain

Pendaftaran dan akses magic link yang ada tetap digunakan. Nama pendaftar dari magic link disimpan sebagai nama perjalanan saat pemain menekan Mulai/Lanjut Main. Di akhir Wada’, bila seluruh 12 level lengkap, muncul aksi **Terima oleh-oleh dari Pak Husen/Bu Salma** sesuai karakter. Tombol utama peta yang telah tamat juga membuka `oleh-oleh.html`.

Pemandu menyambut pemain di ruang 3D. Pemain berjalan ke pemandu dan menerima hadiah; sesudahnya dapat memilih meja lewat papan 3D atau menu Pengaturan → Isi ruang oleh-oleh. Joystick, Lari dan Aksi menggunakan pengendali yang sama dengan arena sebelumnya. Pilihan meja dipertahankan sampai dicapai sehingga tidak tertukar dengan pemandu yang masih dekat.

## Isi ruangan

- Sertifikat atas nama pemain dengan gelar pencapaian permainan **HAJI DIGITAL**, 12 level selesai, tanggal dan ID dokumen. PDF dapat diunduh; sertifikat lama pada mode latihan tetap tersedia dan tidak diubah.
- Kupon referral pribadi yang stabil setelah muat ulang, tombol salin kode dan teks tautan ajakan. Persentase komisi 30%; contoh tiket terverifikasi Rp100.000 menghasilkan Rp30.000. Diskon belum ditetapkan dan kode belum diterapkan pada pembayaran.
- Dompet menampilkan saldo sebenarnya Rp0 sampai backend terhubung. Draf bank, nama pemilik dan nomor rekening dapat disimpan **hanya pada browser ini**.
- Mode contoh dompet dipisahkan dan diberi label. Hanya contoh pembayaran terverifikasi dihitung; saldo tersedia dikurangi pengajuan yang menunggu admin. Contoh pengajuan tidak mengirim pesan/transfer, tidak menambah saldo nyata, dan tidak disimpan sebagai transaksi keuangan.
- Dua tas virtual dengan CD rekaman **Belajar Animasi Motion** dan **Belajar Animasi Stickman**. Isi tautan HTTPS di `src/souvenirConfig.ts` setelah materi siap; sebelum itu tombol akses kelas tidak aktif.

## Penyimpanan dan batas tahap ini

Hadiah memakai rekaman baru `manasik-souvenir-v1:<id sesi Wada>` melalui scope pemain yang sudah ada. Nama dokumen, ID sertifikat, kupon dan tanggal terbit tetap sama. Rekaman berversi lebih baru tidak ditimpa; backup valid bisa dipulihkan. Status menerima hadiah tidak dapat mundur. Sesi hadiah berbeda tidak memakai draf rekening yang sama.

`oleh-oleh.html` dimasukkan ke rilis sebagai halaman pribadi dan tidak ditangani cache navigasi PWA. Pembatasan 12/12 dan penyimpanan masih di sisi browser: tahap ini belum merupakan otorisasi akun/server untuk hadiah atau keuangan. Saat database disambungkan, server perlu menjadi sumber kebenaran untuk pemilik ruangan, kelulusan, keunikan kupon, atribusi referral, pembayaran terverifikasi, komisi, reservasi penarikan, persetujuan admin dan pencatatan transfer. Tidak ada transaksi pembayaran atau komisi nyata yang ditambahkan pada tahap ini.

Pratinjau lokal: `oleh-oleh.html?demo=1`. Hanya tersedia pada localhost/127.0.0.1, memakai nama Tamu Demo dan rekaman preview terpisah. Membuka demo tidak menandai level haji selesai.

## Verifikasi

`npm run build` mencakup unit test identitas hadiah, pemulihan data, perlindungan save versi baru, perhitungan 30%, pengurangan saldo contoh, validasi rekening/tautan dan jalur berjalan antar meja.

`node tools/souvenir-qa.mjs` menguji penguncian ruangan, transisi akhir Wada’, berjalan dan penyerahan hadiah, PDF yang benar-benar diunduh, clipboard kupon, draf rekening, dua penarikan contoh, kedua tas CD, muat ulang, integritas save lama, Bu Salma di landscape touch, rotasi portrait dan demo terpisah. Hasil berada di `qa-output/souvenir-qa.json`. Ini emulasi Chrome desktop/HP, bukan pengujian HP fisik atau transaksi bank nyata.

Hasil 24 November 2026: 332 unit test, 5 tes kebijakan rilis, 4 tes layanan pendaftaran, 9 pemeriksaan ruang oleh-oleh dan pengujian ulang 18 alur pop-up level lolos. Build produksi memiliki 23 halaman masuk; integritas rilis dan isolasi cache PWA lolos. Pemeriksaan tambahan memastikan kontras kartu menu landscape serta nama dari respons magic link masuk ke nama perjalanan (respons pendaftaran dimock, tanpa pembayaran nyata).
