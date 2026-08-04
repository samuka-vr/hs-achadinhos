-- H&S Achadinhos V6.1
-- Adiciona o link da Vitrine Shopee e ajusta textos da página inicial.
-- Não apaga produtos, categorias, usuários, imagens ou estatísticas.

insert into public.site_settings(key, value)
values
  ('shopee_showcase', '""'::jsonb),
  ('carousel_speed', '5200'::jsonb),
  ('show_header_search', 'true'::jsonb)
on conflict (key) do nothing;

update public.home_sections
set
  title = 'Todos os produtos',
  subtitle = 'Use os filtros para organizar os achadinhos.',
  settings = coalesce(settings, '{}'::jsonb) || '{"page_size":24}'::jsonb
where section_key = 'catalog';

update public.home_sections
set
  settings = coalesce(settings, '{}'::jsonb) || '{"show_search":true,"layout":"split"}'::jsonb
where section_key = 'hero';
