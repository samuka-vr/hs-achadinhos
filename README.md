# H&S Achadinhos Final

Catálogo mobile-first para organizar produtos divulgados em vídeos e encaminhar visitantes aos links oficiais de afiliado da Shopee. O projeto inclui site público, busca por nome ou código, catálogo paginado, categorias, páginas de produto, analytics e o painel administrativo H&S Studio.

## Tecnologias

- Next.js 15 com App Router
- React 19
- TypeScript em modo estrito
- Supabase PostgreSQL, Auth e Storage
- Vercel
- CSS próprio, sem framework visual obrigatório

## O que já funciona

### Site público

- Home com hero, busca, atalhos e produto em destaque.
- Coverflow mobile com swipe nativo, autoplay, pausa durante interação, retomada, pausa fora da tela e pré-carregamento de imagens.
- Sete categorias principais, com quatro visíveis inicialmente na home.
- Produtos recentes limitados na home.
- Catálogo em `/catalogo`, carregando seis produtos por vez.
- Busca por nome e código.
- Filtros, ordenação e botão **Ver mais produtos**.
- Página de categoria e página individual do produto.
- Redirecionamento seguro para domínios oficiais da Shopee.
- Footer mobile com grupos recolhíveis.
- Páginas institucionais configuráveis.
- SEO, sitemap, robots e Open Graph.

### H&S Studio

- Login protegido por Supabase Auth e policies RLS.
- Dashboard.
- Cadastro, edição, publicação e ações em massa de produtos.
- Importador de listas de produtos.
- Categorias e aliases.
- Imagens e biblioteca de mídia.
- Editor da página inicial.
- Banners, páginas e redes sociais.
- Aparência.
- Analytics e atividades.
- Central de controle, exportações e snapshots lógicos.

## Estrutura

```text
src/
  app/
    (site)/           rotas públicas
    admin/            painel administrativo
    api/catalog/      paginação do catálogo
    go/[id]/          redirecionamento de afiliado
  components/         componentes públicos e administrativos
  lib/                catálogo, segurança, Supabase, tipos e utilidades
public/brand/          identidade da marca
supabase/migrations/   estrutura e ajustes seguros do banco
scripts/               auditorias do código e do projeto
tests/                 testes estáticos e estruturais
docs/                  Supabase, deploy mobile e rollback
```

A lista detalhada está em `PROJECT-MANIFEST.md`.

## Requisitos

- Node.js 20.9 ou superior
- npm
- Projeto Supabase
- Conta GitHub
- Conta Vercel

## Instalação

Na raiz do projeto:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra `http://localhost:3000`.

O primeiro `npm install` cria `package-lock.json`. Salve e envie esse arquivo ao GitHub para que os próximos ambientes possam usar `npm ci`.

## Variáveis de ambiente

Crie `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_PUBLICA
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com.br
AFFILIATE_ALLOWED_DOMAINS=
```

### Onde encontrar

1. Abra o Supabase.
2. Entre em **Project Settings > API**.
3. Copie **Project URL** para `NEXT_PUBLIC_SUPABASE_URL`.
4. Copie a chave pública **anon** para `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Informe o domínio final em `NEXT_PUBLIC_SITE_URL`.
6. `AFFILIATE_ALLOWED_DOMAINS` só é necessário para domínios oficiais adicionais, separados por vírgula.

Nunca use `service_role` em variável `NEXT_PUBLIC_*`.

## Configurar o Supabase

### Banco existente

O projeto foi feito para continuar com a base atual. Não execute `001_schema.sql` sobre uma base já preenchida.

Use `002_existing_database_fixes.sql` apenas quando alguma tabela, coluna, policy ou função estiver ausente. Faça backup antes. Consulte `docs/SUPABASE.md`.

### Banco novo

Execute `supabase/migrations/001_schema.sql` uma única vez no SQL Editor. Depois crie o administrador e confirme os buckets de Storage.

## Criar o administrador

1. Supabase > **Authentication > Users > Add user**.
2. Copie o UUID do usuário.
3. Execute:

```sql
insert into public.profiles (id, role)
values ('UUID_DO_USUARIO', 'admin')
on conflict (id) do update set role = excluded.role;
```

4. Acesse `/admin/login`.

## Storage

Buckets esperados:

- `product-images`: imagens dos produtos.
- `site-assets`: logo, favicon, banners e imagens institucionais.

Uploads comuns aceitam JPG, PNG, WEBP e GIF até 8 MB. SVG é bloqueado no fluxo comum de upload.

## Comandos

```bash
npm run dev              # desenvolvimento
npm run lint             # análise de sintaxe e padrões
npm run test             # testes do projeto
npm run audit:project    # auditoria de estrutura, imports e segredos
npm run typecheck        # TypeScript
npm run build            # build de produção
npm run check            # lint + testes + typecheck + build
npm run start            # servidor de produção
```

## Catálogo

O catálogo público carrega seis itens inicialmente. O botão **Ver mais produtos** busca mais seis pela rota `/api/catalog`, preservando busca, categoria e ordenação. A aplicação não baixa todos os produtos para apenas escondê-los.

## Coverflow

O destaque usa uma única arquitetura: rolagem horizontal nativa com snap. Não há mistura entre transform manual e um segundo mecanismo de rolagem.

- Swipe acompanha o dedo.
- Autoplay usa um único timeout.
- Pausa durante toque, foco, hover, aba oculta e quando sai da área visível.
- Retoma após a interação.
- Pré-carrega imagem anterior, atual e próxima.
- Respeita `prefers-reduced-motion`.

## Links de afiliado

O visitante abre `/go/ID_DO_PRODUTO`. O servidor confirma:

- produto publicado;
- URL HTTPS;
- domínio permitido;
- deduplicação temporária do clique.

Links públicos usam `nofollow sponsored noopener`.

## Segurança

- RLS nas tabelas do Supabase.
- Alterações administrativas exigem perfil `admin`.
- Chaves privadas não ficam no frontend.
- Redirecionamento usa allowlist.
- Upload valida tamanho, MIME e assinatura.
- Notas internas não fazem parte das consultas públicas do catálogo.
- Rotas administrativas usam `noindex`.
- Headers de segurança são aplicados no Next.js.

O painel também verifica a sessão no cliente para evitar exibição indevida. A proteção real dos dados continua nas policies do Supabase.

## Testar antes do deploy

```bash
npm install
npm run check
```

Confirme manualmente:

- home em 360, 390, 412 e 430 px;
- swipe, setas e autoplay do coverflow;
- busca por nome e A001;
- seis produtos e botão Ver mais;
- filtros e ordenação;
- página de produto e link Shopee;
- footer mobile;
- login e páginas principais do admin;
- upload e importador;
- console sem erro.

## GitHub pelo celular

Consulte `docs/DEPLOY-MOBILE.md`. Resumo:

```bash
npm install
npm run check
git add -A
git commit -m "Publicar H&S Achadinhos Final"
git push origin main
```

## Vercel

1. Importe o repositório.
2. Cadastre as quatro variáveis de ambiente.
3. Framework: Next.js.
4. Deploy.
5. Teste o endereço de preview.
6. Só depois promova para produção.

## Logs

- Vercel: projeto > Deployments > deploy > Logs.
- Supabase: Logs Explorer e Auth Logs.
- Navegador: DevTools > Console e Network.

Mensagens técnicas não devem ser exibidas aos visitantes; detalhes ficam nos logs do ambiente.

## Backup e restauração

O painel exporta JSON e CSV e pode salvar snapshots lógicos. Isso não substitui backup completo do PostgreSQL e do Storage. Consulte `docs/ROLLBACK.md`.

## Atualização segura

1. Crie commit antes da mudança.
2. Teste em preview/staging.
3. Rode `npm run check`.
4. Faça backup antes de migration.
5. Publique.
6. Teste home, catálogo, produto e admin.

## Administração pelo celular

O painel usa cards no lugar de tabelas apertadas, filtros recolhíveis, editor em tela cheia e botões com área de toque. Acesse `/admin` pelo navegador do celular depois de entrar.

## Limitações conhecidas

- O projeto depende da disponibilidade do Supabase, Vercel e Shopee.
- O preço da Shopee pode mudar depois da publicação.
- Exportação JSON não copia os arquivos físicos do Storage.
- A proteção de força bruta do login também depende das configurações do Supabase Auth.
- Um backup só é confiável depois de uma restauração testada.

## Painel administrativo reorganizado

O H&S Studio está dividido em Principal, Catálogo, Site, Resultados e Sistema. A navegação foi refeita para uso confortável no celular, com barra inferior, menu completo em gaveta e busca de funções.

A página **Aparência do site** permite alterar cores, botões, links, fontes, cards, colunas e cabeçalho sem editar código.

A página **Buscas sem resultado** permite visualizar e excluir palavras pesquisadas que não retornaram produtos. Para ativar a exclusão segura, execute uma vez:

```text
supabase/migrations/003_admin_studio_reset.sql
```

Essa migration não apaga produtos nem altera a estrutura existente do catálogo.
