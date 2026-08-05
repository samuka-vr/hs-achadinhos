# H&S Achadinhos V7.3 — Carrossel inteligente

## Alterações

- reprodução automática real;
- troca infinita sem salto ao voltar do último para o primeiro;
- gesto de deslizar para os lados no celular;
- arrastar com mouse no computador;
- ordem aleatória estável durante a sessão;
- seleção aleatória de até 8 produtos que possuem imagem;
- pausa durante toque, arraste, foco, hover ou aba em segundo plano;
- retomada automática após a interação;
- botão para pausar/continuar;
- barra visual do tempo até a próxima troca;
- animações suaves na foto e nas informações;
- contador e indicadores de posição;
- respeito à configuração de movimento reduzido;
- prevenção de abertura acidental do produto durante o swipe.

## Banco de dados

Esta atualização não exige SQL no Supabase.

## Instalação

Envie `hs-achadinhos-v7.3-carousel.zip` para a raiz do repositório e execute no Codespaces:

```bash
git pull --rebase origin main
rm -rf atualizacao
unzip -o hs-achadinhos-v7.3-carousel.zip -d atualizacao
cp -a atualizacao/hs-achadinhos-v7.3-carousel/. .
rm -rf atualizacao hs-achadinhos-v7.3-carousel.zip
npm install
npm run typecheck
npm run build
git add .
git commit -m "Melhorar carrossel de produtos V7.3"
git pull --rebase origin main
git push origin main
```
