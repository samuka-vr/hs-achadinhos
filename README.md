# H&S Achadinhos — Interface Definitiva

Reconstrução completa da camada visual do H&S Achadinhos, preservando os mecanismos existentes de catálogo, busca, produtos, categorias, importação, imagens, configurações e analytics.

## Conceito visual

### Site público — Caderno de Achados

Uma identidade editorial própria, baseada em papel quente, recortes controlados, marcações delicadas, rosa queimado, grafite e sálvia. O objetivo é destacar a busca e tornar a descoberta de produtos rápida, sem aparência de template de e-commerce.

### Painel administrativo — Ateliê H&S

Uma experiência operacional independente, conectada à mesma marca, mas mais neutra e objetiva. A navegação foi organizada por áreas e o uso no celular recebeu prioridade: cartões em vez de tabelas apertadas, nomes completos, ações grandes, menus em tela cheia e edição mais clara.

## O que foi reconstruído

- cabeçalho, hero, busca, categorias, catálogo e footer públicos;
- cards e páginas individuais de produtos;
- navegação e estados responsivos;
- shell completo do painel administrativo;
- dashboard, produtos, importador, categorias, mídia, editor da home, aparência, banners, páginas, analytics, controle e histórico;
- marca provisória em SVG, monograma e lockup;
- sistema visual completo em CSS responsivo;
- tratamento visual de preço fixo, faixa e “a partir de”.

## O que foi preservado

- estrutura Next.js existente;
- Supabase Auth, Database e Storage;
- tabelas, migrations e integrações atuais;
- busca, redirecionamento, contagem de cliques e analytics;
- CRUD, importador, seleção em massa e configurações do painel;
- rotas e dados já usados pelo site.

Nenhuma migration nova é necessária para aplicar esta reconstrução visual.

## Tecnologias

- Next.js 15
- React 19
- TypeScript
- Supabase
- Vercel

## Variáveis de ambiente

Crie `.env.local` usando `.env.example` como referência:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Nunca adicione a chave `service_role` ou chaves privadas ao frontend.

## Instalação

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

## Atualização pelo Codespaces

1. Faça backup ou crie um commit da versão atual.
2. Envie o ZIP da interface definitiva para a raiz do repositório.
3. Execute os comandos descritos em `ATUALIZACAO-INTERFACE-DEFINITIVA.md`.
4. Confira o deploy de Preview antes de promover para produção.

## Verificações realizadas neste pacote

- leitura sintática dos arquivos TypeScript e TSX: 62 arquivos, nenhum erro de sintaxe;
- validação estrutural do CSS: chaves e parênteses balanceados;
- remoção de mocks e documentos antigos de atualização;
- preservação das migrations existentes.

O build completo deve ser confirmado no Codespaces, pois o registro npm do ambiente usado para gerar este pacote não disponibilizou `@supabase/supabase-js`.
