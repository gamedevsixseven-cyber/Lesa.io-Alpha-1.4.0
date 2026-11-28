/**
 * Shared 2D Canvas Texture Atlas Cache
 * Packs offscreen-baked procedural sprites and labels onto shared 2048x2048 atlas pages
 * so Skia/GPU Chromium draws 1-2 drawImage blits per entity instead of dozens of live paths.
 */
class SpriteAtlasCache {
    static PAGE_SIZE = 2048;
    static MAX_PAGES = 8;
    static GUTTER = 2;

    static _pages = [];
    static _entries = new Map();
    static _fontKeys = new Set();
    static _standaloneEntries = [];
    static _canvasPool = [];
    static _fontHooked = false;
    static _epoch = 1;

    static _ensureFontHook() {
        if (SpriteAtlasCache._fontHooked) return;
        SpriteAtlasCache._fontHooked = true;
        if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                SpriteAtlasCache.invalidateFontEntries();
            });
        }
    }

    static invalidateFontEntries() {
        for (const key of SpriteAtlasCache._fontKeys) {
            SpriteAtlasCache._entries.delete(key);
        }
        SpriteAtlasCache._fontKeys.clear();
        SpriteAtlasCache._epoch++;
    }

    static _createPage() {
        const cfg = (typeof MobilePerf !== 'undefined') ? MobilePerf.getAtlasConfig() : null;
        const maxPages = cfg ? cfg.maxPages : SpriteAtlasCache.MAX_PAGES;
        const pageSize = cfg ? cfg.pageSize : SpriteAtlasCache.PAGE_SIZE;
        if (SpriteAtlasCache._pages.length >= maxPages) {
            return null;
        }
        const canvas = document.createElement('canvas');
        canvas.width = pageSize;
        canvas.height = pageSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            if (typeof MobilePerf !== 'undefined') MobilePerf.releaseCanvas(canvas);
            return null;
        }
        const page = {
            canvas,
            ctx,
            cursorX: SpriteAtlasCache.GUTTER,
            cursorY: SpriteAtlasCache.GUTTER,
            shelfH: 0
        };
        SpriteAtlasCache._pages.push(page);
        return page;
    }

    static _allocateRect(w, h) {
        const cfg = (typeof MobilePerf !== 'undefined') ? MobilePerf.getAtlasConfig() : null;
        const size = cfg ? cfg.pageSize : SpriteAtlasCache.PAGE_SIZE;
        const g = SpriteAtlasCache.GUTTER;
        if (w + g * 2 > size || h + g * 2 > size) return null;

        for (let i = 0; i < SpriteAtlasCache._pages.length; i++) {
            const p = SpriteAtlasCache._pages[i];
            if (p.cursorX + w + g <= size && p.cursorY + h + g <= size) {
                const sx = p.cursorX;
                const sy = p.cursorY;
                p.cursorX += w + g;
                if (h > p.shelfH) p.shelfH = h;
                return { page: p, sx, sy };
            }
            const nextY = p.cursorY + p.shelfH + g;
            if (nextY + h + g <= size) {
                p.cursorX = g;
                p.cursorY = nextY;
                p.shelfH = h;
                const sx = p.cursorX;
                const sy = p.cursorY;
                p.cursorX += w + g;
                return { page: p, sx, sy };
            }
        }

        const fresh = SpriteAtlasCache._createPage();
        if (!fresh) return null;
        const sx = fresh.cursorX;
        const sy = fresh.cursorY;
        fresh.cursorX += w + g;
        fresh.shelfH = h;
        return { page: fresh, sx, sy };
    }

    /**
     * Get an existing atlas entry or bake it once using drawFn(atlasCtx).
     * When atlas pages are full, falls back cleanly to a standalone offscreen canvas.
     */
    static getOrBake(key, logicalW, logicalH, anchorX, anchorY, drawFn, opts) {
        SpriteAtlasCache._ensureFontHook();
        const existing = SpriteAtlasCache._entries.get(key);
        if (existing && existing.canvas && existing.canvas.width > 0 && existing.canvas.height > 0) return existing;

        const cfg = (typeof MobilePerf !== 'undefined') ? MobilePerf.getAtlasConfig() : null;
        const rawDpr = (opts && opts.dpr) || 1.25;
        const dpr = cfg ? Math.min(rawDpr, cfg.dprCap) : rawDpr;
        const sw = Math.max(1, Math.ceil(logicalW * dpr));
        const sh = Math.max(1, Math.ceil(logicalH * dpr));
        const actualW = sw / dpr;
        const actualH = sh / dpr;

        const rect = SpriteAtlasCache._allocateRect(sw, sh);
        const isMobile = typeof MobilePerf !== 'undefined' && MobilePerf.isMobile;
        const flipBake = !!(opts && opts.flipBake);
        const effAnchorX = flipBake ? (logicalW - anchorX) : anchorX;
        let targetCanvas, targetCtx, sx, sy;
        let isStandalone = false;
        if (rect) {
            targetCanvas = rect.page.canvas;
            targetCtx = rect.page.ctx;
            sx = rect.sx;
            sy = rect.sy;
        } else {
            isStandalone = true;
            if (isMobile) {
                while (SpriteAtlasCache._standaloneEntries.length >= 24) {
                    const old = SpriteAtlasCache._standaloneEntries.shift();
                    if (old && SpriteAtlasCache._entries.get(old.key) === old.entry) {
                        SpriteAtlasCache._entries.delete(old.key);
                    }
                    if (old && old.canvas) {
                        if (SpriteAtlasCache._canvasPool.length < 6) {
                            SpriteAtlasCache._canvasPool.push(old.canvas);
                        } else {
                            MobilePerf.releaseCanvas(old.canvas);
                        }
                    }
                }
            }
            targetCanvas = SpriteAtlasCache._canvasPool.pop() || document.createElement('canvas');
            targetCanvas.width = sw;
            targetCanvas.height = sh;
            targetCtx = targetCanvas.getContext('2d');
            if (!targetCtx) {
                if (typeof MobilePerf !== 'undefined') MobilePerf.releaseCanvas(targetCanvas);
                return {
                    canvas: null,
                    sx: 0,
                    sy: 0,
                    sw,
                    sh,
                    logicalW: actualW,
                    logicalH: actualH,
                    anchorX: effAnchorX,
                    anchorY,
                    drawDirect: drawFn
                };
            }
            targetCtx.setTransform(1, 0, 0, 1, 0, 0);
            targetCtx.clearRect(0, 0, sw, sh);
            sx = 0;
            sy = 0;
        }

        targetCtx.save();
        try {
            targetCtx.beginPath();
            targetCtx.rect(sx, sy, sw, sh);
            targetCtx.clip();
            targetCtx.translate(sx + effAnchorX * dpr, sy + anchorY * dpr);
            if (flipBake) targetCtx.scale(-dpr, dpr);
            else targetCtx.scale(dpr, dpr);
            drawFn(targetCtx);
        } finally {
            targetCtx.restore();
        }

        const entry = {
            canvas: targetCanvas,
            sx,
            sy,
            sw,
            sh,
            logicalW: actualW,
            logicalH: actualH,
            anchorX: effAnchorX,
            anchorY
        };
        SpriteAtlasCache._entries.set(key, entry);
        if (isStandalone && isMobile) {
            SpriteAtlasCache._standaloneEntries.push({ key, entry, canvas: targetCanvas });
        }
        if (opts && opts.fontDependent) {
            SpriteAtlasCache._fontKeys.add(key);
        }
        return entry;
    }

    /**
     * Draw an atlas-cached sprite centered at its local (0, 0) anchor.
     * Flipped variants are baked once onto the atlas (:fx) to avoid per-frame save/scale/restore.
     */
    static drawCached(ctx, key, logicalW, logicalH, anchorX, anchorY, drawFn, opts) {
        return SpriteAtlasCache.drawCachedAt(ctx, 0, 0, key, logicalW, logicalH, anchorX, anchorY, drawFn, opts);
    }

    /**
     * Direct world/local coordinate blit without requiring caller ctx.save()/translate()/restore().
     */
    static drawCachedAt(ctx, wx, wy, key, logicalW, logicalH, anchorX, anchorY, drawFn, opts) {
        const flipX = !!(opts && opts.flipX);
        const effKey = flipX ? `${key}:fx` : key;
        const bakeOpts = flipX ? Object.assign({}, opts, { flipBake: true }) : opts;
        const entry = SpriteAtlasCache.getOrBake(effKey, logicalW, logicalH, anchorX, anchorY, drawFn, bakeOpts);
        if (!entry || !entry.canvas || entry.canvas.width === 0 || entry.canvas.height === 0) {
            const directFn = (entry && entry.drawDirect) || drawFn;
            if (typeof directFn === 'function') {
                ctx.save();
                try {
                    if (wx !== 0 || wy !== 0) ctx.translate(wx, wy);
                    if (flipX) ctx.scale(-1, 1);
                    directFn(ctx);
                } finally {
                    ctx.restore();
                }
            }
            return entry;
        }
        const isMob = typeof MobilePerf !== 'undefined' && MobilePerf.isMobile;
        const dx = isMob ? Math.round(wx - entry.anchorX) : (wx - entry.anchorX);
        const dy = isMob ? Math.round(wy - entry.anchorY) : (wy - entry.anchorY);
        ctx.drawImage(
            entry.canvas,
            entry.sx, entry.sy, entry.sw, entry.sh,
            dx, dy, entry.logicalW, entry.logicalH
        );
        return entry;
    }

    /**
     * Allocate and draw a one-off custom-sized entry (e.g. dynamic label sprites).
     */
    static bakeCustom(key, logicalW, logicalH, dpr, drawFn, fontDependent = false) {
        return SpriteAtlasCache.getOrBake(key, logicalW, logicalH, 0, 0, drawFn, {
            dpr,
            fontDependent
        });
    }

    static getWalkBins(defaultBins = 8) {
        return (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile && defaultBins >= 8) ? 6 : defaultBins;
    }

    static quantizePhase(phase, bins = 8) {
        const twoPi = Math.PI * 2;
        const norm = (((phase || 0) % twoPi) + twoPi) % twoPi;
        return Math.floor((norm / twoPi) * bins) % bins;
    }

    static binAngle(bin, bins = 8) {
        return ((bin + 0.5) / bins) * (Math.PI * 2);
    }

    static getStats() {
        return {
            pages: SpriteAtlasCache._pages.length,
            entries: SpriteAtlasCache._entries.size
        };
    }

    static clearCache() {
        if (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile) {
            for (const p of SpriteAtlasCache._pages) {
                if (p && p.canvas) MobilePerf.releaseCanvas(p.canvas);
            }
            for (const s of SpriteAtlasCache._standaloneEntries) {
                if (s && s.canvas) MobilePerf.releaseCanvas(s.canvas);
            }
            for (const c of SpriteAtlasCache._canvasPool) {
                if (c) MobilePerf.releaseCanvas(c);
            }
        }
        SpriteAtlasCache._pages.length = 0;
        SpriteAtlasCache._standaloneEntries.length = 0;
        SpriteAtlasCache._canvasPool.length = 0;
        SpriteAtlasCache._entries.clear();
        SpriteAtlasCache._fontKeys.clear();
        SpriteAtlasCache._epoch++;
        if (typeof EnemyBase !== 'undefined' && EnemyBase._labelCache) {
            EnemyBase._labelCache.clear();
        }
    }
}

window.SpriteAtlasCache = SpriteAtlasCache;
