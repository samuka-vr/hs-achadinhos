# Manifesto do projeto

## Identificação

- Nome: H&S Achadinhos Final
- Aplicação: catálogo de links afiliados da Shopee
- Framework: Next.js App Router
- Banco, Auth e Storage: Supabase
- Hospedagem: Vercel

## Rotas públicas

- `/` — página inicial.
- `/catalogo` — catálogo paginado.
- `/busca?q=` — resultados de pesquisa.
- `/categoria/[slug]` — categoria.
- `/produto/[slug]` — produto.
- `/[pageSlug]` — páginas institucionais publicadas.
- `/go/[id]` — redirecionamento seguro e registro de clique.
- `/api/catalog` — consulta paginada pública.
- `/robots.txt` — regras de indexação.
- `/sitemap.xml` — mapa do site.

## Rotas administrativas

- `/admin/login`
- `/admin`
- `/admin/produtos`
- `/admin/produtos/importar`
- `/admin/categorias`
- `/admin/midia`
- `/admin/editor`
- `/admin/banners`
- `/admin/navegacao`
- `/admin/paginas`
- `/admin/aparencia`
- `/admin/analytics`
- `/admin/controle`
- `/admin/atividade`
- `/admin/configuracoes`

## Componentes públicos principais

- `Header` e `MobileMenu`
- `SearchBox`
- `HeroProductCarousel`
- `SafeProductImage`
- `CategoryStories`
- `ProductCard`, `ProductGrid` e `ProductRail`
- `ProductExplorer`
- `ProductGallery`
- `BannerCarousel`
- `Footer`
- `PageTracker`

## Componentes administrativos principais

- `AdminShell`
- `ProductsAdmin`
- `BulkImportAdmin`
- `CategoriesAdmin` e `CategoryAliasesAdmin`
- `MediaAdmin`
- `SiteBuilderAdmin`
- `BannersAdmin`
- `NavigationAdmin`
- `PagesAdmin`
- `AppearanceAdmin`
- `AnalyticsAdmin`
- `ActivityAdmin`
- `ControlCenterAdmin`
- `SettingsAdmin`

## Tabelas utilizadas

- `profiles`
- `categories`
- `category_aliases`
- `products`
- `product_images`
- `product_clicks`
- `site_settings`
- `home_sections`
- `banners`
- `navigation_items`
- `content_pages`
- `search_events`
- `page_views`
- `admin_activity_logs`
- `site_snapshots`

## Funções/RPC principais

- `is_admin`
- `register_product_click`
- `register_search_event`
- `register_page_view`
- `admin_restore_main_categories`
- `admin_reset_catalog`
- `admin_publish_ready_drafts`
- `admin_move_all_to_draft`
- `admin_delete_products_without_images`

## Buckets

- `product-images`
- `site-assets`

## Variáveis

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `AFFILIATE_ALLOWED_DOMAINS`

## Scripts

- `npm run dev`
- `npm run lint`
- `npm run test`
- `npm run audit:project`
- `npm run typecheck`
- `npm run build`
- `npm run check`
- `npm run start`

## Testes e auditorias

- Sintaxe TypeScript/TSX.
- Chaves duplicadas em objetos.
- Marcadores incompletos.
- Imports locais.
- Estrutura do ZIP/projeto.
- Ausência de versões antigas e artefatos.
- Paginação de seis produtos.
- Arquitetura do coverflow.
- Footer acessível.
- Ausência de notas internas na consulta pública.

## Integrações

- Supabase PostgreSQL, Auth e Storage.
- Vercel.
- Shopee por redirecionamento seguro.
- Redes sociais configuradas pelo painel.

## Funcionalidades

- Busca por nome e código.
- Catálogo por categoria.
- Paginação incremental.
- Produtos em destaque e recentes.
- Links afiliados.
- Gestão completa de produtos.
- Importação em massa.
- Gestão de imagens.
- Gestão de categorias e aliases.
- Editor da home e conteúdo.
- Aparência e SEO.
- Analytics e atividades.
- Exportação e snapshots lógicos.

## H&S Studio reorganizado

Rotas administrativas principais:

- `/admin` — visão geral;
- `/admin/produtos` — produtos;
- `/admin/produtos/importar` — importação;
- `/admin/categorias` — categorias e aliases;
- `/admin/midia` — biblioteca de imagens;
- `/admin/editor` — página inicial;
- `/admin/banners` — banners;
- `/admin/navegacao` — menus e redes;
- `/admin/paginas` — páginas institucionais;
- `/admin/aparencia` — cores, botões, fontes e componentes;
- `/admin/analytics` — métricas;
- `/admin/buscas` — termos sem resultado e limpeza;
- `/admin/controle` — manutenção e cópias;
- `/admin/atividade` — histórico;
- `/admin/configuracoes` — marca, conteúdo e SEO.

Migration adicional não destrutiva:

- `003_admin_studio_reset.sql` — exclusão administrativa segura de buscas sem resultado.
