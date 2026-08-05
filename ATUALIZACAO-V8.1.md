# H&S Achadinhos V8.1 — Painel de produtos mobile

Esta atualização reconstrói a administração de produtos para uso pelo celular.

## O que mudou

- Lista mobile em cartões, sem tabela espremida ou rolagem lateral.
- Nome completo do produto visível, sem cortes.
- Foto maior em cada produto.
- Botão direto **Adicionar foto / Trocar foto** em cada cartão.
- Upload rápido da capa sem precisar abrir o editor completo.
- Botões grandes para **Editar produto** e **Fotos**.
- Ações secundárias organizadas em um menu expansível.
- Busca por nome completo, código ou categoria.
- Filtros recolhíveis e atalhos para Sem foto, Rascunhos e Publicados.
- Seleção em massa adaptada ao celular.
- Barra de ações em massa fixa acima da navegação inferior.
- Editor de produto em tela cheia no celular.
- Cabeçalho, abas e botões de salvar fixos no editor.
- Campo de nome em área maior para visualizar e editar títulos longos.
- Editor de imagens com opções Galeria, Câmera, URL e Remover capa.
- Galeria de fotos reorganizada para toque.
- No computador, a tabela continua disponível e agora tem atalho específico para imagens.

## Supabase

Não é necessário executar SQL nesta atualização.

## Instalação

Envie `hs-achadinhos-v8.1-mobile-admin.zip` para a raiz do repositório e execute no Codespaces:

```bash
git pull --rebase origin main

rm -rf atualizacao
unzip -o hs-achadinhos-v8.1-mobile-admin.zip -d atualizacao
cp -a atualizacao/. .
rm -rf atualizacao hs-achadinhos-v8.1-mobile-admin.zip

npm install
npm run typecheck
npm run build

git add .
git commit -m "Melhorar painel de produtos no mobile V8.1"
git pull --rebase origin main
git push origin main
```

Depois do deploy, abra `/admin/produtos` e teste em uma aba anônima.
