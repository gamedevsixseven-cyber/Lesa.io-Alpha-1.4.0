/**
 * Lesa.io - Endless Mode 2.5D Village Building Cache, Collision & Animated FX Renderer
 * Coordinates cached stage sprites (built by EndlessBuildingModels), rounded-AABB
 * wall collision helpers, dusk illumination, siege smoke, and animated W37-40+ flames.
 */

class EndlessBuildingRenderer {
    static SPECS = {
        kafenio:   { halfW: 78, halfH: 46, roofH: 108, cullR: 138, sign: 'ΚΑΦΕΝΕΙΟ', cacheW: 256, cacheH: 224, ay: 0.72 },
        periptero: { halfW: 54, halfH: 42, roofH: 96,  cullR: 118, sign: '24H',      cacheW: 210, cacheH: 204, ay: 0.72 },
        bakery:    { halfW: 76, halfH: 46, roofH: 106, cullR: 136, sign: 'ΦΟΥΡΝΟΣ',  cacheW: 252, cacheH: 220, ay: 0.72 },
        outpost:   { halfW: 68, halfH: 44, roofH: 104, cullR: 130, sign: 'DEPOT',    cacheW: 236, cacheH: 216, ay: 0.72 },
        chapel:    { halfW: 60, halfH: 46, roofH: 120, cullR: 134, sign: '',         cacheW: 220, cacheH: 232, ay: 0.74 },
        windmill:  { halfW: 54, halfH: 46, roofH: 122, cullR: 138, sign: '',         cacheW: 220, cacheH: 236, ay: 0.74 }
    };

    static _cache = new Map();
    static _glowSprite = null;

    static getStage(game = null) {
        const evo = (typeof EndlessMapEvolution !== 'undefined') ? EndlessMapEvolution : null;
        if (evo) return evo.getBuildingStage(game);
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (!g || g.gameMode !== 'endless' || !g.waveManager) return 0;
        const w = g.waveManager.wave || 1;
        if (w >= 37) return 3;
        if (w >= 30) return 2;
        if (w >= 20) return 1;
        return 0;
    }

    static getFireIntensity(game = null) {
        const evo = (typeof EndlessMapEvolution !== 'undefined') ? EndlessMapEvolution : null;
        if (evo) return evo.fireLevel;
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (!g || g.gameMode !== 'endless' || !g.waveManager) return 0;
        const w = g.waveManager.wave || 1;
        if (w < 37) return 0;
        if (w === 37) return 0.50;
        if (w === 38) return 0.76;
        return 1.0;
    }

    static intersectCircle(obs, cx, cy, cr) {
        const hw = obs.halfW || 64;
        const hh = obs.halfH || 44;
        const minX = obs.x - hw;
        const maxX = obs.x + hw;
        const minY = obs.y - hh;
        const maxY = obs.y + hh;
        const closestX = Math.max(minX, Math.min(maxX, cx));
        const closestY = Math.max(minY, Math.min(maxY, cy));
        const dx = cx - closestX;
        const dy = cy - closestY;
        const dSq = dx * dx + dy * dy;

        if (dSq === 0) {
            const left = Math.abs(cx - minX);
            const right = Math.abs(maxX - cx);
            const top = Math.abs(cy - minY);
            const bottom = Math.abs(maxY - cy);
            const m = Math.min(left, right, top, bottom);
            if (m === left) return { pushX: minX - cr, pushY: cy, nx: -1, ny: 0 };
            if (m === right) return { pushX: maxX + cr, pushY: cy, nx: 1, ny: 0 };
            if (m === top) return { pushX: cx, pushY: minY - cr, nx: 0, ny: -1 };
            return { pushX: cx, pushY: maxY + cr, nx: 0, ny: 1 };
        }
        if (dSq >= cr * cr) return null;

        const d = Math.sqrt(dSq);
        const nx = dx / d;
        const ny = dy / d;
        return { pushX: closestX + nx * cr, pushY: closestY + ny * cr, nx, ny };
    }

    static _getGlowSprite() {
        if (this._glowSprite || typeof document === 'undefined') return this._glowSprite;
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 128;
        const gctx = c.getContext('2d');
        if (!gctx) return null;
        const g = gctx.createRadialGradient(64, 64, 6, 64, 64, 64);
        g.addColorStop(0, 'rgba(255, 190, 55, 0.56)');
        g.addColorStop(0.5, 'rgba(255, 78, 28, 0.28)');
        g.addColorStop(1, 'rgba(200, 20, 10, 0)');
        gctx.fillStyle = g;
        gctx.fillRect(0, 0, 128, 128);
        this._glowSprite = c;
        return c;
    }

    static _getSprite(arch, stage) {
        const spec = this.SPECS[arch] || this.SPECS.kafenio;
        const isMobLow = (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile && MobilePerf.isLowGraphics());
        const scale = isMobLow ? 0.9 : 1.35;
        const key = `${arch}:${stage}:${scale}`;
        const hit = this._cache.get(key);
        if (hit && hit.canvas && hit.canvas.width > 0) return hit;

        const c = document.createElement('canvas');
        c.width = Math.ceil(spec.cacheW * scale);
        c.height = Math.ceil(spec.cacheH * scale);
        const bctx = c.getContext('2d');
        if (!bctx) return null;
        const ax = spec.cacheW * 0.5;
        const ay = spec.cacheH * spec.ay;
        bctx.scale(scale, scale);
        bctx.translate(ax, ay);
        bctx.lineJoin = 'round';
        bctx.lineCap = 'round';

        if (typeof EndlessBuildingModels !== 'undefined') {
            EndlessBuildingModels.bakeBuilding(bctx, arch, stage, spec);
        }
        const entry = { canvas: c, w: spec.cacheW, h: spec.cacheH, ax, ay };
        this._cache.set(key, entry);
        return entry;
    }

    static draw(obs, ctx) {
        const arch = obs.arch || 'kafenio';
        const spec = this.SPECS[arch] || this.SPECS.kafenio;
        const stage = this.getStage();
        const fireLvl = this.getFireIntensity();
        const now = (typeof Date !== 'undefined' ? Date.now() : 0) * 0.001;

        if (stage >= 1) {
            const glow = this._getGlowSprite();
            if (glow) {
                const flick = 0.88 + Math.sin(now * 9.5 + obs.x * 0.03) * 0.12;
                const rad = (stage >= 3 ? 132 : 95) * (stage >= 3 ? (0.78 + fireLvl * 0.35) : 0.72) * flick;
                ctx.save();
                ctx.globalAlpha = stage >= 3 ? (0.34 + fireLvl * 0.34) : 0.24;
                ctx.drawImage(glow, -rad, -14 - rad * 0.65, rad * 2, rad * 1.45);
                ctx.restore();
            }
        }

        const sprite = this._getSprite(arch, stage);
        if (sprite && sprite.canvas) ctx.drawImage(sprite.canvas, -sprite.ax, -sprite.ay, sprite.w, sprite.h);

        this._drawAnimatedOverlay(obs, ctx, arch, spec, stage, fireLvl, now);
    }

    static _drawAnimatedOverlay(obs, ctx, arch, spec, stage, fireLvl, now) {
        if (arch === 'windmill') {
            ctx.save();
            ctx.translate(0, -68);
            const spinSpeed = stage >= 3 ? 0.55 : (stage === 2 ? 0.85 : 1.35);
            ctx.rotate(now * spinSpeed + (obs.id || 0));
            const sparCol = stage >= 3 ? '#2c1e1a' : '#8d5524';
            const sailCol = stage >= 3 ? '#463330' : (stage === 2 ? '#b2bec3' : '#fff8e7');
            ctx.strokeStyle = '#18181b';
            ctx.lineWidth = 2.2;
            for (let b = 0; b < 4; b++) {
                ctx.save();
                ctx.rotate((b * Math.PI) / 2);
                ctx.fillStyle = sparCol;
                ctx.fillRect(-3, -52, 6, 52);
                ctx.strokeRect(-3, -52, 6, 52);
                ctx.fillStyle = sailCol;
                ctx.beginPath();
                ctx.moveTo(3, -48);
                ctx.lineTo(18, -44);
                ctx.lineTo(14, -14);
                ctx.lineTo(3, -14);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
            ctx.fillStyle = '#fed330';
            ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.restore();
        }

        if (arch === 'kafenio' && stage >= 1 && stage <= 2) {
            for (let b = -3; b <= 3; b++) {
                const bx = b * 20;
                const by = -44 + Math.abs(b) * 0.8;
                const lit = Math.sin(now * 6 + b + (obs.x || 0)) > -0.6;
                if (!lit && stage === 2) continue;
                ctx.fillStyle = stage === 2 ? '#ffa502' : '#ffeaa7';
                ctx.beginPath(); ctx.arc(bx, by, 2.8, 0, Math.PI * 2); ctx.fill();
            }
        }

        if (arch === 'outpost' && stage >= 1) {
            const pulse = 0.5 + 0.5 * Math.sin(now * (stage >= 3 ? 11 : 4));
            if (pulse > 0.25) {
                ctx.fillStyle = stage >= 3
                    ? `rgba(255, 56, 56, ${0.42 * pulse})`
                    : `rgba(255, 165, 2, ${0.32 * pulse})`;
                ctx.beginPath();
                ctx.arc(-41, -110, stage >= 3 ? 22 : 14, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (stage >= 2) {
            const smokePuffs = stage >= 3 ? 4 : 2;
            for (let s = 0; s < smokePuffs; s++) {
                const t = ((now * (stage >= 3 ? 0.55 : 0.32) + s / smokePuffs + Math.abs(obs.x) * 0.01) % 1);
                const sx = Math.sin(now * 2 + s * 2) * 14 + (s % 2 === 0 ? -18 : 22);
                const sy = -spec.roofH * 0.72 - t * (stage >= 3 ? 68 : 42);
                const sr = (9 + t * 18) * (stage >= 3 ? 1.15 : 0.75);
                ctx.fillStyle = stage >= 3
                    ? `rgba(28, 22, 24, ${(1 - t) * 0.45})`
                    : `rgba(105, 112, 118, ${(1 - t) * 0.28})`;
                ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
            }
        }

        if (stage >= 3) {
            this.drawComicFireCluster(ctx, -spec.halfW * 0.36, -spec.roofH * 0.56, 22 * (0.7 + fireLvl * 0.4), now + obs.x * 0.01);
            this.drawComicFireCluster(ctx, spec.halfW * 0.28, -spec.roofH * 0.42, 18 * (0.7 + fireLvl * 0.4), now * 1.1 + obs.y * 0.01);
            if (arch === 'bakery') {
                this.drawComicFireCluster(ctx, 54, 4, 15 * (0.7 + fireLvl * 0.4), now * 1.25);
            } else if (arch === 'outpost') {
                this.drawComicFireCluster(ctx, 44, -2, 16 * (0.7 + fireLvl * 0.4), now * 1.3);
            }
        }
    }

    static drawComicFireCluster(ctx, x, y, size, phase) {
        const s = size;
        ctx.save();
        ctx.translate(x, y);
        const w1 = Math.sin(phase * 11) * (s * 0.14);
        const w2 = Math.cos(phase * 14) * (s * 0.16);
        ctx.fillStyle = '#ff3838';
        ctx.strokeStyle = '#18181b';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-s * 0.55, s * 0.15);
        ctx.quadraticCurveTo(-s * 0.65, -s * 0.45, -s * 0.18 + w1, -s * 1.05);
        ctx.quadraticCurveTo(0, -s * 0.58, s * 0.24 + w2, -s * 0.92);
        ctx.quadraticCurveTo(s * 0.62, -s * 0.35, s * 0.52, s * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ff9f1a';
        ctx.beginPath();
        ctx.moveTo(-s * 0.34, s * 0.10);
        ctx.quadraticCurveTo(-s * 0.35, -s * 0.38, w1 * 0.7, -s * 0.72);
        ctx.quadraticCurveTo(s * 0.36, -s * 0.34, s * 0.34, s * 0.10);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fff200';
        ctx.beginPath();
        ctx.ellipse(w2 * 0.3, -s * 0.14, s * 0.18, s * 0.24, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.EndlessBuildingRenderer = EndlessBuildingRenderer;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EndlessBuildingRenderer;
}
