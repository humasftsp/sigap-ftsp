/**
 * SIGAP FTSP — ui.js
 * Utilitas tampilan: ikon, format tanggal, badge status, toast, modal, motif FTSP.
 */
(function () {
  const C = window.SIGAP_CONFIG || {};

  // ---------- ikon (garis 2px, gaya Lucide) ----------
  const P = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
    folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    hourglass: '<path d="M5 22h14"/><path d="M5 2h14"/><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"/><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
    printer: '<path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
    sliders: '<path d="M21 4h-7"/><path d="M10 4H3"/><path d="M21 12h-9"/><path d="M8 12H3"/><path d="M21 20h-5"/><path d="M12 20H3"/><path d="M14 2v4"/><path d="M8 10v4"/><path d="M16 18v4"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
    shieldCheck: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/><path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/><path d="m2 2 20 20"/>',
    key: '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    unlock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    alertCircle: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    chevR: '<path d="m9 18 6-6-6-6"/>', chevL: '<path d="m15 18-6-6 6-6"/>', chevD: '<path d="m6 9 6 6 6-6"/>',
    menu: '<path d="M4 12h16"/><path d="M4 6h16"/><path d="M4 18h16"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6"/><path d="M22 11h-6"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    fileX: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m14.5 12.5-5 5"/><path d="m9.5 12.5 5 5"/>',
    sheet: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h2"/><path d="M14 13h2"/><path d="M8 17h2"/><path d="M14 17h2"/>',
    edit: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    arrowR: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    trend: '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
    bars: '<path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6" rx="1"/><rect x="12" y="8" width="3" height="10" rx="1"/><rect x="17" y="5" width="3" height="13" rx="1"/>',
    scale: '<path d="M12 3v18"/><path d="M5 21h14"/><path d="M3 7h18"/><path d="m6 7-3 7a3 3 0 0 0 6 0Z"/><path d="m18 7-3 7a3 3 0 0 0 6 0Z"/>',
    cap: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
    list: '<path d="M3 12h.01"/><path d="M3 18h.01"/><path d="M3 6h.01"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M8 6h13"/>',
    copy: '<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>'
  };
  function ic(name, size, extra) {
    size = size || 18;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || '') + '>' + (P[name] || '') + '</svg>';
  }

  // ---------- teks & tanggal ----------
  function esc(s) {
    return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  function isoValid(s) { return /^\d{4}-\d{2}-\d{2}/.test(String(s || '')); }
  function fmtTgl(iso, panjang) {
    if (!isoValid(iso)) return iso ? esc(iso) : '—';
    const p = String(iso).slice(0, 10).split('-');
    return parseInt(p[2], 10) + ' ' + (panjang ? BULAN : BLN)[parseInt(p[1], 10) - 1] + ' ' + p[0];
  }
  function fmtWaktu(s) {
    if (!s) return '—';
    const t = String(s);
    if (t.length < 16) return fmtTgl(t);
    return fmtTgl(t.slice(0, 10)) + ', ' + t.slice(11, 16).replace(':', '.');
  }
  function tambahBulan(iso, n) {
    const p = iso.split('-').map(Number);
    let y = p[0], m = p[1] - 1 + n;
    y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    const dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(Math.min(p[2], dim)).padStart(2, '0');
  }
  function hariKe(a, b) {
    const pa = a.split('-').map(Number), pb = b.split('-').map(Number);
    return Math.round((Date.UTC(pb[0], pb[1] - 1, pb[2]) - Date.UTC(pa[0], pa[1] - 1, pa[2])) / 86400000);
  }
  function relatifBulan(n) {
    if (n === null || n === undefined || isNaN(n)) return '';
    if (n < 0) return Math.abs(n) + ' bln lalu';
    if (n === 0) return 'bulan ini';
    return n + ' bln lagi';
  }
  /** Sama dengan backend: tahap pengingat yang berlaku hari ini. */
  function tahapPengingat(today, elig) {
    if (!elig || elig <= today) return null;
    if (today >= tambahBulan(elig, -1)) return 'H-1';
    if (today >= tambahBulan(elig, -3)) return 'H-3';
    if (today >= tambahBulan(elig, -6)) return 'H-6';
    return null;
  }
  function semesterAktif(iso) {
    const y = +iso.slice(0, 4), m = +iso.slice(5, 7);
    if (m >= 8) return 'Ganjil ' + y + '/' + (y + 1);
    if (m === 1) return 'Ganjil ' + (y - 1) + '/' + y;
    return 'Genap ' + (y - 1) + '/' + y;
  }
  const GELAR = /^(prof|dr|ir|ar|h|hj|drs|dra|st|mt|ms|msc|m|sc|phd|ph|d|eng|ing|iai|ipm|ipu|s|t|arch|ars|sp|mm|mba|se|sh|asean|apec)\.?$/i;
  function inisial(nama) {
    const kata = String(nama || '').split(',')[0].split(/\s+/).map(w => w.replace(/[^A-Za-z]/g, '')).filter(w => w && !GELAR.test(w));
    if (!kata.length) return '?';
    return (kata[0][0] + (kata.length > 1 ? kata[kata.length - 1][0] : '')).toUpperCase();
  }
  function angka(n) { return (n || 0).toLocaleString('id-ID'); }
  function ukuran(b) { b = +b || 0; return b > 1048576 ? (b / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1024)) + ' KB'; }

  // ---------- status ----------
  const STATUS = {
    SIAP: { label: 'Siap Diusulkan', short: 'Siap Usul', cls: 'ready', b: 'b-ready', desc: 'TMT +24 bulan & seluruh syarat terpenuhi', icon: 'checkCircle' },
    PENDEK: { label: 'Rencana Pendek', short: 'Pendek ≤12 bln', cls: 'short', b: 'b-short', desc: 'Eligible ≤12 bulan atau sedang diusulkan', icon: 'clock' },
    PANJANG: { label: 'Rencana Panjang', short: 'Panjang >12 bln', cls: 'long', b: 'b-long', desc: 'Eligible >12 bulan atau syarat belum ada estimasi', icon: 'cap' },
    BELUM_LENGKAP: { label: 'Data Belum Lengkap', short: 'Data Kurang', cls: 'inc', b: 'b-inc', desc: 'TMT/jabatan kosong atau tidak valid', icon: 'alert' },
    GB: { label: 'Guru Besar', short: 'Guru Besar', cls: 'gb', b: 'b-gb', desc: 'Dikecualikan dari pemantauan', icon: 'award' },
    NONAKTIF: { label: 'Nonaktif', short: 'Nonaktif', cls: '', b: 'b-gray', desc: '', icon: 'x' }
  };
  function badge(status, teks) {
    const m = STATUS[status] || { label: status, b: 'b-gray' };
    const lead = status === 'BELUM_LENGKAP' ? ic('alert', 12) : '<span class="dot"></span>';
    return '<span class="badge ' + m.b + '">' + lead + esc(teks || m.label) + '</span>';
  }
  const JAB = { TP: 'Tenaga Pengajar', ASA: 'Asisten Ahli', L: 'Lektor', LK: 'Lektor Kepala', GB: 'Guru Besar' };
  function jab(k) { return JAB[k] || k || '—'; }
  function jenjang(st, singkat) {
    if (!st || !st.jabatan) return '<span class="muted">' + esc(st && st.jabatan_label || '—') + '</span>';
    const a = singkat ? st.jabatan : st.jabatan_label;
    if (!st.target) return '<span class="jenjang">' + esc(a) + '</span>';
    return '<span class="jenjang">' + esc(a) + ' ' + ic('arrowR', 14) + ' <span class="to">' + esc(singkat ? st.target : st.target_label) + '</span></span>';
  }
  function meterKel(kel, opt) {
    opt = opt || {};
    if (!kel || !kel.total) return '<span class="muted small">Belum ada jenis berkas</span>';
    const cls = kel.persen >= 100 ? 'ready' : kel.persen >= 50 ? 'short' : 'inc';
    const warna = { ready: 'var(--ready-tx)', short: 'var(--short-tx)', inc: 'var(--inc-tx)' }[cls];
    return (opt.head === false ? '' : '<div class="meter-head"><span class="muted">' + esc(opt.label || 'Kelengkapan berkas') + '</span><b style="color:' + warna + '">' + kel.persen + '% (' + kel.ada + '/' + kel.total + ')</b></div>') +
      '<div class="meter ' + cls + (opt.thin ? ' thin' : '') + '"><i style="width:' + kel.persen + '%"></i></div>';
  }
  function avatar(d, size) {
    const cls = d && d.status ? (STATUS[d.status.status] || {}).cls || '' : '';
    return '<div class="avatar ' + (size || '') + ' ' + cls + '">' + esc(inisial(d && d.nama)) + '</div>';
  }
  /** NIDN/NUPTK untuk tampilan; ID internal (DSN-…) tidak ditampilkan ke pengguna. */
  function identitas(d) { return d.nidn ? 'NIDN ' + d.nidn : d.nuptk ? 'NUPTK ' + d.nuptk : 'NIDN belum diisi'; }
  function person(d, sub) {
    return '<div class="person">' + avatar(d, 'sm') + '<div><div class="pn">' + esc(d.nama) + '</div><div class="ps">' + (sub !== undefined ? sub : esc(identitas(d) + ' · ' + (d.prodi || '—'))) + '</div></div></div>';
  }

  // ---------- motif lensa & gelombang FTSP ----------
  let motifSeq = 0;
  /** Motif FTSP dari aset resmi: gelombang (login) atau lensa (hero/header). */
  function motif(opacity, jenis) {
    return '<div class="motif motif-' + (jenis || 'lensa') + '" aria-hidden="true"></div>';
  }
  function motifSvgLama(opacity) {
    const id = 'lens' + (++motifSeq);
    const o = opacity || 0.08;
    return '<div class="motif" aria-hidden="true"><svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><pattern id="' + id + '" width="64" height="64" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">' +
      '<path d="M32 4 A30 30 0 0 1 32 60 A30 30 0 0 1 32 4Z" fill="none" stroke="rgba(255,255,255,' + o + ')" stroke-width="1.2"/>' +
      '<path d="M4 32 A30 30 0 0 1 60 32 A30 30 0 0 1 4 32Z" fill="none" stroke="rgba(255,255,255,' + (o * 0.7) + ')" stroke-width="1"/></pattern>' +
      '<linearGradient id="' + id + 'g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>' +
      '<mask id="' + id + 'm"><rect width="800" height="500" fill="url(#' + id + 'g)"/></mask></defs>' +
      '<rect width="800" height="500" fill="url(#' + id + ')" mask="url(#' + id + 'm)"/>' +
      '<g fill="none" stroke="rgba(156,195,255,' + (o * 2.2) + ')" stroke-width="1.5">' +
      '<path d="M-20 420 C 140 360, 260 470, 420 410 S 700 330, 840 380"/>' +
      '<path d="M-20 450 C 160 390, 280 500, 440 440 S 720 360, 840 410" stroke-opacity=".6"/>' +
      '<path d="M-20 480 C 180 420, 300 530, 460 470 S 740 390, 840 440" stroke-opacity=".35"/></g></svg></div>';
  }
  function logo(varian) {
    const src = varian === 'navy' ? C.LOGO_NAVY : C.LOGO_PUTIH;
    if (src) return '<img class="logo-full" src="' + esc(src) + '" alt="Universitas Trisakti — Fakultas Teknik Sipil dan Perencanaan">';
    return '<div class="mono">S</div>';
  }
  function lambang(varian) {
    const src = varian === 'navy' ? C.LAMBANG_NAVY : C.LAMBANG_PUTIH;
    if (src) return '<img class="lambang" src="' + esc(src) + '" alt="Lambang Universitas Trisakti">';
    return '<div class="mono">S</div>';
  }

  // ---------- toast ----------
  function toast(msg, type) {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'toast ' + (type || 'ok');
    el.innerHTML = ic(type === 'err' ? 'alertCircle' : type === 'warn' ? 'alert' : 'checkCircle', 18) + '<div>' + esc(msg) + '</div>';
    root.appendChild(el);
    setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, type === 'err' ? 6000 : 3500);
  }

  // ---------- modal ----------
  function modal(o) {
    const root = document.getElementById('modal-root');
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = '<div class="modal ' + (o.size || '') + '" role="dialog" aria-modal="true">' +
      '<div class="modal-head"><div><h3>' + esc(o.title || '') + '</h3>' + (o.sub ? '<div class="sub">' + o.sub + '</div>' : '') + '</div>' +
      '<button class="btn btn-ghost btn-sm btn-icon" data-close aria-label="Tutup">' + ic('x', 18) + '</button></div>' +
      '<div class="modal-body">' + (o.body || '') + '</div>' +
      (o.foot !== false ? '<div class="modal-foot">' + (o.foot || '<button class="btn btn-outline" data-close>Tutup</button>') + '</div>' : '') + '</div>';
    root.appendChild(bg);
    document.body.style.overflow = 'hidden';
    const tutup = () => { if (o.onClose) o.onClose(); bg.remove(); if (!root.children.length) document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); };
    const onKey = e => { if (e.key === 'Escape' && !o.locked) tutup(); };
    document.addEventListener('keydown', onKey);
    bg.addEventListener('click', e => {
      if (e.target === bg && !o.locked) tutup();
      if (e.target.closest('[data-close]')) tutup();
    });
    const first = bg.querySelector('input:not([type=hidden]),select,textarea');
    if (first && o.autofocus !== false) setTimeout(() => first.focus(), 50);
    return { el: bg, close: tutup, $: s => bg.querySelector(s), $$: s => bg.querySelectorAll(s) };
  }
  function konfirmasi(judul, pesan, opsi) {
    opsi = opsi || {};
    return new Promise(res => {
      let jawab = false;
      const m = modal({
        title: judul, size: 'sm', body: '<p style="margin:0">' + pesan + '</p>',
        foot: '<button class="btn btn-outline" data-close>Batal</button><button class="btn ' + (opsi.bahaya ? 'btn-danger-solid' : 'btn-primary') + '" data-ok>' + esc(opsi.ok || 'Ya, lanjutkan') + '</button>',
        onClose: () => res(jawab)
      });
      m.$('[data-ok]').onclick = () => { jawab = true; m.close(); };
    });
  }

  /** Jalankan promise sambil menandai tombol sibuk; tampilkan galat via toast. */
  async function sibuk(btn, fn) {
    if (btn) { btn.classList.add('busy'); btn.disabled = true; }
    try { return await fn(); }
    catch (e) { if (e.code !== 'AUTH') toast(e.message, 'err'); throw e; }
    finally { if (btn) { btn.classList.remove('busy'); btn.disabled = false; } }
  }

  // ---------- berkas ----------
  function base64KeBlob(b64, mime) {
    const bin = atob(b64); const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime || 'application/octet-stream' });
  }
  function unduhBlob(blob, nama) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = nama; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  function fileKeBase64(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result).split(',')[1] || '');
      r.onerror = () => rej(new Error('Gagal membaca berkas.'));
      r.readAsDataURL(file);
    });
  }
  function salin(teks) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(teks).then(() => toast('Disalin ke clipboard'));
    const t = document.createElement('textarea'); t.value = teks; document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); toast('Disalin ke clipboard'); } catch (e) { } t.remove();
    return Promise.resolve();
  }

  function debounce(fn, ms) { let t; return function () { const a = arguments; clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms || 250); }; }
  function simpanLokal(k, v) { try { localStorage.setItem('sigap_' + k, JSON.stringify(v)); } catch (e) { } }
  function bacaLokal(k, d) { try { const v = localStorage.getItem('sigap_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } }

  function empty(icon, judul, teks, aksi) {
    return '<div class="empty"><div class="e-ico">' + ic(icon || 'info', 26) + '</div><b>' + esc(judul) + '</b><div>' + (teks || '') + '</div>' + (aksi ? '<div style="margin-top:14px">' + aksi + '</div>' : '') + '</div>';
  }
  function skeleton(n) {
    let h = '<div class="grid g-4 mb">';
    for (let i = 0; i < 4; i++) h += '<div class="card card-pad"><div class="skel" style="height:14px;width:50%"></div><div class="skel" style="height:34px;width:40%;margin-top:14px"></div><div class="skel" style="height:12px;width:80%;margin-top:12px"></div></div>';
    h += '</div><div class="card card-pad">';
    for (let i = 0; i < (n || 6); i++) h += '<div class="skel" style="height:42px;margin-bottom:10px"></div>';
    return h + '</div>';
  }
  function pager(total, hal, per, onAttr) {
    const nHal = Math.max(1, Math.ceil(total / per));
    if (total <= per) return '<div class="pager"><span class="muted small">Menampilkan ' + total + ' data</span></div>';
    const a = (hal - 1) * per + 1, b = Math.min(total, hal * per);
    let btn = '<button ' + onAttr + '="' + (hal - 1) + '" ' + (hal <= 1 ? 'disabled' : '') + ' aria-label="Sebelumnya">‹</button>';
    const hals = [];
    for (let i = 1; i <= nHal; i++) if (i === 1 || i === nHal || Math.abs(i - hal) <= 1) hals.push(i);
    let prev = 0;
    hals.forEach(i => { if (i - prev > 1) btn += '<button disabled>…</button>'; btn += '<button ' + onAttr + '="' + i + '" class="' + (i === hal ? 'on' : '') + '">' + i + '</button>'; prev = i; });
    btn += '<button ' + onAttr + '="' + (hal + 1) + '" ' + (hal >= nHal ? 'disabled' : '') + ' aria-label="Berikutnya">›</button>';
    return '<div class="pager"><span class="muted small">Menampilkan ' + a + '–' + b + ' dari ' + total + '</span><div class="pg">' + btn + '</div></div>';
  }

  // ---------- tema terang/gelap (disimpan per perangkat; bawaan mengikuti sistem) ----------
  function temaAktif() { return document.documentElement.getAttribute('data-theme') || 'light'; }
  function terapkanTema(t) {
    document.documentElement.setAttribute('data-theme', t);
    const m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', t === 'dark' ? '#081A38' : '#113264');
  }
  function gantiTema() { const t = temaAktif() === 'dark' ? 'light' : 'dark'; terapkanTema(t); simpanLokal('tema', t); return t; }
  (function () {
    let t = bacaLokal('tema', null);
    if (!t) { try { t = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; } catch (e) { t = 'light'; } }
    terapkanTema(t);
  })();

  // ---------- tombol mata pada setiap kolom password ----------
  function pasangMata(root) {
    (root || document).querySelectorAll('input[type=password]:not([data-mata])').forEach(i => {
      i.setAttribute('data-mata', '1');
      let wrap = i.parentElement;
      if (!wrap.classList.contains('pw-wrap')) {
        wrap = document.createElement('div'); wrap.className = 'pw-wrap';
        i.parentNode.insertBefore(wrap, i); wrap.appendChild(i);
      }
      if (wrap.querySelector('[data-toggle-pw]')) return;
      const b = document.createElement('button');
      b.type = 'button'; b.setAttribute('data-toggle-pw', ''); b.setAttribute('aria-label', 'Tampilkan password'); b.title = 'Tampilkan/sembunyikan password';
      b.innerHTML = ic('eye', 18);
      b.onclick = () => { const show = i.type === 'password'; i.type = show ? 'text' : 'password'; b.innerHTML = ic(show ? 'eyeOff' : 'eye', 18); b.setAttribute('aria-label', show ? 'Sembunyikan password' : 'Tampilkan password'); };
      wrap.appendChild(b);
    });
  }
  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver(() => pasangMata()).observe(document.documentElement, { childList: true, subtree: true });
  }

  /** Muat SheetJS sekali (dipakai impor & unduh Excel). */
  function muatXLSX() {
    if (window.XLSX) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      s.onload = () => res(); s.onerror = () => rej(new Error('Gagal memuat pengolah Excel. Periksa koneksi internet.'));
      document.head.appendChild(s);
    });
  }
  /** Unduh array-of-arrays sebagai .xlsx (baris pertama = judul kolom). */
  /** Unduh Excel. Satu sheet: (namaFile, namaSheet, aoa, lebar). Banyak sheet: (namaFile, [{nama, aoa, lebar, filter}]). */
  async function unduhXLSX(namaFile, namaSheet, aoa, lebar) {
    await muatXLSX();
    const wb = XLSX.utils.book_new();
    const daftar = Array.isArray(namaSheet) ? namaSheet : [{ nama: namaSheet, aoa, lebar }];
    daftar.forEach(sh => {
      const ws = XLSX.utils.aoa_to_sheet(sh.aoa);
      const lebarKolom = Math.max(...sh.aoa.map(r => r.length));
      ws['!cols'] = (sh.lebar || Array.from({ length: lebarKolom }, (_, i) => Math.max(10, Math.min(45, String((sh.aoa[0] || [])[i] || '').length + 4)))).map(w => ({ wch: w }));
      if (sh.filter !== false && sh.aoa.length > 1) ws['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: sh.aoa.length - 1, c: sh.aoa[0].length - 1 } }) };
      XLSX.utils.book_append_sheet(wb, ws, String(sh.nama).slice(0, 31));
    });
    XLSX.writeFile(wb, namaFile);
  }

  window.UI = {
    temaAktif, gantiTema, pasangMata, muatXLSX, unduhXLSX,
    ic, esc, fmtTgl, fmtWaktu, tambahBulan, hariKe, relatifBulan, tahapPengingat, semesterAktif, inisial, angka, ukuran,
    STATUS, badge, JAB, jab, jenjang, meterKel, avatar, identitas, person, motif, logo, lambang, toast, modal, konfirmasi, sibuk,
    base64KeBlob, unduhBlob, fileKeBase64, salin, debounce, simpanLokal, bacaLokal, empty, skeleton, pager
  };
})();
