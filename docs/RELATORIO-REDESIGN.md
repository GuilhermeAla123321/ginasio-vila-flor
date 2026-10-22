# Relatório — Auditoria e redesign premium (22/10/2026)

Branch Git: `redesign/premium-ui` (o branch `main` ficou intacto).

## 1. Resumo

- Reescrita completa da camada visual como **design system** (tokens de cor,
  tipografia, espaço, raio, sombra e movimento; tema escuro e claro), mantendo
  todas as classes e IDs usados pelos scripts.
- `css/style.css`: de ~10 000 linhas com 846 `!important` (mais ~770 linhas de CSS
  injetado por `treino.js`) para ~5 200 linhas organizadas com 19 `!important`.
- Identidade Vila Flor refinada: framboesa/ameixa do logótipo, linha geométrica da
  flor no destaque do Início, fonte **Jost** (geometria próxima do logótipo) para
  títulos e números.
- Movimento com **GSAP** (local) e escala de tokens **Transitions.dev**, sempre
  condicionado a `prefers-reduced-motion` e sem tocar no Timer.
- `alert`/`confirm`/`prompt` nativos substituídos por avisos e diálogos acessíveis.
- Nova suite de testes (`node tests/run-tests.js`, 27 testes, todos a passar).

## 2. Alterações visuais e de experiência

- Layout alinhado à esquerda (antes quase tudo centrado), hierarquia clara por página,
  sem rótulos "eyebrow" em maiúsculas por cima dos títulos.
- Navegação: barra inferior com indicador em cápsula (telemóvel); **barra lateral**
  em computador (≥1024 px); conteúdo até 880 px; grelhas de 2/3/4 colunas.
- Início: destaque com gradiente da marca, estado **"Aberto agora / Fechado agora"**
  calculado a partir do horário da página Informação, zonas com fotografia,
  comodidades num único bloco.
- Equipamentos: filtros Todos/Musculação/Cardio (o código já os suportava, mas o HTML
  não os tinha), cartões com imagem em fundo claro, atalho para a biblioteca.
- Meu treino: seletor de dias segmentado com indicador deslizante e marca do dia de
  hoje; exercícios como linhas dentro do treino (sem cartões dentro de cartões);
  ações com ícones; estados vazios explicativos.
- Folhas (bottom sheets) no telemóvel e diálogos centrados em ecrãs largos.
- Progressão: linha temporal (mais recente primeiro) e comparação real do último
  registo com o anterior (máximo por parâmetro e diferença).
- Timer: anel com gradiente da marca (âmbar→framboesa; verde-água em curso),
  dígitos grandes tabulares, faixa de seleção fixa na roda, botões de 56 px.
- Informação: acordeões agrupados com ícones, horário de hoje destacado.
- Ícones Unicode (×, ★, ⌕, ←, ✓, ✦, 🔒, ☾/☀) substituídos por SVG do mesmo traço.
- Superfícies do browser tematizadas (seleção, cursor, barras de scroll, foco).

## 3. Alterações técnicas e ficheiros

| Ficheiro | Alteração |
| --- | --- |
| `css/style.css` | Reescrito (design system). |
| `css/responsive.css` | Removido (estava vazio). |
| `index.html` | Reestruturado mantendo IDs/conteúdos; scripts inline passados para ficheiros; ícones SVG; `data-days`/`data-hours` no horário. |
| `js/ui.js` (novo) | Ícones, toasts, diálogos (`<dialog>`), estado "Hoje", linha da barra superior. |
| `js/motion.js` (novo) | GSAP: entrada de páginas, folhas, indicador dos dias, acordeões, micro-interação da navegação. |
| `js/install.js` (novo) | Pop-up de instalação (antes inline; mesma lógica). |
| `js/treino.js` | Diálogos/avisos, ícones, aviso de domingo, marca de hoje, confirmação ao remover exercício, comparação na progressão, sinónimos de pesquisa, fecho animado das folhas, remoção do CSS injetado, **correção de um bug** (ver §8). |
| `js/equipamentos.js` | Sem estilos inline; nome escapado; filtros repostos ao voltar; atalho global oculto dentro de um equipamento. |
| `js/navegacao.js` | Legível; `aria-current`; animação de entrada. |
| `js/tema.js` | Ícone sol/lua via CSS; `theme-color` alinhado com o tema. |
| `sw.js` | Cache `v69`; shell com os novos ficheiros, fontes e GSAP; `.woff2` em cache. |
| `lib/vendor/gsap.min.js` | GSAP 3.12.5 (cdnjs), local. |
| `assets/fonts/*.woff2` | Jost (Google Fonts, OFL), local. |
| `tests/run-tests.js` | Nova suite; antigos em `tests/legacy/`. |
| `README.md`, `docs/` | Documentação. |

Lógica de negócio inalterada: chaves do `localStorage`, formato dos dados, migração
para múltiplos treinos, limites (4 treinos/dia, 8 séries ao criar, 30 ao editar),
validações, catálogo, associação de vídeos e Timer.

## 4. Funcionalidades de treino, biblioteca, timer, histórico e vídeos

- Remover um exercício pede agora confirmação (apagava também o histórico com um toque).
- Eliminar treino e apagar exercício criado usam diálogos acessíveis com o mesmo texto.
- Renomear treino usa um diálogo com campo de texto (antes `prompt`).
- Pesquisa: "rosca" → curl, "glúteos", "corrida", "alongamentos".
- Exercício personalizado: o nome escrito na pesquisa é pré-preenchido.
- Vídeos: mantidos carregamento diferido, libertação, fallback por nome+equipamento,
  zoom; estados de carregamento e "sem demonstração" redesenhados.

## 5. PWA e offline

- `CACHE_NAME` `vf-ginasio-v68` → `v69`; as estratégias (rede primeiro para HTML/CSS/JS
  e manifesto de vídeos; cache primeiro para imagens) mantêm-se.
- O shell passa a incluir `dicas.js` (antes em falta), `ui.js`, `motion.js`,
  `install.js`, GSAP, fontes, a flor da marca e as duas fotografias das zonas.
- Vídeos MP4 continuam **sem** cache offline (comportamento original).

## 6. Skills utilizadas

- **Impeccable** — contexto do projeto (`impeccable context`), referências
  *craft-floor*, *operate* e *polish*; detetor executado no fim (corrigidos contraste
  no hover, títulos saltados, ícone em "tile" e easing com ressalto).
- **GSAP** (gsap-core) — `js/motion.js`: `fromTo`/`timeline`, `autoAlpha`,
  `clearProps`, `overwrite: "auto"`; ScrollTrigger não foi usado (sem uso justificado
  numa app de tarefas).
- **Transitions.dev** — escala de tokens de duração/curva/distância/escala/desfoque
  em `:root`; padrões aplicados: menu dropdown, modal, toast, troca de ícone, troca
  de texto (dicas), *success check* (fim do timer), *error shake* (timer a zero),
  tabs deslizantes (dias), acordeão (chevron `scaleY(-1)`), checkbox.

## 7. Testes executados

Automáticos — `node tests/run-tests.js`: **27/27**.

Manuais no browser (servidor local, dados de teste numa origem própria, nunca nos
dados reais do utilizador), em 320, 360, 375, 390 e 1280 px, tema escuro e claro:
migração do formato antigo + cópia de segurança; dias; adicionar treino (limite 4);
renomear; filtro; eliminar treino; adicionar exercício da biblioteca (pesquisa,
favorito, séries, gravar); exercício personalizado em 2 passos; filtro "Criados" e
apagar criado; filtros por músculo/máquina/favoritos; atualizar exercício (novo
registo no histórico); progressão; remover exercício (cancelar e confirmar);
persistência após recarregar; equipamentos, filtros, página de equipamento; QR
`?equipamento=`; biblioteca global (pesquisa, grupo); vídeo (carrega ao abrir,
liberta ao fechar, zoom, Escape); Timer (definir, iniciar, pausar, retomar,
conclusão, fecho automático do aviso, reiniciar); Informação (acordeões, horário de
hoje, mapa); tema; ausência de scroll horizontal; consola sem erros da app.

## 8. Problemas encontrados e limitações

Pré-existentes (documentados; corrigido apenas o indicado):
- **Corrigido:** o campo "Nome do exercício" do diálogo personalizado não tinha `>`
  de fecho no HTML gerado, aninhando os restantes campos.
- Os 5 testes antigos já falhavam (valores fixos desatualizados) — arquivados.
- A pasta `assets/exercises/gifs/` não existe: o fallback GIF dos vídeos nunca
  funciona (só é usado se o vídeo falhar).
- 2 vídeos do manifesto (`dumbbell-shoulder-press`, `bulgarian-split-squat`) não
  estão ligados a nenhum exercício visível.
- O aviso de domingo estava vazio no código; foi preenchido com uma nota informativa
  (não bloqueia o planeamento).
- A app bloqueia o zoom por pinça (`gesturestart`), o que prejudica a acessibilidade;
  mantido por ser comportamento intencional anterior.
- Os horários no código (Seg–Sex 16:00–**20:30**, Sáb 15:00–**19:00**) diferem dos do
  pedido; mantidos os do código por decisão do responsável.

Não testado (limitação do ambiente):
- Instalação da PWA, atualização do Service Worker e modo offline real: o browser
  embutido usado nos testes recusa registar Service Workers. A lógica do SW foi
  testada em Node (instalação, limpeza de caches antigas e respostas sem rede).
- Envio real do formulário de feedback (enviaria um email).
- Alertas push (OneSignal sem `appId` configurado).
- Dispositivos iOS/Android reais e `prefers-reduced-motion` ativo.

O detetor do Impeccable mantém um aviso intencional: as linhas da lista agrupada da
página Informação encostam ao fundo do grupo (cada linha tem o seu próprio
espaçamento interno, como numa lista de definições do sistema).

## 9. Correções pós-revisão (22/10/2026)

- **Cor principal:** reposto o roxo original do projeto, recuperado do CSS anterior no
  Git (`--vf-purple: #68406f`, `--vf-purple-dark: #4d2d59`, `--vf-purple-light: #a184b4`).
  O acento framboesa introduzido no redesign foi removido de botões, destaques, ícones,
  indicadores, navegação, foco e destaque do Início. Repostos também o gradiente
  original do símbolo da marca, o `theme-color` (`#6a3b61`, `#f4f5fb`/`#0b1020`) e os
  gradientes originais do anel do Timer (`#7c4dff → #3fa9f5`; em curso `#2ecc8f → #3fa9f5`).
- **Alinhamento:** títulos, descrições e textos auxiliares das secções centrados
  (cabeçalhos das páginas, destaque do Início, factos, filtros, cabeçalho do
  equipamento, cartões da biblioteca, barra do dia em Meu treino).
- **Equipamentos:** o subtítulo de «Todos os exercícios» aparecia ao lado do título
  (regra `.hero-btn > span`); corrigido com seletores mais específicos.
- **Imagem da Polia Multifuncional:** o quadrado da imagem era uma grelha CSS, onde a
  altura `100%` da imagem não era respeitada; imagens verticais (a polia, 157×250)
  saíam do quadrado e desalinhavam o cartão. O quadrado passou a bloco com
  `overflow: hidden`; todas as imagens ficam contidas (60×60 px dentro de 72×72 px),
  sem cortes nem deformação. O ficheiro e a associação já estavam corretos.
- Cache do Service Worker: `v70`. Testes: 28/28.
