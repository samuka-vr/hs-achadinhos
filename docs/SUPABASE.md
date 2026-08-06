# Supabase

## Projeto já existente

A aplicação foi preparada para continuar usando o banco atual. Não execute `001_schema.sql` em uma base que já contém as tabelas do H&S Achadinhos.

O arquivo `002_existing_database_fixes.sql` é idempotente e serve somente para completar estruturas ausentes. Faça uma cópia de segurança antes de executá-lo e use-o apenas quando a auditoria do banco indicar que algo está faltando.

## Projeto novo

1. Crie um projeto no Supabase.
2. Abra **SQL Editor**.
3. Execute `supabase/migrations/001_schema.sql` uma única vez.
4. Em **Authentication > Users**, crie o usuário administrador.
5. No SQL Editor, vincule o usuário à tabela `profiles` com papel `admin`.
6. Confirme os buckets `product-images` e `site-assets` em **Storage**.

## Variáveis

Copie a URL e a chave `anon` em **Project Settings > API**. Nunca use a chave `service_role` no navegador ou na Vercel como variável pública.

## Criar administrador

Depois de criar o usuário no Auth, execute, substituindo o UUID:

```sql
insert into public.profiles (id, role)
values ('UUID_DO_USUARIO', 'admin')
on conflict (id) do update set role = excluded.role;
```

## Segurança

As tabelas administrativas usam Row Level Security. A interface do painel não é a barreira principal: as policies do banco impedem alterações por usuários sem papel de administrador.
