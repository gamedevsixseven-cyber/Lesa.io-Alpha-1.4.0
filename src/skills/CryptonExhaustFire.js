/**
 * Lesa.io - Crypton X Exhaust Fire Trail & Burn DoT Subsystem
 * Drops blazing road fire pools behind 50balos's white Crypton X exhaust muffler
 * and ignites enemies with lingering burn damage-over-time & cartoon flames.
 */

class CryptonExhaustFire {
    static _fires = [];
    static _burning = new Set();
    static _flameDisc = null;

    static clear() {
        this._fires.length = 0;
        this._burning.clear();
    }

    static stepExhaust(rider, dt = 1, effects = null, canDamage = true) {
        if (!rider) return;
        const speed = Math.hypot(rider.vx || 0, rider.vy || 0);
        const rate = speed > 1.2 ? (rider.isDashing ? 1.55 : 1.0) : 0.28;
        rider._cxFireSpawn = (rider._cxFireSpawn || 0) + dt * rate;
        if (rider._cxFireSpawn < 4.2) return;
        rider._cxFireSpawn -= 4.2;

        const ang = Number.isFinite(rider.cryptonXAngle) ? rider.cryptonXAngle : (rider.angle || 0);
        const exX = rider.x - Math.cos(ang) * 30;
        const exY = rider.y + 6 - Math.sin(ang) * 16;
        if (this._fires.length >= 32) this._fires.shift();
        this._fires.push({
            x: exX,
            y: exY,
            radius: rider.isDashing ? 54 : 44,
            life: 125,
            maxLife: 125,
            tick: 8,
            dmg: Math.max(14, Math.round(24 * (rider.damageMultiplier || 1))),
            canDamage,
            shooter: rider
        });
        if (effects) effects.addSparks(exX, exY, Math.random() < 0.5 ? '#ff6b35' : '#fed330', 2);
    }

    static igniteEnemy(e, attacker = null, effects = null) {
        if (!e || e.dead || e.isDying || e.isAirborneImmune) return;
        const mult = (attacker && attacker.damageMultiplier) ? attacker.damageMultiplier : 1;
        const tickDmg = Math.max(18, Math.round(34 * mult * ((e.isBoss || e.isMiniBoss) ? 1.25 : 1.0)));
        const prev = e._cxBurn;
        e._cxBurn = {
            ticksLeft: 5,
            tickTimer: prev ? Math.min(prev.tickTimer, 18) : 14,
            dmg: prev ? Math.max(prev.dmg, tickDmg) : tickDmg,
            shooter: attacker
        };
        this._burning.add(e);
        if (effects && Math.random() < 0.7) effects.addSparks(e.x, e.y, '#ff9f1a', 3);
    }

    static update(dt = 1, enemies = [], effects = null, game = null) {
        const isGuest = !!(game && game.isCoopGuest);
        for (let i = this._fires.length - 1; i >= 0; i--) {
            const f = this._fires[i];
            f.life -= dt;
            if (f.life <= 0) {
                this._fires.splice(i, 1);
                continue;
            }
            f.tick -= dt;
            if (f.tick <= 0) {
                f.tick += 18;
                if (!isGuest && f.canDamage && Array.isArray(enemies) && enemies.length > 0) {
                    const hitFn = (e) => {
                        if (!e || e.dead || e.isDying || e.isAirborneImmune) return;
                        const maxD = f.radius + (e.radius || 20);
                        const dx = e.x - f.x;
                        const dy = e.y - f.y;
                        if (dx * dx + dy * dy <= maxD * maxD && typeof e.takeDamage === 'function') {
                            e.takeDamage(f.dmg, effects, false, false);
                            this.igniteEnemy(e, f.shooter, effects);
                        }
                    };
                    if (typeof SpatialHashGrid !== 'undefined') SpatialHashGrid.forEachEnemyNear(f.x, f.y, f.radius, enemies, hitFn);
                    else for (let ei = 0; ei < enemies.length; ei++) hitFn(enemies[ei]);
                }
            }
        }

        if (this._burning.size === 0) return;
        for (const e of this._burning) {
            if (!e || e.dead || !e._cxBurn || e._cxBurn.ticksLeft <= 0) {
                if (e && e._cxBurn) e._cxBurn = null;
                this._burning.delete(e);
                continue;
            }
            const burn = e._cxBurn;
            burn.tickTimer -= dt;
            if (burn.tickTimer <= 0) {
                burn.tickTimer += 22;
                burn.ticksLeft--;
                if (!isGuest && typeof e.takeDamage === 'function') {
                    e.takeDamage(burn.dmg, effects, false, false);
                }
                if (effects) effects.addSparks(e.x, e.y - 6, '#ff6b35', 3);
                if (burn.ticksLeft <= 0 || e.dead) {
                    if (!e.dead) e._cxBurn = null;
                    this._burning.delete(e);
                }
            }
        }
    }

    static _getFlameDisc() {
        if (this._flameDisc || typeof document === 'undefined') return this._flameDisc;
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 128;
        const fctx = c.getContext('2d');
        if (fctx) {
            const g = fctx.createRadialGradient(64, 64, 6, 64, 64, 64);
            g.addColorStop(0, 'rgba(255, 243, 176, 0.90)');
            g.addColorStop(0.38, 'rgba(255, 159, 26, 0.78)');
            g.addColorStop(0.72, 'rgba(255, 71, 87, 0.45)');
            g.addColorStop(1, 'rgba(235, 77, 75, 0)');
            fctx.fillStyle = g;
            fctx.beginPath();
            fctx.arc(64, 64, 64, 0, Math.PI * 2);
            fctx.fill();
            this._flameDisc = c;
        }
        return this._flameDisc;
    }

    static drawFires(ctx, cam = null) {
        if (this._fires.length === 0 || !ctx) return;
        const disc = this._getFlameDisc();
        const prevAlpha = ctx.globalAlpha;
        const t = Date.now() * 0.015;
        for (let i = 0; i < this._fires.length; i++) {
            const f = this._fires[i];
            if (cam && typeof cam.isVisible === 'function' && !cam.isVisible(f.x, f.y, f.radius + 20)) continue;
            const alpha = Math.min(1.0, f.life / (f.maxLife * 0.35));
            ctx.globalAlpha = prevAlpha * alpha;
            if (disc) ctx.drawImage(disc, f.x - f.radius, f.y - f.radius, f.radius * 2, f.radius * 2);
            const flicker = Math.sin(t + i * 1.7) * 5;
            ctx.fillStyle = '#ff9f1a';
            ctx.beginPath();
            ctx.moveTo(f.x - f.radius * 0.36, f.y + 4);
            ctx.quadraticCurveTo(f.x + flicker * 0.6, f.y - f.radius * 0.56 - Math.abs(flicker), f.x + f.radius * 0.36, f.y + 4);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#fff3b0';
            ctx.beginPath();
            ctx.moveTo(f.x - f.radius * 0.18, f.y + 4);
            ctx.quadraticCurveTo(f.x - flicker * 0.4, f.y - f.radius * 0.34, f.x + f.radius * 0.18, f.y + 4);
            ctx.closePath();
            ctx.fill();
        }
        ctx.globalAlpha = prevAlpha;
    }

    static drawBurningEnemies(ctx, cam = null) {
        if (this._burning.size === 0 || !ctx) return;
        const t = Date.now() * 0.016;
        for (const e of this._burning) {
            if (!e || e.dead || !e._cxBurn) continue;
            const r = (e.radius || 22) + 8;
            if (cam && typeof cam.isVisible === 'function' && !cam.isVisible(e.x, e.y, r + 28)) continue;
            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.fillStyle = 'rgba(255, 107, 53, 0.32)';
            ctx.beginPath();
            ctx.ellipse(0, 6, r * 0.95, r * 0.58, 0, 0, Math.PI * 2);
            ctx.fill();
            for (let k = 0; k < 4; k++) {
                const ang = (k * Math.PI * 2) / 4 + t * 0.35;
                const fx = Math.cos(ang) * r * 0.62;
                const fy = Math.sin(ang) * r * 0.35 + 2;
                const fh = 16 + Math.sin(t * 1.5 + k * 2.1) * 5;
                ctx.fillStyle = k % 2 === 0 ? '#ff4757' : '#ff9f1a';
                ctx.beginPath();
                ctx.moveTo(fx - 5.5, fy + 2);
                ctx.quadraticCurveTo(fx + Math.sin(t + k) * 3, fy - fh, fx + 5.5, fy + 2);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#fff3b0';
                ctx.beginPath();
                ctx.moveTo(fx - 2.6, fy + 2);
                ctx.quadraticCurveTo(fx, fy - fh * 0.55, fx + 2.6, fy + 2);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        }
    }
}

if (typeof window !== 'undefined') window.CryptonExhaustFire = CryptonExhaustFire;
if (typeof module !== 'undefined' && module.exports) module.exports = { CryptonExhaustFire };
