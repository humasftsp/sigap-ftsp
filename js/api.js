/**
 * SIGAP FTSP — api.js
 * Semua komunikasi ke backend GAS lewat POST + text/plain (tanpa CORS preflight).
 * Token sesi disimpan di sessionStorage: hilang saat tab/browser ditutup.
 */
(function () {
  const KEY = 'sigap_sesi';

  function bacaSesi() {
    try { return JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { return null; }
  }
  function tulisSesi(s) {
    try { s ? sessionStorage.setItem(KEY, JSON.stringify(s)) : sessionStorage.removeItem(KEY); } catch (e) { }
  }

  const API = {
    sesi: bacaSesi(),
    onAuthError: null,      // diisi app.js
    onWajibGanti: null,

    terkonfigurasi() {
      const u = (window.SIGAP_CONFIG || {}).GAS_URL || '';
      if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//.test(u)) return true; // uji lokal
      return /^https:\/\/script\.google(usercontent)?\.com\/.+\/exec/.test(u) && u.indexOf('GANTI_DENGAN') < 0;
    },

    simpanSesi(token, user) { this.sesi = { token, user }; tulisSesi(this.sesi); },
    perbaruiUser(user) { if (this.sesi) { this.sesi.user = user; tulisSesi(this.sesi); } },
    hapusSesi() { this.sesi = null; tulisSesi(null); },

    /**
     * Panggil aksi backend. Melempar Error berisi pesan dari server bila gagal.
     * @param {string} action
     * @param {object} data
     */
    async call(action, data) {
      if (!this.terkonfigurasi()) {
        const e = new Error('GAS_URL belum diisi di js/config.js.'); e.code = 'CONFIG'; throw e;
      }
      let res;
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = ctrl ? setTimeout(() => ctrl.abort(), 90000) : null;
      try {
        res = await fetch(window.SIGAP_CONFIG.GAS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action, token: this.sesi ? this.sesi.token : '', data: data || {} }),
          redirect: 'follow',
          signal: ctrl ? ctrl.signal : undefined
        });
      } catch (err) {
        const e = new Error(err && err.name === 'AbortError'
          ? 'Server tidak merespons dalam 90 detik. Coba lagi.'
          : 'Tidak dapat terhubung ke server SIGAP. Periksa koneksi internet, atau pastikan Web App sudah di-deploy dengan akses "Anyone".');
        e.code = 'NETWORK'; throw e;
      } finally { if (timer) clearTimeout(timer); }

      let json;
      const teks = await res.text();
      try { json = JSON.parse(teks); }
      catch (err) {
        const e = new Error(/<html/i.test(teks)
          ? 'Server mengembalikan halaman HTML, bukan JSON. Biasanya karena akses Web App bukan "Anyone" atau URL bukan /exec.'
          : 'Respons server tidak valid.');
        e.code = 'PARSE'; throw e;
      }
      if (!json.success) {
        const e = new Error(json.message || 'Terjadi kesalahan.'); e.code = json.code || 'ERROR';
        if (e.code === 'AUTH' && action !== 'login') { this.hapusSesi(); if (this.onAuthError) this.onAuthError(e.message); }
        if (e.code === 'GANTI_PASSWORD' && this.onWajibGanti) this.onWajibGanti();
        if (e.code === 'PRIVASI' && this.onPrivasi) this.onPrivasi();
        throw e;
      }
      return json;
    }
  };

  window.API = API;
})();
