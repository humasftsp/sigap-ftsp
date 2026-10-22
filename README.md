# SIGAP FTSP — Frontend

Sistem Informasi Pengelolaan dan Pengembangan, Fakultas Teknik Sipil dan Perencanaan, Universitas Trisakti.
*Data Terintegrasi, SDM Berkembang.*

Ini adalah frontend statis (HTML/CSS/JavaScript murni, tanpa framework) yang di-hosting di GitHub Pages.
Seluruh data dosen, berkas, dan akun tersimpan di Google Sheets/Drive milik fakultas dan diakses lewat
backend Google Apps Script. **Repository ini tidak menyimpan data atau password apa pun.**

## Struktur

```
index.html        Kerangka halaman
css/style.css     Desain (FTSP Blue #0066CC, Navy #113264, Plus Jakarta Sans); menu sidebar bergrup
img/              Logo, lambang, favicon & motif resmi FTSP (gelombang, lensa)
js/config.js      ← satu-satunya file yang perlu diubah: GAS_URL (URL /exec backend)
js/api.js         Komunikasi ke backend (fetch POST text/plain, token sesi)
js/ui.js          Komponen & utilitas tampilan
js/pages.js       Dashboard, katalog & detail dosen, jabamik, berkas, pensiun, profil
js/admin.js       Impor Excel, pengguna & akun, pengaturan, log & audit
js/organisasi.js  Program studi, homebase dosen, jabatan struktural, override peran (v1.3)
js/cetak.js       Rekap PDF (dialog cetak browser) & Word (.doc)
js/app.js         Login, navigasi, router
```

## Mengubah konfigurasi

Edit `js/config.js` → `GAS_URL`, lalu:

```bash
git add .
git commit -m "Perbarui konfigurasi"
git push
```

Panduan lengkap: `PANDUAN-INSTALASI.md`.
