(() => {

    "use strict";

let APP_ID = "";

const PUSH_DELAY_MS = 1200; // margem para cancelar um push se a página terminar em primeiro plano

    let oneSignalPromise = null;

    let oneSignalInstance = null;

    let backendConfigured = false;

    let subscriptionId = null;

// IDs independentes evitam que o descanso geral cancele a notificação de uma série.
    const REST_MESSAGE_STORE = "vf_gym_rest_push_ids_v1";
    const restMessageIds = (() => { try { return JSON.parse(localStorage.getItem(REST_MESSAGE_STORE)) || {}; } catch (_) { return {}; } })();
    const restVersions = { geral: 0, series: 0 };
    const saveRestMessageIds = () => { try { localStorage.setItem(REST_MESSAGE_STORE, JSON.stringify(restMessageIds)); } catch (_) {} };
    const restButton = () => document.getElementById("gymGeneralAlertsEnable");
    const restStatus = () => document.getElementById("gymGeneralAlertsStatus");

    const BLOCKED_NOTE = "Notificações bloqueadas. Permite-as nas definições do site e toca novamente.";

function setStatus(message) {

        const other = restStatus();

        if (other) other.textContent = message || "";

        const help = document.getElementById("gymGeneralAlertsHelp");

        if (help) {

            help.hidden = !message;

            if (!message) {

                help.setAttribute("aria-expanded", "false");

                if (other) other.hidden = true;

            }

        }

    }

    function setButton(label, enabled) {

        const other = restButton();

        if (!other) return;

        other.textContent = label;

        other.disabled = !enabled;

        other.setAttribute("aria-disabled", String(!enabled));

    }

    function hasBrowserNotificationPermission() {

        return typeof Notification !== "undefined" && Notification.permission === "granted";

    }

    // Android e iOS (app instalada) só aceitam notificações através do service worker;
    // aí new Notification() falha, por isso só serve de alternativa em computador.
    async function showLocalNotification(title, options) {

        if (!hasBrowserNotificationPermission()) return false;

        try {

            const registration = await navigator.serviceWorker?.getRegistration();

            if (registration) {

                await registration.showNotification(title, options);

                return true;

            }

            new Notification(title, options);

            return true;

        } catch (_) { return false; }

    }

    async function requestJson(url, options = {}) {

        const response = await fetch(url, {

            credentials: "same-origin",

            cache: "no-store",

            ...options,

            headers: {

                ...(options.headers || {}),

                ...(options.body ? { "Content-Type": "application/json" } : {})

            }

        });

        let data = {};

        try { data = await response.json(); } catch (_) {}

        if (!response.ok) throw new Error(data.error || `Pedido falhou (${response.status})`);

        return data;

    }

    async function checkBackend() {

        try {

            // O App ID é público e pode ser entregue pelo endpoint de estado do servidor.

            // Assim, não é necessário editar manualmente o JS do cliente após configurar Vercel.

            const result = await requestJson("/api/timer/status", { method: "GET" });

            backendConfigured = result.configured === true;

            if (backendConfigured && typeof result.appId === "string" && result.appId.trim()) {

                APP_ID = result.appId.trim();

            }

            backendConfigured = backendConfigured && Boolean(APP_ID);

            return backendConfigured;

        } catch (_) {

            backendConfigured = false;

            return false;

        }

    }

    function loadOneSignal() {

        if (oneSignalPromise) return oneSignalPromise;

        oneSignalPromise = new Promise((resolve, reject) => {

            if (!APP_ID || !backendConfigured) {

                reject(new Error("É necessária uma configuração inicial do serviço Web Push."));

                return;

            }

            window.OneSignalDeferred = window.OneSignalDeferred || [];

            let settled = false;

            const timeout = window.setTimeout(() => {

                if (settled) return;

                settled = true;

                reject(new Error("O serviço de notificações não respondeu."));

            }, 12000);

            window.OneSignalDeferred.push(async OneSignal => {

                try {

                    await OneSignal.init({

                        appId: APP_ID,

                        serviceWorkerPath: "push/onesignal/OneSignalSDKWorker.js",

                        serviceWorkerParam: { scope: "/push/onesignal/" },

                        notifyButton: { enable: false },

                        welcomeNotification: { disable: true }

                    });

                    if (settled) return;

                    settled = true;

                    window.clearTimeout(timeout);

                    oneSignalInstance = OneSignal;

                    subscriptionId = OneSignal.User?.PushSubscription?.id || null;

                    OneSignal.User?.PushSubscription?.addEventListener("change", event => {

                        subscriptionId = event?.current?.id || OneSignal.User?.PushSubscription?.id || null;

                        renderCurrentState();

                    });

                    OneSignal.Notifications?.addEventListener("permissionChange", () => renderCurrentState());

                    resolve(OneSignal);

                } catch (error) {

                    if (settled) return;

                    settled = true;

                    window.clearTimeout(timeout);

                    reject(error);

                }

            });

            const script = document.createElement("script");

            script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";

            script.async = true;

            script.onerror = () => {

                if (settled) return;

                settled = true;

                window.clearTimeout(timeout);

                reject(new Error("Não foi possível carregar o serviço de notificações."));

            };

            document.head.appendChild(script);

        });

        oneSignalPromise = oneSignalPromise.catch(error => {

            oneSignalPromise = null;

            throw error;

        });

        return oneSignalPromise;

    }

    async function waitForSubscriptionId(OneSignal, timeoutMs = 7000) {

        const currentId = () => OneSignal.User?.PushSubscription?.id || subscriptionId;

        if (currentId() && OneSignal.User?.PushSubscription?.optedIn) return currentId();

        return new Promise(resolve => {

            let done = false;

            let intervalId = null;

            let timeoutId = null;

            const finish = id => {

                if (done) return;

                done = true;

                if (intervalId) window.clearInterval(intervalId);

                if (timeoutId) window.clearTimeout(timeoutId);

                try { OneSignal.User?.PushSubscription?.removeEventListener("change", listener); } catch (_) {}

                resolve(id || null);

            };

            const listener = event => {

                const id = event?.current?.id || currentId();

                if (id && (event?.current?.optedIn ?? OneSignal.User?.PushSubscription?.optedIn)) finish(id);

            };

            try { OneSignal.User?.PushSubscription?.addEventListener("change", listener); } catch (_) {}

            intervalId = window.setInterval(() => {

                if (currentId() && OneSignal.User?.PushSubscription?.optedIn) finish(currentId());

            }, 200);

            timeoutId = window.setTimeout(() => finish(null), timeoutMs);

            if (currentId() && OneSignal.User?.PushSubscription?.optedIn) finish(currentId());

        });

    }

    function renderCurrentState() {

        if (typeof Notification !== "undefined" && Notification.permission === "denied") {

            setButton("Ativar alertas", true);

            setStatus(BLOCKED_NOTE);

            return;

        }

        // Com permissão, os alertas já funcionam; a subscrição para o telemóvel bloqueado trata-se em segundo plano.
        if (hasBrowserNotificationPermission()) {

            setButton("Alertas ativos", false);

            setStatus("");

            return;

        }

        setButton("Ativar alertas", true);

        setStatus("");

    }

    // Abre o aviso no «?» do timer. Em diferido porque o clique que chegou aqui
    // ainda vai fechar as ajudas abertas quando subir até ao document.
    function openRestMessage() {

        window.setTimeout(() => {

            const help = document.getElementById("gymGeneralAlertsHelp");

            const other = restStatus();

            if (!help || help.hidden || !other) return;

            help.setAttribute("aria-expanded", "true");

            other.hidden = false;

        }, 0);

    }

    async function activateRemote() {

        const OneSignal = oneSignalInstance || await loadOneSignal();

        if (OneSignal.Notifications?.isPushSupported && !OneSignal.Notifications.isPushSupported()) {

            throw new Error("Alertas não suportados neste navegador.");

        }

        // Com a permissão já dada, optIn só muda a preferência: é requestPermission que cria a subscrição.
        await OneSignal.Notifications.requestPermission();

        await OneSignal.User.PushSubscription.optIn();

        subscriptionId = await waitForSubscriptionId(OneSignal);

        if (!subscriptionId) throw new Error("O serviço de alertas não respondeu.");

    }

    async function enable() {

        if (restButton()?.disabled) return;

        setButton("A ativar…", false);

        setStatus("");

        try {

            if (typeof Notification === "undefined") {

                throw new Error("Este navegador não permite notificações. No iPhone, adiciona a app ao ecrã principal e abre-a daí.");

            }

            if (Notification.permission === "denied") throw new Error(BLOCKED_NOTE);

            // O pedido tem de ser a primeira coisa após o toque: o iOS recusa-o depois de esperar pela rede.
            const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();

            if (permission !== "granted") {

                throw new Error(permission === "denied" ? BLOCKED_NOTE : "Notificações não autorizadas.");

            }

            if (!backendConfigured || !APP_ID) await checkBackend();

            setButton("Alertas ativos", false);

            setStatus("");

            showLocalNotification("Alertas ativos", { body: "Vais ser avisado quando o descanso terminar.", icon: "icons/icon-192.png", tag: "gym-alerts-enabled" });

            if (backendConfigured && APP_ID) activateRemote().catch(error => console.warn("Subscrição de alertas por concluir:", error));

        } catch (error) {

            setButton("Ativar alertas", true);

            setStatus(error?.message || "Não foi possível ativar os alertas.");

            openRestMessage();

        }

    }

    async function cancelMessageOnServer(messageId) {

        if (!messageId) return;

        try {

            await requestJson("/api/timer/cancel", {

                method: "POST",

                body: JSON.stringify({ messageId })

            });

        } catch (_) {

            // O timer local nunca depende da disponibilidade do endpoint de cancelamento.

        }

    }

    // Envio independente para os dois relógios de "Meu treino".
    async function scheduleNamed(kind, deadlineMs) {
        if (kind !== 'geral' && kind !== 'series') return {scheduled:false,reason:'invalid-kind'};
        const version = ++restVersions[kind];
        const oldId = restMessageIds[kind];
        delete restMessageIds[kind]; saveRestMessageIds();
        if (oldId) await cancelMessageOnServer(oldId).catch(() => {});
        if (!isEnabled()) return {scheduled:false,reason:'push-not-configured'};
        const id = oneSignalInstance?.User?.PushSubscription?.id || subscriptionId;
        if (!id) return {scheduled:false,reason:'missing-subscription'};
        try {
            const response = await requestJson('/api/timer/schedule', {
                method:'POST', body:JSON.stringify({kind,subscriptionId:id,dueAt:Math.floor(Number(deadlineMs)+PUSH_DELAY_MS)})
            });
            if (version !== restVersions[kind]) {
                if (response.messageId) await cancelMessageOnServer(response.messageId).catch(()=>{});
                return {scheduled:false,reason:'cancelled'};
            }
            if (!response.messageId) throw Error('no-message-id');
            restMessageIds[kind]=response.messageId;saveRestMessageIds();
            return {scheduled:true,messageId:response.messageId};
        } catch (_) { return {scheduled:false,reason:'push-unavailable'}; }
    }
    async function cancelNamed(kind) {
        if (kind !== 'geral' && kind !== 'series') return;
        ++restVersions[kind];
        const id=restMessageIds[kind];delete restMessageIds[kind];saveRestMessageIds();
        if(id) await cancelMessageOnServer(id).catch(()=>{});
    }
    function notifyNamed(kind) {
        if (!hasBrowserNotificationPermission() || (kind!=='geral' && kind!=='series')) return false;
        if (restMessageIds[kind]) return false;
        showLocalNotification(kind==='geral'?'Descanso geral terminado':'Descanso entre séries terminado', {
            body:'Está na hora de retomar o treino.',icon:'icons/icon-192.png',tag:`gym-rest-${kind}`
        });
        return true;
    }

    function isEnabled() {

        const OneSignal = oneSignalInstance;

        return Boolean(

            backendConfigured && APP_ID && OneSignal &&

            OneSignal.User?.PushSubscription?.optedIn &&

            (OneSignal.User?.PushSubscription?.id || subscriptionId)

        );

    }

    async function initialize() {

restButton()?.addEventListener("click", enable);

        setButton("A verificar…", false);

        setStatus("");

        await checkBackend();

        renderCurrentState();

        navigator.permissions?.query?.({ name: "notifications" })
            .then(state => { state.onchange = renderCurrentState; })
            .catch(() => {});

        // Quem já autorizou não precisa de voltar a tocar no botão depois de reabrir a app;
        // nos restantes casos, o SDK só é carregado após interação explícita.
        if (backendConfigured && hasBrowserNotificationPermission()) {

            // Sem um toque, o iOS pode recusar o pedido: nesse caso repete no próximo toque na app.
            activateRemote().catch(() => {

                document.addEventListener("click", () => {

                    activateRemote().catch(error => console.warn("Subscrição de alertas por concluir:", error));

                }, { once: true });

            });

        }

    }

    window.TimerBackgroundAlerts = Object.freeze({ scheduleNamed, cancelNamed, notifyNamed });

    document.addEventListener("DOMContentLoaded", initialize, { once: true });

})();
