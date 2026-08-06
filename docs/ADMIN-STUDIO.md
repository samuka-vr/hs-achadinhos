# H&S Studio — painel administrativo

O painel foi reorganizado em cinco áreas:

- **Principal:** visão geral, pendências e atalhos.
- **Catálogo:** produtos, importação, categorias e biblioteca de imagens.
- **Site:** página inicial, banners, menus, redes, páginas e aparência.
- **Resultados:** analytics e buscas sem resultado.
- **Sistema:** central de controle, histórico e configurações gerais.

## Navegação mobile

No celular, a barra inferior mantém os atalhos para Visão geral, Produtos e Aparência. O botão **Mais** abre o menu completo em uma gaveta. A busca de funções pode ser aberta pelo topo ou pelo menu.

## Aparência do site

A rota `/admin/aparencia` permite personalizar:

- cores principais;
- fundo, superfícies, textos e bordas;
- botão principal e cor ao tocar;
- texto do botão principal;
- botão secundário e seu texto;
- links;
- cores de sucesso e exclusão;
- fontes;
- cards de produtos;
- colunas do catálogo;
- cabeçalho;
- animações.

As mudanças usam a tabela `site_settings`, que já é do tipo chave/valor. Não é necessário adicionar colunas ao banco.

## Buscas sem resultado

A rota `/admin/buscas` agrupa as palavras pesquisadas que não retornaram produtos. É possível:

- filtrar palavras;
- ver quantidade de tentativas;
- abrir a lista de produtos com a palavra pesquisada;
- excluir um termo específico;
- limpar todos os termos sem resultado.

A exclusão nunca remove produtos, categorias, visitas ou buscas que tiveram resultado.

## Migration necessária

Execute uma vez:

```text
supabase/migrations/003_admin_studio_reset.sql
```

Ela cria a função protegida `delete_zero_result_searches`, disponível somente para usuários autenticados com perfil de administrador, além de um índice parcial para acelerar a listagem.
