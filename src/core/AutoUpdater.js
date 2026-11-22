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

    static _canSafelyReload() {
        const g = window.gameInstance;
        if (g && (g.state === 'PLAYING' || g.state === 'PAUSED')) return false;
        const coopEl = typeof document !== 'undefined' ? document.getElementById('coop-modal') : null;
        if (coopEl && !coopEl.classList.contains('hidden')) return false;
        if (window.networkManager && (window.networkManager.connected || window.networkManager.connecting)) return false;
        return true;
    }

    static checkForUpdate(force = false) {
        // Update SW in background for next launch; never auto-reload active tabs or menu returns.
        const now = Date.now();
        if (!force && now - this._lastCheckMs < 45000) return;
        this._lastCheckMs = now;
        if (this._swReg) { try { this._swReg.update(); } catch (_) {} }
    }
}

if (typeof window !== 'undefined') {
    window.AutoUpdater = AutoUpdater;
    AutoUpdater.init();
}
