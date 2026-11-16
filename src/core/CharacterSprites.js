/**
 * Lesa.io - Character Sprite Cache & Preloader
 * Manages front/back sprite images for Heroes and Enemies with instant caching
 */

class CharacterSprites {
    static cache = {};

    static get(src) {
        if (!src) return null;
        if (!CharacterSprites.cache[src]) {
            const img = new Image();
            img.src = src;
            CharacterSprites.cache[src] = img;
        }
        return CharacterSprites.cache[src];
    }

    static filteredCache = Object.create(null);

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
        if (existing) return existing;

        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const canvas = document.createElement('canvas');
        canvas.width = w + padPx * 2;
        canvas.height = h + padPx * 2;
        const fctx = canvas.getContext('2d');
        fctx.filter = filterCss;
        fctx.drawImage(img, padPx, padPx, w, h);
        fctx.filter = 'none';
        const entry = { canvas, padPx, w, h };
        CharacterSprites.filteredCache[key] = entry;
        return entry;
    }
}

if (typeof window !== 'undefined') {
    window.CharacterSprites = CharacterSprites;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CharacterSprites };
}
