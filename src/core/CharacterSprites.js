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

    static isReady(src) {
        const img = CharacterSprites.get(src);
        return Boolean(img && img.complete && img.naturalWidth > 0);
    }
}

if (typeof window !== 'undefined') {
    window.CharacterSprites = CharacterSprites;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CharacterSprites };
}
