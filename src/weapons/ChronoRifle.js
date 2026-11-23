/**
 * Lesa.io - Temporal Rail Weapon: Chrono Stutter Rifle
 * Fires rapid temporal pulse bolts that build Chrono Stutter stacks (1-3).
 * On the 3rd hit, locks the enemy in Chrono Stasis, banks incoming damage,
 * and detonates a violet-cyan Chrono Shatter shockwave when stasis ends.
 */

class ChronoRifle extends WeaponBase {
    static _tracked = new Set();

    constructor() {
        super({
            id: 'chrono_rifle',
            name: 'Chrono Stutter Rifle',
            type: 'chrono_rifle',
            rarity: 'Legendary',
            hero: null,
            baseDelay: 11,
            baseDamage: 24,
            radius: 8,
            extraPierce: 0,
            maxBounces: 0,
            speedMultiplier: 1.58,
            critChanceBonus: 0.12,
            range: 960,
            color: '#a55eea',
            icon: 'assets/WeaponIcons/ChronoRifle.png',
            description: 'Temporal rail-rifle that stutters foes on every hit; 3 stacks freeze targets in Chrono Stasis, banking damage until a violent Time-Shatter blast.',
            stats: {
                damage: '24 Temporal',
                fireRate: 'Rapid (0.18s)',
                pierce: 'Single Target',
                special: '3-Hit Stasis + Shatter'
            }
        });
    }

    /**
     * Render 2.5D Futuristic Chrono Stutter Rail Rifle
     */
    static drawWeapon(ctx, flash, recoil = 0) {
        ctx.save();
        ctx.translate(7, 0);
        const ink = '#14161c';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Sculpted Chrono stock + violet inlay
        ctx.fillStyle = flash ? '#ffffff' : '#252938';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.85;
        ctx.beginPath();
        ctx.moveTo(-14, -4.4);
        ctx.lineTo(-3, -4.0);
        ctx.lineTo(-3, 2.5);
        ctx.lineTo(-11.5, 6.8);
        ctx.lineTo(-14.5, 5.0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        if (!flash) {
            ctx.fillStyle = '#a55eea';
            ctx.fillRect(-12, -2.5, 5.5, 2.0);
        }

        // Ergonomic grip + Glowing Chrono Cell magazine
        ctx.fillStyle = flash ? '#ffffff' : '#1b1f2b';
        ctx.beginPath();
        ctx.moveTo(0, 2.4);
        ctx.lineTo(4.8, 2.4);
        ctx.lineTo(2.4, 10.6);
        ctx.lineTo(-2.0, 9.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#4834d4';
        ctx.beginPath();
        ctx.moveTo(8.5, 2.8);
        ctx.lineTo(13.8, 2.8);
        ctx.lineTo(15.4, 11.8);
        ctx.lineTo(10.0, 12.2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        if (!flash) {
            ctx.fillStyle = '#00f5ff';
            ctx.fillRect(10.6, 4.8, 2.2, 5.4);
        }

        // Pearl-silver & slate receiver chassis
        const recGrad = ctx.createLinearGradient(0, -5.5, 0, 3.8);
        recGrad.addColorStop(0, flash ? '#ffffff' : '#e6ebf2');
        recGrad.addColorStop(0.55, flash ? '#f1f2f6' : '#8592aa');
        recGrad.addColorStop(1, flash ? '#dfe4ea' : '#2f3647');
        ctx.fillStyle = recGrad;
        ctx.beginPath();
        ctx.roundRect(-3.0, -5.0, 24, 8.0, 1.8);
        ctx.fill();
        ctx.stroke();

        // Holographic temporal chevron sight on top rail
        ctx.fillStyle = flash ? '#ffffff' : '#232836';
        ctx.beginPath();
        ctx.roundRect(2.5, -9.8, 10.5, 4.9, 1.3);
        ctx.fill();
        ctx.stroke();
        if (!flash) {
            ctx.fillStyle = '#00f5ff';
            ctx.fillRect(4.5, -8.3, 6.4, 2.0);
        }

        // Rotating Chrono Hourglass Core inside receiver
        const spin = typeof performance !== 'undefined' ? performance.now() * 0.005 : 0;
        ctx.save();
        ctx.translate(10.8, -1.0);
        ctx.fillStyle = flash ? '#ffffff' : '#161028';
        ctx.beginPath();
        ctx.arc(0, 0, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = flash ? '#ffffff' : '#a55eea';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        if (!flash) {
            ctx.rotate(spin);
            ctx.fillStyle = '#00f5ff';
            ctx.beginPath();
            ctx.moveTo(-1.8, -2.0); ctx.lineTo(1.8, -2.0); ctx.lineTo(0, 0); ctx.closePath();
            ctx.moveTo(-1.8, 2.0); ctx.lineTo(1.8, 2.0); ctx.lineTo(0, 0); ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        // Glowing cyan-violet plasma conduit + split twin accelerator rails
        if (!flash) {
            ctx.fillStyle = '#00f5ff';
            ctx.fillRect(20, -2.0, 18.5, 1.9);
            ctx.fillStyle = '#a55eea';
            ctx.fillRect(20, -0.3, 17, 1.2);
        }

        ctx.fillStyle = flash ? '#ffffff' : '#dfe4ea';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.65;
        ctx.beginPath();
        ctx.roundRect(20.5, -4.8, 17.5, 2.7, 1.0);
        ctx.roundRect(20.5, 0.8, 16.2, 2.5, 1.0);
        ctx.fill();
        ctx.stroke();

        // Prong emitter muzzle
        ctx.fillStyle = flash ? '#ffffff' : '#252938';
        ctx.beginPath();
        ctx.roundRect(37.5, -4.5, 4.5, 2.1, 0.8);
        ctx.roundRect(36.5, 0.6, 4.0, 2.0, 0.8);
        ctx.fill();
        ctx.stroke();

        if (recoil > 2 && !flash) {
            ctx.strokeStyle = 'rgba(0, 245, 255, 0.9)';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(42, -1.0, 4.5, -1.1, 1.1);
            ctx.stroke();
        }
        ctx.restore();
    }

    /**
     * Render temporal plasma diamond bolt with clockwork halo
     */
    static drawBullet(ctx, bullet) {
        const r = Math.max(5.5, bullet.radius || 8);
        ctx.save();

        // Violet temporal outer glow
        ctx.fillStyle = 'rgba(165, 94, 234, 0.34)';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.45, r * 0.72, 0, 0, Math.PI * 2);
        ctx.fill();

        // Razor cyan energy bolt
        ctx.strokeStyle = '#14161c';
        ctx.lineWidth = 1.6;
        ctx.fillStyle = '#00f5ff';
        ctx.beginPath();
        ctx.moveTo(r * 1.35, 0);
        ctx.lineTo(0, -r * 0.56);
        ctx.lineTo(-r * 1.05, 0);
        ctx.lineTo(0, r * 0.56);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // White-hot diamond core + trailing tick marks
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(r * 0.85, 0);
        ctx.lineTo(0, -r * 0.25);
        ctx.lineTo(-r * 0.5, 0);
        ctx.lineTo(0, r * 0.25);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#a55eea';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-r * 1.35, -r * 0.32);
        ctx.lineTo(-r * 1.05, 0);
        ctx.lineTo(-r * 1.35, r * 0.32);
        ctx.stroke();
        ctx.restore();
    }

    /**
     * Apply Chrono Stutter stacks on hit; 3rd hit freezes enemy in Chrono Stasis and banks damage.
     */
    static onHit(b, e, finalDmg, enemies, effects, game) {
        if (!e) return;
        this._tracked.add(e);

        if (e._chronoStasisTimer > 0) {
            e._chronoStoredDamage = (e._chronoStoredDamage || 0) + Math.round(finalDmg * 0.85);
            if (effects) effects.addSparks(e.x, e.y, '#00f5ff', 3);
            return;
        }

        if (typeof e.applyChronoSlow === 'function') {
            e.applyChronoSlow(0.55, 0.55);
        }
        e._chronoStacks = (e._chronoStacks || 0) + 1;
        e._chronoStackDecay = 220;

        if (e._chronoStacks >= 3) {
            e._chronoStacks = 0;
            e._chronoStackDecay = 0;
            const durFrames = (e.isBoss || e.isMiniBoss) ? 55 : 90;
            e._chronoStasisTimer = durFrames;
            e._chronoStasisMax = durFrames;
            e._chronoStoredDamage = Math.round(finalDmg * 1.15);
            e.stunTimer = Math.max(e.stunTimer || 0, durFrames);
            e.vx = 0;
            e.vy = 0;
            if (e.isCharging !== undefined) {
                e.isCharging = false;
                e.chargeWindup = 0;
            }
            if (effects) {
                effects.addShockwave(e.x, e.y, (e.radius || 22) + 34, 'rgba(165, 94, 234, 0.85)');
                effects.addSparks(e.x, e.y, '#00f5ff', 8);
                effects.addComicSplash(e.x, e.y - 26, 'CHRONO LOCK! ⏳', '#a55eea', 24, true);
            }
            if (window.soundEngine && typeof window.soundEngine.playPickup === 'function') {
                window.soundEngine.playPickup('star');
            }
        } else if (effects) {
            effects.addSparks(e.x, e.y, '#a55eea', 4);
        }
    }

    /**
     * Bank incoming damage from any allied/swapped weapon while an enemy is frozen in Chrono Stasis.
     */
    static onAnyBulletHit(e, finalDmg, effects) {
        if (!e || !(e._chronoStasisTimer > 0)) return;
        e._chronoStoredDamage = (e._chronoStoredDamage || 0) + Math.round(finalDmg * 0.65);
        if (effects) effects.addSparks(e.x, e.y, '#a55eea', 2);
    }

    static clear() {
        this._tracked.clear();
    }

    /**
     * Tick Chrono Stutter stacks & active Stasis timers, triggering Chrono Shatter AoE burst on expiry.
     */
    static update(dt = 1, game = null) {
        if (this._tracked.size === 0) return;
        for (const e of this._tracked) {
            if (!e) {
                this._tracked.delete(e);
                continue;
            }
            if (e._chronoStasisTimer > 0) {
                if (e.dead) {
                    e._chronoStasisTimer = 0;
                    this._shatter(e, game);
                    this._tracked.delete(e);
                    continue;
                }
                e._chronoStasisTimer -= dt;
                e.vx = 0;
                e.vy = 0;
                if (e._chronoStasisTimer <= 0) {
                    e._chronoStasisTimer = 0;
                    this._shatter(e, game);
                    this._tracked.delete(e);
                }
            } else if (e._chronoStacks > 0) {
                e._chronoStackDecay = (e._chronoStackDecay || 0) - dt;
                if (e._chronoStackDecay <= 0 || e.dead) {
                    e._chronoStacks = 0;
                    this._tracked.delete(e);
                }
            } else {
                this._tracked.delete(e);
            }
        }
    }

    static _shatter(e, game) {
        const effects = game ? game.effects : null;
        const enemies = game && Array.isArray(game.enemies) ? game.enemies : null;
        const shatterDmg = Math.max(24, Math.round(e._chronoStoredDamage || 30));
        e._chronoStoredDamage = 0;

        if (!e.dead && typeof e.takeDamage === 'function') {
            e.takeDamage(shatterDmg, effects, true, true);
            if (game && game.isCoopGuest) e.dead = false;
        }
        if (enemies) {
            const splashR = (e.radius || 22) + 115;
            const splashR2 = splashR * splashR;
            const aoeDmg = Math.max(12, Math.round(shatterDmg * 0.68));
            const visitSplash = (other) => {
                if (!other || other === e || other.dead) return;
                const dx = other.x - e.x, dy = other.y - e.y;
                if (dx * dx + dy * dy <= splashR2 && typeof other.takeDamage === 'function') {
                    other.takeDamage(aoeDmg, effects, false, false);
                    if (game && game.isCoopGuest) other.dead = false;
                }
            };
            if (typeof SpatialHashGrid !== 'undefined') SpatialHashGrid.forEachEnemyNear(e.x, e.y, splashR, enemies, visitSplash);
            else for (let i = 0; i < enemies.length; i++) visitSplash(enemies[i]);
        }
        if (effects) {
            effects.addShockwave(e.x, e.y, (e.radius || 22) + 108, 'rgba(165, 94, 234, 0.88)');
            effects.addShockwave(e.x, e.y, (e.radius || 22) + 74, 'rgba(0, 245, 255, 0.85)');
            effects.addSparks(e.x, e.y, '#00f5ff', 10);
            effects.addSparks(e.x, e.y, '#a55eea', 8);
            effects.addComicSplash(e.x, e.y - 30, `SHATTER! ${shatterDmg}`, '#00f5ff', 28, true);
        }
        if (window.soundEngine && typeof window.soundEngine.playShoot === 'function') {
            window.soundEngine.playShoot('chrono_rifle');
        }
    }

    /**
     * Render stack pips (1-2) and orbiting 12-tick Chrono Stasis clock cages on affected enemies.
     */
    static drawWorld(ctx, cam) {
        if (this._tracked.size === 0 || !ctx) return;
        const now = typeof performance !== 'undefined' ? performance.now() * 0.004 : 0;

        for (const e of this._tracked) {
            if (!e || e.dead) continue;
            const r = (e.radius || 22) + 11;
            if (cam && typeof cam.isVisible === 'function' && !cam.isVisible(e.x, e.y, r + 24)) continue;

            ctx.save();
            ctx.translate(e.x, e.y);

            if (e._chronoStasisTimer > 0) {
                const ratio = Math.max(0, Math.min(1, e._chronoStasisTimer / (e._chronoStasisMax || 90)));

                // Soft violet temporal stasis field
                ctx.fillStyle = 'rgba(165, 94, 234, 0.20)';
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fill();

                // Outer rotating clock tick ring
                ctx.save();
                ctx.rotate(now * 0.6);
                ctx.strokeStyle = '#a55eea';
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.stroke();

                ctx.strokeStyle = '#00f5ff';
                ctx.lineWidth = 1.6;
                for (let t = 0; t < 12; t++) {
                    const ta = (t / 12) * Math.PI * 2;
                    const len = t % 3 === 0 ? 5.5 : 3.2;
                    ctx.beginPath();
                    ctx.moveTo(Math.cos(ta) * (r - len), Math.sin(ta) * (r - len));
                    ctx.lineTo(Math.cos(ta) * r, Math.sin(ta) * r);
                    ctx.stroke();
                }
                ctx.restore();

                // Depleting cyan countdown arc
                ctx.strokeStyle = '#00f5ff';
                ctx.lineWidth = 3.2;
                ctx.beginPath();
                ctx.arc(0, 0, r + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
                ctx.stroke();

                // Stored Shatter Damage readout
                if (e._chronoStoredDamage > 0) {
                    ctx.font = '900 11px "Fredoka", sans-serif';
                    ctx.textAlign = 'center';
                    ctx.lineWidth = 3;
                    ctx.strokeStyle = '#14161c';
                    const txt = `⏳ +${Math.round(e._chronoStoredDamage)}`;
                    ctx.strokeText(txt, 0, r + 17);
                    ctx.fillStyle = '#00f5ff';
                    ctx.fillText(txt, 0, r + 17);
                }
            } else if (e._chronoStacks > 0) {
                const count = Math.min(2, e._chronoStacks);
                ctx.strokeStyle = '#a55eea';
                ctx.lineWidth = 2.6;
                for (let s = 0; s < count; s++) {
                    const start = now + s * Math.PI;
                    ctx.beginPath();
                    ctx.arc(0, 0, r - 2, start, start + Math.PI * 0.65);
                    ctx.stroke();
                    ctx.fillStyle = '#00f5ff';
                    ctx.beginPath();
                    ctx.arc(Math.cos(start) * (r - 2), Math.sin(start) * (r - 2), 3.0, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();
        }
    }
}

if (typeof window !== 'undefined') window.ChronoRifle = ChronoRifle;
if (typeof module !== 'undefined' && module.exports) module.exports = { ChronoRifle };
