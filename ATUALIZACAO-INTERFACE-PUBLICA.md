# H&S Achadinhos — Interface pública mobile-first

Esta entrega substitui somente a camada visual pública. O painel administrativo, as tabelas, as migrations, a autenticação, a busca, o catálogo e os links de afiliado foram preservados.

## Arquivos principais alterados

- `src/app/(site)/layout.tsx`
- `src/app/(site)/page.tsx`
- `src/app/(site)/public-redesign.css`
- `src/components/HeroProductCarousel.tsx`
- `src/components/ProductCard.tsx`
- `src/components/SafeProductImage.tsx`

## Correções principais

- nova paleta creme, rosa queimado e grafite;
- header com logo maior, alinhada à esquerda e dentro de uma superfície própria;
- hero mais compacto e com busca em destaque;
- carrossel com um card completo por vez no mobile;
- track do carrossel com cada slide medindo exatamente 100% do viewport interno;
- swipe, autoplay, pausa por interação, retomada, visibilidade da aba e movimento reduzido;
- controles, contador, progresso e indicadores reposicionados abaixo do card;
- título do destaque corrigido para não herdar tamanho incorreto;
- imagens com fallback quando ausentes ou quebradas;
- categorias organizadas em grid de duas colunas no mobile;
- cards de catálogo com nome, preço, código e dois botões sem overflow;
- redução de branco puro e melhor contraste entre seções.

## Atualização

Extraia o ZIP sobre o projeto atual, instale as dependências e execute:

```bash
npm install
npm run typecheck
npm run build
```

Depois faça commit e push para o GitHub. A Vercel criará o novo deploy automaticamente quando o repositório estiver conectado.

## Verificações executadas nesta entrega

- transpile de sintaxe TypeScript/TSX nos arquivos alterados;
- verificação de balanceamento das chaves do CSS;
- teste de integridade do ZIP.

O build completo não foi executado neste ambiente porque o registro npm disponível não contém `@supabase/supabase-js`. Execute o build no Codespaces antes do deploy de produção.
