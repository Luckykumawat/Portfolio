begin;
create table if not exists public.portfolio_mascots (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(btrim(title)) between 1 and 180),
  subtitle text not null default '',
  category text not null check (category in ('Animals','People','Robots & things','Originals')),
  directions_url text not null default '', reactions_url text not null default '',
  controller text not null default 'original' check (controller in ('original','legacy')),
  is_original boolean not null default true, is_new boolean not null default true,
  sort_order integer not null default 0, published boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint mascot_published_sheets check (not published or (directions_url <> '' and reactions_url <> ''))
);
create index if not exists portfolio_mascots_order_idx on public.portfolio_mascots(sort_order) where published;
alter table public.portfolio_mascots enable row level security;
revoke all on public.portfolio_mascots from anon,authenticated;
grant select on public.portfolio_mascots to anon;
grant select,insert,update,delete on public.portfolio_mascots to authenticated;
drop policy if exists "Read published mascots" on public.portfolio_mascots;
create policy "Read published mascots" on public.portfolio_mascots for select to anon,authenticated using (published);
drop policy if exists "Manage mascots" on public.portfolio_mascots;
create policy "Manage mascots" on public.portfolio_mascots for all to authenticated
using ((select public.portfolio_is_admin())) with check ((select public.portfolio_is_admin()));
drop trigger if exists portfolio_mascots_updated on public.portfolio_mascots;
create trigger portfolio_mascots_updated before update on public.portfolio_mascots for each row execute function public.portfolio_touch_updated_at();
commit;
