-- H&S Achadinhos — schema consolidado
-- Use este arquivo somente em um projeto Supabase novo.
-- Para atualizar uma base existente, use 002_existing_database_fixes.sql.

begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  icon text,
  image_url text check (image_url is null or image_url ~ '^https://'),
  description text,
  accent_color text default '#d96c78',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 240),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  product_code text,
  affiliate_url text not null check (affiliate_url ~ '^https://'),
  image_url text check (image_url is null or image_url ~ '^https://'),
  current_price numeric(12,2) check (current_price is null or current_price >= 0),
  old_price numeric(12,2) check (old_price is null or old_price >= 0),
  short_description text check (short_description is null or char_length(short_description) <= 1800),
  tags text[] not null default '{}',
  badge text check (badge is null or char_length(badge) <= 60),
  is_featured boolean not null default false,
  is_video_product boolean not null default false,
  is_pinned boolean not null default false,
  video_url text,
  video_posted_at timestamptz,
  sort_order integer not null default 0,
  seo_title text,
  seo_description text,
  internal_notes text,
  publish_at timestamptz,
  unpublish_at timestamptz,
  import_source text,
  is_active boolean not null default true,
  click_count bigint not null default 0 check (click_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (publish_at is null or unpublish_at is null or unpublish_at > publish_at)
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null check (image_url ~ '^https://'),
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.product_clicks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  clicked_at timestamptz not null default now(),
  referrer text,
  user_agent text
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.home_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  section_type text not null check (section_type in ('hero','banners','video_products','categories','newest','trending','catalog','custom_text')),
  title text not null default '',
  subtitle text not null default '',
  eyebrow text not null default '',
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.banners (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  subtitle text not null default '',
  image_url text,
  mobile_image_url text,
  button_text text not null default 'Ver produtos',
  button_url text not null default '#produtos',
  text_position text not null default 'left' check (text_position in ('left','center','right')),
  text_color text not null default '#2a2224',
  overlay_strength integer not null default 15 check (overlay_strength between 0 and 90),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (starts_at is null or ends_at is null or ends_at > starts_at)
);

create table if not exists public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(label) between 1 and 80),
  url text not null check (url ~ '^(/|#|https://)'),
  location text not null default 'header' check (location in ('header','mobile','footer')),
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  open_new_tab boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(location, label, url)
);

create table if not exists public.content_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  eyebrow text not null default '',
  title text not null,
  subtitle text not null default '',
  body text not null default '',
  image_url text,
  button_text text not null default '',
  button_url text not null default '',
  seo_title text not null default '',
  seo_description text not null default '',
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.search_events (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  results_count integer not null default 0,
  searched_at timestamptz not null default now(),
  referrer text,
  user_agent text
);

create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  viewed_at timestamptz not null default now(),
  referrer text,
  user_agent text
);

create table if not exists public.category_aliases (
  id uuid primary key default gen_random_uuid(),
  alias text not null,
  normalized_alias text generated always as (
    lower(trim(translate(alias,
      'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇç',
      'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCc'
    )))) stored,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(normalized_alias)
);

create table if not exists public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  summary text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.site_snapshots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  snapshot jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists categories_active_sort_idx on public.categories(is_active, sort_order);
create index if not exists products_active_created_idx on public.products(is_active, created_at desc);
create index if not exists products_category_active_idx on public.products(category_id, is_active);
create index if not exists products_click_count_idx on public.products(click_count desc);
create index if not exists products_schedule_idx on public.products(is_active, publish_at, unpublish_at);
create unique index if not exists products_code_unique_idx on public.products(lower(product_code)) where product_code is not null and product_code <> '';
create index if not exists products_video_sort_idx on public.products(is_video_product, is_pinned, video_posted_at desc, sort_order);
create index if not exists product_images_product_sort_idx on public.product_images(product_id, sort_order, created_at);
create unique index if not exists product_images_single_cover_idx on public.product_images(product_id) where is_cover = true;
create index if not exists product_clicks_product_date_idx on public.product_clicks(product_id, clicked_at desc);
create index if not exists product_clicks_date_idx on public.product_clicks(clicked_at desc);
create index if not exists home_sections_sort_idx on public.home_sections(is_enabled, sort_order);
create index if not exists banners_active_sort_idx on public.banners(is_active, sort_order);
create index if not exists navigation_location_sort_idx on public.navigation_items(location, is_active, sort_order);
create index if not exists content_pages_published_idx on public.content_pages(is_published, sort_order);
create index if not exists search_events_date_idx on public.search_events(searched_at desc);
create index if not exists page_views_date_idx on public.page_views(viewed_at desc);
create index if not exists category_aliases_category_idx on public.category_aliases(category_id);
create index if not exists admin_activity_created_idx on public.admin_activity_logs(created_at desc);
create index if not exists admin_activity_entity_idx on public.admin_activity_logs(entity_type, entity_id);
create index if not exists site_snapshots_created_idx on public.site_snapshots(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = check_user and role = 'admin');
$$;
revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to anon, authenticated;

create or replace function public.register_product_click(
  p_product_id uuid,
  p_referrer text default null,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists(
    select 1 from public.products
    where id = p_product_id
      and is_active = true
      and (publish_at is null or publish_at <= now())
      and (unpublish_at is null or unpublish_at > now())
  ) then return; end if;

  insert into public.product_clicks(product_id, referrer, user_agent)
  values (p_product_id, left(p_referrer, 300), left(p_user_agent, 180));
  update public.products set click_count = click_count + 1 where id = p_product_id;
end;
$$;
revoke all on function public.register_product_click(uuid, text, text) from public;
grant execute on function public.register_product_click(uuid, text, text) to anon, authenticated;

create or replace function public.register_search_event(
  p_query text,
  p_results_count integer default 0,
  p_referrer text default null,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if length(trim(coalesce(p_query, ''))) < 2 then return; end if;
  insert into public.search_events(query, results_count, referrer, user_agent)
  values (
    left(trim(p_query), 120),
    least(greatest(coalesce(p_results_count, 0), 0), 10000),
    left(p_referrer, 300),
    left(p_user_agent, 180)
  );
end;
$$;
revoke all on function public.register_search_event(text, integer, text, text) from public;
grant execute on function public.register_search_event(text, integer, text, text) to anon, authenticated;

create or replace function public.register_page_view(
  p_path text,
  p_referrer text default null,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_path text := left(coalesce(nullif(trim(p_path), ''), '/'), 240);
begin
  if clean_path like '/admin%' then return; end if;
  insert into public.page_views(path, referrer, user_agent)
  values (clean_path, left(p_referrer, 300), left(p_user_agent, 180));
end;
$$;
revoke all on function public.register_page_view(text, text, text) from public;
grant execute on function public.register_page_view(text, text, text) to anon, authenticated;

create or replace function public.log_admin_table_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_data jsonb;
  row_id text;
  row_label text;
begin
  if not public.is_admin(auth.uid()) then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;
  row_data := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  row_id := coalesce(row_data->>'id', row_data->>'key', row_data->>'slug');
  row_label := coalesce(row_data->>'name', row_data->>'title', row_data->>'label', row_data->>'key', tg_table_name);
  insert into public.admin_activity_logs(actor_id, action, entity_type, entity_id, summary, metadata)
  values (auth.uid(), lower(tg_op), tg_table_name, row_id, row_label, jsonb_build_object('operation', tg_op));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_clicks enable row level security;
alter table public.site_settings enable row level security;
alter table public.home_sections enable row level security;
alter table public.banners enable row level security;
alter table public.navigation_items enable row level security;
alter table public.content_pages enable row level security;
alter table public.search_events enable row level security;
alter table public.page_views enable row level security;
alter table public.category_aliases enable row level security;
alter table public.admin_activity_logs enable row level security;
alter table public.site_snapshots enable row level security;

drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles for select to authenticated using (id = auth.uid());

drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories for select to anon, authenticated using (is_active or public.is_admin());
drop policy if exists "categories_admin_insert" on public.categories;
create policy "categories_admin_insert" on public.categories for insert to authenticated with check (public.is_admin());
drop policy if exists "categories_admin_update" on public.categories;
create policy "categories_admin_update" on public.categories for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "categories_admin_delete" on public.categories;
create policy "categories_admin_delete" on public.categories for delete to authenticated using (public.is_admin());

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products for select to anon, authenticated using (
  public.is_admin() or (
    is_active = true
    and (publish_at is null or publish_at <= now())
    and (unpublish_at is null or unpublish_at > now())
  )
);
drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert" on public.products for insert to authenticated with check (public.is_admin());
drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update" on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete" on public.products for delete to authenticated using (public.is_admin());

drop policy if exists "product_gallery_public_read" on public.product_images;
create policy "product_gallery_public_read" on public.product_images for select to anon, authenticated using (
  exists(select 1 from public.products p where p.id = product_id and (
    public.is_admin() or (
      p.is_active = true
      and (p.publish_at is null or p.publish_at <= now())
      and (p.unpublish_at is null or p.unpublish_at > now())
    )
  ))
);
drop policy if exists "product_gallery_admin_insert" on public.product_images;
create policy "product_gallery_admin_insert" on public.product_images for insert to authenticated with check (public.is_admin());
drop policy if exists "product_gallery_admin_update" on public.product_images;
create policy "product_gallery_admin_update" on public.product_images for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "product_gallery_admin_delete" on public.product_images;
create policy "product_gallery_admin_delete" on public.product_images for delete to authenticated using (public.is_admin());

drop policy if exists "clicks_admin_read" on public.product_clicks;
create policy "clicks_admin_read" on public.product_clicks for select to authenticated using (public.is_admin());

drop policy if exists "settings_public_read" on public.site_settings;
create policy "settings_public_read" on public.site_settings for select to anon, authenticated using (key <> 'admin_notes' or public.is_admin());
drop policy if exists "settings_admin_insert" on public.site_settings;
create policy "settings_admin_insert" on public.site_settings for insert to authenticated with check (public.is_admin());
drop policy if exists "settings_admin_update" on public.site_settings;
create policy "settings_admin_update" on public.site_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "settings_admin_delete" on public.site_settings;
create policy "settings_admin_delete" on public.site_settings for delete to authenticated using (public.is_admin());

drop policy if exists "home_sections_public_read" on public.home_sections;
create policy "home_sections_public_read" on public.home_sections for select to anon, authenticated using (true);
drop policy if exists "home_sections_admin_all" on public.home_sections;
create policy "home_sections_admin_all" on public.home_sections for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "banners_public_read" on public.banners;
create policy "banners_public_read" on public.banners for select to anon, authenticated using (is_active or public.is_admin());
drop policy if exists "banners_admin_all" on public.banners;
create policy "banners_admin_all" on public.banners for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "navigation_public_read" on public.navigation_items;
create policy "navigation_public_read" on public.navigation_items for select to anon, authenticated using (is_active or public.is_admin());
drop policy if exists "navigation_admin_all" on public.navigation_items;
create policy "navigation_admin_all" on public.navigation_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "content_pages_public_read" on public.content_pages;
create policy "content_pages_public_read" on public.content_pages for select to anon, authenticated using (is_published or public.is_admin());
drop policy if exists "content_pages_admin_all" on public.content_pages;
create policy "content_pages_admin_all" on public.content_pages for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "search_admin_read" on public.search_events;
create policy "search_admin_read" on public.search_events for select to authenticated using (public.is_admin());
drop policy if exists "views_admin_read" on public.page_views;
create policy "views_admin_read" on public.page_views for select to authenticated using (public.is_admin());

drop policy if exists "category_aliases_admin_read" on public.category_aliases;
create policy "category_aliases_admin_read" on public.category_aliases for select to authenticated using (public.is_admin());
drop policy if exists "category_aliases_admin_insert" on public.category_aliases;
create policy "category_aliases_admin_insert" on public.category_aliases for insert to authenticated with check (public.is_admin());
drop policy if exists "category_aliases_admin_update" on public.category_aliases;
create policy "category_aliases_admin_update" on public.category_aliases for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "category_aliases_admin_delete" on public.category_aliases;
create policy "category_aliases_admin_delete" on public.category_aliases for delete to authenticated using (public.is_admin());

drop policy if exists "admin_activity_admin_read" on public.admin_activity_logs;
create policy "admin_activity_admin_read" on public.admin_activity_logs for select to authenticated using (public.is_admin());
drop policy if exists "admin_activity_admin_insert" on public.admin_activity_logs;
create policy "admin_activity_admin_insert" on public.admin_activity_logs for insert to authenticated with check (public.is_admin());

drop policy if exists "site_snapshots_admin_read" on public.site_snapshots;
create policy "site_snapshots_admin_read" on public.site_snapshots for select to authenticated using (public.is_admin());
drop policy if exists "site_snapshots_admin_insert" on public.site_snapshots;
create policy "site_snapshots_admin_insert" on public.site_snapshots for insert to authenticated with check (public.is_admin());
drop policy if exists "site_snapshots_admin_delete" on public.site_snapshots;
create policy "site_snapshots_admin_delete" on public.site_snapshots for delete to authenticated using (public.is_admin());

-- updated_at
drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
drop trigger if exists settings_set_updated_at on public.site_settings;
create trigger settings_set_updated_at before update on public.site_settings for each row execute function public.set_updated_at();
drop trigger if exists home_sections_set_updated_at on public.home_sections;
create trigger home_sections_set_updated_at before update on public.home_sections for each row execute function public.set_updated_at();
drop trigger if exists banners_set_updated_at on public.banners;
create trigger banners_set_updated_at before update on public.banners for each row execute function public.set_updated_at();
drop trigger if exists navigation_set_updated_at on public.navigation_items;
create trigger navigation_set_updated_at before update on public.navigation_items for each row execute function public.set_updated_at();
drop trigger if exists content_pages_set_updated_at on public.content_pages;
create trigger content_pages_set_updated_at before update on public.content_pages for each row execute function public.set_updated_at();
drop trigger if exists category_aliases_set_updated_at on public.category_aliases;
create trigger category_aliases_set_updated_at before update on public.category_aliases for each row execute function public.set_updated_at();

-- Registro de alterações administrativas.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'products','categories','site_settings','home_sections','banners',
    'navigation_items','content_pages','category_aliases'
  ] loop
    execute format('drop trigger if exists hs_admin_log_%I on public.%I', table_name, table_name);
    execute format(
      'create trigger hs_admin_log_%I after insert or update or delete on public.%I for each row execute function public.log_admin_table_change()',
      table_name, table_name
    );
  end loop;
end $$;

-- Categorias oficiais.
insert into public.categories(name, slug, icon, image_url, description, accent_color, sort_order, is_active)
values
  ('Casa & Cozinha','casa-cozinha','🏠',null,'Cozinha, decoração, iluminação e soluções para a casa.','#d98b83',10,true),
  ('Limpeza & Organização','limpeza-organizacao','🧼',null,'Limpeza, lavanderia, organização e utilidades do dia a dia.','#78a694',20,true),
  ('Eletrônicos','eletronicos','🎧',null,'Áudio, carregadores, cabos, acessórios e segurança eletrônica.','#7e91b8',30,true),
  ('Beleza & Bem-estar','beleza-bem-estar','✨',null,'Beleza, cuidados pessoais, cabelo e bem-estar.','#c97a9b',40,true),
  ('Automotivo','automotivo','🚗',null,'Acessórios, organização e limpeza para carros.','#8c8f98',50,true),
  ('Pet','pet','🐾',null,'Produtos e acessórios para cães, gatos e outros pets.','#c59669',60,true),
  ('Moda & Lazer','moda-lazer','🎮',null,'Moda, games, lazer e utilidades variadas.','#8c78b4',70,true)
on conflict (slug) do update set
  name = excluded.name,
  icon = excluded.icon,
  description = excluded.description,
  accent_color = excluded.accent_color,
  sort_order = excluded.sort_order,
  is_active = true;

with aliases(alias, category_slug) as (
  values
    ('Cozinha','casa-cozinha'),('Organização de Cozinha','casa-cozinha'),('Cozinha e Organização','casa-cozinha'),
    ('Casa e Cozinha','casa-cozinha'),('Casa e Iluminação','casa-cozinha'),('Casa e Aromaterapia','casa-cozinha'),
    ('Decoração e Iluminação','casa-cozinha'),('Decoração e Beleza','casa-cozinha'),('Lavanderia e Casa','casa-cozinha'),
    ('Limpeza','limpeza-organizacao'),('Limpeza e Lavanderia','limpeza-organizacao'),('Organização','limpeza-organizacao'),
    ('Organização e Escritório','limpeza-organizacao'),
    ('Eletrônicos','eletronicos'),('Eletrônicos e Áudio','eletronicos'),('Eletrônicos e Carregadores','eletronicos'),
    ('Eletrônicos e Cabos','eletronicos'),('Eletrônicos e Limpeza','eletronicos'),('Segurança e Eletrônicos','eletronicos'),
    ('Beleza','beleza-bem-estar'),('Saúde e Bem-estar','beleza-bem-estar'),('Beleza Masculina','beleza-bem-estar'),
    ('Organização e Beleza','beleza-bem-estar'),('Beleza e Cabelo','beleza-bem-estar'),('Beleza e Cuidados Pessoais','beleza-bem-estar'),
    ('Automotivo','automotivo'),('Limpeza e Automotivo','automotivo'),('Automotivo e Organização','automotivo'),
    ('Pet','pet'),('Lavanderia e Pet','pet'),
    ('Moda','moda-lazer'),('Games','moda-lazer'),('Utilidades','moda-lazer'),('Moda e Lazer','moda-lazer')
)
insert into public.category_aliases(alias, category_id)
select a.alias, c.id from aliases a join public.categories c on c.slug = a.category_slug
on conflict (normalized_alias) do update set category_id = excluded.category_id;

create or replace function public.admin_restore_main_categories()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer := 0;
begin
  if not public.is_admin(auth.uid()) then raise exception 'Acesso negado'; end if;
  insert into public.categories(name, slug, icon, image_url, description, accent_color, sort_order, is_active)
  values
    ('Casa & Cozinha','casa-cozinha','🏠',null,'Cozinha, decoração, iluminação e soluções para a casa.','#d98b83',10,true),
    ('Limpeza & Organização','limpeza-organizacao','🧼',null,'Limpeza, lavanderia, organização e utilidades do dia a dia.','#78a694',20,true),
    ('Eletrônicos','eletronicos','🎧',null,'Áudio, carregadores, cabos, acessórios e segurança eletrônica.','#7e91b8',30,true),
    ('Beleza & Bem-estar','beleza-bem-estar','✨',null,'Beleza, cuidados pessoais, cabelo e bem-estar.','#c97a9b',40,true),
    ('Automotivo','automotivo','🚗',null,'Acessórios, organização e limpeza para carros.','#8c8f98',50,true),
    ('Pet','pet','🐾',null,'Produtos e acessórios para cães, gatos e outros pets.','#c59669',60,true),
    ('Moda & Lazer','moda-lazer','🎮',null,'Moda, games, lazer e utilidades variadas.','#8c78b4',70,true)
  on conflict (slug) do update set name=excluded.name, icon=excluded.icon, description=excluded.description, accent_color=excluded.accent_color, sort_order=excluded.sort_order, is_active=true;
  get diagnostics affected = row_count;

  with aliases(alias, category_slug) as (
    values
      ('Cozinha','casa-cozinha'),('Organização de Cozinha','casa-cozinha'),('Cozinha e Organização','casa-cozinha'),
      ('Casa e Cozinha','casa-cozinha'),('Casa e Iluminação','casa-cozinha'),('Casa e Aromaterapia','casa-cozinha'),
      ('Decoração e Iluminação','casa-cozinha'),('Decoração e Beleza','casa-cozinha'),('Lavanderia e Casa','casa-cozinha'),
      ('Limpeza','limpeza-organizacao'),('Limpeza e Lavanderia','limpeza-organizacao'),('Organização','limpeza-organizacao'),
      ('Organização e Escritório','limpeza-organizacao'),
      ('Eletrônicos','eletronicos'),('Eletrônicos e Áudio','eletronicos'),('Eletrônicos e Carregadores','eletronicos'),
      ('Eletrônicos e Cabos','eletronicos'),('Eletrônicos e Limpeza','eletronicos'),('Segurança e Eletrônicos','eletronicos'),
      ('Beleza','beleza-bem-estar'),('Saúde e Bem-estar','beleza-bem-estar'),('Beleza Masculina','beleza-bem-estar'),
      ('Organização e Beleza','beleza-bem-estar'),('Beleza e Cabelo','beleza-bem-estar'),('Beleza e Cuidados Pessoais','beleza-bem-estar'),
      ('Automotivo','automotivo'),('Limpeza e Automotivo','automotivo'),('Automotivo e Organização','automotivo'),
      ('Pet','pet'),('Lavanderia e Pet','pet'),
      ('Moda','moda-lazer'),('Games','moda-lazer'),('Utilidades','moda-lazer'),('Moda e Lazer','moda-lazer')
  )
  insert into public.category_aliases(alias, category_id)
  select a.alias, c.id from aliases a join public.categories c on c.slug = a.category_slug
  on conflict (normalized_alias) do update set category_id = excluded.category_id;

  return jsonb_build_object('ok', true, 'categories', affected);
end;
$$;
revoke all on function public.admin_restore_main_categories() from public;
grant execute on function public.admin_restore_main_categories() to authenticated;

create or replace function public.admin_reset_catalog()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  product_total integer;
  category_total integer;
begin
  if not public.is_admin(auth.uid()) then raise exception 'Acesso negado'; end if;
  select count(*) into product_total from public.products;
  select count(*) into category_total from public.categories;
  delete from public.products where id is not null;
  delete from public.categories where id is not null;
  perform public.admin_restore_main_categories();
  insert into public.admin_activity_logs(actor_id, action, entity_type, summary, metadata)
  values (auth.uid(), 'reset', 'catalog', 'Catálogo redefinido pelo painel', jsonb_build_object('deleted_products', product_total, 'deleted_categories', category_total));
  return jsonb_build_object('ok', true, 'deleted_products', product_total, 'deleted_categories', category_total, 'created_categories', 7);
end;
$$;
revoke all on function public.admin_reset_catalog() from public;
grant execute on function public.admin_reset_catalog() to authenticated;

create or replace function public.admin_publish_ready_drafts()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare affected integer;
begin
  if not public.is_admin(auth.uid()) then raise exception 'Acesso negado'; end if;
  update public.products set is_active = true where is_active = false and image_url is not null and affiliate_url is not null;
  get diagnostics affected = row_count;
  return jsonb_build_object('ok', true, 'updated', affected);
end;
$$;
revoke all on function public.admin_publish_ready_drafts() from public;
grant execute on function public.admin_publish_ready_drafts() to authenticated;

create or replace function public.admin_move_all_to_draft()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare affected integer;
begin
  if not public.is_admin(auth.uid()) then raise exception 'Acesso negado'; end if;
  update public.products set is_active = false where is_active = true;
  get diagnostics affected = row_count;
  return jsonb_build_object('ok', true, 'updated', affected);
end;
$$;
revoke all on function public.admin_move_all_to_draft() from public;
grant execute on function public.admin_move_all_to_draft() to authenticated;

create or replace function public.admin_delete_products_without_images()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare affected integer;
begin
  if not public.is_admin(auth.uid()) then raise exception 'Acesso negado'; end if;
  delete from public.products where image_url is null or trim(image_url) = '';
  get diagnostics affected = row_count;
  return jsonb_build_object('ok', true, 'deleted', affected);
end;
$$;
revoke all on function public.admin_delete_products_without_images() from public;
grant execute on function public.admin_delete_products_without_images() to authenticated;

insert into public.home_sections(section_key, section_type, title, subtitle, eyebrow, is_enabled, sort_order, settings)
values
  ('hero','hero','Viu no vídeo? Encontre aqui.','Pesquise pelo nome ou código e abra o produto certo na Shopee.','SEU ATALHO PARA OS ACHADOS',true,10,'{"show_search":true}'::jsonb),
  ('categories','categories','Escolha uma categoria','Os produtos ficam organizados para você chegar mais rápido.','EXPLORE POR ÁREA',true,20,'{"limit":7}'::jsonb),
  ('banners','banners','','','',true,25,'{"autoplay":true,"interval":5000,"height":"medium"}'::jsonb),
  ('video-products','video_products','Produtos dos últimos vídeos','Os links que acabaram de aparecer nas redes.','DIRETO DO FEED',true,30,'{"limit":12,"layout":"rail","autoplay":true,"interval":5200}'::jsonb),
  ('newest','newest','Novidades no catálogo','Achados adicionados recentemente.','ACABARAM DE CHEGAR',true,40,'{"limit":8}'::jsonb),
  ('trending','trending','Mais procurados','Produtos que estão recebendo mais acessos.','EM ALTA',true,50,'{"limit":8}'::jsonb),
  ('catalog','catalog','Todos os achados','Use os filtros para encontrar o que precisa.','CATÁLOGO COMPLETO',true,60,'{"page_size":24}'::jsonb)
on conflict (section_key) do nothing;

insert into public.navigation_items(label, url, location, icon, sort_order)
values
  ('Início','/','header','home',10),
  ('Dos vídeos','/#produtos-dos-videos','header','sparkles',20),
  ('Categorias','/#categorias','header','categories',30),
  ('Catálogo','/#produtos','header','products',40),
  ('Sobre','/sobre','footer','tag',10),
  ('Privacidade','/privacidade','footer','shield',20)
on conflict (location, label, url) do nothing;

insert into public.content_pages(slug, eyebrow, title, subtitle, body, button_text, button_url, seo_title, seo_description, is_published, sort_order)
values
  ('sobre','SOBRE A H&S','Achadinhos organizados para você encontrar rápido','Reunimos em um só lugar os produtos mostrados nos nossos vídeos.','A H&S Achadinhos ajuda você a encontrar novamente aquele produto que apareceu em um vídeo. Pesquise pelo nome, use o código informado no conteúdo ou navegue pelas categorias.\n\nOs links levam para a Shopee, onde preço, estoque, frete e pagamento são confirmados. Alguns links podem gerar comissão de afiliado, sem custo extra para você.','','','Sobre a H&S Achadinhos','Conheça a H&S Achadinhos e veja como encontrar os produtos divulgados nos vídeos.',true,10),
  ('privacidade','INFORMAÇÕES','Privacidade e transparência','Entenda quais informações o site registra e como os links de afiliado funcionam.','Registramos dados técnicos reduzidos, como páginas acessadas, pesquisas e cliques, para entender o uso do catálogo. Não vendemos dados pessoais.\n\nAo tocar em um produto, você é direcionado para a Shopee. A compra, o pagamento, o frete, o estoque e o atendimento acontecem na plataforma. Alguns links podem gerar comissão para a H&S Achadinhos sem aumentar o preço para você.','','','Privacidade | H&S Achadinhos','Informações sobre privacidade, analytics e links de afiliado.',true,20)
on conflict (slug) do nothing;

insert into public.site_settings(key, value)
values
  ('site_name','"H&S Achadinhos"'::jsonb),
  ('header_tagline','"Achou no vídeo. Encontrou aqui."'::jsonb),
  ('logo_url','"/brand/hs-monogram.svg"'::jsonb),
  ('favicon_url','"/brand/hs-monogram.svg"'::jsonb),
  ('hero_eyebrow','"SEU ATALHO PARA OS ACHADOS"'::jsonb),
  ('hero_title','"Viu no vídeo? Encontre aqui."'::jsonb),
  ('hero_subtitle','"Busque pelo nome ou pelo código e chegue direto ao produto certo."'::jsonb),
  ('hero_button_text','"Ver últimos produtos"'::jsonb),
  ('hero_image_url','"/brand/hs-monogram.svg"'::jsonb),
  ('announcement_enabled','false'::jsonb),
  ('announcement_text','"Novos produtos por aqui"'::jsonb),
  ('announcement_url','"#produtos-dos-videos"'::jsonb),
  ('coverflow_enabled','true'::jsonb),
  ('coverflow_title','"Produtos dos últimos vídeos"'::jsonb),
  ('coverflow_subtitle','"Os links mais recentes ficam primeiro."'::jsonb),
  ('footer_description','"Produtos dos vídeos organizados para você encontrar rápido."'::jsonb),
  ('footer_title','""'::jsonb),
  ('footer_note','""'::jsonb),
  ('primary_color','"#d96c78"'::jsonb),
  ('secondary_color','"#f3b29f"'::jsonb),
  ('accent_color','"#8f394d"'::jsonb),
  ('background_color','"#f6efea"'::jsonb),
  ('surface_color','"#fff9f5"'::jsonb),
  ('text_color','"#2a2224"'::jsonb),
  ('muted_text_color','"#726568"'::jsonb),
  ('border_color','"#e8d9d3"'::jsonb),
  ('button_text_color','"#ffffff"'::jsonb),
  ('font_family','"Inter"'::jsonb),
  ('heading_font_family','"Inter"'::jsonb),
  ('container_width','1240'::jsonb),
  ('corner_radius','20'::jsonb),
  ('card_style','"soft"'::jsonb),
  ('header_style','"compact"'::jsonb),
  ('sticky_header','true'::jsonb),
  ('show_header_search','true'::jsonb),
  ('show_prices','true'::jsonb),
  ('show_product_codes','true'::jsonb),
  ('show_click_count','false'::jsonb),
  ('product_columns_mobile','2'::jsonb),
  ('product_columns_desktop','4'::jsonb),
  ('seo_title','"H&S Achadinhos | Produtos encontrados na Shopee"'::jsonb),
  ('seo_description','"Encontre os produtos divulgados nos nossos vídeos e acesse os links direto na Shopee."'::jsonb),
  ('og_image_url','"/brand/hs-monogram.svg"'::jsonb),
  ('custom_css','""'::jsonb),
  ('whatsapp','""'::jsonb),
  ('instagram','""'::jsonb),
  ('shopee_showcase','""'::jsonb),
  ('tiktok','""'::jsonb),
  ('youtube','""'::jsonb),
  ('facebook','""'::jsonb),
  ('telegram','""'::jsonb),
  ('email','""'::jsonb),
  ('products_per_page','24'::jsonb),
  ('show_categories','true'::jsonb),
  ('show_trending','true'::jsonb),
  ('show_newest','true'::jsonb),
  ('show_catalog','true'::jsonb),
  ('carousel_speed','5200'::jsonb),
  ('maintenance_mode','false'::jsonb),
  ('maintenance_title','"Estamos organizando novos achadinhos"'::jsonb),
  ('maintenance_message','"Voltamos em breve. Acompanhe nossas redes sociais para novidades."'::jsonb),
  ('catalog_empty_title','"Nenhum produto encontrado"'::jsonb),
  ('catalog_empty_message','"Tente outra busca ou escolha uma categoria."'::jsonb),
  ('footer_social_title','"Acompanhe os próximos achados"'::jsonb),
  ('footer_social_subtitle','"Vídeos novos, produtos novos e links organizados."'::jsonb),
  ('admin_notes','""'::jsonb),
  ('button_style','"rounded"'::jsonb),
  ('product_image_ratio','"square"'::jsonb),
  ('section_spacing','72'::jsonb),
  ('animations_enabled','true'::jsonb),
  ('shadow_strength','7'::jsonb)
on conflict (key) do nothing;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images','product-images',true,8388608,array['image/jpeg','image/png','image/webp','image/gif']),
  ('site-assets','site-assets',true,8388608,array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'])
on conflict (id) do update set public=excluded.public, file_size_limit=excluded.file_size_limit, allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects for select to public using (bucket_id = 'product-images');
drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_admin()) with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "site_assets_public_read" on storage.objects;
create policy "site_assets_public_read" on storage.objects for select to public using (bucket_id = 'site-assets');
drop policy if exists "site_assets_admin_insert" on storage.objects;
create policy "site_assets_admin_insert" on storage.objects for insert to authenticated with check (bucket_id = 'site-assets' and public.is_admin());
drop policy if exists "site_assets_admin_update" on storage.objects;
create policy "site_assets_admin_update" on storage.objects for update to authenticated using (bucket_id = 'site-assets' and public.is_admin()) with check (bucket_id = 'site-assets' and public.is_admin());
drop policy if exists "site_assets_admin_delete" on storage.objects;
create policy "site_assets_admin_delete" on storage.objects for delete to authenticated using (bucket_id = 'site-assets' and public.is_admin());

commit;
