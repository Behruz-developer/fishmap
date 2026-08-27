// ═══════════════════════════════════════
// FishMap — Konfiguratsiya
// ═══════════════════════════════════════
// ⚠️  Bu faylni .gitignore ga qo'shmang — keylar uchun
//     .env ishlatish tavsiya etiladi (Vercel/Netlify uchun)

const CONFIG = {
  // ── Supabase ──────────────────────────
  // https://app.supabase.com → Settings → API
  SUPABASE_URL:      'https://hbwhwcfyhjylcyobtlbd.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_DiqCLLoNhB54ODK7BEsxhA_bXeGPRMA',

  // ── Yandex Maps ───────────────────────
  // https://developer.tech.yandex.ru/services/ → JavaScript API va HTTP Geocoder
  YANDEX_API_KEY: '9c463b20-156b-4dbf-a40a-782f2b3e4c20',

  // ── Default map center (Toshkent) ─────
  DEFAULT_CENTER: [41.2995, 69.2401],
  DEFAULT_ZOOM:   9,
};