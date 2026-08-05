# Atualização — Interface Definitiva H&S Achadinhos

Esta atualização substitui toda a aparência pública e administrativa, mantendo os mecanismos e o banco de dados existentes.

## Antes de começar

Crie um ponto seguro no GitHub:

```bash
git add .
git commit -m "Backup antes da interface definitiva"
git push origin main
```

## Aplicação do pacote

Depois de enviar `hs-achadinhos-interface-definitiva.zip` para a raiz do repositório, execute:

```bash
git pull --rebase origin main

rm -rf atualizacao-interface
unzip -o hs-achadinhos-interface-definitiva.zip -d atualizacao-interface
cp -a atualizacao-interface/. .
rm -rf atualizacao-interface hs-achadinhos-interface-definitiva.zip

npm install
npm run typecheck
npm run build

git add .
git commit -m "Reconstruir interfaces pública e administrativa"
git pull --rebase origin main
git push origin main
```

## Banco de dados

Não execute SQL novo. As migrations e os mecanismos atuais foram preservados.

## Conferência obrigatória após o deploy

### Site público

- página inicial;
- busca por nome e código;
- carrossel;
- sete categorias;
- catálogo e filtros;
- página individual de produto;
- botão de acesso à Shopee;
- menu mobile;
- footer e redes sociais.

### Painel administrativo

- login;
- dashboard;
- lista e edição de produtos;
- troca rápida de imagem;
- importador em massa;
- categorias e aliases;
- biblioteca de mídia;
- editor da página inicial;
- aparência;
- banners;
- menus e redes;
- páginas;
- analytics;
- controle e histórico.

## Rollback

Caso o deploy apresente algum problema:

```bash
git log --oneline -10
git revert HEAD
git push origin main
```

Também é possível restaurar o deploy anterior no painel da Vercel.
