// ==================== MOUNT OLYMPUS ASSETS ====================
// Loads, caches, and draws custom 2.5D sprites and seamless ground textures
// for Mount Olympus (Dungeons mode), with crisp procedural fallbacks.

const OLYMPUS_ASSET_PATHS = {
    olive_tree: 'assets/Olympus/olive_tree.png',
    snow_pine: 'assets/Olympus/snow_pine.png',
    olympus_pillar: 'assets/Olympus/olympus_pillar.png',
    olympus_boulder: 'assets/Olympus/olympus_boulder.png',
    ascent_stairway: 'assets/Olympus/ascent_stairway.png',
    olympus_brazier: 'assets/Olympus/olympus_brazier.png',
    tile_foothills: 'assets/Olympus/tile_foothills.png',
    tile_alpine_snow: 'assets/Olympus/tile_alpine_snow.png',
    tile_summit_marble: 'assets/Olympus/tile_summit_marble.png'
};

class OlympusAssets {
    static _images = {};
    static _loadedCount = 0;
    static _started = false;
    static _callbacks = [];

    static preloadAll(onAllOrEachReady = null) {
        if (onAllOrEachReady && typeof onAllOrEachReady === 'function') {
            this._callbacks.push(onAllOrEachReady);
        }
        if (this._started || typeof Image === 'undefined') return;
        this._started = true;

        for (const [key, src] of Object.entries(OLYMPUS_ASSET_PATHS)) {
            const img = new Image();
            img.onload = () => {
                this._loadedCount++;
                // Notify listeners (e.g. re-bake ground canvas when a tile finishes loading)
                for (let i = 0; i < this._callbacks.length; i++) {
                    try { this._callbacks[i](key, img); } catch (_) { }
                }
            };
            img.onerror = () => {
                // Silent graceful degradation to vector fallback
            };
            img.src = src;
            this._images[key] = img;
        }
    }

    static get(key) {
        if (!this._started) this.preloadAll();
        const img = this._images[key];
        if (img && img.complete && img.naturalWidth > 0) return img;
        return null;
    }

    static isReady(key) {
        return this.get(key) !== null;
    }

    /**
     * Draw a centered 2.5D sprite anchored around (cx, cy), optionally scaled cleanly.
     */
    static drawCenteredSprite(ctx, key, cx, cy, drawW, drawH, opts = {}) {
        const img = this.get(key);
        if (!img) return false;

        const prevAlpha = ctx.globalAlpha;
        if (opts.alpha !== undefined) ctx.globalAlpha = prevAlpha * opts.alpha;

        if (opts.shadow) {
            ctx.save();
            ctx.fillStyle = opts.shadowColor || 'rgba(10, 14, 24, 0.32)';
            ctx.beginPath();
            ctx.ellipse(
                cx + (opts.shadowOffsetX || 0),
                cy + (opts.shadowOffsetY || drawH * 0.24),
                drawW * (opts.shadowScaleX || 0.38),
                drawH * (opts.shadowScaleY || 0.16),
                0, 0, Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
        }

        const anchorY = opts.anchorY !== undefined ? opts.anchorY : 0.62;
        const dx = cx - drawW * 0.5;
        const dy = cy - drawH * anchorY;
        ctx.drawImage(img, dx, dy, drawW, drawH);

        ctx.globalAlpha = prevAlpha;
        return true;
    }

    /**
     * Paint seamless ground tile onto a target offscreen ground canvas.
     * Supports optional tint overlay so each of the 5 mountain altitudes feels distinct.
     */
    static fillTiledGround(gCtx, key, width, height, scale = 0.5, tint = null) {
        const img = this.get(key);
        if (!img) return false;

        gCtx.save();
        const tileW = Math.max(128, Math.round(img.naturalWidth * scale));
        const tileH = Math.max(128, Math.round(img.naturalHeight * scale));

        const useShared = (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile);
        let patternCanvas = null;
        if (typeof document !== 'undefined') {
            patternCanvas = useShared
                ? (OlympusAssets._sharedPatternCanvas || (OlympusAssets._sharedPatternCanvas = document.createElement('canvas')))
                : document.createElement('canvas');
        }
        if (patternCanvas) {
            patternCanvas.width = tileW;
            patternCanvas.height = tileH;
            const pCtx = patternCanvas.getContext('2d');
            pCtx.clearRect(0, 0, tileW, tileH);
            pCtx.drawImage(img, 0, 0, tileW, tileH);
            const pattern = gCtx.createPattern(patternCanvas, 'repeat');
            if (pattern) {
                gCtx.fillStyle = pattern;
                gCtx.fillRect(0, 0, width, height);
            }
        } else {
            for (let y = 0; y < height; y += tileH) {
                for (let x = 0; x < width; x += tileW) {
                    gCtx.drawImage(img, x, y, tileW, tileH);
                }
            }
        }

        if (tint) {
            gCtx.fillStyle = tint;
            gCtx.fillRect(0, 0, width, height);
        }
        gCtx.restore();
        return true;
    }
}

if (typeof window !== 'undefined') {
    window.OlympusAssets = OlympusAssets;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OlympusAssets, OLYMPUS_ASSET_PATHS };
}

