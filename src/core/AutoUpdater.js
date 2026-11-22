/**
 * Lesa.io - Seamless PWA / GitHub Update Detector
 * Registers sw.js and checks for new builds when launching or returning to the Main Menu
 * so iPhone Home Screen bookmarks update automatically without deleting/re-adding.
 */

class AutoUpdater {
    static _baselineTag = null;
    static _lastCheckMs = 0;
    static _pendingReload = false;
    static _reloading = false;
    static _swReg = null;

    static init() {
        if (typeof window === 'undefined' || !window.location || !window.location.protocol.startsWith('http')) return;
        this._registerSW();
        this._captureBaseline();

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && document.visibilityState === 'visible') this.checkForUpdate();
        });
        window.addEventListener('pageshow', () => {
            if (!document.hidden) this.checkForUpdate();
        });
    }

    static _registerSW() {
        if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' })
                .then((reg) => {
                    this._swReg = reg;
                    try { reg.update(); } catch (_) {}
                })
                .catch(() => {});
        });
    }

    static _readHeadSig(res) {
        if (!res || !res.ok) return null;
        return res.headers.get('etag') || res.headers.get('last-modified') || null;
    }

    static _captureBaseline() {
        setTimeout(() => {
            fetch('./index.html', { method: 'HEAD', cache: 'no-store' })
                .then((res) => { this._baselineTag = this._readHeadSig(res); })
                .catch(() => {});
        }, 1800);
    }

    static _canSafelyReload() {
        const g = window.gameInstance;
        return !g || (g.state !== 'PLAYING' && g.state !== 'PAUSED');
    }

    static checkForUpdate(force = false) {
        if (this._reloading) return;
        if (this._pendingReload && this._canSafelyReload()) {
            this._applyUpdateReload();
            return;
        }
        const now = Date.now();
        if (!force && now - this._lastCheckMs < 45000) return;
        this._lastCheckMs = now;

        if (this._swReg) { try { this._swReg.update(); } catch (_) {} }

        fetch('./index.html', { method: 'HEAD', cache: 'no-store' })
            .then((res) => {
                const sig = this._readHeadSig(res);
                if (!sig) return;
                if (!this._baselineTag) { this._baselineTag = sig; return; }
                if (sig !== this._baselineTag) {
                    if (this._canSafelyReload()) this._applyUpdateReload();
                    else this._pendingReload = true;
                }
            })
            .catch(() => {});
    }

    static _applyUpdateReload() {
        if (this._reloading) return;
        this._reloading = true;
        const apply = () => fetch('./index.html', { cache: 'reload' })
            .catch(() => {})
            .finally(() => window.location.reload());
        if (typeof caches !== 'undefined' && typeof caches.keys === 'function') {
            caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).then(apply).catch(apply);
        } else {
            apply();
        }
    }
}

if (typeof window !== 'undefined') {
    window.AutoUpdater = AutoUpdater;
    AutoUpdater.init();
}
