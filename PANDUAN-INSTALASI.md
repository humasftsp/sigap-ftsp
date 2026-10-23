# Panduan Instalasi SIGAP FTSP

Aplikasi ini memiliki dua bagian yang dipasang terpisah:

| Bagian | Isi | Dipasang di |
|---|---|---|
| **Backend** | 8 file `.gs` + `appsscript.json` | Google Apps Script (akun Google fakultas) |
| **Frontend** | Folder `sigap-ftsp/` dari ZIP (`index.html`, `css/`, `js/`, `img/`) | GitHub Pages |

Frontend memanggil backend lewat internet (`fetch`). Data, berkas, dan email tetap berada di Google Drive/Sheets/Gmail akun yang memasang backend. Yang tersimpan di GitHub hanya tampilan (HTML/CSS/JS); di sana tidak ada data dosen maupun password.

---

## BAGIAN A — Backend (Google Apps Script)

> Gunakan **akun Google Workspace fakultas** (misalnya akun admin kepegawaian), bukan akun pribadi. Email pengingat dikirim atas nama akun ini. Kuota akun Workspace sekitar 1.500 penerima/hari, sedangkan Gmail biasa hanya sekitar 100.

### A1. Buat proyek
1. Buka https://script.google.com, lalu klik **Proyek baru**. Ganti namanya menjadi `SIGAP FTSP Backend`.
2. Klik ⚙️ **Project Settings** dan centang **Show "appsscript.json" manifest file in editor**.

### A2. Tempel file
Di editor, buat file dengan nama **persis** seperti di bawah (klik **+**, pilih **Script**; nama ditulis tanpa `.gs`), lalu tempel isinya:

| File | Catatan |
|---|---|
| `Kode` | Ganti isi `Code.gs` bawaan, lalu ubah namanya menjadi `Kode` |
| `Auth` | |
| `Dosen` | |
| `Berkas` | |
| `Email` | |
| `Admin` | |
| `Organisasi` | Baru di v1.3: prodi, homebase, jabatan struktural, override peran, privasi |
| `Setup` | |
| `appsscript.json` | Ganti seluruh isinya |

Opsional: di file `Setup`, isi `SETUP_ADMIN_EMAIL` dengan email admin pertama. Bila dibiarkan kosong, sistem memakai email akun yang menjalankan setup.

### A3. Jalankan setup (SEKALI saja)
1. Di dropdown fungsi, pilih **`setupAppEnvironment`**, lalu klik **▶ Run**.
2. Klik **Review permissions**, pilih akun, lalu **Advanced → Go to SIGAP FTSP Backend (unsafe) → Allow**. Peringatan "unsafe" ini normal untuk skrip buatan sendiri.
3. Buka **Execution log** dan **catat baris `Password awal admin: ...`**. Password ini hanya muncul sekali. Log juga memuat baris `Akun dosen contoh: dosen.contoh@sigap.local / ...` (lihat C11).
4. Periksa Google Drive. Folder **📁 SIGAP FTSP** harus berisi spreadsheet database, folder *Berkas Dosen*, dan folder *Backup*.

> ⚠️ Jangan jalankan `setupAppEnvironment` dua kali, karena sistem akan menolaknya. Bila lupa password admin, jalankan `resetPasswordAdminDarurat` lalu lihat log.

Setup otomatis memasang dua **pemicu**: `pemicuHarian` (±07.00 WIB: hitung ulang status dan kirim email H-6/H-3/H-1) dan `pemicuBackupMingguan` (Senin ±02.00).

### A4. Deploy sebagai Web App
1. Klik **Deploy → New deployment**, klik ⚙️ lalu pilih **Web app**.
2. Isi **Execute as: Me** dan **Who has access: Anyone**.
3. Klik **Deploy**, lalu **salin URL yang berakhiran `/exec`**.

> Akses "Anyone" wajib karena login memakai email + password aplikasi, bukan akun Google (PRD §6). Seluruh pengamanan ada di aplikasi: token sesi, cek peran di setiap aksi, dan penguncian setelah 5× salah password.

**Setiap kali file `.gs` diubah:** buka **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. Dengan cara ini URL tetap sama dan frontend tidak perlu diubah.

### A5. Memperbarui dari versi sebelumnya (sudah pernah dipasang)
Bila backend versi lama sudah berjalan, **jangan** jalankan `setupAppEnvironment` lagi.
1. Ganti isi semua file `.gs` dengan versi baru, lalu tambahkan file baru **`Organisasi`**.
2. Klik **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**.
3. Buka aplikasi dan login. Permintaan pertama menjalankan **migrasi otomatis** satu kali. Data lama tidak dihapus. Migrasi melakukan hal berikut:
   - Membuat tab baru `PRODI`, `RIWAYAT_HOMEBASE`, `JABATAN_STRUKTURAL`, `PERAN_OVERRIDE`, dan `PERSETUJUAN_PRIVASI`.
   - Mengganti nama kolom `tmt_jabatan` menjadi `tmt_jabamik`. Kolom `prodi` lama menjadi `prodi_lama` dan diubah menjadi homebase. Nama prodi tanpa jenjang dianggap **S1**.
   - Mengubah akun berperan *Dekan* atau *WD IV* menjadi peran dasar *Pimpinan* (hanya baca). Dekan dan Wakil Dekan sekarang dicatat di Jabatan Struktural (C9).
   - Membuat akun dosen contoh (C11) dan mengisi *Status dosen* semua dosen dengan *Aktif*.
   - Mengubah akun berperan *Kaprodi* menjadi peran dasar *Dosen* dengan **override Kaprodi selama 3 bulan**. Ganti override ini dengan jabatan struktural (lihat C9).
   - Memberi admin yang sudah ada izin vault dan izin dokumen identitas, seperti hak mereka sebelumnya.
   - Mencatat seluruh perubahan di `AUDIT_LOG` dengan aksi `MIGRASI_SKEMA`.

---

## BAGIAN B — Frontend (GitHub Pages)

### B1. Isi URL backend
1. Ekstrak ZIP. Hasilnya folder **`sigap-ftsp`**, dan di dalamnya langsung ada `index.html`, `css/`, `js/`.
   > Windows *Extract All* kadang membuat folder ganda `sigap-ftsp\sigap-ftsp\`. Bila begitu, gunakan folder **bagian dalam**, yaitu folder yang langsung berisi `index.html`.
2. Buka `js/config.js` dengan Notepad. Ganti nilai `GAS_URL` dengan URL `/exec` dari langkah A4, lalu simpan.

### B2. Upload ke GitHub (lewat terminal, jangan lewat "Upload files" di web)
Upload lewat web GitHub merusak struktur folder `css/` dan `js/`, sehingga tampilan rusak.

1. Pasang Git (https://git-scm.com/download/win), lalu buat akun GitHub.
2. Di github.com, klik **+ → New repository**, beri nama misalnya `sigap-ftsp`, pilih **Public**, dan **jangan** centang README.
3. Buka folder **`sigap-ftsp`** (folder yang berisi `index.html`) di File Explorer. Klik address bar, ketik `powershell`, lalu tekan Enter.
4. Pastikan Anda berada di folder yang benar dengan perintah `dir`. Baris yang tampil harus mencakup `index.html`, `css`, `img`, dan `js`. **Kalau `index.html` tidak terlihat, jangan lanjut.**
5. Jalankan perintah berikut satu per satu:
   ```bash
   git config --global user.name "Nama Anda"
   git config --global user.email "email-akun-github@contoh.com"
   git init
   git add .
   git commit -m "Upload pertama SIGAP"
   git branch -M main
   git remote add origin https://github.com/USERNAME/sigap-ftsp.git
   git push -u origin main
   ```
   Saat diminta password, tempel **Personal Access Token**, bukan password akun. Token dibuat di https://github.com/settings/tokens dengan memilih *Generate new token (classic)* dan mencentang **repo**. Layar memang tidak menampilkan apa pun saat token ditempel; itu normal.
6. Di repo, buka **Settings → Pages**. Isi *Source*: **Deploy from a branch**, *Branch*: **main / (root)**, lalu **Save**. Pastikan **Enforce HTTPS** dicentang.
7. Tunggu 1–2 menit. Situs tersedia di `https://USERNAME.github.io/sigap-ftsp/`.

**Update frontend nanti:** dari folder `sigap-ftsp`, jalankan `git add .`, lalu `git commit -m "keterangan"`, lalu `git push`. Bila tampilan belum berubah, tekan Ctrl+Shift+R.

---

## BAGIAN C — Langkah pertama setelah online

1. Login dengan email admin dan password awal, ganti password (wajib), lalu setujui **Pemberitahuan Privasi**. Setiap pengguna diminta menyetujuinya sekali pada login pertama, dan diminta lagi bila admin menaikkan *Versi pemberitahuan privasi* di Pengaturan → Umum.
2. Buka **Pengaturan → Usia pensiun** dan isi usia pensiun per jabatan. PRD sengaja tidak menetapkannya; sebelum diisi, panel pensiun belum menghitung apa pun.
3. Buka **Pengaturan → Penerima email** dan isi email admin. Email Dekan dan Kaprodi **diambil otomatis dari jabatan struktural** (C9). Wakil Dekan yang ditembuskan dipilih di *Pengaturan → Umum*; baris Kaprodi di sini hanya menjadi cadangan untuk prodi yang belum memiliki Kaprodi aktif. WD IV dapat diaktifkan di tab *Umum*.
4. Di **Pengaturan → Umum**, klik **Isi URL halaman ini**. URL ini dipakai untuk tombol di email **dan untuk menampilkan logo FTSP di kepala email**; tanpa URL, email hanya menampilkan teks.
5. Buka **Tambah / Impor**, unggah `2026-JABAMIK.xlsx`, jalankan **Simulasi**, lalu **Impor sekarang**. Importer sudah disesuaikan dengan format file ini:
   - Homebase dibaca dari baris judul bagian ("Teknik Sipil", "Arsitektur"). Hasil seharusnya **24 + 30 dosen**. Excel tidak menyebut jenjang, sehingga semua dosen diberi homebase **S1** (dicatat sebagai asumsi). Pindahkan dosen S2 lewat langkah C9.
   - Judul kolom dua tingkat digabung, sehingga kolom **BKD** di bawah "Eligible Profile" ikut terbaca. Nilai "4 Semester" dibaca sebagai 4.
   - Karena Excel tidak memiliki kolom NIDN, NUPTK, email, dan S3, sebagian data **diturunkan** dan ditampilkan sebagai kotak **"Asumsi impor"**:
     - S3 diambil dari gelar "Dr."/"Ph.D". Gelar "Dra." tidak dihitung.
     - Tanggal lulus S3 dan selesai tugas belajar diambil dari kolom *Ket.*
     - NUPTK dianggap ada, kecuali keterangannya "Menunggu NUPTK".

     **Periksa asumsi ini.** Hasil uji dengan file asli: 23 Siap Diusulkan, 2 Rencana Pendek, 16 Rencana Panjang, 11 Data belum lengkap, dan 2 Guru Besar.
6. Lengkapi data yang tidak ada di Excel:
   - NIDN dan email, agar akun dan email pengingat bisa dibuat.
   - TMT untuk dosen berstatus **Data belum lengkap**.
   - Jumlah semester BKD untuk dosen yang BKD-nya masih kosong. Mereka tercatat sebagai *Rencana Panjang* dengan alasan "BKD belum terpenuhi".

   > BKD kosong **tidak** membuat dosen berstatus "Data belum lengkap" karena di Excel kosong berarti "belum terpenuhi". Bila fakultas ingin sebaliknya, tambahkan `bkd_semester` ke *Pengaturan → Umum → Kolom wajib hitung*.
7. Buka **Pengguna & Akun → Buat akun dosen sekaligus**, unduh CSV password sementara, lalu bagikan ke tiap dosen secara pribadi.
8. Buka **Pengaturan → Pemicu & email → Simulasi** untuk melihat email yang akan terkirim sebelum pemicu harian berjalan.
9. Buka menu **Organisasi** (submenu di sidebar):
   - **Program Studi**: periksa 4 prodi awal (S1/S2 Teknik Sipil, S1/S2 Arsitektur). Kode PDDikti awal adalah kode nasional bidang ilmu (22201, 22101, 23201, 23101), jadi **cocokkan dengan PDDikti** dan perbaiki bila berbeda.
   - **Homebase Dosen**: centang dosen yang berhomebase S2, klik **Ubah homebase**, lalu isi tanggal berlaku dan alasan. Dosen berstatus *Belum ditetapkan* ditampilkan paling atas.
   - **Jabatan Struktural**: catat **Dekan dan Wakil Dekan I–IV** beserta periodenya, termasuk pejabat periode lalu. Pejabat yang tidak ada di data dosen dicatat dengan centang *Pejabat di luar data dosen*. Dekan dan Wakil Dekan aktif otomatis dapat memantau seluruh dosen (hanya baca). Tambahkan juga Kaprodi dan Sekprodi tiap prodi beserta periode dan No SK. Dosen yang menjabat otomatis mendapat akses pantau prodi tersebut tanpa akun terpisah. Akunnya tetap akun dosen biasa.
   - **Override Peran**: hanya untuk pengecualian, misalnya Kaprodi cuti. Setiap override wajib beralasan dan memiliki tanggal berakhir.
10. Buka **Pengguna & Akun** dan tentukan admin yang memegang **izin vault** (boleh melihat password) dan **izin dokumen identitas** (boleh membuka KTP dan ijazah dosen lain). Izin akun sendiri hanya dapat diubah oleh admin lain. Password akun admin tidak disimpan di vault.
11. **Akun dosen contoh** (`dosen.contoh@sigap.local`) dibuat otomatis untuk memperkenalkan SIGAP kepada dosen. Datanya fiktif dan tidak dihitung di dashboard, laporan, maupun email. Akun ini hanya melihat datanya sendiri dan tidak dapat mengganti password. Passwordnya dapat dilihat lewat tombol *Lihat* (izin vault). Bila password ini dibagikan, ganti berkala dengan *Reset*, atau nonaktifkan akunnya saat tidak dipakai.
12. Untuk impor data dosen baru, buka **Tambah / Impor → Unduh templat Excel**. Templat berisi judul kolom yang langsung dikenali, satu baris contoh (otomatis dilewati saat impor), dan sheet *Petunjuk*.

---

## Pemecahan masalah

| Gejala | Penyebab | Solusi |
|---|---|---|
| Layar "Satu langkah lagi" | `GAS_URL` belum diisi | Isi `js/config.js`, lalu push ulang |
| "Server mengembalikan halaman HTML" | Akses Web App bukan *Anyone* atau URL bukan `/exec` | Ulangi A4 |
| "Aplikasi belum di-setup" | `setupAppEnvironment` belum dijalankan | Jalankan A3 |
| Perubahan `.gs` tidak berlaku | Deployment belum diperbarui | *Manage deployments → New version* |
| Situs 404 dan repo berisi folder lain di root | `git init` dijalankan di folder yang salah | Push ulang dari folder yang berisi `index.html` (`git push -u origin main --force`) |
| Tampilan tanpa warna/layout | Folder `css/` & `js/` rusak (upload via web) | Upload ulang lewat terminal (B2) |
| Muncul layar "Pemberitahuan Privasi" lagi | Admin menaikkan versi pemberitahuan | Baca, centang, lalu klik *Setuju & lanjutkan* |
| Kaprodi tidak melihat dosen tertentu | Homebase dosen belum ditetapkan atau berbeda prodi, atau jabatan struktural belum/tidak lagi berlaku | Periksa *Organisasi → Homebase Dosen* dan *Jabatan Struktural* |
| Email tidak terkirim | Kuota habis, atau email penerima kosong/salah | Lihat **Log & Audit → Email**, perbaiki email, lalu klik **Kirim ulang** |
