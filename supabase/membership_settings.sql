-- Run this once in Supabase SQL Editor to make Membership & Discounts editable from the admin panel.
create table if not exists public.membership_settings (
  id text primary key default 'active',
  active boolean default true,
  title text,
  discount_label text,
  description text,
  note text,
  updated_at timestamptz default now()
);

alter table public.membership_settings enable row level security;

-- Public website can read the active offer.
do $$ begin
  create policy "Membership settings are publicly readable"
  on public.membership_settings
  for select
  using (true);
exception when duplicate_object then null;
end $$;

-- Authenticated admin can insert/update/delete from the admin dashboard.
do $$ begin
  create policy "Authenticated admins can manage membership settings"
  on public.membership_settings
  for all
  to authenticated
  using (true)
  with check (true);
exception when duplicate_object then null;
end $$;

insert into public.membership_settings (id, active, title, discount_label, description, note)
values (
  'active',
  true,
  'Royal Velvet Privilege Membership',
  'Member privileges & preferred pricing across all services',
  'Corporate clients, returning families, and annual celebration partners can receive curated membership benefits, seasonal discounts, priority planning slots, and package-level privileges across every service category.',
  'Final privileges are confirmed privately based on event scale, package selection, and yearly engagement.'
)
on conflict (id) do nothing;
