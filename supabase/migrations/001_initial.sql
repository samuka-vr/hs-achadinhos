-- H&S Achadinhos — banco inicial
-- Execute este arquivo no SQL Editor do Supabase.

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
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 180),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  affiliate_url text not null check (affiliate_url ~ '^https://'),
  image_url text check (image_url is null or image_url ~ '^https://'),
  current_price numeric(12,2) check (current_price is null or current_price >= 0),
  old_price numeric(12,2) check (old_price is null or old_price >= 0),
  short_description text check (short_description is null or char_length(short_description) <= 1200),
  tags text[] not null default '{}',
  badge text check (badge is null or char_length(badge) <= 40),
  is_featured boolean not null default false,
  is_active boolean not null default true,
  click_count bigint not null default 0 check (click_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

create index if not exists categories_active_sort_idx on public.categories(is_active, sort_order);
create index if not exists products_active_created_idx on public.products(is_active, created_at desc);
create index if not exists products_category_active_idx on public.products(category_id, is_active);
create index if not exists products_click_count_idx on public.products(click_count desc);
create index if not exists product_clicks_product_date_idx on public.product_clicks(product_id, clicked_at desc);
create index if not exists product_clicks_date_idx on public.product_clicks(clicked_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
drop trigger if exists settings_set_updated_at on public.site_settings;
create trigger settings_set_updated_at before update on public.site_settings for each row execute function public.set_updated_at();

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
  if not exists(select 1 from public.products where id = p_product_id and is_active = true) then
    return;
  end if;
  insert into public.product_clicks(product_id, referrer, user_agent)
  values (p_product_id, left(p_referrer, 500), left(p_user_agent, 500));
  update public.products set click_count = click_count + 1 where id = p_product_id;
end;
$$;

revoke all on function public.register_product_click(uuid, text, text) from public;
grant execute on function public.register_product_click(uuid, text, text) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_clicks enable row level security;
alter table public.site_settings enable row level security;

-- Perfis: cada usuário autenticado pode ler apenas o próprio perfil.
drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles for select to authenticated using (id = auth.uid());

-- Categorias públicas ativas; admins enxergam todas.
drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories for select to anon, authenticated using (is_active or public.is_admin());
drop policy if exists "categories_admin_insert" on public.categories;
create policy "categories_admin_insert" on public.categories for insert to authenticated with check (public.is_admin());
drop policy if exists "categories_admin_update" on public.categories;
create policy "categories_admin_update" on public.categories for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "categories_admin_delete" on public.categories;
create policy "categories_admin_delete" on public.categories for delete to authenticated using (public.is_admin());

-- Produtos públicos ativos; admins enxergam e alteram todos.
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products for select to anon, authenticated using (is_active or public.is_admin());
drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert" on public.products for insert to authenticated with check (public.is_admin());
drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update" on public.products for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete" on public.products for delete to authenticated using (public.is_admin());

-- Cliques detalhados só podem ser lidos pelo admin. Inserção pública ocorre pela função segura.
drop policy if exists "clicks_admin_read" on public.product_clicks;
create policy "clicks_admin_read" on public.product_clicks for select to authenticated using (public.is_admin());

-- Configurações são públicas para leitura e privadas para alteração.
drop policy if exists "settings_public_read" on public.site_settings;
create policy "settings_public_read" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "settings_admin_insert" on public.site_settings;
create policy "settings_admin_insert" on public.site_settings for insert to authenticated with check (public.is_admin());
drop policy if exists "settings_admin_update" on public.site_settings;
create policy "settings_admin_update" on public.site_settings for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "settings_admin_delete" on public.site_settings;
create policy "settings_admin_delete" on public.site_settings for delete to authenticated using (public.is_admin());

insert into public.categories(name, slug, icon, sort_order)
values
  ('Eletrônicos', 'eletronicos', '🎧', 1),
  ('Casa e Cozinha', 'casa-e-cozinha', '🏠', 2),
  ('Moda', 'moda', '👕', 3),
  ('Beleza', 'beleza', '✨', 4),
  ('Games', 'games', '🎮', 5),
  ('Utilidades', 'utilidades', '🧰', 6)
on conflict (slug) do nothing;

insert into public.site_settings(key, value)
values
  ('site_name', '"H&S Achadinhos"'::jsonb),
  ('hero_title', '"Achadinhos que valem a pena"'::jsonb),
  ('hero_subtitle', '"Uma seleção prática de produtos para facilitar sua busca na Shopee."'::jsonb),
  ('whatsapp', '""'::jsonb),
  ('instagram', '""'::jsonb),
  ('products_per_page', '24'::jsonb),
  ('logo_url', '"/brand/hs-logo.png"'::jsonb),
  ('favicon_url', '"/brand/hs-logo.png"'::jsonb),
  ('hero_eyebrow', '"Curadoria feita para você"'::jsonb),
  ('hero_button_text', '"Explorar achadinhos"'::jsonb),
  ('hero_image_url', '"/brand/hs-logo.png"'::jsonb),
  ('announcement_enabled', 'true'::jsonb),
  ('announcement_text', '"Novos achadinhos adicionados toda semana"'::jsonb),
  ('announcement_url', '"#novidades"'::jsonb),
  ('coverflow_enabled', 'true'::jsonb),
  ('coverflow_title', '"Descubra algo novo"'::jsonb),
  ('coverflow_subtitle', '"Uma vitrine dinâmica com produtos escolhidos em ordem diferente a cada visita."'::jsonb),
  ('footer_description', '"Uma curadoria independente de produtos encontrados na Shopee para facilitar suas escolhas."'::jsonb),
  ('primary_color', '"#e98791"'::jsonb),
  ('secondary_color', '"#f7cfd2"'::jsonb),
  ('tiktok', '""'::jsonb),
  ('youtube', '""'::jsonb),
  ('facebook', '""'::jsonb),
  ('telegram', '""'::jsonb),
  ('email', '""'::jsonb)
on conflict (key) do nothing;

-- Bucket público para imagens. O admin autenticado pode enviar e gerenciar arquivos.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 5242880;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects for select to public using (bucket_id = 'product-images');
drop policy if exists "product_images_admin_insert" on storage.objects;
create policy "product_images_admin_insert" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "product_images_admin_update" on storage.objects;
create policy "product_images_admin_update" on storage.objects for update to authenticated using (bucket_id = 'product-images' and public.is_admin()) with check (bucket_id = 'product-images' and public.is_admin());
drop policy if exists "product_images_admin_delete" on storage.objects;
create policy "product_images_admin_delete" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());


-- Bucket para logo, imagens do cabeçalho, ícones e imagens de categorias.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('site-assets', 'site-assets', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'])
on conflict (id) do update set public = true, file_size_limit = 5242880;

drop policy if exists "site_assets_public_read" on storage.objects;
create policy "site_assets_public_read" on storage.objects for select to public using (bucket_id = 'site-assets');
drop policy if exists "site_assets_admin_insert" on storage.objects;
create policy "site_assets_admin_insert" on storage.objects for insert to authenticated with check (bucket_id = 'site-assets' and public.is_admin());
drop policy if exists "site_assets_admin_update" on storage.objects;
create policy "site_assets_admin_update" on storage.objects for update to authenticated using (bucket_id = 'site-assets' and public.is_admin()) with check (bucket_id = 'site-assets' and public.is_admin());
drop policy if exists "site_assets_admin_delete" on storage.objects;
create policy "site_assets_admin_delete" on storage.objects for delete to authenticated using (bucket_id = 'site-assets' and public.is_admin());
