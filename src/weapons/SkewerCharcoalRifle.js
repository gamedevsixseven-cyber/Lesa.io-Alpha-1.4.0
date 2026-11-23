/**
 * Lesa.io - Precision Burn DMR: Skewer Charcoal Rifle
 * Rare Chest Weapon - Precision high-caliber charcoal rifle fitted with a three-prong skewer bayonet.
 * - Fires blazing Iron Skewer Bolts (+14% Crit, +3 Pierce).
 * - Ignites hit enemies with Charcoal Burn (4 DoT ticks over ~1.7s + +15% Skewered bonus on already burning targets).
 * - Burning enemies that die trigger a fiery Ember Char Pop damaging nearby foes.
 */

class SkewerCharcoalRifle extends WeaponBase {
    static _burning = new Set();

    constructor() {
        super({
            id: 'skewer_rifle',
            name: 'Skewer Charcoal Rifle',
            type: 'skewer_rifle',
            rarity: 'Rare',
            hero: null,
            baseDelay: 18,
            baseDamage: 42,
            radius: 8,
            extraPierce: 3,
            maxBounces: 0,
            speedMultiplier: 1.56,
            critChanceBonus: 0.14,
            range: 1080,
            color: '#ff6b35',
            icon: 'assets/WeaponIcons/SkewerCharcoalRifle.png',
            description: 'Precision charcoal-fired DMR tipped with a hot three-prong skewer bayonet. Ignites targets with Charcoal Burn and pops embers on kill.',
            stats: {
                damage: '42 Incendiary',
                fireRate: 'Medium (0.30s)',
                pierce: '+3 Pierces & +14% Crit',
                special: 'Charcoal Burn DoT + Ember Pop'
            }
        });
    }

    /**
     * Render 2.5D Charcoal Matte DMR with Bronze Grill Louvers, Ember Chamber, Scope & 3-Prong Skewer Bayonet (x: -14 .. +47)
     */
    static drawWeapon(ctx, flash, recoil = 0) {
        ctx.save();
        ctx.translate(6 - recoil * 0.25, 0);
        const ink = '#14161c';
        const now = typeof performance !== 'undefined' ? performance.now() * 0.01 : 0;
        const coalPulse = 0.82 + Math.sin(now) * 0.18;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // 1. Warm Walnut Wood Buttstock & Rubber Pad
        ctx.fillStyle = flash ? '#ffffff' : '#7c4a26';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.moveTo(-14.5, -3.5);
        ctx.lineTo(-2.5, -3.8);
        ctx.lineTo(-2.5, 2.8);
        ctx.lineTo(-13.5, 6.2);
        ctx.lineTo(-15.5, 3.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#22262e';
            ctx.fillRect(-15.6, -3.0, 2.6, 8.2);
        }

        // Ergonomic Grip & Curved Box Magazine
        ctx.fillStyle = flash ? '#ffffff' : '#252a34';
        ctx.beginPath();
        ctx.moveTo(-0.5, 2.5);
        ctx.lineTo(4.2, 2.5);
        ctx.lineTo(2.0, 10.6);
        ctx.lineTo(-2.4, 9.6);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#2f3642';
        ctx.beginPath();
        ctx.moveTo(8.0, 2.6);
        ctx.lineTo(13.2, 2.6);
        ctx.lineTo(14.8, 11.4);
        ctx.lineTo(9.4, 11.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 2. Matte Charcoal Lower & Upper Receiver
        const recGrad = ctx.createLinearGradient(0, -5.2, 0, 3.6);
        recGrad.addColorStop(0, flash ? '#ffffff' : '#4b5563');
        recGrad.addColorStop(0.5, flash ? '#f1f2f6' : '#272c35');
        recGrad.addColorStop(1, flash ? '#dfe4ea' : '#161920');
        ctx.fillStyle = recGrad;
        ctx.beginPath();
        ctx.roundRect(-3.2, -4.6, 20.5, 7.6, 1.8);
        ctx.fill();
        ctx.stroke();

        // Glowing Charcoal Firebox Window inside Receiver
        if (!flash) {
            ctx.fillStyle = `rgba(255, 107, 53, ${0.78 * coalPulse})`;
            ctx.fillRect(2.6, -2.5, 8.8, 3.6);
            ctx.fillStyle = '#fed330';
            ctx.fillRect(4.0, -1.6, 5.5, 1.8);
            ctx.strokeStyle = '#14161c';
            ctx.lineWidth = 1.1;
            for (let gx = 4.5; gx <= 9.5; gx += 2.5) {
                ctx.beginPath();
                ctx.moveTo(gx, -2.6);
                ctx.lineTo(gx, 1.2);
                ctx.stroke();
            }
        }

        // 3. Hammered Bronze Souvlaki-Grill Handguard Louvers
        ctx.fillStyle = flash ? '#ffffff' : '#c2782e';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.roundRect(16.8, -4.3, 14.5, 6.8, 1.5);
        ctx.fill();
        ctx.stroke();
        if (!flash) {
            ctx.fillStyle = '#181a20';
            for (let vx = 18.6; vx < 29.8; vx += 2.8) {
                ctx.fillRect(vx, -2.7, 1.4, 3.6);
            }
        }

        // 4. Precision Tactical Scope + Ember Lens
        ctx.fillStyle = flash ? '#ffffff' : '#353b48';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.55;
        ctx.beginPath();
        ctx.roundRect(0.8, -9.2, 16.5, 4.0, 1.4);
        ctx.fill();
        ctx.stroke();
        if (!flash) {
            ctx.fillStyle = '#ff9f43';
            ctx.beginPath();
            ctx.ellipse(16.8, -7.2, 1.6, 2.0, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff3b0';
            ctx.beginPath();
            ctx.arc(16.5, -7.7, 0.7, 0, Math.PI * 2);
            ctx.fill();
        }

        // 5. Long Precision Barrel + Glowing Three-Prong Skewer Muzzle Bayonet (tip x ~ 42 local = 48 world)
        ctx.fillStyle = flash ? '#ffffff' : '#57606f';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.65;
        ctx.fillRect(30.8, -2.4, 8.2, 3.2);
        ctx.strokeRect(30.8, -2.4, 8.2, 3.2);

        // Skewer Trident Bayonet
        ctx.fillStyle = flash ? '#ffffff' : '#cbd5e1';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(38.0, -4.4);
        ctx.lineTo(44.2, -3.5);
        ctx.lineTo(39.4, -1.6);
        ctx.lineTo(46.0, -0.8);
        ctx.lineTo(39.4, 0.2);
        ctx.lineTo(44.2, 2.1);
        ctx.lineTo(38.0, 3.0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#ff9f43';
            ctx.fillRect(42.2, -3.9, 2.4, 1.2);
            ctx.fillRect(43.4, -1.3, 2.8, 1.1);
            ctx.fillRect(42.2, 1.3, 2.4, 1.2);
        }

        ctx.restore();
    }

    /**
     * Render Blazing Iron Skewer Bolt Projectile
     */
    static drawBullet(ctx, b) {
        const r = b.radius || 8;
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Heat Halo
        ctx.fillStyle = b.isCrit ? 'rgba(254, 211, 48, 0.34)' : 'rgba(255, 107, 53, 0.30)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.2, 0, r * 1.65, r * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();

        // Dark Iron Bolt Shaft + Hot Amber Spear Tip
        ctx.strokeStyle = '#14161c';
        ctx.lineWidth = 1.7;
        ctx.fillStyle = '#ff6348';
        ctx.beginPath();
        ctx.moveTo(r * 1.55, 0);
        ctx.lineTo(r * 0.2, -r * 0.42);
        ctx.lineTo(-r * 1.25, -r * 0.24);
        ctx.lineTo(-r * 0.9, 0);
        ctx.lineTo(-r * 1.25, r * 0.24);
        ctx.lineTo(r * 0.2, r * 0.42);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fff3b0';
        ctx.beginPath();
        ctx.moveTo(r * 1.35, 0);
        ctx.lineTo(r * 0.2, -r * 0.18);
        ctx.lineTo(-r * 0.45, 0);
        ctx.lineTo(r * 0.2, r * 0.18);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    /**
     * Apply Charcoal Burn DoT on hit and deal +15% Skewered bonus damage against burning targets
     */
    static onHit(b, e, finalDmg, enemies, effects, game) {
        if (!e || e.dead) return;
        const alreadyBurning = !!(e._skewerBurn && e._skewerBurn.ticksLeft > 0);
        if (alreadyBurning && !(game && game.isCoopGuest)) {
            const bonus = Math.max(4, Math.round(finalDmg * 0.15));
            e.takeDamage(bonus, effects, false, false);
            if (effects) effects.addSparks(e.x, e.y - 8, '#fed330', 4);
        }

        const tickDmg = Math.max(7, Math.round(finalDmg * 0.22));
        const prev = e._skewerBurn;
        e._skewerBurn = {
            ticksLeft: 4,
            tickTimer: prev ? Math.min(prev.tickTimer, 22) : 24,
            dmg: prev ? Math.max(prev.dmg, tickDmg) : tickDmg,
            shooter: b.shooter
        };
        this._burning.add(e);

        if (effects) {
            effects.addSparks(e.x, e.y, '#ff6b35', 5);
        }
    }

    /**
     * Tick Charcoal Burn DoT across all scorched enemies
     */
    static update(dt = 1, game = null) {
        if (this._burning.size === 0) return;
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        const effects = g ? g.effects : null;

        for (const e of this._burning) {
            if (!e || e.dead || !e._skewerBurn || e._skewerBurn.ticksLeft <= 0) {
                if (e && e._skewerBurn) e._skewerBurn = null;
                this._burning.delete(e);
                continue;
            }
            const burn = e._skewerBurn;
            burn.tickTimer -= dt;
            if (burn.tickTimer <= 0) {
                burn.tickTimer += 26;
                burn.ticksLeft--;
                if (typeof e.takeDamage === 'function') {
                    e.takeDamage(burn.dmg, effects, false, false);
                    if (g && g.isCoopGuest) e.dead = false;
                }
                if (effects) {
                    effects.addSparks(e.x, e.y - 6, '#ff9f43', 3);
                }
                if (burn.ticksLeft <= 0 || e.dead) {
                    if (!e.dead) e._skewerBurn = null;
                    this._burning.delete(e);
                }
            }
        }
    }

    /**
     * Trigger Ember Char Pop when a burning enemy is killed
     */
    static onEnemyDeath(enemy, game) {
        if (!enemy || !enemy._skewerBurn) return;
        const burn = enemy._skewerBurn;
        enemy._skewerBurn = null;
        this._burning.delete(enemy);

        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        const effects = g ? g.effects : null;
        const splashR = (enemy.radius || 22) + 88;
        const splashR2 = splashR * splashR;
        const aoeDmg = Math.max(12, Math.round(burn.dmg * 1.45));

        if (g && !g.isCoopGuest && Array.isArray(g.enemies)) {
            const visitChar = (other) => {
                if (!other || other === enemy || other.dead || other.isDying) return;
                const dx = other.x - enemy.x, dy = other.y - enemy.y;
                if (dx * dx + dy * dy <= splashR2 && typeof other.takeDamage === 'function') {
                    other.takeDamage(aoeDmg, effects, false, false);
                }
            };
            if (typeof SpatialHashGrid !== 'undefined') SpatialHashGrid.forEachEnemyNear(enemy.x, enemy.y, splashR, g.enemies, visitChar);
            else for (let i = 0; i < g.enemies.length; i++) visitChar(g.enemies[i]);
        }
        if (effects) {
            effects.addShockwave(enemy.x, enemy.y, splashR * 0.85, 'rgba(255, 107, 53, 0.82)');
            effects.addSparks(enemy.x, enemy.y, '#ff6b35', 8);
            effects.addSparks(enemy.x, enemy.y, '#fed330', 5);
        }
    }

    /**
     * Render warm crackling Charcoal Burn aura under scorched enemies
     */
    static drawWorld(ctx, cam) {
        if (this._burning.size === 0 || !ctx) return;
        const now = typeof performance !== 'undefined' ? performance.now() * 0.012 : 0;

        for (const e of this._burning) {
            if (!e || e.dead || !e._skewerBurn) continue;
            const r = (e.radius || 22) + 8;
            if (cam && typeof cam.isVisible === 'function' && !cam.isVisible(e.x, e.y, r + 20)) continue;

            const pulse = 0.72 + Math.sin(now + e.x * 0.05) * 0.28;
            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.strokeStyle = `rgba(255, 107, 53, ${0.58 * pulse})`;
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.92, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#fed330';
            for (let k = 0; k < 3; k++) {
                const a = now * 0.5 + (k * Math.PI * 2) / 3;
                ctx.beginPath();
                ctx.arc(Math.cos(a) * r, Math.sin(a) * r * 0.75 - 4, 2.2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    static clear() {
        this._burning.clear();
    }
}

if (typeof window !== 'undefined') {
    window.SkewerCharcoalRifle = SkewerCharcoalRifle;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SkewerCharcoalRifle };
}
