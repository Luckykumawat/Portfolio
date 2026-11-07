-- Apply once to a NEW Supabase project using the SQL Editor. Safe to re-run.
begin;
create table if not exists public.portfolio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.portfolio_admins enable row level security;
revoke all on public.portfolio_admins from anon, authenticated;
grant select on public.portfolio_admins to authenticated;
drop policy if exists "Admins may see their own access" on public.portfolio_admins;
create policy "Admins may see their own access" on public.portfolio_admins for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.portfolio_is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.portfolio_admins where user_id = (select auth.uid()) and enabled = true);
$$;
revoke all on function public.portfolio_is_admin() from public;
grant execute on function public.portfolio_is_admin() to authenticated;

create table if not exists public.portfolio_content (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('project','software','service','photo')),
  title text not null check (char_length(btrim(title)) between 1 and 180),
  subtitle text not null default '', description text not null default '',
  image_url text not null default '', live_url text not null default '', github_url text not null default '',
  category text not null default 'real' check (category in ('real','github')),
  work_status text not null default 'completed' check (work_status in ('upcoming','in_progress','completed')),
  current_focus boolean not null default false, featured boolean not null default false,
  show_on_projects boolean not null default true, published boolean not null default false,
  sort_order integer not null default 0, homepage_order integer not null default 0,
  tags text[] not null default '{}', gallery text[] not null default '{}',
  album text not null default '', alt text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint focus_requires_active_work check (not current_focus or work_status = 'in_progress')
);
create index if not exists portfolio_content_public_idx on public.portfolio_content(kind,sort_order) where published;
create table if not exists public.portfolio_profile (
  id text primary key default 'main' check (id = 'main'),
  published boolean not null default false,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now()
);
create or replace function public.portfolio_touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = clock_timestamp(); return new; end;
$$;
drop trigger if exists portfolio_content_updated on public.portfolio_content;
create trigger portfolio_content_updated before update on public.portfolio_content for each row execute function public.portfolio_touch_updated_at();
drop trigger if exists portfolio_profile_updated on public.portfolio_profile;
create trigger portfolio_profile_updated before update on public.portfolio_profile for each row execute function public.portfolio_touch_updated_at();

alter table public.portfolio_content enable row level security;
alter table public.portfolio_profile enable row level security;
revoke all on public.portfolio_content, public.portfolio_profile from anon, authenticated;
grant select on public.portfolio_content, public.portfolio_profile to anon;
grant select, insert, update, delete on public.portfolio_content, public.portfolio_profile to authenticated;
drop policy if exists "Read published content" on public.portfolio_content;
create policy "Read published content" on public.portfolio_content for select to anon,authenticated using (published = true);
drop policy if exists "Manage portfolio content" on public.portfolio_content;
create policy "Manage portfolio content" on public.portfolio_content for all to authenticated using ((select public.portfolio_is_admin())) with check ((select public.portfolio_is_admin()));
drop policy if exists "Read published profile" on public.portfolio_profile;
create policy "Read published profile" on public.portfolio_profile for select to anon,authenticated using (published = true);
drop policy if exists "Manage portfolio profile" on public.portfolio_profile;
create policy "Manage portfolio profile" on public.portfolio_profile for all to authenticated using ((select public.portfolio_is_admin())) with check ((select public.portfolio_is_admin()));

-- Public portfolio artwork only; restrict writes to the approved admin's folder.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('portfolio-media','portfolio-media',true,8388608,array['image/jpeg','image/png','image/webp','image/avif','image/gif'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "Portfolio admins upload images" on storage.objects;
create policy "Portfolio admins upload images" on storage.objects for insert to authenticated
with check (bucket_id='portfolio-media' and (select public.portfolio_is_admin()) and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "Portfolio admins manage their images" on storage.objects;
create policy "Portfolio admins manage their images" on storage.objects for select to authenticated
using (bucket_id='portfolio-media' and (select public.portfolio_is_admin()) and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "Portfolio admins delete their images" on storage.objects;
create policy "Portfolio admins delete their images" on storage.objects for delete to authenticated
using (bucket_id='portfolio-media' and (select public.portfolio_is_admin()) and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
