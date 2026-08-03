# Atualização V4 — Link da bio

Esta versão corrige o menu móvel e reorganiza a página inicial para quem chega pelos vídeos do TikTok, Instagram ou Shopee.

## Mudanças principais

- Menu móvel com altura total da tela, rolagem própria e links sempre visíveis.
- Mensagem inicial clara: o visitante entende que o produto do vídeo está no site.
- Busca visível logo no primeiro bloco da página.
- Seção “Últimos produtos dos vídeos” no começo.
- Produtos marcados como “Produto do vídeo” aparecem primeiro.
- Cores mais suaves e naturais.
- Remoção definitiva da navegação inferior antiga.
- Textos do painel administrativo mais claros.

## Atualização

1. Execute `supabase/migrations/004_link_bio_focus.sql` no SQL Editor do Supabase.
2. Substitua os arquivos do projeto pelos desta versão.
3. Rode `npm install`, `npm run typecheck` e `npm run build`.
4. Faça commit e push para a branch `main`.
