/**
 * SIGAP FTSP — admin.js
 * Halaman khusus admin: Impor Excel (FR-04), Pengguna & Akun (FR-02),
 * Pengaturan (FR-14), Log & Audit (FR-15).
 */
(function () {
  const { ic, esc, fmtTgl, fmtWaktu } = UI;
  const Pages = window.Pages = window.Pages || {};
  const V = () => App.view;
  const head = (eyebrow, judul, teks, aksi) => '<div class="page-head"><div>' + (eyebrow ? '<div class="eyebrow">' + eyebrow + '</div>' : '') + '<h1>' + esc(judul) + '</h1>' + (teks ? '<p>' + teks + '</p>' : '') + '</div>' + (aksi ? '<div class="actions">' + aksi + '</div>' : '') + '</div>';

  function unduhCSV(nama, rows) {
    const csv = rows.map(r => r.map(v => { const s = String(v === undefined || v === null ? '' : v); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(',')).join('\r\n');
    UI.unduhBlob(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }), nama);
  }

  // ============================================================
  // IMPOR EXCEL
  // ============================================================
  const FIELDS = [
    ['nama', 'Nama dosen *', ['nama', 'nama dosen', 'nama lengkap']],
    ['nidn', 'NIDN', ['nidn']],
    ['nuptk', 'NUPTK', ['nuptk']],
    ['prodi', 'Homebase (prodi)', ['prodi', 'program studi', 'jurusan', 'ps', 'homebase', 'prodi homebase']],
    ['jabatan', 'Jabatan', ['jabatan', 'jafung', 'jabfung', 'jab', 'jabamik', 'jabatan fungsional', 'jabatan akademik']],
    ['tmt_jabamik', 'TMT Jabamik', ['tmt', 'tmt jabatan', 'tmt jabamik', 'tmt jabatan akademik', 'tmt jafung', 'tmt jabfung']],
    ['tmt_karyawan_tetap', 'TMT Karyawan Tetap', ['tmt karyawan tetap', 'tmt kartap', 'tmt pegawai tetap', 'tmt dosen tetap', 'tmt pengangkatan']],
    ['no_sk_jabatan', 'No. SK jabatan', ['no sk', 'nomor sk', 'sk']],
    ['tgl_lahir', 'Tanggal lahir', ['tgl lahir', 'tanggal lahir', 'lahir', 'tgl_lahir']],
    ['email', 'Email', ['email', 'e-mail', 'surel']],
    ['no_wa', 'Nomor WhatsApp', ['no wa', 'wa', 'whatsapp', 'no hp', 'hp', 'nomor hp']],
    ['bidang_keahlian', 'Bidang keahlian', ['bidang keahlian', 'keahlian', 'kepakaran']],
    ['bkd_semester', 'BKD (jumlah semester)', ['bkd', 'bkd semester', 'jumlah bkd']],
    ['serdos', 'Serdos', ['serdos', 'sertifikasi', 'sertifikasi dosen']],
    ['status_nuptk', 'Status NUPTK', ['status nuptk']],
    ['s1_univ', 'S1 universitas', ['s1', 'univ s1', 's1 univ', 'pt s1']],
    ['s1_lulus', 'S1 lulus', ['lulus s1', 'tahun s1', 's1 lulus']],
    ['s2_univ', 'S2 universitas', ['s2', 'univ s2', 's2 univ', 'pt s2']],
    ['s2_lulus', 'S2 lulus', ['lulus s2', 'tahun s2', 's2 lulus']],
    ['s3_univ', 'S3 universitas', ['s3', 'univ s3', 's3 univ', 'pt s3', 'doktor']],
    ['s3_lulus', 'S3 lulus', ['lulus s3', 'tahun s3', 's3 lulus']],
    ['tb_mulai', 'Tugas belajar mulai', ['tb mulai', 'mulai tb', 'tugas belajar mulai']],
    ['tb_selesai', 'Tugas belajar selesai', ['tb selesai', 'selesai tb', 'tugas belajar selesai', 'akhir tb']],
    ['catatan', 'Catatan / keterangan', ['keterangan', 'catatan', 'ket']]
  ];
  const IMP = { step: 1 };

  function muatSheetJS() {
    if (window.XLSX) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      s.onload = () => res(); s.onerror = () => rej(new Error('Gagal memuat pembaca Excel (SheetJS). Periksa koneksi internet.'));
      document.head.appendChild(s);
    });
  }
  const norm = s => String(s || '').toLowerCase().replace(/[_\.\-\/]+/g, ' ').replace(/\s+/g, ' ').trim();

  function tebakHeader(aoa) {
    let best = 0, skor = -1;
    for (let r = 0; r < Math.min(15, aoa.length); r++) {
      const sel = judulKolom(aoa, r).map(norm);
      let s = 0;
      FIELDS.forEach(f => { if (sel.some(c => f[2].indexOf(c) >= 0 || f[2].some(k => k.length > 3 && c.indexOf(k) >= 0))) s++; });
      if (s > skor) { skor = s; best = r; }
    }
    return best;
  }
  /** Judul kolom: gabungkan baris judul dengan sub-judul di bawahnya (judul 2 tingkat, mis. "Eligible Profile" → "BKD"). */
  function adaSubJudul(aoa, hr) {
    const sub = aoa[hr + 1] || [];
    const isi = sub.filter(c => String(c).trim() !== '');
    if (!isi.length || isi.some(c => typeof c === 'number' || c instanceof Date)) return false;
    return String(sub[0] === undefined ? '' : sub[0]).trim() === '';
  }
  function judulKolom(aoa, hr) {
    const main = aoa[hr] || [], sub = adaSubJudul(aoa, hr) ? (aoa[hr + 1] || []) : [];
    const n = Math.max(main.length, sub.length);
    const out = [];
    for (let i = 0; i < n; i++) {
      const s = String(sub[i] === undefined ? '' : sub[i]).trim(), m = String(main[i] === undefined ? '' : main[i]).trim();
      out.push(s || m);
    }
    return out;
  }
  function barisDataMulai() { return IMP.headerRow + (adaSubJudul(IMP.aoa, IMP.headerRow) ? 2 : 1); }
  /** Baris judul bagian seperti "Teknik Sipil" / "Arsitektur" (satu sel terisi) → nama prodi. */
  function prodiDariBaris(r) {
    const isi = (r || []).filter(c => String(c).trim() !== '');
    if (isi.length !== 1 || typeof isi[0] !== 'string') return '';
    const t = norm(isi[0]);
    const daftar = (App.boot && App.boot.prodi) || [];
    // dikirim apa adanya (mis. "Teknik Sipil") agar server mencocokkan ke tab PRODI dan mencatat asumsi jenjang
    return daftar.some(p => norm(p) === t || norm(p).replace(/^(s1|s2|s3|d3|d4|profesi) /, '') === t || (t.length > 4 && norm(p).indexOf(t) >= 0)) ? String(isi[0]).trim() : '';
  }
  /** Daftar baris data siap kirim + prodi hasil deteksi baris judul. */
  function kumpulkanBaris() {
    const rows = [];
    let prodiKini = '';
    const mulai = barisDataMulai();
    IMP.aoa.forEach((r, i) => {
      const p = prodiDariBaris(r);
      if (p) { prodiKini = p; return; }
      if (i < mulai || !r.some(c => String(c).trim() !== '')) return;
      const o = barisKeObj(r); o._baris = i + 1;
      if (!o.nama && !o.nidn) return;
      if (!o.prodi) o.prodi = prodiKini || IMP.prodiDefault || '';
      rows.push(o);
    });
    return rows;
  }

  function tebakMap(headers) {
    const map = {}; const dipakai = {};
    FIELDS.forEach(f => {
      let idx = headers.findIndex((h, i) => !dipakai[i] && f[2].indexOf(norm(h)) >= 0);
      if (idx < 0) idx = headers.findIndex((h, i) => !dipakai[i] && f[2].some(k => k.length > 3 && norm(h).indexOf(k) >= 0));
      if (idx >= 0) { map[f[0]] = idx; dipakai[idx] = 1; }
    });
    return map;
  }
  function nilaiSel(v, field) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') {
      // serial tanggal Excel → yyyy-mm-dd (tahun lulus seperti 2005 tetap angka)
      if (/^(tgl_lahir|tmt_jabamik|tmt_karyawan_tetap|tb_mulai|tb_selesai|s1_lulus|s2_lulus|s3_lulus)$/.test(field) && v > 20000 && v < 80000) {
        return new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * 86400000).toISOString().slice(0, 10);
      }
      if (field === 'nidn') { const s = String(Math.round(v)); return s.length === 9 ? '0' + s : s; }
      if (field === 'nuptk') return String(Math.round(v));
      return String(v);
    }
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return String(v).trim();
  }

  Pages.impor = async function () {
    renderImpor();
  };

  function renderImpor() {
    const steps = ['Pilih berkas', 'Pemetaan kolom', 'Simulasi', 'Selesai'];
    let h = head('FR-03 & FR-04', 'Tambah / Impor Data Dosen', 'Impor data awal dari 2026-JABAMIK.xlsx. TMT kosong atau berupa teks tidak menggagalkan impor — dosen ditandai <b>Data belum lengkap</b>. Impor ulang memperbarui dosen yang sama (dicocokkan lewat NIDN, NUPTK, lalu nama).',
      '<button class="btn btn-outline" data-manual>' + ic('plus', 16) + 'Tambah satu dosen</button>');
    h += '<div class="steps">' + steps.map((s, i) => '<div class="s ' + (IMP.step === i + 1 ? 'on' : IMP.step > i + 1 ? 'done' : '') + '"><span class="n">' + (IMP.step > i + 1 ? '✓' : i + 1) + '</span>' + s + '</div>').join('') + '</div>';

    if (IMP.step === 1) {
      h += '<label class="drop" id="drop"><input type="file" id="f-xl" accept=".xlsx,.xls,.csv" class="hide">' +
        '<div class="empty" style="padding:0"><div class="e-ico">' + ic('sheet', 26) + '</div><b>Klik atau seret berkas Excel ke sini</b><div>.xlsx, .xls, atau .csv · berkas dibaca di browser Anda, belum dikirim ke server</div></div></label>' +
        '<div class="alert-box blue standalone" style="margin-top:16px">' + ic('info', 16) + '<div><b>Tips</b>Bila dosen Teknik Sipil dan Arsitektur ada di sheet berbeda, impor satu sheet per kali dan pilih "Prodi untuk sheet ini". Berkas Excel ber-password belum didukung.</div></div>';
    }
    if (IMP.step === 2) {
      const headers = judulKolom(IMP.aoa, IMP.headerRow).map((x, i) => x || 'Kolom ' + (i + 1));
      const data = kumpulkanBaris();
      const perProdi = {};
      data.forEach(o => { perProdi[o.prodi || '(tanpa prodi)'] = (perProdi[o.prodi || '(tanpa prodi)'] || 0) + 1; });
      h += '<div class="card card-pad mb"><div class="form-grid" style="grid-template-columns:repeat(3,minmax(0,1fr))">' +
        '<div class="field"><label>Sheet</label><select class="input" id="i-sheet">' + IMP.wb.SheetNames.map(n => '<option ' + (n === IMP.sheet ? 'selected' : '') + '>' + esc(n) + '</option>').join('') + '</select></div>' +
        '<div class="field"><label>Baris judul kolom</label><select class="input" id="i-hrow">' + IMP.aoa.slice(0, 15).map((r, i) => '<option value="' + i + '" ' + (i === IMP.headerRow ? 'selected' : '') + '>Baris ' + (i + 1) + ': ' + esc(r.filter(Boolean).slice(0, 4).join(' | ').slice(0, 50)) + '</option>').join('') + '</select></div>' +
        '<div class="field"><label>Homebase untuk sheet ini</label><select class="input" id="i-prodi"><option value="">Ambil dari kolom/judul bagian</option>' + (IMP.prodiDefault && App.boot.prodi.indexOf(IMP.prodiDefault) < 0 ? '<option selected value="' + esc(IMP.prodiDefault) + '">' + esc(IMP.prodiDefault) + ' (dari nama sheet)</option>' : '') + App.boot.prodi.map(p => '<option ' + (IMP.prodiDefault === p ? 'selected' : '') + '>' + p + '</option>').join('') + '</select><span class="hint">Nama tanpa jenjang ("Teknik Sipil") dipetakan ke S1 dan dicatat sebagai asumsi. Homebase dosen lama tidak diubah lewat impor.</span></div></div>' +
        '<div class="small muted">' + esc(IMP.namaFile) + ' · ' + data.length + ' baris dosen terdeteksi' + (adaSubJudul(IMP.aoa, IMP.headerRow) ? ' · judul kolom 2 tingkat digabung' : '') + '</div>' +
        '<div class="pills" style="margin-top:10px">' + Object.keys(perProdi).map(p => '<span class="pill ' + (p === '(tanpa prodi)' ? '' : 'on') + '" style="cursor:default">' + esc(p) + '<span class="n">' + perProdi[p] + '</span></span>').join('') + '</div>' +
        (perProdi['(tanpa prodi)'] ? '<div class="alert-box amber standalone" style="margin-top:10px">' + ic('alert', 16) + '<div>' + perProdi['(tanpa prodi)'] + ' baris belum punya prodi. Mereka akan berhomebase "Belum ditetapkan" (boleh lewat impor) — pilih "Homebase untuk sheet ini" atau tetapkan nanti di Organisasi → Homebase Dosen.</div></div>' : '') + '</div>';
      h += '<div class="card mb"><div class="card-head"><div><h3>' + ic('sliders', 18) + 'Pemetaan kolom</h3><div class="sub">Sudah ditebak otomatis dari judul kolom — periksa dan koreksi bila perlu.</div></div></div><div class="card-body"><div class="map-grid">' +
        FIELDS.map(f => '<div class="field" style="margin:0"><label>' + f[1] + '</label><select class="input input-sm" data-map="' + f[0] + '"><option value="">— tidak diimpor —</option>' +
          headers.map((hd, i) => '<option value="' + i + '" ' + (IMP.map[f[0]] === i ? 'selected' : '') + '>' + esc(hd) + '</option>').join('') + '</select></div>').join('') + '</div></div></div>';
      const contoh = data.slice(0, 5);
      const kol = FIELDS.filter(f => IMP.map[f[0]] !== undefined || f[0] === 'prodi');
      h += '<div class="card mb"><div class="card-head"><h3>' + ic('eye', 18) + 'Pratinjau 5 baris pertama</h3></div><div class="card-body" style="padding:12px 0 0"><div class="table-wrap"><table class="tbl"><thead><tr>' + kol.map(f => '<th>' + esc(f[1].replace(' *', '')) + '</th>').join('') + '</tr></thead><tbody>' +
        contoh.map(o => '<tr>' + kol.map(f => '<td>' + esc(o[f[0]]) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div></div></div>';
      h += '<div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn btn-outline" data-reset>Ganti berkas</button><button class="btn btn-primary" data-sim ' + (IMP.map.nama === undefined ? 'disabled' : '') + '>' + ic('play', 15) + 'Jalankan simulasi</button></div>';
    }
    if (IMP.step === 3 || IMP.step === 4) {
      const r = IMP.hasil;
      h += '<div class="grid g-4 mb">' +
        '<div class="card kpi ready"><div class="k-label">Dosen baru</div><div class="k-val">' + r.baru + '</div></div>' +
        '<div class="card kpi"><div class="k-label">Diperbarui</div><div class="k-val">' + r.diperbarui + '</div></div>' +
        '<div class="card kpi short"><div class="k-label">Peringatan</div><div class="k-val">' + r.peringatan.length + '</div></div>' +
        '<div class="card kpi inc"><div class="k-label">Baris bermasalah</div><div class="k-val">' + r.bermasalah.length + '</div></div></div>';
      if (IMP.step === 3) h += '<div class="alert-box amber standalone">' + ic('info', 16) + '<div><b>Ini masih simulasi</b>Belum ada data yang tersimpan. Periksa peringatan di bawah, lalu klik "Impor sekarang".</div></div>';
      else h += '<div class="alert-box green standalone">' + ic('checkCircle', 16) + '<div><b>Impor selesai</b>' + esc(r.message) + ' Langkah berikut: lengkapi data bertanda "Data belum lengkap", lalu buat akun dosen di halaman Pengguna & Akun.</div></div>';
      if (r.asumsi && r.asumsi.length) h += '<div class="alert-box blue standalone">' + ic('info', 16) + '<div><b>Asumsi impor — mohon diverifikasi</b><ul style="margin:6px 0 0;padding-left:18px">' + r.asumsi.map(a => '<li>' + esc(a) + '</li>').join('') + '</ul></div></div>';
      const tbl = (judul, rows, cls) => rows.length ? '<div class="card mb"><div class="card-head"><h3>' + judul + ' <span class="badge ' + cls + '">' + rows.length + '</span></h3></div><div class="card-body" style="padding:12px 0 0"><div class="table-wrap" style="max-height:360px"><table class="tbl"><thead><tr><th>Baris</th><th>Nama</th><th>Pesan</th></tr></thead><tbody>' +
        rows.map(p => '<tr><td>' + esc(p.baris) + '</td><td>' + esc(p.nama || '—') + '</td><td>' + esc(p.pesan) + '</td></tr>').join('') + '</tbody></table></div></div></div>' : '';
      h += tbl('Peringatan', r.peringatan, 'b-short') + tbl('Baris bermasalah (dilewati)', r.bermasalah, 'b-inc');
      h += '<div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">' + (IMP.step === 3
        ? '<button class="btn btn-outline" data-back>Kembali ke pemetaan</button><button class="btn btn-primary" data-go>' + ic('upload', 15) + 'Impor sekarang</button>'
        : '<button class="btn btn-outline" data-reset>Impor berkas lain</button><a class="btn btn-outline" href="#/akun">' + ic('key', 15) + 'Buat akun dosen</a><a class="btn btn-primary" href="#/dosen">Buka katalog dosen</a>') + '</div>';
    }
    V().innerHTML = h;
    V().querySelector('[data-manual]').onclick = () => Pages.formDosen(null);

    if (IMP.step === 1) {
      const inp = V().querySelector('#f-xl'), drop = V().querySelector('#drop');
      const baca = async file => {
        try {
          await muatSheetJS();
          const buf = await file.arrayBuffer();
          IMP.wb = XLSX.read(buf, { type: 'array', cellDates: false });
          IMP.namaFile = file.name;
          pilihSheet(IMP.wb.SheetNames[0]);
          IMP.step = 2; renderImpor();
        } catch (e) { UI.toast(e.message || 'Berkas tidak dapat dibaca.', 'err'); }
      };
      inp.onchange = () => inp.files[0] && baca(inp.files[0]);
      ['dragover', 'dragenter'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
      ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
      drop.addEventListener('drop', e => { const f = e.dataTransfer.files[0]; if (f) baca(f); });
    }
    if (IMP.step === 2) {
      V().querySelector('#i-sheet').onchange = e => { pilihSheet(e.target.value); renderImpor(); };
      V().querySelector('#i-hrow').onchange = e => { IMP.headerRow = +e.target.value; IMP.map = tebakMap(judulKolom(IMP.aoa, IMP.headerRow)); renderImpor(); };
      V().querySelector('#i-prodi').onchange = e => { IMP.prodiDefault = e.target.value; renderImpor(); };
      V().querySelectorAll('[data-map]').forEach(s => s.onchange = () => { if (s.value === '') delete IMP.map[s.dataset.map]; else IMP.map[s.dataset.map] = +s.value; renderImpor(); });
      V().querySelector('[data-sim]').onclick = e => kirim(e.currentTarget, true);
    }
    const reset = V().querySelector('[data-reset]'); if (reset) reset.onclick = () => { Object.keys(IMP).forEach(k => delete IMP[k]); IMP.step = 1; renderImpor(); };
    const back = V().querySelector('[data-back]'); if (back) back.onclick = () => { IMP.step = 2; renderImpor(); };
    const go = V().querySelector('[data-go]'); if (go) go.onclick = async e => {
      if (!await UI.konfirmasi('Impor ke database?', 'Data akan ditulis ke Google Sheets. Dosen yang sudah ada akan diperbarui (kolom kosong di Excel tidak menimpa data lama).', { ok: 'Impor sekarang' })) return;
      kirim(e.target, false);
    };
  }

  function pilihSheet(nama) {
    IMP.sheet = nama;
    const ws = IMP.wb.Sheets[nama];
    IMP.aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: '', blankrows: false });
    IMP.headerRow = tebakHeader(IMP.aoa);
    IMP.map = tebakMap(judulKolom(IMP.aoa, IMP.headerRow));
    const n = nama.toLowerCase();
    IMP.prodiDefault = n.indexOf('sipil') >= 0 ? 'Teknik Sipil' : n.indexOf('ars') >= 0 ? 'Arsitektur' : '';
  }
  function barisKeObj(r) {
    const o = {};
    Object.keys(IMP.map).forEach(f => { o[f] = nilaiSel(r[IMP.map[f]], f); });
    return o;
  }
  async function kirim(btn, simulasi) {
    const rows = kumpulkanBaris();
    if (!rows.length) { UI.toast('Tidak ada baris data yang dapat diimpor', 'err'); return; }
    const r = await UI.sibuk(btn, () => API.call('importDosen', { rows, simulasi, prodi_default: IMP.prodiDefault, nama_file: IMP.namaFile + ' / ' + IMP.sheet }));
    IMP.hasil = r; IMP.step = simulasi ? 3 : 4;
    if (!simulasi) App.invalidasi();
    renderImpor();
  }

  // ============================================================
  // PENGGUNA & AKUN
  // ============================================================
  const AK = { q: '', role: '', hal: 1 };
  // Peran dasar (PRD v1.3). Kaprodi/Sekprodi diberikan otomatis dari jabatan struktural atau override.
  const PERAN = [['ADMIN', 'Admin'], ['DOSEN', 'Dosen'], ['DEKAN', 'Dekan'], ['WD4', 'WD IV']];
  Pages.akun = async function () {
    V().innerHTML = UI.skeleton();
    const r = await API.call('listUsers');
    await App.muatDosen();
    if (!App.isCurrent()) return;
    AK.data = r;
    renderAkun();
  };

  function renderAkun() {
    const { users, dosen_tanpa_akun } = AK.data;
    let l = users;
    if (AK.role) l = l.filter(u => u.role === AK.role);
    if (AK.q) { const q = AK.q.toLowerCase(); l = l.filter(u => (u.nama + ' ' + u.email + ' ' + u.nama_dosen).toLowerCase().indexOf(q) >= 0); }
    l = l.slice().sort((a, b) => (b.terkunci - a.terkunci) || (['ADMIN', 'DEKAN', 'WD4', 'DOSEN'].indexOf(a.role) - ['ADMIN', 'DEKAN', 'WD4', 'DOSEN'].indexOf(b.role)) || a.nama.localeCompare(b.nama));
    const totalL = l.length, perA = 25;
    if (AK.hal > Math.ceil(totalL / perA)) AK.hal = 1;
    l = l.slice((AK.hal - 1) * perA, AK.hal * perA);
    const terkunci = users.filter(u => u.terkunci).length;
    const wajib = users.filter(u => u.wajib_ganti_password && u.aktif).length;
    const validTanpa = dosen_tanpa_akun.filter(d => d.email_valid).length;

    let h = head('FR-01 & FR-02', 'Pengguna & Akun', 'Login memakai email + password (tidak harus akun Google). Lima kali salah password mengunci akun 15 menit.',
      '<button class="btn btn-primary" data-add>' + ic('userPlus', 16) + 'Tambah akun</button>');
    h += '<section class="hero" style="padding:18px 22px">' + UI.motif(0.06) + '<div class="h-row" style="align-items:center"><div style="display:flex;gap:14px;align-items:flex-start"><div class="k-ico" style="background:rgba(255,255,255,.12);color:#fff;width:42px;height:42px;border-radius:12px;display:grid;place-items:center;flex:none">' + ic('shield', 20) + '</div>' +
      '<div><div style="font-weight:800;letter-spacing:.04em;font-size:12px">KEBIJAKAN PASSWORD VAULT</div><p style="margin:4px 0 0;font-size:13px">Hanya admin bertanda <b>izin vault</b> yang dapat melihat password dosen, Kaprodi, dan pimpinan (keputusan pemilik produk). Password admin tidak disimpan di vault. Setiap pembukaan tercatat di AUDIT_LOG dan tampil maksimal 15 detik.' + (App.user.admin_vault ? '' : ' <b>Akun Anda tidak memiliki izin vault.</b>') + '</p></div></div>' +
      '<a class="btn btn-outline btn-sm" href="#/log?tab=audit&aksi=LIHAT_PASSWORD" style="background:#fff">Periksa log vault</a></div></section>';
    const kp = (cls, label, v, s, icon) => '<div class="card kpi ' + cls + '"><div class="k-top"><div class="k-label">' + label + '</div><div class="k-ico">' + ic(icon, 18) + '</div></div><div class="k-val tabular">' + v + '</div><div class="k-desc">' + s + '</div></div>';
    h += '<div class="grid g-4 mb">' + kp('', 'Total akun', users.length, PERAN.map(p => users.filter(u => u.role === p[0]).length + ' ' + p[1]).join(' · '), 'users') +
      kp('ready', 'Akun aktif', users.filter(u => u.aktif).length, 'Dapat login', 'checkCircle') +
      kp('inc', 'Terkunci', terkunci, '5× salah password', 'lock') + kp('short', 'Wajib ganti password', wajib, 'Belum login pertama', 'key') + '</div>';
    if (dosen_tanpa_akun.length) h += '<div class="alert-box amber standalone">' + ic('userPlus', 16) + '<div style="flex:1"><b>' + dosen_tanpa_akun.length + ' dosen aktif belum punya akun</b>' + validTanpa + ' memiliki email valid dan dapat dibuatkan akun sekaligus. ' + (dosen_tanpa_akun.length - validTanpa) + ' lainnya perlu email diisi dulu di data dosen.</div>' +
      (validTanpa ? '<button class="btn btn-primary btn-sm" data-massal>Buat ' + validTanpa + ' akun</button>' : '') + '</div>';

    h += '<div class="toolbar"><div class="input-icon grow">' + ic('search', 17) + '<input class="input" id="a-q" placeholder="Cari nama atau email…" value="' + esc(AK.q) + '"></div><div class="pills">' +
      [['', 'Semua', users.length]].concat(PERAN.map(p => [p[0], p[1], users.filter(u => u.role === p[0]).length])).map(p => '<button class="pill ' + (AK.role === p[0] ? 'on' : '') + '" data-r="' + p[0] + '">' + p[1] + '<span class="n">' + p[2] + '</span></button>').join('') + '</div></div>';

    h += '<div class="card"><div class="table-wrap"><table class="tbl tbl-cards"><thead><tr><th>Pengguna</th><th>Peran</th><th>Cakupan</th><th>Status</th><th>Login terakhir</th><th class="num">Aksi</th></tr></thead><tbody>' +
      l.map(u => {
        const status = !u.aktif ? '<span class="badge b-gray">Nonaktif</span>' : u.terkunci ? '<span class="badge b-inc">' + ic('lock', 12) + 'Terkunci</span>' : u.wajib_ganti_password ? '<span class="badge b-short">Wajib ganti</span>' : '<span class="badge b-ready"><span class="dot"></span>Aktif</span>';
        return '<tr><td><div class="person"><div class="avatar sm" style="' + (u.role === 'ADMIN' ? 'background:var(--navy);color:#fff;border-color:var(--navy)' : '') + '">' + esc(UI.inisial(u.nama)) + '</div><div><div class="pn">' + esc(u.nama) + '</div><div class="ps">' + esc(u.email) + '</div></div></div></td>' +
          '<td data-l="Peran"><span class="badge ' + (u.role === 'ADMIN' ? 'b-navy' : 'b-blue') + '">' + esc(App.roleLabel(u.role)) + '</span></td>' +
          '<td data-l="Cakupan" class="small">' + esc(u.role === 'DOSEN' ? (u.nama_dosen || '⚠ belum tertaut') : u.role === 'ADMIN' ? 'Kelola semua' : 'Semua (baca)') +
          (u.peran_tambahan || []).map(p => '<div><span class="badge b-gb" style="margin-top:4px">+ ' + esc(p.replace(/^KAPRODI/, 'Kaprodi').replace(/^SEKPRODI/, 'Sekprodi').replace(/^WD4/, 'WD IV').replace(/^DEKAN/, 'Dekan')) + '</span></div>').join('') +
          (u.role === 'ADMIN' && (u.admin_vault || u.admin_dokumen_identitas) ? '<div class="muted" style="margin-top:4px">' + [u.admin_vault ? 'izin vault' : '', u.admin_dokumen_identitas ? 'izin dokumen identitas' : ''].filter(Boolean).join(' · ') + '</div>' : '') + '</td>' +
          '<td data-l="Status">' + status + (u.gagal_login && !u.terkunci ? ' <span class="small muted">' + u.gagal_login + '× gagal</span>' : '') + '</td>' +
          '<td data-l="Login" class="small nowrap">' + (u.login_terakhir ? fmtWaktu(u.login_terakhir) : '<span class="muted">Belum pernah</span>') + '</td>' +
          '<td class="num"><div style="display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap">' +
          (u.role !== 'ADMIN' && u.ada_vault && App.user.admin_vault ? '<button class="btn btn-soft btn-xs" data-lihat="' + esc(u.id_user) + '">' + ic('eye', 14) + 'Lihat</button>' : '') +
          (u.terkunci ? '<button class="btn btn-danger btn-xs" data-unlock="' + esc(u.id_user) + '">' + ic('unlock', 14) + 'Buka kunci</button>' : '') +
          '<button class="btn btn-outline btn-xs" data-reset="' + esc(u.id_user) + '">' + ic('refresh', 14) + 'Reset</button>' +
          '<button class="btn btn-ghost btn-xs" data-edit="' + esc(u.id_user) + '" title="Ubah">' + ic('edit', 14) + '</button></div></td></tr>';
      }).join('') + (l.length ? '' : '<tr><td colspan="6">' + UI.empty('search', 'Tidak ada akun', '') + '</td></tr>') + '</tbody></table></div>' + UI.pager(totalL, AK.hal, perA, 'data-hal') + '</div>';
    V().innerHTML = h;
    V().querySelectorAll('[data-hal]').forEach(b => b.onclick = () => { AK.hal = +b.dataset.hal; renderAkun(); window.scrollTo(0, 0); });

    const muatUlang = async () => { AK.data = await API.call('listUsers'); renderAkun(); };
    const q = V().querySelector('#a-q');
    q.addEventListener('input', UI.debounce(() => { AK.q = q.value.trim(); AK.hal = 1; renderAkun(); const n = V().querySelector('#a-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 300));
    V().querySelectorAll('[data-r]').forEach(b => b.onclick = () => { AK.role = b.dataset.r; AK.hal = 1; renderAkun(); });
    V().querySelector('[data-add]').onclick = () => formAkun(null, muatUlang);
    V().querySelectorAll('[data-edit]').forEach(b => b.onclick = () => formAkun(users.find(u => u.id_user === b.dataset.edit), muatUlang));
    const ms = V().querySelector('[data-massal]');
    if (ms) ms.onclick = async e => {
      if (!await UI.konfirmasi('Buat akun dosen sekaligus?', validTanpa + ' akun dosen akan dibuat dengan password sementara acak. Daftar password tampil sekali setelah ini (juga tersimpan di vault).', { ok: 'Buat akun' })) return;
      const r = await UI.sibuk(e.target, () => API.call('buatAkunMassal'));
      tampilPasswordBanyak(r.dibuat, r.dilewati);
      muatUlang();
    };
    V().querySelectorAll('[data-lihat]').forEach(b => b.onclick = async () => {
      const u = users.find(x => x.id_user === b.dataset.lihat);
      const r = await UI.sibuk(b, () => API.call('lihatPassword', { id_user: u.id_user }));
      tampilRahasia('Password ' + u.nama, u.email, r.password, 'Pembukaan ini tercatat di AUDIT_LOG. ' + (r.wajib_ganti_password ? 'Masih password sementara.' : 'Diperbarui ' + fmtWaktu(r.diperbarui_pada) + '.'), 15);
    });
    V().querySelectorAll('[data-reset]').forEach(b => b.onclick = async () => {
      const u = users.find(x => x.id_user === b.dataset.reset);
      if (!await UI.konfirmasi('Reset password?', 'Password <b>' + esc(u.email) + '</b> diganti password sementara baru. Sesi aktif pengguna ini akan diakhiri dan ia wajib mengganti password saat login.', { ok: 'Reset password', bahaya: true })) return;
      const r = await UI.sibuk(b, () => API.call('resetPassword', { id_user: u.id_user }));
      tampilRahasia('Password sementara', u.email, r.password_sementara, 'Sampaikan ke pengguna lewat saluran pribadi. Ia wajib menggantinya saat login.', 0);
      muatUlang();
    });
    V().querySelectorAll('[data-unlock]').forEach(b => b.onclick = async () => { await UI.sibuk(b, () => API.call('bukaKunci', { id_user: b.dataset.unlock })); UI.toast('Kunci akun dibuka'); muatUlang(); });
  }

  function tampilRahasia(judul, sub, pw, ket, detik) {
    const m = UI.modal({
      title: judul, sub: esc(sub), size: 'sm', autofocus: false,
      body: '<div class="secret" id="sec">' + esc(pw) + '</div>' + (detik ? '<div class="countdown"><i id="cd" style="width:100%"></i></div><div class="small muted" style="margin-top:6px" id="cdt">Tertutup otomatis dalam ' + detik + ' detik</div>' : '') +
        '<p class="small muted" style="margin:12px 0 0">' + esc(ket) + '</p>',
      foot: '<button class="btn btn-outline" data-close>Tutup</button><button class="btn btn-primary" data-copy>' + ic('copy', 15) + 'Salin</button>'
    });
    m.$('[data-copy]').onclick = () => UI.salin(pw);
    if (detik) {
      let s = detik;
      const t = setInterval(() => {
        s--; const cd = m.$('#cd'); if (!cd) { clearInterval(t); return; }
        cd.style.width = (s * 100 / detik) + '%'; m.$('#cdt').textContent = 'Tertutup otomatis dalam ' + s + ' detik';
        if (s <= 0) { clearInterval(t); m.close(); }
      }, 1000);
    }
  }

  function tampilPasswordBanyak(dibuat, dilewati) {
    const m = UI.modal({
      title: dibuat.length + ' akun dosen dibuat', size: 'lg', locked: true,
      sub: 'Daftar ini hanya tampil sekali. Unduh/simpan sekarang, lalu bagikan ke masing-masing dosen secara pribadi.',
      body: '<div class="table-wrap" style="max-height:50vh"><table class="tbl"><thead><tr><th>Nama</th><th>Email login</th><th>Password sementara</th></tr></thead><tbody>' +
        dibuat.map(x => '<tr><td>' + esc(x.nama) + '</td><td>' + esc(x.email) + '</td><td style="font-family:monospace;font-weight:700">' + esc(x.password_sementara) + '</td></tr>').join('') + '</tbody></table></div>' +
        (dilewati.length ? '<div class="alert-box amber standalone" style="margin-top:12px">' + ic('alert', 16) + '<div><b>' + dilewati.length + ' dilewati</b>' + esc(dilewati.map(x => x.nama + ' (' + x.alasan + ')').join('; ')) + '</div></div>' : ''),
      foot: '<button class="btn btn-outline" data-csv>' + ic('download', 15) + 'Unduh CSV</button><button class="btn btn-primary" data-close>Sudah saya simpan</button>'
    });
    m.$('[data-csv]').onclick = () => unduhCSV('akun-dosen-sigap-' + App.hariIni() + '.csv', [['Nama', 'Email', 'Password sementara']].concat(dibuat.map(x => [x.nama, x.email, x.password_sementara])));
  }

  function formAkun(u, onDone) {
    const v = u || { role: 'DOSEN', aktif: true };
    const sudahTertaut = {};
    AK.data.users.forEach(x => { if (x.id_dosen && (!u || x.id_user !== u.id_user)) sudahTertaut[x.id_dosen] = 1; });
    const opsiDosen = App.dosenAktif().filter(d => !sudahTertaut[d.id_dosen]).sort((a, b) => a.nama.localeCompare(b.nama));
    const m = UI.modal({
      title: u ? 'Ubah akun' : 'Tambah akun',
      body: '<div class="form-grid"><div class="field full"><label>Peran</label><select class="input" id="u-role">' + PERAN.map(p => '<option value="' + p[0] + '" ' + (v.role === p[0] ? 'selected' : '') + '>' + App.roleLabel(p[0]) + '</option>').join('') + '</select></div>' +
        '<div class="field full" id="w-dosen"><label id="w-dosen-l">Tautkan ke data dosen</label><select class="input" id="u-dosen"><option value="">— pilih dosen —</option>' + opsiDosen.map(d => '<option value="' + esc(d.id_dosen) + '" data-email="' + esc(d.email) + '" data-nama="' + esc(d.nama) + '" ' + (v.id_dosen === d.id_dosen ? 'selected' : '') + '>' + esc(d.nama) + ' · ' + esc(d.prodi) + '</option>').join('') + '</select><span class="hint" id="w-dosen-h"></span></div>' +
        '<div class="field full" id="w-flag"><div class="lbl" style="margin-bottom:6px">Izin khusus admin</div>' +
        '<label class="check" style="margin-bottom:6px"><input type="checkbox" id="u-vault" ' + (v.admin_vault ? 'checked' : '') + '>Boleh melihat password pengguna lain (admin_vault)</label><br>' +
        '<label class="check"><input type="checkbox" id="u-ident" ' + (v.admin_dokumen_identitas ? 'checked' : '') + '>Boleh membuka KTP & ijazah dosen (admin_dokumen_identitas)</label>' +
        '<span class="hint" style="display:block;margin-top:6px">Izin akun Anda sendiri hanya dapat diubah admin lain.</span></div>' +
        '<div class="alert-box blue standalone full" style="grid-column:1/-1;margin:0 0 12px">' + ic('info', 16) + '<div>Peran <b>Kaprodi/Sekprodi</b> tidak dipilih di sini: diberikan otomatis dari <a href="#/organisasi/struktural">jabatan struktural</a> aktif atau lewat <a href="#/organisasi/override">override peran</a>.</div></div>' +
        '<div class="field"><label>Email login</label><input class="input" id="u-email" type="email" value="' + esc(v.email || '') + '" placeholder="nama@trisakti.ac.id"><span class="hint">Boleh selain @trisakti.ac.id.</span></div>' +
        '<div class="field"><label>Nama tampilan</label><input class="input" id="u-nama" value="' + esc(v.nama || '') + '"></div>' +
        (u ? '<div class="field full"><label class="check"><input type="checkbox" id="u-aktif" ' + (v.aktif ? 'checked' : '') + '>Akun aktif</label></div>' : '<div class="alert-box blue standalone full" style="grid-column:1/-1">' + ic('info', 16) + '<div>Password sementara dibuat otomatis dan ditampilkan setelah disimpan.</div></div>') + '</div>',
      foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-ok>Simpan</button>'
    });
    const sync = () => {
      const r = m.$('#u-role').value;
      m.$('#w-flag').classList.toggle('hide', r !== 'ADMIN');
      m.$('#w-dosen-l').textContent = r === 'DOSEN' ? 'Tautkan ke data dosen *' : 'Tautkan ke data dosen (opsional)';
      m.$('#w-dosen-h').textContent = r === 'DOSEN' ? 'Dosen melihat data dirinya; bila menjabat Kaprodi/Sekprodi, aksesnya bertambah otomatis.' : 'Isi bila pimpinan/admin ini juga dosen, agar ia dapat melihat Profil Saya dan jabatan strukturalnya terbaca.';
    };
    m.$('#u-role').onchange = sync; sync();
    m.$('#u-dosen').onchange = e => { const o = e.target.selectedOptions[0]; if (o && o.value) { if (!m.$('#u-email').value) m.$('#u-email').value = o.dataset.email; if (!m.$('#u-nama').value) m.$('#u-nama').value = o.dataset.nama; } };
    m.$('[data-ok]').onclick = async e => {
      const data = { email: m.$('#u-email').value.trim(), nama: m.$('#u-nama').value.trim(), role: m.$('#u-role').value, id_dosen: m.$('#u-dosen').value, admin_vault: m.$('#u-vault').checked, admin_dokumen_identitas: m.$('#u-ident').checked };
      if (u) { data.id_user = u.id_user; data.aktif = m.$('#u-aktif').checked; }
      const r = await UI.sibuk(e.target, () => API.call('saveUser', { user: data }));
      m.close(); UI.toast(r.message);
      if (r.password_sementara) tampilRahasia('Akun dibuat', data.email, r.password_sementara, 'Sampaikan password sementara ini ke pengguna. Ia wajib menggantinya saat login pertama.', 0);
      onDone();
    };
  }

  // ============================================================
  // PENGATURAN
  // ============================================================
  const PG = { tab: 'aturan' };
  Pages.pengaturan = async function (param, q) {
    if (q && q.tab) PG.tab = q.tab;
    V().innerHTML = UI.skeleton(4);
    PG.data = await API.call('getPengaturan');
    if (!App.isCurrent()) return;
    renderPengaturan();
  };
  async function simpanBagian(btn, bagian, payload) {
    const r = await UI.sibuk(btn, () => API.call('savePengaturan', Object.assign({ bagian }, payload)));
    UI.toast(r.message);
    PG.data = await API.call('getPengaturan');
    await App.muatBoot(); App.invalidasi();
    renderPengaturan();
  }
  function renderPengaturan() {
    const d = PG.data;
    const tabs = [['aturan', 'Aturan kenaikan'], ['pensiun', 'Usia pensiun'], ['jenis', 'Jenis berkas'], ['penerima', 'Penerima email'], ['umum', 'Umum'], ['pemicu', 'Pemicu & email']];
    let h = head('FR-14', 'Pengaturan Aturan & Sistem', 'Perubahan aturan langsung berlaku pada perhitungan status berikutnya untuk semua pengguna.');
    h += '<div class="tabs">' + tabs.map(t => '<button class="' + (PG.tab === t[0] ? 'on' : '') + '" data-t="' + t[0] + '">' + t[1] + '</button>').join('') + '</div><div id="pg"></div>';
    V().innerHTML = h;
    V().querySelectorAll('[data-t]').forEach(b => b.onclick = () => { PG.tab = b.dataset.t; renderPengaturan(); });
    const el = V().querySelector('#pg');
    const jabSel = (val, cls) => '<select class="input ' + cls + '">' + ['TP', 'ASA', 'L', 'LK', 'GB'].map(j => '<option value="' + j + '" ' + (val === j ? 'selected' : '') + '>' + j + ' — ' + UI.jab(j) + '</option>').join('') + '</select>';

    if (PG.tab === 'aturan') {
      const baris = a => '<tr><td>' + jabSel(a.dari, 'a-dari') + '</td><td>' + jabSel(a.ke, 'a-ke') + '</td><td><input class="input a-masa" type="number" min="0" max="240" value="' + esc(a.masa_min_bulan) + '"></td>' +
        '<td><input class="input a-bkd" type="number" min="0" max="20" value="' + esc(a.bkd_min_semester) + '"></td><td><select class="input a-pend">' + [['', 'Tidak ada'], ['S2', 'S2'], ['S3', 'S3']].map(o => '<option value="' + o[0] + '" ' + (String(a.pendidikan_min || '') === o[0] ? 'selected' : '') + '>' + o[1] + '</option>').join('') + '</select></td>' +
        '<td class="ctr"><input type="checkbox" class="a-aktif" ' + (String(a.aktif) === 'TRUE' || a.aktif === true ? 'checked' : '') + '></td><td><button class="btn btn-ghost btn-xs" data-rm>' + ic('trash', 14) + '</button></td></tr>';
      el.innerHTML = '<div class="card"><div class="card-head"><div><h3>Aturan transisi jabatan (tab ATURAN)</h3><div class="sub">Bawaan PRD: masa 24 bulan; BKD TP→ASA 2 semester, lainnya 4; S3 wajib untuk L→LK dan LK→GB.</div></div><button class="btn btn-soft btn-sm" data-addrow>' + ic('plus', 14) + 'Tambah baris</button></div>' +
        '<div class="card-body"><div class="table-wrap"><table class="tbl etbl"><thead><tr><th>Dari</th><th>Ke</th><th>Masa min (bln)</th><th>BKD min (smt)</th><th>Pendidikan min</th><th class="ctr">Aktif</th><th></th></tr></thead><tbody id="rows">' +
        d.aturan.map(baris).join('') + '</tbody></table></div><div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="btn btn-primary" data-save>Simpan aturan</button></div></div></div>';
      el.querySelector('[data-addrow]').onclick = () => { el.querySelector('#rows').insertAdjacentHTML('beforeend', baris({ dari: 'TP', ke: 'ASA', masa_min_bulan: 24, bkd_min_semester: 4, pendidikan_min: '', aktif: true })); bindRm(); };
      const bindRm = () => el.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => b.closest('tr').remove());
      bindRm();
      el.querySelector('[data-save]').onclick = e => simpanBagian(e.target, 'aturan', { rows: [...el.querySelectorAll('#rows tr')].map(tr => ({ dari: tr.querySelector('.a-dari').value, ke: tr.querySelector('.a-ke').value, masa_min_bulan: tr.querySelector('.a-masa').value, bkd_min_semester: tr.querySelector('.a-bkd').value, pendidikan_min: tr.querySelector('.a-pend').value, aktif: tr.querySelector('.a-aktif').checked })) });
    }
    if (PG.tab === 'pensiun') {
      el.innerHTML = '<div class="card"><div class="card-head"><div><h3>Usia pensiun per jabatan (tab PENSIUN_ATURAN)</h3><div class="sub">PRD menetapkan nilai ini diisi admin. Kosongkan bila belum ditetapkan — dosen dengan jabatan tersebut tidak dihitung tanggal pensiunnya.</div></div></div>' +
        '<div class="card-body"><div class="table-wrap"><table class="tbl etbl"><thead><tr><th>Jabatan</th><th>Usia pensiun (tahun)</th></tr></thead><tbody>' +
        d.pensiun.map(p => '<tr data-j="' + esc(p.jabatan) + '"><td><b>' + esc(UI.jab(p.jabatan)) + '</b></td><td style="max-width:160px"><input class="input" type="number" min="50" max="80" value="' + esc(p.usia_pensiun) + '" placeholder="belum diisi"></td></tr>').join('') +
        '</tbody></table></div><div class="small muted" style="margin-top:10px">Jendela tampil pengingat diatur di tab Umum (saat ini ' + esc(d.umum.JENDELA_PENSIUN_BULAN.nilai) + ' bulan).</div><div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="btn btn-primary" data-save>Simpan usia pensiun</button></div></div></div>';
      el.querySelector('[data-save]').onclick = e => simpanBagian(e.target, 'pensiun', { rows: [...el.querySelectorAll('tr[data-j]')].map(tr => ({ jabatan: tr.dataset.j, usia_pensiun: tr.querySelector('input').value.trim() })) });
    }
    if (PG.tab === 'jenis') {
      const baris = j => '<tr><td style="width:180px"><input class="input j-kode" value="' + esc(j.kode) + '" ' + (j.kode ? 'readonly style="background:var(--surface-2)"' : 'placeholder="KODE_UNIK"') + '></td><td><input class="input j-nama" value="' + esc(j.nama) + '"></td>' +
        '<td class="ctr"><input type="checkbox" class="j-sens" title="Dokumen identitas: hanya admin berizin" ' + (String(j.sensitif) === 'TRUE' || j.sensitif === true ? 'checked' : '') + '></td>' +
        '<td class="ctr"><input type="checkbox" class="j-aktif" ' + (String(j.aktif) === 'TRUE' || j.aktif === true ? 'checked' : '') + '></td><td class="nowrap"><button class="btn btn-ghost btn-xs" data-up>↑</button><button class="btn btn-ghost btn-xs" data-dn>↓</button><button class="btn btn-ghost btn-xs" data-rm>' + ic('trash', 14) + '</button></td></tr>';
      el.innerHTML = '<div class="card"><div class="card-head"><div><h3>Jenis berkas (tab JENIS_BERKAS)</h3><div class="sub">Semua jenis bersifat opsional. Jenis yang sudah memiliki berkas tidak dapat dihapus — nonaktifkan saja. Jenis <b>sensitif</b> (KTP, ijazah) milik dosen lain hanya dapat dibuka admin berizin dokumen identitas.</div></div><button class="btn btn-soft btn-sm" data-addrow>' + ic('plus', 14) + 'Tambah jenis</button></div>' +
        '<div class="card-body"><div class="table-wrap"><table class="tbl etbl"><thead><tr><th>Kode</th><th>Nama tampilan</th><th class="ctr" title="Dokumen identitas (UU PDP)">Sensitif</th><th class="ctr">Aktif</th><th>Urutan</th></tr></thead><tbody id="rows">' + d.jenis_berkas.map(baris).join('') +
        '</tbody></table></div><div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="btn btn-primary" data-save>Simpan jenis berkas</button></div></div></div>';
      const bind = () => {
        el.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => b.closest('tr').remove());
        el.querySelectorAll('[data-up]').forEach(b => b.onclick = () => { const tr = b.closest('tr'); if (tr.previousElementSibling) tr.parentNode.insertBefore(tr, tr.previousElementSibling); });
        el.querySelectorAll('[data-dn]').forEach(b => b.onclick = () => { const tr = b.closest('tr'); if (tr.nextElementSibling) tr.parentNode.insertBefore(tr.nextElementSibling, tr); });
      };
      bind();
      el.querySelector('[data-addrow]').onclick = () => { el.querySelector('#rows').insertAdjacentHTML('beforeend', baris({ kode: '', nama: '', aktif: true })); bind(); };
      el.querySelector('[data-save]').onclick = e => simpanBagian(e.target, 'jenis_berkas', { rows: [...el.querySelectorAll('#rows tr')].map(tr => ({ kode: tr.querySelector('.j-kode').value.trim(), nama: tr.querySelector('.j-nama').value.trim(), sensitif: tr.querySelector('.j-sens').checked, aktif: tr.querySelector('.j-aktif').checked })) });
    }
    if (PG.tab === 'penerima') {
      const baris = p => '<tr><td><select class="input p-peran">' + [['ADMIN', 'Admin'], ['KAPRODI', 'Kaprodi (cadangan)'], ['DEKAN', 'Dekan'], ['WD4', 'WD IV']].map(o => '<option value="' + o[0] + '" ' + (p.peran === o[0] ? 'selected' : '') + '>' + o[1] + '</option>').join('') + '</select></td>' +
        '<td><select class="input p-prodi"><option value="">—</option>' + (App.boot.prodi_master || []).map(x => '<option value="' + esc(x.id_prodi) + '" ' + (p.id_prodi === x.id_prodi ? 'selected' : '') + '>' + esc(x.label) + '</option>').join('') + '</select></td>' +
        '<td><input class="input p-nama" value="' + esc(p.nama || '') + '"></td><td><input class="input p-email" type="email" value="' + esc(p.email || '') + '"></td>' +
        '<td class="ctr"><input type="checkbox" class="p-aktif" ' + (String(p.aktif) === 'TRUE' || p.aktif === true ? 'checked' : '') + '></td><td><button class="btn btn-ghost btn-xs" data-rm>' + ic('trash', 14) + '</button></td></tr>';
      const wd4 = String(d.umum.EMAIL_WD4_AKTIF.nilai) === 'TRUE';
      el.innerHTML = '<div class="card"><div class="card-head"><div><h3>Penerima tembusan email pengingat (tab PENERIMA_EMAIL)</h3><div class="sub">Email H-6/H-3/H-1 dikirim ke dosen dengan tembusan Kaprodi prodi homebase-nya, Dekan, dan admin. <b>Email Kaprodi diambil otomatis dari jabatan struktural aktif</b>; baris Kaprodi di sini hanya cadangan bila prodi belum punya Kaprodi aktif.</div></div><button class="btn btn-soft btn-sm" data-addrow>' + ic('plus', 14) + 'Tambah penerima</button></div>' +
        '<div class="card-body"><div class="alert-box ' + (wd4 ? 'green' : 'blue') + ' standalone">' + ic('info', 16) + '<div>WD IV saat ini <b>' + (wd4 ? 'diikutkan' : 'tidak diikutkan') + '</b> sebagai penerima. Ubah di tab Umum (EMAIL_WD4_AKTIF).</div></div>' +
        '<div class="table-wrap"><table class="tbl etbl"><thead><tr><th>Peran</th><th>Prodi</th><th>Nama</th><th>Email</th><th class="ctr">Aktif</th><th></th></tr></thead><tbody id="rows">' + d.penerima.map(baris).join('') +
        '</tbody></table></div><div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="btn btn-primary" data-save>Simpan penerima</button></div></div></div>';
      const bindRm = () => el.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => b.closest('tr').remove());
      bindRm();
      el.querySelector('[data-addrow]').onclick = () => { el.querySelector('#rows').insertAdjacentHTML('beforeend', baris({ peran: 'KAPRODI', aktif: true })); bindRm(); };
      el.querySelector('[data-save]').onclick = e => simpanBagian(e.target, 'penerima', { rows: [...el.querySelectorAll('#rows tr')].map(tr => ({ peran: tr.querySelector('.p-peran').value, id_prodi: tr.querySelector('.p-prodi').value, nama: tr.querySelector('.p-nama').value, email: tr.querySelector('.p-email').value.trim(), aktif: tr.querySelector('.p-aktif').checked })) });
    }
    if (PG.tab === 'umum') {
      const label = { JENDELA_PENSIUN_BULAN: 'Jendela pengingat pensiun (bulan)', JEDA_TB_BULAN: 'Jeda setelah tugas belajar (bulan)', BULAN_PER_SEMESTER: 'Bulan per semester (estimasi BKD)', FIELD_WAJIB_HITUNG: 'Kolom wajib hitung', WAJIB_NUPTK: 'NUPTK menjadi syarat', SESI_MENIT: 'Sesi login (menit tidak aktif)', EMAIL_WD4_AKTIF: 'Ikutkan WD IV di email pengingat', TANGGAL_RINGKASAN: 'Tanggal email ringkasan bulanan', URL_APLIKASI: 'URL frontend (untuk tombol di email)', VERSI_PRIVASI: 'Versi pemberitahuan privasi' };
      const bool = ['WAJIB_NUPTK', 'EMAIL_WD4_AKTIF'];
      el.innerHTML = '<form class="card card-pad" id="f-umum"><div class="form-grid">' + Object.keys(d.umum).map(k => {
        const it = d.umum[k];
        const input = bool.indexOf(k) >= 0 ? '<select class="input" name="' + k + '"><option value="TRUE" ' + (it.nilai === 'TRUE' ? 'selected' : '') + '>Ya</option><option value="FALSE" ' + (it.nilai !== 'TRUE' ? 'selected' : '') + '>Tidak</option></select>'
          : '<input class="input" name="' + k + '" value="' + esc(it.nilai) + '"' + (k === 'URL_APLIKASI' ? ' placeholder="' + esc(location.origin + location.pathname) + '"' : '') + '>';
        return '<div class="field ' + (k === 'URL_APLIKASI' || k === 'FIELD_WAJIB_HITUNG' ? 'full' : '') + '"><label>' + esc(label[k] || k) + '</label>' + input + '<span class="hint">' + esc(it.keterangan) + '</span></div>';
      }).join('') + '</div><div style="display:flex;justify-content:flex-end;gap:8px"><button class="btn btn-outline" type="button" data-url>Isi URL halaman ini</button><button class="btn btn-primary" type="submit">Simpan</button></div></form>';
      el.querySelector('[data-url]').onclick = () => { el.querySelector('[name=URL_APLIKASI]').value = location.origin + location.pathname; };
      el.querySelector('#f-umum').onsubmit = e => { e.preventDefault(); const nilai = {}; e.target.querySelectorAll('[name]').forEach(i => nilai[i.name] = i.value.trim()); simpanBagian(e.target.querySelector('[type=submit]'), 'umum', { nilai }); };
    }
    if (PG.tab === 'pemicu') {
      const harian = d.pemicu.some(p => p.fungsi === 'pemicuHarian');
      const backup = d.pemicu.some(p => p.fungsi === 'pemicuBackupMingguan');
      const pendek = App.dosenAktif().filter(x => x.status.status === 'PENDEK' && x.status.tgl_eligible);
      el.innerHTML = '<div class="grid g-2 mb"><div class="card card-pad"><h3 style="font-size:16px;margin-bottom:12px">Status pemicu</h3>' +
        '<div class="syr" style="padding:6px 0"><span class="k">' + ic('clock', 16) + '<span>Harian ±07.00 WIB (status & email)</span></span>' + (harian ? '<span class="badge b-ready">Terpasang</span>' : '<span class="badge b-inc">Belum</span>') + '</div>' +
        '<div class="syr" style="padding:6px 0"><span class="k">' + ic('history', 16) + '<span>Backup mingguan (Senin 02.00)</span></span>' + (backup ? '<span class="badge b-ready">Terpasang</span>' : '<span class="badge b-inc">Belum</span>') + '</div>' +
        '<div class="syr" style="padding:6px 0"><span class="k">' + ic('play', 16) + '<span>Terakhir berjalan</span></span><span class="v">' + (d.pemicu_terakhir ? fmtWaktu(d.pemicu_terakhir) : 'Belum pernah') + '</span></div>' +
        (d.pemicu_ringkasan ? '<div class="small muted">' + esc(d.pemicu_ringkasan) + '</div>' : '') +
        '<button class="btn btn-outline btn-sm" style="margin-top:12px" data-pasang>' + ic('refresh', 14) + 'Pasang ulang pemicu</button></div>' +
        '<div class="card card-pad"><h3 style="font-size:16px;margin-bottom:12px">Kuota email</h3><div class="k-val" style="font-size:30px;font-weight:800;color:var(--navy)">' + d.kuota_email + '</div><div class="small muted">penerima tersisa hari ini (MailApp). Akun Gmail biasa ±100/hari, Google Workspace ±1.500/hari.</div>' +
        '<div class="small muted" style="margin-top:8px">Email dikirim atas nama: <b>' + esc(d.akun_skrip || '—') + '</b></div></div></div>' +
        '<div class="card mb"><div class="card-head"><div><h3>' + ic('mail', 18) + 'Uji pengingat</h3><div class="sub">Simulasi menunjukkan email yang akan terkirim hari ini tanpa benar-benar mengirim.</div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-outline btn-sm" data-sim>' + ic('eye', 14) + 'Simulasi</button><button class="btn btn-primary btn-sm" data-run>' + ic('send', 14) + 'Jalankan sekarang</button></div></div><div class="card-body" id="sim-out"><div class="muted small">Belum dijalankan.</div></div></div>' +
        '<div class="card"><div class="card-head"><div><h3>' + ic('eye', 18) + 'Pratinjau email pengingat</h3><div class="sub">Lihat isi email untuk dosen berstatus Rencana Pendek.</div></div></div><div class="card-body"><div style="display:flex;gap:8px;flex-wrap:wrap"><select class="input" id="pv-d" style="flex:1;min-width:220px">' +
        (pendek.length ? pendek.map(x => '<option value="' + esc(x.id_dosen) + '">' + esc(x.nama) + ' · eligible ' + fmtTgl(x.status.tgl_eligible) + '</option>').join('') : '<option value="">Tidak ada dosen berstatus Rencana Pendek</option>') +
        '</select><select class="input" id="pv-t" style="width:140px"><option value="">Tahap otomatis</option><option>H-6</option><option>H-3</option><option>H-1</option></select><button class="btn btn-soft" data-pv ' + (pendek.length ? '' : 'disabled') + '>Tampilkan</button></div><div id="pv-out" style="margin-top:12px"></div></div></div>';
      el.querySelector('[data-pasang]').onclick = async e => { const r = await UI.sibuk(e.target, () => API.call('pasangPemicu')); UI.toast(r.message); PG.data = await API.call('getPengaturan'); renderPengaturan(); };
      const tampilHasil = h => {
        const out = el.querySelector('#sim-out');
        if (!h.rencana.length) { out.innerHTML = '<div class="muted">Tidak ada email yang ' + (h.dilewati ? 'perlu dikirim (' + h.dilewati + ' sudah terkirim sebelumnya).' : 'jatuh tempo hari ini.') + '</div>'; return; }
        out.innerHTML = '<div class="small muted" style="margin-bottom:8px">Kuota awal ' + h.kuota_awal + ' · terkirim ' + h.terkirim + ' · gagal ' + h.gagal + ' · dilewati (sudah pernah) ' + h.dilewati + '</div><div class="table-wrap"><table class="tbl tbl-cards"><thead><tr><th>Dosen / ringkasan</th><th>Tahap</th><th>Kepada</th><th>Tembusan</th><th>Status</th></tr></thead><tbody>' +
          h.rencana.map(x => '<tr><td>' + esc(x.nama) + (x.tgl_eligible ? '<div class="small muted">eligible ' + fmtTgl(x.tgl_eligible) + '</div>' : '') + '</td><td data-l="Tahap"><span class="badge b-blue">' + esc(x.tipe) + '</span></td><td data-l="Kepada" class="small">' + esc(x.to || '—') + '</td><td data-l="Tembusan" class="small">' + esc(x.cc.join(', ') || '—') + '</td>' +
            '<td data-l="Status"><span class="badge ' + (x.status === 'TERKIRIM' ? 'b-ready' : x.status === 'AKAN_DIKIRIM' ? 'b-blue' : x.status === 'TERTUNDA' ? 'b-short' : 'b-inc') + '">' + esc(x.status.replace('_', ' ')) + '</span>' + (x.pesan ? '<div class="small" style="color:var(--inc-tx)">' + esc(x.pesan) + '</div>' : '') + '</td></tr>').join('') + '</tbody></table></div>';
      };
      el.querySelector('[data-sim]').onclick = async e => { const r = await UI.sibuk(e.target, () => API.call('jalankanPengingat', { dryRun: true })); tampilHasil(r.hasil); };
      el.querySelector('[data-run]').onclick = async e => {
        if (!await UI.konfirmasi('Kirim email sekarang?', 'Email pengingat yang jatuh tempo hari ini akan dikirim. Email yang sudah pernah terkirim tidak dikirim ulang.', { ok: 'Kirim' })) return;
        const r = await UI.sibuk(e.target, () => API.call('jalankanPengingat', { dryRun: false })); tampilHasil(r.hasil); UI.toast('Terkirim ' + r.hasil.terkirim + ', gagal ' + r.hasil.gagal);
      };
      el.querySelector('[data-pv]').onclick = async e => {
        const r = await UI.sibuk(e.target, () => API.call('pratinjauEmail', { id_dosen: el.querySelector('#pv-d').value, tipe: el.querySelector('#pv-t').value }));
        el.querySelector('#pv-out').innerHTML = '<div class="small" style="margin-bottom:6px"><b>Subjek:</b> ' + esc(r.subjek) + '<br><b>Kepada:</b> ' + esc(r.to || '— (tidak ada penerima valid)') + (r.cc.length ? '<br><b>Tembusan:</b> ' + esc(r.cc.join(', ')) : '') + '</div><iframe style="width:100%;height:560px;border:1px solid var(--border);border-radius:8px" title="Pratinjau email"></iframe>';
        el.querySelector('#pv-out iframe').srcdoc = r.html;
      };
    }
  }

  // ============================================================
  // LOG & AUDIT
  // ============================================================
  const LG = { tab: 'email', tipe: '', status: '', q: '', dari: '', sampai: '', aksi: '', pengguna: '' };
  Pages.log = async function (param, q) {
    if (q && q.tab) LG.tab = q.tab;
    if (q && q.aksi) LG.aksi = q.aksi;
    await muatLog();
  };
  async function muatLog() {
    V().innerHTML = UI.skeleton(6);
    if (LG.tab === 'email') LG.data = await API.call('listEmailLog', { tipe: LG.tipe, status: LG.status, q: LG.q, dari: LG.dari, sampai: LG.sampai });
    else LG.data = await API.call('listAuditLog', { aksi: LG.aksi, pengguna: LG.pengguna, q: LG.q, dari: LG.dari, sampai: LG.sampai });
    if (!App.isCurrent()) return;
    renderLog();
  }
  function renderLog() {
    const d = LG.data;
    let h = head('FR-15', 'Log & Audit', 'Riwayat email pengingat (EMAIL_LOG) dan aktivitas pengguna (AUDIT_LOG). Menampilkan maksimal 300/500 entri terbaru sesuai filter.',
      '<button class="btn btn-outline" data-csv>' + ic('download', 16) + 'Ekspor CSV</button>');
    h += '<div class="tabs">' + [['email', 'Email pengingat'], ['audit', 'Audit aktivitas']].map(t => '<button class="' + (LG.tab === t[0] ? 'on' : '') + '" data-t="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>';
    const filterTgl = '<input class="input" type="date" id="l-dari" value="' + esc(LG.dari) + '" title="Dari tanggal" style="width:auto"><input class="input" type="date" id="l-sampai" value="' + esc(LG.sampai) + '" title="Sampai tanggal" style="width:auto">';

    if (LG.tab === 'email') {
      h += '<div class="grid g-4 mb">' +
        '<div class="card kpi"><div class="k-label">Kuota tersisa hari ini</div><div class="k-val">' + d.kuota_sisa + '</div><div class="k-desc">penerima (MailApp)</div></div>' +
        '<div class="card kpi ready"><div class="k-label">Terkirim</div><div class="k-val">' + d.ringkas.TERKIRIM + '</div><div class="k-desc">sesuai filter</div></div>' +
        '<div class="card kpi inc"><div class="k-label">Gagal</div><div class="k-val">' + d.ringkas.GAGAL + '</div><div class="k-desc">dapat dikirim ulang</div></div>' +
        '<div class="card kpi"><div class="k-label">Pemicu terakhir</div><div class="k-val" style="font-size:18px">' + (d.pemicu_terakhir ? fmtWaktu(d.pemicu_terakhir) : '—') + '</div><div class="k-desc">' + esc(d.pemicu_ringkasan || '') + '</div></div></div>';
      h += '<div class="toolbar"><div class="input-icon grow">' + ic('search', 17) + '<input class="input" id="l-q" placeholder="Cari dosen, penerima, subjek…" value="' + esc(LG.q) + '"></div>' +
        '<select class="input" id="l-tipe"><option value="">Semua tipe</option>' + ['H-6', 'H-3', 'H-1', 'RINGKASAN'].map(t => '<option ' + (LG.tipe === t ? 'selected' : '') + '>' + t + '</option>').join('') + '</select>' +
        '<select class="input" id="l-status"><option value="">Semua status</option><option value="TERKIRIM" ' + (LG.status === 'TERKIRIM' ? 'selected' : '') + '>Terkirim</option><option value="GAGAL" ' + (LG.status === 'GAGAL' ? 'selected' : '') + '>Gagal</option></select>' + filterTgl + '</div>';
      h += '<div class="card"><div class="table-wrap"><table class="tbl tbl-cards"><thead><tr><th>Waktu</th><th>Dosen</th><th>Tipe</th><th>Penerima</th><th>Status</th><th></th></tr></thead><tbody>' +
        (d.log.length ? d.log.map(r => '<tr><td class="small nowrap">' + fmtWaktu(r.waktu) + '</td><td data-l="Dosen"><b>' + esc(r.nama_dosen) + '</b>' + (r.tgl_eligible ? '<div class="small muted">eligible ' + fmtTgl(r.tgl_eligible) + '</div>' : '') + '</td>' +
          '<td data-l="Tipe"><span class="badge ' + (r.tipe === 'RINGKASAN' ? 'b-ready' : r.tipe === 'H-1' ? 'b-inc' : r.tipe === 'H-3' ? 'b-short' : 'b-long') + '">' + esc(r.tipe) + '</span></td>' +
          '<td data-l="Penerima" class="small" style="max-width:320px">' + esc(r.penerima || '—') + '</td>' +
          '<td data-l="Status"><span class="badge ' + (r.status === 'TERKIRIM' ? 'b-ready' : r.status === 'GAGAL' ? 'b-inc' : 'b-gray') + '">' + esc(r.status) + '</span>' + (r.pesan && r.status !== 'TERKIRIM' ? '<div class="small" style="color:var(--inc-tx)">' + esc(r.pesan) + '</div>' : '') + '</td>' +
          '<td class="num">' + (r.status === 'GAGAL' ? '<button class="btn btn-danger btn-xs" data-ulang="' + esc(r.id_log) + '">' + ic('send', 13) + 'Kirim ulang</button>' : '') + '</td></tr>').join('')
          : '<tr><td colspan="6">' + UI.empty('mail', 'Belum ada log email', 'Email tercatat setelah pemicu harian berjalan atau admin menjalankan pengingat.') + '</td></tr>') + '</tbody></table></div>' +
        (d.total > d.log.length ? '<div class="pager"><span class="muted small">Menampilkan ' + d.log.length + ' dari ' + d.total + ' — persempit dengan filter tanggal.</span></div>' : '') + '</div>';
    } else {
      h += '<div class="toolbar"><div class="input-icon grow">' + ic('search', 17) + '<input class="input" id="l-q" placeholder="Cari objek atau detail…" value="' + esc(LG.q) + '"></div>' +
        '<input class="input" id="l-user" placeholder="Email pengguna" value="' + esc(LG.pengguna) + '" style="width:200px">' +
        '<select class="input" id="l-aksi"><option value="">Semua aksi</option>' + (d.daftar_aksi || []).map(a => '<option ' + (LG.aksi === a ? 'selected' : '') + '>' + esc(a) + '</option>').join('') + '</select>' + filterTgl + '</div>';
      const warna = a => /GAGAL|TERKUNCI|HAPUS|NONAKTIF/.test(a) ? 'b-inc' : /PASSWORD|VAULT|BERKAS/.test(a) ? 'b-short' : /LOGIN/.test(a) ? 'b-gray' : 'b-blue';
      h += '<div class="card"><div class="table-wrap"><table class="tbl tbl-cards"><thead><tr><th>Waktu</th><th>Pengguna</th><th>Aksi</th><th>Objek</th><th>Detail</th></tr></thead><tbody>' +
        (d.log.length ? d.log.map(r => '<tr><td class="small nowrap">' + fmtWaktu(r.waktu) + '</td><td data-l="Pengguna"><b class="small">' + esc(r.pengguna) + '</b><div class="small muted">' + esc(r.peran) + '</div></td>' +
          '<td data-l="Aksi"><span class="badge ' + warna(r.aksi) + '">' + esc(r.aksi) + '</span></td><td data-l="Objek" class="small">' + esc(r.objek) + '</td><td data-l="Detail" class="small" style="max-width:420px;word-break:break-word">' + esc(r.detail) + '</td></tr>').join('')
          : '<tr><td colspan="5">' + UI.empty('history', 'Tidak ada aktivitas', 'Ubah filter.') + '</td></tr>') + '</tbody></table></div>' +
        (d.total > d.log.length ? '<div class="pager"><span class="muted small">Menampilkan ' + d.log.length + ' dari ' + d.total + '</span></div>' : '') + '</div>';
    }
    V().innerHTML = h;
    V().querySelectorAll('[data-t]').forEach(b => b.onclick = () => { LG.tab = b.dataset.t; LG.q = ''; muatLog(); });
    const bindSel = (id, k) => { const el = V().querySelector(id); if (el) el.onchange = () => { LG[k] = el.value; muatLog(); }; };
    bindSel('#l-tipe', 'tipe'); bindSel('#l-status', 'status'); bindSel('#l-aksi', 'aksi'); bindSel('#l-dari', 'dari'); bindSel('#l-sampai', 'sampai'); bindSel('#l-user', 'pengguna');
    const q = V().querySelector('#l-q'); q.addEventListener('keydown', e => { if (e.key === 'Enter') { LG.q = q.value.trim(); muatLog(); } });
    q.addEventListener('change', () => { if (LG.q !== q.value.trim()) { LG.q = q.value.trim(); muatLog(); } });
    V().querySelectorAll('[data-ulang]').forEach(b => b.onclick = async () => {
      const r = await UI.sibuk(b, () => API.call('kirimUlangEmail', { id_log: b.dataset.ulang }));
      UI.toast(r.message); muatLog();
    });
    V().querySelector('[data-csv]').onclick = () => {
      if (LG.tab === 'email') unduhCSV('email-log-' + App.hariIni() + '.csv', [['waktu', 'dosen', 'tipe', 'tgl_eligible', 'penerima', 'subjek', 'status', 'pesan']].concat(d.log.map(r => [r.waktu, r.nama_dosen, r.tipe, r.tgl_eligible, r.penerima, r.subjek, r.status, r.pesan])));
      else unduhCSV('audit-log-' + App.hariIni() + '.csv', [['waktu', 'pengguna', 'peran', 'aksi', 'objek', 'detail']].concat(d.log.map(r => [r.waktu, r.pengguna, r.peran, r.aksi, r.objek, r.detail])));
    };
  }
})();
