# H&S Achadinhos V6 — Social Luxe Minimal

Esta versão reconstrói a interface pública e o H&S Studio sem apagar produtos, categorias, usuários, imagens ou analytics.

## Principais mudanças

- Nova home focada em quem veio do link da bio.
- Busca principal com nome ou código.
- Produto do vídeo atual destacado automaticamente.
- Categorias em círculos elegantes.
- Cards de produto alinhados e mais limpos.
- Carrosséis suaves e responsivos.
- Footer contendo apenas redes sociais ativas.
- Menu mobile em folha inferior, com busca e categorias.
- Novo painel H&S Studio com navegação profissional.
- Dashboard reorganizado com métricas, atalhos e alertas.
- Editor, aparência, produtos e categorias com visual mais consistente.
- Paleta oficial Social Luxe Minimal.

## Instalação

1. No Supabase, abra **SQL Editor** e execute `supabase/migrations/006_social_luxe.sql`.
2. Envie o ZIP ao GitHub.
3. No Codespaces, extraia os arquivos sobre o projeto atual.
4. Execute `npm install`, `npm run typecheck` e `npm run build`.
5. Faça commit e push. A Vercel publicará automaticamente.

## Comandos sugeridos

```bash
git pull --rebase origin main
rm -rf atualizacao
unzip -o hs-achadinhos-v6-social-luxe.zip -d atualizacao
cp -a atualizacao/hs-achadinhos-v6-social-luxe/. .
rm -rf atualizacao hs-achadinhos-v6-social-luxe.zip
npm install
npm run typecheck
npm run build
git add .
git commit -m "Aplicar Social Luxe V6"
git pull --rebase origin main
git push origin main
```
