-- H&S Achadinhos V7.5 — redefinir catálogo e categorias principais
-- ATENÇÃO: este script APAGA todos os produtos e todas as categorias atuais.
-- Ele também remove, por cascata, galerias e históricos de cliques ligados aos produtos.
-- Usuários, configurações do site, banners, páginas, redes sociais e pesquisas são preservados.

alter table public.categories add column if not exists description text;
alter table public.categories add column if not exists accent_color text default '#e87378';

begin;

-- Produtos precisam ser apagados primeiro porque possuem vínculo com categorias.
delete from public.products;

-- Agora as categorias antigas podem ser removidas.
delete from public.categories;

-- Cria somente as 7 categorias principais oficiais.
insert into public.categories (
  name,
  slug,
  icon,
  image_url,
  description,
  accent_color,
  sort_order,
  is_active
)
values
  (
    'Casa & Cozinha',
    'casa-cozinha',
    '🏠',
    null,
    'Cozinha, decoração, iluminação e soluções para a casa.',
    '#D98B83',
    1,
    true
  ),
  (
    'Limpeza & Organização',
    'limpeza-organizacao',
    '🧼',
    null,
    'Limpeza, lavanderia, organização e utilidades do dia a dia.',
    '#78A694',
    2,
    true
  ),
  (
    'Eletrônicos',
    'eletronicos',
    '🎧',
    null,
    'Áudio, carregadores, cabos, acessórios e segurança eletrônica.',
    '#7E91B8',
    3,
    true
  ),
  (
    'Beleza & Bem-estar',
    'beleza-bem-estar',
    '✨',
    null,
    'Beleza, cuidados pessoais, cabelo e bem-estar.',
    '#C97A9B',
    4,
    true
  ),
  (
    'Automotivo',
    'automotivo',
    '🚗',
    null,
    'Acessórios, organização e limpeza para carros.',
    '#8C8F98',
    5,
    true
  ),
  (
    'Pet',
    'pet',
    '🐾',
    null,
    'Produtos e acessórios para cães, gatos e outros pets.',
    '#C59669',
    6,
    true
  ),
  (
    'Moda & Lazer',
    'moda-lazer',
    '🎮',
    null,
    'Moda, games, lazer e utilidades variadas.',
    '#8C78B4',
    7,
    true
  );

commit;

-- Conferência: deve retornar exatamente 7 linhas.
select name, slug, icon, sort_order, is_active
from public.categories
order by sort_order;
