# H&S Achadinhos V7.5 — Categorias principais

## O que mudou

- O importador não cria mais uma categoria para cada texto recebido.
- Cada item é agrupado automaticamente em uma das 7 categorias principais.
- A categoria original fica guardada nas tags do produto.
- A revisão mostra “Categoria informada” e “Categoria principal”.
- É possível trocar manualmente a categoria principal antes de importar.

## Categorias oficiais

1. Casa & Cozinha
2. Limpeza & Organização
3. Eletrônicos
4. Beleza & Bem-estar
5. Automotivo
6. Pet
7. Moda & Lazer

## Banco de dados

Execute `supabase/migrations/008_reset_main_categories.sql` no SQL Editor.

ATENÇÃO: esse SQL apaga todos os produtos e categorias atuais. Ele preserva usuários, configurações, páginas, banners e redes sociais.

## Atualização do projeto

Depois de enviar o ZIP ao GitHub, execute no Codespaces:

```bash
git pull --rebase origin main
rm -rf atualizacao
unzip -o hs-achadinhos-v7.5-categorias.zip -d atualizacao
cp -a atualizacao/. .
rm -rf atualizacao hs-achadinhos-v7.5-categorias.zip
npm install
npm run typecheck
npm run build
git add .
git commit -m "Aplicar categorias principais V7.5"
git pull --rebase origin main
git push origin main
```
