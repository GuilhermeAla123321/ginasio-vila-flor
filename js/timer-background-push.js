(() => {
    "use strict";

    const CONFIG = window.GINASIO_TIMER_PUSH_CONFIG || { appId: "" };
    let APP_ID = typeof CONFIG.appId === "string" ? CONFIG.appId.trim() : "";
    const MESSAGE_ID_KEY = "vf_timer_background_push_message_id";
    const PUSH_DELAY_MS = 1200; // margem para cancelar um push se a página terminar em primeiro plano

    let oneSignalPromise = null;
    let oneSignalInstance = null;
    let backendConfigured = false;
    let subscriptionId = null;
    let requestVersion = 0;
    let activeMessageId = readStoredMessageId();

    const button = () => document.getElementById("timerBackgroundEnable");
    const status = () => document.getElementById("timerBackgroundStatus");

    function readStoredMessageId() {
        try { return localStorage.getItem(MESSAGE_ID_KEY) || ""; }
        catch (_) { return ""; }
    }

    function storeMessageId(id) {
        activeMessageId = id || "";
        try {
            if (activeMessageId) localStorage.setItem(MESSAGE_ID_KEY, activeMessageId);
            else localStorage.removeItem(MESSAGE_ID_KEY);
        } catch (_) {}
    }

    function setStatus(message) {
        const node = status();
        if (node) node.textContent = message;
    }

    function setButton(label, enabled) {
        const node = button();
        if (!node) return;
        node.textContent = label;
        node.disabled = !enabled;
        node.setAttribute("aria-disabled", enabled ? "false" : "true");
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
        if (!APP_ID || !backendConfigured) {
            // Mantém o botão acionável: um controlo desativado parecia não responder
            // e escondia a causa real, que é a configuração do serviço remoto.
            setButton("Verificar configuração", true);
            setStatus("Os alertas com ecrã bloqueado ainda não estão configurados no servidor. No Vercel, define ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY e TIMER_APP_ORIGIN. Depois publica novamente. O Timer local continua disponível.");
            return;
        }

        if (!oneSignalInstance) {
            setButton("Preparar alertas", true);
            setStatus("O serviço externo só será carregado depois de tocares aqui. A autorização do navegador será pedida numa ação seguinte.");
            return;
        }

        const OneSignal = oneSignalInstance;
        if (OneSignal.Notifications?.isPushSupported && !OneSignal.Notifications.isPushSupported()) {
            setButton("Não suportado", false);
            setStatus("Este navegador não suporta notificações push. O Timer continua a funcionar normalmente.");
            return;
        }

        if (OneSignal.Notifications?.permission === false && typeof Notification !== "undefined" && Notification.permission === "denied") {
            setButton("Ver definições", false);
            setStatus("As notificações estão bloqueadas nas definições do navegador. Permite-as nas definições do site.");
            return;
        }

        const optedIn = Boolean(OneSignal.User?.PushSubscription?.optedIn && (OneSignal.User?.PushSubscription?.id || subscriptionId));
        if (optedIn) {
            setButton("Alertas ativos", false);
            setStatus("Alertas do sistema ativos neste dispositivo. O som usado com o ecrã bloqueado é o do sistema.");
        } else {
            setButton("Ativar alertas", true);
            setStatus("A autorização só será pedida depois de tocares em «Ativar alertas».");
        }
    }

    async function enable() {
        const node = button();
        if (node?.disabled) return;
        setButton("A ativar…", false);
        setStatus("A preparar notificações do sistema…");

        try {
            if ((!backendConfigured || !APP_ID) && !(await checkBackend())) {
                throw new Error("Não foi possível ativar os alertas: falta configurar o serviço no Vercel. Define ONESIGNAL_APP_ID, ONESIGNAL_REST_API_KEY e TIMER_APP_ORIGIN e publica novamente. Nenhuma permissão foi pedida; o Timer local continua a funcionar.");
            }
            if (!oneSignalInstance) {
                // Carregamos o fornecedor apenas após o utilizador pedir para ativar a função.
                // Não pedimos permissões depois desta espera assíncrona: o utilizador volta a
                // tocar para que o pedido nativo parta diretamente desse gesto.
                const prepared = await loadOneSignal();
                subscriptionId = prepared.User?.PushSubscription?.id || null;
                if (prepared.User?.PushSubscription?.optedIn && subscriptionId) {
                    renderCurrentState();
                    return;
                }
                setButton("Continuar autorização", true);
                setStatus("Serviço preparado. Toca novamente em «Continuar autorização» para abrir o pedido de autorização do navegador.");
                return;
            }
            const OneSignal = oneSignalInstance;
            if (OneSignal.Notifications?.isPushSupported && !OneSignal.Notifications.isPushSupported()) {
                throw new Error("Este navegador não suporta notificações push.");
            }

            // Chamado diretamente a partir do clique, antes de qualquer nova espera.
            const permissionRequest = OneSignal.Notifications.requestPermission();
            await permissionRequest;
            if (!OneSignal.Notifications.permission) {
                throw new Error("A autorização não foi concedida. Confirma as permissões de notificações do site.");
            }
            await OneSignal.User.PushSubscription.optIn();
            subscriptionId = await waitForSubscriptionId(OneSignal);
            if (!subscriptionId) throw new Error("O navegador não confirmou a subscrição. Tenta novamente dentro de alguns segundos.");
            renderCurrentState();
        } catch (error) {
            // Permite repetir a verificação se o primeiro pedido falhou por rede/configuração.
            setButton(APP_ID && backendConfigured ? "Tentar novamente" : "Verificar configuração", true);
            setStatus(error?.message || "Não foi possível ativar os alertas. O Timer continua a funcionar nesta página.");
        }
    }

    async function schedule(deadlineMs) {
        if (!isEnabled()) return { scheduled: false, reason: "not-enabled" };
        const version = ++requestVersion;
        // Se existir um alerta antigo, tenta cancelá-lo antes de criar o próximo.
        const oldId = activeMessageId || readStoredMessageId();
        storeMessageId("");
        if (oldId) await cancelMessageOnServer(oldId).catch(() => {});

        const id = oneSignalInstance?.User?.PushSubscription?.id || subscriptionId;
        if (!id) {
            setStatus("A subscrição de notificações deixou de estar disponível. Reativa os alertas nas definições.");
            return { scheduled: false, reason: "missing-subscription" };
        }

        try {
            const response = await requestJson("/api/timer/schedule", {
                method: "POST",
                body: JSON.stringify({
                    subscriptionId: id,
                    dueAt: Math.floor(Number(deadlineMs) + PUSH_DELAY_MS)
                })
            });
            const messageId = typeof response.messageId === "string" ? response.messageId : "";
            if (!messageId) throw new Error("O servidor não devolveu o identificador do alerta.");

            if (version !== requestVersion) {
                // O utilizador parou/reiniciou durante o pedido; não deixar um push órfão.
                await cancelMessageOnServer(messageId).catch(() => {});
                return { scheduled: false, reason: "cancelled-during-request" };
            }

            storeMessageId(messageId);
            setStatus("Alerta do sistema agendado. Se parares ou reiniciares, será cancelado.");
            return { scheduled: true, messageId };
        } catch (error) {
            if (version === requestVersion) {
                setStatus("Não foi possível agendar o alerta remoto. O temporizador local mantém-se a funcionar.");
            }
            return { scheduled: false, reason: error?.message || "schedule-failed" };
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

    async function cancel() {
        requestVersion += 1;
        const messageId = activeMessageId || readStoredMessageId();
        storeMessageId("");
        if (messageId) await cancelMessageOnServer(messageId);
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
        const enableButton = button();
        if (enableButton) enableButton.addEventListener("click", enable);

        // Confirma sempre o servidor, mesmo quando o App ID ainda não está no JS público.
        // Se o backend estiver configurado, o endpoint devolve apenas o App ID público.
        setButton("A verificar…", false);
        setStatus("A verificar a configuração das notificações…");
        await checkBackend();
        renderCurrentState();

        // O SDK de terceiros só será carregado após interação explícita do utilizador.
    }

    window.TimerBackgroundAlerts = Object.freeze({
        isEnabled,
        schedule,
        cancel,
        getConfigured: () => Boolean(APP_ID && backendConfigured)
    });

    document.addEventListener("DOMContentLoaded", initialize, { once: true });
})();
