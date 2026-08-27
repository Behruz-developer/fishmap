-- ═══════════════════════════════════════
-- FishMap — fish_guides jadvali (Admin qo'llanmalari)
-- Supabase SQL Editor'ga ishga tushiring
-- ═══════════════════════════════════════

-- Qo'llanmalar jadvali
create table if not exists public.fish_guides (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name          text not null,
  emoji         text default '🐟',
  sci_name      text,
  difficulty    text default 'beginner' check (difficulty in ('beginner', 'intermediate', 'advanced')),
  avg_weight    text,
  max_weight    text,
  description   text,
  habitats_desc text,
  habitats      jsonb default '["lake"]'::jsonb,
  methods       jsonb default '[]'::jsonb,
  tackle        jsonb default '{}'::jsonb,
  bait          jsonb default '[]'::jsonb,
  seasons       jsonb default '[]'::jsonb,
  conditions    jsonb default '{}'::jsonb,
  tips          jsonb default '[]'::jsonb,
  videos        jsonb default '[]'::jsonb,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- RLS yoqish
alter table public.fish_guides enable row level security;

-- O'qish: hamma kirgan foydalanuvchilar
drop policy if exists "fish_guides_select" on public.fish_guides;
create policy "fish_guides_select"
  on public.fish_guides for select
  to authenticated
  using (true);

-- Yozish/o'chirish: faqat admin_users jadvalidagi adminlar
drop policy if exists "fish_guides_admin_insert" on public.fish_guides;
create policy "fish_guides_admin_insert"
  on public.fish_guides for insert
  to authenticated
  with check (
    exists (
      select 1 from public.admin_users au
      where au.user_id = auth.uid()
    )
  );

drop policy if exists "fish_guides_admin_update" on public.fish_guides;
create policy "fish_guides_admin_update"
  on public.fish_guides for update
  to authenticated
  using (
    exists (
      select 1 from public.admin_users au
      where au.user_id = auth.uid()
    )
  );

drop policy if exists "fish_guides_admin_delete" on public.fish_guides;
create policy "fish_guides_admin_delete"
  on public.fish_guides for delete
  to authenticated
  using (
    exists (
      select 1 from public.admin_users au
      where au.user_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════
-- O'zingizni admin qilish:
-- ═══════════════════════════════════════
-- insert into public.admin_users (user_id)
-- values ('SIZNING-USER-ID-SIZ');
--
-- User ID'ni bilish uchun:
-- select id, email from auth.users where email = 'sizning@email.com';