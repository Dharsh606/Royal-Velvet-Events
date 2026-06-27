-- The Royal Velvet: admin-managed Our Story settings
-- Run this in Supabase SQL Editor once.

create table if not exists public.our_story_settings (
  id text primary key default 'main',
  story_image_url text,
  founder_image_url text,
  founder_name text not null default 'VIJAYA H REDDY',
  founder_role text not null default 'Founder & Creative Director',
  founder_quote text not null default 'Luxury is not noise. It is the confidence that every guest, every ritual, and every detail is already taken care of.',
  events_completed integer not null default 150,
  cities_served integer not null default 10,
  specialized_services integer not null default 70,
  client_satisfaction integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint our_story_singleton check (id = 'main')
);

insert into public.our_story_settings (id)
values ('main')
on conflict (id) do nothing;

alter table public.our_story_settings enable row level security;

drop policy if exists "Public can read our story settings" on public.our_story_settings;
create policy "Public can read our story settings"
on public.our_story_settings
for select
using (true);

drop policy if exists "Authenticated admin can manage our story settings" on public.our_story_settings;
create policy "Authenticated admin can manage our story settings"
on public.our_story_settings
for all
to authenticated
using (true)
with check (id = 'main');
