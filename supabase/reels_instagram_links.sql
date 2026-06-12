-- Run this once in Supabase SQL Editor if your reels table does not already
-- have a column for Instagram reel links.

alter table public.reels
add column if not exists instagram_url text;

alter table public.reels
add column if not exists media_type text;

