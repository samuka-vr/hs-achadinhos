-- H&S Achadinhos — personalização profissional
-- Execute este arquivo uma única vez no SQL Editor do Supabase.

insert into public.site_settings(key, value)
values
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

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('site-assets', 'site-assets', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'])
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif','image/svg+xml'];

drop policy if exists "site_assets_public_read" on storage.objects;
create policy "site_assets_public_read"
on storage.objects for select
to public
using (bucket_id = 'site-assets');

drop policy if exists "site_assets_admin_insert" on storage.objects;
create policy "site_assets_admin_insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'site-assets' and public.is_admin());

drop policy if exists "site_assets_admin_update" on storage.objects;
create policy "site_assets_admin_update"
on storage.objects for update
to authenticated
using (bucket_id = 'site-assets' and public.is_admin())
with check (bucket_id = 'site-assets' and public.is_admin());

drop policy if exists "site_assets_admin_delete" on storage.objects;
create policy "site_assets_admin_delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'site-assets' and public.is_admin());
