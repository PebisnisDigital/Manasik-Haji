# Cover, pengaturan awal dan peta petualangan

## Alur pemain

1. `index.html` membuka cover **MANASIK ADVENTURE**.
2. Pilih Haji atau Umroh, laki-laki atau perempuan, suara pemandu, suasana/efek, volume dan kualitas grafis.
3. **Mulai petualangan** menyimpan pilihan, lalu membuka peta program yang dipilih. Membuka cover/peta tidak memberikan checkpoint atau reward.
4. Pilih node yang terbuka. Karakter dan pengaturan dipakai ketika masuk arena; checkpoint yang sudah ada dilanjutkan.
5. Tombol peta pada arena membawa pemain kembali ke program yang sesuai.

Cover memakai kembali ilustrasi Ka’bah dan ilustrasi avatar asli proyek, tipografi besar serta palet hijau/emas. Peta memakai node berurutan dan jalur berkelok, dengan tanda selesai, aktif dan terkunci. Ini antarmuka permainan asli proyek; tidak memakai aset Mario atau GTA.

## Dua jalur yang sudah playable

- **Haji:** kampanye 12 bab yang sudah ada, dari Miqat hingga Wada. Tiga kawasan peta: Umroh awal di Mekah; Mina/Arafah/Muzdalifah; lalu Jumrah/Ifadah/Wada. Profil baru mengikuti urutan misi. Akses lama dan checkpoint tiga petualangan rute tetap tersedia.
- **Umroh:** lima tahap dari sistem Umroh yang sudah ada: Miqat/Ihram, Tawaf, Salat/Zamzam, Sa’i, Tahallul. Peta diturunkan dari langkah yang benar-benar tersimpan; tidak mengarang progres atau menyalin reward Haji. Node selesai membuka perjalanan yang tersimpan; tidak mereset level secara diam-diam.

Kawasan bus dan sebelas level persiapan tetap dapat diakses. Tombol Instal aplikasi dan petunjuk pemasangan PWA tersedia pada cover. Lobby 3D asli tersedia melalui **Mode bebas** (`index.html?lobby=1`). Dunia lobby tidak diinisialisasi oleh alur cover biasa.

## Pengaturan dan kompatibilitas

Pilihan awal berada di `manasik-journey-setup-v1`, dengan scope akun/tenant melalui helper pemain yang sudah ada. Format tervalidasi, memiliki cadangan dan menolak penulisan di atas versi yang lebih baru. Jika penyimpanan gagal, pemain tetap di cover; preferensi terkait diupayakan kembali ke nilai sebelumnya.

Pilihan grafis diteruskan ke sistem kualitas yang ada. Dua pilihan audio mengisi preferensi pemandu dan ambience yang ada. Volume utama memakai gain kuadrat, termasuk 0 yang senyap, pada pemandu, suara lingkungan, efek Sa’i dan bacaan dalam jalur petualangan. Tombol contoh suara tidak memulai rekaman atau musik. Browser dapat meminta sentuhan/penekanan tombol baru setelah navigasi sebelum audio terdengar; teks panduan tetap tersedia.

Karakter terpilih diterapkan saat membaca perjalanan untuk tampilan arena, tanpa menulis ulang checkpoint ketika membuka menu. Penulisan langkah berikutnya memakai karakter terpilih. Pada Tahallul lama, pilihan perempuan memakai peragaan potong ujung rambut sambil mempertahankan tahap dan jumlah langkah potong yang tersimpan. Pemilihan karakter per bab dinonaktifkan bila profil awal tersedia. Pengaturan kualitas/suara dalam permainan tetap ada untuk penyesuaian kenyamanan.

Sesi Umroh baru memeriksa pengaturan penerimaan sesi yang sudah ada. Checkpoint Umroh yang tidak dapat dibaca atau berasal dari versi lebih baru tidak ditimpa oleh tombol mulai.

## Verifikasi

- Sepuluh tes pengaturan baru mencakup validasi, preferensi audio/grafis, mute, pemulihan cadangan, future version, rollback saat kuota gagal, karakter pada run lama dan urutan lima tahap Umroh.
- Build menjalankan 180 tes inti dalam 27 file dan lima tes kebijakan rilis. PWA/integritas memeriksa 22 entry, 114 file, 16 rute publik serta isolasi halaman privat.
- Suite menu memeriksa cover → peta → arena nyata Haji dan Umroh; karakter perempuan; grafis rendah; channel audio mati dan volume pemandu; resume Sa’i Umroh dari 4/7 tanpa mengganti id/nama/langkah/hitungan; Tahallul lama tanpa mereset jumlah potong; desktop lebar, landscape dan portrait; kontrol minimal 44 px; kegagalan simpan/future data; serta lobby asli.
- Screenshot diperiksa untuk judul terpotong, footer yang menimpa form, kontras pilihan dan jalur node. Form dan peta dapat digulir pada layar kecil; permainan 3D mempertahankan aturan landscape.

Jalankan `npm run qa:front` untuk development atau `node tools/front-menu-qa.mjs --production` untuk preview produksi. Jalankan suite browser berurutan. Laporan berada di `qa-output/front-menu.json` dan `front-menu-production.json`. Pengujian memakai Chrome terisolasi/SwiftShader, bukan pengukuran FPS atau audio pada HP fisik. Rute Umroh memakai fixture checkpoint 4/7 untuk regresi; suite menu tidak menjalankan ulang seluruh endurance ibadah.

Regresi pada iterasi menu juga lulus: tujuh kelompok petualangan lama, tiga kelompok kawasan produksi, sembilan kelompok pemulihan kampanye dan empat kelompok perjalanan/tautan. Selektor QA diperbarui untuk membedakan node level dari tombol aksi serta membuka bagian aktivitas kawasan yang kini dapat dilipat. Logika pemeriksaan checkpoint, unlock dan isolasi tenant tetap diperiksa. Laporan gabungan: `qa-output/front-menu-validation.json`. Build/pratinjau sudah diperbarui secara lokal; belum dipublikasikan.
# Pembaruan alur masuk

Halaman utama sekarang memakai gerbang 3D. Form pilihan di bawah dipertahankan pada `index.html?setup=1`, lalu dilanjutkan dengan Bu Salma dan perjalanan bus. Lihat [Gerbang dan Bu Salma](GERBANG-DAN-BU-SALMA.md) dan [Karakter konsisten](KARAKTER-KONSISTEN.md). Pembayaran ditunda atas instruksi terbaru pengguna. Catatan verifikasi iterasi menu sebelumnya di bawah tetap merupakan riwayat iterasi tersebut.

