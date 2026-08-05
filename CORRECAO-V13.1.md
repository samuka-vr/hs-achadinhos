# Correção V13.1 — build Vercel

Corrige o import de estilo público em `src/app/(site)/layout.tsx` e restaura `src/app/styles/gallery-v13.css`.

A causa era a remoção de `public-redesign.css` enquanto o layout publicado ainda tentava importá-lo.
