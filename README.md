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
- `js/dicas.js` — apresentação das 50 dicas de treino no Timer

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


## Atualização de 31/10/2026 — Descansos do treino

O projeto tem agora um descanso geral em «Meu treino», duração padrão propagada para os intervalos entre séries, aviso local sonoro de cerca de 3 segundos e integração separada de notificações OneSignal para ambos os tipos de relógio. Para configurar notificações em segundo plano, consultar `docs/DESCANSO-GERAL-E-ALERTAS.md`.

## Duração personalizada (atualização de 31/10/2026)

Ambos os relógios mantêm os tempos predefinidos e têm a opção **Personalizar…**. Seleciona-a, introduz minutos e segundos (de 1 segundo até 99 min 59 s) e carrega em **Aplicar**. A duração geral fica guardada no navegador e é usada por defeito nos intervalos entre séries que não tenham sido alterados individualmente. Os avisos de 3 segundos e a integração das notificações mantêm-se. O serviço externo OneSignal continua a precisar de configuração para receber push com a aplicação em segundo plano.


## Atualização — duração por escrita direta e setas
Nos dois relógios, basta escrever **MM:SS** no campo (por exemplo `02:15` ou `0215`) e sair do campo ou premir Enter. As setas verticais sobem/descem **1 segundo por toque**. Os tempos predefinidos estão em pequenos atalhos sempre visíveis. Intervalos individuais mantêm as suas escolhas quando mudas a duração geral. Limites: `00:01` a `99:59`.
