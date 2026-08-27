// ═══════════════════════════════════════
// FishMap — Yordamchi funksiyalar
// ═══════════════════════════════════════

const Utils = (() => {

  // ── XSS himoyasi ──────────────────────
  // Foydalanuvchi kiritgan matnni innerHTML ichiga qo'yishdan
  // OLDIN doim shu funksiyadan o'tkazing.
  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // HTML atributi ichida ishlatish uchun (qo'shtirnoq bilan o'ralgan)
  function escapeAttr(value) {
    return escapeHtml(value);
  }

  // ── Ikki nuqta orasidagi masofa (km) — Haversine ──
  function distanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const toRad = d => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function formatDistance(km) {
    if (km === null || km === undefined || Number.isNaN(km)) return null;
    if (km < 1) return `${Math.round(km * 1000)} m`;
    if (km < 10) return `${km.toFixed(1)} km`;
    return `${Math.round(km)} km`;
  }

  // ── Onlayn/oflayn holat ───────────────
  function isOnline() {
    return navigator.onLine !== false;
  }

  return { escapeHtml, escapeAttr, distanceKm, formatDistance, isOnline };
})();
