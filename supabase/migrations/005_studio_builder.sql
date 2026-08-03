-- H&S Achadinhos V5 — Studio de personalização e controle total
-- Execute uma única vez no SQL Editor do Supabase.

alter table public.categories add column if not exists description text;
alter table public.categories add column if not exists accent_color text default '#e87378';

alter table public.products add column if not exists product_code text;
alter table public.products add column if not exists is_video_product boolean not null default false;
alter table public.products add column if not exists is_pinned boolean not null default false;
alter table public.products add column if not exists video_url text;
alter table public.products add column if not exists video_posted_at timestamptz;
alter table public.products add column if not exists sort_order integer not null default 0;
alter table public.products add column if not exists seo_title text;
alter table public.products add column if not exists seo_description text;

create unique index if not exists products_code_unique_idx
  on public.products(lower(product_code)) where product_code is not null and product_code <> '';
create index if not exists products_video_sort_idx
  on public.products(is_video_product, is_pinned, video_posted_at desc, sort_order);

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
  text_color text not null default '#242223',
  overlay_strength integer not null default 15 check (overlay_strength between 0 and 90),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text not null,
  location text not null default 'header' check (location in ('header','mobile','footer')),
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  open_new_tab boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

create index if not exists home_sections_sort_idx on public.home_sections(is_enabled, sort_order);
create index if not exists banners_active_sort_idx on public.banners(is_active, sort_order);
create index if not exists navigation_location_sort_idx on public.navigation_items(location, is_active, sort_order);
create unique index if not exists navigation_unique_item_idx on public.navigation_items(location, label, url);
create index if not exists content_pages_published_idx on public.content_pages(is_published, sort_order);
create index if not exists search_events_date_idx on public.search_events(searched_at desc);
create index if not exists page_views_date_idx on public.page_views(viewed_at desc);

alter table public.home_sections enable row level security;
alter table public.banners enable row level security;
alter table public.navigation_items enable row level security;
alter table public.content_pages enable row level security;
alter table public.search_events enable row level security;
alter table public.page_views enable row level security;

-- Leitura pública e alteração somente por admin.
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
  values (left(trim(p_query), 160), greatest(p_results_count, 0), left(p_referrer, 500), left(p_user_agent, 500));
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
begin
  insert into public.page_views(path, referrer, user_agent)
  values (left(coalesce(p_path, '/'), 300), left(p_referrer, 500), left(p_user_agent, 500));
end;
$$;
revoke all on function public.register_page_view(text, text, text) from public;
grant execute on function public.register_page_view(text, text, text) to anon, authenticated;

-- Triggers de updated_at.
drop trigger if exists home_sections_set_updated_at on public.home_sections;
create trigger home_sections_set_updated_at before update on public.home_sections for each row execute function public.set_updated_at();
drop trigger if exists banners_set_updated_at on public.banners;
create trigger banners_set_updated_at before update on public.banners for each row execute function public.set_updated_at();
drop trigger if exists navigation_set_updated_at on public.navigation_items;
create trigger navigation_set_updated_at before update on public.navigation_items for each row execute function public.set_updated_at();

drop trigger if exists content_pages_set_updated_at on public.content_pages;
create trigger content_pages_set_updated_at before update on public.content_pages for each row execute function public.set_updated_at();

-- Estrutura inicial da home. Pode ser reordenada pelo painel.
insert into public.home_sections(section_key, section_type, title, subtitle, eyebrow, is_enabled, sort_order, settings)
values
  ('hero', 'hero', 'Encontre o produto do vídeo', 'Digite o nome ou o código que apareceu no conteúdo.', 'Link da bio', true, 10, '{"layout":"compact","show_search":true,"show_steps":true}'::jsonb),
  ('banners', 'banners', '', '', '', true, 20, '{"autoplay":true,"interval":5000,"height":"medium"}'::jsonb),
  ('video-products', 'video_products', 'Produtos dos últimos vídeos', 'Os links mais recentes ficam primeiro.', 'Viu no vídeo?', true, 30, '{"limit":12,"layout":"rail"}'::jsonb),
  ('categories', 'categories', 'Categorias', 'Escolha uma área para encontrar mais rápido.', '', true, 40, '{"limit":12,"style":"stories"}'::jsonb),
  ('newest', 'newest', 'Acabaram de chegar', 'Novos achadinhos adicionados ao catálogo.', '', true, 50, '{"limit":8,"columns":4}'::jsonb),
  ('trending', 'trending', 'Mais acessados', 'Os produtos que mais chamaram atenção.', '', true, 60, '{"limit":8,"columns":4}'::jsonb),
  ('catalog', 'catalog', 'Todos os produtos', 'Use a busca ou filtre por categoria.', '', true, 70, '{"page_size":24}'::jsonb)
on conflict (section_key) do nothing;

insert into public.navigation_items(label, url, location, icon, sort_order)
values
  ('Início', '/', 'header', 'home', 10),
  ('Produtos dos vídeos', '/#produtos-dos-videos', 'header', 'sparkles', 20),
  ('Categorias', '/#categorias', 'header', 'categories', 30),
  ('Todos os produtos', '/#produtos', 'header', 'products', 40),
  ('Sobre', '/sobre', 'footer', 'tag', 10),
  ('Privacidade', '/privacidade', 'footer', 'shield', 20)
on conflict (location, label, url) do nothing;


insert into public.content_pages(slug, eyebrow, title, subtitle, body, button_text, button_url, seo_title, seo_description, is_published, sort_order)
values
  ('sobre', 'SOBRE A H&S', 'Achadinhos organizados para você encontrar rápido', 'Reunimos em um só lugar os produtos mostrados nos nossos vídeos.', 'A H&S Achadinhos nasceu para simplificar uma coisa que costuma dar trabalho: encontrar novamente aquele produto que apareceu em um vídeo. Aqui você pode pesquisar pelo nome, usar o código informado no conteúdo ou navegar por categorias.

Os links levam para a Shopee, onde preço, estoque, frete e pagamento são confirmados. Alguns links podem gerar comissão de afiliado, sem custo extra para você.', '', '', 'Sobre a H&S Achadinhos', 'Conheça a H&S Achadinhos e veja como encontrar os produtos divulgados nos nossos vídeos.', true, 10),
  ('privacidade', 'INFORMAÇÕES', 'Privacidade e transparência', 'Entenda quais informações o site registra e como os links de afiliado funcionam.', 'Registramos dados técnicos básicos, como páginas acessadas, pesquisas realizadas e cliques nos produtos, para entender o que funciona e melhorar a organização do catálogo. Não vendemos dados pessoais.

Ao tocar em um produto, você é direcionado para a Shopee. A compra, o pagamento, o frete, o estoque e o atendimento do pedido acontecem na plataforma da Shopee. Alguns links são de afiliado e podem gerar uma comissão para a H&S Achadinhos, sem aumentar o preço para você.', '', '', 'Privacidade | H&S Achadinhos', 'Informações sobre privacidade, analytics e links de afiliado da H&S Achadinhos.', true, 20)
on conflict (slug) do nothing;

-- Atualiza limites dos buckets para imagens maiores, mantendo o acesso público.
update storage.buckets set file_size_limit = 8388608 where id in ('site-assets','product-images');

-- Novas opções visuais e de conteúdo.
insert into public.site_settings(key, value)
values
  ('background_color', '"#fffdfc"'::jsonb),
  ('surface_color', '"#ffffff"'::jsonb),
  ('text_color', '"#242223"'::jsonb),
  ('muted_text_color', '"#746d70"'::jsonb),
  ('border_color', '"#eee5e3"'::jsonb),
  ('accent_color', '"#f4b5b3"'::jsonb),
  ('button_text_color', '"#ffffff"'::jsonb),
  ('font_family', '"Inter"'::jsonb),
  ('heading_font_family', '"Inter"'::jsonb),
  ('container_width', '1200'::jsonb),
  ('corner_radius', '18'::jsonb),
  ('card_style', '"soft"'::jsonb),
  ('header_style', '"compact"'::jsonb),
  ('sticky_header', 'true'::jsonb),
  ('show_header_search', 'true'::jsonb),
  ('show_prices', 'true'::jsonb),
  ('show_product_codes', 'true'::jsonb),
  ('show_click_count', 'false'::jsonb),
  ('product_columns_mobile', '2'::jsonb),
  ('product_columns_desktop', '4'::jsonb),
  ('footer_title', '"Seus achadinhos em um só lugar"'::jsonb),
  ('footer_note', '"Alguns links podem gerar comissão de afiliado, sem custo extra para você."'::jsonb),
  ('seo_title', '"H&S Achadinhos | Produtos encontrados na Shopee"'::jsonb),
  ('seo_description', '"Encontre os produtos divulgados nos nossos vídeos e acesse os links direto na Shopee."'::jsonb),
  ('og_image_url', '"/brand/hs-logo.png"'::jsonb),
  ('custom_css', '""'::jsonb)
on conflict (key) do nothing;
