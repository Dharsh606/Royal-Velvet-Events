-- The Royal Velvet: luxury project-based gallery
-- Run this once in Supabase SQL Editor before using the new Gallery Projects admin flow.

create table if not exists public.gallery_projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  project_date date,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.gallery_projects(id) on delete cascade,
  name text not null default 'Project image',
  alt text not null default 'The Royal Velvet project image',
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists gallery_projects_public_order_idx
  on public.gallery_projects (is_published, is_featured desc, sort_order asc, project_date desc, created_at desc);

create index if not exists gallery_project_images_project_order_idx
  on public.gallery_project_images (project_id, sort_order asc, created_at asc);

alter table public.gallery_projects enable row level security;
alter table public.gallery_project_images enable row level security;

drop policy if exists "Public can read published gallery projects" on public.gallery_projects;
create policy "Public can read published gallery projects"
on public.gallery_projects
for select
using (is_published = true);

drop policy if exists "Public can read images of published gallery projects" on public.gallery_project_images;
create policy "Public can read images of published gallery projects"
on public.gallery_project_images
for select
using (
  exists (
    select 1 from public.gallery_projects project
    where project.id = gallery_project_images.project_id
      and project.is_published = true
  )
);

drop policy if exists "Authenticated admins can manage gallery projects" on public.gallery_projects;
create policy "Authenticated admins can manage gallery projects"
on public.gallery_projects
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated admins can manage gallery project images" on public.gallery_project_images;
create policy "Authenticated admins can manage gallery project images"
on public.gallery_project_images
for all
to authenticated
using (true)
with check (true);
