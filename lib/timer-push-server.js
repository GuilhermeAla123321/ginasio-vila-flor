function getConfig() {
    return {
        appId: process.env.ONESIGNAL_APP_ID || "",
        apiKey: process.env.ONESIGNAL_REST_API_KEY || "",
        appOrigin: (process.env.TIMER_APP_ORIGIN || "").replace(/\/$/, "")
    };
}

function readBody(req) {
    if (req.body && typeof req.body === "object") return req.body;
    if (typeof req.body === "string") {
        try { return JSON.parse(req.body); } catch (_) { return null; }
    }
    return null;
}

function isValidUuid(value) {
    return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function checkOrigin(req, res, appOrigin) {
    const origin = req.headers.origin;
    if (!appOrigin || !origin || origin.replace(/\/$/, "") !== appOrigin) {
        res.status(403).json({ error: "origin_not_allowed" });
        return false;
    }
    return true;
}

async function cancelOnOneSignal(messageId, config) {
    const url = `https://api.onesignal.com/notifications/${encodeURIComponent(messageId)}?app_id=${encodeURIComponent(config.appId)}`;
    const response = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Key ${config.apiKey}`, Accept: "application/json" }
    });
    if (!response.ok && response.status !== 404) {
        const error = new Error(`OneSignal cancel failed (${response.status})`);
        error.status = response.status;
        throw error;
    }
}

module.exports = { getConfig, readBody, isValidUuid, checkOrigin, cancelOnOneSignal };
