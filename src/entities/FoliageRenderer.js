/**
 * Lesa.io - Procedural 2.5D Small Tree & Shrub Foliage Renderer
 * Draws lush cartoon small trees matching the illustrated arena big tree art style.
 */

class FoliageRenderer {
    static traceScallopedCanopy(ctx, cx, cy, rx, ry, lobes = 10, depth = 0.16, phase = 0) {
        const steps = lobes * 2;
        const pts = [];
        for (let i = 0; i < steps; i++) {
            const a = (i / steps) * Math.PI * 2 + phase;
            const lobeR = i % 2 === 0 ? 1 + depth : 1 - depth * 0.52;
            pts.push({
                x: cx + Math.cos(a) * rx * lobeR,
                y: cy + Math.sin(a) * ry * lobeR
            });
        }
        ctx.beginPath();
        const startX = (pts[pts.length - 1].x + pts[0].x) * 0.5;
        const startY = (pts[pts.length - 1].y + pts[0].y) * 0.5;
        ctx.moveTo(startX, startY);
        for (let i = 0; i < pts.length; i++) {
            const next = pts[(i + 1) % pts.length];
            const mx = (pts[i].x + next.x) * 0.5;
            const my = (pts[i].y + next.y) * 0.5;
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
        }
        ctx.closePath();
    }

    static drawLeafSprig(ctx, x, y, angle, scale = 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.scale(scale, scale);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(4.5, -5.5, 11.5, -0.8);
        ctx.quadraticCurveTo(4.5, 4.5, 0, 0);
        ctx.fillStyle = '#9ef036';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#0e2b15';
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(1.5, 0);
        ctx.lineTo(8, -0.4);
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#2d822a';
        ctx.stroke();
        ctx.restore();
    }

    static drawSaplingTrunk(ctx, r) {
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.fillStyle = '#8d4f24';
        ctx.strokeStyle = '#1b1109';
        ctx.lineWidth = 2.4;

        // Tapered warm brown trunk with Y-branch fork & three flared root toes
        ctx.beginPath();
        ctx.moveTo(-r * 0.34, -r * 0.24);
        ctx.lineTo(-r * 0.20, -r * 0.26);
        ctx.quadraticCurveTo(-r * 0.08, -r * 0.04, 0, -r * 0.10);
        ctx.quadraticCurveTo(r * 0.08, -r * 0.04, r * 0.20, -r * 0.26);
        ctx.lineTo(r * 0.34, -r * 0.24);
        ctx.quadraticCurveTo(r * 0.20, r * 0.02, r * 0.20, r * 0.26);
        ctx.quadraticCurveTo(r * 0.26, r * 0.44, r * 0.42, r * 0.52);
        ctx.quadraticCurveTo(r * 0.24, r * 0.58, r * 0.10, r * 0.49);
        ctx.quadraticCurveTo(0, r * 0.59, -r * 0.11, r * 0.50);
        ctx.quadraticCurveTo(-r * 0.26, r * 0.58, -r * 0.42, r * 0.51);
        ctx.quadraticCurveTo(-r * 0.25, r * 0.42, -r * 0.20, r * 0.24);
        ctx.quadraticCurveTo(-r * 0.20, r * 0.02, -r * 0.34, -r * 0.24);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Bark highlight grooves & warm wood grain knot
        ctx.strokeStyle = '#ba733d';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(-r * 0.09, r * 0.02);
        ctx.quadraticCurveTo(-r * 0.10, r * 0.28, -r * 0.22, r * 0.45);
        ctx.moveTo(r * 0.08, r * 0.04);
        ctx.quadraticCurveTo(r * 0.09, r * 0.28, r * 0.20, r * 0.45);
        ctx.stroke();

        ctx.fillStyle = '#5c2f12';
        ctx.beginPath();
        ctx.ellipse(r * 0.04, r * 0.22, 2.0, 2.8, 0.15, 0, Math.PI * 2);
        ctx.fill();
    }

    static drawBaseTufts(ctx, r) {
        ctx.fillStyle = '#329f33';
        ctx.strokeStyle = '#0c2813';
        ctx.lineWidth = 1.3;
        const tufts = [[-r * 0.48, -1], [-r * 0.34, -0.5], [r * 0.36, 0.5], [r * 0.50, 1]];
        for (const [gx, dir] of tufts) {
            ctx.beginPath();
            ctx.moveTo(gx - 2.2, r * 0.54);
            ctx.quadraticCurveTo(gx + dir * 2.5, r * 0.40, gx + dir * 5.2, r * 0.34);
            ctx.quadraticCurveTo(gx + dir * 1.0, r * 0.44, gx + 2.2, r * 0.54);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }

    static drawVariantAccents(ctx, r, variant) {
        if (variant === 0) {
            const blooms = [[-r * 0.42, -r * 0.62], [r * 0.24, -r * 0.88], [r * 0.40, -r * 0.34]];
            for (const [bx, by] of blooms) {
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(bx, by, 3.1, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#ffd32a';
                ctx.beginPath();
                ctx.arc(bx, by, 1.6, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (variant === 1) {
            const berries = [[-r * 0.46, -r * 0.42], [-r * 0.16, -r * 0.80], [r * 0.28, -r * 0.50], [r * 0.44, -r * 0.24]];
            for (const [bx, by] of berries) {
                ctx.fillStyle = '#ff4757';
                ctx.beginPath();
                ctx.arc(bx, by, 2.6, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#5c141d';
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(bx - 0.8, by - 0.8, 0.9, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    static _spriteCache = new Map();

    static _getOrBake(key, lw, lh, ax, ay, drawFn) {
        let entry = FoliageRenderer._spriteCache.get(key);
        if (entry) return entry;
        const dpr = 1.5;
        const c = document.createElement('canvas');
        c.width = Math.ceil(lw * dpr);
        c.height = Math.ceil(lh * dpr);
        const fctx = c.getContext('2d');
        fctx.translate(ax * dpr, ay * dpr);
        fctx.scale(dpr, dpr);
        drawFn(fctx);
        entry = { canvas: c, lw, lh, ax, ay };
        FoliageRenderer._spriteCache.set(key, entry);
        return entry;
    }

    static drawSmallTree(obs, ctx, scale = 1.0) {
        const r = (obs.radius || 32) * scale;
        const ox = obs.x || 0;
        const oy = obs.y || 0;
        const seed = Math.abs(Math.round(ox * 13 + oy * 7 + (obs.id || 0) * 31));
        const variant = seed % 3;
        const flipX = (seed % 2 === 0) ? 1 : -1;
        const sway = Math.sin(Date.now() * 0.0022 + ox * 0.025 + oy * 0.015) * 0.022;

        // 1. Soft 2.5D meadow ground shadow under roots
        ctx.fillStyle = 'rgba(15, 42, 12, 0.28)';
        ctx.beginPath();
        ctx.ellipse(3, r * 0.56, r * 0.92, r * 0.30, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.scale(flipX, 1);

        const rKey = Math.round(r * 10);
        // 2. Cached Bark Trunk & Rooted Base Tufts
        const tw = Math.ceil(r * 1.6);
        const th = Math.ceil(r * 1.2);
        const trunkSprite = FoliageRenderer._getOrBake(`trunk:${rKey}`, tw, th, tw * 0.5, Math.ceil(r * 0.45), (bctx) => {
            this.drawSaplingTrunk(bctx, r);
            this.drawBaseTufts(bctx, r);
        });
        ctx.drawImage(trunkSprite.canvas, -trunkSprite.ax, -trunkSprite.ay, trunkSprite.lw, trunkSprite.lh);

        // 3. Cached Scalloped Crown (rotates smoothly by continuous sway)
        ctx.save();
        ctx.translate(0, -r * 0.10);
        ctx.rotate(sway);

        const cw = Math.ceil(r * 2.5);
        const ch = Math.ceil(r * 2.0);
        const crownSprite = FoliageRenderer._getOrBake(`crown:${rKey}:${variant}`, cw, ch, cw * 0.5, Math.ceil(r * 1.45), (cctx) => {
            cctx.translate(0, r * 0.10);
            this._drawCrownVector(cctx, r, scale, variant);
        });
        ctx.drawImage(crownSprite.canvas, -crownSprite.ax, -crownSprite.ay, crownSprite.lw, crownSprite.lh);
        ctx.restore();
        ctx.restore();
    }

    static _drawCrownVector(ctx, r, scale, variant) {

        const puffs = [
            { x: -r * 0.48, y: -r * 0.62, rx: r * 0.44, ry: r * 0.40, lobes: 8,  ph: 0.2, dark: '#11431b', mid: '#21792b', hi: '#64c935' },
            { x:  r * 0.48, y: -r * 0.58, rx: r * 0.43, ry: r * 0.39, lobes: 8,  ph: 0.9, dark: '#11431b', mid: '#1f7028', hi: '#59be31' },
            { x:  0,        y: -r * 0.86, rx: r * 0.54, ry: r * 0.45, lobes: 10, ph: 0.5, dark: '#155020', mid: '#2d9431', hi: '#8be036' },
            { x: -r * 0.40, y: -r * 0.32, rx: r * 0.40, ry: r * 0.33, lobes: 8,  ph: 1.3, dark: '#13481d', mid: '#25822d', hi: '#70ce34' },
            { x:  r * 0.42, y: -r * 0.30, rx: r * 0.39, ry: r * 0.32, lobes: 8,  ph: 0.4, dark: '#13481d', mid: '#237b2a', hi: '#68c532' },
            { x: -r * 0.02, y: -r * 0.46, rx: r * 0.48, ry: r * 0.41, lobes: 9,  ph: 0.7, dark: '#175823', mid: '#319b32', hi: '#8ee338' }
        ];

        // Exterior ink border first
        ctx.lineWidth = 4.6;
        ctx.strokeStyle = '#0c2813';
        for (let i = 0; i < puffs.length; i++) {
            const p = puffs[i];
            this.traceScallopedCanopy(ctx, p.x, p.y, p.rx, p.ry, p.lobes, 0.14, p.ph);
            ctx.stroke();
        }

        // Deep base foliage fill covering interior outline overlaps
        ctx.fillStyle = '#11431b';
        for (let i = 0; i < puffs.length; i++) {
            const p = puffs[i];
            this.traceScallopedCanopy(ctx, p.x, p.y, p.rx, p.ry, p.lobes, 0.14, p.ph);
            ctx.fill();
        }

        // Sculpted scalloped leaf tiers (shadow crescent -> emerald body -> lime highlight)
        for (let i = 0; i < puffs.length; i++) {
            const p = puffs[i];
            ctx.fillStyle = p.dark;
            this.traceScallopedCanopy(ctx, p.x, p.y + 1.5, p.rx * 0.96, p.ry * 0.94, p.lobes, 0.14, p.ph);
            ctx.fill();

            ctx.fillStyle = p.mid;
            this.traceScallopedCanopy(ctx, p.x - 1, p.y - 2.5, p.rx * 0.89, p.ry * 0.86, p.lobes, 0.13, p.ph);
            ctx.fill();

            ctx.fillStyle = p.hi;
            this.traceScallopedCanopy(ctx, p.x - p.rx * 0.14, p.y - p.ry * 0.22, p.rx * 0.62, p.ry * 0.54, 7, 0.14, p.ph + 0.3);
            ctx.fill();

            ctx.fillStyle = '#c5f744';
            ctx.beginPath();
            ctx.ellipse(p.x - p.rx * 0.20, p.y - p.ry * 0.34, p.rx * 0.20, p.ry * 0.13, -0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#dfff75';
            ctx.beginPath();
            ctx.ellipse(p.x + p.rx * 0.06, p.y - p.ry * 0.26, p.rx * 0.11, p.ry * 0.08, 0.25, 0, Math.PI * 2);
            ctx.fill();
        }

        // Signature pointed hero leaf sprigs around upper crown
        this.drawLeafSprig(ctx, -r * 0.20, -r * 1.24, -1.78, 0.82 * scale);
        this.drawLeafSprig(ctx, r * 0.08, -r * 1.26, -1.22, 0.90 * scale);
        this.drawLeafSprig(ctx, -r * 0.86, -r * 0.68, -2.62, 0.74 * scale);
        this.drawLeafSprig(ctx, r * 0.84, -r * 0.62, -0.38, 0.74 * scale);

        this.drawVariantAccents(ctx, r, variant);
    }
}

if (typeof window !== 'undefined') {
    window.FoliageRenderer = FoliageRenderer;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FoliageRenderer;
}
