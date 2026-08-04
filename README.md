# H&S Achadinhos — Social Luxe V6

Catálogo de produtos da Shopee para divulgação por TikTok, Instagram, Shopee Vídeo e link da bio.

## Tecnologias

- Next.js 15
- React 19
- TypeScript
- Supabase: banco, autenticação e armazenamento
- Vercel: hospedagem

## Recursos públicos

- Busca por nome ou código do vídeo
- Sugestões durante a digitação
- Produto do vídeo atual em destaque
- Categorias com imagem ou emoji
- Produtos recentes e mais acessados
- Filtros e ordenação
- Galeria de imagens
- Redirecionamento com contagem de cliques
- Footer somente com redes sociais ativas
- Interface responsiva

## H&S Studio

- Dashboard com visitas, cliques e pesquisas
- Produtos e galeria de imagens
- Categorias visuais
- Editor da página inicial
- Identidade visual
- Banners
- Menus e redes sociais
- Biblioteca de mídia
- Páginas
- SEO
- Analytics

## Variáveis de ambiente

Crie `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Nunca use a chave `service_role` ou `sb_secret_` no projeto público.

## Atualização da V6

Leia `ATUALIZACAO-V6.md` e execute somente:

```text
supabase/migrations/006_social_luxe.sql
```

As migrações anteriores já devem estar instaladas no projeto existente.

## Desenvolvimento

```bash
npm install
npm run dev
```

## Verificação

```bash
npm run typecheck
npm run build
```
