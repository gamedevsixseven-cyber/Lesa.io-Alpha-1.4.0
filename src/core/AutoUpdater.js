/**
 * Lesa.io - Seamless PWA / GitHub Update Detector
 * Registers sw.js and checks for new builds when launching or returning to the Main Menu
 * so iPhone Home Screen bookmarks update automatically without deleting/re-adding.
 */

class AutoUpdater {
    static _lastCheckMs = 0;
    static _pendingReload = false;
    static _reloading = false;
    static _swReg = null;

    static init() {
        if (typeof window === 'undefined' || !window.location || !window.location.protocol.startsWith('http')) return;
        this._registerSW();
        setTimeout(() => this.checkForUpdate(true), 1500);

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && document.visibilityState === 'visible') this.checkForUpdate(true);
        });
        window.addEventListener('pageshow', (e) => {
            if (e && e.persisted) this.checkForUpdate(true);
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

    static _canSafelyReload() {
        const g = window.gameInstance;
        if (g && (g.state === 'PLAYING' || g.state === 'PAUSED')) return false;
        const coopEl = typeof document !== 'undefined' ? document.getElementById('coop-modal') : null;
        if (coopEl && !coopEl.classList.contains('hidden')) return false;
        if (window.networkManager && (window.networkManager.connected || window.networkManager.connecting)) return false;
        return true;
    }

    static _isDomOutdatedByHtml(htmlText) {
        if (!htmlText || typeof document === 'undefined') return '';
        const verMatch = htmlText.match(/id="menu-game-version"[^>]*>([^<]+)</i);
        const verEl = document.getElementById('menu-game-version');
        const remoteVer = verMatch ? verMatch[1].trim() : '';
        const scriptMatches = htmlText.match(/src="(src\/[^"]+\?v=[^"]+)"/gi) || [];
        const styleMatches = htmlText.match(/href="(styles\/[^"]+\?v=[^"]+)"/gi) || [];
        const remoteSig = `${remoteVer}|${scriptMatches.length}:${scriptMatches.join(',')}|${styleMatches.length}:${styleMatches.join(',')}`;

        if (remoteVer && verEl && remoteVer !== (verEl.textContent || '').trim()) {
            return remoteSig;
        }
        for (let i = 0; i < scriptMatches.length; i++) {
            const src = scriptMatches[i].slice(5, -1);
            if (!document.querySelector(`script[src="${src}"]`)) return remoteSig;
        }
        for (let i = 0; i < styleMatches.length; i++) {
            const href = styleMatches[i].slice(6, -1);
            if (!document.querySelector(`link[href="${href}"]`)) return remoteSig;
        }
        return '';
    }

    static checkForUpdate(force = false) {
        if (this._reloading) return;
        if (this._pendingReload && this._canSafelyReload()) {
            this._applyUpdateReload();
            return;
        }
        const now = Date.now();
        if (!force && now - this._lastCheckMs < 25000) return;
        this._lastCheckMs = now;
        if (this._swReg) { try { this._swReg.update(); } catch (_) {} }

        fetch(`./index.html?_au=${now}`, { cache: 'no-store' })
            .then((res) => (res && res.ok ? res.text() : ''))
            .then((htmlText) => {
                const newSig = this._isDomOutdatedByHtml(htmlText);
                if (!newSig) return;
                try {
                    if (sessionStorage.getItem('lesaio_au_applied_sig') === newSig) return;
                    sessionStorage.setItem('lesaio_au_applied_sig', newSig);
                } catch (_) {}
                if (this._canSafelyReload()) this._applyUpdateReload();
                else this._pendingReload = true;
            })
            .catch(() => {});
    }

    static _applyUpdateReload() {
        if (this._reloading) return;
        this._reloading = true;
        const finishReload = () => {
            try { window.location.reload(); } catch (_) {}
        };
        if (typeof caches !== 'undefined' && typeof caches.keys === 'function') {
            caches.keys()
                .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
                .then(finishReload)
                .catch(finishReload);
        } else {
            finishReload();
        }
    }
}

if (typeof window !== 'undefined') {
    window.AutoUpdater = AutoUpdater;
    AutoUpdater.init();
}
