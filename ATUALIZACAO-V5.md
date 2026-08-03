# Atualização H&S Achadinhos — Studio V5

Esta atualização transforma o projeto em uma vitrine modular com controle central pelo painel.

## 1. Banco de dados

No Supabase, abra **SQL Editor → New query**, cole todo o conteúdo de:

`supabase/migrations/005_studio_builder.sql`

Toque em **Run** e aguarde `Success`.

## 2. Arquivos no GitHub

Envie `hs-achadinhos-v5-studio.zip` para a raiz do repositório e confirme o commit.

## 3. Codespaces

Abra um terminal novo e execute o bloco abaixo:

```bash
git pull --rebase origin main
rm -rf atualizacao
unzip -o hs-achadinhos-v5-studio.zip -d atualizacao
cp -a atualizacao/hs-achadinhos/. .
rm -rf atualizacao hs-achadinhos-v5-studio.zip
npm install
npm run typecheck
npm run build
git add .
git commit -m "Aplicar H&S Studio V5"
git pull --rebase origin main
git push origin main
```

A Vercel fará um novo deploy automaticamente.

## Novas áreas do painel

- Visão geral e alertas de cadastro
- Produtos com código do vídeo, rascunho, fixação, galeria e SEO
- Categorias com imagem, emoji, cor, descrição e ordem
- Banners agendados para computador e celular
- Páginas próprias, incluindo Sobre e Privacidade
- Editor modular da página inicial
- Aparência, temas, tipografia, cartões e CSS personalizado
- Menus do cabeçalho, celular e rodapé
- Biblioteca de mídia
- Analytics de visitas, cliques, pesquisas e termos sem resultado
- Marca, redes sociais, rodapé e SEO geral
