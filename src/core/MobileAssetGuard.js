/**
 * MobileAssetGuard - Mobile-only runtime image loading & recovery helper.
 * Protects slow / flaky mobile connections (e.g. GitHub Pages on iOS Safari)
 * from dropped <img> downloads and failed canvas sprite textures without
 * touching any desktop behavior.
 */
class MobileAssetGuard {
    static _domInstalled = false;
    static _sweepTimer = 0;
    static _maxRetries = 3;

    static isEnabled() {
        return typeof MobilePerf !== 'undefined' && !!MobilePerf.isMobile;
    }

    static _stripRetryParam(url) {
        if (!url || typeof url !== 'string') return '';
        return url.replace(/([?&])_mr=\d+_\d+(&?)/g, (_, sep, tail) => (tail ? sep : ''));
    }

    static normalizeAssetPath(url) {
        if (!url || typeof url !== 'string') return '';
        return url
            .replace(/assets\/helmets\//g, 'assets/Helmets/')
            .replace(/assets\/armors\//g, 'assets/Armors/')
            .replace(/assets\/belts\//g, 'assets/Belts/')
            .replace(/assets\/gloves\//g, 'assets/Gloves/')
            .replace(/assets\/Boots\//g, 'assets/boots/')
            .replace(/assets\/chests\//g, 'assets/Chests/')
            .replace(/assets\/heroesicons\//gi, 'assets/HeroesIcons/')
            .replace(/assets\/weaponicons\//gi, 'assets/WeaponIcons/')
            .replace(/assets\/skillsicons\//gi, 'assets/SkillsIcons/')
            .replace(/assets\/gearuicons\//gi, 'assets/GearUIIcons/');
    }

    static _buildRetryUrl(baseUrl, attempt) {
        const clean = this.normalizeAssetPath(this._stripRetryParam(baseUrl));
        if (!clean || clean.startsWith('data:') || clean.startsWith('blob:')) return '';
        const sep = clean.includes('?') ? '&' : '?';
        return `${clean}${sep}_mr=${attempt}_${Date.now()}`;
    }

    static _scheduleRetry(img, rawUrl) {
        if (!img || img._mobileRetryPending) return false;
        const attempt = (img._mobileRetryCount || 0) + 1;
        if (attempt > this._maxRetries) return false;

        const base = img._mobileOrigSrc || rawUrl || (img.getAttribute && img.getAttribute('src')) || img.src;
        const nextUrl = this._buildRetryUrl(base, attempt);
        if (!nextUrl) return false;

        img._mobileOrigSrc = this._stripRetryParam(base);
        img._mobileRetryCount = attempt;
        img._mobileRetryPending = true;

        const delayMs = 350 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 240);
        setTimeout(() => {
            img._mobileRetryPending = false;
            // Skip if another retry/load already succeeded
            if (img.complete && img.naturalWidth > 0) return;
            img.src = nextUrl;
        }, delayMs);
        return true;
    }

    static attachImageRetry(img, rawUrl = '', onReady = null) {
        if (!img) return img;
        if (typeof onReady === 'function') {
            if (!img._mobileReadyCallbacks) img._mobileReadyCallbacks = [];
            img._mobileReadyCallbacks.push(onReady);
            if (img.complete && img.naturalWidth > 0) {
                try { onReady(img); } catch (_) {}
            }
        }
        if (!this.isEnabled() || img._mobileRetryBound) return img;

        img._mobileRetryBound = true;
        const initial = rawUrl || (img.getAttribute && img.getAttribute('src')) || img.src;
        if (initial && !initial.startsWith('data:') && !initial.startsWith('blob:')) {
            img._mobileOrigSrc = this._stripRetryParam(initial);
        }

        img.addEventListener('load', () => {
            img._mobileRetryPending = false;
            img._mobileRetryCount = 0;
            const cbs = img._mobileReadyCallbacks;
            if (cbs && cbs.length) {
                for (let i = 0; i < cbs.length; i++) {
                    try { cbs[i](img); } catch (_) {}
                }
            }
        });

        img.addEventListener('error', () => {
            this._scheduleRetry(img, rawUrl);
        });
        return img;
    }

    static ensureImageReady(img, rawUrl = '', onReady = null) {
        if (!img) return false;
        if (img.complete && img.naturalWidth > 0) {
            img._mobileRetryPending = false;
            return true;
        }
        if (!this.isEnabled()) return false;

        if (!img._mobileRetryBound) this.attachImageRetry(img, rawUrl, onReady);

        // Self-heal silently failed/stalled images without spamming every frame
        if (img.complete && img.naturalWidth === 0) {
            const now = Date.now();
            if (!img._mobileLastKickMs || (now - img._mobileLastKickMs) > 1500) {
                img._mobileLastKickMs = now;
                this._scheduleRetry(img, rawUrl);
            }
        }
        return false;
    }

    static sweepBrokenImages(root = null) {
        if (!this.isEnabled() || typeof document === 'undefined') return 0;
        const scope = root || document;
        const imgs = scope.querySelectorAll('img');
        let kicked = 0;
        for (let i = 0; i < imgs.length; i++) {
            const img = imgs[i];
            const rawSrc = img.getAttribute('src') || img.src;
            if (!rawSrc || rawSrc.startsWith('data:') || rawSrc.startsWith('blob:')) continue;
            const normSrc = this.normalizeAssetPath(rawSrc);
            if (normSrc !== rawSrc) {
                img.setAttribute('src', normSrc);
                kicked++;
                continue;
            }
            if (img.getAttribute('loading') === 'lazy') {
                img.removeAttribute('loading');
            }
            if (img.complete && img.naturalWidth === 0 && !img._mobileRetryPending) {
                if (this._scheduleRetry(img, normSrc)) kicked++;
            }
        }
        return kicked;
    }

    static queueSweep(root = null, delayMs = 150) {
        if (!this.isEnabled()) return;
        clearTimeout(this._sweepTimer);
        this._sweepTimer = setTimeout(() => this.sweepBrokenImages(root), delayMs);
    }

    static warmupImages(urls, concurrency = 2) {
        if (!Array.isArray(urls) || urls.length === 0) return Promise.resolve();
        const queue = urls.filter(Boolean);
        let idx = 0;
        const worker = () => {
            if (idx >= queue.length) return Promise.resolve();
            const url = queue[idx++];
            return new Promise((resolve) => {
                const img = typeof CharacterSprites !== 'undefined'
                    ? CharacterSprites.get(url)
                    : (() => { const el = new Image(); el.src = url; return el; })();
                if (img.complete && img.naturalWidth > 0) { resolve(); return; }
                let settled = false;
                const done = () => {
                    if (settled) return;
                    settled = true;
                    resolve();
                };
                img.addEventListener('load', done, { once: true });
                img.addEventListener('error', done, { once: true });
                setTimeout(done, 2500);
            }).then(worker);
        };
        const workers = [];
        const n = Math.max(1, Math.min(concurrency, queue.length));
        for (let i = 0; i < n; i++) workers.push(worker());
        return Promise.all(workers);
    }

    static installGlobalDomGuards() {
        if (!this.isEnabled() || this._domInstalled || typeof document === 'undefined') return;
        this._domInstalled = true;

        document.addEventListener('error', (e) => {
            const t = e && e.target;
            if (!t || t.tagName !== 'IMG') return;
            const raw = (t.getAttribute && t.getAttribute('src')) || t.src;
            if (!raw || raw.startsWith('data:') || raw.startsWith('blob:')) return;
            if (!t._mobileRetryBound) this.attachImageRetry(t, raw);
            this._scheduleRetry(t, raw);
        }, true);

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) this.queueSweep(document, 250);
        });

        document.addEventListener('click', () => {
            this.queueSweep(document, 180);
        }, { passive: true });
    }
}

if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => MobileAssetGuard.installGlobalDomGuards(), { once: true });
    } else {
        MobileAssetGuard.installGlobalDomGuards();
    }
}
