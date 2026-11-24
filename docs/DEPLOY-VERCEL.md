# Deploy uji Vercel

Repository: `PebisnisDigital/Manasik-Haji`. Proyek Vercel yang sudah ada: `manasik-haji` pada tim `jualdigital`.

Jalankan `npm ci` dan `npm run build`. Vercel menerbitkan direktori `dist`. URL `.html` dipertahankan agar tautan level, bookmark, dan magic link tidak berubah. Service worker diperiksa ulang saat jaringan tersedia.

Pembaruan lokal digabung dengan pembaruan GitHub: alur Nusuk qiran dan ruang oleh-oleh tetap menjadi alur utama. Arena mandiri lama, generator GLB, validator aset, dan studio karakter dari GitHub tetap tersedia. Peta utama menggunakan progres 12 level terbaru.

## Layanan pendaftaran

Deploy ini adalah uji game. Server `server/registration-server.mjs` menggunakan SQLite pada direktori `private-data`, dan berjalan sebagai proses Node terpisah. Proxy Vite hanya berlaku di komputer pengembangan. Server itu belum dipasang pada hosting persisten; deploy frontend Vercel saja belum mengaktifkan pendaftaran, verifikasi pembayaran, atau magic link produksi.

Jangan memindahkan SQLite ke filesystem sementara Vercel Functions. Sambungkan backend persisten melalui proxy satu domain sebelum membuka pembayaran. Tetapkan `REGISTRATION_ORIGINS` ke origin publik dan `REGISTRATION_SECURE_COOKIE=1` pada HTTPS. Rahasia, rekening peserta, dan file database tidak masuk Git maupun hasil build.

Halaman admin pendaftaran/pembayaran dan pengelolaan bonus yang diminta berikutnya belum selesai dibangun. QRIS, pengiriman WhatsApp otomatis, komisi sungguhan, dan penarikan uang belum aktif. Ruang oleh-oleh tetap menggunakan progres browser; tautan kelas masih menunggu pengisian.

Progres lokal tidak otomatis berpindah dari localhost ke domain Vercel karena penyimpanan browser berbeda origin. Simpan progres di komputer yang sama untuk melanjutkan sesi lokal.
