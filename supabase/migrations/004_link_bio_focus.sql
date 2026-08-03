-- H&S Achadinhos V4 — mensagem clara para visitantes vindos do link da bio
-- Esta migration não cria novas tabelas. Apenas ajusta os textos e as cores padrão.

insert into public.site_settings(key, value)
values
  ('hero_eyebrow', '"Veio do nosso vídeo?"'::jsonb),
  ('hero_title', '"O produto que você viu está aqui"'::jsonb),
  ('hero_subtitle', '"Pesquise pelo nome ou veja logo abaixo os últimos achadinhos que postamos."'::jsonb),
  ('hero_button_text', '"Ver últimos links"'::jsonb),
  ('announcement_enabled', 'true'::jsonb),
  ('announcement_text', '"Viu no TikTok ou Instagram? Encontre o produto aqui"'::jsonb),
  ('announcement_url', '"#ultimos-links"'::jsonb),
  ('coverflow_title', '"Últimos produtos dos vídeos"'::jsonb),
  ('coverflow_subtitle', '"Os itens marcados como Produto do vídeo aparecem primeiro. Toque na foto para abrir."'::jsonb),
  ('primary_color', '"#d96f82"'::jsonb),
  ('secondary_color', '"#fff2f4"'::jsonb)
on conflict (key) do update set value = excluded.value;
