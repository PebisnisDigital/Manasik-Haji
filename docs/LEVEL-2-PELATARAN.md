# Level 2 — Berjalan bersama pembimbing menuju Ka’bah

> Penomoran dokumen ini mengikuti tahap implementasi sebelumnya. Urutan publik terkini mengikuti [audit Nusuk](./AUDIT-ALUR-NUSUK.md): Miqat 1, Qudum 2, Sa’i 3, Mina 4, Arafah 5, Muzdalifah 6, Aqabah 7, dam 8, tahallul haji 9, Ifadah 10, tasyrik 11, Wada’ 12. Tahallul umrah hanya tersedia pada mode Umrah.

Setelah menuntaskan Miqat & Ihram, tombol **LANJUT LEVEL 2 · Ikuti pembimbing** melanjutkan dari posisi pemain dan canvas 3D yang sama. Pemain tetap mengenakan ihram dan mempertahankan rambut yang tersimpan. Tidak ada bus atau perpindahan wajib ke peta pada sambungan ini.

## Tujuan pemain

1. Ikuti Pak Husen atau Bu Salma dari ruang persiapan ke pelataran.
2. Masuk ke kawasan Ka’bah bersama pembimbing.
3. Cari bendera hijau HAJJI.DIGITAL dan cocokkan nama rombongan. Jawaban rombongan lain memberikan arahan, tanpa meloloskan tujuan.
4. Dekati titik pandang dan arahkan kamera ke Ka’bah. Pengakuan melihat memerlukan Ka’bah berada dalam pandangan kamera.
5. Temukan garis yang sejajar Hajar Aswad dan kenali panah arah awal tawaf. Saat bergerak mengikuti arah ini, Ka’bah berada di sebelah kiri. Selesaikan Level 2, lalu pilih LANJUT LEVEL 3 untuk mengenali titik penting dan memulai tujuh putaran di arena yang sama.

WASD/tombol arah dan joystick HP tetap tersedia. **Ikuti pembimbing** membantu berjalan melalui titik rute dengan controller dan collision yang sama. Pembimbing memakai jalur yang dihitung saat tujuan berubah, berhenti saat pemain tertinggal lebih dari enam meter, dan melanjutkan setelah pemain mendekat. Menu bantuan, tas, posisi HP portrait, dan tab tersembunyi menjeda perjalanan.

## Kompatibilitas

- Peta Level 2 pada perjalanan baru menuju adegan ini melalui `index.html?play=miqat&program=hajj&campaign=hajj&chapter=miqat&arrival=1`. Miqat harus sudah selesai; query tidak memberikan kelulusan Level 1.
- Penataan rute dibuat untuk navigasi permainan. Ka’bah, pelataran, galeri, Maqam, Hijr dan minaret memakai pembangun aset proyek yang sama dengan arena Haram sebelumnya. Detail baru dimuat ketika Level 2 dimulai.
- Checkpoint penemuan terpisah menurut program/karakter di `manasik-arrival-walk-{program}-{avatar}-v1`, mengikuti scope peserta/mitra yang sudah ada. Reload melanjutkan dari tujuan terakhir yang selesai.
- Haji menyelesaikan chapter kedatangan lama dengan checkpoint tiga penemuan dan step 1. Id/nama lama dipertahankan. Reward tetap berasal dari sistem peta, sehingga penyelesaian ulang tidak menggandakan koin.
- Umroh tetap pada step Tawaf yang sudah ada. Mencapai garis awal tidak memberikan putaran dan tidak melewati Tawaf.
- Data versi lebih baru, checkpoint rusak, progres Ifadah/Sa’i/Tawaf lain, serta penampilan setelah Tahallul tidak diganti dengan sesi baru.

## Pengujian

`npm run build` memeriksa TypeScript, 257 tes inti, kebijakan rilis, backend pendaftaran, PWA dan integritas paket. `npm run qa:arrival` memainkan kedua pembimbing, seluruh tujuan, jawaban rombongan salah/benar, fokus kamera, penyimpanan/reload, id kedatangan lama, masuk ke arena Tawaf, dan kontrol HP. `npm run qa:miqat` mengulang Level 1. Pengujian browser memakai Chrome dengan SwiftShader dan emulasi layar HP; belum merupakan pengukuran FPS di perangkat HP fisik.
