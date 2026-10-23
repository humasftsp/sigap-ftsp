/**
 * SIGAP FTSP — app.js
 * Inisialisasi, login, kerangka aplikasi (sidebar/topbar/bottom-nav), router hash.
 */
(function () {
  const { ic, esc } = UI;
  const C = window.SIGAP_CONFIG || {};

  const ROLE_LABEL = { ADMIN: 'Admin Fakultas', DOSEN: 'Dosen', PIMPINAN: 'Pimpinan Fakultas', KAPRODI: 'Kaprodi', SEKPRODI: 'Sekprodi', DEKAN: 'Dekan', WAKIL_DEKAN: 'Wakil Dekan', LAINNYA: 'Jabatan lain',
    WD1: 'Wakil Dekan I', WD2: 'Wakil Dekan II', WD3: 'Wakil Dekan III', WD4: 'Wakil Dekan IV' };
  const PIMPINAN = ['ADMIN', 'PIMPINAN', 'DEKAN', 'WAKIL_DEKAN', 'KAPRODI', 'SEKPRODI'];
  /** Versi backend minimum yang dibutuhkan frontend ini. Bila backend lebih lama, admin diberi peringatan. */
  const VERSI_FRONTEND = '1.3.3'; // dipakai internal untuk mendeteksi backend yang belum diperbarui; tidak ditampilkan
  function versiLebihLama(a, b) {
    const x = String(a || '0').split('.').map(Number), y = String(b).split('.').map(Number);
    for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) < (y[i] || 0); }
    return false;
  }

  const App = {
    boot: null,
    dosen: null,
    dosenAt: 0,
    get user() { return API.sesi && API.sesi.user; },
    get role() { return this.user ? this.user.role : ''; },
    /** Peran efektif: peran dasar + Dekan/Wakil Dekan/Kaprodi/Sekprodi dari jabatan struktural + override. */
    get peran() { return this.user ? (this.user.peran || [this.user.role]) : []; },
    punya(p) { return this.peran.indexOf(p) >= 0; },
    punyaSalah(list) { return this.peran.some(p => list.indexOf(p) >= 0); },
    isAdmin() { return this.punya('ADMIN'); },
    lihatSemua() { return this.punyaSalah(['ADMIN', 'PIMPINAN', 'DEKAN', 'WAKIL_DEKAN']); },
    prodiPimpinan() { return ((this.user && this.user.prodi_pimpinan) || []).map(p => p.label); },
    pimpinan() { return this.lihatSemua() || this.prodiPimpinan().length > 0; },
    dosenSaja() { return !this.pimpinan(); },
    /** Dosen yang menjadi lingkup pemantauan peran ini (Kaprodi: homebase prodinya, tanpa dirinya sendiri bila beda prodi). */
    dalamLingkup(d) {
      if (d.contoh) return d.id_dosen === (App.user && App.user.id_dosen); // data contoh tidak dihitung
      if (App.lihatSemua()) return true;
      const ids = ((App.user && App.user.prodi_pimpinan) || []).map(p => p.id_prodi);
      return ids.length ? ids.indexOf(d.id_prodi_homebase) >= 0 : d.id_dosen === (App.user && App.user.id_dosen);
    },
    roleLabel(r) { return ROLE_LABEL[r || this.role] || r; },
    /** Label peran untuk sidebar, mis. "Kaprodi S1 Teknik Sipil · Dosen". */
    labelPeran() {
      const u = this.user || {};
      const jab = (u.jabatan_struktural || []).filter(j => j.jabatan !== 'LAINNYA').map(j => j.label);
      const lain = this.peran.filter(p => ['DEKAN', 'WAKIL_DEKAN', 'KAPRODI', 'SEKPRODI'].indexOf(p) < 0 || !jab.length).map(p => {
        if (p === 'KAPRODI' || p === 'SEKPRODI') return ROLE_LABEL[p] + ' ' + (u.prodi_pimpinan || []).filter(x => x.peran.indexOf(p) >= 0).map(x => x.label).join(', ');
        return ROLE_LABEL[p] || p;
      });
      return jab.concat(lain).filter((x, i, a) => a.indexOf(x) === i).join(' · ') + (u.akun_contoh ? ' (akun contoh)' : '');
    },
    hariIni() { return (this.boot && this.boot.hari_ini) || new Date().toISOString().slice(0, 10); },

    /** Ambil daftar dosen (cache 2 menit di memori). */
    async muatDosen(paksa) {
      if (!paksa && this.dosen && Date.now() - this.dosenAt < 120000) return this.dosen;
      const r = await API.call('listDosen', { termasukNonaktif: this.isAdmin() });
      this.dosen = r.dosen;
      this.dosenAt = Date.now();
      if (r.hari_ini && this.boot) this.boot.hari_ini = r.hari_ini;
      this.perbaruiBadgeNav();
      return this.dosen;
    },
    dosenAktif() { return (this.dosen || []).filter(d => d.aktif && (!d.contoh || d.id_dosen === (this.user && this.user.id_dosen))); },
    invalidasi() { this.dosenAt = 0; },

    async muatBoot() {
      const r = await API.call('bootstrap');
      this.boot = r;
      API.perbaruiUser(r.user);
      return r;
    },

    view: null,
    go(hash) { if (location.hash === hash) this.route(); else location.hash = hash; }
  };
  window.App = App;

  // ============================================================
  // NAVIGASI
  // ============================================================
  /**
   * Menu sidebar dikelompokkan menjadi submenu yang dapat dibuka-tutup.
   * Item tunggal (tanpa grup) tampil langsung; grup otomatis terbuka bila berisi halaman aktif.
   */
  function navItems() {
    const u = App.user || {};
    const admin = App.isAdmin();
    const pimp = App.pimpinan();
    const punyaData = !!u.id_dosen;
    const grup = [
      { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
      punyaData && !pimp ? { id: 'dosen/' + u.id_dosen, match: 'dosen-saya', label: 'Profil Saya', icon: 'user' } : null,
      !pimp ? { id: 'berkas', label: 'Berkas Saya', icon: 'folder' } : null,
      !pimp ? { id: 'templat', label: 'Template & Contoh', icon: 'file' } : null,
      pimp ? { grup: 'dosen', label: 'Dosen & Jabamik', icon: 'users', items: [
        { id: 'dosen', label: 'Katalog Dosen', icon: 'users' },
        { id: 'jabamik', label: 'Kelayakan Jabamik', icon: 'award', count: 'pendek' },
        { id: 'berkas', label: 'Kelengkapan Berkas', icon: 'folder' },
        { id: 'pensiun', label: 'Peringatan Pensiun', icon: 'hourglass' }
      ] } : null,
      pimp && punyaData ? { grup: 'saya', label: 'Data Saya', icon: 'user', items: [
        { id: 'dosen/' + u.id_dosen, match: 'dosen-saya', label: 'Profil Saya', icon: 'user' }
      ] } : null,
      admin ? { grup: 'organisasi', label: 'Organisasi', icon: 'building', items: [
        { id: 'organisasi/prodi', match: 'organisasi/prodi', label: 'Program Studi', icon: 'building' },
        { id: 'organisasi/homebase', match: 'organisasi/homebase', label: 'Homebase Dosen', icon: 'users', count: 'homebase' },
        { id: 'organisasi/struktural', match: 'organisasi/struktural', label: 'Jabatan Struktural', icon: 'award' },
        { id: 'organisasi/override', match: 'organisasi/override', label: 'Override Peran', icon: 'shield' }
      ] } : null,
      { grup: 'laporan', label: 'Laporan & Template', icon: 'printer', items: [
        { id: 'cetak', label: 'Cetak & Rekap', icon: 'printer' }
      ].concat(pimp ? [{ id: 'usia', label: 'Rekap Usia Dosen', icon: 'bars' }, { id: 'templat', label: 'Template & Contoh', icon: 'file' }] : []) },
      admin ? { grup: 'admin', label: 'Administrasi', icon: 'sliders', items: [
        { id: 'impor', label: 'Tambah / Impor', icon: 'upload' },
        { id: 'akun', label: 'Pengguna & Akun', icon: 'key' },
        { id: 'aturan', label: 'Aturan Kenaikan', icon: 'scale' },
        { id: 'pengaturan', label: 'Pengaturan', icon: 'sliders' },
        { id: 'log', label: 'Log & Audit', icon: 'history' }
      ] } : null
    ];
    return grup.filter(Boolean);
  }

  function itemNav(i, sub) {
    return '<a class="nav-item' + (sub ? ' sub' : '') + '" href="#/' + i.id + '" data-nav="' + (i.match || i.id) + '">' + ic(i.icon, sub ? 17 : 19) + '<span>' + esc(i.label) + '</span>' +
      (i.count ? '<span class="count hide" data-count="' + i.count + '"></span>' : '') + '</a>';
  }

  function renderShell() {
    const u = App.user;
    const today = App.hariIni();
    let nav = '';
    navItems().forEach(i => {
      if (!i.grup) { nav += itemNav(i); return; }
      // Grup berisi satu item → tampil langsung tanpa submenu
      if (i.items.length === 1) { nav += itemNav(Object.assign({}, i.items[0], { label: i.items[0].label })); return; }
      nav += '<div class="nav-group" data-grup="' + i.grup + '">' +
        '<button class="nav-group-head" type="button" aria-expanded="false">' + ic(i.icon, 19) + '<span>' + esc(i.label) + '</span>' +
        '<span class="count hide" data-count-grup="' + i.grup + '"></span>' + ic('chevD', 16, ' class="chev"') + '</button>' +
        '<div class="nav-sub">' + i.items.map(x => itemNav(x, true)).join('') + '</div></div>';
    });

    const dosenSaja = App.dosenSaja();
    const bn = dosenSaja
      ? [['dashboard', 'grid', 'Beranda'], ['dosen/' + u.id_dosen, 'user', 'Profil', 'dosen-saya'], ['berkas', 'folder', 'Berkas'], ['cetak', 'printer', 'Cetak'], ['profil', 'key', 'Akun']]
      : [['dashboard', 'grid', 'Dashboard'], ['dosen', 'users', 'Dosen'], ['jabamik', 'award', 'Jabamik'], ['berkas', 'folder', 'Berkas'], ['__menu', 'menu', 'Menu']];

    document.getElementById('app').innerHTML =
      '<div class="app" id="shell">' +
      '<aside class="sidebar" aria-label="Navigasi">' +
      '<div class="sb-brand">' + UI.motif(0.07, 'gelombang') + '<a href="#/dashboard" class="brandmark" style="color:#fff;text-decoration:none;position:relative">' + UI.lambang('putih') +
      '<div><div class="t1">SIGAP FTSP</div><div class="t2">Universitas Trisakti</div></div></a></div>' +
      '<nav>' + nav + '</nav>' +
      '<div class="sb-user"><a href="#/profil" style="display:flex;gap:10px;align-items:center;min-width:0;flex:1;text-decoration:none">' + '<div class="avatar sm">' + esc(UI.inisial(u.nama)) + '</div>' +
      '<div class="who"><div class="nm">' + esc(u.nama) + '</div><div class="rl" title="' + esc(App.labelPeran()) + '">' + esc(App.labelPeran()) + '</div></div></a>' +
      '<button class="btn btn-ghost btn-sm btn-icon" data-logout title="Keluar" aria-label="Keluar">' + ic('logout', 18) + '</button></div>' +
      '</aside>' +
      '<div class="drawer-backdrop" data-drawer-close></div>' +
      '<div class="main">' +
      '<header class="topbar">' +
      '<button class="btn btn-ghost btn-icon menu-btn" data-drawer aria-label="Buka menu">' + ic('menu', 22) + '</button>' +
      '<a href="#/dashboard" class="brandmark tb-brand" style="color:var(--navy);text-decoration:none">' + UI.lambang('navy') + '<div><div class="t1">SIGAP FTSP</div><div class="t2" style="color:var(--blue)">UNIVERSITAS TRISAKTI</div></div></a>' +
      (!dosenSaja ? '<div class="input-icon hide-sm" style="width:min(380px,32vw)">' + ic('search', 17) + '<input class="input" id="global-q" placeholder="Cari nama dosen, NIDN, atau NUPTK…" style="height:38px;background:var(--surface-2)"></div>' : '') +
      '<div class="spacer"></div>' +
      '<button class="btn btn-ghost btn-icon" data-tema title="Mode gelap/terang" aria-label="Ganti mode gelap/terang">' + ic(UI.temaAktif() === 'dark' ? 'sun' : 'moon', 18) + '</button>' +
      '<button class="btn btn-ghost btn-icon" data-refresh title="Muat ulang data" aria-label="Muat ulang data">' + ic('refresh', 18) + '</button>' +
      '<a class="avatar sm" href="#/profil" title="Profil" style="text-decoration:none;background:var(--navy-bg);color:#fff;border-color:var(--navy-bg)">' + esc(UI.inisial(u.nama)) + '</a>' +
      '</header>' +
      (App.isAdmin() && App.boot && versiLebihLama(App.boot.app && App.boot.app.versi, VERSI_FRONTEND) ? '<div class="banner-contoh" style="background:var(--inc-bg);color:var(--inc-tx);border-color:var(--inc-bd)">' + ic('alert', 15) +
        '<span><b>Backend belum diperbarui.</b> Tampilan sudah memakai pembaruan terbaru, tetapi kode backend (Apps Script) yang aktif masih yang lama, sehingga beberapa fitur akan gagal. Tempel file .gs terbaru lalu Deploy → Manage deployments → Edit → <b>New version</b>.</span></div>' : '') +
      (u.akun_contoh ? '<div class="banner-contoh">' + ic('info', 15) + '<span><b>Akun contoh.</b> Data di akun ini fiktif dan tidak dihitung di dashboard, laporan, maupun email.</span></div>' : '') +
      '<main class="content" id="view" tabindex="-1"></main>' +
      '<footer class="footer"><span>Universitas Trisakti — Fakultas Teknik Sipil dan Perencanaan · <a href="#" data-privasi>Pemberitahuan privasi</a></span><span>Data per ' + UI.fmtTgl(today, true) + '</span></footer>' +
      '</div>' +
      '<nav class="bottom-nav" aria-label="Navigasi bawah">' +
      bn.map(b => '<a href="' + (b[0] === '__menu' ? '#' : '#/' + b[0]) + '" ' + (b[0] === '__menu' ? 'data-drawer' : 'data-nav="' + (b[3] || b[0]) + '"') + '>' + ic(b[1], 22) + '<span>' + b[2] + '</span></a>').join('') +
      '</nav></div>';

    App.view = document.getElementById('view');
    const shell = document.getElementById('shell');
    shell.addEventListener('click', e => {
      const gh = e.target.closest('.nav-group-head');
      if (gh) { bukaGrup(gh.parentElement, !gh.parentElement.classList.contains('open')); return; }
      if (e.target.closest('[data-drawer]')) { e.preventDefault(); shell.classList.toggle('drawer-open'); }
      else if (e.target.closest('[data-drawer-close]') || e.target.closest('.sidebar .nav-item')) shell.classList.remove('drawer-open');
      if (e.target.closest('[data-logout]')) { e.preventDefault(); logout(); }
      if (e.target.closest('[data-privasi]')) { e.preventDefault(); tampilPrivasi(); }
      const tb = e.target.closest('[data-tema]');
      if (tb) { const t = UI.gantiTema(); tb.innerHTML = ic(t === 'dark' ? 'sun' : 'moon', 18); }
      if (e.target.closest('[data-refresh]')) {
        e.preventDefault();
        const b = e.target.closest('[data-refresh]');
        UI.sibuk(b, async () => { await App.muatBoot(); await App.muatDosen(true); App.route(); UI.toast('Data diperbarui'); }).catch(() => { });
      }
    });
    const gq = document.getElementById('global-q');
    // Kata kunci langsung dibawa ke Katalog Dosen lalu kotak pencarian dikosongkan kembali
    if (gq) gq.addEventListener('keydown', e => { if (e.key === 'Enter') { const v = gq.value.trim(); gq.value = ''; gq.blur(); App.go('#/dosen?q=' + encodeURIComponent(v)); } });
  }

  App.perbaruiBadgeNav = function () {
    if (!App.dosen) return;
    const set = (sel, n, warn) => { const el = document.querySelector(sel); if (el) { el.textContent = n; el.classList.toggle('hide', !n); el.classList.toggle('warn', !!warn); } };
    const lingkup = App.dosenAktif().filter(App.dalamLingkup);
    const pendek = lingkup.filter(d => d.status.status === 'PENDEK').length;
    const tanpaHb = App.isAdmin() ? App.dosenAktif().filter(d => !d.id_prodi_homebase).length : 0;
    set('[data-count="pendek"]', pendek);
    set('[data-count="homebase"]', tanpaHb, true);
    // angka pada kepala grup ditampilkan saat grup tertutup
    set('[data-count-grup="dosen"]', pendek);
    set('[data-count-grup="organisasi"]', tanpaHb, true);
  };

  /** Akordeon: hanya satu submenu terbuka; membuka satu grup menutup grup lain. */
  function bukaGrup(g, buka) {
    document.querySelectorAll('.sidebar .nav-group').forEach(x => {
      const on = x === g && buka;
      x.classList.toggle('open', on);
      x.querySelector('.nav-group-head').setAttribute('aria-expanded', on ? 'true' : 'false');
    });
  }

  function tandaiNav(r) {
    const u = App.user || {};
    const saya = r.name === 'dosen' && r.param && r.param === u.id_dosen;
    const kunci = saya ? 'dosen-saya' : r.name === 'organisasi' ? 'organisasi/' + (r.param || 'prodi') : r.name;
    document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('active', a.getAttribute('data-nav') === kunci));
    const aktif = document.querySelector('.sidebar .nav-item.active');
    bukaGrup(aktif && aktif.closest('.nav-group'), true);
    document.querySelectorAll('.sidebar .nav-group').forEach(x => x.classList.toggle('has-active', !!x.querySelector('.nav-item.active')));
  }

  // ============================================================
  // ROUTER
  // ============================================================
  function parseHash() {
    const h = (location.hash || '#/dashboard').replace(/^#\/?/, '');
    const [path, qs] = h.split('?');
    const parts = path.split('/').filter(Boolean);
    const q = {};
    (qs || '').split('&').forEach(kv => { if (!kv) return; const [k, v] = kv.split('='); q[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
    return { name: parts[0] || 'dashboard', param: parts[1] ? decodeURIComponent(parts[1]) : '', q };
  }

  const AKSES = {
    dashboard: null, dosen: null, berkas: null, cetak: null, profil: null, templat: null,
    jabamik: PIMPINAN, pensiun: PIMPINAN, usia: PIMPINAN, aturan: PIMPINAN, impor: ['ADMIN'], akun: ['ADMIN'], pengaturan: ['ADMIN'], log: ['ADMIN'], organisasi: ['ADMIN']
  };

  App.route = async function () {
    if (!App.user || !App.view) return;
    const r = parseHash();
    if (App.dosenSaja() && r.name === 'dosen' && !r.param) { App.go('#/dosen/' + App.user.id_dosen); return; }
    const akses = AKSES[r.name];
    const fn = window.Pages && window.Pages[r.name];
    tandaiNav(r);
    window.scrollTo(0, 0);
    if (!fn || (akses && !App.punyaSalah(akses))) {
      App.view.innerHTML = UI.empty('alertCircle', 'Halaman tidak tersedia', 'Halaman ini tidak ada atau tidak dapat diakses oleh peran Anda.', '<a class="btn btn-primary" href="#/dashboard">Kembali ke Dashboard</a>');
      return;
    }
    const token = (App._routeToken = (App._routeToken || 0) + 1);
    App.isCurrent = () => token === App._routeToken;
    try {
      await fn(r.param, r.q);
    } catch (e) {
      if (e.code === 'AUTH' || e.code === 'GANTI_PASSWORD' || e.code === 'PRIVASI') return;
      if (token !== App._routeToken) return;
      console.error(e);
      App.view.innerHTML = UI.empty('alertCircle', 'Gagal memuat halaman', esc(e.message), '<button class="btn btn-primary" onclick="App.route()">' + ic('refresh', 16) + ' Coba lagi</button>');
    }
  };

  // ============================================================
  // LOGIN
  // ============================================================
  function renderLogin(pesan) {
    document.getElementById('app').innerHTML =
      '<div class="login-wrap">' + UI.motif(0.09, 'gelombang') +
      '<section class="login-brand"><div>' +
      '<div class="login-logo">' + UI.logo('putih') + '</div>' +
      '<div class="login-produk"><span>SIGAP</span>Sistem Informasi Pengelolaan dan Pengembangan</div>' +
      '<h1>Data terintegrasi,<br><span>SDM berkembang.</span></h1>' +
      '<p>Sistem Informasi Pengelolaan dan Pengembangan — pemantauan kenaikan jabatan akademik, berkas kepegawaian, dan pengingat dosen Fakultas Teknik Sipil dan Perencanaan.</p>' +
      '<div class="login-points">' +
      '<div>' + ic('checkCircle', 18) + 'Status kelayakan jabamik dihitung otomatis dari TMT dan syarat</div>' +
      '<div>' + ic('mail', 18) + 'Pengingat email H-6, H-3, dan H-1 bulan</div>' +
      '<div>' + ic('lock', 18) + 'Berkas pribadi hanya dapat dibuka admin dan dosen bersangkutan</div>' +
      '</div></div>' +
      '<div class="login-foot">Fakultas Teknik Sipil dan Perencanaan · Universitas Trisakti</div></section>' +
      '<section class="login-panel"><form class="login-card" id="f-login" novalidate>' +
      '<h2>Masuk ke SIGAP</h2><div class="sub">Gunakan email dan password yang diberikan admin fakultas.</div>' +
      (pesan ? '<div class="login-err">' + ic('alertCircle', 16) + '<span>' + esc(pesan) + '</span></div>' : '<div id="login-err"></div>') +
      '<div class="field"><label for="l-email">Email</label><div class="input-icon">' + ic('mail', 17) + '<input class="input" id="l-email" type="email" autocomplete="username" placeholder="nama@trisakti.ac.id" required></div></div>' +
      '<div class="field"><label for="l-pw">Password</label><div class="pw-wrap"><input class="input" id="l-pw" type="password" autocomplete="current-password" placeholder="••••••••" required>' +
      '<button type="button" data-toggle-pw aria-label="Tampilkan password">' + ic('eye', 18) + '</button></div></div>' +
      '<button class="btn btn-primary" type="submit" id="btn-login">Masuk</button>' +
      '<div class="help">Lupa password atau akun terkunci? Hubungi admin SIGAP untuk reset.</div>' +
      '</form></section></div>';

    const f = document.getElementById('f-login');
    f.querySelector('[data-toggle-pw]').onclick = e => {
      const i = document.getElementById('l-pw'); const show = i.type === 'password'; i.type = show ? 'text' : 'password';
      e.currentTarget.innerHTML = ic(show ? 'eyeOff' : 'eye', 18);
    };
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('l-email').value.trim();
      const pw = document.getElementById('l-pw').value;
      const box = f.querySelector('#login-err') || f.querySelector('.login-err');
      const tampil = m => { box.outerHTML = '<div class="login-err" id="login-err">' + ic('alertCircle', 16) + '<span>' + esc(m) + '</span></div>'; };
      if (!email || !pw) { tampil('Email dan password wajib diisi.'); return; }
      const btn = document.getElementById('btn-login');
      btn.classList.add('busy'); btn.disabled = true;
      try {
        const r = await API.call('login', { email, password: pw });
        API.simpanSesi(r.token, r.user);
        await masuk();
      } catch (err) {
        btn.classList.remove('busy'); btn.disabled = false;
        const bx = f.querySelector('#login-err') || f.querySelector('.login-err');
        if (bx) bx.outerHTML = '<div class="login-err" id="login-err">' + ic('alertCircle', 16) + '<span>' + esc(err.message) + '</span></div>';
      }
    });
    setTimeout(() => { const el = document.getElementById('l-email'); if (el) el.focus(); }, 50);
  }

  function renderBelumKonfigurasi() {
    document.getElementById('app').innerHTML =
      '<div class="login-wrap">' + UI.motif(0.09, 'gelombang') + '<section class="login-panel" style="grid-column:1/-1"><div class="login-card" style="max-width:560px">' +
      '<h2>Satu langkah lagi</h2><div class="sub">Frontend SIGAP belum terhubung ke backend Google Apps Script.</div>' +
      '<ol style="padding-left:18px;line-height:1.7;margin:0">' +
      '<li>Buka editor Apps Script → <b>Deploy → New deployment → Web app</b>.</li>' +
      '<li>Execute as: <b>Me</b> · Who has access: <b>Anyone</b> → Deploy.</li>' +
      '<li>Salin URL yang berakhiran <code>/exec</code>.</li>' +
      '<li>Tempel ke <code>GAS_URL</code> di file <code>js/config.js</code>, lalu upload ulang (git add, commit, push).</li></ol>' +
      '</div></section></div>';
  }

  function renderWajibGanti() {
    const u = App.user;
    document.getElementById('app').innerHTML =
      '<div class="login-wrap">' + UI.motif(0.09, 'gelombang') + '<section class="login-panel" style="grid-column:1/-1"><form class="login-card" id="f-ganti" novalidate>' +
      '<h2>Ganti password sementara</h2><div class="sub">Halo, ' + esc(u.nama) + '. Demi keamanan, buat password baru sebelum melanjutkan.</div>' +
      '<div id="g-err"></div>' +
      '<div class="field"><label>Password sementara (dari admin)</label><input class="input" type="password" id="g-lama" autocomplete="current-password" required></div>' +
      '<div class="field"><label>Password baru</label><input class="input" type="password" id="g-baru" autocomplete="new-password" required><span class="hint">Minimal 8 karakter, mengandung huruf dan angka. Jangan pakai password email/akun lain.</span></div>' +
      '<div class="field"><label>Ulangi password baru</label><input class="input" type="password" id="g-baru2" autocomplete="new-password" required></div>' +
      '<button class="btn btn-primary" type="submit">Simpan & lanjutkan</button>' +
      '<div class="help"><a href="#" data-logout>Keluar</a></div></form></section></div>';
    const f = document.getElementById('f-ganti');
    f.querySelector('[data-logout]').onclick = e => { e.preventDefault(); logout(); };
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const lama = f.querySelector('#g-lama').value, baru = f.querySelector('#g-baru').value, baru2 = f.querySelector('#g-baru2').value;
      const err = m => { f.querySelector('#g-err').innerHTML = '<div class="login-err">' + ic('alertCircle', 16) + '<span>' + esc(m) + '</span></div>'; };
      if (baru !== baru2) return err('Konfirmasi password baru tidak sama.');
      if (baru.length < 8 || !/[A-Za-z]/.test(baru) || !/\d/.test(baru)) return err('Password minimal 8 karakter dan mengandung huruf serta angka.');
      const btn = f.querySelector('button[type=submit]');
      btn.classList.add('busy'); btn.disabled = true;
      try {
        const r = await API.call('gantiPassword', { lama, baru });
        API.perbaruiUser(r.user);
        UI.toast('Password berhasil diganti');
        await masuk();
      } catch (x) { err(x.message); btn.classList.remove('busy'); btn.disabled = false; }
    });
  }

  /** Pemberitahuan privasi wajib disetujui pada login pertama (dan setiap versi baru). */
  function renderPrivasi() {
    const teks = (App.boot && App.boot.teks_privasi) || [];
    document.getElementById('app').innerHTML =
      '<div class="login-wrap">' + UI.motif(0.09, 'gelombang') + '<section class="login-panel" style="grid-column:1/-1"><form class="login-card" id="f-privasi" style="max-width:620px" novalidate>' +
      '<h2>Pemberitahuan Privasi</h2><div class="sub">Mohon baca sebelum menggunakan SIGAP FTSP.</div>' +
      '<div class="privasi-teks">' + teks.map(t => '<p>' + esc(t) + '</p>').join('') + '</div>' +
      '<label class="check" style="margin:14px 0 18px;align-items:flex-start"><input type="checkbox" id="pv-ok" style="margin-top:2px"><span>Saya telah membaca dan menyetujui pemrosesan data sesuai pemberitahuan ini.</span></label>' +
      '<button class="btn btn-primary" type="submit" disabled>Setuju & lanjutkan</button>' +
      '<div class="help"><a href="#" data-logout>Keluar</a></div></form></section></div>';
    const f = document.getElementById('f-privasi');
    const btn = f.querySelector('button[type=submit]');
    f.querySelector('#pv-ok').onchange = e => { btn.disabled = !e.target.checked; };
    f.querySelector('[data-logout]').onclick = e => { e.preventDefault(); logout(); };
    f.addEventListener('submit', async e => {
      e.preventDefault();
      btn.classList.add('busy'); btn.disabled = true;
      try {
        const r = await API.call('setujuiPrivasi');
        API.perbaruiUser(r.user);
        await masuk();
      } catch (x) { UI.toast(x.message, 'err'); btn.classList.remove('busy'); btn.disabled = false; }
    });
  }

  function tampilPrivasi() {
    const teks = (App.boot && App.boot.teks_privasi) || [];
    UI.modal({ title: 'Pemberitahuan Privasi', body: '<div class="privasi-teks" style="max-height:none">' + teks.map(t => '<p>' + esc(t) + '</p>').join('') + '</div>' });
  }

  async function masuk() {
    if (App.user && App.user.wajib_ganti_password) { renderWajibGanti(); return; }
    document.getElementById('app').innerHTML = '<div class="boot"><img class="boot-logo" src="img/lambang-putih.png" alt=""><div class="boot-text">Menyiapkan data…</div></div>';
    try {
      await App.muatBoot();
    } catch (e) {
      if (e.code === 'AUTH') return;
      if (e.code === 'GANTI_PASSWORD') { renderWajibGanti(); return; }
      renderLogin(e.message); return;
    }
    if (App.user.wajib_ganti_password) { renderWajibGanti(); return; }
    if (App.user.perlu_privasi) { renderPrivasi(); return; }
    renderShell();
    if (!location.hash || location.hash === '#' || location.hash === '#/') location.hash = '#/dashboard';
    App.route();
  }

  async function logout() {
    try { await API.call('logout'); } catch (e) { }
    API.hapusSesi();
    App.dosen = null; App.boot = null;
    location.hash = '';
    renderLogin();
  }
  App.logout = logout;

  API.onAuthError = msg => { App.dosen = null; renderLogin(msg || 'Sesi berakhir. Silakan masuk kembali.'); };
  API.onWajibGanti = () => { if (App.user) { App.user.wajib_ganti_password = true; renderWajibGanti(); } };
  API.onPrivasi = () => { if (App.user) { App.user.perlu_privasi = true; masuk(); } };

  window.addEventListener('hashchange', () => { if (App.user && App.view && document.getElementById('shell')) App.route(); });

  document.addEventListener('DOMContentLoaded', () => {
    if (!API.terkonfigurasi()) { renderBelumKonfigurasi(); return; }
    if (API.sesi && API.sesi.token) masuk(); else renderLogin();
  });
})();
