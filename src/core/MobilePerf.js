/**
 * Lesa.io - Mobile Performance & iOS Safari Reliability Subsystem
 * Strictly active ONLY on mobile/touch devices (Desktop PC paths remain 100% untouched).
 * Fixes iOS Safari canvas VRAM eviction (blank maps), high-DPR fillrate stalls,
 * <audio>.cloneNode() audio glitches, and excessive offscreen atlas/FX budgets.
 */

class MobilePerf {
    static _detectMobile() {
        if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
        const ua = navigator.userAgent || '';
        const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
        const isIPadOS = (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
        const isCoarse = !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
        const minDim = Math.min(window.innerWidth || 9999, window.innerHeight || 9999);
        return isMobileUA || isIPadOS || (isCoarse && minDim <= 1024);
    }

    static _detectIOS() {
        if (typeof navigator === 'undefined') return false;
        const ua = navigator.userAgent || '';
        return /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints || 0) > 1);
    }

    static isMobile = MobilePerf._detectMobile();
    static isIOS = MobilePerf._detectIOS();

    static _hooksBound = false;
    static _audioBuffers = new Map();
    static _audioLoading = new Set();

    static refreshDeviceFlags() {
        this.isMobile = this._detectMobile();
        this.isIOS = this._detectIOS();
        return this.isMobile;
    }

    static getCanvasDpr() {
        const raw = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
        return this.isMobile ? Math.min(raw, 1.25) : Math.min(raw, 2);
    }

    static getGroundCacheScale() {
        return this.isMobile ? 0.5 : 1.0;
    }

    static getAtlasConfig() {
        return this.isMobile
            ? { pageSize: 1024, maxPages: 4, dprCap: 1.0 }
            : { pageSize: 2048, maxPages: 8, dprCap: 2.0 };
    }

    static releaseCanvas(canvas) {
        if (!canvas) return;
        try {
            canvas.width = 0;
            canvas.height = 0;
        } catch (_) {}
    }

    /**
     * Applies canvas sizing and smoothing.
     * Desktop keeps exact original settings; mobile caps DPR to 1.25, uses fast GPU bilinear
     * smoothing, and hooks visualViewport + app-resume canvas recovery for iOS Safari.
     */
    static applyCanvasSettings(game) {
        if (!game || !game.canvas) return;
        const vv = (this.isMobile && typeof window !== 'undefined') ? window.visualViewport : null;
        const cssW = Math.max(1, Math.round((vv && vv.width) ? vv.width : window.innerWidth));
        const cssH = Math.max(1, Math.round((vv && vv.height) ? vv.height : window.innerHeight));
        const dpr = this.getCanvasDpr();

        game.dpr = dpr;
        game.canvas.width = Math.max(1, Math.floor(cssW * dpr));
        game.canvas.height = Math.max(1, Math.floor(cssH * dpr));
        game.canvas.style.width = cssW + 'px';
        game.canvas.style.height = cssH + 'px';

        if (game.ctx) {
            game.ctx.imageSmoothingEnabled = true;
            game.ctx.imageSmoothingQuality = this.isMobile ? 'low' : 'high';
        }
        if (game.camera) {
            game.camera.dpr = dpr;
            game.camera.zoomPunch = 0;
            game.camera.targetZoom = game.camera.computeAdaptiveZoom();
            game.camera.zoom = game.camera.targetZoom;
        }

        if (this.isMobile && !this._hooksBound && typeof window !== 'undefined') {
            this._hooksBound = true;
            let resizeTimer = null;
            const scheduleResize = () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => {
                    if (window.gameInstance && typeof window.gameInstance.resize === 'function') {
                        window.gameInstance.resize();
                    }
                }, 120);
            };
            if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', scheduleResize);
            }
            const recoverSurfaces = () => {
                if (document.visibilityState && document.visibilityState !== 'visible') return;
                const g = window.gameInstance;
                if (!g) return;
                if (typeof g.resize === 'function') g.resize();
                if (g.arena && typeof g.arena.renderGroundCache === 'function') {
                    g.arena.renderGroundCache();
                }
            };
            document.addEventListener('visibilitychange', recoverSurfaces);
            window.addEventListener('pageshow', recoverSurfaces);
        }
    }

    /**
     * Skip rendering the hidden 3000x3000 arena behind the opaque Main Menu on mobile
     * to prevent iPhone thermal throttling before gameplay begins.
     */
    static shouldSkipRender(game) {
        return !!(this.isMobile && game && game.state === 'MENU');
    }

    /**
     * Builds a lightweight 500x500 repeating tile (1 MB vs 36 MB 3000x3000 canvas!)
     * for normal Story/Endless maps on mobile so iOS Safari never evicts the map ground.
     * 500px is an exact multiple of tileSize (100px) and exact divisor of 3000px.
     */
    static buildMobileGroundTile(arena) {
        if (!arena || typeof document === 'undefined') return null;
        const size = 500;
        let tile = arena._mobileTileCanvas;
        if (!tile) {
            tile = document.createElement('canvas');
            arena._mobileTileCanvas = tile;
        }
        if (tile.width !== size || tile.height !== size) {
            tile.width = size;
            tile.height = size;
        }

        const gCtx = tile.getContext('2d');
        if (!gCtx) return null;
        gCtx.imageSmoothingEnabled = true;
        gCtx.imageSmoothingQuality = 'low';

        const tex1 = (typeof Arena !== 'undefined' && Arena.floorTexture1) ? Arena.floorTexture1 : null;
        const tex2 = (typeof Arena !== 'undefined' && Arena.floorTextureGrass2) ? Arena.floorTextureGrass2 : null;
        const readyTex = (tex1 && tex1.complete && tex1.naturalWidth > 0)
            ? tex1
            : ((tex2 && tex2.complete && tex2.naturalWidth > 0) ? tex2 : null);

        if (readyTex) {
            gCtx.drawImage(readyTex, 0, 0, size, size);
            arena._mobileTexReady = true;
        } else {
            gCtx.fillStyle = '#78e08f';
            gCtx.fillRect(0, 0, size, size);
            arena._mobileTexReady = false;
        }

        // Seamless 100px tactical grid baked onto the 500x500 tile
        const step = arena.tileSize || 100;
        gCtx.strokeStyle = 'rgba(40, 140, 50, 0.24)';
        gCtx.lineWidth = 2.0;
        gCtx.beginPath();
        for (let x = 0; x < size; x += step) {
            gCtx.moveTo(x, 0);
            gCtx.lineTo(x, size);
        }
        for (let y = 0; y < size; y += step) {
            gCtx.moveTo(0, y);
            gCtx.lineTo(size, y);
        }
        gCtx.stroke();

        arena._mobileTilePattern = null;
        arena._mobileTilePatternCtx = null;
        return tile;
    }

    /**
     * Draws the normal Story/Endless ground on mobile via repeating 500x500 CanvasPattern
     * clipped strictly to the visible camera viewport rect. Self-heals when textures arrive.
     */
    static drawMobileArenaGround(ctx, camera, arena) {
        if (!arena || !ctx) return;

        // Auto-upgrade from fallback green the exact frame texture completes/decodes
        if (!arena._mobileTexReady) {
            const tex1 = (typeof Arena !== 'undefined') ? Arena.floorTexture1 : null;
            const tex2 = (typeof Arena !== 'undefined') ? Arena.floorTextureGrass2 : null;
            if ((tex1 && tex1.complete && tex1.naturalWidth > 0) || (tex2 && tex2.complete && tex2.naturalWidth > 0)) {
                this.buildMobileGroundTile(arena);
            }
        }
        if (!arena._mobileTileCanvas || arena._mobileTileCanvas.width === 0) {
            this.buildMobileGroundTile(arena);
        }

        let minX = -arena.halfWidth;
        let minY = -arena.halfHeight;
        let maxX = arena.halfWidth;
        let maxY = arena.halfHeight;

        if (camera && camera.canvas) {
            const effZoom = Math.max(0.1, (camera.zoom || 1) * (camera.dpr || 1));
            const halfVW = (camera.canvas.width * 0.5) / effZoom + 64;
            const halfVH = (camera.canvas.height * 0.5) / effZoom + 64;
            minX = Math.max(-arena.halfWidth, Math.floor(camera.x - halfVW));
            minY = Math.max(-arena.halfHeight, Math.floor(camera.y - halfVH));
            maxX = Math.min(arena.halfWidth, Math.ceil(camera.x + halfVW));
            maxY = Math.min(arena.halfHeight, Math.ceil(camera.y + halfVH));
        }

        const w = maxX - minX;
        const h = maxY - minY;
        if (w <= 0 || h <= 0) return;

        if (arena._mobileTileCanvas && arena._mobileTileCanvas.width > 0) {
            if (!arena._mobileTilePattern || arena._mobileTilePatternCtx !== ctx) {
                arena._mobileTilePattern = ctx.createPattern(arena._mobileTileCanvas, 'repeat');
                arena._mobileTilePatternCtx = ctx;
            }
            if (arena._mobileTilePattern) {
                ctx.fillStyle = arena._mobileTilePattern;
                ctx.fillRect(minX, minY, w, h);
                return;
            }
        }
        ctx.fillStyle = '#78e08f';
        ctx.fillRect(minX, minY, w, h);
    }

    /**
     * Draws a DPR-accurate, scale-aware slice of cachedGroundCanvas (used on Mobile Olympus Dungeons).
     * Fixes the 4x mobile overdraw bug and self-heals if iOS WebKit evicts the backing store.
     */
    static drawScaledCachedGround(ctx, camera, arena) {
        if (!arena || !ctx) return false;
        if (!arena.cachedGroundCanvas || arena.cachedGroundCanvas.width === 0 || arena.cachedGroundCanvas.height === 0) {
            if (typeof arena.renderGroundCache === 'function') arena.renderGroundCache();
            if (!arena.cachedGroundCanvas || arena.cachedGroundCanvas.width === 0) return false;
        }

        const scale = arena.groundCacheScale || (arena.cachedGroundCanvas.width / Math.max(1, arena.width));
        if (!camera || !camera.canvas) {
            ctx.drawImage(arena.cachedGroundCanvas, -arena.halfWidth, -arena.halfHeight, arena.width, arena.height);
            return true;
        }

        const effZoom = Math.max(0.1, (camera.zoom || 1) * (camera.dpr || 1));
        const halfVW = (camera.canvas.width * 0.5) / effZoom + 64;
        const halfVH = (camera.canvas.height * 0.5) / effZoom + 64;

        const worldLeft = Math.max(0, Math.floor(camera.x + arena.halfWidth - halfVW));
        const worldTop = Math.max(0, Math.floor(camera.y + arena.halfHeight - halfVH));
        const worldRight = Math.min(arena.width, Math.ceil(camera.x + arena.halfWidth + halfVW));
        const worldBottom = Math.min(arena.height, Math.ceil(camera.y + arena.halfHeight + halfVH));
        const worldW = worldRight - worldLeft;
        const worldH = worldBottom - worldTop;

        if (worldW <= 0 || worldH <= 0) return true;

        const sx = Math.floor(worldLeft * scale);
        const sy = Math.floor(worldTop * scale);
        const sw = Math.min(arena.cachedGroundCanvas.width - sx, Math.ceil(worldW * scale));
        const sh = Math.min(arena.cachedGroundCanvas.height - sy, Math.ceil(worldH * scale));

        if (sw > 0 && sh > 0) {
            ctx.drawImage(
                arena.cachedGroundCanvas,
                sx, sy, sw, sh,
                worldLeft - arena.halfWidth, worldTop - arena.halfHeight, worldW, worldH
            );
        }
        return true;
    }

    /**
     * Web Audio API buffer playback for mobile SFX.
     * Avoids iOS Safari <audio>.cloneNode() AVPlayer spawns that cause frame stutters in combat.
     */
    static playMobileAudio(soundEngine, audioEl, volumeMult = 1, onError = null) {
        if (!soundEngine || !audioEl) return false;
        const src = audioEl.src || audioEl.getAttribute?.('src');
        const ctx = soundEngine.ctx;
        const vol = Math.max(0, Math.min(1, (soundEngine.masterVolume || 0.5) * volumeMult));

        if (ctx && ctx.state === 'running' && src) {
            const cached = this._audioBuffers.get(src);
            if (cached) {
                try {
                    const source = ctx.createBufferSource();
                    source.buffer = cached;
                    const gain = ctx.createGain();
                    gain.gain.setValueAtTime(vol, ctx.currentTime);
                    source.connect(gain);
                    gain.connect(ctx.destination);
                    source.start(0);
                    return true;
                } catch (_) {}
            } else if (!this._audioLoading.has(src) && typeof fetch === 'function' && !src.startsWith('file:')) {
                this._audioLoading.add(src);
                fetch(src)
                    .then((r) => (r.ok ? r.arrayBuffer() : null))
                    .then((ab) => (ab && soundEngine.ctx ? soundEngine.ctx.decodeAudioData(ab) : null))
                    .then((buf) => {
                        if (buf) this._audioBuffers.set(src, buf);
                    })
                    .catch(() => {})
                    .finally(() => this._audioLoading.delete(src));
            }
        }

        // Safe non-cloning reuse fallback while buffer decodes or if offline
        try {
            audioEl.volume = vol;
            audioEl.currentTime = 0;
            const p = audioEl.play();
            if (p !== undefined) {
                p.catch(() => { if (onError) onError(); });
            }
            return true;
        } catch (_) {
            if (onError) onError();
            return false;
        }
    }
}

if (typeof window !== 'undefined') {
    window.MobilePerf = MobilePerf;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MobilePerf };
}
