-- H&S Achadinhos — atualização segura para uma base já existente
-- Não use em uma base vazia. Faça backup antes de executar.

begin;

alter table public.categories add column if not exists description text;
alter table public.categories add column if not exists accent_color text default '#d96c78';
alter table public.products add column if not exists internal_notes text;
alter table public.products add column if not exists publish_at timestamptz;
alter table public.products add column if not exists unpublish_at timestamptz;
alter table public.products add column if not exists import_source text;

-- Corrige a coluna gerada da migration administrativa caso a tabela ainda não exista.
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

alter table public.category_aliases enable row level security;
alter table public.admin_activity_logs enable row level security;
alter table public.site_snapshots enable row level security;

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

-- Anotações administrativas deixam de ser visíveis publicamente.
drop policy if exists "settings_public_read" on public.site_settings;
create policy "settings_public_read" on public.site_settings for select to anon, authenticated using (key <> 'admin_notes' or public.is_admin());

-- Publicações agendadas passam a ser respeitadas pelo catálogo público.
drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products for select to anon, authenticated using (
  public.is_admin() or (
    is_active = true
    and (publish_at is null or publish_at <= now())
    and (unpublish_at is null or unpublish_at > now())
  )
);

create or replace function public.admin_restore_main_categories()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare affected integer := 0;
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
      ('Limpeza','limpeza-organizacao'),('Limpeza e Lavanderia','limpeza-organizacao'),('Organização','limpeza-organizacao'),('Organização e Escritório','limpeza-organizacao'),
      ('Eletrônicos','eletronicos'),('Eletrônicos e Áudio','eletronicos'),('Eletrônicos e Carregadores','eletronicos'),('Eletrônicos e Cabos','eletronicos'),('Eletrônicos e Limpeza','eletronicos'),('Segurança e Eletrônicos','eletronicos'),
      ('Beleza','beleza-bem-estar'),('Saúde e Bem-estar','beleza-bem-estar'),('Beleza Masculina','beleza-bem-estar'),('Organização e Beleza','beleza-bem-estar'),('Beleza e Cabelo','beleza-bem-estar'),('Beleza e Cuidados Pessoais','beleza-bem-estar'),
      ('Automotivo','automotivo'),('Limpeza e Automotivo','automotivo'),('Automotivo e Organização','automotivo'),
      ('Pet','pet'),('Lavanderia e Pet','pet'),('Moda','moda-lazer'),('Games','moda-lazer'),('Utilidades','moda-lazer'),('Moda e Lazer','moda-lazer')
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
declare product_total integer; category_total integer;
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

create or replace function public.register_page_view(p_path text, p_referrer text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
declare clean_path text := left(coalesce(nullif(trim(p_path), ''), '/'), 240);
begin
  if clean_path like '/admin%' then return; end if;
  insert into public.page_views(path, referrer, user_agent) values (clean_path, left(p_referrer, 300), left(p_user_agent, 180));
end;
$$;
revoke all on function public.register_page_view(text, text, text) from public;
grant execute on function public.register_page_view(text, text, text) to anon, authenticated;

create or replace function public.register_search_event(p_query text, p_results_count integer default 0, p_referrer text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if length(trim(coalesce(p_query, ''))) < 2 then return; end if;
  insert into public.search_events(query, results_count, referrer, user_agent)
  values (left(trim(p_query), 120), least(greatest(coalesce(p_results_count, 0), 0), 10000), left(p_referrer, 300), left(p_user_agent, 180));
end;
$$;
revoke all on function public.register_search_event(text, integer, text, text) from public;
grant execute on function public.register_search_event(text, integer, text, text) to anon, authenticated;

create or replace function public.register_product_click(p_product_id uuid, p_referrer text default null, p_user_agent text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists(select 1 from public.products where id=p_product_id and is_active=true and (publish_at is null or publish_at<=now()) and (unpublish_at is null or unpublish_at>now())) then return; end if;
  insert into public.product_clicks(product_id, referrer, user_agent) values (p_product_id, left(p_referrer, 300), left(p_user_agent, 180));
  update public.products set click_count=click_count+1 where id=p_product_id;
end;
$$;
revoke all on function public.register_product_click(uuid, text, text) from public;
grant execute on function public.register_product_click(uuid, text, text) to anon, authenticated;

commit;
