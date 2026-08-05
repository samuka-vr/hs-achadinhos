-- H&S Achadinhos V8 — Central de Controle
-- Execute uma vez no Supabase SQL Editor.
-- Esta migração NÃO apaga produtos nem categorias.

begin;

-- Configurações adicionais controladas pelo próprio painel.
insert into public.site_settings(key, value)
values
  ('maintenance_mode', 'false'::jsonb),
  ('maintenance_title', '"Estamos organizando novos achadinhos"'::jsonb),
  ('maintenance_message', '"Voltamos em breve. Acompanhe nossas redes sociais para novidades."'::jsonb),
  ('catalog_empty_title', '"Nenhum produto encontrado"'::jsonb),
  ('catalog_empty_message', '"Tente outra busca ou escolha uma categoria."'::jsonb),
  ('footer_social_title', '"Acompanhe a H&S"'::jsonb),
  ('footer_social_subtitle', '"Novos achadinhos e vídeos nas nossas redes."'::jsonb),
  ('admin_notes', '""'::jsonb),
  ('button_style', '"rounded"'::jsonb),
  ('product_image_ratio', '"square"'::jsonb),
  ('section_spacing', '72'::jsonb),
  ('animations_enabled', 'true'::jsonb),
  ('shadow_strength', '8'::jsonb)
on conflict (key) do nothing;

-- Campos de operação do catálogo.
alter table public.products add column if not exists internal_notes text;
alter table public.products add column if not exists publish_at timestamptz;
alter table public.products add column if not exists unpublish_at timestamptz;
alter table public.products add column if not exists import_source text;

create index if not exists products_publish_schedule_idx
  on public.products(is_active, publish_at, unpublish_at);

-- Apelidos de categorias usados pelo importador.
create table if not exists public.category_aliases (
  id uuid primary key default gen_random_uuid(),
  alias text not null,
  normalized_alias text generated always as (
    lower(trim(translate(alias,
      'ÁÀÂÃÄáàâãäÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇç',
      'AAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCc'
    ))) stored,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(normalized_alias)
);
create index if not exists category_aliases_category_idx on public.category_aliases(category_id);

-- Histórico automático do painel.
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
create index if not exists admin_activity_created_idx on public.admin_activity_logs(created_at desc);
create index if not exists admin_activity_entity_idx on public.admin_activity_logs(entity_type, entity_id);

-- Cópias de segurança salvas pelo painel.
create table if not exists public.site_snapshots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  snapshot jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists site_snapshots_created_idx on public.site_snapshots(created_at desc);

alter table public.category_aliases enable row level security;
alter table public.admin_activity_logs enable row level security;
alter table public.site_snapshots enable row level security;

-- RLS: somente administradores.
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

-- Triggers de updated_at.
drop trigger if exists category_aliases_set_updated_at on public.category_aliases;
create trigger category_aliases_set_updated_at before update on public.category_aliases
for each row execute function public.set_updated_at();

-- Função utilitária: registra ações automáticas sem depender do frontend.
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
    return coalesce(new, old);
  end if;

  row_data := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  row_id := coalesce(row_data->>'id', row_data->>'key', row_data->>'slug');
  row_label := coalesce(row_data->>'name', row_data->>'title', row_data->>'label', row_data->>'key', tg_table_name);

  insert into public.admin_activity_logs(actor_id, action, entity_type, entity_id, summary, metadata)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    row_id,
    row_label,
    jsonb_build_object('operation', tg_op)
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

-- Histórico das principais áreas editáveis.
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

-- Cria ou restaura as sete categorias oficiais, sem apagar produtos.
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
    ('Casa & Cozinha','casa-cozinha','🏠',null,'Cozinha, decoração, iluminação e soluções para a casa.','#D98B83',10,true),
    ('Limpeza & Organização','limpeza-organizacao','🧼',null,'Limpeza, lavanderia, organização e utilidades do dia a dia.','#78A694',20,true),
    ('Eletrônicos','eletronicos','🎧',null,'Áudio, carregadores, cabos, acessórios e segurança eletrônica.','#7E91B8',30,true),
    ('Beleza & Bem-estar','beleza-bem-estar','✨',null,'Beleza, cuidados pessoais, cabelo e bem-estar.','#C97A9B',40,true),
    ('Automotivo','automotivo','🚗',null,'Acessórios, organização e limpeza para carros.','#8C8F98',50,true),
    ('Pet','pet','🐾',null,'Produtos e acessórios para cães, gatos e outros pets.','#C59669',60,true),
    ('Moda & Lazer','moda-lazer','🎮',null,'Moda, games, lazer e utilidades variadas.','#8C78B4',70,true)
  on conflict (slug) do update set
    name = excluded.name,
    icon = excluded.icon,
    description = excluded.description,
    accent_color = excluded.accent_color,
    sort_order = excluded.sort_order,
    is_active = true;
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

-- Redefine todo o catálogo pelo próprio painel.
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

  delete from public.products;
  delete from public.categories;
  perform public.admin_restore_main_categories();

  insert into public.admin_activity_logs(actor_id, action, entity_type, summary, metadata)
  values (auth.uid(), 'reset', 'catalog', 'Catálogo redefinido pelo painel',
    jsonb_build_object('deleted_products', product_total, 'deleted_categories', category_total));

  return jsonb_build_object('ok', true, 'deleted_products', product_total, 'deleted_categories', category_total);
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
declare
  affected integer;
begin
  if not public.is_admin(auth.uid()) then raise exception 'Acesso negado'; end if;
  update public.products set is_active = true
  where is_active = false and image_url is not null and affiliate_url is not null;
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
declare
  affected integer;
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
declare
  affected integer;
begin
  if not public.is_admin(auth.uid()) then raise exception 'Acesso negado'; end if;
  delete from public.products where image_url is null or trim(image_url) = '';
  get diagnostics affected = row_count;
  return jsonb_build_object('ok', true, 'deleted', affected);
end;
$$;
revoke all on function public.admin_delete_products_without_images() from public;
grant execute on function public.admin_delete_products_without_images() to authenticated;

-- Semear apelidos oficiais. A edição posterior é feita no próprio painel.
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
select a.alias, c.id
from aliases a
join public.categories c on c.slug = a.category_slug
on conflict (normalized_alias) do update set category_id = excluded.category_id;

commit;
