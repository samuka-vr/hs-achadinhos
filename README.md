# H&S Achadinhos — Studio V5

Catálogo profissional para produtos divulgados em vídeos, com links de afiliado da Shopee e painel administrativo completo.

## Site público

- Página inicial montada por blocos e reordenável pelo painel.
- Busca por nome, categoria ou código informado no vídeo.
- Produtos dos vídeos em carrossel ou grade.
- Categorias em círculos ou cartões com imagem, emoji e descrição.
- Banners com versões para computador e celular.
- Catálogo com filtros e ordenação.
- Páginas individuais com galeria, compartilhamento, código e produtos relacionados.
- Páginas institucionais e páginas personalizadas.
- Cabeçalho, menu mobile, rodapé e redes sociais configuráveis.
- SEO geral e SEO por produto/página.
- Rastreamento de visitas, buscas e cliques.

## Painel administrativo

Acesse `/admin/login`.

- **Visão geral:** métricas, atalhos e itens para revisar.
- **Produtos:** cadastro completo, rascunhos, código do vídeo, fixação, galeria, preço, tags e SEO.
- **Categorias:** imagem, emoji, cor, descrição, ordem e visibilidade.
- **Banners:** imagens desktop/mobile, CTA, alinhamento, overlay, período e ordem.
- **Páginas:** Sobre, Privacidade e páginas próprias.
- **Editor da página:** ativa, oculta, duplica e reordena blocos da home.
- **Aparência:** cores, fontes, largura, arredondamento, cabeçalho, cartões e CSS.
- **Menus e links:** cabeçalho, menu mobile e rodapé.
- **Mídia:** reutilização e exclusão de imagens enviadas.
- **Analytics:** visitas, cliques, pesquisas, termos sem resultado e origem.
- **Configurações e SEO:** logo, favicon, redes, avisos, rodapé e compartilhamento.

## Banco de dados

Para um projeto novo, execute as migrations em ordem:

```text
001_initial.sql
002_professional_redesign.sql
003_clean_experience.sql
004_link_bio_focus.sql
005_studio_builder.sql
```

Para o site que já estava na V4, execute apenas `005_studio_builder.sql`.

## Variáveis da Vercel

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
NEXT_PUBLIC_SITE_URL=https://SEU-DOMINIO.vercel.app
```

Nunca use a chave `service_role` ou uma chave `sb_secret_` no projeto.

## Desenvolvimento

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

## Segurança

- Escrita protegida por Supabase Auth e RLS.
- Somente perfis com `role = admin` alteram o site.
- Produtos, categorias, banners, páginas e menus só ficam públicos quando ativos.
- Cliques, buscas e visitas são registrados por funções controladas no banco.
- O redirecionamento aceita apenas links HTTPS.
- O projeto não processa pagamentos nem recebe dados de cartão.
