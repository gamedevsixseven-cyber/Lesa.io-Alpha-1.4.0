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
    static _highLightCanvas = null;
    static _fpsFrames = 0;
    static _fpsLastMs = 0;
    static _fpsValue = 60;

    static GRAPHICS_PRESETS = {
        low: {
            pixelBudget: 850000, minDpr: 0.85, maxDpr: 1.0, smoothing: 'low',
            groundScale: 0.5, tileSupScale: 1.0,
            atlas: { pageSize: 1024, maxPages: 6, dprCap: 1.0 },
            glows: false, ambientLighting: false, treeSize: 224,
            maxParticles: 12, maxPopups: 7, maxMuzzles: 6, maxSplats: 6, maxPoofs: 6,
            maxComic: 3, maxDamage: 6, cacheMaxEntries: 160, snowCap: 24, fogCap: 6, emberCap: 8
        },
        medium: {
            pixelBudget: 1250000, minDpr: 1.0, maxDpr: 1.45, smoothing: 'medium',
            groundScale: 0.75, tileSupScale: 1.5,
            atlas: { pageSize: 1024, maxPages: 6, dprCap: 1.25 },
            glows: false, ambientLighting: false, treeSize: 288,
            maxParticles: 24, maxPopups: 11, maxMuzzles: 10, maxSplats: 12, maxPoofs: 10,
            maxComic: 4, maxDamage: 8, cacheMaxEntries: 160, snowCap: 42, fogCap: 10, emberCap: 12
        },
        high: {
            pixelBudget: 2800000, minDpr: 1.75, maxDpr: 2.5, smoothing: 'high',
            groundScale: 1.0, tileSupScale: 2.0,
            atlas: { pageSize: 2048, maxPages: 8, dprCap: 2.0 },
            glows: true, ambientLighting: true, treeSize: 460,
            maxParticles: 56, maxPopups: 18, maxMuzzles: 24, maxSplats: 28, maxPoofs: 24,
            maxComic: 6, maxDamage: 14, cacheMaxEntries: 220, snowCap: 999, fogCap: 24, emberCap: 30
        }
    };

    static getGraphicsQuality() {
        if (!this.isMobile) return 'high';
        try {
            const v = localStorage.getItem('lesaio_mobile_graphics');
            return (v === 'low' || v === 'medium' || v === 'high') ? v : 'medium';
        } catch (_) {
            return 'medium';
        }
    }

    static getPreset() {
        return this.GRAPHICS_PRESETS[this.getGraphicsQuality()] || this.GRAPHICS_PRESETS.medium;
    }

    static isHighGraphics() {
        return !!(this.isMobile && this.getGraphicsQuality() === 'high');
    }

    static isLowGraphics() {
        return !!(this.isMobile && this.getGraphicsQuality() === 'low');
    }

    static shouldUseGlows() {
        return !this.isMobile || this.getGraphicsQuality() === 'high';
    }

    static shouldShowAimReticle() {
        if (!this.isMobile) return false;
        try { return localStorage.getItem('lesaio_aim_reticle') !== 'false'; } catch (_) { return true; }
    }

    static isHapticsEnabled() {
        if (!this.isMobile) return false;
        try { return localStorage.getItem('lesaio_haptics') !== 'false'; } catch (_) { return true; }
    }

    static shouldShowFps() {
        if (!this.isMobile) return false;
        try { return localStorage.getItem('lesaio_show_fps') === 'true'; } catch (_) { return false; }
    }

    static getAutoAimRange() {
        try {
            const v = parseInt(localStorage.getItem('lesaio_autoaim_range'), 10);
            return Number.isFinite(v) && v >= 350 && v <= 1200 ? v : 750;
        } catch (_) {
            return 750;
        }
    }

    static getTouchOpacity() {
        try {
            const v = parseFloat(localStorage.getItem('lesaio_touch_opacity'));
            return Number.isFinite(v) && v >= 0.3 && v <= 1.0 ? v : 1.0;
        } catch (_) {
            return 1.0;
        }
    }

    static shouldAutoPauseOnBlur() {
        try { return localStorage.getItem('lesaio_mobile_autopause') !== 'false'; } catch (_) { return true; }
    }

    static refreshDeviceFlags() {
        this.isMobile = this._detectMobile();
        this.isIOS = this._detectIOS();
        return this.isMobile;
    }

    static getCanvasDpr(cssW = 0, cssH = 0) {
        const raw = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
        if (!this.isMobile) return Math.min(raw, 2);
        const preset = this.getPreset();
        const maxDpr = this.isIOS ? Math.min(preset.maxDpr, 1.35) : preset.maxDpr;
        const vl = (typeof VirtualLandscape !== 'undefined' && VirtualLandscape.active) ? VirtualLandscape.getViewportSize() : null;
        const w = cssW || (vl && vl.width) || (typeof window !== 'undefined' && window.innerWidth) || 844;
        const h = cssH || (vl && vl.height) || (typeof window !== 'undefined' && window.innerHeight) || 390;
        const budgetDpr = Math.sqrt(preset.pixelBudget / Math.max(1, w * h));
        return Math.min(raw, Math.max(preset.minDpr, Math.min(maxDpr, budgetDpr)));
    }

    static getGroundCacheScale() {
        return this.isMobile ? this.getPreset().groundScale : 1.0;
    }

    static getAtlasConfig() {
        if (!this.isMobile) return { pageSize: 2048, maxPages: 8, dprCap: 2.0 };
        const a = this.getPreset().atlas;
        return this.isIOS ? { pageSize: Math.min(a.pageSize, 1024), maxPages: Math.min(a.maxPages, 6), dprCap: Math.min(a.dprCap, 1.35) } : a;
    }

    static createContext(canvas) {
        if (!canvas) return null;
        const ctx = (this.isMobile && !this.isIOS)
            ? (canvas.getContext('2d', { alpha: false }) || canvas.getContext('2d'))
            : canvas.getContext('2d');
        if (this.isMobile && typeof MobileCanvasGuard !== 'undefined') {
            MobileCanvasGuard.attachSaveDepthGuard(ctx);
        }
        return ctx;
    }

    static releaseCanvas(canvas) {
        if (!canvas) return;
        try {
            canvas.width = 0;
            canvas.height = 0;
        } catch (_) { }
    }

    /**
     * Applies canvas sizing and smoothing.
     * Desktop keeps exact original settings; mobile caps DPR to 1.25, uses fast GPU bilinear
     * smoothing, and hooks visualViewport + app-resume canvas recovery for iOS Safari.
     */
    static applyCanvasSettings(game, forceResize = false) {
        if (!game || !game.canvas) return;
        const vl = (this.isMobile && typeof VirtualLandscape !== 'undefined' && VirtualLandscape.active) ? VirtualLandscape.getViewportSize() : null;
        const vv = (this.isMobile && !vl && typeof window !== 'undefined') ? window.visualViewport : null;
        const cssW = Math.max(1, Math.round((vl && vl.width) || (vv && vv.width) || window.innerWidth));
        const cssH = Math.max(1, Math.round((vl && vl.height) || (vv && vv.height) || window.innerHeight));
        const dpr = this.getCanvasDpr(cssW, cssH);
        const tw = Math.max(1, Math.floor(cssW * dpr));
        const th = Math.max(1, Math.floor(cssH * dpr));
        const changed = forceResize || Math.abs(game.canvas.width - tw) > 1 || Math.abs(game.canvas.height - th) > 1;
        game.dpr = dpr;
        game._mobileCssW = cssW;
        game._mobileCssH = cssH;
        if (changed) {
            game.canvas.width = tw;
            game.canvas.height = th;
            game.canvas.style.width = cssW + 'px';
            game.canvas.style.height = cssH + 'px';
            if (game.arena) game.arena._mobileTilePatternCtx = null;
        }
        if (game.ctx) {
            game.ctx.imageSmoothingEnabled = true;
            game.ctx.imageSmoothingQuality = this.isMobile ? this.getPreset().smoothing : 'high';
        }
        if (typeof MobileCanvasGuard !== 'undefined') MobileCanvasGuard.bindRecoveryListeners(game);
        if (game.camera) {
            game.camera.dpr = dpr;
            game.camera.zoomPunch = 0;
            game.camera.targetZoom = game.camera.computeAdaptiveZoom();
            game.camera.zoom = game.camera.targetZoom;
        }

        if (this.isMobile && !this._hooksBound && typeof MobileCanvasGuard !== 'undefined') {
            this._hooksBound = true;
            MobileCanvasGuard.bindViewportHooks();
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
        const preset = this.getPreset();
        const canScalePattern = typeof DOMMatrix === 'function' && typeof CanvasPattern !== 'undefined' && CanvasPattern.prototype && typeof CanvasPattern.prototype.setTransform === 'function';
        const supScale = canScalePattern ? preset.tileSupScale : 1.0;
        const size = Math.round(500 * supScale);
        arena._mobileTileSupScale = supScale;
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
        gCtx.imageSmoothingQuality = preset.smoothing;

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

        // Seamless 100px tactical grid baked onto the supersampled pattern tile
        const step = (arena.tileSize || 100) * supScale;
        gCtx.strokeStyle = this.isHighGraphics() ? 'rgba(34, 128, 44, 0.28)' : 'rgba(40, 140, 50, 0.24)';
        gCtx.lineWidth = (this.isHighGraphics() ? 2.2 : 2.0) * supScale;
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

        // High Graphics Mobile Upgrade: crisp sunlit highlight bevel & subtle grass tufts
        if (this.isHighGraphics()) {
            gCtx.strokeStyle = 'rgba(220, 255, 200, 0.14)';
            gCtx.lineWidth = 1.1 * supScale;
            gCtx.beginPath();
            for (let x = 0; x < size; x += step) {
                gCtx.moveTo(x + 2 * supScale, 0);
                gCtx.lineTo(x + 2 * supScale, size);
            }
            gCtx.stroke();
            gCtx.fillStyle = 'rgba(195, 245, 130, 0.20)';
            for (let gx = 28; gx < 500; gx += 75) {
                for (let gy = 22; gy < 500; gy += 88) {
                    const px = ((gx + gy * 3) % 480 + 10) * supScale;
                    const py = ((gy + gx * 2) % 480 + 10) * supScale;
                    gCtx.fillRect(px, py, 3 * supScale, 2 * supScale);
                }
            }
        }

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
                const pat = ctx.createPattern(arena._mobileTileCanvas, 'repeat');
                if (pat && arena._mobileTileSupScale > 1 && typeof DOMMatrix === 'function' && typeof pat.setTransform === 'function') {
                    pat.setTransform(new DOMMatrix().scale(1 / arena._mobileTileSupScale));
                }
                arena._mobileTilePattern = pat;
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
        const hasHttp = (typeof location === 'undefined' || location.protocol !== 'file:');

        if (ctx && src) {
            const cached = this._audioBuffers.get(src);
            if (cached && ctx.state === 'running') {
                try {
                    const source = ctx.createBufferSource();
                    source.buffer = cached;
                    const gain = ctx.createGain();
                    gain.gain.setValueAtTime(vol, ctx.currentTime);
                    source.connect(gain);
                    gain.connect(ctx.destination);
                    source.start(0);
                    return true;
                } catch (_) { }
            } else if (!cached && !this._audioLoading.has(src) && typeof fetch === 'function' && !src.startsWith('file:')) {
                this._audioLoading.add(src);
                fetch(src)
                    .then((r) => (r.ok ? r.arrayBuffer() : null))
                    .then((ab) => (ab && soundEngine.ctx ? soundEngine.ctx.decodeAudioData(ab) : null))
                    .then((buf) => { if (buf) this._audioBuffers.set(src, buf); })
                    .catch(() => { })
                    .finally(() => this._audioLoading.delete(src));
            }
        }
        // On HTTP/HTTPS, avoid triggering HTMLAudioElement playback (spawns mobile media notification); let ProceduralSynth handle cold tap
        if (hasHttp && (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined')) return false;

        // Offline file:// fallback
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

    /**
     * Subtle theatrical contrast vignette & depth lighting baked once to an offscreen sprite
     * for Mobile "High" Graphics Mode (zero per-frame gradient allocations).
     */
    static drawHighQualityLighting(ctx, width, height) {
        if (!ctx || width <= 0 || height <= 0 || !this.isHighGraphics()) return;
        if (!this._highLightCanvas && typeof document !== 'undefined') {
            const c = document.createElement('canvas');
            c.width = 256;
            c.height = 256;
            const gctx = c.getContext('2d');
            if (!gctx) { this.releaseCanvas(c); return; }
            const g = gctx.createRadialGradient(128, 128, 66, 128, 128, 152);
            g.addColorStop(0, 'rgba(255, 252, 232, 0.05)');
            g.addColorStop(0.62, 'rgba(0, 0, 0, 0)');
            g.addColorStop(1, 'rgba(10, 22, 18, 0.34)');
            gctx.fillStyle = g;
            gctx.fillRect(0, 0, 256, 256);
            this._highLightCanvas = c;
        }
        if (this._highLightCanvas) {
            const prev = ctx.globalAlpha;
            ctx.globalAlpha = prev * 0.65;
            ctx.drawImage(this._highLightCanvas, 0, 0, width, height);
            ctx.globalAlpha = prev;
        }
    }

    static applyFxBudgets(game = null) {
        if (!this.isMobile) return;
        const p = this.getPreset();
        const fx = (game && game.effects) || (typeof window !== 'undefined' && window.gameInstance ? window.gameInstance.effects : null);
        if (fx) {
            fx.MAX_POPUPS = p.maxPopups;
            fx.MAX_PARTICLES = p.maxParticles;
            if (fx.combatJuice) {
                if (typeof fx.combatJuice.resizePools === 'function') {
                    fx.combatJuice.resizePools(p.maxMuzzles, p.maxSplats, p.maxPoofs);
                } else {
                    fx.combatJuice.MAX_MUZZLES = p.maxMuzzles;
                    fx.combatJuice.MAX_SPLATS = p.maxSplats;
                    fx.combatJuice.MAX_POOFS = p.maxPoofs;
                }
            }
        }
        if (typeof window !== 'undefined' && window.ComicThrottlerInstance) {
            window.ComicThrottlerInstance.MAX_ACTIVE_COMIC = p.maxComic;
            window.ComicThrottlerInstance.MAX_ACTIVE_DAMAGE = p.maxDamage;
        }
        if (typeof window !== 'undefined' && window.ComicTextCacheInstance) {
            window.ComicTextCacheInstance.MAX_ENTRIES = p.cacheMaxEntries;
        }
    }

    static setGraphicsQuality(level, game = null) {
        const clean = (level === 'low' || level === 'medium' || level === 'high') ? level : 'medium';
        try { localStorage.setItem('lesaio_mobile_graphics', clean); } catch (_) { }
        if (!this.isMobile) return clean;
        if (typeof Obstacle !== 'undefined') {
            Obstacle._scaledTreeCanvas = null;
            Obstacle._charredTreeCanvas = null;
        }
        if (typeof EndlessBuildingRenderer !== 'undefined' && EndlessBuildingRenderer._cache) {
            EndlessBuildingRenderer._cache.clear();
        }
        if (typeof EndlessMapEvolution !== 'undefined') {
            EndlessMapEvolution._motes = null;
        }
        if (typeof SpriteAtlasCache !== 'undefined' && typeof SpriteAtlasCache.clearCache === 'function') {
            SpriteAtlasCache.clearCache();
        }
        if (typeof KolossosArenaAtmosphere !== 'undefined') {
            KolossosArenaAtmosphere._fogClouds = null;
            KolossosArenaAtmosphere._embers = null;
        }
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        this.applyFxBudgets(g);
        if (g) {
            if (typeof g.resize === 'function') g.resize();
            else this.applyCanvasSettings(g);
            if (g.arena && g.arena.dungeonFloor && typeof DungeonMapTheme !== 'undefined' && typeof DungeonMapTheme.rebuildGroundOnly === 'function') {
                DungeonMapTheme.rebuildGroundOnly(g.arena, g.arena.dungeonFloor);
            } else if (g.arena && typeof g.arena.renderGroundCache === 'function') {
                g.arena.renderGroundCache();
            }
            if (g.waveManager && g.waveManager.dungeonManager && typeof g.waveManager.dungeonManager.initSnowParticles === 'function') {
                const dm = g.waveManager.dungeonManager;
                if (dm.active) dm.initSnowParticles(dm.floor >= 4 ? 95 : 55);
            }
        }
        return clean;
    }

    static tickFpsHUD(el) {
        if (!el) return;
        const show = this.shouldShowFps();
        if (!show) {
            if (!el.classList.contains('hidden')) el.classList.add('hidden');
            return;
        }
        if (el.classList.contains('hidden')) el.classList.remove('hidden');
        this._fpsFrames++;
        const now = (typeof performance !== 'undefined') ? performance.now() : Date.now();
        if (!this._fpsLastMs) {
            this._fpsLastMs = now;
            el.textContent = `${this._fpsValue} FPS • ${this.getGraphicsQuality().toUpperCase()}`;
            return;
        }
        const elapsed = now - this._fpsLastMs;
        if (elapsed >= 450) {
            this._fpsValue = Math.max(1, Math.min(120, Math.round((this._fpsFrames * 1000) / elapsed)));
            this._fpsFrames = 0;
            this._fpsLastMs = now;
            el.textContent = `${this._fpsValue} FPS • ${this.getGraphicsQuality().toUpperCase()}`;
        }
    }
}

if (typeof window !== 'undefined') {
    window.MobilePerf = MobilePerf;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MobilePerf };
}
