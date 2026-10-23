/**
 * SIGAP FTSP — organisasi.js
 * Program Studi, Homebase Dosen, Jabatan Struktural (pimpinan fakultas & prodi), Override Peran.
 * Juga dipakai tab "Homebase & Struktural" di detail dosen.
 */
(function () {
  const { ic, esc, fmtTgl } = UI;
  const Pages = window.Pages = window.Pages || {};
  const V = () => App.view;
  const JENJANG = ['D3', 'D4', 'S1', 'S2', 'S3', 'Profesi'];
  const LABEL_STR = { DEKAN: 'Dekan', WD1: 'Wakil Dekan I', WD2: 'Wakil Dekan II', WD3: 'Wakil Dekan III', WD4: 'Wakil Dekan IV', KAPRODI: 'Kaprodi', SEKPRODI: 'Sekprodi', LAINNYA: 'Lainnya' };
  const FAKULTAS = ['DEKAN', 'WD1', 'WD2', 'WD3', 'WD4'];
  const TAB = [
    ['prodi', 'Program Studi', 'building'],
    ['homebase', 'Homebase Dosen', 'users'],
    ['struktural', 'Jabatan Struktural', 'award'],
    ['override', 'Override Peran', 'shield']
  ];
  let ORG = null;
  const HB = { q: '', prodi: '', pilih: {} };

  async function muat(paksa) {
    if (!ORG || paksa) ORG = await API.call('getOrganisasi');
    return ORG;
  }
  function opsiProdi(sel, semua) {
    return (App.boot.prodi_master || []).filter(p => semua || p.aktif).map(p => '<option value="' + esc(p.id_prodi) + '" ' + (sel === p.id_prodi ? 'selected' : '') + '>' + esc(p.label) + (p.aktif ? '' : ' (nonaktif)') + '</option>').join('');
  }
  function periode(a, b) { return (a ? fmtTgl(a) : 'Sejak awal data') + ' – ' + (b ? fmtTgl(b) : 'sekarang'); }
  async function segarkan() {
    await Promise.all([muat(true), App.muatBoot(), App.muatDosen(true)]);
  }

  Pages.organisasi = async function (param, q) {
    const tab = TAB.some(t => t[0] === param) ? param : 'prodi';
    if (q && q.filter === 'kosong') HB.prodi = '__kosong';
    V().innerHTML = UI.skeleton(5);
    await muat(true);
    if (!App.isCurrent()) return;
    render(tab);
  };

  function render(tab) {
    const t = TAB.find(x => x[0] === tab);
    const desk = {
      prodi: 'Daftar program studi menjadi pilihan homebase, jabatan struktural, override peran, dan filter laporan. Prodi yang masih dipakai tidak dapat dinonaktifkan.',
      homebase: 'Homebase adalah prodi induk dosen dan dasar semua pengelompokan per prodi. Setiap perubahan wajib memuat tanggal berlaku dan alasan; riwayat tidak boleh tumpang tindih.',
      struktural: 'Pimpinan fakultas (Dekan, Wakil Dekan I–IV) dan pimpinan prodi (Kaprodi, Sekprodi) beserta periodenya. Pejabat yang aktif otomatis mendapat akses: Dekan dan Wakil Dekan memantau seluruh dosen, Kaprodi/Sekprodi memantau dosen berhomebase di prodinya. Satu jabatan hanya boleh dipegang satu orang pada tanggal yang sama.',
      override: 'Beri atau cabut peran secara manual di luar jabatan struktural. Setiap override wajib beralasan dan bertanggal berakhir agar tidak terlupa dicabut.'
    }[tab];
    let h = '<div class="page-head"><div><div class="eyebrow">Organisasi</div><h1>' + esc(t[1]) + '</h1><p>' + desk + '</p></div><div class="actions" id="org-aksi"></div></div>' +
      '<div class="tabs" role="tablist">' + TAB.map(x => '<a role="tab" class="' + (x[0] === tab ? 'on' : '') + '" href="#/organisasi/' + x[0] + '">' + ic(x[2], 15) + x[1] +
        (x[0] === 'homebase' && ORG.homebase.filter(d => !d.id_prodi).length ? '<span class="n warn">' + ORG.homebase.filter(d => !d.id_prodi).length + '</span>' : '') +
        (x[0] === 'override' && ORG.override.filter(o => o.berlaku).length ? '<span class="n">' + ORG.override.filter(o => o.berlaku).length + '</span>' : '') + '</a>').join('') + '</div><div id="org-isi"></div>';
    V().innerHTML = h;
    ({ prodi: tabProdi, homebase: tabHomebase, struktural: tabStruktural, override: tabOverride })[tab]();
  }

  // ============================================================
  // PROGRAM STUDI
  // ============================================================
  function tabProdi() {
    const el = V().querySelector('#org-isi');
    const aktif = ORG.prodi.filter(p => p.aktif);
    const tanpa = ORG.homebase.filter(d => !d.id_prodi).length;
    const kap = {};
    ORG.struktural.filter(s => s.berlaku && s.jabatan === 'KAPRODI').forEach(s => kap[s.id_prodi] = s.nama_dosen);
    const kp = (cls, label, v, s, icon) => '<div class="card kpi ' + cls + '"><div class="k-top"><div class="k-label">' + label + '</div><div class="k-ico">' + ic(icon, 18) + '</div></div><div class="k-val tabular">' + v + '</div><div class="k-desc">' + s + '</div></div>';
    let h = '<div class="grid g-4 mb">' + kp('', 'Prodi aktif', aktif.length, ORG.prodi.length - aktif.length + ' nonaktif', 'building') +
      kp('ready', 'Dosen berhomebase', ORG.homebase.length - tanpa, 'dari ' + ORG.homebase.length + ' dosen aktif', 'users') +
      kp(tanpa ? 'inc' : '', 'Belum ditetapkan', tanpa, 'Tidak masuk rekap per prodi', 'alert') +
      kp('short', 'Pindah terjadwal', ORG.terjadwal.length, 'Berlaku otomatis pada tanggalnya', 'calendar') + '</div>';
    h += '<div class="card"><div class="table-wrap"><table class="tbl tbl-cards"><thead><tr><th class="num">#</th><th>Program studi</th><th>Kode PDDikti</th><th>Kelompok bidang</th><th class="num">Dosen homebase</th><th>Kaprodi aktif</th><th>Status</th><th></th></tr></thead><tbody>' +
      ORG.prodi.map(p => '<tr><td class="num" data-l="Urutan">' + (p.urutan || '—') + '</td><td><b>' + esc(p.label) + '</b></td><td data-l="Kode PDDikti" class="tabular">' + esc(p.kode_pddikti || '—') + '</td>' +
        '<td data-l="Kelompok">' + esc(p.kelompok_bidang) + '</td><td class="num" data-l="Dosen">' + p.jumlah_dosen + '</td>' +
        '<td data-l="Kaprodi">' + (kap[p.id_prodi] ? esc(kap[p.id_prodi]) : (p.aktif ? '<span class="badge b-short">Belum ada</span>' : '—')) + '</td>' +
        '<td data-l="Status">' + (p.aktif ? '<span class="badge b-ready"><span class="dot"></span>Aktif</span>' : '<span class="badge b-gray">Nonaktif</span>') + '</td>' +
        '<td class="num"><button class="btn btn-ghost btn-xs" data-edit="' + esc(p.id_prodi) + '">' + ic('edit', 14) + 'Ubah</button></td></tr>').join('') +
      '</tbody></table></div></div>' +
      '<p class="muted small" style="margin-top:12px">' + ic('info', 13) + ' SIGAP tidak tersinkron dengan PDDikti/SISTER. Kode PDDikti dicatat untuk pencocokan manual; bila berbeda, data PDDikti menjadi acuan.</p>';
    el.innerHTML = h;
    V().querySelector('#org-aksi').innerHTML = '<button class="btn btn-primary" data-tambah>' + ic('plus', 16) + 'Tambah prodi</button>';
    V().querySelector('[data-tambah]').onclick = () => formProdi(null);
    el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => formProdi(ORG.prodi.find(p => p.id_prodi === b.dataset.edit)));
  }

  function formProdi(p) {
    const v = p || { jenjang: 'S1', aktif: true, urutan: ORG.prodi.length + 1 };
    const m = UI.modal({
      title: p ? 'Ubah program studi' : 'Tambah program studi', sub: p ? esc(p.label) : '',
      body: '<div class="form-grid"><div class="field"><label>Jenjang *</label><select class="input" id="pr-j">' + JENJANG.map(j => '<option ' + (v.jenjang === j ? 'selected' : '') + '>' + j + '</option>').join('') + '</select></div>' +
        '<div class="field"><label>Nama prodi *</label><input class="input" id="pr-n" value="' + esc(v.nama || '') + '" placeholder="mis. Teknik Sipil"></div>' +
        '<div class="field"><label>Kode prodi PDDikti</label><input class="input" id="pr-k" inputmode="numeric" maxlength="5" value="' + esc(v.kode_pddikti || '') + '" placeholder="5 digit"></div>' +
        '<div class="field"><label>Kelompok bidang</label><input class="input" id="pr-g" value="' + esc(v.kelompok_bidang || '') + '" placeholder="mis. Teknik Sipil"><span class="hint">Untuk rekap gabungan S1 + S2.</span></div>' +
        '<div class="field"><label>Urutan tampil</label><input class="input" id="pr-u" type="number" min="1" value="' + esc(v.urutan || '') + '"></div>' +
        '<div class="field" style="align-content:end"><label class="check"><input type="checkbox" id="pr-a" ' + (v.aktif ? 'checked' : '') + '>Aktif</label></div></div>' +
        (p ? '<div class="alert-box blue standalone" style="margin-top:6px">' + ic('info', 16) + '<div>Dipakai oleh ' + p.jumlah_dosen + ' dosen aktif dan ' + p.jumlah_struktural + ' jabatan struktural aktif. Prodi nonaktif tetap tampil di riwayat dan laporan lampau.</div></div>' : ''),
      foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-ok>Simpan</button>'
    });
    m.$('[data-ok]').onclick = async e => {
      const r = await UI.sibuk(e.target, () => API.call('saveProdi', { prodi: { id_prodi: p ? p.id_prodi : '', jenjang: m.$('#pr-j').value, nama: m.$('#pr-n').value, kode_pddikti: m.$('#pr-k').value, kelompok_bidang: m.$('#pr-g').value, urutan: m.$('#pr-u').value, aktif: m.$('#pr-a').checked } }));
      m.close(); UI.toast(r.message); await segarkan(); render('prodi');
    };
  }

  // ============================================================
  // HOMEBASE DOSEN
  // ============================================================
  function tabHomebase() {
    const el = V().querySelector('#org-isi');
    const q = HB.q.toLowerCase();
    let l = ORG.homebase;
    if (q) l = l.filter(d => (d.nama + ' ' + d.nidn + ' ' + d.nuptk).toLowerCase().indexOf(q) >= 0);
    if (HB.prodi === '__kosong') l = l.filter(d => !d.id_prodi);
    else if (HB.prodi) l = l.filter(d => d.id_prodi === HB.prodi);
    l = l.slice().sort((a, b) => (!!a.id_prodi - !!b.id_prodi) || a.nama.localeCompare(b.nama)); // Belum ditetapkan di atas
    Object.keys(HB.pilih).forEach(k => { if (!ORG.homebase.some(d => d.id_dosen === k)) delete HB.pilih[k]; });
    const nPilih = Object.keys(HB.pilih).length;
    const semuaTerpilih = l.length && l.every(d => HB.pilih[d.id_dosen]);
    const hitungProdi = id => ORG.homebase.filter(d => d.id_prodi === id).length;

    let h = '';
    if (ORG.terjadwal.length) {
      h += '<div class="card mb"><div class="card-head"><div><h3>' + ic('calendar', 18) + 'Pindah homebase terjadwal</h3><div class="sub">Berlaku otomatis pada tanggalnya (pemicu harian). Kaprodi prodi lama kehilangan akses sejak tanggal berlaku.</div></div></div>' +
        '<div class="table-wrap" style="margin-top:8px"><table class="tbl tbl-cards"><thead><tr><th>Dosen</th><th>Ke prodi</th><th>Berlaku</th><th>Alasan</th><th></th></tr></thead><tbody>' +
        ORG.terjadwal.map(t => '<tr><td><b>' + esc(t.nama) + '</b></td><td data-l="Ke">' + esc(t.prodi) + '</td><td data-l="Berlaku" class="nowrap">' + fmtTgl(t.tgl_mulai) + '</td><td data-l="Alasan" class="small">' + esc(t.alasan) + '</td>' +
          '<td class="num"><button class="btn btn-ghost btn-xs" data-batal="' + esc(t.id_riwayat) + '">' + ic('x', 14) + 'Batalkan</button></td></tr>').join('') + '</tbody></table></div></div>';
    }
    h += '<div class="toolbar"><div class="input-icon grow">' + ic('search', 17) + '<input class="input" id="hb-q" placeholder="Cari nama, NIDN, NUPTK…" value="' + esc(HB.q) + '"></div>' +
      '<select class="input" id="hb-p"><option value="">Semua homebase (' + ORG.homebase.length + ')</option>' + ORG.prodi.map(p => '<option value="' + esc(p.id_prodi) + '" ' + (HB.prodi === p.id_prodi ? 'selected' : '') + '>' + esc(p.label) + ' (' + hitungProdi(p.id_prodi) + ')</option>').join('') +
      '<option value="__kosong" ' + (HB.prodi === '__kosong' ? 'selected' : '') + '>Belum ditetapkan (' + ORG.homebase.filter(d => !d.id_prodi).length + ')</option></select>' +
      '<button class="btn btn-primary" data-massal ' + (nPilih ? '' : 'disabled') + '>' + ic('building', 16) + 'Ubah homebase' + (nPilih ? ' (' + nPilih + ')' : '') + '</button>' +
      (nPilih ? '<button class="btn btn-ghost btn-sm" data-kosongkan>Batalkan pilihan</button>' : '') + '</div>';
    h += '<div class="card">' + (l.length ? '<div class="table-wrap"><table class="tbl tbl-cards"><thead><tr><th style="width:36px"><input type="checkbox" id="hb-all" ' + (semuaTerpilih ? 'checked' : '') + ' aria-label="Pilih semua"></th><th>Dosen</th><th>Homebase saat ini</th><th>Sejak</th><th>No. SK</th><th class="num">Riwayat</th><th></th></tr></thead><tbody>' +
      l.map(d => '<tr class="' + (HB.pilih[d.id_dosen] ? 'sel' : '') + '"><td><input type="checkbox" data-pilih="' + esc(d.id_dosen) + '" ' + (HB.pilih[d.id_dosen] ? 'checked' : '') + ' aria-label="Pilih ' + esc(d.nama) + '"></td>' +
        '<td><div class="person"><div class="avatar sm">' + esc(UI.inisial(d.nama)) + '</div><div><div class="pn"><a href="#/dosen/' + esc(d.id_dosen) + '?tab=homebase" style="color:inherit">' + esc(d.nama) + '</a></div><div class="ps">' + esc(d.nidn ? 'NIDN ' + d.nidn : d.nuptk ? 'NUPTK ' + d.nuptk : 'NIDN belum diisi') + ' · ' + esc(UI.jab(d.jabatan)) + '</div></div></div></td>' +
        '<td data-l="Homebase">' + (d.prodi ? '<b>' + esc(d.prodi) + '</b>' : '<span class="badge b-short">' + ic('alert', 12) + 'Belum ditetapkan</span>') + '</td>' +
        '<td data-l="Sejak" class="nowrap">' + (d.id_prodi ? (d.sejak ? fmtTgl(d.sejak) : '<span class="muted small">Awal data</span>') : '—') + '</td><td data-l="No. SK" class="small">' + esc(d.no_sk || '—') + '</td>' +
        '<td class="num" data-l="Riwayat">' + d.jumlah_riwayat + '</td>' +
        '<td class="num"><button class="btn btn-soft btn-xs" data-ubah="' + esc(d.id_dosen) + '">' + ic('edit', 14) + (d.id_prodi ? 'Ubah' : 'Tetapkan') + '</button></td></tr>').join('') +
      '</tbody></table></div><div class="pager"><span class="muted small">Menampilkan ' + l.length + ' dosen aktif · centang beberapa dosen untuk perubahan massal</span></div>' : UI.empty('search', 'Tidak ada dosen', 'Ubah kata kunci atau filter.')) + '</div>';
    el.innerHTML = h;
    V().querySelector('#org-aksi').innerHTML = '<a class="btn btn-outline" href="#/impor">' + ic('upload', 16) + 'Impor dari Excel</a>';

    const re = () => tabHomebase();
    const qi = el.querySelector('#hb-q');
    qi.addEventListener('input', UI.debounce(() => { HB.q = qi.value.trim(); re(); const n = V().querySelector('#hb-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250));
    el.querySelector('#hb-p').onchange = e => { HB.prodi = e.target.value; re(); };
    const all = el.querySelector('#hb-all');
    if (all) all.onchange = e => { l.forEach(d => { if (e.target.checked) HB.pilih[d.id_dosen] = 1; else delete HB.pilih[d.id_dosen]; }); re(); };
    el.querySelectorAll('[data-pilih]').forEach(c => c.onchange = () => { if (c.checked) HB.pilih[c.dataset.pilih] = 1; else delete HB.pilih[c.dataset.pilih]; re(); });
    const kos = el.querySelector('[data-kosongkan]'); if (kos) kos.onclick = () => { HB.pilih = {}; re(); };
    const selesai = async () => { HB.pilih = {}; await segarkan(); render('homebase'); };
    el.querySelector('[data-massal]').onclick = () => {
      const ids = Object.keys(HB.pilih);
      Pages.formHomebase(ids, ORG.homebase.filter(d => HB.pilih[d.id_dosen]), selesai);
    };
    el.querySelectorAll('[data-ubah]').forEach(b => b.onclick = () => Pages.formHomebase([b.dataset.ubah], ORG.homebase.filter(d => d.id_dosen === b.dataset.ubah), selesai));
    el.querySelectorAll('[data-batal]').forEach(b => b.onclick = () => batalJadwal(b, b.dataset.batal, async () => { await segarkan(); render('homebase'); }));
  }

  async function batalJadwal(btn, id, onDone) {
    if (!await UI.konfirmasi('Batalkan pindah terjadwal?', 'Baris jadwal dihapus dan homebase sebelumnya kembali berlaku tanpa tanggal selesai.', { ok: 'Batalkan jadwal', bahaya: true })) return;
    const r = await UI.sibuk(btn, () => API.call('batalHomebase', { id_riwayat: id }));
    UI.toast(r.message); App.invalidasi(); onDone();
  }

  /**
   * Form ubah homebase satuan/massal. daftar = [{id_dosen, nama, prodi}].
   */
  Pages.formHomebase = function (ids, daftar, onDone) {
    const satu = ids.length === 1;
    const kini = satu && daftar[0] ? daftar[0].id_prodi || '' : '';
    const m = UI.modal({
      title: satu ? 'Ubah homebase' : 'Ubah homebase ' + ids.length + ' dosen',
      sub: satu && daftar[0] ? esc(daftar[0].nama) + ' · saat ini ' + esc(daftar[0].prodi || 'Belum ditetapkan') : 'Perubahan massal; dosen yang gagal divalidasi dilewati dan dilaporkan.',
      body: (!satu ? '<div class="small muted" style="margin-bottom:10px">' + daftar.slice(0, 8).map(d => esc(d.nama)).join(', ') + (daftar.length > 8 ? ', dan ' + (daftar.length - 8) + ' lainnya' : '') + '</div>' : '') +
        '<div class="form-grid"><div class="field full"><label>Homebase baru *</label><select class="input" id="hb-pr"><option value="">— pilih prodi —</option>' + opsiProdi(kini) + '</select></div>' +
        '<div class="field"><label>Tanggal berlaku *</label><input class="input" type="date" id="hb-t" value="' + esc(App.hariIni()) + '"><span class="hint">Boleh di masa depan (pindah terjadwal).</span></div>' +
        '<div class="field"><label>No. SK penugasan</label><input class="input" id="hb-sk" placeholder="opsional"></div>' +
        '<div class="field full"><label>Alasan *</label><textarea class="input" id="hb-al" rows="2" placeholder="mis. Penugasan ke program magister sesuai SK Dekan"></textarea></div></div>' +
        '<div class="alert-box blue standalone" style="margin:4px 0 0">' + ic('info', 16) + '<div>Baris homebase lama ditutup sehari sebelum tanggal berlaku. Akses Kaprodi berpindah sejak tanggal tersebut; laporan periode lampau tetap memakai homebase per akhir periode. Folder dan berkas dosen tidak dipindah.</div></div>',
      foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-ok>Simpan</button>'
    });
    m.$('[data-ok]').onclick = async e => {
      const idProdi = m.$('#hb-pr').value, al = m.$('#hb-al').value.trim(), tgl = m.$('#hb-t').value;
      if (!idProdi) return UI.toast('Pilih prodi homebase', 'err');
      if (!tgl) return UI.toast('Tanggal berlaku wajib diisi', 'err');
      if (!al) return UI.toast('Alasan wajib diisi', 'err');
      const r = await UI.sibuk(e.target, () => API.call('setHomebase', { id_dosen: ids, id_prodi: idProdi, tgl_berlaku: tgl, alasan: al, no_sk: m.$('#hb-sk').value }));
      m.close();
      if (r.dilewati && r.dilewati.length) {
        UI.modal({ title: 'Sebagian dilewati', body: '<p style="margin-top:0">' + esc(r.message) + '</p><ul style="margin:0;padding-left:18px">' + r.dilewati.map(x => '<li><b>' + esc(x.nama) + '</b>: ' + esc(x.alasan) + '</li>').join('') + '</ul>' });
      } else UI.toast(r.message);
      App.invalidasi(); if (onDone) onDone();
    };
  };

  /** Tab "Homebase & Struktural" di detail dosen. */
  Pages.renderHomebaseDosen = function (el, d, onDone) {
    const admin = App.isAdmin();
    const today = App.hariIni();
    const rw = d.riwayat_homebase || [];
    const rs = d.riwayat_struktural || [];
    let h = '<div class="grid g-2" style="align-items:start"><div class="card"><div class="card-head"><div><h3>' + ic('building', 18) + 'Homebase</h3><div class="sub">Prodi induk dosen; diubah hanya oleh admin</div></div>' +
      (admin ? '<button class="btn btn-soft btn-sm" data-hb>' + ic('edit', 14) + (d.prodi ? 'Ubah homebase' : 'Tetapkan') + '</button>' : '') + '</div><div class="card-body">';
    h += rw.length ? '<div class="timeline">' + rw.map(r => {
      const nanti = r.tgl_mulai && r.tgl_mulai > today;
      const kini = !nanti && (!r.tgl_selesai || r.tgl_selesai >= today);
      return '<div class="tl-item ' + (kini ? 'kini' : nanti ? 'nanti' : '') + '"><span class="tl-dot"></span><div><div class="tl-t">' + esc(r.prodi) + ' ' +
        (kini ? '<span class="badge b-ready">Berlaku</span>' : nanti ? '<span class="badge b-short">Terjadwal</span>' : '') + '</div>' +
        '<div class="tl-s">' + periode(r.tgl_mulai, r.tgl_selesai) + (r.no_sk ? ' · SK ' + esc(r.no_sk) : '') + '</div>' +
        '<div class="tl-s">' + esc(r.alasan || '') + (r.diubah_oleh ? ' · oleh ' + esc(r.diubah_oleh) : '') + '</div>' +
        (admin && nanti ? '<button class="btn btn-ghost btn-xs" style="margin-top:4px" data-batal="' + esc(r.id_riwayat) + '">' + ic('x', 13) + 'Batalkan jadwal</button>' : '') + '</div></div>';
    }).join('') + '</div>' : '<div class="alert-box amber standalone" style="margin:0">' + ic('alert', 16) + '<div><b>Homebase belum ditetapkan</b>Dosen tidak masuk rekap per prodi dan tidak terlihat oleh Kaprodi mana pun.</div></div>';
    h += '</div></div>';
    h += '<div class="card"><div class="card-head"><div><h3>' + ic('award', 18) + 'Jabatan Struktural</h3><div class="sub">Kaprodi/Sekprodi aktif memberi peran akses otomatis</div></div>' +
      (admin ? '<button class="btn btn-soft btn-sm" data-js>' + ic('plus', 14) + 'Tambah</button>' : '') + '</div><div class="card-body">';
    h += rs.length ? rs.map(j => '<div class="litem"><div class="row"><div class="t">' + esc(j.label) + (j.prodi ? ' ' + esc(j.prodi) : '') + '</div>' +
      (j.berlaku ? '<span class="badge b-ready">Aktif</span>' : j.tgl_mulai > today ? '<span class="badge b-short">Akan datang</span>' : '<span class="badge b-gray">Selesai</span>') + '</div>' +
      '<div class="s">' + periode(j.tgl_mulai, j.tgl_selesai) + (j.no_sk ? ' · SK ' + esc(j.no_sk) : '') + '</div>' +
      (admin ? '<div style="display:flex;gap:6px;margin-top:4px"><button class="btn btn-ghost btn-xs" data-ejs="' + esc(j.id_jabatan) + '">' + ic('edit', 13) + 'Ubah / akhiri</button></div>' : '') + '</div>').join('')
      : '<div class="muted">Tidak ada jabatan struktural tercatat.</div>';
    h += '</div></div></div>';
    el.innerHTML = h;
    const bh = el.querySelector('[data-hb]');
    if (bh) bh.onclick = () => Pages.formHomebase([d.id_dosen], [{ id_dosen: d.id_dosen, nama: d.nama, prodi: d.prodi, id_prodi: d.id_prodi_homebase }], onDone);
    el.querySelectorAll('[data-batal]').forEach(b => b.onclick = () => batalJadwal(b, b.dataset.batal, onDone));
    const bj = el.querySelector('[data-js]');
    if (bj) bj.onclick = () => Pages.formStruktural({ id_dosen: d.id_dosen }, onDone);
    el.querySelectorAll('[data-ejs]').forEach(b => b.onclick = () => Pages.formStruktural(Object.assign({ id_dosen: d.id_dosen }, rs.find(j => j.id_jabatan === b.dataset.ejs)), onDone));
  };

  // ============================================================
  // JABATAN STRUKTURAL
  // ============================================================
  const STR = { filter: 'berlaku' };
  const ROMAWI = { WD1: 'I', WD2: 'II', WD3: 'III', WD4: 'IV' };
  function statusBadge(s) { return s.berlaku ? '<span class="badge b-ready">Aktif</span>' : s.akan_datang ? '<span class="badge b-short">Akan datang</span>' : '<span class="badge b-gray">Selesai</span>'; }
  function namaPejabat(s) { return s.id_dosen ? '<a href="#/dosen/' + esc(s.id_dosen) + '?tab=homebase"><b>' + esc(s.nama_dosen) + '</b></a>' : '<b>' + esc(s.nama_dosen) + '</b> <span class="badge b-gray" title="Tidak tertaut data dosen">luar data</span>'; }

  function tabStruktural() {
    const el = V().querySelector('#org-isi');
    const aktifProdi = ORG.prodi.filter(p => p.aktif);
    const pemegang = (id, jab) => ORG.struktural.filter(s => s.berlaku && String(s.id_prodi || '') === String(id || '') && s.jabatan === jab)[0];

    // 1) Pimpinan fakultas saat ini
    let h = '<div class="card mb"><div class="card-head"><div><h3>' + ic('building', 18) + 'Pimpinan Fakultas saat ini</h3><div class="sub">Dekan dan Wakil Dekan yang sedang menjabat</div></div></div>' +
      '<div class="card-body"><div class="pimpinan-grid">' + FAKULTAS.map(j => {
        const x = pemegang('', j);
        return '<div class="pimpinan ' + (x ? '' : 'kosong') + '"><div class="pj">' + LABEL_STR[j] + '</div>' +
          (x ? '<div class="pn">' + esc(x.nama_dosen) + '</div><div class="ps">' + periode(x.tgl_mulai, x.tgl_selesai) + '</div>'
            : '<div class="pn" style="color:var(--inc-tx)">Belum diisi</div><div class="ps"><a href="#" data-isi="' + j + '">Isi sekarang</a></div>') + '</div>';
      }).join('') + '</div></div></div>';

    // 2) Pimpinan prodi
    h += '<div class="dcards mb" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">' + aktifProdi.map(p => {
      const k = pemegang(p.id_prodi, 'KAPRODI'), s = pemegang(p.id_prodi, 'SEKPRODI');
      const baris = (lbl, x) => '<div class="syr"><span class="k"><span class="' + (x ? 'ok' : 'bad') + '">' + ic(x ? 'checkCircle' : 'alertCircle', 15) + '</span><span>' + lbl + '</span></span><span class="v" style="max-width:62%;overflow:hidden;text-overflow:ellipsis" title="' + esc(x ? x.nama_dosen : '') + '">' + (x ? esc(x.nama_dosen) : '<span style="color:var(--inc-tx)">Belum ada</span>') + '</span></div>';
      return '<div class="card card-pad"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><b style="color:var(--navy)">' + esc(p.label) + '</b><span class="badge b-blue">' + p.jumlah_dosen + ' dosen</span></div>' +
        '<div style="display:grid;gap:6px">' + baris('Kaprodi', k) + baris('Sekprodi', s) + '</div>' +
        (k && k.tgl_selesai ? '<div class="small muted" style="margin-top:8px">Periode Kaprodi s.d. ' + fmtTgl(k.tgl_selesai) + '</div>' : '') + '</div>';
    }).join('') + '</div>';

    // 3) Riwayat Dekan & Wakil Dekan per periode
    const fak = ORG.struktural.filter(s => s.fakultas).sort((a, b) => String(b.tgl_mulai).localeCompare(String(a.tgl_mulai)));
    h += '<div class="card mb"><div class="card-head"><div><h3>' + ic('history', 18) + 'Riwayat Dekan & Wakil Dekan</h3><div class="sub">Pejabat terdahulu boleh dicatat walau tidak ada di data dosen (pilih "Pejabat di luar data dosen").</div></div>' +
      '<button class="btn btn-soft btn-sm" data-tambah-fak>' + ic('plus', 14) + 'Tambah riwayat pimpinan</button></div>';
    if (fak.length) {
      const per = {};
      fak.forEach(s => { const k = String(s.tgl_mulai).slice(0, 4) + '–' + (s.tgl_selesai ? String(s.tgl_selesai).slice(0, 4) : 'sekarang'); (per[k] = per[k] || []).push(s); });
      h += '<div class="table-wrap" style="margin-top:8px"><table class="tbl tbl-cards"><thead><tr><th>Periode</th>' + FAKULTAS.map(j => '<th>' + LABEL_STR[j] + '</th>').join('') + '</tr></thead><tbody>' +
        Object.keys(per).map(k => '<tr><td class="nowrap"><b>' + k + '</b></td>' + FAKULTAS.map(j => {
          const x = per[k].filter(s => s.jabatan === j);
          return '<td data-l="' + LABEL_STR[j] + '" class="small">' + (x.length ? x.map(s => esc(s.nama_dosen) + (s.berlaku ? ' <span class="badge b-ready">Aktif</span>' : '')).join('<br>') : '<span class="muted">—</span>') + '</td>';
        }).join('') + '</tr>').join('') + '</tbody></table></div>';
    } else h += '<div class="card-body">' + UI.empty('history', 'Belum ada riwayat pimpinan fakultas', 'Catat Dekan dan Wakil Dekan beserta periodenya agar dapat dijawab siapa pimpinan pada tahun tertentu.') + '</div>';
    h += '</div>';

    // 4) Semua baris jabatan
    let l = ORG.struktural;
    if (STR.filter === 'berlaku') l = l.filter(s => s.berlaku || s.akan_datang);
    h += '<div class="toolbar"><div class="seg" id="st-f"><button class="' + (STR.filter === 'berlaku' ? 'on' : '') + '" data-v="berlaku">Aktif & akan datang</button><button class="' + (STR.filter === 'semua' ? 'on' : '') + '" data-v="semua">Semua riwayat</button></div>' +
      '<span class="muted small">Riwayat disimpan sehingga dapat dijawab siapa pejabat pada tahun tertentu.</span></div>';
    h += '<div class="card">' + (l.length ? '<div class="table-wrap"><table class="tbl tbl-cards"><thead><tr><th>Pejabat</th><th>Jabatan</th><th>Prodi</th><th>Periode</th><th>No. SK</th><th>Status</th><th></th></tr></thead><tbody>' +
      l.map(s => '<tr><td>' + namaPejabat(s) + '</td><td data-l="Jabatan">' + esc(s.label) + '</td><td data-l="Prodi">' + esc(s.prodi || (s.fakultas ? 'Fakultas' : '—')) + '</td>' +
        '<td data-l="Periode" class="nowrap">' + periode(s.tgl_mulai, s.tgl_selesai) + '</td><td data-l="No. SK" class="small">' + esc(s.no_sk || '—') + '</td>' +
        '<td data-l="Status">' + statusBadge(s) + '</td>' +
        '<td class="num nowrap"><button class="btn btn-ghost btn-xs" data-edit="' + esc(s.id_jabatan) + '">' + ic('edit', 14) + 'Ubah</button><button class="btn btn-ghost btn-xs" data-hapus="' + esc(s.id_jabatan) + '" title="Hapus">' + ic('trash', 14) + '</button></td></tr>').join('') +
      '</tbody></table></div>' : UI.empty('award', 'Belum ada jabatan struktural', 'Tambahkan Dekan, Wakil Dekan, Kaprodi, dan Sekprodi agar akses pantau dan email pengingat berjalan otomatis.')) + '</div>';
    el.innerHTML = h;
    V().querySelector('#org-aksi').innerHTML = '<button class="btn btn-primary" data-tambah>' + ic('plus', 16) + 'Tambah jabatan</button>';
    const selesai = async () => { await segarkan(); render('struktural'); };
    V().querySelector('[data-tambah]').onclick = () => Pages.formStruktural({}, selesai);
    el.querySelector('[data-tambah-fak]').onclick = () => Pages.formStruktural({ jabatan: 'DEKAN', luar: true, tgl_mulai: '' }, selesai);
    el.querySelectorAll('[data-isi]').forEach(a => a.onclick = e => { e.preventDefault(); Pages.formStruktural({ jabatan: a.dataset.isi }, selesai); });
    el.querySelectorAll('#st-f button').forEach(b => b.onclick = () => { STR.filter = b.dataset.v; tabStruktural(); });
    el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => Pages.formStruktural(ORG.struktural.find(s => s.id_jabatan === b.dataset.edit), selesai));
    el.querySelectorAll('[data-hapus]').forEach(b => b.onclick = async () => {
      if (!await UI.konfirmasi('Hapus jabatan struktural?', 'Gunakan hapus hanya untuk data yang salah input. Untuk jabatan yang berakhir, isi tanggal selesai agar riwayat tetap utuh.', { bahaya: true, ok: 'Hapus' })) return;
      const r = await UI.sibuk(b, () => API.call('hapusStruktural', { id_jabatan: b.dataset.hapus }));
      UI.toast(r.message); selesai();
    });
  }

  Pages.formStruktural = async function (rec, onDone) {
    const v = Object.assign({ jabatan: 'KAPRODI', tgl_mulai: App.hariIni() }, rec || {});
    const luar = !!(v.luar || (v.id_jabatan && !v.id_dosen && v.nama_pejabat));
    const dosen = (await App.muatDosen()).filter(d => d.aktif && !d.contoh).sort((a, b) => a.nama.localeCompare(b.nama));
    const grup = (lbl, keys) => '<optgroup label="' + lbl + '">' + keys.map(k => '<option value="' + k + '" ' + (v.jabatan === k ? 'selected' : '') + '>' + LABEL_STR[k] + '</option>').join('') + '</optgroup>';
    const m = UI.modal({
      title: v.id_jabatan ? 'Ubah jabatan struktural' : 'Tambah jabatan struktural',
      body: '<div class="form-grid"><div class="field"><label>Jabatan *</label><select class="input" id="js-j">' + grup('Pimpinan fakultas', FAKULTAS) + grup('Pimpinan prodi', ['KAPRODI', 'SEKPRODI']) + grup('Lainnya', ['LAINNYA']) + '</select></div>' +
        '<div class="field" id="js-nw"><label>Nama jabatan *</label><input class="input" id="js-n" value="' + esc(v.nama_jabatan || '') + '" placeholder="mis. Kepala Laboratorium Struktur"></div>' +
        '<div class="field" id="js-pw"><label>Prodi *</label><select class="input" id="js-p"><option value="">— pilih —</option>' + opsiProdi(v.id_prodi, !!v.id_jabatan) + '</select><span class="hint">Ruang lingkup pantau mengikuti prodi ini, bukan homebase pribadi.</span></div>' +
        '<div class="field full"><label class="check"><input type="checkbox" id="js-luar" ' + (luar ? 'checked' : '') + ' ' + (v.id_jabatan && v.id_dosen ? 'disabled' : '') + '>Pejabat di luar data dosen (mis. pejabat terdahulu yang sudah pensiun)</label></div>' +
        '<div class="field full" id="js-dw"><label>Dosen *</label><select class="input" id="js-d" ' + (v.id_jabatan && v.id_dosen ? 'disabled' : '') + '><option value="">— pilih dosen —</option>' +
        dosen.map(d => '<option value="' + esc(d.id_dosen) + '" ' + (v.id_dosen === d.id_dosen ? 'selected' : '') + '>' + esc(d.nama) + ' · ' + esc(d.prodi || 'tanpa homebase') + '</option>').join('') + '</select></div>' +
        '<div class="field full" id="js-lw"><label>Nama pejabat *</label><input class="input" id="js-np" value="' + esc(v.nama_pejabat || '') + '" placeholder="Nama lengkap dan gelar"><span class="hint">Pejabat di luar data dosen tidak mendapat akses aplikasi; hanya tercatat di riwayat.</span></div>' +
        '<div class="field"><label>Tanggal mulai *</label><input class="input" type="date" id="js-m" value="' + esc(v.tgl_mulai || '') + '"></div>' +
        '<div class="field"><label>Tanggal selesai</label><input class="input" type="date" id="js-s" value="' + esc(v.tgl_selesai || '') + '"><span class="hint">Kosong = masih menjabat.</span></div>' +
        '<div class="field full"><label>No. SK</label><input class="input" id="js-sk" value="' + esc(v.no_sk || '') + '"></div></div>',
      foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-ok>Simpan</button>'
    });
    const sync = () => {
      const j = m.$('#js-j').value, l = m.$('#js-luar').checked;
      m.$('#js-nw').classList.toggle('hide', j !== 'LAINNYA');
      m.$('#js-pw').classList.toggle('hide', j !== 'KAPRODI' && j !== 'SEKPRODI');
      m.$('#js-dw').classList.toggle('hide', l);
      m.$('#js-lw').classList.toggle('hide', !l);
    };
    m.$('#js-j').onchange = sync; m.$('#js-luar').onchange = sync; sync();
    m.$('[data-ok]').onclick = async e => {
      const l = m.$('#js-luar').checked, j = m.$('#js-j').value;
      const r = await UI.sibuk(e.target, () => API.call('saveStruktural', { jabatan: {
        id_jabatan: v.id_jabatan || '', id_dosen: l ? '' : (m.$('#js-d').value || v.id_dosen || ''), nama_pejabat: l ? m.$('#js-np').value : '', jabatan: j, nama_jabatan: m.$('#js-n').value,
        id_prodi: (j === 'KAPRODI' || j === 'SEKPRODI') ? m.$('#js-p').value : '', tgl_mulai: m.$('#js-m').value, tgl_selesai: m.$('#js-s').value, no_sk: m.$('#js-sk').value } }));
      m.close(); UI.toast(r.message); App.invalidasi(); if (onDone) onDone();
    };
  };

  // ============================================================
  // OVERRIDE PERAN
  // ============================================================
  function tabOverride() {
    const el = V().querySelector('#org-isi');
    const l = ORG.override.slice().sort((a, b) => (b.berlaku - a.berlaku) || String(a.tgl_berakhir).localeCompare(String(b.tgl_berakhir)));
    let h = '<div class="alert-box blue standalone">' + ic('shield', 16) + '<div><b>Kapan memakai override?</b>Misalnya Kaprodi cuti dan tugasnya dirangkap dosen lain (Beri Kaprodi), atau akses perlu dicabut sementara (Cabut). Untuk Dekan/Wakil Dekan definitif, catat di Jabatan Struktural, bukan di sini. Peran Admin tidak dapat diberikan lewat override. Sistem mengingatkan admin 14 hari sebelum override berakhir.</div></div>';
    h += '<div class="card">' + (l.length ? '<div class="table-wrap"><table class="tbl tbl-cards"><thead><tr><th>Pengguna</th><th>Override</th><th>Periode</th><th>Sisa</th><th>Alasan</th><th></th></tr></thead><tbody>' +
      l.map(o => '<tr><td><div class="pn"><b>' + esc(o.nama) + '</b></div><div class="small muted">' + esc(o.email) + '</div></td>' +
        '<td data-l="Override"><span class="badge ' + (o.aksi === 'BERI' ? 'b-ready' : 'b-inc') + '">' + (o.aksi === 'BERI' ? 'Beri' : 'Cabut') + '</span> <b>' + esc(App.roleLabel(o.peran)) + '</b>' + (o.prodi ? ' · ' + esc(o.prodi) : '') + '</td>' +
        '<td data-l="Periode" class="nowrap">' + fmtTgl(o.tgl_mulai) + ' – ' + fmtTgl(o.tgl_berakhir) + '</td>' +
        '<td data-l="Sisa">' + (o.sisa_hari === null ? '—' : o.sisa_hari < 0 ? '<span class="badge b-gray">Berakhir</span>' : !o.berlaku ? '<span class="badge b-blue">Belum mulai</span>' : '<span class="badge ' + (o.sisa_hari <= 14 ? 'b-inc' : 'b-ready') + '">' + o.sisa_hari + ' hari</span>') + '</td>' +
        '<td data-l="Alasan" class="small">' + esc(o.alasan) + '<div class="muted">oleh ' + esc(o.dibuat_oleh) + '</div></td>' +
        '<td class="num">' + (o.sisa_hari === null || o.sisa_hari >= 0 ? '<button class="btn btn-ghost btn-xs" data-akhiri="' + esc(o.id_override) + '">' + ic('x', 14) + 'Akhiri</button>' : '') + '</td></tr>').join('') +
      '</tbody></table></div>' : UI.empty('shield', 'Belum ada override', 'Peran Kaprodi/Sekprodi diambil otomatis dari jabatan struktural aktif.')) + '</div>';
    el.innerHTML = h;
    V().querySelector('#org-aksi').innerHTML = '<button class="btn btn-primary" data-tambah>' + ic('plus', 16) + 'Tambah override</button>';
    V().querySelector('[data-tambah]').onclick = formOverride;
    el.querySelectorAll('[data-akhiri]').forEach(b => b.onclick = async () => {
      if (!await UI.konfirmasi('Akhiri override?', 'Peran kembali mengikuti peran dasar dan jabatan struktural mulai sekarang.', { ok: 'Akhiri' })) return;
      const r = await UI.sibuk(b, () => API.call('akhiriOverride', { id_override: b.dataset.akhiri }));
      UI.toast(r.message); await muat(true); render('override');
    });
  }

  function formOverride() {
    const m = UI.modal({
      title: 'Tambah override peran',
      body: '<div class="form-grid"><div class="field full"><label>Akun *</label><select class="input" id="ov-e"><option value="">— pilih akun —</option>' +
        ORG.akun.slice().sort((a, b) => String(a.nama).localeCompare(String(b.nama))).map(a => '<option value="' + esc(a.email) + '">' + esc(a.nama) + ' · ' + esc(a.email) + '</option>').join('') + '</select></div>' +
        '<div class="field"><label>Aksi *</label><select class="input" id="ov-a"><option value="BERI">Beri peran</option><option value="CABUT">Cabut peran</option></select></div>' +
        '<div class="field"><label>Peran *</label><select class="input" id="ov-p">' + ['KAPRODI', 'SEKPRODI', 'DEKAN', 'WAKIL_DEKAN'].map(p => '<option value="' + p + '">' + App.roleLabel(p) + '</option>').join('') + '</select></div>' +
        '<div class="field full" id="ov-prw"><label>Prodi</label><select class="input" id="ov-pr"><option value="">— semua prodi (khusus Cabut) —</option>' + opsiProdi('') + '</select></div>' +
        '<div class="field"><label>Mulai *</label><input class="input" type="date" id="ov-m" value="' + esc(App.hariIni()) + '"></div>' +
        '<div class="field"><label>Berakhir *</label><input class="input" type="date" id="ov-b"><span class="hint">Wajib, agar override tidak terlupa dicabut.</span></div>' +
        '<div class="field full"><label>Alasan *</label><textarea class="input" id="ov-al" rows="2"></textarea></div></div>',
      foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn btn-primary" data-ok>Simpan</button>'
    });
    const sync = () => { const p = m.$('#ov-p').value; m.$('#ov-prw').classList.toggle('hide', p !== 'KAPRODI' && p !== 'SEKPRODI'); };
    m.$('#ov-p').onchange = sync; sync();
    m.$('[data-ok]').onclick = async e => {
      const r = await UI.sibuk(e.target, () => API.call('saveOverride', { override: { email: m.$('#ov-e').value, aksi: m.$('#ov-a').value, peran: m.$('#ov-p').value, id_prodi: m.$('#ov-pr').value, tgl_mulai: m.$('#ov-m').value, tgl_berakhir: m.$('#ov-b').value, alasan: m.$('#ov-al').value } }));
      m.close(); UI.toast(r.message); await muat(true); render('override');
    };
  }
})();
