/**
 * Lesa.io - AAA Comic Text Cache & Intelligent Event Throttler
 * 
 * 1. Offscreen Sprite Caching:
 *    Pre-renders vector stroked glyphs to cached bitmaps once.
 *    Subsequent frames use hardware-accelerated GPU drawImage() (0.001ms vs 0.5ms strokeText).
 * 
 * 2. Intelligent Event Curation:
 *    Prevents popup swarms by combining repetitive kills into "DOUBLE K.O!" / "MEGA K.O!",
 *    spatial cluster deduplication, and limiting max active popups to 6 punchy, impactful callouts.
 */

class ComicTextCache {
    constructor() {
        this.cache = new Map();
        const mobPreset = (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile) ? MobilePerf.getPreset() : null;
        this.MAX_ENTRIES = mobPreset ? mobPreset.cacheMaxEntries : 420;
    }

    /**
     * Get or create a pre-rendered high-res offscreen bitmap for styled comic text
     */
    getCanvas(text, color = '#ffdf00', isCrit = false) {
        if (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile && !isCrit && /^\d[\d,]*$/.test(String(text))) {
            return null;
        }
        const key = `${text}_${color}_${isCrit ? 'crit' : 'norm'}`;
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }

        // Create offscreen canvas for text rasterization
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            if (typeof MobilePerf !== 'undefined') MobilePerf.releaseCanvas(canvas);
            return null;
        }
        const fontSize = isCrit ? 34 : 22;
        const fontStr = `900 ${fontSize}px "Luckiest Guy", "Fredoka", sans-serif`;

        ctx.font = fontStr;
        const metrics = ctx.measureText(text);
        const padding = 16;
        const width = Math.ceil(metrics.width + padding * 2);
        const height = Math.ceil(fontSize * 1.6 + padding);

        canvas.width = width;
        canvas.height = height;

        // Render high-contrast cartoon outlined text
        ctx.font = fontStr;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const cx = width / 2;
        const cy = height / 2;

        // Dark heavy cartoon stroke
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = isCrit ? 7 : 5;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(text, cx, cy);

        // Vibrant fill
        ctx.fillStyle = color;
        ctx.fillText(text, cx, cy);

        const result = { canvas, width, height, cx, cy };
        if (this.cache.size >= this.MAX_ENTRIES) {
            const firstKey = this.cache.keys().next().value;
            const evicted = this.cache.get(firstKey);
            if (evicted && evicted.canvas && typeof MobilePerf !== 'undefined' && MobilePerf.isMobile) {
                MobilePerf.releaseCanvas(evicted.canvas);
            }
            this.cache.delete(firstKey);
        }
        this.cache.set(key, result);
        return result;
    }
}

class ComicThrottler {
    constructor() {
        this.recentKills = [];
        this.lastSplashTimes = new Map();
        const mobPreset = (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile) ? MobilePerf.getPreset() : null;
        this.MAX_ACTIVE_COMIC = mobPreset ? mobPreset.maxComic : 6;  // Capped to punchy, readable popups
        this.MAX_ACTIVE_DAMAGE = mobPreset ? mobPreset.maxDamage : 14; // Capped damage numbers
        this._lastMegaKoMs = 0;
        this._lastUtilityMs = 0;
    }

    /**
     * Determines whether a comic splash should spawn or be throttled/upgraded
     */
    filterSplash(x, y, type, activeCount) {
        if (activeCount >= this.MAX_ACTIVE_COMIC) {
            // Prioritize boss shouts or crits
            if (!type.includes('BOSS') && !type.includes('ELA NA SOU') && !type.includes('K.O') && !type.includes('RAGE')) {
                return null;
            }
        }

        const now = performance.now();
        if (activeCount >= 5 && (type === 'CLANG!' || type === '😱 FLEE!')) {
            if (now - this._lastUtilityMs < 55) return null;
            this._lastUtilityMs = now;
        }

        // 1. Cluster Kill Combos ("K.O!" -> "DOUBLE K.O!" -> "MEGA K.O!")
        if (type === 'K.O!' || type === 'K.O') {
            const kills = this.recentKills;
            let w = 0;
            for (let i = 0; i < kills.length; i++) {
                if (now - kills[i] < 550) kills[w++] = kills[i];
            }
            kills.length = w;
            kills.push(now);

            if (kills.length === 2) {
                return { text: 'DOUBLE K.O! 💀', color: '#ff4757', isCrit: true };
            } else if (kills.length >= 3) {
                // During simultaneous mass-kill sweeps (e.g. Yaya Scream), avoid redrawing all 16 slots in 1ms.
                if (kills.length >= 4 && (now - this._lastMegaKoMs < 85)) {
                    return null;
                }
                this._lastMegaKoMs = now;
                return { text: 'MEGA K.O! 💥', color: '#fed330', isCrit: true };
            }
            return { text: 'K.O! 💥', color: '#ff4757', isCrit: false };
        }

        // 2. Spatial & Time Throttle for repetitive slashes / hits
        const lastTime = this.lastSplashTimes.get(type) || 0;
        if (now - lastTime < 140) {
            // Skip duplicate splash spam within 140ms
            return null;
        }

        this.lastSplashTimes.set(type, now);
        return { text: type, color: null, isCrit: type.includes('!') || type.includes('💥') };
    }
}

class FastComicPopup {
    constructor() {
        this.reset(0, 0, '', '#ffdf00', 20, false);
    }

    reset(x, y, text, color = '#ffdf00', size = 20, isCrit = false) {
        this.x = x + (Math.random() * 12 - 6);
        this.y = y - 10;
        this.text = text;
        this.color = color;
        this.isCrit = isCrit;
        this.life = 1.0;
        this.decay = isCrit ? 0.018 : 0.026;
        this.vy = isCrit ? -2.2 : -1.6;
        this.scale = isCrit ? 1.25 : 1.0;
        this.rotation = isCrit ? (Math.random() * 0.16 - 0.08) : 0;
        this.cachedSprite = window.ComicTextCacheInstance ? window.ComicTextCacheInstance.getCanvas(text, color, isCrit) : null;
    }

    update(dt = 1) {
        this.y += this.vy * dt;
        this.vy *= 0.94;
        this.life -= this.decay * dt;
    }

    draw(ctx) {
        if (this.life <= 0) return;

        // Ultra-Fast GPU Bitmap Path via Cached Sprite
        if (this.cachedSprite) {
            const spr = this.cachedSprite;
            const alpha = Math.min(1, this.life * 1.6);
            ctx.globalAlpha = alpha;

            if (this.isCrit || this.rotation !== 0) {
                ctx.save();
                ctx.translate(Math.floor(this.x), Math.floor(this.y));
                ctx.rotate(this.rotation);
                const s = Math.max(0.1, (1 + (1 - this.life) * 0.2) * this.scale);
                ctx.scale(s, s);
                ctx.drawImage(spr.canvas, Math.floor(-spr.cx), Math.floor(-spr.cy));
                ctx.restore();
            } else {
                // Direct integer coordinates (zero matrix overhead)
                ctx.drawImage(spr.canvas, Math.floor(this.x - spr.cx), Math.floor(this.y - spr.cy));
            }
            return;
        }

        // Fallback Vector Path
        ctx.font = this.isCrit ? '900 30px "Luckiest Guy", sans-serif' : '900 20px "Luckiest Guy", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = Math.min(1, this.life * 1.5);
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 5;
        ctx.strokeText(this.text, Math.floor(this.x), Math.floor(this.y));
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, Math.floor(this.x), Math.floor(this.y));
    }
}

// Singletons
window.ComicTextCacheInstance = new ComicTextCache();
window.ComicThrottlerInstance = new ComicThrottler();
window.FastComicPopup = FastComicPopup;
