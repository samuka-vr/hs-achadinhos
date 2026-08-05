# H&S Achadinhos — Órbita de Achados + H&S Studio

Aplicação completa para organizar produtos divulgados em vídeos e direcionar visitantes aos links oficiais de afiliado da Shopee.

Esta edição mantém o banco, as rotas e as funções do catálogo, mas substitui toda a apresentação pública e administrativa por uma interface nova, mobile-first e menos carregada.

## O que existe no projeto

### Site público

- busca por nome ou código, com sugestões;
- destaque com um produto completo por vez no celular;
- categorias principais;
- produtos dos vídeos, novidades, mais acessados e catálogo;
- filtros, ordenação e carregamento progressivo;
- páginas de categoria, busca, produto e conteúdo;
- links externos validados;
- sitemap, robots, metadados e estados de erro/carregamento;
- interface responsiva desde 360 px.

### H&S Studio

- autenticação Supabase;
- dashboard operacional;
- cadastro, edição, publicação e ações em massa;
- troca rápida e galeria de imagens;
- importador em massa por texto;
- categorias e nomes alternativos;
- mídia, banners, páginas, navegação e redes sociais;
- editor da página inicial e aparência;
- analytics, atividades e central de controle.

## Stack

- Next.js 15.5.22
- React 19.1.1
- TypeScript 5.8.3
- Supabase Database, Auth e Storage
- Vercel

## Instalação

```bash
npm install
cp .env.example .env.local
npm run dev
```

Preencha em `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
AFFILIATE_ALLOWED_DOMAINS=
```

Nunca use a chave `service_role` no frontend ou em variáveis `NEXT_PUBLIC_*`.

## Banco de dados

Para uma base nova, execute somente:

```text
supabase/migrations/001_schema.sql
```

Em uma base que já recebeu as versões anteriores, execute somente:

```text
supabase/migrations/002_existing_database_fixes.sql
```

A atualização segura:

- corrige a redefinição do catálogo;
- impede leitura pública das anotações administrativas;
- faz o agendamento de publicação ser respeitado;
- reduz dados coletados por analytics;
- não apaga produtos ao ser executada.

Faça backup do banco antes de qualquer migration.

## Verificação antes do deploy

```bash
npm run lint
npm run typecheck
npm run build
```

O comando completo é:

```bash
npm run check
```

## Deploy na Vercel

1. Envie os arquivos extraídos para a raiz do repositório.
2. Cadastre as variáveis de ambiente na Vercel.
3. Confirme que o Root Directory está vazio ou aponta para a raiz.
4. Faça o deploy.
5. Verifique a home, a busca, um produto, o redirecionamento e o login administrativo.

## Segurança e limitações

- Os links de produto passam por allowlist da Shopee.
- Links configuráveis no conteúdo são limitados a caminhos internos ou HTTPS.
- O acesso aos dados administrativos depende das policies RLS do Supabase.
- Analytics próprio pode sofrer tentativas de manipulação; métricas devem ser tratadas como indicativas.
- Backups reais do banco e do Storage precisam ser configurados separadamente no Supabase ou em outro serviço.
- Nenhum sistema web deve ser tratado como totalmente livre de riscos; mantenha dependências e policies revisadas.

## Revisão desta entrega

Antes do empacotamento foram verificados:

- sintaxe de todos os arquivos TypeScript e TSX;
- imports locais e nomes de ícones;
- chaves duplicadas em objetos;
- referências entre código, tabelas e funções RPC;
- equilíbrio estrutural dos arquivos CSS;
- delimitadores e blocos das migrations SQL;
- URLs públicas e redirecionamentos de afiliado;
- uploads de imagem com limite, MIME permitido e assinatura real do arquivo;
- ausência de ZIPs, caches e documentos de versões antigas.

A instalação completa e o build precisam ser executados no ambiente do projeto com acesso ao npm. Use `npm install` e depois `npm run check` antes do deploy.
