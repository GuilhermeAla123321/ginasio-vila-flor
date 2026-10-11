module.exports = async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "GET") {
        res.setHeader("Allow", "GET");
        return res.status(405).json({ error: "method_not_allowed" });
    }
    const configured = Boolean(
        process.env.ONESIGNAL_APP_ID &&
        process.env.ONESIGNAL_REST_API_KEY &&
        process.env.TIMER_APP_ORIGIN &&
        typeof req.query?.appId === "string" &&
        req.query.appId === process.env.ONESIGNAL_APP_ID
    );
    return res.status(200).json({ configured });
};
