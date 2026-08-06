# Rollback e recuperação

## Código

Antes de publicar mudanças grandes, crie um commit. Para voltar ao commit anterior no Codespaces:

```bash
git log --oneline -10
git revert ID_DO_COMMIT
git push origin main
```

## Vercel

Abra o deploy anterior aprovado e use **Promote to Production**.

## Banco

Não reverta banco apagando tabelas. Use uma cópia exportada pelo painel ou os backups do Supabase. Teste a restauração em um projeto separado antes de mexer na produção.

## Imagens

Os arquivos ficam nos buckets do Supabase Storage. Inclua esses buckets na política de backup. Exportar apenas o JSON do painel não copia os arquivos físicos.
