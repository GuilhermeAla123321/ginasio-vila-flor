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

    let remoteNotificationScheduled = false;

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

        if (!node) return;

        node.textContent = message || "";

        node.hidden = !message;

    }

    function setButton(label, enabled) {

        const node = button();

        if (!node) return;

        node.textContent = label;

        node.disabled = !enabled;

        node.setAttribute("aria-disabled", enabled ? "false" : "true");

    }

    function hasBrowserNotificationPermission() {

        return typeof Notification !== "undefined" && Notification.permission === "granted";

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

            setButton("Ativar alertas", false);

            setStatus("Notificações bloqueadas nas definições do navegador.");

            return;

        }

        // Se o serviço remoto estiver configurado, a permissão do navegador não
        // significa que a subscrição OneSignal já esteja ativa.
        if (backendConfigured && APP_ID) {

            if (!oneSignalInstance) {

                setButton("Ativar alertas", true);

                setStatus("");

                return;

            }

            const OneSignal = oneSignalInstance;

            if (OneSignal.Notifications?.isPushSupported && !OneSignal.Notifications.isPushSupported()) {

                setButton("Ativar alertas", false);

                setStatus("Alertas não suportados neste navegador.");

                return;

            }

            const optedIn = Boolean(OneSignal.User?.PushSubscription?.optedIn && (OneSignal.User?.PushSubscription?.id || subscriptionId));

            if (optedIn) {

                setButton("Alertas ativos", false);

                setStatus("");

            } else {

                setButton("Ativar alertas", true);

                setStatus("");

            }

            return;

        }

        // Sem configuração remota, permite as notificações locais do navegador
        // como alternativa. O Timer continua a funcionar mesmo sem OneSignal.
        if (hasBrowserNotificationPermission()) {

            setButton("Alertas ativos", false);

            setStatus("");

            return;

        }

        setButton("Ativar alertas", true);

        setStatus("");

    }

    async function enable() {

        const node = button();

        if (node?.disabled) return;

        setButton("A ativar…", false);

        setStatus("");

        try {

            if (typeof Notification !== "undefined" && Notification.permission === "denied") {

                throw new Error("Notificações bloqueadas nas definições do navegador.");

            }

            // Sem backend OneSignal configurado, usa a permissão normal do navegador
            // como alternativa local; não tenta carregar o SDK remoto.
            if ((!backendConfigured || !APP_ID) && !(await checkBackend())) {

                if (typeof Notification === "undefined") {

                    throw new Error("Alertas em segundo plano não estão configurados. O Timer local continua a funcionar.");

                }

                const permission = Notification.permission === "granted"

                    ? "granted"

                    : await Notification.requestPermission();

                if (permission !== "granted") {

                    throw new Error("Notificações não autorizadas.");

                }

                setButton("Alertas ativos", false);

                setStatus("");

                return;

            }

            if (!oneSignalInstance) {

                // Carrega o SDK após interação explícita. Depois de preparado, o
                // utilizador toca novamente para autorizar/confirmar a subscrição.
                const prepared = await loadOneSignal();

                subscriptionId = prepared.User?.PushSubscription?.id || null;

                if (prepared.User?.PushSubscription?.optedIn && subscriptionId) {

                    renderCurrentState();

                    return;

                }

                setButton("Ativar alertas", true);

                setStatus("Serviço preparado. Toca novamente para concluir a ativação.");

                return;

            }

            const OneSignal = oneSignalInstance;

            if (OneSignal.Notifications?.isPushSupported && !OneSignal.Notifications.isPushSupported()) {

                throw new Error("Alertas não suportados neste navegador.");

            }

            // O pedido de permissão parte diretamente deste clique do utilizador.
            const permissionRequest = OneSignal.Notifications.requestPermission();

            await permissionRequest;

            if (!OneSignal.Notifications.permission) {

                throw new Error("Notificações não autorizadas.");

            }

            await OneSignal.User.PushSubscription.optIn();

            subscriptionId = await waitForSubscriptionId(OneSignal);

            if (!subscriptionId) throw new Error("Não foi possível ativar os alertas. Tenta novamente.");

            renderCurrentState();

        } catch (error) {

            setButton("Ativar alertas", true);

            setStatus(error?.message || "Não foi possível ativar os alertas.");

        }

    }

    async function schedule(deadlineMs) {

        remoteNotificationScheduled = false;

        if (!isEnabled()) return { scheduled: false, reason: "not-enabled" };

        const version = ++requestVersion;

        // Se existir um alerta antigo, tenta cancelá-lo antes de criar o próximo.

        const oldId = activeMessageId || readStoredMessageId();

        storeMessageId("");

        if (oldId) await cancelMessageOnServer(oldId).catch(() => {});

        const id = oneSignalInstance?.User?.PushSubscription?.id || subscriptionId;

        if (!id) {

            setStatus("Alertas não ativos.");

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

            remoteNotificationScheduled = true;

            setStatus("");

            return { scheduled: true, messageId };

        } catch (error) {

            if (version === requestVersion) {

                setStatus("Não foi possível agendar o alerta.");

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

        remoteNotificationScheduled = false;

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

        const helpButton = document.getElementById("timerBackgroundHelp");
        const helpText = document.getElementById("timerBackgroundHelpText");
        if (helpButton && helpText) {
            helpButton.addEventListener("click", () => {
                const isExpanded = helpButton.getAttribute("aria-expanded") === "true";
                helpButton.setAttribute("aria-expanded", String(!isExpanded));
                helpText.hidden = isExpanded;
            });
        }

        setButton("A verificar…", false);

        setStatus("");

        await checkBackend();

        renderCurrentState();

        // O SDK de terceiros só será carregado após interação explícita do utilizador.

    }

    window.TimerBackgroundAlerts = Object.freeze({

        isEnabled,

        schedule,

        cancel,

        getConfigured: () => Boolean(APP_ID && backendConfigured),

        notifyCompletion: () => {

            // Evita duplicados se o push remoto foi agendado com sucesso.
            // Se o agendamento falhou, tenta entregar a notificação local.
            if (remoteNotificationScheduled) return false;

            if (!hasBrowserNotificationPermission()) return false;

            try {

                new Notification("Timer terminado", { body: "O tempo de descanso chegou ao fim.", icon: "icons/icon-192.png" });

                return true;

            } catch (_) { return false; }

        }

    });

    document.addEventListener("DOMContentLoaded", initialize, { once: true });

})();
