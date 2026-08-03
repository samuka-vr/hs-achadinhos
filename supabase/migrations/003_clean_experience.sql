-- H&S Achadinhos — versão limpa, galeria de imagens e controles de seções
-- Execute uma vez no SQL Editor do Supabase.

insert into public.site_settings(key, value)
values
  ('header_tagline', '"Achadinhos da Shopee"'::jsonb),
  ('hero_eyebrow', '"Escolhas da semana"'::jsonb),
  ('hero_title', '"Produtos legais, sem enrolação"'::jsonb),
  ('hero_subtitle', '"A gente organiza os links para você encontrar rápido o que procura."'::jsonb),
  ('hero_button_text', '"Ver produtos"'::jsonb),
  ('announcement_text', '"Novos produtos entrando por aqui"'::jsonb),
  ('coverflow_title', '"Dá uma olhada nesses"'::jsonb),
  ('coverflow_subtitle', '"Os produtos mudam de ordem a cada visita."'::jsonb),
  ('footer_description', '"Links organizados para facilitar sua busca na Shopee."'::jsonb),
  ('primary_color', '"#ef5b67"'::jsonb),
  ('secondary_color', '"#fff0f1"'::jsonb),
  ('show_categories', 'true'::jsonb),
  ('show_trending', 'true'::jsonb),
  ('show_newest', 'true'::jsonb),
  ('show_catalog', 'true'::jsonb),
  ('carousel_speed', '4200'::jsonb)
on conflict (key) do update set value = excluded.value;

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null check (image_url ~ '^https://'),
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_images_product_sort_idx
  on public.product_images(product_id, sort_order, created_at);

alter table public.product_images enable row level security;

drop policy if exists "product_gallery_public_read" on public.product_images;
create policy "product_gallery_public_read"
on public.product_images for select
to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_id and (p.is_active or public.is_admin())
  )
);

drop policy if exists "product_gallery_admin_insert" on public.product_images;
create policy "product_gallery_admin_insert"
on public.product_images for insert
to authenticated
with check (public.is_admin());

drop policy if exists "product_gallery_admin_update" on public.product_images;
create policy "product_gallery_admin_update"
on public.product_images for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "product_gallery_admin_delete" on public.product_images;
create policy "product_gallery_admin_delete"
on public.product_images for delete
to authenticated
using (public.is_admin());

-- Usa a imagem principal atual como primeira imagem da galeria, sem duplicar.
insert into public.product_images(product_id, image_url, sort_order, is_cover)
select p.id, p.image_url, 0, true
from public.products p
where p.image_url is not null
  and not exists (
    select 1 from public.product_images pi where pi.product_id = p.id
  );
