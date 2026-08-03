# H&S Achadinhos

Catálogo simples de produtos com links de afiliado da Shopee, busca instantânea, categorias, painel administrativo, upload de imagens, estatísticas e rastreamento de cliques.

## O que já está pronto

- Site público responsivo e mobile-first.
- Busca com sugestões em tempo real.
- Categorias, produtos em alta, novidades e filtros.
- Página individual com produtos relacionados e compartilhamento.
- Redirecionamento seguro para a oferta com contagem de clique.
- Painel `/admin` protegido por Supabase Auth.
- Cadastro, edição, ativação, duplicação e exclusão de produtos.
- Cadastro e gerenciamento de categorias.
- Upload de imagens para Supabase Storage ou uso de URL externa.
- Dashboard com cliques de hoje, 7 e 30 dias, ranking e gráfico.
- Configurações do nome, banner, redes e paginação.
- RLS e políticas de segurança no banco.
- Política de privacidade e aviso de afiliado.

## 1. Criar o projeto no Supabase pelo celular

1. Abra `https://supabase.com/dashboard` no navegador.
2. Toque em **New project**.
3. Escolha sua organização, informe um nome como `hs-achadinhos`, crie uma senha forte para o banco e escolha uma região próxima.
4. Aguarde o projeto ficar pronto.
5. No menu esquerdo, abra **SQL Editor**.
6. Toque em **New query**.
7. Abra o arquivo `supabase/migrations/001_initial.sql` deste projeto, copie todo o conteúdo, cole no editor e toque em **Run**.

## 2. Criar o administrador

1. No Supabase, abra **Authentication** > **Users**.
2. Toque em **Add user** > **Create new user**.
3. Digite seu e-mail e uma senha forte. Marque o e-mail como confirmado.
4. Volte ao **SQL Editor** e execute, trocando o e-mail:

```sql
insert into public.profiles (id, role)
select id, 'admin'
from auth.users
where email = 'SEU_EMAIL_AQUI'
on conflict (id) do update set role = 'admin';
```

Não existe cadastro público de administradores no site.

## 3. Pegar as chaves do Supabase

1. Abra **Project Settings** > **API**.
2. Copie **Project URL**.
3. Copie a chave pública **anon** ou **publishable**.
4. Nunca use a `service_role` no site.

## 4. Rodar no computador

```bash
cp .env.example .env.local
npm install
npm run dev
```

Edite `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Acesse `http://localhost:3000` e o painel em `http://localhost:3000/admin/login`.

## 5. Publicar usando apenas o celular

### GitHub

1. Abra `https://github.com/new`.
2. Crie um repositório chamado `hs-achadinhos`.
3. Use um aplicativo como GitHub Mobile, Spck Editor ou Acode para enviar os arquivos, ou extraia o ZIP e use a opção de upload pelo navegador em modo desktop.

### Vercel

1. Abra `https://vercel.com/new`.
2. Entre com o GitHub.
3. Selecione o repositório `hs-achadinhos`.
4. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` com o domínio final, por exemplo `https://hs-achadinhos.vercel.app`
5. Toque em **Deploy**.
6. Depois da publicação, atualize `NEXT_PUBLIC_SITE_URL` com a URL definitiva e faça um novo deploy.

## 6. Cadastrar produtos

1. Entre em `/admin/login`.
2. Abra **Produtos** > **Novo produto**.
3. Informe nome, categoria e o link de afiliado HTTPS.
4. Envie uma imagem de até 5 MB ou cole uma URL pública.
5. Preço, descrição, palavras-chave e selo são opcionais.
6. Salve. O produto aparece automaticamente no site quando estiver ativo.

## Segurança

- A chave pública do Supabase pode ficar no frontend; a segurança real está nas regras RLS incluídas na migration.
- Somente usuários listados em `profiles` com `role = admin` podem alterar catálogo e configurações.
- O público vê apenas produtos e categorias ativos.
- Cliques são registrados por uma função segura do banco.
- O sistema não coleta IP completo e não possui pagamento ou dados de cartão.
- Use senha forte e ative MFA no Supabase quando disponível para sua conta.

## Comandos úteis

```bash
npm run dev
npm run typecheck
npm run build
npm start
```

## Estrutura principal

```text
src/app/                 páginas públicas, painel e rota de redirecionamento
src/components/          componentes de interface e CRUD
src/lib/                 tipos, utilitários e clientes Supabase
supabase/migrations/     banco, RLS, funções e dados iniciais
```
