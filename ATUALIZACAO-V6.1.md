# H&S Achadinhos V6.1

Esta atualização corrige os pontos solicitados sem apagar dados existentes.

## O que mudou

- Removida a segunda barra de pesquisa da seção “Todos os produtos”.
- A busca principal continua no topo da página.
- O bloco de apresentação virou um carrossel automático de produtos.
- O carrossel mostra imagem, nome, preço, código e botão para a Shopee.
- O menu das três barras foi refeito e agora abre acima de todo o site.
- O menu fecha ao tocar fora, no botão X ou em um link.
- O footer agora existe sempre e mostra apenas links sociais.
- Adicionado campo “Vitrine Shopee” no painel administrativo.
- Instagram, TikTok e Vitrine Shopee podem ser configurados em:
  `/admin/configuracoes` → `Redes e contato`.

## Banco de dados

Execute o arquivo:

`supabase/migrations/007_carousel_menu_footer.sql`

## Atualização pelo Codespaces

```bash
git pull --rebase origin main
rm -rf atualizacao
unzip -o hs-achadinhos-v6.1.zip -d atualizacao
cp -a atualizacao/hs-achadinhos-v6.1/. .
rm -rf atualizacao hs-achadinhos-v6.1.zip
npm install
npm run typecheck
npm run build
git add .
git commit -m "Aplicar ajustes V6.1"
git pull --rebase origin main
git push origin main
```

## Configurar o footer

Abra:

`https://SEU-SITE.vercel.app/admin/configuracoes`

Entre em `Redes e contato` e preencha:

- Instagram
- TikTok
- Vitrine Shopee

Campos vazios não criam botões no footer.
