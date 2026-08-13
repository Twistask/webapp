const DEFAULT_PING_RESULT = { ok: false, status: 503, error: 'DB_CONN not configured' };

export const pingDatabase = async () => {
    const dbConn = process.env.DB_CONN;
    if (!dbConn) return DEFAULT_PING_RESULT;

    const base = dbConn.replace(/\/+$/, "");
    const url = `${base}/api/health`;

    const timeoutMs = Number(process.env.DB_PING_TIMEOUT_MS) || 2000;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
        });

        clearTimeout(timeout);

        let body;
        try {
            body = await res.json();
        } catch (e) {
            body = undefined;
        }

        return { ok: res.ok, status: res.status, body };
    } catch (err) {
        clearTimeout(timeout);

        if (err && err.name === "AbortError") {
            return { ok: false, status: 504, error: `timeout after ${timeoutMs}ms` };
        }

        return { ok: false, status: 503, error: err?.message ?? String(err) };
    }
};