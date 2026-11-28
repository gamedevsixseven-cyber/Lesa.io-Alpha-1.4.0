/**
 * Lesa.io - Character Sprite Cache & Preloader
 * Manages front/back sprite images for Heroes and Enemies with instant caching
 */

class CharacterSprites {
    static cache = {};
    static filteredCache = Object.create(null);
    static _filteredKeys = [];

    static get(src) {
        if (!src) return null;
        if (!CharacterSprites.cache[src]) {
            const img = new Image();
            if (typeof MobileAssetGuard !== 'undefined') {
                MobileAssetGuard.attachImageRetry(img, src);
            }
            img.src = src;
            CharacterSprites.cache[src] = img;
        } else if (typeof MobileAssetGuard !== 'undefined') {
            MobileAssetGuard.ensureImageReady(CharacterSprites.cache[src], src);
        }
        return CharacterSprites.cache[src];
    }

    static isReady(src) {
        const img = CharacterSprites.get(src);
        return Boolean(img && img.complete && img.naturalWidth > 0);
    }

    static getFiltered(imgOrSrc, variantKey, filterCss, padPx = 0) {
        const img = (typeof imgOrSrc === 'string') ? CharacterSprites.get(imgOrSrc) : imgOrSrc;
        if (!img || !img.complete || img.naturalWidth <= 0) return null;
        const srcKey = (typeof imgOrSrc === 'string') ? imgOrSrc : (img.getAttribute && img.getAttribute('src')) || img.src;
        const key = `${srcKey}|${variantKey}|${padPx}`;
        const existing = CharacterSprites.filteredCache[key];
        if (existing && existing.canvas && existing.canvas.width > 0) return existing;

        const isMobile = typeof MobilePerf !== 'undefined' && MobilePerf.isMobile;
        const rawW = img.naturalWidth;
        const rawH = img.naturalHeight;
        // On mobile clamp offscreen filtered sprites to <= 220px to avoid iOS WebKit GPU VRAM exhaustion & CSS filter hangs
        const maxDim = isMobile ? 220 : Math.max(rawW, rawH);
        const scale = isMobile ? Math.min(1, maxDim / Math.max(1, rawW, rawH)) : 1;
        const w = Math.max(1, Math.round(rawW * scale));
        const h = Math.max(1, Math.round(rawH * scale));
        const drawPad = Math.round(padPx * scale);

        const canvas = document.createElement('canvas');
        canvas.width = w + drawPad * 2;
        canvas.height = h + drawPad * 2;
        const fctx = canvas.getContext('2d');
        if (!fctx) {
            if (typeof MobilePerf !== 'undefined') MobilePerf.releaseCanvas(canvas);
            return null;
        }

        if (isMobile) {
            // Avoid expensive WebKit CSS canvas filters on large hero/boss sprites
            if (variantKey === 'charge_red' || (filterCss && filterCss.includes('drop-shadow'))) {
                const outline = Math.max(2, Math.round(4 * scale + drawPad * 0.2));
                const offsets = [[-outline, 0], [outline, 0], [0, -outline], [0, outline]];
                for (let i = 0; i < offsets.length; i++) {
                    fctx.drawImage(img, drawPad + offsets[i][0], drawPad + offsets[i][1], w, h);
                }
                fctx.globalCompositeOperation = 'source-in';
                fctx.fillStyle = 'rgba(235, 77, 75, 0.85)';
                fctx.fillRect(0, 0, canvas.width, canvas.height);
                fctx.globalCompositeOperation = 'source-over';
                fctx.drawImage(img, drawPad, drawPad, w, h);
            } else {
                fctx.drawImage(img, drawPad, drawPad, w, h);
                fctx.globalCompositeOperation = 'source-atop';
                fctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
                fctx.fillRect(0, 0, canvas.width, canvas.height);
                fctx.globalCompositeOperation = 'source-over';
            }
            while (CharacterSprites._filteredKeys.length >= 18) {
                const oldKey = CharacterSprites._filteredKeys.shift();
                const oldEntry = CharacterSprites.filteredCache[oldKey];
                if (oldEntry && oldEntry.canvas && typeof MobilePerf !== 'undefined') {
                    MobilePerf.releaseCanvas(oldEntry.canvas);
                }
                delete CharacterSprites.filteredCache[oldKey];
            }
            CharacterSprites._filteredKeys.push(key);
        } else {
            fctx.filter = filterCss;
            fctx.drawImage(img, drawPad, drawPad, w, h);
            fctx.filter = 'none';
        }

        const entry = { canvas, padPx: drawPad, w, h };
        CharacterSprites.filteredCache[key] = entry;
        return entry;
    }

    /**
     * Mobile memory relief: releases decoded offscreen Image references that are not currently pinned.
     */
    static purgeIdle(keepSrcs = null) {
        if (typeof MobilePerf === 'undefined' || !MobilePerf.isMobile) return;
        const keep = keepSrcs ? new Set(keepSrcs) : null;
        for (const k of Object.keys(CharacterSprites.cache)) {
            if (keep && keep.has(k)) continue;
            const im = CharacterSprites.cache[k];
            if (im) {
                try { im._mobileReadyCallbacks = null; } catch (_) {}
            }
            delete CharacterSprites.cache[k];
        }
    }
}

if (typeof window !== 'undefined') {
    window.CharacterSprites = CharacterSprites;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CharacterSprites };
}
