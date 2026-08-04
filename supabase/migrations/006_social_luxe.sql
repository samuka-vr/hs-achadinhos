-- H&S Achadinhos V6 — Social Luxe Minimal
-- Atualização visual segura e reutilizável. Não apaga produtos, categorias, cliques ou usuários.

insert into public.site_settings(key, value)
values
  ('header_tagline', '"Achou no vídeo. Encontrou aqui."'::jsonb),
  ('hero_eyebrow', '"LINK DA BIO"'::jsonb),
  ('hero_title', '"Achou no vídeo? Está aqui."'::jsonb),
  ('hero_subtitle', '"Pesquise pelo nome ou pelo código que apareceu no vídeo."'::jsonb),
  ('primary_color', '"#c96f78"'::jsonb),
  ('secondary_color', '"#f8efec"'::jsonb),
  ('accent_color', '"#f5dfe1"'::jsonb),
  ('background_color', '"#fffdfc"'::jsonb),
  ('surface_color', '"#ffffff"'::jsonb),
  ('text_color', '"#242122"'::jsonb),
  ('muted_text_color', '"#756e70"'::jsonb),
  ('border_color', '"#eae2e0"'::jsonb),
  ('button_text_color', '"#ffffff"'::jsonb),
  ('font_family', '"Manrope"'::jsonb),
  ('heading_font_family', '"Manrope"'::jsonb),
  ('container_width', '1240'::jsonb),
  ('corner_radius', '20'::jsonb),
  ('card_style', '"outlined"'::jsonb),
  ('header_style', '"minimal"'::jsonb),
  ('sticky_header', 'true'::jsonb),
  ('show_header_search', 'true'::jsonb),
  ('show_prices', 'true'::jsonb),
  ('show_product_codes', 'true'::jsonb),
  ('show_click_count', 'false'::jsonb),
  ('product_columns_mobile', '2'::jsonb),
  ('product_columns_desktop', '4'::jsonb),
  ('announcement_enabled', 'false'::jsonb),
  ('footer_title', '""'::jsonb),
  ('footer_description', '""'::jsonb),
  ('footer_note', '""'::jsonb)
on conflict (key) do update set value = excluded.value;

update public.home_sections
set
  title = 'Achou no vídeo? Está aqui.',
  subtitle = 'Pesquise pelo nome ou pelo código que apareceu no vídeo.',
  eyebrow = 'LINK DA BIO',
  sort_order = 10,
  settings = coalesce(settings, '{}'::jsonb) || '{"layout":"split","show_search":true,"show_steps":false}'::jsonb
where section_key = 'hero';

update public.home_sections
set
  title = 'Encontre por categoria',
  subtitle = 'Um atalho para chegar mais rápido no que você procura.',
  eyebrow = '',
  sort_order = 20,
  settings = coalesce(settings, '{}'::jsonb) || '{"limit":12,"style":"stories"}'::jsonb
where section_key = 'categories';

update public.home_sections
set
  title = 'Vistos nos últimos vídeos',
  subtitle = 'Os produtos mais recentes aparecem primeiro.',
  eyebrow = 'DOS VÍDEOS',
  sort_order = 30,
  settings = coalesce(settings, '{}'::jsonb) || '{"limit":12,"layout":"rail","autoplay":true,"interval":5500}'::jsonb
where section_key = 'video-products';

update public.home_sections
set
  title = 'Acabaram de chegar',
  subtitle = 'Novos achadinhos adicionados ao catálogo.',
  eyebrow = 'NOVIDADES',
  sort_order = 40,
  settings = coalesce(settings, '{}'::jsonb) || '{"limit":8,"columns":4}'::jsonb
where section_key = 'newest';

update public.home_sections
set
  title = 'Os mais procurados',
  subtitle = 'Produtos que mais receberam acessos.',
  eyebrow = 'EM ALTA',
  sort_order = 50,
  settings = coalesce(settings, '{}'::jsonb) || '{"limit":8,"columns":4}'::jsonb
where section_key = 'trending';

update public.home_sections
set
  title = 'Todos os produtos',
  subtitle = 'Busque, filtre e encontre seu próximo achadinho.',
  eyebrow = 'CATÁLOGO',
  sort_order = 60,
  settings = coalesce(settings, '{}'::jsonb) || '{"page_size":24}'::jsonb
where section_key = 'catalog';

-- O banner fica opcional e aparece somente quando houver conteúdo ativo.
update public.home_sections set sort_order = 25 where section_key = 'banners';

-- Aplica o novo monograma somente quando o projeto ainda usa a logo padrão antiga.
update public.site_settings
set value = '"/brand/hs-monogram.svg"'::jsonb
where key in ('logo_url','favicon_url','hero_image_url','og_image_url')
  and value::text in ('"/brand/hs-logo.png"','""','null');
