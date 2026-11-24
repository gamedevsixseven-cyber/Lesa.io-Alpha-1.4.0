/**
 * Lesa.io - Cloudflare Workers + D1 Edge API Client
 * Offloads Clans, Clan Chat, Cloud Saves, Leaderboards & Player Search from Firestore Spark (20k/day)
 * onto Cloudflare D1 (100k row writes/day & 5M row reads/day free).
 * Gracefully falls back when Worker script has not been deployed yet.
 */

class EdgeApiClient {
    static BASE_URL = 'https://lesaio-api.gamedevsixseven.workers.dev';

    constructor() {
        this._deployed = null; // null = unknown, true = JSON API live, false = still Hello World / unreachable
        this._lastCheckAt = 0;
    }

    isEnabled() {
        if (this._deployed === false && Date.now() - this._lastCheckAt < 60000) return false;
        return Boolean(EdgeApiClient.BASE_URL);
    }

    async request(method, path, body = null, timeoutMs = 5500) {
        if (!EdgeApiClient.BASE_URL || typeof fetch !== 'function') {
            return { ok: false, fallback: true, error: 'Fetch unavailable.' };
        }
        if (this._deployed === false && Date.now() - this._lastCheckAt < 60000) {
            return { ok: false, fallback: true, error: 'Edge API warming up.' };
        }

        const ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
        try {
            const opts = {
                method,
                headers: body ? { 'Content-Type': 'application/json' } : undefined,
                body: body ? JSON.stringify(body) : undefined,
                signal: ctrl ? ctrl.signal : undefined
            };
            const res = await fetch(`${EdgeApiClient.BASE_URL}${path}`, opts);
            const text = await res.text();
            let parsed = null;
            try { parsed = JSON.parse(text); } catch (_) { parsed = null; }

            if (!parsed || typeof parsed !== 'object' || !('ok' in parsed)) {
                // Worker still running starter "Hello world!" or non-API response
                this._deployed = false;
                this._lastCheckAt = Date.now();
                return { ok: false, fallback: true, status: res.status, error: 'Edge Worker code not deployed yet.' };
            }
            this._deployed = true;
            this._lastCheckAt = Date.now();
            return { ...parsed, status: res.status, fallback: false };
        } catch (err) {
            return { ok: false, fallback: true, error: (err && err.message) ? err.message : 'Network error.' };
        } finally {
            if (timer) clearTimeout(timer);
        }
    }

    get(path, timeoutMs = 5000) {
        return this.request('GET', path, null, timeoutMs);
    }

    post(path, body = {}, timeoutMs = 6000) {
        return this.request('POST', path, body, timeoutMs);
    }
}

if (typeof window !== 'undefined') {
    window.EdgeApiClient = EdgeApiClient;
    if (!window.edgeApi) window.edgeApi = new EdgeApiClient();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EdgeApiClient };
}
