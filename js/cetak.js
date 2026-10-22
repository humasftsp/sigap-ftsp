/**
 * SIGAP FTSP — cetak.js
 * Cetak rekap (FR-13): PDF lewat dialog cetak browser ("Simpan sebagai PDF"),
 * Word lewat dokumen HTML ber-ekstensi .doc yang dibuka langsung oleh MS Word.
 * Layout memakai <table> (bukan flex) agar tampil sama di Word.
 */
(function () {
  const { ic, esc, fmtTgl, STATUS } = UI;
  const C = window.SIGAP_CONFIG || {};
  const Pages = window.Pages = window.Pages || {};

  function kop() {
    // URL absolut agar logo juga tampil di dokumen Word (.doc) yang dibuka di luar browser
    const src = C.LOGO_NAVY ? new URL(C.LOGO_NAVY, location.href).href : '';
    const logo = src
      ? '<img src="' + esc(src) + '" height="64" style="height:64px;width:auto" alt="Logo FTSP">'
      : '<div style="width:58px;height:58px;background:#113264;color:#fff;font-weight:800;font-size:15px;text-align:center;line-height:58px;border-radius:8px">FTSP</div>';
    return '<table class="kop" style="width:100%;border:0;border-bottom:3px double #113264;margin-bottom:12px"><tr>' +
      '<td style="width:56px;border:0;padding:0 12px 8px 0;vertical-align:middle">' + logo + '</td>' +
      '<td style="border:0;padding:0 0 8px;vertical-align:middle"><div style="font-size:15pt;font-weight:800;color:#113264;letter-spacing:.5px">' + esc(C.INSTANSI || 'UNIVERSITAS TRISAKTI') + '</div>' +
      '<div style="font-size:12pt;font-weight:700;color:#0066CC">' + esc(C.FAKULTAS || 'FAKULTAS TEKNIK SIPIL DAN PERENCANAAN') + '</div>' +
      '<div style="font-size:9pt;color:#475569">' + esc(C.ALAMAT || '') + '</div></td>' +
      '<td style="border:0;padding:0 0 8px;text-align:right;vertical-align:bottom;font-size:8.5pt;color:#64748B">SIGAP FTSP</td></tr></table>';
  }

  function dokumen(judul, sub, isi, landscape) {
    const u = App.user || {};
    const kaki = 'Dicetak melalui SIGAP FTSP oleh ' + esc(u.nama || '') + ' (' + esc(App.roleLabel()) + ') pada ' + fmtTgl(App.hariIni(), true) + '. Status dihitung otomatis berdasarkan data per tanggal cetak; tanda * berarti tanggal sebagian berupa estimasi.';
    return '<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>' + esc(judul) + '</title>' +
      '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->' +
      '<style>' +
      '@page { size: A4 ' + (landscape ? 'landscape' : 'portrait') + '; margin: 14mm 12mm; }' +
      '@page Section1 { size: ' + (landscape ? '841.9pt 595.3pt; mso-page-orientation: landscape' : '595.3pt 841.9pt') + '; margin: 40pt 34pt; }' +
      'div.Section1 { page: Section1; }' +
      'body { font-family: "Plus Jakarta Sans", Calibri, Arial, sans-serif; font-size: 9.5pt; color: #1E293B; margin: 0; }' +
      'h1 { font-size: 14pt; color: #113264; margin: 4px 0 2px; } h2 { font-size: 11.5pt; color: #113264; margin: 16px 0 6px; }' +
      '.sub { color: #475569; font-size: 9pt; margin-bottom: 10px; }' +
      'table.data { width: 100%; border-collapse: collapse; margin-top: 4px; }' +
      'table.data th { background: #E8EEF8; color: #113264; font-size: 8.5pt; text-align: left; border: 1px solid #A9B8CF; padding: 4px 5px; }' +
      'table.data td { border: 1px solid #CBD5E1; padding: 4px 5px; vertical-align: top; font-size: 8.8pt; }' +
      'table.data tr:nth-child(even) td { background: #F8FAFC; }' +
      '.c { text-align: center; } .r { text-align: right; } .b { font-weight: 700; } .mut { color: #64748B; }' +
      '.ringkas td { border: 1px solid #CBD5E1; padding: 5px 8px; font-size: 9pt; }' +
      '.kaki { margin-top: 18px; font-size: 8pt; color: #64748B; border-top: 1px solid #CBD5E1; padding-top: 6px; }' +
      '* { -webkit-print-color-adjust: exact; print-color-adjust: exact; }' +
      '</style></head><body><div class="Section1">' + kop() + '<h1>' + esc(judul) + '</h1><div class="sub">' + sub + '</div>' + isi + '<div class="kaki">' + kaki + '</div></div></body></html>';
  }

  const kolStatus = s => (STATUS[s] || { label: s }).label;
  function tglElig(st) { return st.tgl_eligible ? fmtTgl(st.tgl_eligible) + (st.estimasi ? '*' : '') : (st.status === 'PANJANG' ? 'Belum terestimasi' : '—'); }
  function ident(d) { return d.nidn ? 'NIDN ' + d.nidn : d.nuptk ? 'NUPTK ' + d.nuptk : '—'; }
  function tabelDosen(list, kolomProdi) {
    return '<table class="data"><thead><tr><th class="c" style="width:26px">No</th><th>Nama</th><th>NIDN/NUPTK</th>' + (kolomProdi ? '<th>Prodi</th>' : '') + '<th>Jabatan</th><th>TMT</th><th>Target</th><th>Eligible efektif</th><th>Status</th><th class="c">Berkas</th></tr></thead><tbody>' +
      list.map((d, i) => '<tr><td class="c">' + (i + 1) + '</td><td class="b">' + esc(d.nama) + '</td><td>' + esc(ident(d)) + '</td>' + (kolomProdi ? '<td>' + esc(d.prodi) + '</td>' : '') +
        '<td>' + esc(d.status.jabatan_label) + '</td><td>' + fmtTgl(Pages.tmtAcuan(d)) + '</td><td>' + esc(d.status.target_label || '—') + '</td><td>' + tglElig(d.status) + '</td><td>' + esc(kolStatus(d.status.status)) + '</td><td class="c">' + d.kelengkapan.ada + '/' + d.kelengkapan.total + '</td></tr>').join('') +
      (list.length ? '' : '<tr><td colspan="10" class="c mut">Tidak ada data</td></tr>') + '</tbody></table>';
  }
  function ringkasStatus(list) {
    const c = {}; list.forEach(d => c[d.status.status] = (c[d.status.status] || 0) + 1);
    return '<table class="ringkas" style="border-collapse:collapse;margin:4px 0 6px"><tr>' + ['SIAP', 'PENDEK', 'PANJANG', 'BELUM_LENGKAP', 'GB'].map(s => '<td><span class="mut">' + kolStatus(s) + '</span><br><b style="font-size:12pt">' + (c[s] || 0) + '</b></td>').join('') + '<td><span class="mut">Total</span><br><b style="font-size:12pt">' + list.length + '</b></td></tr></table>';
  }
  function urut(list) {
    const o = ['SIAP', 'PENDEK', 'PANJANG', 'BELUM_LENGKAP', 'GB'];
    return list.slice().sort((a, b) => o.indexOf(a.status.status) - o.indexOf(b.status.status) || String(a.status.tgl_eligible || '9').localeCompare(String(b.status.tgl_eligible || '9')) || a.nama.localeCompare(b.nama));
  }

  /** Bangun dokumen sesuai jenis & filter. Mengembalikan {judul, html}. */
  async function bangun(jenis, f) {
    let list = App.dosenAktif().filter(App.dalamLingkup);
    if (f.prodi) list = list.filter(d => d.prodi === f.prodi);
    if (f.status) list = list.filter(d => d.status.status === f.status);
    if (f.jab) list = list.filter(d => d.status.jabatan === f.jab);
    const fil = [f.prodi ? 'Prodi ' + f.prodi : (App.lihatSemua() ? 'Semua prodi' : 'Prodi ' + App.prodiPimpinan().join(', ')), f.status ? 'Status: ' + kolStatus(f.status) : '', f.jab ? 'Jabatan: ' + UI.jab(f.jab) : ''].filter(Boolean).join(' · ');
    const sub = fil + ' · Data per ' + fmtTgl(App.hariIni(), true);

    if (jenis === 'prodi') {
      const prodi = f.prodi ? [f.prodi] : (App.lihatSemua() ? App.boot.prodi : App.prodiPimpinan());
      let isi = '';
      prodi.forEach(p => {
        const dp = urut(list.filter(d => d.prodi === p));
        const jab = {}; dp.forEach(d => jab[d.status.jabatan || '?'] = (jab[d.status.jabatan || '?'] || 0) + 1);
        isi += '<h2>Program Studi ' + esc(p) + ' (' + dp.length + ' dosen)</h2>' + ringkasStatus(dp) +
          '<div class="mut" style="font-size:8.5pt;margin-bottom:4px">Sebaran jabatan: ' + ['TP', 'ASA', 'L', 'LK', 'GB'].map(j => UI.jab(j) + ' ' + (jab[j] || 0)).join(' · ') + '</div>' + tabelDosen(dp, false);
      });
      return { judul: 'Rekap Jabatan Akademik per Program Studi', html: dokumen('Rekap Jabatan Akademik per Program Studi', sub, isi, true) };
    }
    if (jenis === 'status') {
      let isi = ringkasStatus(list);
      ['SIAP', 'PENDEK', 'PANJANG', 'BELUM_LENGKAP'].forEach(s => {
        const ds = urut(list.filter(d => d.status.status === s));
        if (!ds.length) return;
        isi += '<h2>' + kolStatus(s) + ' (' + ds.length + ')</h2><table class="data"><thead><tr><th class="c" style="width:26px">No</th><th>Nama</th><th>Prodi</th><th>Jenjang</th><th>TMT</th><th>Eligible efektif</th><th>Keterangan / alasan</th></tr></thead><tbody>' +
          ds.map((d, i) => '<tr><td class="c">' + (i + 1) + '</td><td class="b">' + esc(d.nama) + '<br><span class="mut">' + esc(ident(d)) + '</span></td><td>' + esc(d.prodi) + '</td><td>' + esc(d.status.jabatan_label) + (d.status.target_label ? ' → ' + esc(d.status.target_label) : '') + '</td>' +
            '<td>' + fmtTgl(Pages.tmtAcuan(d)) + '</td><td>' + tglElig(d.status) + '</td><td>' + esc((d.status.alasan || []).join('; ')) + (d.status_pengusulan && d.status_pengusulan !== 'Belum' ? ' [Pengusulan: ' + esc(d.status_pengusulan) + ']' : '') + '</td></tr>').join('') + '</tbody></table>';
      });
      return { judul: 'Rekap Status Kelayakan Kenaikan Jabatan', html: dokumen('Rekap Status Kelayakan Kenaikan Jabatan', sub, isi, true) };
    }
    if (jenis === 'kelengkapan') {
      const jenisB = App.boot.jenis_berkas || [];
      const ds = list.slice().sort((a, b) => a.prodi.localeCompare(b.prodi) || a.nama.localeCompare(b.nama));
      const isi = '<table class="data"><thead><tr><th class="c">No</th><th>Nama</th><th>Prodi</th>' + jenisB.map(j => '<th class="c">' + esc(j.nama) + '</th>').join('') + '<th class="c">Kelengkapan</th></tr></thead><tbody>' +
        ds.map((d, i) => '<tr><td class="c">' + (i + 1) + '</td><td class="b">' + esc(d.nama) + '</td><td>' + esc(d.prodi) + '</td>' + jenisB.map(j => '<td class="c">' + ((d.kelengkapan.item[j.kode] || {}).ada ? 'Ada' : '—') + '</td>').join('') +
          '<td class="c b">' + d.kelengkapan.persen + '% (' + d.kelengkapan.ada + '/' + d.kelengkapan.total + ')</td></tr>').join('') + '</tbody></table>';
      return { judul: 'Rekap Kelengkapan Berkas Dosen', html: dokumen('Rekap Kelengkapan Berkas Dosen', sub, isi, true) };
    }
    if (jenis === 'pensiun') {
      const ds = list.filter(d => d.pensiun.tgl_pensiun && d.pensiun.bulan_ke_pensiun <= 24).sort((a, b) => a.pensiun.bulan_ke_pensiun - b.pensiun.bulan_ke_pensiun);
      const isi = '<table class="data"><thead><tr><th class="c">No</th><th>Nama</th><th>Prodi</th><th>Jabatan</th><th>Tanggal lahir</th><th>Usia</th><th>Batas usia</th><th>Tanggal capai batas</th><th>Sisa</th></tr></thead><tbody>' +
        ds.map((d, i) => { const p = d.pensiun; return '<tr><td class="c">' + (i + 1) + '</td><td class="b">' + esc(d.nama) + '</td><td>' + esc(d.prodi) + '</td><td>' + esc(d.status.jabatan_label) + '</td><td>' + fmtTgl(d.tgl_lahir) + '</td><td>' + p.usia_tahun + ' thn ' + p.usia_bulan + ' bln</td><td>' + p.usia_pensiun + ' thn</td><td class="b">' + fmtTgl(p.tgl_pensiun) + '</td><td>' + (p.bulan_ke_pensiun < 0 ? 'Lewat ' + (-p.bulan_ke_pensiun) + ' bln' : p.bulan_ke_pensiun + ' bln') + '</td></tr>'; }).join('') +
        (ds.length ? '' : '<tr><td colspan="9" class="c mut">Tidak ada dosen yang mencapai batas usia dalam 24 bulan (atau usia pensiun belum diatur).</td></tr>') + '</tbody></table>';
      return { judul: 'Daftar Dosen Mendekati Batas Usia Pensiun', html: dokumen('Daftar Dosen Mendekati Batas Usia Pensiun (≤24 bulan)', sub, isi, true) };
    }
    if (jenis === 'profil') {
      if (!f.id_dosen) throw new Error('Pilih dosen terlebih dahulu.');
      const r = await API.call('getDosen', { id_dosen: f.id_dosen });
      const d = r.dosen; const st = d.status;
      const baris = (k, v) => '<tr><td style="width:34%;background:#F1F5F9" class="b">' + k + '</td><td>' + v + '</td></tr>';
      let isi = '<h2>Identitas</h2><table class="data"><tbody>' + [
        ['Nama', esc(d.nama)], ['NIDN / NUPTK', esc((d.nidn || '—') + ' / ' + (d.nuptk || '—'))], ['Homebase', esc(d.prodi || 'Belum ditetapkan')], ['Email', esc(d.email || '—')],
        ['Tanggal lahir', fmtTgl(d.tgl_lahir, true)], ['Serdos', esc(d.serdos || '—')], ['BKD berturut', esc(d.bkd_semester !== '' ? d.bkd_semester + ' semester' : '—')]
      ].map(x => baris(x[0], x[1])).join('') + '</tbody></table>';
      isi += '<h2>Jabatan & Kelayakan</h2><table class="data"><tbody>' + [
        ['Jabatan saat ini', esc(st.jabatan_label) + ' (TMT ' + fmtTgl(Pages.tmtAcuan(d), true) + (d.no_sk_jabatan ? ', SK ' + esc(d.no_sk_jabatan) : '') + ')'],
        ['Target berikutnya', esc(st.target_label || '—')], ['Tanggal eligible efektif', tglElig(st)], ['Status', '<b>' + esc(kolStatus(st.status)) + '</b>'],
        ['Alasan', esc((st.alasan || []).join('; '))], ['Status pengusulan', esc(d.status_pengusulan || 'Belum') + (d.tgl_pengusulan ? ' (' + fmtTgl(d.tgl_pengusulan) + ')' : '')]
      ].map(x => baris(x[0], x[1])).join('') + '</tbody></table>';
      if (st.syarat && st.syarat.length) isi += '<h2>Syarat</h2><table class="data"><thead><tr><th>Syarat</th><th>Keterangan</th><th>Tanggal</th><th class="c">Terpenuhi</th></tr></thead><tbody>' +
        st.syarat.map(s => '<tr><td>' + esc(s.nama) + '</td><td>' + esc(s.ket) + '</td><td>' + (s.tanggal ? fmtTgl(s.tanggal) : '—') + '</td><td class="c b">' + (s.terpenuhi ? 'Ya' : 'Belum') + '</td></tr>').join('') + '</tbody></table>';
      isi += '<h2>Pendidikan</h2><table class="data"><thead><tr><th>Jenjang</th><th>Universitas</th><th>Lulus</th></tr></thead><tbody>' +
        [['S1', d.s1_univ, d.s1_lulus], ['S2', d.s2_univ, d.s2_lulus], ['S3', d.s3_univ, d.s3_lulus]].map(x => '<tr><td>' + x[0] + '</td><td>' + esc(x[1] || '—') + '</td><td>' + (/^\d{4}-\d{2}-\d{2}$/.test(x[2]) ? fmtTgl(x[2]) : esc(x[2] || '—')) + '</td></tr>').join('') +
        (d.tb_mulai || d.tb_selesai ? '<tr><td>Tugas belajar</td><td colspan="2">' + fmtTgl(d.tb_mulai) + ' s.d. ' + fmtTgl(d.tb_selesai) + '</td></tr>' : '') + '</tbody></table>';
      isi += '<h2>Riwayat Jabatan</h2><table class="data"><thead><tr><th>Jabatan</th><th>TMT</th><th>No. SK</th></tr></thead><tbody><tr><td class="b">' + esc(st.jabatan_label) + ' (saat ini)</td><td>' + fmtTgl(Pages.tmtAcuan(d)) + '</td><td>' + esc(d.no_sk_jabatan || '—') + '</td></tr>' +
        (d.riwayat || []).map(x => '<tr><td>' + esc(x.jabatan_label) + '</td><td>' + fmtTgl(x.tmt) + '</td><td>' + esc(x.no_sk || '—') + '</td></tr>').join('') + '</tbody></table>';
      isi += '<h2>Kelengkapan Berkas (' + d.kelengkapan.persen + '%)</h2><table class="data"><thead><tr><th>Jenis berkas</th><th class="c">Status</th></tr></thead><tbody>' +
        (App.boot.jenis_berkas || []).map(j => '<tr><td>' + esc(j.nama) + '</td><td class="c">' + ((d.kelengkapan.item[j.kode] || {}).ada ? 'Ada' : 'Belum') + '</td></tr>').join('') + '</tbody></table>';
      return { judul: 'Profil Dosen — ' + d.nama, html: dokumen('Profil Kepegawaian Dosen', esc(d.nama) + ' · Data per ' + fmtTgl(App.hariIni(), true), isi, false) };
    }
    throw new Error('Jenis rekap tidak dikenal.');
  }

  function cetakPDF(html) {
    const old = document.getElementById('print-frame'); if (old) old.remove();
    const fr = document.createElement('iframe');
    fr.id = 'print-frame';
    fr.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(fr);
    const doc = fr.contentWindow.document;
    doc.open(); doc.write(html); doc.close();
    const go = () => { try { fr.contentWindow.focus(); fr.contentWindow.print(); } catch (e) { UI.toast('Browser memblokir dialog cetak. Coba lagi.', 'err'); } };
    // tunggu font dimuat agar tata letak stabil
    if (fr.contentDocument.fonts && fr.contentDocument.fonts.ready) fr.contentDocument.fonts.ready.then(() => setTimeout(go, 150)); else setTimeout(go, 400);
  }
  function unduhWord(html, nama) {
    const blob = new Blob(['﻿', html], { type: 'application/msword' });
    UI.unduhBlob(blob, nama.replace(/[^\w\- ]+/g, '').replace(/\s+/g, '_').slice(0, 80) + '.doc');
  }

  // ============================================================
  // HALAMAN CETAK & REKAP
  // ============================================================
  const CTK = { jenis: '', prodi: '', status: '', jab: '', id_dosen: '' };
  Pages.cetak = async function (param, q) {
    V().innerHTML = UI.skeleton(3);
    await App.muatDosen();
    if (!App.isCurrent()) return;
    const dosenRole = App.dosenSaja();
    if (q && q.jenis) CTK.jenis = q.jenis;
    if (dosenRole) { CTK.jenis = 'profil'; CTK.id_dosen = App.user.id_dosen || ''; }
    if (!CTK.jenis) CTK.jenis = 'prodi';
    render();
  };
  const V = () => App.view;

  function render() {
    const dosenRole = App.dosenSaja();
    const pilihan = dosenRole ? [['profil', 'Profil saya', 'Identitas, jabatan, syarat, riwayat, dan kelengkapan berkas', 'user']] : [
      ['prodi', 'Rekap per Prodi', 'Ringkasan status & daftar dosen per program studi', 'building'],
      ['status', 'Rekap Status Kelayakan', 'Dikelompokkan per status beserta alasannya', 'award'],
      ['profil', 'Profil Dosen', 'Satu dosen: identitas, syarat, riwayat jabatan', 'user'],
      ['kelengkapan', 'Rekap Kelengkapan Berkas', 'Matriks Ada/Belum per jenis berkas', 'folder'],
      ['pensiun', 'Daftar Mendekati Pensiun', 'Dosen yang mencapai batas usia ≤24 bulan', 'hourglass']
    ];
    const prodiList = App.lihatSemua() ? App.boot.prodi : App.prodiPimpinan();
    const dosenOpt = App.dosenAktif().filter(d => App.dalamLingkup(d) || d.id_dosen === App.user.id_dosen).slice().sort((a, b) => a.nama.localeCompare(b.nama));
    let h = '<div class="page-head"><div><div class="eyebrow">FR-13</div><h1>Cetak & Rekap</h1><p>Pilih jenis rekap dan filter. PDF dibuat lewat dialog cetak browser — pilih <b>Simpan sebagai PDF</b>. Word diunduh sebagai berkas .doc.</p></div></div>';
    h += '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(210px,1fr));margin-bottom:18px">' + pilihan.map(p =>
      '<button class="card kpi click ' + (CTK.jenis === p[0] ? '' : '') + '" data-j="' + p[0] + '" style="text-align:left;' + (CTK.jenis === p[0] ? 'border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,102,204,.15)' : '') + '">' +
      '<div class="k-top"><div class="k-title">' + p[1] + '</div><div class="k-ico">' + ic(p[3], 18) + '</div></div><div class="k-desc" style="display:block">' + p[2] + '</div></button>').join('') + '</div>';
    if (!dosenRole) {
      h += '<div class="toolbar">';
      if (CTK.jenis === 'profil') h += '<select class="input grow" id="c-d"><option value="">— pilih dosen —</option>' + dosenOpt.map(d => '<option value="' + esc(d.id_dosen) + '" ' + (CTK.id_dosen === d.id_dosen ? 'selected' : '') + '>' + esc(d.nama) + ' · ' + esc(d.prodi) + '</option>').join('') + '</select>';
      else {
        if (prodiList.length > 1) h += '<select class="input" id="c-p"><option value="">Semua prodi</option>' + prodiList.map(p => '<option ' + (CTK.prodi === p ? 'selected' : '') + '>' + esc(p) + '</option>').join('') + '</select>';
        if (CTK.jenis !== 'status') h += '<select class="input" id="c-s"><option value="">Semua status</option>' + ['SIAP', 'PENDEK', 'PANJANG', 'BELUM_LENGKAP', 'GB'].map(s => '<option value="' + s + '" ' + (CTK.status === s ? 'selected' : '') + '>' + STATUS[s].label + '</option>').join('') + '</select>';
        h += '<select class="input" id="c-jb"><option value="">Semua jabatan</option>' + ['TP', 'ASA', 'L', 'LK', 'GB'].map(j => '<option value="' + j + '" ' + (CTK.jab === j ? 'selected' : '') + '>' + UI.jab(j) + '</option>').join('') + '</select>';
      }
      h += '<div style="flex:1"></div><button class="btn btn-outline" data-word>' + ic('file', 16) + 'Unduh Word</button><button class="btn btn-primary" data-pdf>' + ic('printer', 16) + 'Cetak / PDF</button></div>';
    } else {
      h += '<div class="toolbar"><div style="flex:1"></div><button class="btn btn-outline" data-word>' + ic('file', 16) + 'Unduh Word</button><button class="btn btn-primary" data-pdf>' + ic('printer', 16) + 'Cetak / PDF</button></div>';
    }
    h += '<div class="card" style="padding:12px;background:#E9EEF5"><div class="lbl" style="margin:0 4px 8px">PRATINJAU</div><iframe id="c-prev" title="Pratinjau dokumen" style="width:100%;height:72vh;border:0;border-radius:8px;background:#fff;box-shadow:var(--sh-2)"></iframe></div>';
    V().innerHTML = h;

    V().querySelectorAll('[data-j]').forEach(b => b.onclick = () => { CTK.jenis = b.dataset.j; render(); });
    const bind = (id, k) => { const el = V().querySelector(id); if (el) el.onchange = () => { CTK[k] = el.value; pratinjau(); }; };
    bind('#c-p', 'prodi'); bind('#c-s', 'status'); bind('#c-jb', 'jab'); bind('#c-d', 'id_dosen');
    V().querySelector('[data-pdf]').onclick = async e => { const d = await UI.sibuk(e.currentTarget, () => bangun(CTK.jenis, CTK)); cetakPDF(d.html); };
    V().querySelector('[data-word]').onclick = async e => { const d = await UI.sibuk(e.currentTarget, () => bangun(CTK.jenis, CTK)); unduhWord(d.html, d.judul + ' ' + App.hariIni()); UI.toast('Dokumen Word diunduh'); };
    pratinjau();
  }

  async function pratinjau() {
    const fr = V().querySelector('#c-prev'); if (!fr) return;
    try {
      const d = await bangun(CTK.jenis, CTK);
      fr.srcdoc = d.html;
    } catch (e) {
      fr.srcdoc = '<p style="font-family:sans-serif;color:#64748B;padding:24px">' + esc(e.message) + '</p>';
    }
  }

  window.Cetak = { bangun, cetakPDF, unduhWord };
})();
