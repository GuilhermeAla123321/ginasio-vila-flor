const { getConfig, readBody, isValidUuid, checkOrigin } = require("../../lib/timer-push-server.js");

module.exports = async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res.status(405).json({ error: "method_not_allowed" });
    }

    const config = getConfig();
    if (!config.appId || !config.apiKey || !config.appOrigin) {
        return res.status(503).json({ error: "push_service_not_configured" });
    }
    if (!checkOrigin(req, res, config.appOrigin)) return;

    const body = readBody(req);
    const subscriptionId = body?.subscriptionId;
    const dueAt = Number(body?.dueAt);
    if (!isValidUuid(subscriptionId) || !Number.isFinite(dueAt)) {
        return res.status(400).json({ error: "invalid_request" });
    }

    const now = Date.now();
    const delayMs = dueAt - now;
    // A roda atual limita a duração a 59:59; pequena margem para latência e envio push.
    if (delayMs < 500 || delayMs > 3605 * 1000) {
        return res.status(400).json({ error: "due_time_out_of_range" });
    }

    const payload = {
        app_id: config.appId,
        target_channel: "push",
        include_subscription_ids: [subscriptionId],
        headings: { pt: "Tempo de descanso terminado", en: "Rest timer finished" },
        contents: { pt: "O teu temporizador terminou.", en: "Your timer has finished." },
        send_after: new Date(dueAt).toISOString(),
        url: `${config.appOrigin}/index.html`,
        name: "Ginásio — alerta do temporizador"
    };

    try {
        const response = await fetch("https://api.onesignal.com/notifications", {
            method: "POST",
            headers: {
                Authorization: `Key ${config.apiKey}`,
                "Content-Type": "application/json",
                Accept: "application/json"
            },
            body: JSON.stringify(payload)
        });
        let result = {};
        try { result = await response.json(); } catch (_) {}
        if (!response.ok || typeof result.id !== "string") {
            // Não expor a resposta do fornecedor nem a chave ao cliente.
            console.error("Timer push schedule failed", response.status);
            return res.status(502).json({ error: "push_schedule_failed" });
        }
        return res.status(200).json({ messageId: result.id });
    } catch (error) {
        console.error("Timer push schedule unavailable", error?.message || "unknown error");
        return res.status(502).json({ error: "push_service_unavailable" });
    }
};
