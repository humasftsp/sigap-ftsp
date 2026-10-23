/**
 * SIGAP FTSP — pages.js
 * Halaman: Dashboard, Katalog & Detail Dosen, Kelayakan Jabamik, Kelengkapan Berkas,
 * Peringatan Pensiun, Cetak & Rekap, Profil.
 */
(function () {
  const { ic, esc, fmtTgl, badge, STATUS } = UI;
  const Pages = window.Pages = window.Pages || {};
  const V = () => App.view;
  const URUT_STATUS = ['SIAP', 'PENDEK', 'PANJANG', 'BELUM_LENGKAP', 'GB'];
  const JAB_URUT = ['TP', 'ASA', 'L', 'LK', 'GB'];

  function head(eyebrow, judul, teks, aksi) {
    return '<div class="page-head"><div>' + (eyebrow ? '<div class="eyebrow">' + eyebrow + '</div>' : '') + '<h1>' + esc(judul) + '</h1>' +
      (teks ? '<p>' + teks + '</p>' : '') + '</div>' + (aksi ? '<div class="actions">' + aksi + '</div>' : '') + '</div>';
  }
  function hitung(list) {
    const c = { SIAP: 0, PENDEK: 0, PANJANG: 0, BELUM_LENGKAP: 0, GB: 0 };
    list.forEach(d => { if (c[d.status.status] !== undefined) c[d.status.status]++; });
    return c;
  }
  function prodiTerlihat() {
    if (!App.lihatSemua()) return App.prodiPimpinan();
    return (App.boot && App.boot.prodi) || [];
  }
  /** TMT acuan yang ditampilkan: TMT Jabamik; dosen TP tanpa jabamik memakai TMT Karyawan Tetap. */
  function tmtAcuan(d) { return d.tmt_jabamik || (d.status && d.status.jabatan === 'TP' ? d.tmt_karyawan_tetap : '') || d.tmt_jabamik; }
  Pages.tmtAcuan = tmtAcuan;
  const STATUS_DOSEN = ['Aktif', 'Tugas Belajar', 'Izin Belajar', 'Cuti di Luar Tanggungan', 'Diperbantukan', 'Pensiun', 'Berhenti'];
  Pages.STATUS_DOSEN = STATUS_DOSEN;
  /** Badge status dosen (Aktif/Tugas Belajar/…). semua=false → hanya tampil bila bukan Aktif. */
  function badgeStatusDosen(d, semua) {
    const s = d.status_dosen || 'Aktif';
    if (s === 'Aktif' && !semua) return '';
    const cls = s === 'Aktif' ? 'b-ready' : /Belajar/.test(s) ? 'b-long' : /Pensiun|Berhenti/.test(s) ? 'b-gray' : 'b-short';
    return '<span class="badge ' + cls + '" title="Status dosen' + (d.status_dosen_otomatis ? ' (otomatis dari periode tugas belajar)' : '') + '">' + ic(/Belajar/.test(s) ? 'cap' : 'user', 12) + esc(s) + '</span>';
  }
  Pages.badgeStatusDosen = badgeStatusDosen;
  /** Jabatan struktural yang sedang dijabat, mis. "Wakil Dekan IV" ('' bila tidak ada). */
  function jabatanKini(d) { return (d.struktural || []).map(j => j.label).join(', '); }
  Pages.jabatanKini = jabatanKini;

  const fa = v => String(v).replace('.', ',');
  const benar = v => v === true || String(v).toUpperCase() === 'TRUE';
  /** Ringkasan syarat khusus satu baris aturan, mis. ["SKP min. Baik 2 tahun terakhir", ...]. */
  function ringkasKhusus(a) {
    const k = [];
    if (benar(a.syarat_skp)) k.push('SKP min. ' + (a.skp_min || 'Baik') + ' ' + (a.skp_tahun || 2) + ' tahun terakhir');
    if (String(a.syarat_ak_penelitian || '').trim()) k.push('AK penelitian ≥ ' + a.syarat_ak_penelitian + '%');
    if (benar(a.syarat_publikasi)) {
      const m = [String(a.pub_sjr_min || '') !== '' ? 'SJR > ' + fa(a.pub_sjr_min) : '', String(a.pub_if_min || '') !== '' ? 'IF > ' + fa(a.pub_if_min) : ''].filter(Boolean).join(' atau ');
      k.push((a.pub_jumlah || 1) + ' publikasi min. SINTA ' + (a.pub_sinta_min || 4) + ' atau Scopus ' + (a.pub_scopus_min || 'Q4') + (m ? ' (' + m + ')' : ''));
    }
    if (benar(a.syarat_elkite)) k.push('Elkite Tri Dharma');
    return k;
  }
  Pages.ringkasKhusus = ringkasKhusus;
  function tglEligibleHTML(st) {
    if (st.tgl_eligible) {
      const hari = UI.hariKe(App.hariIni(), st.tgl_eligible);
      const rel = hari > 0 ? hari + ' hari lagi' : hari === 0 ? 'hari ini' : 'sejak ' + Math.round(-hari / 30) + ' bln';
      return '<div class="nowrap" style="font-weight:700">' + fmtTgl(st.tgl_eligible) + '</div><div class="small ' + (hari > 0 ? '' : 'muted') + '" style="color:' + (hari > 0 && hari <= 92 ? 'var(--inc-tx)' : hari > 0 ? 'var(--short-tx)' : '') + '">' + rel + (st.estimasi ? ' · estimasi' : '') + '</div>';
    }
    if (st.status === 'PANJANG') return '<span class="muted small">Belum dapat diestimasi</span>';
    return '<span class="muted">—</span>';
  }
  function tahapBadge(d) {
    const st = d.status;
    if (st.status !== 'PENDEK') return '<span class="muted small">—</span>';
    if (d.status_pengusulan === 'Diajukan' || d.status_pengusulan === 'Sedang proses') return '<span class="badge b-blue">' + esc(d.status_pengusulan) + '</span>';
    const t = UI.tahapPengingat(App.hariIni(), st.tgl_eligible);
    if (!t) return '<span class="badge b-gray">' + ic('clock', 12) + 'Sebelum H-6</span>';
    const cls = t === 'H-1' ? 'b-inc' : t === 'H-3' ? 'b-short' : 'b-long';
    return '<span class="badge ' + cls + '">' + ic('mail', 12) + 'Tahap ' + t + '</span>';
  }

  // ============================================================
  // DASHBOARD
  // ============================================================
  Pages.dashboard = async function () {
    V().innerHTML = UI.skeleton();
    const list = await App.muatDosen();
    if (!App.isCurrent()) return;
    if (App.dosenSaja()) return dashboardDosen(list.find(d => d.id_dosen === App.user.id_dosen));

    const aktif = list.filter(d => d.aktif && App.dalamLingkup(d));
    const c = hitung(aktif);
    const nonGB = aktif.length - c.GB;
    const today = App.hariIni();
    const boot = App.boot;
    const cakupan = App.lihatSemua() ? 'Seluruh prodi FTSP' : 'Prodi ' + App.prodiPimpinan().join(', ');
    const namaDepan = String(App.user.nama || '').split(',')[0];

    let h = '<section class="hero">' + UI.motif(0.07) +
      '<div class="h-tags"><span class="h-tag">PEMANTAUAN JABATAN AKADEMIK</span><span class="h-tag">' + ic('building', 12) + esc(cakupan.toUpperCase()) + '</span></div>' +
      '<div class="h-row"><div><h1>Selamat datang, ' + esc(namaDepan) + '</h1>' +
      '<p>Sistem Informasi Pengelolaan dan Pengembangan</p></div>' +
      '<div class="h-stat"><div class="l">PEMICU HARIAN TERAKHIR</div><div class="v">' + (boot.cfg.PEMICU_TERAKHIR ? UI.fmtWaktu(boot.cfg.PEMICU_TERAKHIR) + ' WIB' : 'Belum pernah berjalan') + '</div>' +
      (boot.cfg.PEMICU_RINGKASAN ? '<div class="l" style="margin-top:4px">' + esc(boot.cfg.PEMICU_RINGKASAN) + '</div>' : '') + '</div></div></section>';

    // KPI
    const kpi = [
      ['SIAP', 'ready', 'Status prioritas', 'Siap Diusulkan', 'TMT +24 bulan terlampaui dan seluruh syarat terpenuhi.'],
      ['PENDEK', 'short', 'Pipeline ≤12 bulan', 'Rencana Pendek', 'Eligible dalam 12 bulan atau sedang diusulkan. Email H-6/H-3/H-1 aktif.'],
      ['PANJANG', 'long', 'Pipeline >12 bulan', 'Rencana Panjang', 'Menunggu S3, BKD, NUPTK, atau masa jabatan.'],
      ['BELUM_LENGKAP', 'inc', 'Perlu tindakan admin', 'Data Belum Lengkap', 'TMT/jabatan kosong atau berupa teks. Tidak dikirimi email.']
    ];
    h += '<div class="grid g-4 mb">' + kpi.map(k => '<a class="card kpi click ' + k[1] + '" href="#/dosen?status=' + k[0] + '" style="text-decoration:none">' +
      '<div class="k-top"><div class="k-label">' + k[2] + '</div><div class="k-ico">' + ic(STATUS[k[0]].icon, 18) + '</div></div>' +
      '<div class="k-val tabular">' + c[k[0]] + '<small>dosen</small></div><div class="k-title">' + k[3] + '</div><div class="k-desc">' + k[4] + '</div></a>').join('') + '</div>';

    // Panel notifikasi organisasi (admin): homebase belum ditetapkan & pindah terjadwal
    if (App.isAdmin()) {
      const tanpaHb = aktif.filter(d => !d.id_prodi_homebase);
      const jadwal = aktif.filter(d => d.homebase_terjadwal);
      if (tanpaHb.length || jadwal.length) {
        h += '<div class="grid g-2 mb">' +
          (tanpaHb.length ? '<div class="alert-box amber" style="margin:0">' + ic('building', 16) + '<div><b>' + tanpaHb.length + ' dosen berhomebase "Belum ditetapkan"</b>Tidak masuk rekap per prodi dan tidak terlihat oleh Kaprodi mana pun: ' +
            tanpaHb.slice(0, 4).map(d => esc(d.nama)).join(', ') + (tanpaHb.length > 4 ? ', …' : '') + '. <a href="#/organisasi/homebase?filter=kosong">Tetapkan sekarang →</a></div></div>' : '<div></div>') +
          (jadwal.length ? '<div class="alert-box blue" style="margin:0">' + ic('calendar', 16) + '<div><b>' + jadwal.length + ' pindah homebase terjadwal</b>' +
            jadwal.slice(0, 3).map(d => esc(d.nama) + ' → ' + esc(d.homebase_terjadwal.prodi) + ' per ' + fmtTgl(d.homebase_terjadwal.tgl_mulai)).join('; ') + '. <a href="#/organisasi/homebase">Lihat →</a></div></div>' : '<div></div>') + '</div>';
      }
    }

    // Sebaran jabatan + pensiun
    const prodiList = prodiTerlihat();
    let sebaran = '';
    prodiList.forEach(p => {
      const dp = aktif.filter(d => d.prodi === p);
      const n = {}; JAB_URUT.forEach(j => n[j] = dp.filter(d => d.status.jabatan === j || (j === 'GB' && d.status.status === 'GB')).length);
      const tanpa = dp.length - JAB_URUT.reduce((a, j) => a + n[j], 0);
      const pct = aktif.length ? Math.round(dp.length * 1000 / aktif.length) / 10 : 0;
      sebaran += '<div class="sebaran-row"><div class="sr-head"><div><b>' + esc(p) + '</b> <span class="badge b-blue">' + dp.length + ' dosen</span></div><span class="muted small">' + (prodiList.length > 1 ? pct + '% dosen fakultas' : '') + (tanpa ? ' · ' + tanpa + ' tanpa jabatan' : '') + '</span></div>' +
        '<div class="stack">' + JAB_URUT.filter(j => n[j]).map(j => '<div class="j-' + j + '" style="flex:' + n[j] + '" title="' + UI.jab(j) + ': ' + n[j] + '">' + n[j] + ' ' + j + '</div>').join('') +
        (dp.length ? '' : '<div style="flex:1;background:var(--hover);color:var(--muted)">Belum ada data</div>') + '</div></div>';
    });
    const s3 = aktif.filter(d => d.s3_univ || d.s3_lulus).length;
    const serdos = aktif.filter(d => d.serdos && !/belum|tidak|^-$/i.test(d.serdos)).length;
    const rataKel = aktif.length ? Math.round(aktif.reduce((a, d) => a + d.kelengkapan.persen, 0) / aktif.length) : 0;
    const tanpaLahir = aktif.filter(d => !d.tgl_lahir).length;
    const ministat = (l, v, s) => '<div class="ministat"><div class="l">' + l + '</div><div class="v tabular">' + v + '</div><div class="s">' + s + '</div></div>';

    const pens = aktif.filter(d => d.pensiun.dalam_jendela).sort((a, b) => a.pensiun.bulan_ke_pensiun - b.pensiun.bulan_ke_pensiun);
    const usiaDiatur = (boot.pensiun_aturan || []).some(p => p.usia_pensiun);
    let pensHTML = '';
    if (!usiaDiatur) {
      pensHTML = '<div class="alert-box amber standalone">' + ic('info', 16) + '<div><b>Usia pensiun belum diatur</b>Panel ini aktif setelah admin mengisi usia pensiun per jabatan di Pengaturan.</div></div>';
    } else if (!pens.length) {
      pensHTML = UI.empty('checkCircle', 'Tidak ada dosen dalam jendela', 'Tidak ada dosen yang mencapai batas usia dalam ' + boot.cfg.JENDELA_PENSIUN_BULAN + ' bulan ke depan.');
    } else {
      pensHTML = pens.slice(0, 4).map(d => {
        const b = d.pensiun.bulan_ke_pensiun;
        return '<a class="litem" href="#/dosen/' + esc(d.id_dosen) + '" style="text-decoration:none;color:inherit"><div class="row"><div class="t">' + esc(d.nama) + '</div>' +
          '<span class="badge ' + (b <= 6 ? 'b-inc' : 'b-short') + '">' + (b < 0 ? 'Lewat ' + (-b) + ' bln' : b === 0 ? 'Bulan ini' : b + ' bln lagi') + '</span></div>' +
          '<div class="s">' + esc(d.prodi) + ' · ' + esc(d.status.jabatan_label) + ' · batas ' + d.pensiun.usia_pensiun + ' thn</div>' +
          '<div class="row s"><span>Lahir ' + fmtTgl(d.tgl_lahir) + '</span><span><b style="color:var(--ink)">Usia ' + d.pensiun.usia_tahun + ' thn ' + d.pensiun.usia_bulan + ' bln</b></span></div></a>';
      }).join('');
    }

    h += '<div class="grid g-main mb">' +
      '<div class="card"><div class="card-head"><div><h3>' + ic('grid', 18) + 'Distribusi Jabatan Akademik</h3><div class="sub">Komposisi jenjang dosen aktif per program studi</div></div><span class="badge b-blue">' + aktif.length + ' dosen aktif</span></div>' +
      '<div class="card-body"><div class="legend">' + [['TP', '#CBD5E1'], ['ASA', '#A8C4FF'], ['L', '#0066CC'], ['LK', '#113264'], ['GB', '#D97706']].map(x => '<span><i style="background:' + x[1] + '"></i>' + x[0] + ': ' + UI.jab(x[0]) + '</span>').join('') + '</div>' + sebaran +
      '<div class="ministats">' + ministat('Bergelar S3', s3, 'dari ' + aktif.length + ' dosen') + ministat('Tersertifikasi', serdos, 'Serdos tercatat') +
      ministat('Kelengkapan berkas', rataKel + '%', 'rata-rata') + ministat('Tugas belajar', aktif.filter(d => /Belajar/.test(d.status_dosen || '')).length, 'sedang studi lanjut') + ministat('Tgl lahir kosong', tanpaLahir, 'perlu untuk pensiun') + '</div></div></div>' +
      '<div class="card"><div class="card-head"><div><h3>' + ic('hourglass', 18) + 'Peringatan Pensiun</h3><div class="sub">Jendela ' + boot.cfg.JENDELA_PENSIUN_BULAN + ' bulan ke depan</div></div>' + (pens.length ? '<span class="badge b-inc">' + pens.length + ' dosen</span>' : '') + '</div>' +
      '<div class="card-body">' + pensHTML + '<a class="btn btn-soft btn-sm" href="#/pensiun" style="width:100%;justify-content:center;margin-top:12px">Buka Peringatan Pensiun ' + ic('arrowR', 14) + '</a></div></div></div>';

    // Prioritas jangka pendek
    const pendek = aktif.filter(d => d.status.status === 'PENDEK').sort((a, b) => String(a.status.tgl_eligible || '9').localeCompare(String(b.status.tgl_eligible || '9')));
    h += '<div class="card"><div class="card-head"><div><h3>' + ic('clock', 18) + 'Prioritas Rencana Jangka Pendek</h3><div class="sub">Urut tanggal eligible terdekat, beserta tahap email pengingat yang berlaku hari ini</div></div>' +
      '<a class="btn btn-outline btn-sm" href="#/dosen?status=PENDEK">Lihat semua (' + pendek.length + ') ' + ic('chevR', 14) + '</a></div><div class="card-body" style="padding:12px 0 0">';
    if (!pendek.length) h += UI.empty('checkCircle', 'Belum ada rencana jangka pendek', 'Tidak ada dosen yang eligible dalam 12 bulan ke depan.');
    else {
      h += '<div class="table-wrap"><table class="tbl tbl-cards"><thead><tr><th>Dosen</th><th>Prodi</th><th>Jenjang</th><th class="num">TMT</th><th>Eligible efektif</th><th>Pengingat</th><th class="num">Berkas</th></tr></thead><tbody>' +
        pendek.slice(0, 8).map(d => '<tr class="click" data-href="#/dosen/' + esc(d.id_dosen) + '"><td>' + UI.person(d) + '</td><td data-l="Prodi">' + esc(d.prodi) + '</td><td data-l="Jenjang">' + UI.jenjang(d.status) + '</td>' +
          '<td class="num" data-l="TMT">' + fmtTgl(tmtAcuan(d)) + '</td><td data-l="Eligible">' + tglEligibleHTML(d.status) + '</td><td data-l="Pengingat">' + tahapBadge(d) + '</td>' +
          '<td class="num" data-l="Berkas">' + d.kelengkapan.ada + '/' + d.kelengkapan.total + '</td></tr>').join('') + '</tbody></table></div>';
      if (pendek.length > 8) h += '<div class="pager"><span class="muted small">Menampilkan 8 dari ' + pendek.length + ' dosen kategori Rencana Pendek</span><a href="#/dosen?status=PENDEK">Lihat seluruh pipeline ' + ic('chevR', 14) + '</a></div>';
    }
    h += '</div></div>';
    V().innerHTML = h;
    V().querySelectorAll('tr[data-href]').forEach(tr => tr.onclick = () => App.go(tr.dataset.href));
  };

  function dashboardDosen(d) {
    if (!d) { V().innerHTML = UI.empty('alertCircle', 'Akun belum tertaut ke data dosen', 'Hubungi admin agar akun Anda ditautkan ke data dosen.'); return; }
    const st = d.status;
    const m = STATUS[st.status] || {};
    let h = '<section class="hero">' + UI.motif(0.07) + '<div class="h-tags"><span class="h-tag">DATA SAYA</span><span class="h-tag">' + ic('building', 12) + esc(d.prodi || 'Homebase belum ditetapkan') + '</span>' + (d.struktural || []).map(j => '<span class="h-tag">' + esc(j.label) + '</span>').join('') + '</div>' +
      '<div class="h-row"><div><h1>Halo, ' + esc(String(d.nama).split(',')[0]) + '</h1><p>' + esc(m.label || st.status) + ' — ' + esc((st.alasan || []).join(' ')) + '</p></div>' +
      '<div class="h-stat"><div class="l">TANGGAL ELIGIBLE EFEKTIF</div><div class="v">' + (st.tgl_eligible ? fmtTgl(st.tgl_eligible, true) : st.status === 'GB' ? 'Tidak berlaku' : 'Belum dapat diestimasi') + '</div></div></div></section>';
    h += '<div class="grid g-main"><div class="card"><div class="card-head"><h3>' + ic('award', 18) + 'Syarat kenaikan jabatan</h3>' + badge(st.status) + '</div><div class="card-body">' +
      '<div class="dproj" style="margin-top:0;margin-bottom:16px"><div><div class="l">Jabatan Akademik</div><div class="v">' + esc(st.jabatan_label) + '</div><div class="s">' + (st.acuan_tmt === 'TMT Karyawan Tetap' ? 'TMT Karyawan Tetap ' : 'TMT ') + fmtTgl(tmtAcuan(d)) + '</div></div>' +
      '<div><div class="l">Target berikutnya</div><div class="v">' + esc(st.target_label || '—') + '</div><div class="s">' + esc(d.status_pengusulan ? 'Pengusulan: ' + d.status_pengusulan : '') + '</div></div>' +
      '<div><div class="l">Eligible</div><div class="v">' + (st.tgl_eligible ? fmtTgl(st.tgl_eligible) : '—') + '</div><div class="s">' + (st.estimasi ? 'sebagian estimasi' : '') + '</div></div></div>' +
      checklist(st) + '<p class="muted small" style="margin:14px 0 0">Data kepegawaian (jabatan, TMT, pendidikan, homebase) diubah oleh admin SIGAP. Profil singkat, bidang keahlian, dan nomor WhatsApp dapat Anda ubah di <a href="#/dosen/' + esc(d.id_dosen) + '?tab=profil">Profil Saya</a>.</p></div></div>' +
      '<div class="card"><div class="card-head"><h3>' + ic('folder', 18) + 'Berkas saya</h3></div><div class="card-body">' + UI.meterKel(d.kelengkapan) +
      '<div style="margin-top:14px;display:grid;gap:8px">' + (App.boot.jenis_berkas || []).map(j => {
        const it = d.kelengkapan.item[j.kode] || {};
        return '<div class="syr"><span class="k">' + (it.ada ? '<span class="ok">' + ic('checkCircle', 16) + '</span>' : '<span class="bad">' + ic('alertCircle', 16) + '</span>') + '<span>' + esc(j.nama) + '</span></span><span class="v ' + (it.ada ? 'ok' : 'bad') + '">' + (it.ada ? 'Ada' : 'Belum') + '</span></div>';
      }).join('') + '</div><a class="btn btn-soft btn-sm" href="#/berkas" style="width:100%;justify-content:center;margin-top:14px">Lihat & unduh berkas</a></div></div></div>';
    V().innerHTML = h;
  }

  function checklist(st) {
    if (st.status === 'GB') return '<div class="alert-box green standalone">' + ic('award', 16) + '<div>Guru Besar dikecualikan dari pemantauan kenaikan jabatan.</div></div>';
    if (st.status === 'BELUM_LENGKAP') return '<div class="alert-box standalone">' + ic('alert', 16) + '<div><b>Status belum dapat dihitung</b>' + esc((st.alasan || []).join('; ')) + '</div></div>';
    if (!st.syarat || !st.syarat.length) return '<div class="muted">Tidak ada syarat.</div>';
    return '<div class="checklist">' + st.syarat.map(s => '<div class="ck ' + (s.terpenuhi ? 'ok' : 'no') + '"><div class="ic">' + ic(s.terpenuhi ? 'check' : 'clock', 16) + '</div>' +
      '<div><div class="t">' + esc(s.nama) + (s.khusus ? ' <span class="badge b-blue" style="margin-left:4px">Syarat khusus</span>' : '') + '</div><div class="s">' + esc(s.ket) + '</div></div><div class="d">' + (s.tanggal ? fmtTgl(s.tanggal) : (s.terpenuhi ? 'Terpenuhi' : 'Belum')) + '</div></div>').join('') + '</div>';
  }

  // ============================================================
  // KATALOG DOSEN
  // ============================================================
  const KAT = { q: '', jur: '', prodi: '', status: '', jab: '', kel: '', sd: '', sort: 'eligible', hal: 1, nonaktif: false };

  Pages.dosen = async function (param, q) {
    if (param) return detailDosen(param);
    if (q && (q.status !== undefined || q.q !== undefined)) { Object.assign(KAT, { q: q.q || '', status: q.status || '', jur: '', prodi: '', jab: '', kel: '', hal: 1 }); }
    else { KAT.q = ''; } // pencarian tidak menempel saat kembali dari menu lain
    KAT.view = UI.bacaLokal('view_dosen', window.innerWidth < 768 ? 'grid' : 'grid');
    V().innerHTML = UI.skeleton();
    await App.muatDosen();
    if (!App.isCurrent()) return;
    renderKatalog();
  };

  function filterKatalog() {
    const q = KAT.q.toLowerCase();
    let l = (App.dosen || []).filter(d => KAT.nonaktif ? (App.dalamLingkup(d) || d.contoh) : (d.aktif && App.dalamLingkup(d)));
    if (q) l = l.filter(d => (d.nama + ' ' + d.nidn + ' ' + d.nuptk + ' ' + d.email).toLowerCase().indexOf(q) >= 0);
    if (KAT.jur) l = l.filter(d => (d.kelompok_bidang || '') === KAT.jur);
    if (KAT.prodi === '__kosong') l = l.filter(d => !d.id_prodi_homebase);
    else if (KAT.prodi) l = l.filter(d => d.prodi === KAT.prodi);
    if (KAT.jab) l = l.filter(d => d.status.jabatan === KAT.jab);
    if (KAT.sd) l = l.filter(d => (d.status_dosen || 'Aktif') === KAT.sd);
    if (KAT.kel === 'lengkap') l = l.filter(d => d.kelengkapan.persen >= 100);
    if (KAT.kel === 'kurang') l = l.filter(d => d.kelengkapan.persen < 100);
    const sebelumStatus = l;
    if (KAT.status) l = l.filter(d => (KAT.status === 'NONAKTIF' ? !d.aktif : d.status.status === KAT.status));
    const s = KAT.sort;
    l = l.slice().sort((a, b) => {
      if (s === 'nama') return a.nama.localeCompare(b.nama);
      if (s === 'jabatan') return (JAB_URUT.indexOf(a.status.jabatan) - JAB_URUT.indexOf(b.status.jabatan)) || a.nama.localeCompare(b.nama);
      if (s === 'kelengkapan') return a.kelengkapan.persen - b.kelengkapan.persen || a.nama.localeCompare(b.nama);
      const ua = URUT_STATUS.indexOf(a.status.status), ub = URUT_STATUS.indexOf(b.status.status);
      return ua - ub || String(a.status.tgl_eligible || '9999').localeCompare(String(b.status.tgl_eligible || '9999')) || a.nama.localeCompare(b.nama);
    });
    return { list: l, dasar: sebelumStatus };
  }

  function renderKatalog() {
    const admin = App.isAdmin();
    const { list, dasar } = filterKatalog();
    const c = hitung(dasar.filter(d => d.aktif));
    const per = KAT.view === 'tabel' ? 25 : 12;
    const nHal = Math.max(1, Math.ceil(list.length / per));
    if (KAT.hal > nHal) KAT.hal = nHal;
    const potong = list.slice((KAT.hal - 1) * per, KAT.hal * per);
    const prodiList = prodiTerlihat();

    let h = head('Direktori', 'Katalog & Progres Jabamik', (App.dosen || []).filter(d => d.aktif && App.dalamLingkup(d)).length + ' dosen aktif' + (App.lihatSemua() ? ' di FTSP' : ' di Prodi ' + esc(App.prodiPimpinan().join(', '))) + '. Klik kartu untuk detail, syarat, dan berkas.',
      '<button class="btn btn-outline" data-act="unduh" ' + (list.length ? '' : 'disabled') + '>' + ic('download', 16) + 'Unduh Excel (' + list.length + ')</button>' + (admin ? '<button class="btn btn-primary" data-act="tambah">' + ic('plus', 16) + 'Tambah Dosen</button>' : ''));

    // Pilihan jurusan (kelompok bidang): Teknik Sipil, Arsitektur, ... — S1 & S2 digabung
    const jurList = [];
    (App.boot.prodi_master || []).filter(p => p.aktif).forEach(p => { if (jurList.indexOf(p.kelompok_bidang) < 0) jurList.push(p.kelompok_bidang); });
    const dasarJur = (App.dosen || []).filter(d => d.aktif && App.dalamLingkup(d));
    const jurTampil = jurList.filter(j => dasarJur.some(d => d.kelompok_bidang === j));
    if (jurTampil.length > 1) h += '<div class="jur-tabs">' + [['', 'Semua Jurusan', dasarJur.length]].concat(jurTampil.map(j => [j, j, dasarJur.filter(d => d.kelompok_bidang === j).length]))
      .map(j => '<button class="' + (KAT.jur === j[0] ? 'on' : '') + '" data-jur="' + esc(j[0]) + '">' + ic(j[0] ? 'building' : 'grid', 16) + esc(j[1]) + '<span class="n">' + j[2] + '</span></button>').join('') + '</div>';

    h += '<div class="pills mb">' + [['', 'Semua', dasar.filter(d => d.aktif).length]].concat(URUT_STATUS.map(s => [s, STATUS[s].short, c[s]])).concat(admin && KAT.nonaktif ? [['NONAKTIF', 'Nonaktif', dasar.filter(d => !d.aktif).length]] : [])
      .map(p => '<button class="pill ' + (KAT.status === p[0] ? 'on' : '') + '" data-status="' + p[0] + '">' + (p[0] && p[0] !== 'NONAKTIF' ? '<span class="dot" style="color:var(--' + { SIAP: 'ready', PENDEK: 'short', PANJANG: 'long', BELUM_LENGKAP: 'inc', GB: 'gb' }[p[0]] + '-' + (p[0] === 'GB' ? 'tx' : 'solid') + ')"></span>' : '') + esc(p[1]) + '<span class="n">' + p[2] + '</span></button>').join('') + '</div>';

    h += '<div class="toolbar"><div class="input-icon grow">' + ic('search', 17) + '<input class="input" id="k-q" placeholder="Cari nama, NIDN, NUPTK, email…" value="' + esc(KAT.q) + '"></div>' +
      (prodiList.length > 1 ? '<select class="input" id="k-prodi" aria-label="Homebase"><option value="">Semua prodi' + (KAT.jur ? ' ' + esc(KAT.jur) : '') + '</option>' + prodiList.filter(p => !KAT.jur || (App.boot.prodi_master || []).some(m => m.label === p && m.kelompok_bidang === KAT.jur)).map(p => '<option ' + (KAT.prodi === p ? 'selected' : '') + '>' + esc(p) + '</option>').join('') + (App.lihatSemua() ? '<option value="__kosong" ' + (KAT.prodi === '__kosong' ? 'selected' : '') + '>Belum ditetapkan</option>' : '') + '</select>' : '') +
      '<select class="input" id="k-jab"><option value="">Semua jabatan</option>' + JAB_URUT.map(j => '<option value="' + j + '" ' + (KAT.jab === j ? 'selected' : '') + '>' + UI.jab(j) + '</option>').join('') + '</select>' +
      '<select class="input" id="k-sd" aria-label="Status dosen"><option value="">Semua status dosen</option>' + STATUS_DOSEN.map(x => '<option ' + (KAT.sd === x ? 'selected' : '') + '>' + x + '</option>').join('') + '</select>' +
      '<select class="input" id="k-kel"><option value="">Semua kelengkapan</option><option value="lengkap" ' + (KAT.kel === 'lengkap' ? 'selected' : '') + '>Berkas lengkap</option><option value="kurang" ' + (KAT.kel === 'kurang' ? 'selected' : '') + '>Berkas belum lengkap</option></select>' +
      '<select class="input" id="k-sort" aria-label="Urutkan">' + [['eligible', 'Urut: Status & eligible'], ['nama', 'Urut: Nama'], ['jabatan', 'Urut: Jabatan'], ['kelengkapan', 'Urut: Kelengkapan']].map(o => '<option value="' + o[0] + '" ' + (KAT.sort === o[0] ? 'selected' : '') + '>' + o[1] + '</option>').join('') + '</select>' +
      '<div class="seg" id="k-view"><button class="' + (KAT.view !== 'tabel' ? 'on' : '') + '" data-v="grid">' + ic('grid', 15) + '</button><button class="' + (KAT.view === 'tabel' ? 'on' : '') + '" data-v="tabel">' + ic('list', 15) + '</button></div>' +
      (admin ? '<label class="check small"><input type="checkbox" id="k-non" ' + (KAT.nonaktif ? 'checked' : '') + '>Tampilkan nonaktif & akun contoh</label>' : '') + '</div>';

    if (!list.length) {
      h += '<div class="card">' + UI.empty('search', (App.dosen || []).length ? 'Tidak ada dosen yang cocok' : 'Belum ada data dosen', (App.dosen || []).length ? 'Ubah kata kunci atau filter.' : (admin ? 'Mulai dengan mengimpor file 2026-JABAMIK.xlsx atau menambah dosen satu per satu.' : 'Admin belum memasukkan data dosen.'),
        admin && !(App.dosen || []).length ? '<a class="btn btn-primary" href="#/impor">' + ic('upload', 16) + 'Impor Excel</a>' : '') + '</div>';
    } else if (KAT.view === 'tabel') {
      h += '<div class="card"><div class="table-wrap"><table class="tbl tbl-cards"><thead><tr><th>Dosen</th><th>Homebase</th><th>Jenjang</th><th class="num">TMT</th><th>Eligible efektif</th><th>Status</th><th>Berkas</th></tr></thead><tbody>' +
        potong.map(d => '<tr class="click" data-href="#/dosen/' + esc(d.id_dosen) + '"><td>' + UI.person(d) + '</td><td data-l="Homebase">' + (d.prodi ? esc(d.prodi) : '<span class="badge b-short">Belum ditetapkan</span>') + '</td><td data-l="Jenjang">' + UI.jenjang(d.status) + '</td>' +
          '<td class="num" data-l="TMT">' + fmtTgl(tmtAcuan(d)) + '</td><td data-l="Eligible">' + tglEligibleHTML(d.status) + '</td><td data-l="Status">' + (d.aktif ? badge(d.status.status) : badge('NONAKTIF')) + '</td>' +
          '<td data-l="Berkas" style="min-width:120px">' + UI.meterKel(d.kelengkapan, { head: false, thin: true }) + '<div class="small muted" style="margin-top:3px">' + d.kelengkapan.ada + '/' + d.kelengkapan.total + ' berkas</div></td></tr>').join('') +
        '</tbody></table></div>' + UI.pager(list.length, KAT.hal, per, 'data-hal') + '</div>';
    } else {
      h += '<div class="dcards">' + potong.map(kartuDosen).join('') + '</div><div class="card" style="margin-top:18px">' + UI.pager(list.length, KAT.hal, per, 'data-hal') + '</div>';
    }
    V().innerHTML = h;

    const rerender = () => { KAT.hal = 1; renderKatalog(); };
    const qEl = V().querySelector('#k-q');
    qEl.addEventListener('input', UI.debounce(() => { KAT.q = qEl.value.trim(); rerender(); const n = V().querySelector('#k-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 300));
    V().querySelectorAll('[data-status]').forEach(b => b.onclick = () => { KAT.status = b.dataset.status; rerender(); });
    const kp = V().querySelector('#k-prodi'); if (kp) kp.onchange = e => { KAT.prodi = e.target.value; rerender(); };
    V().querySelectorAll('#k-view button').forEach(b => b.onclick = () => { KAT.view = b.dataset.v; UI.simpanLokal('view_dosen', KAT.view); rerender(); });
    V().querySelector('#k-jab').onchange = e => { KAT.jab = e.target.value; rerender(); };
    V().querySelector('#k-kel').onchange = e => { KAT.kel = e.target.value; rerender(); };
    V().querySelector('#k-sd').onchange = e => { KAT.sd = e.target.value; rerender(); };
    V().querySelector('#k-sort').onchange = e => { KAT.sort = e.target.value; rerender(); };
    const non = V().querySelector('#k-non'); if (non) non.onchange = e => { KAT.nonaktif = e.target.checked; if (!KAT.nonaktif && KAT.status === 'NONAKTIF') KAT.status = ''; rerender(); };
    V().querySelectorAll('[data-hal]').forEach(b => b.onclick = () => { KAT.hal = +b.dataset.hal; renderKatalog(); window.scrollTo(0, 0); });
    V().querySelectorAll('[data-href]').forEach(el => el.addEventListener('click', e => { if (!e.target.closest('a,button')) App.go(el.dataset.href); }));
    const t = V().querySelector('[data-act="tambah"]'); if (t) t.onclick = () => Pages.formDosen(null);
    V().querySelectorAll('[data-jur]').forEach(b => b.onclick = () => { KAT.jur = b.dataset.jur; KAT.prodi = ''; rerender(); });
    const un = V().querySelector('[data-act="unduh"]'); if (un) un.onclick = e => UI.sibuk(e.currentTarget, () => unduhKatalog(list)).catch(() => { });
  }

  /** Unduh data katalog yang sedang tampil (sesuai filter) sebagai Excel. Data pribadi hanya untuk admin. */
  async function unduhKatalog(list) {
    const admin = App.isAdmin();
    const kol = ['No', 'Nama', 'NIDN', 'NUPTK', 'Jurusan', 'Homebase', 'Status dosen', 'Jabatan saat ini', 'Jabatan akademik', 'TMT Jabamik', 'TMT Karyawan Tetap',
      'Target jabatan', 'Tanggal eligible efektif', 'Status kelayakan', 'Alasan status', 'Syarat khusus terpenuhi', 'Status pengusulan', 'Kelengkapan berkas (%)']
      .concat(admin ? ['Email', 'No. WhatsApp', 'Tanggal lahir'] : []);
    const rows = list.map((d, i) => {
      const st = d.status || {};
      const kh = (st.syarat || []).filter(x => x.khusus);
      return [i + 1, d.nama, d.nidn, d.nuptk, d.kelompok_bidang || '', d.prodi || 'Belum ditetapkan', d.status_dosen || 'Aktif', jabatanKini(d) || 'Dosen', st.jabatan_label || '',
        d.tmt_jabamik || '', d.tmt_karyawan_tetap || '', st.target_label || '', st.tgl_eligible || '', d.aktif ? (STATUS[st.status] || {}).label || st.status : 'Nonaktif',
        (st.alasan || []).join('; '), kh.length ? kh.filter(x => x.terpenuhi).length + '/' + kh.length : '—', d.status_pengusulan || 'Belum', d.kelengkapan ? d.kelengkapan.persen : '']
        .concat(admin ? [d.email || '', d.no_wa || '', d.tgl_lahir || ''] : []);
    });
    const label = [KAT.jur, KAT.prodi === '__kosong' ? 'Belum ditetapkan' : KAT.prodi, KAT.status ? (STATUS[KAT.status] || {}).short : ''].filter(Boolean).join('-').replace(/[^\w-]+/g, '_');
    await UI.unduhXLSX('Katalog-Dosen-SIGAP' + (label ? '-' + label : '') + '-' + App.hariIni() + '.xlsx', 'Katalog Dosen', [kol].concat(rows),
      kol.map(k => ({ No: 5, Nama: 36, 'Alasan status': 50 })[k] || Math.max(12, k.length + 3)));
    UI.toast(rows.length + ' baris diunduh');
  }

  function kartuDosen(d) {
    const st = d.status;
    const m = STATUS[st.status] || {};
    let mid = '';
    if (!d.aktif) mid = '<div class="alert-box blue">' + ic('info', 16) + '<div>Data dosen ini dinonaktifkan.</div></div>';
    else if (st.status === 'BELUM_LENGKAP') mid = '<div class="alert-box">' + ic('alertCircle', 16) + '<div><b>Status belum dapat dihitung</b>' + esc(st.alasan.join('; ')) + '. Email pengingat dihentikan sampai data dilengkapi.</div></div>';
    else if (st.status === 'GB') mid = '<div class="alert-box blue">' + ic('award', 16) + '<div>Guru Besar — dikecualikan dari pemantauan kenaikan jabatan.</div></div>';
    else {
      const sy = (st.syarat || []).slice(0, 3).map(s => '<div class="syr"><span class="k">' + (s.terpenuhi ? '<span class="ok">' + ic('checkCircle', 15) + '</span>' : '<span class="no">' + ic('clock', 15) + '</span>') + '<span>' + esc(s.nama) + '</span></span><span class="v ' + (s.terpenuhi ? 'ok' : 'no') + '">' + esc(s.terpenuhi ? 'Terpenuhi' : (s.tanggal ? fmtTgl(s.tanggal) : 'Belum')) + '</span></div>').join('');
      mid = '<div class="dc-syarat">' + sy + '<div class="syr"><span class="k"><span style="color:var(--blue)">' + ic('calendar', 15) + '</span><span>Eligible efektif</span></span><span class="v" style="color:var(--navy)">' + (st.tgl_eligible ? fmtTgl(st.tgl_eligible) + (st.estimasi ? '*' : '') : 'Belum dapat diestimasi') + '</span></div></div>';
    }
    const proj = st.jabatan && st.target
      ? '<div class="dc-proj"><div><div class="l">Jabatan akademik</div><div class="v">' + esc(st.jabatan_label) + '</div></div><div class="arrow">' + ic('arrowR', 18) + '</div><div class="r"><div class="l">Target</div><div class="v">' + esc(st.target_label) + '</div></div></div>'
      : '<div class="dc-proj"><div><div class="l">Jabatan</div><div class="v">' + esc(st.jabatan_label || '—') + '</div></div><div></div><div></div></div>';
    return '<article class="card dcard ' + (d.aktif ? m.cls || '' : '') + '" data-href="#/dosen/' + esc(d.id_dosen) + '" style="cursor:pointer">' +
      '<div class="dc-top">' + UI.avatar(d) + '<div style="min-width:0;flex:1"><div class="dc-name">' + esc(d.nama) + '</div><div class="dc-meta">' + esc(UI.identitas(d)) + ' · ' + esc(d.prodi || 'Homebase belum ditetapkan') + '</div>' +
      '<div class="dc-badge">' + (d.aktif ? badge(st.status) : badge('NONAKTIF')) + ' ' + badgeStatusDosen(d) + (jabatanKini(d) ? ' <span class="badge b-navy">' + esc(jabatanKini(d)) + '</span>' : '') + (d.contoh ? ' <span class="badge b-gb">Akun contoh</span>' : '') + (d.status_pengusulan && d.status_pengusulan !== 'Belum' ? ' <span class="badge b-blue">' + esc(d.status_pengusulan) + '</span>' : '') + '</div></div></div>' +
      proj + mid + '<div class="dc-kel">' + UI.meterKel(d.kelengkapan) + '</div>' +
      '<div class="dc-foot"><a href="#/dosen/' + esc(d.id_dosen) + '" class="btn btn-ghost btn-sm">Lihat detail</a>' +
      (App.isAdmin() ? '<a href="#/dosen/' + esc(d.id_dosen) + '?tab=berkas" class="btn btn-soft btn-sm">' + ic('folder', 14) + 'Berkas</a>' : '<span class="small muted">' + d.kelengkapan.ada + '/' + d.kelengkapan.total + ' berkas</span>') + '</div></article>';
  }

  // ============================================================
  // DETAIL DOSEN
  // ============================================================
  const TABS = [['syarat', 'Syarat & Status'], ['khusus', 'Syarat Khusus'], ['profil', 'Profil'], ['pendidikan', 'Pendidikan'], ['riwayat', 'Riwayat Jabatan'], ['homebase', 'Homebase & Struktural'], ['berkas', 'Berkas & Kelengkapan'], ['pengusulan', 'Pengusulan']];

  async function detailDosen(id, tabAwal) {
    const q = (location.hash.split('?')[1] || '');
    let tab = tabAwal || (q.match(/tab=(\w+)/) || [])[1] || 'syarat';
    V().innerHTML = UI.skeleton(4);
    const r = await API.call('getDosen', { id_dosen: id });
    if (!App.isCurrent()) return;
    const d = r.dosen;
    const st = d.status;
    const admin = App.isAdmin();
    const m = STATUS[st.status] || {};
    const milik = !!App.user.id_dosen && App.user.id_dosen === d.id_dosen;
    const bisaBuka = admin || milik;

    let h = (App.pimpinan() ? '<a href="#/dosen" class="btn btn-ghost btn-sm" style="margin-bottom:12px;padding-left:6px">' + ic('chevL', 16) + 'Katalog dosen</a>' : '') +
      '<div class="card card-pad mb"><div class="dhead">' + UI.avatar(d, 'lg') + '<div class="dh-main"><h1>' + esc(d.nama) + '</h1>' +
      '<div class="meta">' + (d.nidn ? '<span>NIDN ' + esc(d.nidn) + '</span>' : '') + (d.nuptk ? '<span>· NUPTK ' + esc(d.nuptk) + '</span>' : '') + (d.prodi ? '<span class="tag">' + ic('building', 12) + ' ' + esc(d.prodi) + '</span>' : '<span class="badge b-short">Homebase belum ditetapkan</span>') + (d.struktural || []).map(j => '<span class="badge b-navy">' + esc(j.label) + '</span>').join('') +
      (d.aktif ? badge(st.status) : badge('NONAKTIF')) + badgeStatusDosen(d, true) + (d.contoh ? '<span class="badge b-gb">Akun contoh</span>' : '') + (d.status_pengusulan && d.status_pengusulan !== 'Belum' ? '<span class="badge b-blue">Pengusulan: ' + esc(d.status_pengusulan) + '</span>' : '') + '</div>' +
      (d.email ? '<div class="small muted" style="margin-top:6px">' + ic('mail', 13) + ' ' + esc(d.email) + '</div>' : '') + '</div>' +
      (admin ? '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-outline btn-sm" data-act="edit">' + ic('edit', 15) + 'Ubah data</button>' +
        '<button class="btn btn-primary btn-sm" data-act="pengusulan">' + ic('send', 15) + 'Status pengusulan</button>' +
        '<button class="btn btn-ghost btn-sm" data-act="aktif">' + (d.aktif ? 'Nonaktifkan' : 'Aktifkan') + '</button></div>' : (milik ? '<button class="btn btn-outline btn-sm" data-act="profilsaya">' + ic('edit', 15) + 'Ubah profil saya</button>' : '')) + '</div>' +
      '<div class="dproj dproj-4"><div><div class="l">Jabatan saat ini</div><div class="v">' + esc(jabatanKini(d) || 'Dosen') + '</div><div class="s">' +
        ((d.struktural || []).length ? 'Jabatan struktural sejak ' + fmtTgl(d.struktural[0].tgl_mulai) + (d.struktural[0].tgl_selesai ? ' s.d. ' + fmtTgl(d.struktural[0].tgl_selesai) : '') : 'Tanpa jabatan struktural') + '</div></div>' +
      '<div><div class="l">Jabatan Akademik</div><div class="v">' + esc(st.jabatan_label || '—') + '</div><div class="s">' + (st.acuan_tmt === 'TMT Karyawan Tetap' ? 'TMT Karyawan Tetap ' : 'TMT ') + fmtTgl(tmtAcuan(d)) + (d.no_sk_jabatan ? ' · SK ' + esc(d.no_sk_jabatan) : '') + '</div></div>' +
      '<div><div class="l">Target jabatan berikutnya</div><div class="v" style="color:var(--blue)">' + esc(st.target_label || (st.status === 'GB' ? 'Jenjang tertinggi' : '—')) + '</div><div class="s">' + esc(m.desc || '') + '</div></div>' +
      '<div><div class="l">Tanggal eligible efektif</div><div class="v">' + (st.tgl_eligible ? fmtTgl(st.tgl_eligible, true) : (st.status === 'PANJANG' ? 'Belum dapat diestimasi' : '—')) + '</div><div class="s">' +
      (st.tgl_eligible ? (UI.relatifBulan(st.bulan_ke_eligible) + (st.estimasi ? ' · sebagian estimasi' : '')) : '') + '</div></div></div>';
    if (st.alasan && st.alasan.length) {
      const cls = { SIAP: 'green', PENDEK: 'amber', PANJANG: 'blue', BELUM_LENGKAP: '' }[st.status];
      h += '<div class="alert-box ' + (cls === undefined ? 'blue' : cls) + '" style="margin:16px 0 0">' + ic(st.status === 'BELUM_LENGKAP' ? 'alertCircle' : 'info', 16) + '<div><b>Alasan status</b>' + esc(st.alasan.join(' · ')) + '</div></div>';
    }
    h += '</div>';
    h += '<div class="tabs" role="tablist">' + TABS.map(t => '<button role="tab" class="' + (t[0] === tab ? 'on' : '') + '" data-tab="' + t[0] + '">' + t[1] + (t[0] === 'berkas' ? '<span class="n">' + d.kelengkapan.ada + '/' + d.kelengkapan.total + '</span>' : t[0] === 'riwayat' && d.riwayat.length ? '<span class="n">' + d.riwayat.length + '</span>' : t[0] === 'homebase' && d.homebase_terjadwal ? '<span class="n">1 terjadwal</span>' : '') + '</button>').join('') + '</div><div id="tabc"></div>';
    V().innerHTML = h;

    const render = t => {
      tab = t;
      V().querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
      const el = V().querySelector('#tabc');
      if (t === 'syarat') el.innerHTML = '<div class="card card-pad">' + checklist(st) + '<p class="muted small" style="margin:14px 0 0">Tanggal eligible efektif = tanggal paling akhir di antara TMT + masa minimal dan tanggal syarat lain (lulus S3, akhir tugas belajar + jeda, estimasi BKD). Tanda * / "estimasi" berarti tanggal berasal dari perkiraan.</p></div>';
      if (t === 'profil') {
        const keahlian = String(d.bidang_keahlian || '').split(',').map(x => x.trim()).filter(Boolean);
        el.innerHTML = '<div class="grid g-main" style="align-items:start"><div class="card card-pad"><div class="lbl" style="margin-bottom:6px">DATA KEPEGAWAIAN</div><dl class="dl">' + [
          ['Nama', d.nama], ['Status dosen', (d.status_dosen || 'Aktif') + (d.status_dosen_otomatis ? ' (otomatis dari periode tugas belajar)' : '')], ['Jabatan saat ini', jabatanKini(d) || 'Dosen'], ['Homebase', d.prodi || 'Belum ditetapkan'], ['NIDN', d.nidn], ['NUPTK', d.nuptk || '—'], ['Status NUPTK', d.status_nuptk || (d.nuptk ? 'Ada' : '—')], ['Email', d.email],
          ['Nomor WhatsApp', d.no_wa || '—'], ['Tanggal lahir', fmtTgl(d.tgl_lahir)], ['Usia', d.pensiun.usia_tahun !== null ? d.pensiun.usia_tahun + ' thn ' + d.pensiun.usia_bulan + ' bln' : '—'],
          ['TMT Karyawan Tetap', fmtTgl(d.tmt_karyawan_tetap)], ['TMT Jabamik', fmtTgl(d.tmt_jabamik)],
          ['Serdos', d.serdos || '—'], ['BKD terpenuhi berturut', d.bkd_semester !== '' ? d.bkd_semester + ' semester' : '—'],
          ['Batas usia pensiun', d.pensiun.usia_pensiun ? d.pensiun.usia_pensiun + ' thn · ' + fmtTgl(d.pensiun.tgl_pensiun) : (d.pensiun.catatan || '—')], ['Catatan', d.catatan || '—']
        ].map(x => '<div><dt>' + x[0] + '</dt><dd>' + (String(x[1]).indexOf('<') === 0 ? x[1] : esc(x[1] || '—')) + '</dd></div>').join('') + '</dl></div>' +
          '<div class="card card-pad"><div class="lbl" style="margin-bottom:10px">PROFIL PROFESIONAL</div>' +
          '<div class="small muted" style="margin-bottom:4px">Bidang keahlian</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">' + (keahlian.length ? keahlian.map(k => '<span class="tag">' + esc(k) + '</span>').join('') : '<span class="muted">Belum diisi</span>') + '</div>' +
          '<div class="small muted" style="margin-bottom:4px">Profil singkat</div><p style="margin:0;white-space:pre-line">' + (d.profil_singkat ? esc(d.profil_singkat) : '<span class="muted">Belum diisi</span>') + '</p>' +
          (milik || admin ? '<button class="btn btn-soft btn-sm" style="margin-top:14px" data-profil>' + ic('edit', 14) + (milik ? 'Ubah profil saya' : 'Ubah profil') + '</button>' : '') +
          '<p class="muted small" style="margin:12px 0 0">Profil profesional tampil di Direktori Dosen untuk sesama dosen. Nomor WhatsApp hanya untuk admin dan rencana notifikasi WhatsApp.</p></div></div>';
        const bp = el.querySelector('[data-profil]'); if (bp) bp.onclick = () => milik ? Pages.formProfilSaya(d) : Pages.formDosen(d);
      }
      if (t === 'pendidikan') el.innerHTML = '<div class="card card-pad"><dl class="dl">' + [
        ['S1 — Universitas', d.s1_univ], ['S1 — Lulus', d.s1_lulus], ['S2 — Universitas', d.s2_univ], ['S2 — Lulus', d.s2_lulus],
        ['S3 — Universitas', d.s3_univ], ['S3 — Lulus', d.s3_lulus], ['Tugas belajar — mulai', d.tb_mulai], ['Tugas belajar — selesai', d.tb_selesai]
      ].map(x => '<div><dt>' + x[0] + '</dt><dd>' + (/^\d{4}-\d{2}-\d{2}$/.test(x[1]) ? fmtTgl(x[1]) : esc(x[1] || '—')) + '</dd></div>').join('') + '</dl></div>';
      if (t === 'riwayat') renderRiwayat(el, d);
      if (t === 'khusus') renderSyaratKhusus(el, d, () => { App.invalidasi(); detailDosen(id, 'khusus'); });
      if (t === 'homebase') Pages.renderHomebaseDosen(el, d, () => { App.invalidasi(); detailDosen(id, 'homebase'); });
      if (t === 'berkas') { el.innerHTML = '<div class="card card-pad"><div style="margin-bottom:14px">' + UI.meterKel(d.kelengkapan) + '</div><div id="blist"></div></div>'; Pages.renderBerkasDosen(el.querySelector('#blist'), d, bisaBuka, () => detailDosen(id, 'berkas')); }
      if (t === 'pengusulan') renderPengusulan(el, d);
    };
    V().querySelectorAll('[data-tab]').forEach(b => b.onclick = () => render(b.dataset.tab));
    render(tab);
    const ps = V().querySelector('[data-act="profilsaya"]'); if (ps) ps.onclick = () => Pages.formProfilSaya(d);
    if (admin) {
      V().querySelector('[data-act="edit"]').onclick = () => Pages.formDosen(d);
      V().querySelector('[data-act="pengusulan"]').onclick = () => formPengusulan(d);
      V().querySelector('[data-act="aktif"]').onclick = async e => {
        const ok = await UI.konfirmasi(d.aktif ? 'Nonaktifkan dosen?' : 'Aktifkan dosen?', d.aktif ? 'Dosen nonaktif tidak dihitung, tidak tampil di daftar, dan tidak dikirimi email. Data tetap tersimpan.' : 'Dosen akan kembali dipantau.', { bahaya: d.aktif });
        if (!ok) return;
        await UI.sibuk(e.target, () => API.call('setAktifDosen', { id_dosen: d.id_dosen, aktif: !d.aktif }));
        App.invalidasi(); UI.toast(d.aktif ? 'Dosen dinonaktifkan' : 'Dosen diaktifkan'); detailDosen(id);
      };
    }
  }

  // ============================================================
  // SYARAT KHUSUS: SKP, AK penelitian SISTER, publikasi, Elkite
  // ============================================================
  function bukti(b, idRef, jenis, label, boleh) {
    if (b && b.ada && b.id_berkas) return '<button class="btn btn-ghost btn-xs" data-bukti-lihat="' + esc(b.id_berkas) + '" title="' + esc(b.nama_file || '') + '">' + ic('eye', 14) + label + '</button>' +
      (boleh ? '<button class="btn btn-ghost btn-xs" data-bukti-up="' + esc(idRef) + '|' + jenis + '" title="Ganti">' + ic('upload', 13) + '</button>' : '');
    if (b && b.ada) return '<span class="badge b-ready">' + ic('check', 12) + label + '</span>';
    return boleh ? '<button class="btn btn-soft btn-xs" data-bukti-up="' + esc(idRef) + '|' + jenis + '">' + ic('upload', 13) + 'Unggah ' + (label === 'SKP' ? label : label.toLowerCase()) + '</button>' : '<span class="badge b-short">' + ic('alert', 12) + label + ' belum ada</span>';
  }

  function renderSyaratKhusus(el, d, onUbah) {
    const sk = d.syarat_khusus || { skp: [], publikasi: [], boleh_ubah: false };
    const boleh = sk.boleh_ubah;
    const st = d.status;
    const khusus = (st.syarat || []).filter(x => x.khusus);
    const tahun = +App.hariIni().slice(0, 4);
    const kr = sk.kriteria || { skp_tahun: 2, skp_min: 'Baik', pub: { jumlah: 1, sinta: 4, scopus: 4, sjr: 0.1, ifc: 0.05 } };
    const thnSkp = []; for (let i = kr.skp_tahun; i >= 1; i--) thnSkp.push(tahun - i);
    const metrikPub = [kr.pub.sjr !== null ? 'SJR &gt; ' + fa(kr.pub.sjr) : '', kr.pub.ifc !== null ? 'IF &gt; ' + fa(kr.pub.ifc) : ''].filter(Boolean).join(' atau ');
    const piliran = (App.boot.pilihan || {});
    let h = '';
    if (!khusus.length) h += '<div class="alert-box blue standalone">' + ic('info', 16) + '<div><b>Tidak ada syarat khusus untuk jenjang berikutnya</b>Syarat khusus diatur per transisi jabatan di Pengaturan → Aturan kenaikan (bawaan: Asisten Ahli → Lektor). Data di bawah tetap dapat diisi untuk dokumentasi.</div></div>';
    else h += '<div class="card card-pad mb"><div class="lbl" style="margin-bottom:10px">SYARAT KHUSUS ' + esc(st.jabatan_label) + ' → ' + esc(st.target_label) + '</div><div class="checklist">' +
      khusus.map(s => '<div class="ck ' + (s.terpenuhi ? 'ok' : 'no') + '"><div class="ic">' + ic(s.terpenuhi ? 'check' : 'clock', 16) + '</div><div><div class="t">' + esc(s.nama) + '</div><div class="s">' + esc(s.ket) + '</div></div><div class="d">' + (s.terpenuhi ? 'Terpenuhi' : 'Belum') + '</div></div>').join('') + '</div></div>';

    // SKP
    h += '<div class="grid g-2 g-stack mb" style="align-items:start"><div class="card"><div class="card-head"><div><h3>' + ic('award', 18) + 'Predikat Kinerja (SKP)</h3><div class="sub">Minimal "' + esc(kr.skp_min) + '" berturut-turut ' + (thnSkp.length > 2 ? thnSkp[0] + '–' + thnSkp[thnSkp.length - 1] : thnSkp.join(' & ')) + '</div></div>' +
      (boleh ? '<button class="btn btn-soft btn-sm" data-skp-add>' + ic('plus', 14) + 'Tambah SKP</button>' : '') + '</div><div class="card-body">' +
      (sk.skp.length ? '<div class="table-wrap"><table class="tbl"><thead><tr><th>Tahun</th><th>Predikat</th><th>Bukti</th><th></th></tr></thead><tbody>' + sk.skp.map(x =>
        '<tr><td><b>' + esc(x.tahun) + '</b></td><td><span class="badge ' + (/^(Sangat Baik|Baik)$/.test(x.predikat) ? 'b-ready' : 'b-inc') + '">' + esc(x.predikat) + '</span>' + (x.catatan ? '<div class="small muted">' + esc(x.catatan) + '</div>' : '') + '</td>' +
        '<td class="nowrap">' + bukti(x.berkas, x.id_skp, 'SKP', 'SKP', boleh) + '</td><td class="num nowrap">' + (boleh ? '<button class="btn btn-ghost btn-xs" data-skp-edit="' + esc(x.id_skp) + '">' + ic('edit', 13) + '</button><button class="btn btn-ghost btn-xs" data-skp-del="' + esc(x.id_skp) + '">' + ic('trash', 13) + '</button>' : '') + '</td></tr>').join('') + '</tbody></table></div>'
        : '<div class="muted">Belum ada SKP tercatat.</div>') + '</div></div>';

    // AK SISTER & Elkite
    h += '<div class="card"><div class="card-head"><div><h3>' + ic('trend', 18) + 'Angka Kredit (SISTER) & Elkite</h3><div class="sub">Diisi sesuai data terakhir di SISTER</div></div>' +
      (boleh ? '<button class="btn btn-soft btn-sm" data-ak>' + ic('edit', 14) + 'Ubah</button>' : '') + '</div><div class="card-body"><dl class="dl">' +
      '<div><dt>Kekurangan AK ke jenjang berikutnya</dt><dd>' + esc(sk.ak_kekurangan || '—') + '</dd></div><div><dt>AK penelitian</dt><dd>' + esc(sk.ak_penelitian || '—') +
      (sk.ak_kekurangan && sk.ak_penelitian && +sk.ak_kekurangan > 0 ? ' <span class="muted small">(' + (Math.round(+sk.ak_penelitian * 1000 / +sk.ak_kekurangan) / 10).toString().replace('.', ',') + '%)</span>' : '') + '</dd></div>' +
      '<div><dt>Data SISTER per</dt><dd>' + fmtTgl(sk.ak_tgl_data) + '</dd></div><div><dt>Elkite Tri Dharma</dt><dd>' + (sk.elkite_status === 'Sudah' ? '<span class="badge b-ready">' + ic('check', 12) + 'Sudah diisi</span> <span class="small muted">' + fmtTgl(sk.elkite_tgl) + '</span>' : '<span class="badge b-short">Belum diisi</span>') + '</dd></div></dl></div></div></div>';

    // Publikasi
    h += '<div class="card"><div class="card-head"><div><h3>' + ic('file', 18) + 'Publikasi Ilmiah</h3><div class="sub">Minimal ' + kr.pub.jumlah + ' artikel yang memenuhi syarat</div></div>' +
      (boleh ? '<button class="btn btn-soft btn-sm" data-pub-add>' + ic('plus', 14) + 'Tambah publikasi</button>' : '') + '</div><div class="card-body">' +
      (sk.publikasi.length ? sk.publikasi.map(x => '<div class="litem"><div class="row"><div class="t">' + esc(x.judul) + '</div>' + (x.memenuhi ? '<span class="badge b-ready">' + ic('check', 12) + 'Memenuhi</span>' : '<span class="badge b-gray" title="' + esc(x.alasan) + '">Tidak memenuhi</span>') + '</div>' +
        '<div class="s">' + esc([x.jenis_publikasi, x.nama_jurnal, x.peringkat_jurnal, x.sjr ? 'SJR ' + x.sjr.replace('.', ',') : '', x.impact_factor ? 'IF ' + x.impact_factor.replace('.', ',') : '', x.status_jurnal !== 'Aktif' ? x.status_jurnal : '', x.tgl_terbit ? fmtTgl(x.tgl_terbit) : ''].filter(Boolean).join(' · ')) + '</div>' +
        (!x.memenuhi && x.alasan ? '<div class="s" style="color:var(--short-tx)">' + esc(x.alasan) + '</div>' : '') +
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;align-items:center">' + bukti(x.berkas.ARTIKEL, x.id_kegiatan, 'ARTIKEL', 'Artikel', boleh) + bukti(x.berkas.KORESPONDENSI, x.id_kegiatan, 'KORESPONDENSI', 'Korespondensi', boleh) +
        (x.tautan ? '<a class="btn btn-ghost btn-xs" href="' + esc(x.tautan) + '" target="_blank" rel="noopener">' + ic('arrowR', 13) + 'Tautan</a>' : '') +
        (boleh ? '<span style="flex:1"></span><button class="btn btn-ghost btn-xs" data-pub-edit="' + esc(x.id_kegiatan) + '">' + ic('edit', 13) + 'Ubah</button><button class="btn btn-ghost btn-xs" data-pub-del="' + esc(x.id_kegiatan) + '">' + ic('trash', 13) + '</button>' : '') + '</div></div>').join('')
        : '<div class="muted">Belum ada publikasi tercatat.</div>') +
      '<p class="muted small" style="margin:12px 0 0">' + ic('info', 13) + ' Memenuhi bila jurnal nasional terakreditasi min. SINTA ' + kr.pub.sinta + ', atau jurnal internasional terindeks Scopus Q1–Q' + kr.pub.scopus + (metrikPub ? ' dengan ' + metrikPub : '') + ' dan status jurnal tidak cancelled/discontinued.</p>' +
      '<p class="muted small" style="margin:6px 0 0">' + ic('file', 13) + ' Contoh SKP dan contoh bukti korespondensi author tersedia di menu <a href="#/templat">Template & Contoh</a>.</p></div></div>' +
      '<input type="file" accept="application/pdf,image/jpeg,image/png" class="hide" id="bukti-file">';
    el.innerHTML = h;

    // --- aksi ---
    const inp = el.querySelector('#bukti-file');
    let target = null;
    el.querySelectorAll('[data-bukti-up]').forEach(b => b.onclick = () => { target = { btn: b, ref: b.dataset.buktiUp.split('|') }; inp.value = ''; inp.click(); });
    inp.onchange = async () => {
      const f = inp.files[0]; if (!f || !target) return;
      const mime = f.type || (/\.pdf$/i.test(f.name) ? 'application/pdf' : '');
      if (['application/pdf', 'image/jpeg', 'image/png'].indexOf(mime) < 0) return UI.toast('Format harus PDF, JPG, atau PNG', 'err');
      if (f.size > 5 * 1024 * 1024) return UI.toast('Ukuran berkas melebihi 5 MB', 'err');
      try {
        const r = await UI.sibuk(target.btn, async () => API.call('uploadBukti', { id_ref: target.ref[0], jenis: target.ref[1], mime, nama_asli: f.name, base64: await UI.fileKeBase64(f) }));
        UI.toast(r.message); onUbah();
      } catch (e) { }
    };
    el.querySelectorAll('[data-bukti-lihat]').forEach(b => b.onclick = () => bukaBerkas(b, b.dataset.buktiLihat, false));
    const skpForm = x => {
      x = x || { tahun: String(tahun - 1), predikat: 'Baik' };
      const m = UI.modal({
        title: x.id_skp ? 'Ubah SKP' : 'Tambah SKP', size: 'sm',
        body: '<div class="field"><label>Tahun</label><input class="input" type="number" id="sk-t" min="2000" max="' + tahun + '" value="' + esc(x.tahun) + '"></div>' +
          '<div class="field"><label>Predikat kinerja</label><select class="input" id="sk-p">' + (piliran.predikat_skp || ['Sangat Baik', 'Baik', 'Butuh Perbaikan', 'Kurang', 'Sangat Kurang']).map(p => '<option ' + (x.predikat === p ? 'selected' : '') + '>' + p + '</option>').join('') + '</select></div>' +
          '<div class="field"><label>Catatan (opsional)</label><input class="input" id="sk-c" value="' + esc(x.catatan || '') + '"></div><span class="hint">Unggah dokumen SKP setelah disimpan.</span>',
        foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-ok>Simpan</button>'
      });
      m.$('[data-ok]').onclick = async e => {
        const r = await UI.sibuk(e.target, () => API.call('saveSkp', { skp: { id_skp: x.id_skp || '', id_dosen: d.id_dosen, tahun: m.$('#sk-t').value, predikat: m.$('#sk-p').value, catatan: m.$('#sk-c').value } }));
        m.close(); UI.toast(r.message); onUbah();
      };
    };
    const ba = el.querySelector('[data-skp-add]'); if (ba) ba.onclick = () => skpForm(null);
    el.querySelectorAll('[data-skp-edit]').forEach(b => b.onclick = () => skpForm(sk.skp.find(x => x.id_skp === b.dataset.skpEdit)));
    el.querySelectorAll('[data-skp-del]').forEach(b => b.onclick = async () => {
      if (!await UI.konfirmasi('Hapus SKP?', 'Baris SKP ini dihapus dari perhitungan syarat.', { bahaya: true, ok: 'Hapus' })) return;
      const r = await UI.sibuk(b, () => API.call('hapusSkp', { id_skp: b.dataset.skpDel })); UI.toast(r.message); onUbah();
    });
    const bak = el.querySelector('[data-ak]');
    if (bak) bak.onclick = () => {
      const m = UI.modal({
        title: 'Angka Kredit SISTER & Elkite', size: 'sm',
        body: '<div class="field"><label>Kekurangan AK ke jenjang berikutnya</label><input class="input" id="ak-k" inputmode="decimal" value="' + esc(sk.ak_kekurangan) + '"><span class="hint">Sesuai perhitungan di SISTER.</span></div>' +
          '<div class="field"><label>AK penelitian</label><input class="input" id="ak-p" inputmode="decimal" value="' + esc(sk.ak_penelitian) + '"></div>' +
          '<div class="field"><label>Data SISTER per tanggal</label><input class="input" type="date" id="ak-t" value="' + esc(sk.ak_tgl_data || App.hariIni()) + '"></div>' +
          '<div class="field"><label>Elkite Tri Dharma</label><select class="input" id="el-s"><option ' + (sk.elkite_status !== 'Sudah' ? 'selected' : '') + '>Belum</option><option ' + (sk.elkite_status === 'Sudah' ? 'selected' : '') + '>Sudah</option></select></div>' +
          '<div class="field"><label>Tanggal pengisian Elkite</label><input class="input" type="date" id="el-t" value="' + esc(sk.elkite_tgl || '') + '"></div>',
        foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-ok>Simpan</button>'
      });
      m.$('[data-ok]').onclick = async e => {
        const r = await UI.sibuk(e.target, () => API.call('saveSyaratKhusus', { id_dosen: d.id_dosen, ak_kekurangan: m.$('#ak-k').value, ak_penelitian: m.$('#ak-p').value, ak_tgl_data: m.$('#ak-t').value, elkite_status: m.$('#el-s').value, elkite_tgl: m.$('#el-t').value }));
        m.close(); UI.toast(r.message); onUbah();
      };
    };
    const pubForm = x => {
      x = x || { jenis_publikasi: 'Jurnal Nasional', status_jurnal: 'Aktif' };
      const opsi = (arr, v) => arr.map(o => '<option ' + (v === o ? 'selected' : '') + '>' + o + '</option>').join('');
      const m = UI.modal({
        title: x.id_kegiatan ? 'Ubah publikasi' : 'Tambah publikasi', size: 'lg',
        body: '<div class="form-grid"><div class="field full"><label>Judul artikel *</label><input class="input" id="pb-j" value="' + esc(x.judul || '') + '"></div>' +
          '<div class="field"><label>Jenis *</label><select class="input" id="pb-k">' + opsi(piliran.jenis_publikasi || ['Jurnal Nasional', 'Jurnal Internasional'], x.jenis_publikasi) + '</select></div>' +
          '<div class="field"><label>Nama jurnal</label><input class="input" id="pb-n" value="' + esc(x.nama_jurnal || '') + '"></div>' +
          '<div class="field"><label id="pb-rl">Peringkat</label><select class="input" id="pb-r"></select></div>' +
          '<div class="field"><label>Tanggal terbit</label><input class="input" type="date" id="pb-t" value="' + esc(x.tgl_terbit || '') + '"></div>' +
          '<div class="field pb-int"><label>SJR (Scimago)</label><input class="input" id="pb-s" inputmode="decimal" value="' + esc((x.sjr || '').replace('.', ',')) + '" placeholder="mis. 0,25"></div>' +
          '<div class="field pb-int"><label>Impact Factor</label><input class="input" id="pb-i" inputmode="decimal" value="' + esc((x.impact_factor || '').replace('.', ',')) + '" placeholder="mis. 0,12"></div>' +
          '<div class="field pb-int"><label>Status jurnal di Scopus</label><select class="input" id="pb-st">' + opsi(piliran.status_jurnal || ['Aktif', 'Cancelled', 'Discontinued'], x.status_jurnal || 'Aktif') + '</select></div>' +
          '<div class="field"><label>Peran penulis</label><input class="input" id="pb-p" value="' + esc(x.peran || '') + '" placeholder="mis. Penulis pertama"></div>' +
          '<div class="field"><label>DOI</label><input class="input" id="pb-d" value="' + esc(x.doi || '') + '" placeholder="10.xxxx/xxxxx"></div>' +
          '<div class="field"><label>Tautan artikel</label><input class="input" id="pb-u" value="' + esc(x.tautan || '') + '" placeholder="https://"></div>' +
           '<div class="field full pb-int"><span class="hint" style="margin-top:-6px">Jurnal internasional memenuhi bila Q1–Q' + kr.pub.scopus + (metrikPub ? ', ' + metrikPub : '') + ', dan status Aktif.</span></div>' +
          '<div class="field full"><label class="check"><input type="checkbox" id="pb-c" ' + (x.penulis_korespondensi ? 'checked' : '') + '>Sebagai penulis korespondensi (corresponding author)</label></div></div>' +
          '<span class="hint">Setelah disimpan, unggah berkas artikel dan bukti korespondensi pada daftar publikasi.</span>',
        foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-ok>Simpan</button>'
      });
      const sync = () => {
        const k = m.$('#pb-k').value, intl = k === 'Jurnal Internasional';
        m.$('#pb-rl').textContent = intl ? 'Kuartil Scopus' : 'Peringkat SINTA';
        const arr = intl ? (piliran.peringkat_internasional || ['Q1', 'Q2', 'Q3', 'Q4']) : k === 'Jurnal Nasional' ? (piliran.peringkat_nasional || ['SINTA 1', 'SINTA 2', 'SINTA 3', 'SINTA 4', 'SINTA 5', 'SINTA 6']) : [];
        m.$('#pb-r').innerHTML = '<option value="">—</option>' + opsi(arr, x.peringkat_jurnal);
        m.$('#pb-r').disabled = !arr.length;
        m.$$('.pb-int').forEach(f => f.classList.toggle('hide', !intl));
      };
      m.$('#pb-k').onchange = sync; sync();
      m.$('[data-ok]').onclick = async e => {
        const r = await UI.sibuk(e.target, () => API.call('savePublikasi', { publikasi: { id_kegiatan: x.id_kegiatan || '', id_dosen: d.id_dosen, judul: m.$('#pb-j').value, jenis_publikasi: m.$('#pb-k').value, nama_jurnal: m.$('#pb-n').value,
          peringkat_jurnal: m.$('#pb-r').value, tgl_terbit: m.$('#pb-t').value, sjr: m.$('#pb-s').value, impact_factor: m.$('#pb-i').value, status_jurnal: m.$('#pb-st').value,
          peran: m.$('#pb-p').value, doi: m.$('#pb-d').value, tautan: m.$('#pb-u').value, penulis_korespondensi: m.$('#pb-c').checked } }));
        m.close(); UI.toast(r.message, r.memenuhi ? 'ok' : 'warn'); onUbah();
      };
    };
    const bp = el.querySelector('[data-pub-add]'); if (bp) bp.onclick = () => pubForm(null);
    el.querySelectorAll('[data-pub-edit]').forEach(b => b.onclick = () => pubForm(sk.publikasi.find(x => x.id_kegiatan === b.dataset.pubEdit)));
    el.querySelectorAll('[data-pub-del]').forEach(b => b.onclick = async () => {
      if (!await UI.konfirmasi('Hapus publikasi?', 'Publikasi ini tidak lagi dihitung sebagai syarat.', { bahaya: true, ok: 'Hapus' })) return;
      const r = await UI.sibuk(b, () => API.call('hapusPublikasi', { id_kegiatan: b.dataset.pubDel })); UI.toast(r.message); onUbah();
    });
  }

  // ============================================================
  // TEMPLAT & CONTOH DOKUMEN
  // ============================================================
  Pages.templat = async function () {
    V().innerHTML = UI.skeleton(3);
    const r = await API.call('listTemplat');
    if (!App.isCurrent()) return;
    const admin = App.isAdmin();
    let h = head('Panduan', 'Template & Contoh Dokumen', 'Contoh dokumen dari admin SIGAP sebagai acuan menyiapkan berkas kenaikan jabatan, misalnya contoh SKP dan contoh bukti korespondensi author.' ,
      admin ? '<button class="btn btn-primary" data-tpl-add>' + ic('plus', 16) + 'Tambah template</button>' : '');
    h += r.templat.length ? '<div class="dcards">' + r.templat.map(t => '<div class="card card-pad" style="display:flex;flex-direction:column;gap:8px"><div style="display:flex;gap:12px;align-items:flex-start"><div class="frow" style="padding:0;border:0;background:none;grid-template-columns:40px"><div class="fi">' + ic('file', 20) + '</div></div>' +
      '<div style="min-width:0;flex:1"><div style="font-weight:700;color:var(--ink)">' + esc(t.nama) + '</div><div class="small muted" style="margin-top:2px">' + esc(t.keterangan || '') + '</div></div></div>' +
      '<div class="small muted">' + (t.ada_berkas ? esc(t.nama_file) + ' · ' + UI.ukuran(t.ukuran) + ' · ' + UI.fmtWaktu(t.diunggah_pada) : '<span style="color:var(--inc-tx)">Berkas belum diunggah admin — belum tampil bagi dosen</span>') + '</div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:auto">' + (t.ada_berkas ? '<button class="btn btn-primary btn-sm" data-tpl-dl="' + esc(t.id_templat) + '">' + ic('download', 15) + 'Unduh</button>' : '') +
      (admin ? '<button class="btn btn-outline btn-sm" data-tpl-edit="' + esc(t.id_templat) + '">' + ic('upload', 14) + (t.ada_berkas ? 'Ganti / ubah' : 'Unggah berkas') + '</button><button class="btn btn-ghost btn-sm" data-tpl-del="' + esc(t.id_templat) + '" title="Hapus">' + ic('trash', 14) + '</button>' : '') + '</div></div>').join('') + '</div>'
      : '<div class="card">' + UI.empty('file', 'Belum ada template', admin ? 'Tambahkan contoh dokumen untuk dosen.' : 'Admin belum mengunggah contoh dokumen.') + '</div>';
    V().innerHTML = h;
    V().querySelectorAll('[data-tpl-dl]').forEach(b => b.onclick = async () => {
      const x = await UI.sibuk(b, () => API.call('unduhTemplat', { id_templat: b.dataset.tplDl }));
      UI.unduhBlob(UI.base64KeBlob(x.base64, x.mime), x.nama_file);
    });
    const form = t => {
      t = t || {};
      const m = UI.modal({
        title: t.id_templat ? 'Ubah template' : 'Tambah template',
        body: '<div class="field"><label>Nama *</label><input class="input" id="tp-n" value="' + esc(t.nama || '') + '"></div>' +
          '<div class="field"><label>Keterangan</label><textarea class="input" id="tp-k" rows="3">' + esc(t.keterangan || '') + '</textarea></div>' +
          '<div class="field"><label>Berkas ' + (t.ada_berkas ? '(kosongkan bila tidak diganti)' : '') + '</label><input class="input" type="file" id="tp-f" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" style="padding:7px"><span class="hint">PDF, JPG, PNG, Word, atau Excel · maks 5 MB.</span></div>',
        foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-ok>Simpan</button>'
      });
      m.$('[data-ok]').onclick = async e => {
        const f = m.$('#tp-f').files[0];
        const data = { templat: { id_templat: t.id_templat || '', nama: m.$('#tp-n').value, keterangan: m.$('#tp-k').value } };
        if (f) {
          if (f.size > 5 * 1024 * 1024) return UI.toast('Ukuran berkas melebihi 5 MB', 'err');
          const ext = (f.name.split('.').pop() || '').toLowerCase();
          data.mime = f.type || { pdf: 'application/pdf', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', doc: 'application/msword', xls: 'application/vnd.ms-excel', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' }[ext] || '';
          data.nama_asli = f.name; data.base64 = await UI.fileKeBase64(f);
        }
        const r = await UI.sibuk(e.target, () => API.call('saveTemplat', data));
        m.close(); UI.toast(r.message); Pages.templat();
      };
    };
    const ad = V().querySelector('[data-tpl-add]'); if (ad) ad.onclick = () => form(null);
    V().querySelectorAll('[data-tpl-edit]').forEach(b => b.onclick = () => form(r.templat.find(t => t.id_templat === b.dataset.tplEdit)));
    V().querySelectorAll('[data-tpl-del]').forEach(b => b.onclick = async () => {
      if (!await UI.konfirmasi('Hapus template?', 'Template tidak lagi tampil bagi dosen.', { bahaya: true, ok: 'Hapus' })) return;
      const x = await UI.sibuk(b, () => API.call('hapusTemplat', { id_templat: b.dataset.tplDel })); UI.toast(x.message); Pages.templat();
    });
  };

  function renderRiwayat(el, d) {
    const admin = App.isAdmin();
    const rows = [{ jabatan_label: d.status.jabatan_label, tmt: d.tmt_jabamik, no_sk: d.no_sk_jabatan, kini: true }].concat(d.riwayat);
    el.innerHTML = '<div class="card">' + (admin ? '<div class="card-head"><div class="sub">Riwayat otomatis bertambah saat status pengusulan diubah ke "Selesai".</div><button class="btn btn-soft btn-sm" data-add>' + ic('plus', 15) + 'Tambah riwayat lama</button></div>' : '') +
      '<div class="table-wrap" style="margin-top:8px"><table class="tbl tbl-cards"><thead><tr><th>Jabatan</th><th>TMT</th><th>No. SK</th><th></th></tr></thead><tbody>' +
      rows.map(r => '<tr><td data-l="Jabatan"><b>' + esc(r.jabatan_label) + '</b> ' + (r.kini ? '<span class="badge b-blue">Saat ini</span>' : '') + '</td><td data-l="TMT">' + fmtTgl(r.tmt) + '</td><td data-l="No. SK">' + esc(r.no_sk || '—') + '</td>' +
        '<td class="num">' + (admin && !r.kini ? '<button class="btn btn-ghost btn-xs" data-del="' + esc(r.id_riwayat) + '">' + ic('trash', 14) + '</button>' : '') + '</td></tr>').join('') + '</tbody></table></div></div>';
    const add = el.querySelector('[data-add]');
    if (add) add.onclick = () => {
      const m = UI.modal({
        title: 'Tambah riwayat jabatan', size: 'sm',
        body: '<div class="field"><label>Jabatan</label><select class="input" id="r-j">' + ['TP', 'ASA', 'L', 'LK'].map(j => '<option value="' + j + '">' + UI.jab(j) + '</option>').join('') + '</select></div>' +
          '<div class="field"><label>TMT</label><input class="input" type="date" id="r-t"></div><div class="field"><label>No. SK (opsional)</label><input class="input" id="r-s"></div>',
        foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-ok>Simpan</button>'
      });
      m.$('[data-ok]').onclick = async e => {
        await UI.sibuk(e.target, () => API.call('tambahRiwayat', { id_dosen: d.id_dosen, jabatan: m.$('#r-j').value, tmt: m.$('#r-t').value, no_sk: m.$('#r-s').value }));
        m.close(); UI.toast('Riwayat ditambahkan'); detailDosen(d.id_dosen, 'riwayat');
      };
    };
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      if (!await UI.konfirmasi('Hapus riwayat?', 'Baris riwayat jabatan ini akan dihapus permanen.', { bahaya: true, ok: 'Hapus' })) return;
      await UI.sibuk(b, () => API.call('hapusRiwayat', { id_riwayat: b.dataset.del }));
      UI.toast('Riwayat dihapus'); detailDosen(d.id_dosen, 'riwayat');
    });
  }

  function renderPengusulan(el, d) {
    const urut = ['Belum', 'Sedang proses', 'Diajukan', 'Selesai'];
    const cur = Math.max(0, urut.indexOf(d.status_pengusulan || 'Belum'));
    el.innerHTML = '<div class="card card-pad"><div class="stepper">' + urut.map((s, i) => '<div class="st ' + (i <= cur ? 'done' : '') + ' ' + (i === cur ? 'cur' : '') + '"><span class="c">' + (i < cur ? ic('check', 14) : i + 1) + '</span>' + s + '</div>').join('') + '</div>' +
      '<dl class="dl"><div><dt>Status pengusulan</dt><dd>' + esc(d.status_pengusulan || 'Belum') + '</dd></div><div><dt>Tanggal pengusulan</dt><dd>' + fmtTgl(d.tgl_pengusulan) + '</dd></div></dl>' +
      '<p class="muted small" style="margin:14px 0 0">Pengajuan resmi ke tingkat di atas fakultas tetap dilakukan di luar SIGAP. Status "Sedang proses" dan "Diajukan" membuat dosen tercatat sebagai Rencana Pendek; "Selesai" memperbarui jabatan, TMT, dan menyimpan riwayat sebelumnya.</p>' +
      (App.isAdmin() ? '<button class="btn btn-primary" style="margin-top:14px" data-ubah>' + ic('send', 16) + 'Ubah status pengusulan</button>' : '') + '</div>';
    const b = el.querySelector('[data-ubah]'); if (b) b.onclick = () => formPengusulan(d);
  }

  function formPengusulan(d) {
    const st = d.status;
    const m = UI.modal({
      title: 'Status pengusulan', sub: esc(d.nama) + ' · ' + esc(st.jabatan_label) + (st.target_label ? ' → ' + esc(st.target_label) : ''),
      body: '<div class="field"><label>Status</label><select class="input" id="p-s">' + ['Belum', 'Sedang proses', 'Diajukan', 'Selesai'].map(s => '<option ' + ((d.status_pengusulan || 'Belum') === s ? 'selected' : '') + '>' + s + '</option>').join('') + '</select></div>' +
        '<div class="field" id="p-tgl-w"><label>Tanggal pengusulan</label><input class="input" type="date" id="p-tgl" value="' + esc(d.tgl_pengusulan || App.hariIni()) + '"></div>' +
        '<div id="p-sel" class="hide"><div class="alert-box amber standalone">' + ic('alert', 16) + '<div><b>Jabatan akan diperbarui</b>Jabatan dan TMT saat ini dipindahkan ke riwayat. Pastikan SK sudah terbit.</div></div>' +
        '<div class="form-grid"><div class="field"><label>Jabatan baru</label><select class="input" id="p-j">' + ['ASA', 'L', 'LK', 'GB'].map(j => '<option value="' + j + '" ' + (st.target === j ? 'selected' : '') + '>' + UI.jab(j) + '</option>').join('') + '</select></div>' +
        '<div class="field"><label>TMT jabatan baru</label><input class="input" type="date" id="p-tmt"></div><div class="field full"><label>Nomor SK</label><input class="input" id="p-sk" placeholder="opsional"></div></div></div>',
      foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-ok>Simpan</button>'
    });
    const sync = () => { const s = m.$('#p-s').value; m.$('#p-sel').classList.toggle('hide', s !== 'Selesai'); m.$('#p-tgl-w').classList.toggle('hide', s === 'Selesai' || s === 'Belum'); };
    m.$('#p-s').onchange = sync; sync();
    m.$('[data-ok]').onclick = async e => {
      const s = m.$('#p-s').value;
      if (s === 'Selesai' && !m.$('#p-tmt').value) { UI.toast('TMT jabatan baru wajib diisi', 'err'); return; }
      const r = await UI.sibuk(e.target, () => API.call('setPengusulan', { id_dosen: d.id_dosen, status: s, tgl_pengusulan: m.$('#p-tgl').value, tmt_baru: m.$('#p-tmt').value, jabatan_baru: m.$('#p-j').value, no_sk: m.$('#p-sk').value }));
      m.close(); App.invalidasi(); UI.toast(r.message); detailDosen(d.id_dosen, 'pengusulan');
    };
  }

  /** Form tambah/ubah dosen (admin). */
  Pages.formDosen = function (d) {
    const v = Object.assign({}, d || {});
    if (v.status_dosen_otomatis) v.status_dosen = 'Aktif'; // "Tugas Belajar" otomatis tidak disimpan sebagai nilai manual
    const f = (id, label, opt) => {
      opt = opt || {};
      const val = v[id] === undefined || v[id] === null ? '' : v[id];
      let input;
      if (opt.select) input = '<select class="input" name="' + id + '">' + opt.select.map(o => '<option value="' + esc(o[0]) + '" ' + (String(val) === String(o[0]) ? 'selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select>';
      else if (opt.area) input = '<textarea class="input" name="' + id + '">' + esc(val) + '</textarea>';
      else input = '<input class="input" name="' + id + '" type="' + (opt.type || 'text') + '" value="' + esc(opt.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(val) ? '' : val) + '"' + (opt.ph ? ' placeholder="' + esc(opt.ph) + '"' : '') + (opt.req ? ' required' : '') + (opt.attr || '') + '>';
      const asli = opt.type === 'date' && val && !/^\d{4}-\d{2}-\d{2}$/.test(val) ? '<span class="hint" style="color:var(--inc-tx)">Nilai lama tidak valid: "' + esc(val) + '" — isi ulang.</span>' : (opt.hint ? '<span class="hint">' + opt.hint + '</span>' : '');
      return '<div class="field ' + (opt.full ? 'full' : '') + '"><label>' + label + (opt.req ? ' *' : '') + '</label>' + input + asli + '</div>';
    };
    const jabOpt = [['', '— pilih —']].concat(['TP', 'ASA', 'L', 'LK', 'GB'].map(j => [j, UI.jab(j)]));
    const jabVal = d ? (d.status && d.status.jabatan) || d.jabatan : '';
    v.jabatan = jabVal;
    const m = UI.modal({
      title: d ? 'Ubah data dosen' : 'Tambah dosen', size: 'lg',
      body: '<form id="f-dosen" class="form-grid" novalidate>' +
        '<div class="form-section">Identitas</div>' + f('nama', 'Nama lengkap & gelar', { req: true, full: true }) + f('nidn', 'NIDN') + f('nuptk', 'NUPTK') +
        f('email', 'Email', { type: 'email', ph: 'nama@trisakti.ac.id' }) + f('no_wa', 'Nomor WhatsApp', { ph: '0812xxxxxxxx' }) + f('tgl_lahir', 'Tanggal lahir', { type: 'date' }) +
        f('status_nuptk', 'Status NUPTK', { select: [['', '— belum diisi —'], ['Ada', 'Ada'], ['Belum', 'Belum']], hint: 'Otomatis dianggap "Ada" bila nomor NUPTK terisi.' }) +
        '<div class="form-section">Homebase</div>' + (d
          ? '<div class="field full"><div class="alert-box blue" style="margin:0">' + ic('building', 16) + '<div><b>' + esc(d.prodi || 'Belum ditetapkan') + '</b>Homebase diubah lewat tab <i>Homebase & Struktural</i> karena setiap perubahan wajib memuat tanggal berlaku dan alasan.</div></div></div>'
          : f('id_prodi_homebase', 'Homebase (prodi)', { req: true, select: [['', '— pilih —']].concat((App.boot.prodi_master || []).filter(p => p.aktif).map(p => [p.id_prodi, p.label])) }) +
            f('tgl_homebase', 'Homebase berlaku sejak', { type: 'date', hint: 'Kosongkan untuk memakai TMT Karyawan Tetap atau hari ini.' })) +
        '<div class="form-section">Kepegawaian & jabatan akademik</div>' + f('tmt_karyawan_tetap', 'TMT Karyawan Tetap', { type: 'date', hint: 'Tanggal pengangkatan karyawan tetap. Dipakai sebagai acuan dosen TP yang belum memiliki jabamik.' }) +
        f('status_dosen', 'Status dosen', { select: STATUS_DOSEN.map(x => [x, x]), hint: 'Selama periode tugas belajar berjalan, status "Aktif" otomatis tampil sebagai Tugas Belajar.' }) +
        f('jabatan', 'Jabatan akademik', { select: jabOpt }) + f('tmt_jabamik', 'TMT Jabamik', { type: 'date', hint: 'Tanggal berlaku jabatan akademik terakhir (acuan aturan 24 bulan).' }) +
        f('no_sk_jabatan', 'Nomor SK jabatan') + f('bkd_semester', 'BKD terpenuhi berturut (semester)', { type: 'number', attr: ' min="0" max="20"' }) + f('serdos', 'Serdos', { ph: 'mis. Ada, 2019' }) +
        '<div class="form-section">Pendidikan & tugas belajar</div>' + f('s1_univ', 'S1 — universitas') + f('s1_lulus', 'S1 — tahun/tanggal lulus', { ph: '2005 atau 2005-08-20' }) +
        f('s2_univ', 'S2 — universitas') + f('s2_lulus', 'S2 — tahun/tanggal lulus', { ph: '2010' }) + f('s3_univ', 'S3 — universitas') + f('s3_lulus', 'S3 — tanggal lulus', { ph: '2021-08-15', hint: 'Bila hanya tahun, dianggap lulus 31 Desember tahun itu.' }) +
        f('tb_mulai', 'Tugas belajar — mulai', { type: 'date' }) + f('tb_selesai', 'Tugas belajar — selesai/estimasi', { type: 'date' }) +
        '<div class="form-section">Profil profesional</div>' + f('bidang_keahlian', 'Bidang keahlian', { full: true, ph: 'Pisahkan dengan koma, mis. Rekayasa Gempa, Beton Pracetak' }) + f('profil_singkat', 'Profil singkat', { area: true, full: true }) +
        '<div class="form-section">Lainnya</div>' + f('catatan', 'Catatan internal admin', { area: true, full: true }) + '</form>',
      foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-ok>' + (d ? 'Simpan perubahan' : 'Tambah dosen') + '</button>'
    });
    m.$('[data-ok]').onclick = async e => {
      const data = {};
      m.$$('#f-dosen [name]').forEach(i => { data[i.name] = i.value.trim(); });
      if (!data.nama) { UI.toast('Nama wajib diisi', 'err'); return; }
      if (!d && !data.id_prodi_homebase) { UI.toast('Homebase wajib dipilih', 'err'); return; }
      if (d) data.id_dosen = d.id_dosen;
      const r = await UI.sibuk(e.target, () => API.call('saveDosen', { dosen: data }));
      m.close(); App.invalidasi(); UI.toast(r.message);
      App.go('#/dosen/' + r.id_dosen);
    };
  };

  /** Dosen mengubah profil profesionalnya sendiri. */
  Pages.formProfilSaya = function (d) {
    const m = UI.modal({
      title: 'Ubah profil saya', sub: 'Data kepegawaian tetap diubah oleh admin.',
      body: '<div class="field"><label>Bidang keahlian</label><input class="input" id="ps-k" value="' + esc(d.bidang_keahlian || '') + '" placeholder="Pisahkan dengan koma"><span class="hint">Maksimal 10 bidang. Tampil di Direktori Dosen.</span></div>' +
        '<div class="field"><label>Profil singkat</label><textarea class="input" id="ps-p" rows="5" maxlength="1500">' + esc(d.profil_singkat || '') + '</textarea></div>' +
        '<div class="field"><label>Nomor WhatsApp</label><input class="input" id="ps-w" value="' + esc(d.no_wa || '') + '" placeholder="0812xxxxxxxx"><span class="hint">Hanya terlihat oleh Anda dan admin.</span></div>',
      foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-ok>Simpan</button>'
    });
    m.$('[data-ok]').onclick = async e => {
      const r = await UI.sibuk(e.target, () => API.call('saveProfilSaya', { bidang_keahlian: m.$('#ps-k').value, profil_singkat: m.$('#ps-p').value, no_wa: m.$('#ps-w').value }));
      m.close(); App.invalidasi(); UI.toast(r.message); App.route();
    };
  };

  /** Daftar berkas per jenis untuk satu dosen. Dipakai di detail, halaman berkas & inspector. */
  Pages.renderBerkasDosen = function (el, d, bisaBuka, onUbah) {
    const admin = App.isAdmin();
    const jenis = (App.boot && App.boot.jenis_berkas) || [];
    if (!jenis.length) { el.innerHTML = UI.empty('folder', 'Belum ada jenis berkas', 'Admin dapat menambah jenis berkas di Pengaturan.'); return; }
    el.innerHTML = jenis.map(j => {
      const it = d.kelengkapan.item[j.kode] || { ada: false };
      const info = it.ada ? (it.nama_file ? esc(it.nama_file) : 'Sudah diunggah') : 'Belum diunggah';
      const sub = it.ada && it.tgl_upload ? UI.ukuran(it.ukuran) + ' · diunggah ' + UI.fmtWaktu(it.tgl_upload) : (it.ada ? (bisaBuka ? '' : 'Isi berkas hanya dapat dibuka admin & dosen bersangkutan') : 'Opsional · PDF/JPG/PNG maks 5 MB');
      let aksi = '';
      if (it.ada && bisaBuka && it.id_berkas) aksi += '<button class="btn btn-ghost btn-xs" data-lihat="' + esc(it.id_berkas) + '" title="Lihat">' + ic('eye', 15) + '<span class="hide-sm">Lihat</span></button><button class="btn btn-ghost btn-xs" data-unduh="' + esc(it.id_berkas) + '" title="Unduh">' + ic('download', 15) + '</button>';
      if (admin) aksi += '<button class="btn ' + (it.ada ? 'btn-outline' : 'btn-primary') + ' btn-xs" data-unggah="' + esc(j.kode) + '">' + ic('upload', 14) + (it.ada ? 'Ganti' : 'Unggah') + '</button>' +
        (it.ada && it.id_berkas ? '<button class="btn btn-ghost btn-xs" data-hapus="' + esc(it.id_berkas) + '" title="Hapus">' + ic('trash', 14) + '</button>' : '');
      if (!it.ada && !admin) aksi = '<span class="badge b-inc">Belum ada</span>';
      if (it.ada && !bisaBuka) aksi = '<span class="badge b-ready">' + ic('check', 12) + 'Ada</span>';
      return '<div class="frow ' + (it.ada ? '' : 'missing') + '"><div class="fi">' + ic(it.ada ? 'file' : 'fileX', 20) + '</div><div style="min-width:0"><div class="fn">' + esc(j.nama) + '</div><div class="fs">' + info + (sub ? ' · ' + sub : '') + '</div></div><div class="fa">' + aksi + '</div></div>';
    }).join('') + '<input type="file" accept="application/pdf,image/jpeg,image/png" class="hide" id="file-up-' + esc(d.id_dosen) + '">';

    const input = el.querySelector('input[type=file]');
    let jenisAktif = '';
    el.querySelectorAll('[data-unggah]').forEach(b => b.onclick = () => { jenisAktif = b.dataset.unggah; input.value = ''; input.click(); });
    input.onchange = async () => {
      const file = input.files[0]; if (!file) return;
      const mime = file.type || (/\.pdf$/i.test(file.name) ? 'application/pdf' : '');
      if (['application/pdf', 'image/jpeg', 'image/png'].indexOf(mime) < 0) { UI.toast('Format harus PDF, JPG, atau PNG', 'err'); return; }
      if (file.size > 5 * 1024 * 1024) { UI.toast('Ukuran berkas melebihi 5 MB (' + UI.ukuran(file.size) + ')', 'err'); return; }
      const btn = el.querySelector('[data-unggah="' + jenisAktif + '"]');
      try {
        const r = await UI.sibuk(btn, async () => API.call('uploadBerkas', { id_dosen: d.id_dosen, jenis: jenisAktif, mime, nama_asli: file.name, base64: await UI.fileKeBase64(file) }));
        UI.toast(r.message); App.invalidasi(); if (onUbah) onUbah();
      } catch (e) { }
    };
    el.querySelectorAll('[data-lihat]').forEach(b => b.onclick = () => bukaBerkas(b, b.dataset.lihat, false));
    el.querySelectorAll('[data-unduh]').forEach(b => b.onclick = () => bukaBerkas(b, b.dataset.unduh, true));
    el.querySelectorAll('[data-hapus]').forEach(b => b.onclick = async () => {
      if (!await UI.konfirmasi('Hapus berkas?', 'Berkas dipindah ke Trash Google Drive (dapat dipulihkan 30 hari oleh pemilik skrip).', { bahaya: true, ok: 'Hapus' })) return;
      const r = await UI.sibuk(b, () => API.call('hapusBerkas', { id_berkas: b.dataset.hapus }));
      UI.toast(r.message); App.invalidasi(); if (onUbah) onUbah();
    });
  };

  async function bukaBerkas(btn, id, unduh) {
    const r = await UI.sibuk(btn, () => API.call('downloadBerkas', { id_berkas: id }));
    const blob = UI.base64KeBlob(r.base64, r.mime);
    if (unduh) { UI.unduhBlob(blob, r.nama_file); return; }
    const url = URL.createObjectURL(blob);
    const isi = /^image\//.test(r.mime) ? '<img src="' + url + '" alt="" style="display:block;margin:0 auto;max-height:70vh">' : '<iframe class="preview-frame" src="' + url + '" title="Pratinjau berkas"></iframe>';
    const m = UI.modal({ title: r.nama_file, size: 'xl', body: isi, foot: '<button class="btn btn-outline" data-close>Tutup</button><button class="btn btn-primary" data-dl>' + ic('download', 16) + 'Unduh</button>', onClose: () => setTimeout(() => URL.revokeObjectURL(url), 1000), autofocus: false });
    m.$('[data-dl]').onclick = () => UI.unduhBlob(blob, r.nama_file);
  }

  // ============================================================
  // KELAYAKAN JABAMIK
  // ============================================================
  const JBM = { trans: '', prodi: '', status: '', q: '', hal: 1 };
  Pages.jabamik = async function () {
    V().innerHTML = UI.skeleton();
    await App.muatDosen();
    if (!App.isCurrent()) return;
    renderJabamik();
  };
  function renderJabamik() {
    const aturan = App.boot.aturan || [];
    const today = App.hariIni();
    const semua = App.dosenAktif().filter(d => d.status.status !== 'GB' && App.dalamLingkup(d));
    const trans = d => d.status.jabatan && d.status.target ? d.status.jabatan + '>' + d.status.target : '';
    let l = semua;
    if (JBM.prodi) l = l.filter(d => d.prodi === JBM.prodi);
    if (JBM.q) { const q = JBM.q.toLowerCase(); l = l.filter(d => (d.nama + ' ' + d.nidn).toLowerCase().indexOf(q) >= 0); }
    const dasarTrans = l;
    if (JBM.trans) l = l.filter(d => trans(d) === JBM.trans);
    if (JBM.status) l = l.filter(d => d.status.status === JBM.status);
    l = l.slice().sort((a, b) => URUT_STATUS.indexOf(a.status.status) - URUT_STATUS.indexOf(b.status.status) || String(a.status.tgl_eligible || '9').localeCompare(String(b.status.tgl_eligible || '9')));
    const c = hitung(semua.filter(d => !JBM.prodi || d.prodi === JBM.prodi));

    let h = head('Mesin status', 'Kelayakan Jabatan Akademik', 'Status dihitung dari aturan kenaikan yang berlaku hari ini. Bila peraturan berubah, admin menyiapkan aturan baru dengan tanggal mulai berlaku.',
      '<a class="btn btn-outline" href="#/cetak?jenis=status">' + ic('printer', 16) + 'Cetak rekap</a>' + (App.isAdmin() ? '<a class="btn btn-primary" href="#/aturan">' + ic('scale', 16) + 'Ubah aturan</a>' : '<a class="btn btn-outline" href="#/aturan">' + ic('scale', 16) + 'Lihat aturan</a>'));

    h += '<div class="grid g-4 mb">' + ['SIAP', 'PENDEK', 'PANJANG', 'BELUM_LENGKAP'].map(s => '<button class="card kpi click ' + STATUS[s].cls + '" data-st="' + s + '" style="text-align:left;border-color:' + (JBM.status === s ? 'var(--blue)' : '') + '">' +
      '<div class="k-top"><div class="k-label">' + STATUS[s].label + '</div><div class="k-ico">' + ic(STATUS[s].icon, 18) + '</div></div><div class="k-val tabular">' + c[s] + '<small>dosen</small></div><div class="k-desc">' + STATUS[s].desc + '</div></button>').join('') + '</div>';

    const info = App.boot.aturan_info || {};
    h += '<div class="card card-pad mb"><div class="lbl" style="margin-bottom:4px">ATURAN KENAIKAN YANG BERLAKU</div>' +
      (info.berlaku ? '<div class="small muted" style="margin-bottom:10px"><b style="color:var(--ink)">' + esc(info.berlaku.nama) + '</b> · ' + (info.berlaku.berlaku_mulai ? 'berlaku sejak ' + fmtTgl(info.berlaku.berlaku_mulai, true) : 'berlaku sejak awal') + (info.berlaku.dasar_hukum ? ' · ' + esc(info.berlaku.dasar_hukum) : '') + '</div>' : '') +
      (info.berikut ? '<div class="alert-box blue standalone" style="margin-bottom:12px">' + ic('calendar', 16) + '<div><b>Aturan baru dijadwalkan</b>"' + esc(info.berikut.nama) + '" berlaku mulai ' + fmtTgl(info.berikut.berlaku_mulai, true) + '. Status dosen otomatis dihitung ulang dengan aturan itu pada tanggalnya.</div></div>' : '') +
      '<div class="rules">' + aturan.map(a =>
      '<div class="rule ' + (a.aktif ? '' : 'off') + '"><div class="rt">' + esc(a.dari) + ' ' + ic('arrowR', 14) + ' ' + esc(a.ke) + (a.aktif ? '' : ' <span class="badge b-gray">nonaktif</span>') + '</div><div class="rd">' +
      '<span>Masa minimal ' + esc(a.masa_min_bulan) + ' bulan sejak TMT</span><span>BKD ' + esc(a.bkd_min_semester) + ' semester berturut</span><span>' + (a.pendidikan_min ? 'Wajib ' + esc(a.pendidikan_min) : 'Tanpa syarat pendidikan khusus') + '</span>' +
        (function () { const k = ringkasKhusus(a); return k.length ? '<span style="color:var(--navy);font-weight:600">Khusus: ' + esc(k.join(' · ')) + '</span>' : ''; })() + '</div></div>').join('') + '</div>' +
      '<div class="small muted" style="margin-top:10px">Syarat tambahan: NUPTK dan jeda ' + esc(App.boot.cfg.JEDA_TB_BULAN) + ' bulan setelah tugas belajar selesai. GB dikecualikan.</div></div>';

    const tc = {}; dasarTrans.forEach(d => { const t = trans(d); if (t) tc[t] = (tc[t] || 0) + 1; });
    h += '<div class="pills mb">' + [['', 'Semua jenjang', dasarTrans.length]].concat(['TP>ASA', 'ASA>L', 'L>LK', 'LK>GB'].map(t => [t, t.replace('>', ' → '), tc[t] || 0]))
      .map(p => '<button class="pill ' + (JBM.trans === p[0] ? 'on' : '') + '" data-tr="' + p[0] + '">' + esc(p[1]) + '<span class="n">' + p[2] + '</span></button>').join('') + '</div>';

    const prodiList = prodiTerlihat();
    h += '<div class="toolbar"><div class="input-icon grow">' + ic('search', 17) + '<input class="input" id="j-q" placeholder="Cari nama atau NIDN…" value="' + esc(JBM.q) + '"></div>' +
      (prodiList.length > 1 ? '<div class="seg" id="j-prodi">' + [''].concat(prodiList).map(p => '<button class="' + (JBM.prodi === p ? 'on' : '') + '" data-v="' + esc(p) + '">' + esc(p || 'Semua Prodi') + '</button>').join('') + '</div>' : '') +
      '<select class="input" id="j-st"><option value="">Semua status</option>' + ['SIAP', 'PENDEK', 'PANJANG', 'BELUM_LENGKAP'].map(s => '<option value="' + s + '" ' + (JBM.status === s ? 'selected' : '') + '>' + STATUS[s].label + '</option>').join('') + '</select></div>';

    const per = 20;
    const nHal = Math.max(1, Math.ceil(l.length / per)); if (JBM.hal > nHal) JBM.hal = nHal;
    const potong = l.slice((JBM.hal - 1) * per, JBM.hal * per);
    const sy = (d, k) => (d.status.syarat || []).filter(s => s.kode === k)[0];
    const cel = s => !s ? '<span class="muted small">n/a</span>' : '<span class="nowrap" style="font-weight:700;color:' + (s.terpenuhi ? 'var(--ready-tx)' : 'var(--short-tx)') + '">' + ic(s.terpenuhi ? 'checkCircle' : 'clock', 14) + ' ' + esc(s.ket.split(' · ')[0]) + '</span>';

    // hambatan utama
    const hb = {};
    semua.filter(d => (!JBM.prodi || d.prodi === JBM.prodi) && (d.status.status === 'PANJANG' || d.status.status === 'BELUM_LENGKAP')).forEach(d => {
      (d.status.alasan || []).forEach(a => { if (/^Eligible|^Aturan/.test(a)) return; const k = a.replace(/\s*\(".*"\)/, '').replace(/\.$/, ''); hb[k] = (hb[k] || 0) + 1; });
      (d.status.syarat || []).forEach(s => { if (!s.terpenuhi && s.kode === 'BKD' && s.tanggal) hb['BKD belum mencukupi (ada estimasi)'] = (hb['BKD belum mencukupi (ada estimasi)'] || 0) + 1; });
    });
    const hbList = Object.keys(hb).map(k => [k, hb[k]]).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maxHb = hbList.length ? hbList[0][1] : 1;

    if (hbList.length) h += '<div class="card mb"><div class="card-head"><div><h3>' + ic('alert', 18) + 'Hambatan utama</h3><div class="sub">Alasan terbanyak pada status Panjang & Data Belum Lengkap</div></div></div><div class="card-body" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px 28px">' +
      (hbList.length ? hbList.map(x => '<div class="hbar" style="margin:0"><div class="hh"><span>' + esc(x[0]) + '</span><span>' + x[1] + '</span></div><div class="meter short thin"><i style="width:' + Math.round(x[1] * 100 / maxHb) + '%"></i></div></div>').join('') : '<div class="muted">Tidak ada hambatan tercatat.</div>') +
      '</div></div>';
    h += '<div class="card">' + (l.length ? '<div class="table-wrap"><table class="tbl tbl-cards"><thead><tr><th>Dosen</th><th>Jabatan (TMT)</th><th>Target</th><th>Masa TMT</th><th>BKD</th><th>S3</th><th>NUPTK</th><th>Khusus</th><th>Eligible</th><th>Status</th></tr></thead><tbody>' +
      potong.map(d => {
        const masa = sy(d, 'MASA');
        const tm = tmtAcuan(d);
        const bln = tm && /^\d{4}-\d{2}-\d{2}$/.test(tm) ? Math.max(0, Math.floor(UI.hariKe(tm, today) / 30.44)) : null;
        return '<tr class="click" data-href="#/dosen/' + esc(d.id_dosen) + '"><td>' + UI.person(d) + '</td>' +
          '<td data-l="Jabatan"><b>' + esc(d.status.jabatan_label) + '</b><div class="small muted">' + fmtTgl(tm) + '</div></td>' +
          '<td data-l="Target" style="color:var(--blue);font-weight:700">' + esc(d.status.target_label || '—') + '</td>' +
          '<td data-l="Masa TMT">' + (bln === null ? '<span class="muted">—</span>' : '<span class="badge ' + (masa && masa.terpenuhi ? 'b-ready' : 'b-short') + '">' + bln + ' bln</span>') + '</td>' +
          '<td data-l="BKD">' + cel(sy(d, 'BKD')) + '</td><td data-l="S3">' + cel(sy(d, 'S3')) + '</td><td data-l="NUPTK">' + cel(sy(d, 'NUPTK')) + '</td>' +
          '<td data-l="Khusus">' + (function () { const k = (d.status.syarat || []).filter(x => x.khusus); if (!k.length) return '<span class="muted small">n/a</span>'; const n = k.filter(x => x.terpenuhi).length; return '<span class="nowrap" title="' + esc(k.filter(x => !x.terpenuhi).map(x => x.nama).join('; ')) + '" style="font-weight:700;color:' + (n === k.length ? 'var(--ready-tx)' : 'var(--short-tx)') + '">' + ic(n === k.length ? 'checkCircle' : 'clock', 14) + ' ' + n + '/' + k.length + '</span>'; })() + '</td>' +
          '<td data-l="Eligible">' + tglEligibleHTML(d.status) + '</td><td data-l="Status">' + badge(d.status.status) + '</td></tr>';
      }).join('') + '</tbody></table></div>' + UI.pager(l.length, JBM.hal, per, 'data-hal') : UI.empty('search', 'Tidak ada dosen', 'Ubah filter untuk melihat dosen lain.')) + '</div>';
    V().innerHTML = h;

    const re = () => { JBM.hal = 1; renderJabamik(); };
    V().querySelectorAll('[data-st]').forEach(b => b.onclick = () => { JBM.status = JBM.status === b.dataset.st ? '' : b.dataset.st; re(); });
    V().querySelectorAll('[data-tr]').forEach(b => b.onclick = () => { JBM.trans = b.dataset.tr; re(); });
    V().querySelectorAll('#j-prodi button').forEach(b => b.onclick = () => { JBM.prodi = b.dataset.v; re(); });
    V().querySelector('#j-st').onchange = e => { JBM.status = e.target.value; re(); };
    const q = V().querySelector('#j-q');
    q.addEventListener('input', UI.debounce(() => { JBM.q = q.value.trim(); re(); const n = V().querySelector('#j-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 300));
    V().querySelectorAll('[data-hal]').forEach(b => b.onclick = () => { JBM.hal = +b.dataset.hal; renderJabamik(); });
    V().querySelectorAll('tr[data-href]').forEach(tr => tr.onclick = () => App.go(tr.dataset.href));
  }

  // ============================================================
  // KELENGKAPAN BERKAS
  // ============================================================
  const BRK = { q: '', prodi: '', status: '', jenis: '', hal: 1, sel: '' };
  Pages.berkas = async function () {
    V().innerHTML = UI.skeleton();
    await App.muatDosen();
    if (!App.isCurrent()) return;
    if (App.dosenSaja()) {
      const d = App.dosen.find(x => x.id_dosen === App.user.id_dosen);
      if (!d) { V().innerHTML = UI.empty('alertCircle', 'Akun belum tertaut ke data dosen', ''); return; }
      V().innerHTML = head('Berkas kepegawaian', 'Berkas Saya', 'Anda dapat melihat dan mengunduh berkas Anda sendiri. Pengunggahan dilakukan oleh admin SIGAP.') +
        '<div class="card card-pad"><div style="margin-bottom:14px">' + UI.meterKel(d.kelengkapan) + '</div><div id="blist"></div></div>';
      Pages.renderBerkasDosen(V().querySelector('#blist'), d, true, null);
      return;
    }
    renderBerkas();
  };

  function renderBerkas() {
    const admin = App.isAdmin();
    const jenis = App.boot.jenis_berkas || [];
    const semua = App.dosenAktif().filter(App.dalamLingkup);
    let l = semua;
    if (BRK.prodi) l = l.filter(d => d.prodi === BRK.prodi);
    if (BRK.q) { const q = BRK.q.toLowerCase(); l = l.filter(d => (d.nama + ' ' + d.nidn).toLowerCase().indexOf(q) >= 0); }
    if (BRK.status === 'lengkap') l = l.filter(d => d.kelengkapan.persen >= 100);
    if (BRK.status === 'parsial') l = l.filter(d => d.kelengkapan.persen > 0 && d.kelengkapan.persen < 100);
    if (BRK.status === 'kosong') l = l.filter(d => d.kelengkapan.ada === 0);
    if (BRK.jenis) l = l.filter(d => !(d.kelengkapan.item[BRK.jenis] || {}).ada);
    l = l.slice().sort((a, b) => a.kelengkapan.persen - b.kelengkapan.persen || a.nama.localeCompare(b.nama));
    const lengkap = semua.filter(d => d.kelengkapan.persen >= 100).length;
    const kosong = semua.filter(d => d.kelengkapan.ada === 0).length;
    const totalFile = semua.reduce((a, d) => a + d.kelengkapan.ada, 0);

    let h = head('Berkas kepegawaian', 'Kelengkapan Berkas Dosen', 'Seluruh jenis berkas bersifat opsional. ' + (admin ? 'Isi berkas tersimpan privat di Google Drive dan hanya dapat dibuka admin serta dosen bersangkutan.' : 'Anda hanya melihat status Ada/Belum; isi berkas hanya dapat dibuka admin dan dosen bersangkutan.'),
      '<a class="btn btn-outline" href="#/cetak?jenis=kelengkapan">' + ic('printer', 16) + 'Cetak rekap</a>');
    const kp = (cls, label, v, s, icon) => '<div class="card kpi ' + cls + '"><div class="k-top"><div class="k-label">' + label + '</div><div class="k-ico">' + ic(icon, 18) + '</div></div><div class="k-val tabular">' + v + '</div><div class="k-desc">' + s + '</div></div>';
    h += '<div class="grid g-4 mb">' + kp('ready', 'Lengkap 100%', lengkap + '<small>/ ' + semua.length + '</small>', 'Seluruh jenis berkas aktif sudah ada', 'checkCircle') +
      kp('short', 'Parsial', (semua.length - lengkap - kosong) + '<small>dosen</small>', 'Sebagian berkas sudah diunggah', 'folder') +
      kp('inc', 'Belum ada berkas', kosong + '<small>dosen</small>', 'Belum satu pun berkas diunggah', 'fileX') +
      kp('', 'Total berkas', totalFile + '<small>file</small>', jenis.length + ' jenis berkas aktif', 'file') + '</div>';

    const prodiList = prodiTerlihat();
    h += '<div class="toolbar"><div class="input-icon grow">' + ic('search', 17) + '<input class="input" id="b-q" placeholder="Cari dosen…" value="' + esc(BRK.q) + '"></div>' +
      (prodiList.length > 1 ? '<div class="seg" id="b-prodi">' + [''].concat(prodiList).map(p => '<button class="' + (BRK.prodi === p ? 'on' : '') + '" data-v="' + esc(p) + '">' + esc(p || 'Semua Prodi') + '</button>').join('') + '</div>' : '') +
      '<select class="input" id="b-st"><option value="">Semua status berkas</option><option value="lengkap" ' + (BRK.status === 'lengkap' ? 'selected' : '') + '>Lengkap 100%</option><option value="parsial" ' + (BRK.status === 'parsial' ? 'selected' : '') + '>Parsial</option><option value="kosong" ' + (BRK.status === 'kosong' ? 'selected' : '') + '>Belum ada berkas</option></select>' +
      '<select class="input" id="b-jn"><option value="">Kurang berkas apa saja</option>' + jenis.map(j => '<option value="' + esc(j.kode) + '" ' + (BRK.jenis === j.kode ? 'selected' : '') + '>Belum ada: ' + esc(j.nama) + '</option>').join('') + '</select></div>';

    const per = 20;
    const nHal = Math.max(1, Math.ceil(l.length / per)); if (BRK.hal > nHal) BRK.hal = nHal;
    const potong = l.slice((BRK.hal - 1) * per, BRK.hal * per);
    const tabel = '<div class="card">' + (l.length ? '<div class="table-wrap"><table class="tbl tbl-cards"><thead><tr><th>Dosen</th>' + jenis.map(j => '<th class="ctr" title="' + esc(j.nama) + '">' + esc(j.nama.replace('SK / Surat TMT Jabatan', 'SK TMT').replace('Ijazah ', 'Ijz ')) + '</th>').join('') + '<th style="min-width:130px">Kelengkapan</th></tr></thead><tbody>' +
      potong.map(d => '<tr class="click ' + (BRK.sel === d.id_dosen ? 'sel' : '') + '" data-id="' + esc(d.id_dosen) + '"><td>' + UI.person(d) + '</td>' +
        jenis.map(j => { const a = (d.kelengkapan.item[j.kode] || {}).ada; return '<td class="ctr" data-l="' + esc(j.nama) + '"><span class="matrix-dot ' + (a ? 'y' : 'n') + '">' + ic(a ? 'check' : 'x', 13) + '</span></td>'; }).join('') +
        '<td data-l="Kelengkapan">' + UI.meterKel(d.kelengkapan, { head: false, thin: true }) + '<div class="small" style="margin-top:3px;font-weight:700">' + d.kelengkapan.persen + '% · ' + d.kelengkapan.ada + '/' + d.kelengkapan.total + '</div></td></tr>').join('') +
      '</tbody></table></div>' + UI.pager(l.length, BRK.hal, per, 'data-hal') : UI.empty('search', 'Tidak ada dosen', 'Ubah filter.')) + '</div>';

    if (admin) {
      const sel = semua.filter(d => d.id_dosen === BRK.sel)[0];
      h += '<div class="split">' + tabel + '<aside class="card inspector"><div class="card-head"><div><div class="lbl" style="color:var(--blue)">' + ic('folder', 13) + ' PANEL BERKAS</div>' +
        (sel ? '<h3 style="margin-top:4px">' + esc(sel.nama) + '</h3><div class="sub">' + esc(UI.identitas(sel)) + ' · ' + esc(sel.prodi) + '</div>' : '<h3 style="margin-top:4px">Pilih dosen</h3>') + '</div></div>' +
        '<div class="card-body">' + (sel ? '<div class="alert-box blue standalone">' + ic('lock', 16) + '<div>Hanya admin & dosen bersangkutan yang dapat membuka isi berkas. PDF/JPG/PNG, maks 5 MB.</div></div><div style="margin-bottom:12px">' + UI.meterKel(sel.kelengkapan) + '</div><div id="insp"></div>' +
          '<a class="btn btn-soft btn-sm" href="#/dosen/' + esc(sel.id_dosen) + '" style="width:100%;justify-content:center;margin-top:12px">Buka detail dosen</a>' : '<div class="muted">Klik baris dosen di tabel untuk melihat, mengunggah, atau mengganti berkasnya.</div>') + '</div></aside></div>';
    } else h += tabel;
    V().innerHTML = h;

    if (admin) {
      const sel = semua.filter(d => d.id_dosen === BRK.sel)[0];
      if (sel) Pages.renderBerkasDosen(V().querySelector('#insp'), sel, true, async () => { await App.muatDosen(true); renderBerkas(); });
    }
    const re = () => { BRK.hal = 1; renderBerkas(); };
    const q = V().querySelector('#b-q');
    q.addEventListener('input', UI.debounce(() => { BRK.q = q.value.trim(); re(); const n = V().querySelector('#b-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 300));
    V().querySelectorAll('#b-prodi button').forEach(b => b.onclick = () => { BRK.prodi = b.dataset.v; re(); });
    V().querySelector('#b-st').onchange = e => { BRK.status = e.target.value; re(); };
    V().querySelector('#b-jn').onchange = e => { BRK.jenis = e.target.value; re(); };
    V().querySelectorAll('[data-hal]').forEach(b => b.onclick = () => { BRK.hal = +b.dataset.hal; renderBerkas(); });
    V().querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => {
      if (admin) { BRK.sel = tr.dataset.id; renderBerkas(); if (window.innerWidth < 1100) setTimeout(() => { const i = V().querySelector('.inspector'); if (i) i.scrollIntoView({ behavior: 'smooth' }); }, 50); }
      else App.go('#/dosen/' + tr.dataset.id + '?tab=berkas');
    });
  }

  // ============================================================
  // PERINGATAN PENSIUN
  // ============================================================
  // ============================================================
  // REKAP USIA DOSEN
  // ============================================================
  const KELOMPOK_USIA = {
    '10': [[0, 29, '< 30'], [30, 39, '30–39'], [40, 49, '40–49'], [50, 59, '50–59'], [60, 64, '60–64'], [65, 200, '≥ 65']],
    '5': [[0, 29, '< 30'], [30, 34, '30–34'], [35, 39, '35–39'], [40, 44, '40–44'], [45, 49, '45–49'], [50, 54, '50–54'], [55, 59, '55–59'], [60, 64, '60–64'], [65, 69, '65–69'], [70, 200, '≥ 70']]
  };
  function usiaDosen(d) { const u = d.pensiun ? d.pensiun.usia_tahun : null; return u === null || u === undefined || u === '' ? null : +u; }
  const angka1 = n => n === null || n === undefined ? '—' : String(Math.round(n * 10) / 10).replace('.', ',');

  /** Statistik usia untuk daftar dosen: kelompok, rata-rata, median, rentang, per jabatan & prodi, proyeksi pensiun 5 tahun. */
  function statUsia(list, mode) {
    const ada = list.filter(d => usiaDosen(d) !== null);
    const us = ada.map(usiaDosen).sort((a, b) => a - b);
    const rata = l => { const v = l.map(usiaDosen).filter(x => x !== null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
    const median = us.length ? (us.length % 2 ? us[(us.length - 1) / 2] : (us[us.length / 2 - 1] + us[us.length / 2]) / 2) : null;
    const kelompok = KELOMPOK_USIA[mode || '10'].map(k => ({ label: k[2], min: k[0], max: k[1], dosen: ada.filter(d => usiaDosen(d) >= k[0] && usiaDosen(d) <= k[1]) }));
    const prodi = [...new Set(list.map(d => d.prodi || 'Belum ditetapkan'))].sort((a, b) => a.localeCompare(b));
    const thn = +App.hariIni().slice(0, 4);
    const hari = App.hariIni();
    // tahun berjalan dihitung dari hari ini; yang sudah lewat dipisah (lewat)
    const proyeksi = [0, 1, 2, 3, 4].map(i => ({ tahun: thn + i, dosen: list.filter(d => d.pensiun && d.pensiun.tgl_pensiun && d.pensiun.tgl_pensiun >= hari && +d.pensiun.tgl_pensiun.slice(0, 4) === thn + i) }));
    const lewat = list.filter(d => d.pensiun && d.pensiun.tgl_pensiun && d.pensiun.tgl_pensiun < App.hariIni());
    return { total: list.length, ada, tanpa: list.filter(d => usiaDosen(d) === null), rata: rata(ada), rataFn: rata, median, min: us[0], maks: us[us.length - 1], kelompok, prodi, proyeksi, lewat,
      pensiunDiatur: (App.boot.pensiun_aturan || []).some(a => a.usia_pensiun) };
  }
  Pages.statUsia = statUsia; Pages.usiaDosen = usiaDosen; Pages.angka1 = angka1; Pages.JAB_URUT = JAB_URUT;

  const USIA = { jur: '', prodi: '', jab: '', sd: '', mode: '10', pilih: '' };
  function daftarUsia() {
    let l = App.dosenAktif().filter(App.dalamLingkup);
    if (USIA.jur) l = l.filter(d => (d.kelompok_bidang || '') === USIA.jur);
    if (USIA.prodi) l = l.filter(d => (d.prodi || 'Belum ditetapkan') === USIA.prodi);
    if (USIA.jab) l = l.filter(d => d.status.jabatan === USIA.jab);
    if (USIA.sd) l = l.filter(d => (d.status_dosen || 'Aktif') === USIA.sd);
    return l;
  }
  Pages.filterUsia = () => Object.assign({}, USIA);

  Pages.usia = async function () {
    V().innerHTML = UI.skeleton(3);
    await App.muatDosen();
    if (!App.isCurrent()) return;
    renderUsia();
  };

  function renderUsia() {
    const dasar = App.dosenAktif().filter(App.dalamLingkup);
    const list = daftarUsia();
    const S = statUsia(list, USIA.mode);
    const maksK = Math.max(1, ...S.kelompok.map(k => k.dosen.length));
    const pct = n => S.ada.length ? Math.round(n * 1000 / S.ada.length) / 10 : 0;
    const lingkup = App.lihatSemua() ? 'FTSP' : App.prodiPimpinan().join(', ');

    let h = head('Laporan', 'Rekap Usia Dosen', 'Sebaran usia dosen aktif ' + esc(lingkup) + ' per ' + fmtTgl(App.hariIni(), true) + '. Usia dihitung dari tanggal lahir; dosen tanpa tanggal lahir ditampilkan terpisah.',
      '<button class="btn btn-outline" data-u-xls ' + (list.length ? '' : 'disabled') + '>' + ic('download', 16) + 'Unduh Excel</button><button class="btn btn-outline" data-u-word>' + ic('file', 16) + 'Word</button><button class="btn btn-primary" data-u-pdf>' + ic('printer', 16) + 'Cetak / PDF</button>');

    const jurList = [...new Set(dasar.map(d => d.kelompok_bidang).filter(Boolean))].sort();
    if (jurList.length > 1) h += '<div class="jur-tabs">' + [['', 'Semua Jurusan', dasar.length]].concat(jurList.map(j => [j, j, dasar.filter(d => d.kelompok_bidang === j).length]))
      .map(j => '<button class="' + (USIA.jur === j[0] ? 'on' : '') + '" data-u-jur="' + esc(j[0]) + '">' + ic(j[0] ? 'building' : 'grid', 16) + esc(j[1]) + '<span class="n">' + j[2] + '</span></button>').join('') + '</div>';
    const prodiOpsi = [...new Set(dasar.filter(d => !USIA.jur || d.kelompok_bidang === USIA.jur).map(d => d.prodi || 'Belum ditetapkan'))].sort();
    h += '<div class="toolbar">' +
      (prodiOpsi.length > 1 ? '<select class="input" id="u-prodi" aria-label="Prodi"><option value="">Semua prodi</option>' + prodiOpsi.map(p => '<option ' + (USIA.prodi === p ? 'selected' : '') + '>' + esc(p) + '</option>').join('') + '</select>' : '') +
      '<select class="input" id="u-jab" aria-label="Jabatan"><option value="">Semua jabatan</option>' + JAB_URUT.map(j => '<option value="' + j + '" ' + (USIA.jab === j ? 'selected' : '') + '>' + UI.jab(j) + '</option>').join('') + '</select>' +
      '<select class="input" id="u-sd" aria-label="Status dosen"><option value="">Semua status dosen</option>' + STATUS_DOSEN.map(x => '<option ' + (USIA.sd === x ? 'selected' : '') + '>' + x + '</option>').join('') + '</select>' +
      '<div class="seg" role="group" aria-label="Rentang kelompok"><button class="' + (USIA.mode === '10' ? 'on' : '') + '" data-u-mode="10">Per 10 tahun</button><button class="' + (USIA.mode === '5' ? 'on' : '') + '" data-u-mode="5">Per 5 tahun</button></div></div>';

    const dekat = S.proyeksi.reduce((a, p) => a + p.dosen.length, 0);
    const thnAkhir = S.proyeksi[S.proyeksi.length - 1].tahun;
    h += '<div class="grid g-4 mb">' +
      '<div class="card kpi"><div class="k-top"><div class="k-label">Dosen dengan data usia</div><div class="k-ico">' + ic('users', 18) + '</div></div><div class="k-val tabular">' + S.ada.length + '<small>/ ' + S.total + '</small></div><div class="k-desc">' + (S.tanpa.length ? S.tanpa.length + ' dosen belum ada tanggal lahir' : 'Semua dosen memiliki tanggal lahir') + '</div></div>' +
      '<div class="card kpi"><div class="k-top"><div class="k-label">Rata-rata usia</div><div class="k-ico">' + ic('bars', 18) + '</div></div><div class="k-val tabular">' + angka1(S.rata) + '<small>tahun</small></div><div class="k-desc">Median ' + angka1(S.median) + ' tahun</div></div>' +
      '<div class="card kpi"><div class="k-top"><div class="k-label">Rentang usia</div><div class="k-ico">' + ic('trend', 18) + '</div></div><div class="k-val tabular">' + (S.ada.length ? S.min + '–' + S.maks : '—') + '<small>tahun</small></div><div class="k-desc">Termuda – tertua</div></div>' +
      '<div class="card kpi short"><div class="k-top"><div class="k-label">Pensiun hingga ' + thnAkhir + '</div><div class="k-ico">' + ic('hourglass', 18) + '</div></div><div class="k-val tabular">' + (S.pensiunDiatur ? dekat : '—') + '<small>dosen</small></div><div class="k-desc">' + (S.pensiunDiatur ? 'Mencapai batas usia pensiun ' + S.proyeksi[0].tahun + '–' + thnAkhir + (S.lewat.length ? ' · ' + S.lewat.length + ' sudah lewat batas' : '') : 'Usia pensiun belum diatur admin') + '</div></div></div>';

    // Sebaran
    h += '<div class="grid g-2 g-stack mb" style="align-items:start"><div class="card"><div class="card-head"><div><h3>' + ic('bars', 18) + 'Sebaran kelompok usia</h3><div class="sub">Klik kelompok untuk melihat daftar dosen</div></div></div><div class="card-body">' +
      (S.ada.length ? S.kelompok.map(k => '<div class="ubar ' + (USIA.pilih === k.label ? 'on' : '') + '" data-u-k="' + esc(k.label) + '" role="button" tabindex="0"><div class="ul">' + esc(k.label) + '</div><div class="ut"><div class="uf ' + (k.min >= 65 ? 'merah' : k.min >= 60 ? 'jingga' : '') + '" style="width:' + (k.dosen.length * 100 / maksK) + '%"></div></div><div class="un"><b>' + k.dosen.length + '</b> <span class="muted">' + String(pct(k.dosen.length)).replace('.', ',') + '%</span></div></div>').join('') +
        (S.tanpa.length ? '<div class="ubar ' + (USIA.pilih === '__tanpa' ? 'on' : '') + '" data-u-k="__tanpa" role="button" tabindex="0"><div class="ul muted">Tanpa data</div><div class="ut"><div class="uf abu" style="width:' + (S.tanpa.length * 100 / Math.max(maksK, S.tanpa.length)) + '%"></div></div><div class="un"><b>' + S.tanpa.length + '</b> <span class="muted">dosen</span></div></div>' : '')
        : UI.empty('bars', 'Belum ada data usia', 'Tanggal lahir dosen belum diisi.')) + '</div></div>';

    // Proyeksi pensiun
    const maksP = Math.max(1, ...S.proyeksi.map(p => p.dosen.length));
    h += '<div class="card"><div class="card-head"><div><h3>' + ic('hourglass', 18) + 'Proyeksi mencapai batas usia pensiun</h3><div class="sub">Jumlah dosen per tahun, sesuai usia pensiun per jabatan</div></div></div><div class="card-body">' +
      (S.pensiunDiatur ? S.proyeksi.map((p, i) => '<div class="ubar static"><div class="ul">' + p.tahun + (i === 0 ? '<span class="small muted" style="display:block;font-weight:500">sisa tahun ini</span>' : '') + '</div><div class="ut"><div class="uf jingga" style="width:' + (p.dosen.length * 100 / maksP) + '%"></div></div><div class="un"><b>' + p.dosen.length + '</b> <span class="muted">dosen</span></div></div>').join('') +
        (S.lewat.length ? '<p class="small" style="color:var(--inc-tx);margin:10px 0 0">' + ic('alert', 13) + ' ' + S.lewat.length + ' dosen aktif sudah melewati batas usia pensiun.</p>' : '') +
        '<p class="small muted" style="margin:10px 0 0">Daftar nama ada di <a href="#/pensiun">Peringatan Pensiun</a>.</p>'
        : '<div class="muted">Usia pensiun per jabatan belum diatur.' + (App.isAdmin() ? ' <a href="#/pengaturan?tab=pensiun">Atur sekarang →</a>' : '') + '</div>') + '</div></div></div>';

    // Tabel silang
    const sel = (l, f) => l.filter(f).length;
    const jabAda = JAB_URUT.filter(j => list.some(d => d.status.jabatan === j));
    h += '<div class="card mb"><div class="card-head"><div><h3>' + ic('award', 18) + 'Kelompok usia × jabatan akademik</h3></div></div><div class="table-wrap"><table class="tbl"><thead><tr><th>Kelompok usia</th>' + jabAda.map(j => '<th class="num">' + j + '</th>').join('') + '<th class="num">Jumlah</th></tr></thead><tbody>' +
      S.kelompok.map(k => '<tr><td><b>' + esc(k.label) + '</b></td>' + jabAda.map(j => '<td class="num">' + (sel(k.dosen, d => d.status.jabatan === j) || '<span class="muted">0</span>') + '</td>').join('') + '<td class="num"><b>' + k.dosen.length + '</b></td></tr>').join('') +
      '<tr class="tot"><td>Jumlah (dengan data usia)</td>' + jabAda.map(j => '<td class="num">' + sel(S.ada, d => d.status.jabatan === j) + '</td>').join('') + '<td class="num">' + S.ada.length + '</td></tr>' +
      '<tr class="tot"><td>Rata-rata usia (tahun)</td>' + jabAda.map(j => '<td class="num">' + angka1(S.rataFn(S.ada.filter(d => d.status.jabatan === j))) + '</td>').join('') + '<td class="num">' + angka1(S.rata) + '</td></tr></tbody></table></div></div>';
    if (S.prodi.length > 1) {
      h += '<div class="card mb"><div class="card-head"><div><h3>' + ic('building', 18) + 'Kelompok usia × program studi (homebase)</h3></div></div><div class="table-wrap"><table class="tbl"><thead><tr><th>Kelompok usia</th>' + S.prodi.map(p => '<th class="num">' + esc(p) + '</th>').join('') + '<th class="num">Jumlah</th></tr></thead><tbody>' +
        S.kelompok.map(k => '<tr><td><b>' + esc(k.label) + '</b></td>' + S.prodi.map(p => '<td class="num">' + (sel(k.dosen, d => (d.prodi || 'Belum ditetapkan') === p) || '<span class="muted">0</span>') + '</td>').join('') + '<td class="num"><b>' + k.dosen.length + '</b></td></tr>').join('') +
        '<tr class="tot"><td>Jumlah (dengan data usia)</td>' + S.prodi.map(p => '<td class="num">' + sel(S.ada, d => (d.prodi || 'Belum ditetapkan') === p) + '</td>').join('') + '<td class="num">' + S.ada.length + '</td></tr>' +
        '<tr class="tot"><td>Rata-rata usia (tahun)</td>' + S.prodi.map(p => '<td class="num">' + angka1(S.rataFn(S.ada.filter(d => (d.prodi || 'Belum ditetapkan') === p))) + '</td>').join('') + '<td class="num">' + angka1(S.rata) + '</td></tr></tbody></table></div></div>';
    }

    // Daftar dosen kelompok terpilih
    const pilihK = USIA.pilih === '__tanpa' ? { label: 'Tanpa tanggal lahir', dosen: S.tanpa } : S.kelompok.find(k => k.label === USIA.pilih);
    h += '<div class="card" id="u-daftar"><div class="card-head"><div><h3>' + ic('list', 18) + (pilihK ? 'Dosen kelompok usia ' + esc(pilihK.label) + ' (' + pilihK.dosen.length + ')' : 'Daftar dosen per kelompok') + '</h3>' +
      (pilihK ? '' : '<div class="sub">Klik salah satu kelompok usia di atas</div>') + '</div>' + (pilihK ? '<button class="btn btn-ghost btn-sm" data-u-tutup>' + ic('x', 14) + 'Tutup</button>' : '') + '</div>' +
      (pilihK ? '<div class="table-wrap"><table class="tbl"><thead><tr><th>Nama</th><th>Homebase</th><th>Jabatan akademik</th><th class="num">Usia</th><th>Tanggal lahir</th><th>Batas usia pensiun</th></tr></thead><tbody>' +
        pilihK.dosen.slice().sort((a, b) => (usiaDosen(b) || 0) - (usiaDosen(a) || 0) || a.nama.localeCompare(b.nama)).map(d => '<tr><td><a href="#/dosen/' + esc(d.id_dosen) + '"><b>' + esc(d.nama) + '</b></a></td><td>' + esc(d.prodi || 'Belum ditetapkan') + '</td><td>' + esc(d.status.jabatan_label) + '</td>' +
          '<td class="num">' + (usiaDosen(d) === null ? '—' : usiaDosen(d) + ' thn') + '</td><td>' + (d.tgl_lahir ? fmtTgl(d.tgl_lahir) : '<span class="muted">Belum diisi</span>') + '</td><td>' + (d.pensiun.tgl_pensiun ? fmtTgl(d.pensiun.tgl_pensiun) : '<span class="muted">—</span>') + '</td></tr>').join('') +
        '</tbody></table></div>' : '') + '</div>';
    V().innerHTML = h;

    const ulang = () => renderUsia();
    V().querySelectorAll('[data-u-jur]').forEach(b => b.onclick = () => { USIA.jur = b.dataset.uJur; USIA.prodi = ''; USIA.pilih = ''; ulang(); });
    V().querySelectorAll('[data-u-mode]').forEach(b => b.onclick = () => { USIA.mode = b.dataset.uMode; USIA.pilih = ''; ulang(); });
    [['#u-prodi', 'prodi'], ['#u-jab', 'jab'], ['#u-sd', 'sd']].forEach(x => { const el = V().querySelector(x[0]); if (el) el.onchange = () => { USIA[x[1]] = el.value; USIA.pilih = ''; ulang(); }; });
    const pilih = el => { USIA.pilih = USIA.pilih === el.dataset.uK ? '' : el.dataset.uK; ulang(); const t = V().querySelector('#u-daftar'); if (t && USIA.pilih) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    V().querySelectorAll('[data-u-k]').forEach(el => { el.onclick = () => pilih(el); el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pilih(el); } }; });
    const tt = V().querySelector('[data-u-tutup]'); if (tt) tt.onclick = () => { USIA.pilih = ''; ulang(); };
    V().querySelector('[data-u-pdf]').onclick = async e => { const d = await UI.sibuk(e.currentTarget, () => Cetak.bangun('usia', USIA)); Cetak.cetakPDF(d.html); };
    V().querySelector('[data-u-word]').onclick = async e => { const d = await UI.sibuk(e.currentTarget, () => Cetak.bangun('usia', USIA)); Cetak.unduhWord(d.html, d.judul + ' ' + App.hariIni()); UI.toast('Dokumen Word diunduh'); };
    V().querySelector('[data-u-xls]').onclick = e => UI.sibuk(e.currentTarget, () => unduhUsia(list, S)).catch(() => { });
  }

  async function unduhUsia(list, S) {
    const admin = App.isAdmin();
    const jabAda = JAB_URUT.filter(j => list.some(d => d.status.jabatan === j));
    const pct = n => S.ada.length ? Math.round(n * 1000 / S.ada.length) / 10 : 0;
    const filt = [USIA.jur, USIA.prodi, USIA.jab ? UI.jab(USIA.jab) : '', USIA.sd].filter(Boolean).join(', ') || 'Semua dosen dalam lingkup';
    const r1 = [['Rekap Usia Dosen — data per ' + App.hariIni()], ['Filter: ' + filt], [], ['Kelompok usia', 'Jumlah dosen', 'Persentase (%)']]
      .concat(S.kelompok.map(k => [k.label, k.dosen.length, pct(k.dosen.length)]))
      .concat([['Jumlah (dengan data usia)', S.ada.length, S.ada.length ? 100 : 0], ['Belum ada tanggal lahir', S.tanpa.length, ''], [],
        ['Rata-rata usia (tahun)', S.rata === null ? '' : Math.round(S.rata * 10) / 10], ['Median usia (tahun)', S.median === null ? '' : S.median], ['Termuda (tahun)', S.min === undefined ? '' : S.min], ['Tertua (tahun)', S.maks === undefined ? '' : S.maks]]);
    const r2 = [['Kelompok usia'].concat(jabAda.map(j => UI.jab(j)), ['Jumlah'])]
      .concat(S.kelompok.map(k => [k.label].concat(jabAda.map(j => k.dosen.filter(d => d.status.jabatan === j).length), [k.dosen.length])))
      .concat([['Rata-rata usia'].concat(jabAda.map(j => { const v = S.rataFn(S.ada.filter(d => d.status.jabatan === j)); return v === null ? '' : Math.round(v * 10) / 10; }), [S.rata === null ? '' : Math.round(S.rata * 10) / 10])]);
    const r3 = [['Kelompok usia'].concat(S.prodi, ['Jumlah'])]
      .concat(S.kelompok.map(k => [k.label].concat(S.prodi.map(p => k.dosen.filter(d => (d.prodi || 'Belum ditetapkan') === p).length), [k.dosen.length])));
    const r4 = [['Tahun', 'Jumlah dosen mencapai batas usia pensiun', 'Nama']].concat(S.proyeksi.map(p => [p.tahun, p.dosen.length, p.dosen.map(d => d.nama).join('; ')]));
    const kelOf = d => { const u = usiaDosen(d); if (u === null) return 'Tanpa data'; const k = S.kelompok.find(x => u >= x.min && u <= x.max); return k ? k.label : ''; };
    const r5 = [['No', 'Nama', 'NIDN', 'Jurusan', 'Homebase', 'Jabatan akademik', 'Status dosen', 'Usia (tahun)', 'Kelompok usia', 'Batas usia pensiun', 'Tanggal capai batas'].concat(admin ? ['Tanggal lahir'] : [])]
      .concat(list.slice().sort((a, b) => (usiaDosen(b) === null) - (usiaDosen(a) === null) || (usiaDosen(b) || 0) - (usiaDosen(a) || 0)).map((d, i) => [i + 1, d.nama, d.nidn || '', d.kelompok_bidang || '', d.prodi || 'Belum ditetapkan', d.status.jabatan_label, d.status_dosen || 'Aktif',
        usiaDosen(d) === null ? '' : usiaDosen(d), kelOf(d), d.pensiun.usia_pensiun || '', d.pensiun.tgl_pensiun || ''].concat(admin ? [d.tgl_lahir || ''] : [])));
    await UI.unduhXLSX('Rekap-Usia-Dosen-' + (USIA.jur ? USIA.jur.replace(/\s+/g, '_') + '-' : '') + App.hariIni() + '.xlsx', [
      { nama: 'Ringkasan', aoa: r1, lebar: [30, 14, 16], filter: false },
      { nama: 'Per Jabatan', aoa: r2, lebar: [18].concat(jabAda.map(() => 16), [10]) },
      { nama: 'Per Prodi', aoa: r3, lebar: [18].concat(S.prodi.map(p => Math.max(14, p.length + 2)), [10]) },
      { nama: 'Proyeksi Pensiun', aoa: r4, lebar: [8, 22, 80], filter: false },
      { nama: 'Daftar Dosen', aoa: r5, lebar: [5, 36, 13, 14, 20, 18, 14, 12, 14, 14, 16, 14] }
    ]);
    UI.toast('Rekap usia diunduh');
  }

  const PNS = { mode: 'jendela', prodi: '', q: '' };
  Pages.pensiun = async function () {
    V().innerHTML = UI.skeleton();
    await App.muatDosen();
    if (!App.isCurrent()) return;
    renderPensiun();
  };
  function renderPensiun() {
    const boot = App.boot;
    const jendela = boot.cfg.JENDELA_PENSIUN_BULAN;
    const aturan = boot.pensiun_aturan || [];
    const diatur = aturan.some(a => a.usia_pensiun);
    const semua = App.dosenAktif().filter(d => App.dalamLingkup(d) && (!PNS.prodi || d.prodi === PNS.prodi));
    const ada = semua.filter(d => d.pensiun.tgl_pensiun);
    const dlm = ada.filter(d => d.pensiun.bulan_ke_pensiun <= jendela && d.pensiun.bulan_ke_pensiun >= 0);
    const d24 = ada.filter(d => d.pensiun.bulan_ke_pensiun > jendela && d.pensiun.bulan_ke_pensiun <= 24);
    const lewat = ada.filter(d => d.pensiun.bulan_ke_pensiun < 0);
    const tanpa = semua.filter(d => !d.tgl_lahir);

    let l = PNS.mode === 'jendela' ? dlm.concat(lewat) : PNS.mode === '24' ? ada.filter(d => d.pensiun.bulan_ke_pensiun <= 24) : PNS.mode === 'kosong' ? tanpa : semua;
    if (PNS.q) { const q = PNS.q.toLowerCase(); l = l.filter(d => d.nama.toLowerCase().indexOf(q) >= 0); }
    l = l.slice().sort((a, b) => (a.pensiun.bulan_ke_pensiun === null ? 9999 : a.pensiun.bulan_ke_pensiun) - (b.pensiun.bulan_ke_pensiun === null ? 9999 : b.pensiun.bulan_ke_pensiun));

    let h = head('Pengingat pensiun', 'Peringatan Masa Pensiun Dosen', 'Ditampilkan di dashboard saja (tanpa email). Usia pensiun per jabatan dan jendela tampil diatur admin.',
      '<a class="btn btn-outline" href="#/cetak?jenis=pensiun">' + ic('printer', 16) + 'Cetak daftar</a>' + (App.isAdmin() ? '<a class="btn btn-primary" href="#/pengaturan?tab=pensiun">' + ic('sliders', 16) + 'Atur usia pensiun</a>' : ''));
    if (!diatur) h += '<div class="alert-box amber standalone">' + ic('alert', 16) + '<div><b>Usia pensiun belum diatur</b>Usia pensiun per jabatan diisi admin. Sebelum diisi, tanggal pensiun tidak dapat dihitung.' + (App.isAdmin() ? ' <a href="#/pengaturan?tab=pensiun">Atur sekarang →</a>' : '') + '</div></div>';
    const kp = (cls, label, v, s, icon) => '<div class="card kpi ' + cls + '"><div class="k-top"><div class="k-label">' + label + '</div><div class="k-ico">' + ic(icon, 18) + '</div></div><div class="k-val tabular">' + v + '<small>dosen</small></div><div class="k-desc">' + s + '</div></div>';
    h += '<div class="grid g-4 mb">' + kp('inc', 'Dalam jendela (≤' + jendela + ' bln)', dlm.length, 'Segera siapkan administrasi pensiun', 'alert') + kp('short', jendela + '–24 bulan', d24.length, 'Tahap perencanaan suksesi', 'clock') +
      kp('long', 'Melewati batas usia', lewat.length, 'Masih aktif di data — periksa status', 'alertCircle') + kp('', 'Tanggal lahir kosong', tanpa.length, 'Tidak dapat dihitung', 'calendar') + '</div>';
    h += '<div class="card card-pad mb"><div class="lbl" style="margin-bottom:10px">BATAS USIA PENSIUN (PENSIUN_ATURAN)</div><div class="rules" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr))">' +
      aturan.map(a => '<div class="rule"><div class="rt">' + esc(UI.jab(a.jabatan)) + '</div><div class="rd"><span style="font-size:20px;font-weight:800;color:' + (a.usia_pensiun ? 'var(--navy)' : 'var(--inc-tx)') + '">' + (a.usia_pensiun ? esc(a.usia_pensiun) + ' thn' : 'Belum diisi') + '</span></div></div>').join('') +
      '<div class="rule"><div class="rt">Jendela tampil</div><div class="rd"><span style="font-size:20px;font-weight:800;color:var(--navy)">' + jendela + ' bln</span></div></div></div></div>';

    const prodiList = prodiTerlihat();
    h += '<div class="toolbar"><div class="seg" id="p-mode">' + [['jendela', 'Dalam jendela'], ['24', '≤24 bulan'], ['semua', 'Semua dosen'], ['kosong', 'Tgl lahir kosong']].map(m => '<button class="' + (PNS.mode === m[0] ? 'on' : '') + '" data-v="' + m[0] + '">' + m[1] + '</button>').join('') + '</div>' +
      '<div class="input-icon grow">' + ic('search', 17) + '<input class="input" id="p-q" placeholder="Cari nama…" value="' + esc(PNS.q) + '"></div>' +
      (prodiList.length > 1 ? '<div class="seg" id="p-prodi">' + [''].concat(prodiList).map(p => '<button class="' + (PNS.prodi === p ? 'on' : '') + '" data-v="' + esc(p) + '">' + esc(p || 'Semua Prodi') + '</button>').join('') + '</div>' : '') + '</div>';

    h += '<div class="card">' + (l.length ? '<div class="table-wrap"><table class="tbl tbl-cards"><thead><tr><th>Dosen</th><th>Jabatan</th><th>Tanggal lahir</th><th>Usia</th><th>Batas usia</th><th>Tanggal capai batas</th><th style="min-width:150px">Sisa waktu</th></tr></thead><tbody>' +
      l.map(d => {
        const p = d.pensiun; const b = p.bulan_ke_pensiun;
        const cls = b === null ? 'b-gray' : b < 0 ? 'b-inc' : b <= jendela ? 'b-inc' : b <= 24 ? 'b-short' : 'b-long';
        const pct = b === null ? 0 : Math.max(4, Math.min(100, 100 - Math.round(Math.max(0, b) * 100 / 36)));
        return '<tr class="click" data-href="#/dosen/' + esc(d.id_dosen) + '"><td>' + UI.person(d) + '</td><td data-l="Jabatan">' + esc(d.status.jabatan_label) + '</td><td data-l="Lahir">' + fmtTgl(d.tgl_lahir) + '</td>' +
          '<td data-l="Usia" class="nowrap">' + (p.usia_tahun !== null ? p.usia_tahun + ' thn ' + p.usia_bulan + ' bln' : '—') + '</td><td data-l="Batas">' + (p.usia_pensiun ? p.usia_pensiun + ' thn' : '<span class="muted small">' + esc(p.catatan) + '</span>') + '</td>' +
          '<td data-l="Capai batas" class="nowrap"><b>' + fmtTgl(p.tgl_pensiun) + '</b></td><td data-l="Sisa">' + (b === null ? '<span class="muted">—</span>' : '<span class="badge ' + cls + '">' + (b < 0 ? 'Lewat ' + (-b) + ' bln' : b === 0 ? 'Bulan ini' : b + ' bln lagi') + '</span><div class="meter thin ' + (cls === 'b-inc' ? 'inc' : cls === 'b-short' ? 'short' : 'long') + '" style="margin-top:6px"><i style="width:' + pct + '%"></i></div>') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : UI.empty('checkCircle', 'Tidak ada dosen pada kategori ini', PNS.mode === 'jendela' ? 'Tidak ada dosen yang mencapai batas usia dalam ' + jendela + ' bulan.' : '')) + '</div>';
    V().innerHTML = h;
    V().querySelectorAll('#p-mode button').forEach(b => b.onclick = () => { PNS.mode = b.dataset.v; renderPensiun(); });
    V().querySelectorAll('#p-prodi button').forEach(b => b.onclick = () => { PNS.prodi = b.dataset.v; renderPensiun(); });
    const q = V().querySelector('#p-q');
    q.addEventListener('input', UI.debounce(() => { PNS.q = q.value.trim(); renderPensiun(); const n = V().querySelector('#p-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 300));
    V().querySelectorAll('tr[data-href]').forEach(tr => tr.onclick = () => App.go(tr.dataset.href));
  }

  // ============================================================
  // PROFIL
  // ============================================================
  Pages.profil = async function () {
    const u = App.user;
    V().innerHTML = head('Akun', 'Profil & Keamanan', '') +
      '<div class="grid g-2" style="align-items:start"><div class="card card-pad"><div class="dhead"><div class="avatar lg" style="background:var(--navy-bg);color:#fff;border-color:var(--navy-bg)">' + esc(UI.inisial(u.nama)) + '</div>' +
      '<div class="dh-main"><h1 style="font-size:20px">' + esc(u.nama) + '</h1><div class="meta"><span>' + esc(u.email) + '</span></div><div class="meta">' + (u.peran || [u.role]).map(p => '<span class="badge b-navy">' + esc(App.roleLabel(p)) + '</span>').join('') + (u.admin_vault ? '<span class="badge b-blue">Izin vault</span>' : '') + (u.admin_dokumen_identitas ? '<span class="badge b-blue">Izin dokumen identitas</span>' : '') + '</div></div></div>' +
      '<dl class="dl" style="margin-top:16px"><div><dt>Cakupan data</dt><dd>' + esc(App.punya('ADMIN') ? 'Seluruh dosen (kelola)' : App.lihatSemua() ? 'Seluruh dosen (hanya baca)' : App.prodiPimpinan().length ? 'Dosen berhomebase ' + App.prodiPimpinan().join(', ') + ' (hanya baca) dan data diri sendiri' : 'Data diri sendiri') + '</dd></div>' +
      ((u.jabatan_struktural || []).length ? '<div><dt>Jabatan struktural aktif</dt><dd>' + esc(u.jabatan_struktural.map(j => j.nama_jabatan || App.roleLabel(j.jabatan)).join(', ')) + '</dd></div>' : '') +
      '<div><dt>Sesi</dt><dd>Berakhir setelah ' + esc(App.boot.cfg.SESI_MENIT) + ' menit tidak aktif</dd></div></dl>' +
      '<button class="btn btn-danger" style="margin-top:18px" data-logout2>' + ic('logout', 16) + 'Keluar</button></div>' +
      '<form class="card card-pad" id="f-pw" novalidate><h3 style="font-size:17px;margin-bottom:4px">Ganti password</h3><p class="muted small" style="margin:0 0 16px">Minimal 8 karakter, berisi huruf dan angka. Catatan: admin fakultas dapat melihat password Anda melalui Password Vault (kebijakan fakultas) — jangan gunakan password yang sama dengan akun lain.</p>' +
      '<div class="field"><label>Password lama</label><input class="input" type="password" id="pw-l" autocomplete="current-password"></div>' +
      '<div class="field"><label>Password baru</label><input class="input" type="password" id="pw-b" autocomplete="new-password"></div>' +
      '<div class="field"><label>Ulangi password baru</label><input class="input" type="password" id="pw-b2" autocomplete="new-password"></div>' +
      '<button class="btn btn-primary" type="submit">Simpan password</button></form></div>';
    V().querySelector('[data-logout2]').onclick = () => App.logout();
    V().querySelector('#f-pw').onsubmit = async e => {
      e.preventDefault();
      const l = V().querySelector('#pw-l').value, b = V().querySelector('#pw-b').value, b2 = V().querySelector('#pw-b2').value;
      if (b !== b2) { UI.toast('Konfirmasi password tidak sama', 'err'); return; }
      const r = await UI.sibuk(e.target.querySelector('button[type=submit]'), () => API.call('gantiPassword', { lama: l, baru: b }));
      API.perbaruiUser(r.user); e.target.reset(); UI.toast('Password berhasil diganti');
    };
  };
})();
