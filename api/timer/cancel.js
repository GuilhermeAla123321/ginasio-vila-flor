const { getConfig, readBody, isValidUuid, checkOrigin, cancelOnOneSignal } = require("../../lib/timer-push-server.js");

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
    const messageId = body?.messageId;
    if (!isValidUuid(messageId)) {
        return res.status(400).json({ error: "invalid_request" });
    }

    try {
        await cancelOnOneSignal(messageId, config);
        return res.status(200).json({ cancelled: true });
    } catch (error) {
        console.error("Timer push cancellation failed", error?.message || "unknown error");
        return res.status(502).json({ error: "push_cancel_failed" });
    }
};
