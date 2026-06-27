-- Premium admin feature upgrade for The Royal Velvet
-- Run this once in Supabase SQL Editor.

-- 1) Booking pipeline, private notes, and follow-up reminders
alter table public.bookings
  add column if not exists admin_notes text,
  add column if not exists follow_up_date date,
  add column if not exists proposal_tier text not null default 'Bespoke',
  add column if not exists estimated_quote_range text,
  add column if not exists proposal_notes text,
  add column if not exists next_action text,
  add column if not exists advance_status text not null default 'Pending',
  add column if not exists updated_at timestamptz;

do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'bookings_status_pipeline_check'
  ) then
    alter table public.bookings drop constraint bookings_status_pipeline_check;
  end if;
end $$;

update public.bookings
set status = case
  when status is null then 'new inquiry'
  when lower(status) = 'new' then 'new inquiry'
  when lower(status) = 'contacted' then 'private consultation'
  when lower(status) = 'proposal sent' then 'royal proposal presented'
  when lower(status) = 'confirmed' then 'celebration confirmed'
  when lower(status) = 'closed' then 'celebration confirmed'
  else lower(status)
end;

alter table public.bookings
  alter column status set default 'new inquiry';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bookings_status_pipeline_check') then
    alter table public.bookings
      add constraint bookings_status_pipeline_check
      check (status in (
        'new inquiry',
        'concierge review',
        'private consultation',
        'bespoke scope design',
        'royal proposal presented',
        'client refinement',
        'celebration confirmed'
      ));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'bookings_advance_status_check') then
    alter table public.bookings
      add constraint bookings_advance_status_check
      check (advance_status in ('Pending', 'Requested', 'Received'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'bookings_proposal_tier_check') then
    alter table public.bookings
      add constraint bookings_proposal_tier_check
      check (proposal_tier in ('Signature', 'Royal', 'Bespoke', 'Ultra Luxury'));
  end if;
end $$;

-- 2) Offer scheduling: website displays offers only between start_date and end_date
alter table public.membership_settings
  add column if not exists start_date date,
  add column if not exists end_date date;

-- 3) Gallery display control: featured images appear first, then sort_order
alter table public.gallery
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_featured boolean not null default false,
  add column if not exists updated_at timestamptz;

create index if not exists gallery_featured_order_idx
on public.gallery (is_featured desc, sort_order asc, created_at desc);

create index if not exists bookings_follow_up_idx
on public.bookings (follow_up_date, status);
