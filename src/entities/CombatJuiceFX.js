/**
 * Lesa.io - Pooled World Combat Juice FX
 * Object-pooled weapon muzzle flashes, ground impact splats, and cartoon death smoke-poofs + star bursts.
 */

class CombatJuiceFX {
    constructor(effectsManager = null) {
        this.effects = effectsManager;

        const mobPreset = (typeof MobilePerf !== 'undefined' && MobilePerf.isMobile) ? MobilePerf.getPreset() : null;
        this.MAX_MUZZLES = mobPreset ? mobPreset.maxMuzzles : 24;
        this.muzzlePool = Array.from({ length: this.MAX_MUZZLES }, () => ({
            active: false, x: 0, y: 0, angle: 0, type: 'pea',
            scale: 1, life: 0, maxLife: 6, isEnemy: false, seed: 0
        }));
        this.muzzleCursor = 0;

        this.MAX_SPLATS = mobPreset ? mobPreset.maxSplats : 28;
        this.splatPool = Array.from({ length: this.MAX_SPLATS }, () => ({
            active: false, x: 0, y: 0, type: 'pea', rotation: 0,
            radius: 14, life: 0, maxLife: 42, isCrit: false, isEnemy: false,
            seed: 0, blobCount: 0,
            blobs: Array.from({ length: 6 }, () => ({ x: 0, y: 0, r: 0 }))
        }));
        this.splatCursor = 0;

        this.MAX_POOFS = mobPreset ? mobPreset.maxPoofs : 24;
        this.poofPool = Array.from({ length: this.MAX_POOFS }, () => ({
            active: false, x: 0, y: 0, radius: 24, color: '#2ed573',
            life: 0, maxLife: 22, isBoss: false, seed: 0, puffCount: 0,
            puffs: Array.from({ length: 8 }, () => ({ cos: 0, sin: 0, dist: 0, size: 0 }))
        }));
        this.poofCursor = 0;
        this._lastDeathWaveMs = 0;
        this._deathWaveBurstCount = 0;

        this.screenFX = (typeof CombatRenderFX !== 'undefined') ? new CombatRenderFX() : null;
    }

    resizePools(maxMuzzles, maxSplats, maxPoofs) {
        const mCap = Math.max(1, maxMuzzles || this.MAX_MUZZLES);
        const sCap = Math.max(1, maxSplats || this.MAX_SPLATS);
        const pCap = Math.max(1, maxPoofs || this.MAX_POOFS);

        while (this.muzzlePool.length < mCap) {
            this.muzzlePool.push({
                active: false, x: 0, y: 0, angle: 0, type: 'pea',
                scale: 1, life: 0, maxLife: 6, isEnemy: false, seed: 0
            });
        }
        while (this.splatPool.length < sCap) {
            this.splatPool.push({
                active: false, x: 0, y: 0, type: 'pea', rotation: 0,
                radius: 14, life: 0, maxLife: 42, isCrit: false, isEnemy: false,
                seed: 0, blobCount: 0,
                blobs: Array.from({ length: 6 }, () => ({ x: 0, y: 0, r: 0 }))
            });
        }
        while (this.poofPool.length < pCap) {
            this.poofPool.push({
                active: false, x: 0, y: 0, radius: 24, color: '#2ed573',
                life: 0, maxLife: 22, isBoss: false, seed: 0, puffCount: 0,
                puffs: Array.from({ length: 8 }, () => ({ cos: 0, sin: 0, dist: 0, size: 0 }))
            });
        }

        for (let i = mCap; i < this.muzzlePool.length; i++) this.muzzlePool[i].active = false;
        for (let i = sCap; i < this.splatPool.length; i++) this.splatPool[i].active = false;
        for (let i = pCap; i < this.poofPool.length; i++) this.poofPool[i].active = false;

        this.MAX_MUZZLES = mCap;
        this.MAX_SPLATS = sCap;
        this.MAX_POOFS = pCap;
        this.muzzleCursor %= mCap;
        this.splatCursor %= sCap;
        this.poofCursor %= pCap;
    }

    clear() {
        const mLen = Math.min(this.MAX_MUZZLES, this.muzzlePool.length);
        const sLen = Math.min(this.MAX_SPLATS, this.splatPool.length);
        const pLen = Math.min(this.MAX_POOFS, this.poofPool.length);
        for (let i = 0; i < mLen; i++) this.muzzlePool[i].active = false;
        for (let i = 0; i < sLen; i++) this.splatPool[i].active = false;
        for (let i = 0; i < pLen; i++) this.poofPool[i].active = false;
        if (this.screenFX) this.screenFX.clear();
    }

    isVisible(cam, x, y, pad = 90) {
        return !cam || cam.isVisible(x, y, pad);
    }

    triggerMuzzleFlash(x, y, angle, weaponType = 'pea', scale = 1.0, isEnemy = false) {
        const slot = this.muzzlePool[this.muzzleCursor];
        this.muzzleCursor = (this.muzzleCursor + 1) % this.MAX_MUZZLES;

        slot.active = true;
        slot.x = x;
        slot.y = y;
        slot.angle = angle;
        slot.type = weaponType || 'pea';
        slot.scale = scale;
        slot.maxLife = (weaponType === 'watermelon' || weaponType === 'charged_bubble') ? 7 : 5;
        slot.life = slot.maxLife;
        slot.isEnemy = isEnemy;
        slot.seed = Math.random() * Math.PI * 2;
    }

    addImpactSplat(x, y, weaponType = 'pea', isCrit = false, isEnemy = false, scale = 1.0) {
        const slot = this.splatPool[this.splatCursor];
        this.splatCursor = (this.splatCursor + 1) % this.MAX_SPLATS;

        slot.active = true;
        slot.x = x;
        slot.y = y;
        slot.type = weaponType || 'pea';
        slot.rotation = Math.random() * Math.PI * 2;
        const baseR = weaponType === 'watermelon' ? 24 : (weaponType === 'burger' ? 18 : 13);
        slot.radius = baseR * scale * (isCrit ? 1.25 : 1.0);
        slot.maxLife = weaponType === 'watermelon' ? 50 : 38;
        slot.life = slot.maxLife;
        slot.isCrit = isCrit;
        slot.isEnemy = isEnemy;
        slot.seed = Math.random() * 100;

        const lobeCount = weaponType === 'watermelon' ? 6 : 4;
        slot.blobCount = lobeCount;
        for (let i = 0; i < lobeCount; i++) {
            const a = (i / lobeCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
            const d = slot.radius * (0.48 + Math.random() * 0.45);
            const r = slot.radius * (0.24 + Math.random() * 0.24);
            const b = slot.blobs[i];
            b.x = Math.cos(a) * d;
            b.y = Math.sin(a) * d;
            b.r = r;
        }
    }

    addDeathPop(x, y, radius = 26, color = '#2ed573', isBoss = false) {
        const slot = this.poofPool[this.poofCursor];
        this.poofCursor = (this.poofCursor + 1) % this.MAX_POOFS;

        slot.active = true;
        slot.x = x;
        slot.y = y;
        slot.radius = Math.max(18, radius || 24);
        slot.color = color || '#2ed573';
        slot.maxLife = isBoss ? 30 : 22;
        slot.life = slot.maxLife;
        slot.isBoss = !!isBoss;
        slot.seed = Math.random() * Math.PI * 2;

        const count = isBoss ? 8 : 6;
        slot.puffCount = count;
        for (let i = 0; i < count; i++) {
            const a = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
            const pf = slot.puffs[i];
            pf.cos = Math.cos(a);
            pf.sin = Math.sin(a);
            pf.dist = 0.55 + Math.random() * 0.5;
            pf.size = 0.42 + Math.random() * 0.25;
        }

        if (this.effects) {
            const avail = Math.max(0, (this.effects.MAX_PARTICLES || 50) - this.effects.particles.length);
            const starCount = Math.min(isBoss ? 10 : 5, avail);
            const radiusScale = isBoss ? 1.85 : 1.0;
            for (let i = 0; i < starCount; i++) {
                const a = (i / Math.max(1, starCount)) * Math.PI * 2 + Math.random() * 0.45;
                const spd = (2.6 + Math.random() * 3.8) * radiusScale;
                const starColor = i % 2 === 0 ? '#ffd32a' : (i % 3 === 0 ? '#ffffff' : slot.color);
                this.effects.particles.push(this.effects.acquireParticle(
                    x, y, Math.cos(a) * spd, Math.sin(a) * spd, starColor, isBoss ? 9 : 6.5, 0.85, 'star'
                ));
            }
            const now = performance.now();
            if (now - this._lastDeathWaveMs > 35) {
                this._lastDeathWaveMs = now;
                this._deathWaveBurstCount = 0;
            }
            if (isBoss || this._deathWaveBurstCount < 4) {
                this._deathWaveBurstCount++;
                this.effects.addShockwave(x, y, slot.radius * (isBoss ? 3.2 : 2.1), isBoss ? 'rgba(255, 211, 42, 0.9)' : 'rgba(255, 255, 255, 0.72)');
            }
        }
    }

    triggerScreenFlash(color = '#ffd32a', maxAlpha = 0.34, durationFrames = 28) {
        if (this.screenFX) this.screenFX.triggerScreenFlash(color, maxAlpha, durationFrames);
    }

    update(dt = 1) {
        const mLen = Math.min(this.MAX_MUZZLES, this.muzzlePool.length);
        const sLen = Math.min(this.MAX_SPLATS, this.splatPool.length);
        const pLen = Math.min(this.MAX_POOFS, this.poofPool.length);
        for (let i = 0; i < mLen; i++) {
            const m = this.muzzlePool[i];
            if (m.active && (m.life -= dt) <= 0) m.active = false;
        }
        for (let i = 0; i < sLen; i++) {
            const s = this.splatPool[i];
            if (s.active && (s.life -= dt) <= 0) s.active = false;
        }
        for (let i = 0; i < pLen; i++) {
            const p = this.poofPool[i];
            if (p.active && (p.life -= dt) <= 0) p.active = false;
        }
        if (this.screenFX) this.screenFX.update(dt);
    }

    drawGround(ctx, cam) {
        const sLen = Math.min(this.MAX_SPLATS, this.splatPool.length);
        for (let i = 0; i < sLen; i++) {
            const s = this.splatPool[i];
            if (s.active && this.isVisible(cam, s.x, s.y, s.radius + 30)) this.drawSingleSplat(ctx, s);
        }
    }

    drawWorld(ctx, cam) {
        const mLen = Math.min(this.MAX_MUZZLES, this.muzzlePool.length);
        const pLen = Math.min(this.MAX_POOFS, this.poofPool.length);
        for (let i = 0; i < mLen; i++) {
            const m = this.muzzlePool[i];
            if (m.active && this.isVisible(cam, m.x, m.y, 48)) this.drawSingleMuzzle(ctx, m);
        }
        for (let i = 0; i < pLen; i++) {
            const p = this.poofPool[i];
            if (p.active && this.isVisible(cam, p.x, p.y, p.radius * 3 + 30)) this.drawSinglePoof(ctx, p);
        }
    }

    drawScreenOverlays(ctx, width, height, player) {
        if (this.screenFX) this.screenFX.drawScreenOverlays(ctx, width, height, player);
    }

    drawSingleMuzzle(ctx, m) {
        const t = Math.max(0, m.life / m.maxLife);
        const pop = (1.18 - t * 0.25) * m.scale;
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(m.angle);
        ctx.scale(pop, pop);
        ctx.globalAlpha = Math.min(1, t * 1.45);

        if (m.type === 'pepper') {
            ctx.fillStyle = '#ff6348';
            ctx.strokeStyle = '#1e272e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-2, 0); ctx.lineTo(10, -10); ctx.lineTo(24, -4);
            ctx.lineTo(19, 0); ctx.lineTo(25, 4); ctx.lineTo(10, 10);
            ctx.closePath(); ctx.fill(); ctx.stroke();

            ctx.fillStyle = '#ffeaa7';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(14, -4); ctx.lineTo(14, 4);
            ctx.closePath(); ctx.fill();
        } else if (m.type === 'bubble' || m.type === 'charged_bubble') {
            ctx.strokeStyle = '#00d2d3';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(4, 0, 10 + (1 - t) * 7, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.beginPath();
            ctx.arc(10, -5, 3, 0, Math.PI * 2);
            ctx.arc(13, 4, 2.2, 0, Math.PI * 2);
            ctx.fill();
        } else if (m.type === 'carbine' || m.type === 'm4_carbine') {
            ctx.fillStyle = '#ff9f43';
            ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(28, 0); ctx.lineTo(0, 4); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#fff3b0';
            ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(18, 0); ctx.lineTo(0, 2); ctx.closePath(); ctx.fill();
        } else if (m.type === 'spas12') {
            ctx.fillStyle = '#ff6348';
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(24, -12); ctx.lineTo(20, -4);
            ctx.lineTo(31, 0); ctx.lineTo(20, 4); ctx.lineTo(24, 12);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#ffd32a';
            ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(19, 0); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill();
        } else if (m.type === 'boomerang_saw') {
            ctx.strokeStyle = '#ff9f43';
            ctx.lineWidth = 2.6;
            ctx.beginPath(); ctx.arc(4, 0, 9, -1.1, 1.1); ctx.stroke();
            ctx.strokeStyle = '#00f5ff';
            ctx.beginPath(); ctx.arc(9, 0, 12, -0.7, 0.7); ctx.stroke();
        } else if (m.type === 'chrono_rifle') {
            ctx.fillStyle = '#a55eea';
            ctx.beginPath(); ctx.moveTo(0, -4.5); ctx.lineTo(25, 0); ctx.lineTo(0, 4.5); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#00f5ff';
            ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(16, 0); ctx.lineTo(0, 2); ctx.closePath(); ctx.fill();
        } else if (m.type === 'symbiote') {
            ctx.fillStyle = '#9b59b6';
            ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(22, -2); ctx.lineTo(15, 0); ctx.lineTo(22, 2); ctx.lineTo(0, 5); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#ff2e63';
            ctx.beginPath(); ctx.arc(7, 0, 4.2, 0, Math.PI * 2); ctx.fill();
        } else if (m.type === 'helios_cannon') {
            ctx.fillStyle = '#ff2e4c';
            ctx.beginPath(); ctx.moveTo(0, -6.5); ctx.lineTo(26, 0); ctx.lineTo(0, 6.5); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#fed330';
            ctx.beginPath(); ctx.moveTo(2, -3); ctx.lineTo(18, 0); ctx.lineTo(2, 3); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(5, 0, 3.6, 0, Math.PI * 2); ctx.fill();
        } else if (m.type === 'dialtone' || m.type === 'soundwave') {
            ctx.strokeStyle = '#00d2d3';
            ctx.lineWidth = 2.4;
            ctx.beginPath(); ctx.arc(8, 0, 8, -0.8, 0.8); ctx.stroke();
            ctx.strokeStyle = '#fed330';
            ctx.beginPath(); ctx.arc(13, 0, 12, -0.7, 0.7); ctx.stroke();
        } else if (m.type === 'lightning' || m.type === 'zeus_thunderbolt') {
            ctx.strokeStyle = m.type === 'zeus_thunderbolt' ? '#fed330' : '#00d2d3';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 0); ctx.lineTo(11, -9); ctx.lineTo(15, -2); ctx.lineTo(25, -4);
            ctx.moveTo(0, 0); ctx.lineTo(12, 8); ctx.lineTo(22, 5);
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(4, 0, 5.5, 0, Math.PI * 2); ctx.fill();
        } else {
            let outer = '#ffeaa7';
            if (m.type === 'watermelon') outer = '#ff6b81';
            else if (m.type === 'money_gun') outer = '#ffd32a';
            else if (m.type === 'burger') outer = '#ffa502';
            else if (m.type === 'greek_flag') outer = '#70a1ff';
            else if (m.type === 'pea') outer = m.isEnemy ? '#ff4757' : '#badc58';

            ctx.fillStyle = outer;
            ctx.strokeStyle = '#1e272e';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(22, 0); ctx.lineTo(7, -4.5); ctx.lineTo(9, -12); ctx.lineTo(2, -4);
            ctx.lineTo(-3, 0); ctx.lineTo(2, 4); ctx.lineTo(9, 12); ctx.lineTo(7, 4.5);
            ctx.closePath(); ctx.fill(); ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(4, 0, 4.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    drawSingleSplat(ctx, s) {
        const t = Math.max(0, s.life / s.maxLife);
        const fade = t < 0.35 ? (t / 0.35) : 1.0;
        const themeMap = {
            watermelon: ['#ff4757', '#20bf6b'],
            pepper: ['#2f3542', '#ff6348'],
            bubble: ['rgba(112, 161, 255, 0.65)', '#00d2d3'],
            money_gun: ['rgba(255, 211, 42, 0.72)', '#2ecc71'],
            euro: ['rgba(255, 211, 42, 0.72)', '#2ecc71'],
            burger: ['#e74c3c', '#f1c40f'],
            lightning: ['rgba(0, 210, 211, 0.72)', '#ffffff'],
            greek_flag: ['rgba(13, 94, 175, 0.78)', '#ffffff'],
            zeus_thunderbolt: ['rgba(254, 211, 48, 0.78)', '#00f5ff'],
            carbine: ['#ffd32a', '#ff9f43'],
            m4_carbine: ['#ffd32a', '#ff9f43'],
            spas12: ['#ff6348', '#ffd32a'],
            boomerang_saw: ['#ff9f43', '#00f5ff'],
            chrono_rifle: ['#a55eea', '#00f5ff'],
            symbiote: ['#ff2e63', '#9b59b6'],
            symbiote_tendril: ['#9b59b6', '#ff2e63'],
            helios_cannon: ['#ff2e4c', '#fed330'],
            dialtone: ['#00d2d3', '#fed330'],
            soundwave: ['#00d2d3', '#fed330'],
            ice_spike: ['rgba(116, 185, 255, 0.75)', '#ffffff']
        };
        const bossPair = (typeof BossProjectileFX !== 'undefined') ? BossProjectileFX.getSplatPalette(s.type) : null;
        const pair = bossPair || themeMap[s.type] || [s.isEnemy ? '#ff4757' : '#7bed9f', '#2ed573'];

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rotation);
        ctx.globalAlpha = fade * 0.72;
        ctx.fillStyle = pair[0];
        ctx.beginPath();
        ctx.ellipse(0, 0, s.radius * 0.78, s.radius * 0.56, 0, 0, Math.PI * 2);
        for (let i = 0; i < s.blobCount; i++) {
            const b = s.blobs[i];
            ctx.moveTo(b.x + b.r, b.y);
            ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        }
        ctx.fill();

        if (s.type === 'watermelon') {
            ctx.fillStyle = '#1e272e';
            ctx.fillRect(-4, -3, 3, 2); ctx.fillRect(4, 2, 3, 2);
            ctx.fillStyle = pair[1];
            ctx.fillRect(-s.radius * 0.45, s.radius * 0.2, 6, 3.5);
        } else if (s.type === 'bubble') {
            ctx.strokeStyle = pair[1]; ctx.lineWidth = 1.8;
            ctx.beginPath(); ctx.arc(0, 0, s.radius * 0.9, 0, Math.PI * 2); ctx.stroke();
        } else if (s.type === 'pepper' || s.type === 'lightning' || s.type === 'zeus_thunderbolt') {
            ctx.fillStyle = pair[1];
            ctx.beginPath(); ctx.arc(0, 0, s.radius * 0.32, 0, Math.PI * 2); ctx.fill();
        } else if (s.type === 'burger') {
            ctx.fillStyle = pair[1];
            ctx.beginPath(); ctx.arc(s.radius * 0.25, -s.radius * 0.15, s.radius * 0.34, 0, Math.PI * 2); ctx.fill();
        } else if (s.type === 'money_gun' || s.type === 'euro') {
            ctx.fillStyle = pair[1];
            ctx.fillRect(-4, -2.5, 8, 5);
        }
        ctx.restore();
    }

    drawSinglePoof(ctx, p) {
        const progress = 1 - Math.max(0, p.life / p.maxLife);
        const expand = 0.55 + progress * 0.95;
        const alpha = progress < 0.7 ? 0.92 : Math.max(0, (1 - progress) / 0.3 * 0.92);
        const puffCount = p.puffCount;
        const baseLobeR = p.radius * (1 - progress * 0.42);
        const riseY = progress * 8;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.globalAlpha = alpha;

        // Pass 1: unified dark comic outer ink silhouette batched in one path (zero internal seams)
        ctx.fillStyle = '#2f3542';
        ctx.beginPath();
        for (let i = 0; i < puffCount; i++) {
            const lobe = p.puffs[i];
            const dist = p.radius * lobe.dist * expand;
            const lx = lobe.cos * dist;
            const ly = lobe.sin * dist - riseY;
            const lr = Math.max(3, baseLobeR * lobe.size) + 2.6;
            ctx.moveTo(lx + lr, ly);
            ctx.arc(lx, ly, lr, 0, Math.PI * 2);
        }
        ctx.fill();

        // Pass 2: bright fluffy cartoon cloud interior (batched white + light-gray passes)
        const centerR = Math.max(4, p.radius * 0.45 * (1 - progress * 0.4));
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -progress * 6, centerR, 0, Math.PI * 2);
        for (let i = 0; i < puffCount; i += 2) {
            const lobe = p.puffs[i];
            const dist = p.radius * lobe.dist * expand;
            const lx = lobe.cos * dist;
            const ly = lobe.sin * dist - riseY;
            const lr = Math.max(3, baseLobeR * lobe.size);
            ctx.moveTo(lx + lr, ly);
            ctx.arc(lx, ly, lr, 0, Math.PI * 2);
        }
        ctx.fill();

        ctx.fillStyle = '#f1f2f6';
        ctx.beginPath();
        for (let i = 1; i < puffCount; i += 2) {
            const lobe = p.puffs[i];
            const dist = p.radius * lobe.dist * expand;
            const lx = lobe.cos * dist;
            const ly = lobe.sin * dist - riseY;
            const lr = Math.max(3, baseLobeR * lobe.size);
            ctx.moveTo(lx + lr, ly);
            ctx.arc(lx, ly, lr, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.CombatJuiceFX = CombatJuiceFX;
}
