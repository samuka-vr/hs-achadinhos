# H&S Achadinhos V7 — Importador em massa

## O que foi adicionado

- Nova área **Produtos → Importar produtos** no H&S Studio.
- Campo para colar listas com vários produtos.
- Leitura automática de nome, categoria, descrição, valor e link.
- Reconhecimento de preço único, faixa de preço e “a partir de”.
- Geração automática de código `A001`, `A002` e assim por diante.
- Tela de revisão e edição antes de salvar.
- Criação automática de categorias que ainda não existem.
- Detecção de links já cadastrados.
- Opção de ignorar ou atualizar produtos duplicados.
- Importação como rascunho ou publicado.
- Produtos podem ser importados sem imagem e receber as fotos depois.
- Filtro **Sem imagem** na página de produtos.
- Atalho no dashboard e no topo do catálogo.

## Supabase

Esta atualização **não precisa de nenhum SQL novo**. Ela usa as tabelas `products` e `categories` que já existem no projeto.

## Atualização pelo Codespaces

Envie o arquivo `hs-achadinhos-v7-importador.zip` para a raiz do repositório e execute:

```bash
git pull --rebase origin main
rm -rf atualizacao
unzip -o hs-achadinhos-v7-importador.zip -d atualizacao
cp -a atualizacao/hs-achadinhos-v7-importador/. .
rm -rf atualizacao hs-achadinhos-v7-importador.zip
npm install
npm run typecheck
npm run build
git add .
git commit -m "Adicionar importador em massa V7"
git pull --rebase origin main
git push origin main
```

Depois do deploy, abra:

```text
https://hs-achadinhos.vercel.app/admin/produtos/importar
```

## Fluxo recomendado

1. Cole a lista completa.
2. Toque em **Analisar produtos**.
3. Revise os dados e possíveis duplicados.
4. Mantenha o status como **Rascunho** enquanto os produtos estiverem sem imagem.
5. Toque em **Importar produtos**.
6. Abra **Produtos**, filtre por **Sem imagem** e envie as fotos.
7. Publique os produtos depois de adicionar as imagens.
