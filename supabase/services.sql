-- The Royal Velvet: admin-managed public services
-- Run this in Supabase SQL Editor once.

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  category_id text not null,
  card_title text,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists services_category_id_idx on public.services (category_id);
create index if not exists services_is_published_idx on public.services (is_published);
create index if not exists services_sort_order_idx on public.services (sort_order);

alter table public.services enable row level security;

drop policy if exists "Public can read published services" on public.services;
create policy "Public can read published services"
on public.services
for select
using (is_published = true);

drop policy if exists "Authenticated admin can manage services" on public.services;
create policy "Authenticated admin can manage services"
on public.services
for all
to authenticated
using (true)
with check (true);
