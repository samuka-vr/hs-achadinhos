# Publicação pelo celular

## 1. Preparar o repositório

1. Abra o GitHub no navegador.
2. Crie um repositório vazio chamado `hs-achadinhos` ou limpe o repositório atual.
3. Abra **Code > Codespaces > Create codespace on main**.
4. No terminal, confirme que está na raiz do projeto.

## 2. Enviar os arquivos

Extraia `hs-achadinhos-final.zip` no celular ou no Codespaces. O arquivo `package.json` precisa ficar na raiz, ao lado de `src`, `public` e `supabase`.

No terminal:

```bash
npm install
npm run check
```

O primeiro `npm install` criará `package-lock.json`. Envie esse arquivo junto com o restante do projeto.

## 3. GitHub

```bash
git add -A
git commit -m "Publicar H&S Achadinhos Final"
git push origin main
```

## 4. Vercel

1. Abra a Vercel.
2. Escolha **Add New > Project**.
3. Importe o repositório.
4. Framework: Next.js.
5. Cadastre as variáveis descritas em `.env.example`.
6. Clique em **Deploy**.
7. Depois do status **Ready**, abra o domínio e teste home, catálogo, produto e admin.

## 5. Desfazer um deploy

Na Vercel, abra **Deployments**, escolha o deploy anterior que estava funcionando e use **Promote to Production**. No GitHub, também é possível reverter o último commit pelo Codespaces.
