-- ═══════════════════════════════════════════════════════════
-- FishMap — Supabase xavfsizlik sozlamalari (RLS)
-- Supabase Dashboard → SQL Editor → shu faylni to'liq ishga tushiring
-- ═══════════════════════════════════════════════════════════
--
-- NEGA MUHIM:
-- anon key brauzerda ochiq turadi — bu normal. Lekin RLS yoqilmagan
-- bo'lsa, o'sha kalit bilan istalgan odam BARCHA qatorlarni o'qishi,
-- o'zgartirishi va o'chirishi mumkin. RLS — yagona himoya qatlami.
-- ═══════════════════════════════════════════════════════════


-- ─────────────────────────────────────────
-- 1. FISHING_SPOTS jadvali
-- ─────────────────────────────────────────

ALTER TABLE public.fishing_spots ENABLE ROW LEVEL SECURITY;

-- Eski policylarni tozalash (qayta ishga tushirish uchun xavfsiz)
DROP POLICY IF EXISTS "spots_select_all"     ON public.fishing_spots;
DROP POLICY IF EXISTS "spots_insert_own"     ON public.fishing_spots;
DROP POLICY IF EXISTS "spots_update_own"     ON public.fishing_spots;
DROP POLICY IF EXISTS "spots_delete_own"     ON public.fishing_spots;
DROP POLICY IF EXISTS "spots_insert_admin"   ON public.fishing_spots;
DROP POLICY IF EXISTS "spots_update_admin"   ON public.fishing_spots;
DROP POLICY IF EXISTS "spots_delete_admin"   ON public.fishing_spots;

-- O'QISH: hamma ko'ra oladi (kirmagan mehmonlar ham)
CREATE POLICY "spots_select_all"
  ON public.fishing_spots
  FOR SELECT
  USING (true);

-- QO'SHISH: ENDI FAQAT ADMIN uchun
-- ⚠️ ESKI FUNKSIYA (hamma kirgan user qo'sha olardi) — qayta yoqish uchun shu policy'ni
--   WITH CHECK (auth.uid() = user_id);  bilan almashtiring va admin politsiyasini o'chiring:
-- CREATE POLICY "spots_insert_own"
--   ON public.fishing_spots
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (auth.uid() = user_id);
CREATE POLICY "spots_insert_admin"
  ON public.fishing_spots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid())
    AND auth.uid() = user_id
  );

-- TAHRIRLASH: ENDI FAQAT ADMIN (har qanday joyni tahrirlashi mumkin)
-- ⚠️ ESKI: USING (auth.uid() = user_id) — faqat o'zi qo'shgan joyni tahrirlashi mumkin edi
CREATE POLICY "spots_update_admin"
  ON public.fishing_spots
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid())
  );

-- O'CHIRISH: ENDI FAQAT ADMIN (har qanday joyni o'chirishi mumkin)
-- ⚠️ ESKI: USING (auth.uid() = user_id)
CREATE POLICY "spots_delete_admin"
  ON public.fishing_spots
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid())
  );


-- ─────────────────────────────────────────
-- 2. PROFILES jadvali
-- ─────────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"  ON public.profiles;

-- O'QISH: hamma ko'radi (joy muallifi ismini ko'rsatish uchun kerak)
CREATE POLICY "profiles_select_all"
  ON public.profiles
  FOR SELECT
  USING (true);

-- QO'SHISH: faqat o'z profilini
CREATE POLICY "profiles_insert_own"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- TAHRIRLASH: faqat o'z profilini
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ─────────────────────────────────────────
-- 3. Ma'lumot butunligi (server tomonda tekshiruv)
--    Brauzerdagi tekshiruvni chetlab o'tish oson — DB darajasida
--    ham chegara qo'yish kerak.
-- ─────────────────────────────────────────

ALTER TABLE public.fishing_spots
  DROP CONSTRAINT IF EXISTS chk_name_len,
  DROP CONSTRAINT IF EXISTS chk_desc_len,
  DROP CONSTRAINT IF EXISTS chk_lat_range,
  DROP CONSTRAINT IF EXISTS chk_lng_range,
  DROP CONSTRAINT IF EXISTS chk_rating_range;

ALTER TABLE public.fishing_spots
  ADD CONSTRAINT chk_name_len     CHECK (char_length(name) BETWEEN 1 AND 80),
  ADD CONSTRAINT chk_desc_len     CHECK (description IS NULL OR char_length(description) <= 500),
  ADD CONSTRAINT chk_lat_range    CHECK (lat BETWEEN -90  AND 90),
  ADD CONSTRAINT chk_lng_range    CHECK (lng BETWEEN -180 AND 180),
  ADD CONSTRAINT chk_rating_range CHECK (rating IS NULL OR rating BETWEEN 0 AND 5);

-- user_id majburiy bo'lsin (RLS ishlashi uchun shart)
ALTER TABLE public.fishing_spots
  ALTER COLUMN user_id SET NOT NULL;


-- ─────────────────────────────────────────
-- 4. Realtime'ni yoqish
-- ─────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.fishing_spots;

-- DELETE hodisasida eski qatorni ko'rish uchun (payload.old.id kerak)
ALTER TABLE public.fishing_spots REPLICA IDENTITY FULL;


-- ─────────────────────────────────────────
-- 5. Tezlik uchun indekslar
-- ─────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_spots_created_at ON public.fishing_spots (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spots_user_id    ON public.fishing_spots (user_id);
CREATE INDEX IF NOT EXISTS idx_spots_coords     ON public.fishing_spots (lat, lng);


-- ─────────────────────────────────────────
-- TEKSHIRISH: policy'lar joyidami?
-- ─────────────────────────────────────────
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE schemaname = 'public' ORDER BY tablename;
