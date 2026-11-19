// ==================== MOUNT OLYMPUS MAP THEME ====================
// Coordinates floor ground baking, dynamic mountain cliffs/clouds, and themed
// obstacle layouts for Mount Olympus (Dungeons Mode) using OlympusAssets & OlympusLayouts.

class DungeonMapTheme {
    static _assetHooked = false;

    static applyTheme(arena, floorNum) {
        if (!arena) return;
        const f = Math.max(1, Math.min(5, floorNum || 1));
        arena.dungeonFloor = f;

        // Preload Olympus textures once and refresh active dungeon ground cache as tiles arrive
        if (typeof OlympusAssets !== 'undefined') {
            if (!this._assetHooked) {
                this._assetHooked = true;
                OlympusAssets.preloadAll((key) => {
                    if (!key || !key.startsWith('tile_')) return;
                    const g = (typeof window !== 'undefined') ? window.gameInstance : null;
                    if (g && g.arena && g.arena.dungeonFloor) {
                        this.drawGroundTheme(null, g.arena, g.arena.dungeonFloor);
                    }
                });
            } else {
                OlympusAssets.preloadAll();
            }
        }

        const cacheScale = (typeof MobilePerf !== 'undefined') ? MobilePerf.getGroundCacheScale() : 1.0;
        const targetW = Math.max(256, Math.round(arena.width * cacheScale));
        const targetH = Math.max(256, Math.round(arena.height * cacheScale));
        arena.groundCacheScale = cacheScale;

        if (!arena.cachedGroundCanvas && typeof document !== 'undefined') {
            arena.cachedGroundCanvas = document.createElement('canvas');
        }
        if (arena.cachedGroundCanvas && (arena.cachedGroundCanvas.width !== targetW || arena.cachedGroundCanvas.height !== targetH)) {
            arena.cachedGroundCanvas.width = targetW;
            arena.cachedGroundCanvas.height = targetH;
        }

        if (arena.cachedGroundCanvas) {
            const gCtx = arena.cachedGroundCanvas.getContext('2d');
            this.drawGroundTheme(gCtx, arena, f);
        }

        this.generateFloorObstacles(arena, f);
    }

    static drawGroundTheme(gCtx, arena, floorNum) {
        if (!arena || !arena.cachedGroundCanvas) return;
        const ctx = gCtx || arena.cachedGroundCanvas.getContext('2d');
        if (!ctx) return;

        const scale = arena.groundCacheScale || (arena.cachedGroundCanvas.width / Math.max(1, arena.width));
        ctx.save();
        ctx.setTransform(scale, 0, 0, scale, 0, 0);
        if (typeof OlympusLayouts !== 'undefined') {
            OlympusLayouts.renderGroundCanvas(ctx, arena, floorNum);
            ctx.restore();
            return;
        }

        // Minimal fallback if OlympusLayouts isn't loaded
        ctx.fillStyle = floorNum >= 3 ? '#7c92ac' : '#4a5d3b';
        ctx.fillRect(0, 0, arena.width, arena.height);
        ctx.restore();
    }

    static drawBoundaries(ctx, arena) {
        if (typeof OlympusLayouts !== 'undefined') {
            OlympusLayouts.drawBoundaries(ctx, arena);
        }
    }

    static generateFloorObstacles(arena, floorNum) {
        if (typeof OlympusLayouts !== 'undefined') {
            OlympusLayouts.populateFloorObstacles(arena, floorNum);
        } else {
            arena.obstacles = [];
        }
    }
}

if (typeof window !== 'undefined') {
    window.DungeonMapTheme = DungeonMapTheme;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DungeonMapTheme;
}
