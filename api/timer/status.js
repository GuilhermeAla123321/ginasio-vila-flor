module.exports = async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({ error: "method_not_allowed" });
    }
    const appId = process.env.ONESIGNAL_APP_ID || "";
    const configured = Boolean(
        appId &&
        process.env.ONESIGNAL_REST_API_KEY &&
        process.env.TIMER_APP_ORIGIN
    );
    // O App ID é público e necessário ao SDK do browser. A chave REST nunca é devolvida.
    return res.status(200).json(configured ? { configured: true, appId } : { configured: false });
};
