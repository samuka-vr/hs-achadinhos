# H&S Achadinhos V8 — Control Studio

A V8 transforma o painel em uma central de gerenciamento completa. As operações que antes exigiam SQL agora podem ser feitas no próprio site.

## 1. Execute a migração no Supabase

Abra **Supabase → SQL Editor → New query**, cole todo o arquivo abaixo e toque em **Run**:

`supabase/migrations/009_admin_control_center.sql`

A migração não apaga produtos nem categorias. Ela adiciona:

- Central de controle;
- redefinição segura do catálogo pelo painel;
- restauração das 7 categorias oficiais;
- nomes alternativos editáveis para o importador;
- histórico automático de alterações;
- cópias de segurança;
- modo manutenção;
- anotações internas;
- ferramentas de publicação em massa.

## 2. Atualize os arquivos

Envie o ZIP ao GitHub e execute no Codespaces:

```bash
git pull --rebase origin main
rm -rf atualizacao
unzip -o hs-achadinhos-v8-control-studio.zip -d atualizacao
cp -a atualizacao/. .
rm -rf atualizacao hs-achadinhos-v8-control-studio.zip
npm install
npm run typecheck
npm run build
git add .
git commit -m "Aplicar H&S Control Studio V8"
git pull --rebase origin main
git push origin main
```

## 3. Novas páginas

- `/admin/controle` — site, catálogo, manutenção, redes, backup e operações;
- `/admin/atividade` — histórico automático de alterações;
- `/admin/categorias` — categorias e nomes alternativos do importador.

## Operação do catálogo pelo painel

Em **Central de controle → Catálogo**, você poderá:

- restaurar as sete categorias oficiais;
- publicar todos os rascunhos que já possuem imagem;
- mover todo o catálogo para rascunho;
- excluir produtos sem imagem;
- apagar produtos e categorias e recomeçar com as categorias oficiais.

A ação de redefinição exige digitar `CONFIRMAR`.

## Backups

Em **Central de controle → Backup**:

- baixe o projeto em JSON;
- baixe os produtos em CSV;
- salve cópias dentro do Supabase;
- baixe ou exclua cópias salvas.

## Observação

A instalação das dependências e o build completo devem ser executados no Codespaces. Este ambiente não disponibilizou o pacote do Supabase no registro npm interno.
