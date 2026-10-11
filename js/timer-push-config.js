/*
 * Configuração pública da integração Web Push.
 * Coloca aqui o App ID do projeto OneSignal após a configuração descrita em
 * CONFIGURAR_ALERTAS_EM_SEGUNDO_PLANO.md. Não colocar chaves secretas neste ficheiro.
 * Enquanto appId estiver vazio, a integração fica desativada sem afetar o Timer.
 */
window.GINASIO_TIMER_PUSH_CONFIG = Object.freeze({
    appId: ""
});
