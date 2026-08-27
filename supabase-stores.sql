-- FishMap: do'konlar va admin huquqi
-- Supabase Dashboard → SQL Editor'da ushbu faylni to'liq ishga tushiring.
-- Bu skript supabase-rls.sql ishlatilganidan keyin qo'llanadi.

-- 1) Joy turi: oddiy baliq ovi joyi yoki do'kon
ALTER TABLE public.fishing_spots
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'fishing';

ALTER TABLE public.fishing_spots
  DROP CONSTRAINT IF EXISTS chk_spot_kind;

ALTER TABLE public.fishing_spots
  ADD CONSTRAINT chk_spot_kind CHECK (kind IN ('fishing', 'store'));

-- 2) Adminlar alohida jadvalda saqlanadi.
-- Oddiy foydalanuvchi bu jadvalga o'zini qo'sha olmaydi.
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_users_select_self" ON public.admin_users;
CREATE POLICY "admin_users_select_self"
  ON public.admin_users FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- RLS policy'larda xavfsiz ishlatiladigan admin tekshiruvi.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- 3) Oddiy foydalanuvchi faqat fishing turini qo'sha/tahrirlay oladi.
-- store turini faqat admin qo'sha yoki boshqara oladi.
DROP POLICY IF EXISTS "spots_insert_own"          ON public.fishing_spots;
DROP POLICY IF EXISTS "spots_insert_fishing_own"  ON public.fishing_spots;
DROP POLICY IF EXISTS "spots_insert_store_admin"  ON public.fishing_spots;
DROP POLICY IF EXISTS "spots_update_own"          ON public.fishing_spots;
DROP POLICY IF EXISTS "spots_update_fishing_own"  ON public.fishing_spots;
DROP POLICY IF EXISTS "spots_update_admin"        ON public.fishing_spots;
DROP POLICY IF EXISTS "spots_delete_own"          ON public.fishing_spots;
DROP POLICY IF EXISTS "spots_delete_fishing_own"  ON public.fishing_spots;
DROP POLICY IF EXISTS "spots_delete_admin"        ON public.fishing_spots;

CREATE POLICY "spots_insert_fishing_own"
  ON public.fishing_spots FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND kind = 'fishing');

CREATE POLICY "spots_insert_store_admin"
  ON public.fishing_spots FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND kind = 'store' AND public.is_admin());

CREATE POLICY "spots_update_fishing_own"
  ON public.fishing_spots FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND kind = 'fishing')
  WITH CHECK (auth.uid() = user_id AND kind = 'fishing');

CREATE POLICY "spots_update_admin"
  ON public.fishing_spots FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "spots_delete_fishing_own"
  ON public.fishing_spots FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND kind = 'fishing');

CREATE POLICY "spots_delete_admin"
  ON public.fishing_spots FOR DELETE TO authenticated
  USING (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_spots_kind ON public.fishing_spots (kind);

-- 4) O'ZINGIZNI ADMIN QILISH.
-- Google orqali kirgach, Auth → Users sahifasidan o'z UUID'ingizni oling,
-- quyidagi UUID o'rniga qo'yib faqat BIR MAROTABA ishga tushiring:
-- INSERT INTO public.admin_users (user_id)
-- VALUES ('YOUR-USER-UUID-HERE')
-- ON CONFLICT (user_id) DO NOTHING;

-- 5) Namuna do'kon. Yuqoridagi UUID'ni qo'ygandan keyin ishga tushiring:
-- INSERT INTO public.fishing_spots
--   (name, type, fish_types, description, depth, lat, lng, is_paid, rating, is_hot, kind, user_id)
-- VALUES
--   ('FishPro Tashkent', 'Baliq ovi do''koni', '{}',
--    'Qarmoq, yem, leska va baliq ovi anjomlari.', NULL,
--    41.31180, 69.27970, false, 4.8, false, 'store', 'YOUR-USER-UUID-HERE');
