# Ginásio Municipal de Vila Flor — Descanso geral e entre séries

Versão 31/10/2026 — tempos personalizados

## O que foi acrescentado

- No início de «Meu treino» surge «Descanso do treino». A duração escolhida (tempos predefinidos ou um valor personalizado entre 1 segundo e 99 min 59 s) passa a ser a duração **padrão de todos os descansos entre séries**.
- O descanso geral tem um relógio próprio com iniciar, pausa, retomar e reiniciar. Este relógio não substitui o temporizador individual de cada intervalo entre séries.
- Cada relógio entre séries continua a poder ser ajustado individualmente. O tempo geral atualiza os intervalos que ainda não tenham uma duração própria, preservando as escolhas individuais.
- Ao tocar numa série guardada e marcá-la como concluída, o descanso geral também pode iniciar-se automaticamente.
- No fim de qualquer um dos dois tipos de descanso, a página mostra um aviso durante 3 segundos, vibra quando suportado e reproduz um toque local tipo telefone durante cerca de 3 segundos (se o navegador permitir áudio).
- Os relógios usam a hora real de conclusão (`Date.now()`), evitando erros de contagem caso a aba seja suspensa. Ao regressar à página, a contagem é atualizada.

## Escolher tempos personalizados

1. Abrir **Duração padrão** no relógio geral ou **Duração do descanso** entre duas séries.
2. Selecionar **Personalizar…**.
3. Introduzir minutos e segundos e premir **Aplicar**.
4. O relógio passa a mostrar o valor escolhido. O tempo geral fica guardado no navegador; os intervalos personalizados mantêm-se independentes durante a edição atual.
5. A opção é limitada a **1 segundo–99 min 59 s**. O relógio mantém os avisos de 3 segundos.

## Notificações com aplicação em segundo plano

**Importante:** Uma página web não consegue garantir um toque personalizado de 3 segundos com o telemóvel bloqueado ou a app fechada. Nessa situação, a notificação e o respetivo som são geridos pelo sistema operativo. Para que o alerta chegue enquanto a app está suspensa, este projeto utiliza os endpoints de push OneSignal já existentes, estendidos para os dois relógios.

### Passos obrigatórios no Vercel

1. Configurar uma aplicação Web Push no OneSignal para o domínio público da aplicação.
2. Na equipa/projeto Vercel, definir as variáveis de ambiente **Production**:
   - `ONESIGNAL_APP_ID` — ID público da aplicação OneSignal;
   - `ONESIGNAL_REST_API_KEY` — chave privada REST (nunca colocar no JavaScript do frontend);
   - `TIMER_APP_ORIGIN` — origem exata do website, por exemplo `https://ginasio-vila-flor-ten.vercel.app` (sem barra no fim).
3. Garantir que a configuração da Web Push aponta para o service worker OneSignal incluído em `/push/onesignal/OneSignalSDKWorker.js` e respetivo `scope`.
4. Efetuar nova publicação para que as variáveis de ambiente entrem em vigor.
5. Em «Meu treino», tocar em «Ativar alertas» e autorizar notificações. Para o primeiro registo, o OneSignal poderá requerer dois toques conforme a versão do SDK.
6. Confirmar que `https://SEU-DOMINIO/api/timer/status` devolve `{"configured":true,...}` (o ID público pode aparecer; a chave privada não).

### iPhone/iOS

- Para receber push web no iPhone, instalar o website no ecrã principal («Partilhar» → «Adicionar ao ecrã principal») e abrir **essa aplicação instalada**, em vez de depender só de uma aba do Safari.
- Dar autorização de notificações e verificar as definições de som/silêncio, Foco e volume do iPhone.
- O sistema iOS controla o som e a duração do toque da notificação. O toque personalizado de 3 segundos destina-se à app ativa, em primeiro plano.
- Sem a configuração OneSignal, o relógio e os alertas visuais funcionam, mas **não** há garantia de push após suspender a aplicação.

## Verificações locais

O funcionamento do contador geral, sincronização do padrão nos intervalos, pausa, retoma e aviso no fim foram testados numa execução de DOM no Chromium. A publicação Vercel, notificações OneSignal reais, Safari/iOS e som num iPhone bloqueado precisam de ser validados num dispositivo real.
