# Ginásio Municipal de Vila Flor

Versão mobile-first em HTML, CSS e JavaScript puro.

## Estrutura
- `index.html` — estrutura da aplicação
- `css/style.css` — estilos principais
- `css/responsive.css` — adaptação a ecrãs
- `js/equipamentos.js` — catálogo de equipamentos
- `js/treino.js` — registo e progressão do treino
- `js/navegacao.js` — páginas e navegação
- `js/app.js` — inicialização

## Abrir
Não precisa de npm, React ou Vite.

No VS Code instala a extensão **Live Server**, abre `index.html` e escolhe **Open with Live Server**.

Também podes simplesmente abrir o `index.html` no navegador.

## Funcionalidade de treino
Os registos são guardados no `localStorage` do navegador. Cada registo contém:
- nome do exercício
- peso
- séries
- repetições
- data

A função `progression()` compara os dois últimos registos do mesmo exercício.
