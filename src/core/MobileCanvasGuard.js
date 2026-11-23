/**
 * MobileCanvasGuard - Mobile-only 2D Canvas freeze & GPU context-loss protection.
 * Keeps Desktop PC paths 100% untouched.
 *
 * Protects against iPhone/iOS Safari WebKit GPU freezes by:
 * 1. Wrapping ctx.save/restore depth and unwinding any leaked transform/clip stack
 *    each frame so a transient entity draw error can never freeze subsequent frames.
 * 2. Listening for `contextlost` / `contextrestored` and automatically replacing an
 *    evicted/stalled <canvas> GPU surface while purging heavy offscreen caches.
 */
class MobileCanvasGuard {
    static isEnabled() {
        return typeof MobilePerf !== 'undefined' && !!MobilePerf.isMobile;
    }

    static attachSaveDepthGuard(ctx) {
        if (!ctx || ctx._mcgWrapped || !this.isEnabled()) return ctx;
        const origSave = ctx.save.bind(ctx);
        const origRestore = ctx.restore.bind(ctx);
        ctx._mcgSaveDepth = 0;
        ctx._mcgWrapped = true;

        ctx.save = function () {
            this._mcgSaveDepth = (this._mcgSaveDepth || 0) + 1;
            return origSave();
        };
        ctx.restore = function () {
            if ((this._mcgSaveDepth || 0) > 0) {
                this._mcgSaveDepth--;
                return origRestore();
            }
            return undefined;
        };
        return ctx;
    }

    static unwindSaveStack(ctx, targetDepth = 0) {
        if (!ctx) return;
        const guard = Math.max(0, targetDepth | 0);
        let safety = 128;
        while ((ctx._mcgSaveDepth || 0) > guard && safety-- > 0) {
            ctx.restore();
        }
        if (typeof ctx.setTransform === 'function') ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        if (ctx.globalCompositeOperation && ctx.globalCompositeOperation !== 'source-over') {
            ctx.globalCompositeOperation = 'source-over';
        }
    }

    static bindRecoveryListeners(game) {
        if (!this.isEnabled() || !game || !game.canvas || game.canvas._mcgBound) return;
        const canvas = game.canvas;
        canvas._mcgBound = true;

        canvas.addEventListener('contextlost', (e) => {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            game._mobileCtxLost = true;
            game._mobileLostFrames = 0;
        }, false);

        canvas.addEventListener('contextrestored', () => {
            game._mobileCtxLost = false;
            game._mobileLostFrames = 0;
            if (typeof MobilePerf !== 'undefined') MobilePerf.applyCanvasSettings(game, true);
        }, false);
    }

    static bindViewportHooks() {
        if (!this.isEnabled() || this._viewportBound || typeof window === 'undefined') return;
        this._viewportBound = true;
        let resizeTimer = null;
        const scheduleResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const g = window.gameInstance;
                if (!g || typeof g.resize !== 'function') return;
                const curVl = (typeof VirtualLandscape !== 'undefined' && VirtualLandscape.active) ? VirtualLandscape.getViewportSize() : null;
                const curVv = !curVl ? window.visualViewport : null;
                const nw = Math.round((curVl && curVl.width) || (curVv && curVv.width) || window.innerWidth);
                const nh = Math.round((curVl && curVl.height) || (curVv && curVv.height) || window.innerHeight);
                if (g.state === 'PLAYING' && Math.abs(nw - (g._mobileCssW || nw)) < 24 && Math.abs(nh - (g._mobileCssH || nh)) < 24) return;
                g.resize();
            }, 140);
        };
        if (window.visualViewport) window.visualViewport.addEventListener('resize', scheduleResize);
        const recoverSurfaces = () => {
            if (document.visibilityState && document.visibilityState !== 'visible') return;
            const g = window.gameInstance;
            if (!g) return;
            this.ensureContextAlive(g);
            if (g.arena && typeof g.arena.renderGroundCache === 'function') g.arena.renderGroundCache();
            if (g.state === 'PLAYING' && this._wakeLockWanted) this.requestWakeLock();
        };
        document.addEventListener('visibilitychange', recoverSurfaces);
        window.addEventListener('pageshow', recoverSurfaces);
    }

    static purgeHeavyCaches() {
        if (typeof SpriteAtlasCache !== 'undefined' && typeof SpriteAtlasCache.clearCache === 'function') {
            SpriteAtlasCache.clearCache();
        }
        if (typeof CharacterSprites !== 'undefined' && CharacterSprites.filteredCache) {
            for (const k of Object.keys(CharacterSprites.filteredCache)) {
                const ent = CharacterSprites.filteredCache[k];
                if (ent && ent.canvas && typeof MobilePerf !== 'undefined') MobilePerf.releaseCanvas(ent.canvas);
                delete CharacterSprites.filteredCache[k];
            }
            if (Array.isArray(CharacterSprites._filteredKeys)) CharacterSprites._filteredKeys.length = 0;
        }
        if (typeof FoliageRenderer !== 'undefined' && FoliageRenderer._spriteCache) {
            if (typeof MobilePerf !== 'undefined') {
                for (const ent of FoliageRenderer._spriteCache.values()) {
                    if (ent && ent.canvas) MobilePerf.releaseCanvas(ent.canvas);
                }
            }
            FoliageRenderer._spriteCache.clear();
        }
        if (typeof window !== 'undefined' && window.ComicTextCacheInstance && window.ComicTextCacheInstance.cache) {
            const c = window.ComicTextCacheInstance.cache;
            if (typeof MobilePerf !== 'undefined') {
                for (const ent of c.values()) {
                    if (ent && ent.canvas) MobilePerf.releaseCanvas(ent.canvas);
                }
            }
            c.clear();
        }
        if (typeof EndlessBuildingRenderer !== 'undefined' && EndlessBuildingRenderer._cache) {
            if (typeof MobilePerf !== 'undefined') {
                for (const ent of EndlessBuildingRenderer._cache.values()) {
                    if (ent && ent.canvas) MobilePerf.releaseCanvas(ent.canvas);
                }
            }
            EndlessBuildingRenderer._cache.clear();
        }
        if (typeof Drop !== 'undefined') {
            for (const mapRef of [Drop._spriteCache, Drop._shadowCache]) {
                if (!mapRef) continue;
                if (typeof MobilePerf !== 'undefined') {
                    for (const ent of mapRef.values()) if (ent && ent.canvas) MobilePerf.releaseCanvas(ent.canvas);
                }
                mapRef.clear();
            }
        }
    }

    static ensureContextAlive(game) {
        if (!this.isEnabled() || !game || !game.canvas) return true;
        const ctx = game.ctx;
        if (ctx && !ctx._mcgWrapped) this.attachSaveDepthGuard(ctx);

        const isLost = !ctx || !!game._mobileCtxLost || (typeof ctx.isContextLost === 'function' && ctx.isContextLost());
        if (!isLost) {
            game._mobileLostFrames = 0;
            return true;
        }

        game._mobileLostFrames = (game._mobileLostFrames || 0) + 1;
        // Wait briefly for browser-native contextrestored; otherwise recreate the canvas GPU surface
        if (ctx && game._mobileLostFrames < 12) return false;

        this.purgeHeavyCaches();
        const oldCanvas = game.canvas;
        const parent = oldCanvas.parentNode;
        if (!parent || typeof document === 'undefined') return false;

        const fresh = document.createElement('canvas');
        fresh.id = oldCanvas.id || 'game-canvas';
        if (oldCanvas.className) fresh.className = oldCanvas.className;
        fresh.style.cssText = oldCanvas.style.cssText;
        parent.replaceChild(fresh, oldCanvas);
        if (typeof MobilePerf !== 'undefined') MobilePerf.releaseCanvas(oldCanvas);

        game.canvas = fresh;
        game.ctx = (typeof MobilePerf !== 'undefined') ? MobilePerf.createContext(fresh) : fresh.getContext('2d');
        game._mobileCtxLost = false;
        game._mobileLostFrames = 0;
        if (game.camera) game.camera.canvas = fresh;
        if (game.input) game.input.canvas = fresh;
        if (game.arena) game.arena._mobileTilePatternCtx = null;

        this.bindRecoveryListeners(game);
        if (typeof MobilePerf !== 'undefined') MobilePerf.applyCanvasSettings(game, true);
        return !!game.ctx;
    }

    /**
     * Keep mobile display awake during active gameplay using the Screen Wake Lock API,
     * safely guarding against hidden tabs, race toggles, and unsupported WebViews.
     */
    static async requestWakeLock() {
        if (typeof navigator === 'undefined' || !navigator.wakeLock || typeof navigator.wakeLock.request !== 'function') return false;
        if (typeof document !== 'undefined' && document.visibilityState && document.visibilityState !== 'visible') return false;
        if (this._wakeLock && !this._wakeLock.released) return true;
        if (this._wakeLockPending) return false;
        this._wakeLockPending = true;
        try {
            const sentinel = await navigator.wakeLock.request('screen');
            if (!this._wakeLockWanted) {
                if (sentinel && typeof sentinel.release === 'function') sentinel.release().catch(() => {});
                return false;
            }
            this._wakeLock = sentinel;
            if (sentinel && typeof sentinel.addEventListener === 'function') {
                sentinel.addEventListener('release', () => {
                    if (this._wakeLock === sentinel) this._wakeLock = null;
                });
            }
            return true;
        } catch {
            return false;
        } finally {
            this._wakeLockPending = false;
        }
    }

    static releaseWakeLock() {
        this._wakeLockWanted = false;
        const sentinel = this._wakeLock;
        this._wakeLock = null;
        if (sentinel && typeof sentinel.release === 'function') {
            try { sentinel.release().catch(() => {}); } catch {}
        }
    }

    static syncWakeLock(shouldKeepAwake) {
        if (shouldKeepAwake) {
            this._wakeLockWanted = true;
            this.requestWakeLock();
        } else {
            this.releaseWakeLock();
        }
    }
}

if (typeof window !== 'undefined') {
    window.MobileCanvasGuard = MobileCanvasGuard;
}
