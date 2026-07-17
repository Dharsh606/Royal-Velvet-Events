-- The Royal Velvet: automated CMS-to-SEO publishing upgrade
-- Run once in Supabase SQL Editor before using the automated project SEO fields.

alter table public.gallery_projects
  add column if not exists slug text,
  add column if not exists location text not null default '',
  add column if not exists category text not null default 'Luxury Celebration',
  add column if not exists seo_title text not null default '',
  add column if not exists seo_description text not null default '',
  add column if not exists published_at timestamptz;

alter table public.gallery_project_images
  add column if not exists caption text not null default '';

create or replace function public.royal_velvet_slugify(input_text text)
returns text
language sql
immutable
strict
as $$
  select trim(both '-' from regexp_replace(lower(trim(input_text)), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function public.ensure_gallery_project_slug()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  base_slug text;
  candidate text;
begin
  base_slug := public.royal_velvet_slugify(coalesce(nullif(new.slug, ''), new.title));
  if base_slug = '' then
    base_slug := 'royal-velvet-project';
  end if;

  candidate := base_slug;
  if exists (
    select 1
    from public.gallery_projects existing
    where existing.slug = candidate
      and existing.id <> new.id
  ) then
    candidate := base_slug || '-' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;

  new.slug := candidate;
  new.updated_at := now();

  if new.is_published and new.published_at is null then
    new.published_at := now();
  elsif not new.is_published then
    new.published_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists gallery_projects_prepare_publication on public.gallery_projects;
create trigger gallery_projects_prepare_publication
before insert or update on public.gallery_projects
for each row execute function public.ensure_gallery_project_slug();

update public.gallery_projects
set
  slug = public.royal_velvet_slugify(title),
  published_at = case when is_published then coalesce(published_at, created_at, now()) else null end
where slug is null or slug = '';

-- Resolve any legacy duplicate titles before enforcing a public URL constraint.
with duplicates as (
  select
    id,
    slug,
    row_number() over (partition by slug order by created_at, id) as duplicate_number
  from public.gallery_projects
)
update public.gallery_projects project
set slug = project.slug || '-' || substr(replace(project.id::text, '-', ''), 1, 8)
from duplicates
where duplicates.id = project.id
  and duplicates.duplicate_number > 1;

alter table public.gallery_projects
  alter column slug set not null;

create unique index if not exists gallery_projects_slug_unique_idx
  on public.gallery_projects (slug);

create index if not exists gallery_projects_seo_publish_idx
  on public.gallery_projects (is_published, published_at desc, updated_at desc);

comment on column public.gallery_projects.slug is 'Stable public URL segment used at /projects/{slug}.';
comment on column public.gallery_projects.seo_title is 'Optional search title; generated automatically when blank.';
comment on column public.gallery_projects.seo_description is 'Optional search description; generated automatically when blank.';
comment on column public.gallery_project_images.caption is 'Human-readable image caption used for accessibility and image discovery.';
