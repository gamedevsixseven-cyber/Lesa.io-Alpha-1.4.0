/**
 * Lesa.io - DLC Graphics & Dynamic Lighting Engine ("Chapter III: The Sunless Depths")
 * Provides 60 FPS subterranean multi-pass lighting for explored cavern zones:
 *   1. Scaled offscreen darkness lightmap (`destination-out`) with hero lantern + flickering torches/crystals
 *   2. Transient combat illumination (muzzle flashes, bullets & dash flares light nearby cave stone)
 *   3. Additive colored bounce glow, overhead volumetric skylight god-rays & luminous drifting spores
 *   4. Overhanging 2.5D cavern ceiling parallax framing for subterranean depth
 */

class DlcLightingEngine {
    static _lightCanvas = null;
    static _lightCtx = null;
    static _spores = null;
    static _age = 0;

    static reset() {
        this._age = 0;
        this._spores = null;
    }

    static _ensureSpores() {
        if (this._spores) return;
        this._spores = Array.from({ length: 68 }, (_, i) => ({
            nx: ((i * 53 + 17) % 100) / 100,
            ny: ((i * 31 + 11) % 100) / 100,
            r: 1.4 + (i % 4) * 0.85,
            ph: i * 0.63,
            vx: ((i % 7) - 3) * 0.00022,
            vy: -(0.00038 + (i % 4) * 0.00018),
            col: i % 3 === 0 ? '#38bdf8' : (i % 3 === 1 ? '#fed330' : '#c084fc')
        }));
    }

    static drawScreenLighting(ctx, width, height, game) {
        if (!ctx || !game || game.gameMode !== 'dlc_cave' || width <= 0 || height <= 0) return;
        if (typeof ApexW60FinaleTeaser !== 'undefined' && ApexW60FinaleTeaser.active) return;

        this._age += 0.05;
        this._ensureSpores();

        const cam = game.camera;
        const zoom = (cam && cam.zoom) || 1;
        const dpr = (cam && cam.dpr) || game.dpr || 1;
        const scale = zoom * dpr;
        const camX = cam ? cam.x : (game.player ? game.player.x : 0);
        const camY = cam ? cam.y : (game.player ? game.player.y : 0);
        const toScreenX = (wx) => width * 0.5 + (wx - camX) * scale;
        const toScreenY = (wy) => height * 0.5 + (wy - camY) * scale;

        const zones = (typeof CaveZoneMap !== 'undefined') ? CaveZoneMap.LIGHTS : [];
        const visibleLights = [];
        const margin = 420;
        for (let i = 0; i < zones.length; i++) {
            const L = zones[i];
            const sx = toScreenX(L.x), sy = toScreenY(L.y);
            const sr = L.radius * scale;
            if (sx + sr < -margin || sx - sr > width + margin || sy + sr < -margin || sy - sr > height + margin) continue;
            const flk = L.flicker ? (1 + Math.sin(this._age * 4.2 + L.seed) * 0.07 + Math.cos(this._age * 7.1 + L.seed * 2) * 0.04) : 1;
            visibleLights.push({ sx, sy, sr: sr * flk, glow: L.glow, str: L.str || 0.9, tint: L.tint || 0.34, ray: !!L.ray });
        }

        // 1. Offscreen Scaled Darkness Mask (`destination-out`)
        this._compositeDarknessMask(ctx, width, height, game, visibleLights, toScreenX, toScreenY, scale);

        // 2. Additive Colored Light Bounce, Skylight God-Rays & Dynamic Bullet Flares
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        const p = game.player;
        if (p) {
            const psx = toScreenX(p.x), psy = toScreenY(p.y);
            const pRad = (p.isDashing ? 340 : 265) * scale;
            this._drawAdditiveBloom(ctx, psx, psy, pRad, p.isDashing ? 'rgba(56, 189, 248, 0.22)' : 'rgba(254, 211, 48, 0.14)');
        }

        for (let i = 0; i < visibleLights.length; i++) {
            const vl = visibleLights[i];
            if (vl.glow) {
                this._drawAdditiveBloom(ctx, vl.sx, vl.sy, vl.sr * 0.92, vl.glow);
            }
            if (vl.ray) {
                this._drawSkylightShaft(ctx, vl.sx, vl.sy, vl.sr, height);
            }
        }

        // Transient projectile flashes illuminating nearby cave walls (capped at 14 visible projectiles)
        const bullets = game.bullets || [];
        let bCount = 0;
        for (let i = 0; i < bullets.length && bCount < 14; i++) {
            const b = bullets[i];
            if (!b || b.dead) continue;
            const bsx = toScreenX(b.x), bsy = toScreenY(b.y);
            if (bsx < -120 || bsx > width + 120 || bsy < -120 || bsy > height + 120) continue;
            bCount++;
            this._drawAdditiveBloom(ctx, bsx, bsy, (b.radius * 4.5 + 32) * scale, b.isEnemy ? 'rgba(255, 71, 87, 0.18)' : 'rgba(56, 189, 248, 0.16)');
        }
        ctx.restore();

        // 3. Luminous Cavern Spores & Floating Embers + Subterranean Ceiling Vignette
        this._drawSporesAndFraming(ctx, width, height);
    }

    static _compositeDarknessMask(ctx, width, height, game, visibleLights, toScreenX, toScreenY, scale) {
        if (typeof document === 'undefined') return;
        const isMob = (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile);
        const resScale = isMob ? 0.28 : 0.40;
        const lw = Math.max(160, Math.round(width * resScale));
        const lh = Math.max(90, Math.round(height * resScale));

        if (!this._lightCanvas) {
            this._lightCanvas = document.createElement('canvas');
            this._lightCtx = this._lightCanvas.getContext('2d');
        }
        if (this._lightCanvas.width !== lw || this._lightCanvas.height !== lh) {
            this._lightCanvas.width = lw;
            this._lightCanvas.height = lh;
        }

        const lctx = this._lightCtx;
        const kx = lw / width, ky = lh / height;
        lctx.globalCompositeOperation = 'source-over';
        lctx.clearRect(0, 0, lw, lh);
        lctx.fillStyle = 'rgba(3, 5, 14, 0.78)';
        lctx.fillRect(0, 0, lw, lh);

        lctx.globalCompositeOperation = 'destination-out';
        const punch = (sx, sy, sr, str) => {
            const cx = sx * kx, cy = sy * ky, cr = Math.max(8, sr * kx);
            const g = lctx.createRadialGradient(cx, cy, cr * 0.06, cx, cy, cr);
            g.addColorStop(0, `rgba(0,0,0,${str})`);
            g.addColorStop(0.55, `rgba(0,0,0,${str * 0.48})`);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            lctx.fillStyle = g;
            lctx.beginPath(); lctx.arc(cx, cy, cr, 0, Math.PI * 2); lctx.fill();
        };

        // Player personal lantern aura + Co-op partner aura
        const p = game.player;
        if (p) {
            const pBreath = 1 + Math.sin(this._age * 2.1) * 0.03;
            punch(toScreenX(p.x), toScreenY(p.y), (p.isDashing ? 420 : 350) * scale * pBreath, 0.96);
        }
        if (game.coopSession) {
            const rps = game.coopSession.remotePlayers || (game.coopSession.remotePlayer ? [game.coopSession.remotePlayer] : []);
            for (let i = 0; i < rps.length; i++) {
                const rp = rps[i];
                if (rp && !rp.isDowned && !rp.isDownedDisconnected) punch(toScreenX(rp.x), toScreenY(rp.y), 290 * scale, 0.88);
            }
        }

        for (let i = 0; i < visibleLights.length; i++) {
            const vl = visibleLights[i];
            punch(vl.sx, vl.sy, vl.sr, vl.str);
        }

        // Dynamic bullet hole punches (keeps dark corridors readable while firing!)
        const bullets = game.bullets || [];
        for (let i = 0, c = 0; i < bullets.length && c < 12; i++) {
            const b = bullets[i];
            if (!b || b.dead) continue;
            const bsx = toScreenX(b.x), bsy = toScreenY(b.y);
            if (bsx < -60 || bsx > width + 60 || bsy < -60 || bsy > height + 60) continue;
            c++;
            punch(bsx, bsy, (b.radius * 4 + 44) * scale, 0.48);
        }

        ctx.drawImage(this._lightCanvas, 0, 0, width, height);
    }

    static _drawAdditiveBloom(ctx, x, y, r, color) {
        if (r <= 2) return;
        const g = ctx.createRadialGradient(x, y, 2, x, y, r);
        g.addColorStop(0, color);
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }

    static _drawSkylightShaft(ctx, sx, sy, sr, screenH) {
        const bw = Math.max(48, sr * 0.34);
        for (const off of [-0.28, 0.06, 0.36]) {
            const topX = sx + off * bw * 0.65;
            const botX = sx + off * bw * 1.45;
            const topY = sy - Math.max(screenH * 0.85, sr * 1.35);
            const botY = sy + sr * 0.42;
            const g = ctx.createLinearGradient(topX, topY, botX, botY);
            g.addColorStop(0, 'rgba(224, 242, 254, 0)');
            g.addColorStop(0.24, 'rgba(224, 242, 254, 0.24)');
            g.addColorStop(0.62, 'rgba(56, 189, 248, 0.11)');
            g.addColorStop(1, 'rgba(56, 189, 248, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(topX - bw * 0.28, topY);
            ctx.lineTo(topX + bw * 0.28, topY);
            ctx.lineTo(botX + bw * 0.9, botY);
            ctx.lineTo(botX - bw * 0.9, botY);
            ctx.closePath();
            ctx.fill();
        }
    }

    static _drawSporesAndFraming(ctx, w, h) {
        ctx.save();
        for (let i = 0; i < this._spores.length; i++) {
            const s = this._spores[i];
            s.nx = (s.nx + s.vx + 1) % 1;
            s.ny = (s.ny + s.vy + 1) % 1;
            ctx.globalAlpha = Math.max(0.14, 0.38 + 0.42 * Math.sin(this._age * 1.8 + s.ph));
            ctx.fillStyle = s.col;
            ctx.beginPath(); ctx.arc(s.nx * w, s.ny * h, s.r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Subtle atmospheric corner vignette (never obscures gameplay center)
        const vig = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.36, w * 0.5, h * 0.5, Math.max(w, h) * 0.74);
        vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vig.addColorStop(1, 'rgba(2, 4, 10, 0.52)');
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }
}

if (typeof window !== 'undefined') window.DlcLightingEngine = DlcLightingEngine;
if (typeof module !== 'undefined' && module.exports) module.exports = { DlcLightingEngine };
