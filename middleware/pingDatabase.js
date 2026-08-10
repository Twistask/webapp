const DEFAULT_PING_RESULT = { ok: false, status: 503, error: 'DB_CONN not configured' };

/**
 * Ping the database health endpoint with a short timeout and return a stable result object.
 * Returns: { ok: boolean, status: number, body?: any, error?: string }
 */
export const pingDatabase = async () => {
  const dbConn = process.env.DB_CONN;
  if (!dbConn) return DEFAULT_PING_RESULT;

  const base = dbConn.replace(/\/+$/, "");
  const url = `${base}/api/health`;

  // timeout in ms, configurable via DB_PING_TIMEOUT_MS, default 2000ms
  const timeoutMs = Number(process.env.DB_PING_TIMEOUT_MS) || 2000;

  // Use AbortController available in modern Node.js to implement timeout
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
      // not JSON or empty body
      body = undefined;
    }

    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    clearTimeout(timeout);

    // distinguish timeout from other network errors
    if (err && err.name === "AbortError") {
      return { ok: false, status: 504, error: `timeout after ${timeoutMs}ms` };
    }

    return { ok: false, status: 503, error: err?.message ?? String(err) };
  }
};
