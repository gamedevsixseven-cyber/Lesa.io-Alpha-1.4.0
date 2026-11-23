/**
 * Lesa.io - Mythic Forge Rotary Weapon: Hephaestus Vulcan Minigun
 * Mythic Chest Drop (Evolvable ★).
 * - Continuous firing ramps up Spin-Up Heat (0..100%), boosting fire rate up to +45% (+55% Evolved ★) & glowing barrels red-hot.
 * - Every 8th shot (6th Evolved ★) fires a heavy Molten Buster Slug exploding in a splash AoE (+ 3 Forge Shards when Evolved ★).
 */

class HephaestusVulcanMinigun extends WeaponBase {
    constructor() {
        super({
            id: 'vulcan_minigun',
            name: 'Hephaestus Vulcan Minigun',
            type: 'vulcan_minigun',
            rarity: 'Mythic',
            hero: null,
            baseDelay: 9,
            baseDamage: 20,
            radius: 7,
            extraPierce: 1,
            maxBounces: 0,
            speedMultiplier: 1.54,
            critChanceBonus: 0.08,
            range: 920,
            busterEveryNShots: 8,
            color: '#ff9f43',
            icon: 'assets/WeaponIcons/HephaestusVulcanMinigun.png',
            description: 'Obsidian & bronze 6-barrel forge minigun. Ramps up Spin-Up speed as the barrels glow white-hot; every 8th shot blasts a Molten Buster Slug.',
            stats: {
                damage: '20 Molten',
                fireRate: 'Rapid + Spin-Up (0.15s)',
                pierce: '+1 Pierce • High RoF',
                special: 'Spin-Up • 8th Molten Buster'
            }
        });
    }

    /**
     * Render 2.5D Obsidian & Hammered Bronze 6-Barrel Rotary Minigun (x: -12 .. +48)
     */
    static drawWeapon(ctx, flash, recoil = 0, isEvolved = false, player = null) {
        ctx.save();
        ctx.translate(4 - recoil * 0.25, 1.5);
        const ink = '#141418';
        const heat = player ? Math.max(0, Math.min(1, player._vulcanHeat || 0)) : 0.2;
        const spin = player ? (player._vulcanSpinAngle || 0) : ((typeof performance !== 'undefined' ? performance.now() * 0.01 : 0));
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // 1. Rear Forge Carry Handle & Top Rail
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.0;
        ctx.fillStyle = flash ? '#ffffff' : (isEvolved ? '#d4893b' : '#4b5563');
        ctx.beginPath();
        ctx.moveTo(-6, -6.5);
        ctx.lineTo(-4, -11.5);
        ctx.lineTo(15, -11.5);
        ctx.lineTo(17, -6.5);
        ctx.lineTo(13.5, -6.5);
        ctx.lineTo(12.2, -9.2);
        ctx.lineTo(-1.2, -9.2);
        ctx.lineTo(-2.5, -6.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 2. Underslung Drum Hopper + Hanging Brass Ammo Belt
        ctx.fillStyle = flash ? '#ffffff' : '#9c5a25';
        ctx.beginPath();
        ctx.arc(4.5, 9.2, 6.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#fed330';
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1.1;
            for (let b = 0; b < 4; b++) {
                ctx.fillRect(10.0 + b * 2.3, 4.6 + Math.sin(b * 0.9) * 1.0, 1.9, 4.5);
                ctx.strokeRect(10.0 + b * 2.3, 4.6 + Math.sin(b * 0.9) * 1.0, 1.9, 4.5);
            }
        }

        // 3. Volcanic Obsidian & Hammered Bronze Main Chassis
        const bodyGrad = ctx.createLinearGradient(0, -6.8, 0, 6.2);
        bodyGrad.addColorStop(0, flash ? '#ffffff' : '#3d4554');
        bodyGrad.addColorStop(0.55, flash ? '#f1f2f6' : '#222630');
        bodyGrad.addColorStop(1, flash ? '#dfe4ea' : '#12151c');
        ctx.fillStyle = bodyGrad;
        ctx.strokeStyle = ink;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.roundRect(-11.5, -6.8, 30.5, 13.0, 2.5);
        ctx.fill();
        ctx.stroke();

        // Hammered Bronze Trim Plate + Glowing Forge Core Window
        if (!flash) {
            ctx.fillStyle = isEvolved ? '#ffd32a' : '#cd7f32';
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1.4;
            ctx.fillRect(-9.5, -5.0, 26.5, 2.2);
            ctx.strokeRect(-9.5, -5.0, 26.5, 2.2);

            const glowAlpha = 0.55 + heat * 0.45;
            ctx.fillStyle = `rgba(255, 107, 53, ${glowAlpha})`;
            ctx.beginPath();
            ctx.roundRect(1.5, -1.6, 11.5, 4.6, 1.4);
            ctx.fill();
            ctx.fillStyle = heat > 0.65 ? '#ffffff' : '#fed330';
            ctx.fillRect(3.2, -0.4, 8.0, 2.2);
        }

        // 4. Spinning 6-Barrel Rotary Cluster (x: 19..43)
        const barrelColor = flash ? '#ffffff' : (heat > 0.72 ? '#ff7f50' : (heat > 0.35 ? '#9ca3af' : '#6b7280'));
        const tipGlow = heat > 0.25 && !flash;
        for (let i = 0; i < 6; i++) {
            const phase = spin + (i * Math.PI) / 3;
            const yOff = Math.sin(phase) * 4.4;
            const depth = Math.cos(phase);
            if (depth < -0.15) continue; // back barrels pass behind front cluster
            ctx.fillStyle = barrelColor;
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1.3;
            ctx.fillRect(19, yOff - 1.35, 24.5, 2.7);
            ctx.strokeRect(19, yOff - 1.35, 24.5, 2.7);

            if (tipGlow) {
                ctx.fillStyle = `rgba(255, ${Math.round(145 - heat * 75)}, 40, ${heat * 0.85})`;
                ctx.fillRect(36.5, yOff - 1.0, 6.6, 2.0);
            }
        }

        // Dual Bronze Cooling Clamps stabilizing Barrels
        ctx.fillStyle = flash ? '#ffffff' : (isEvolved ? '#ffd32a' : '#d4893b');
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.65;
        ctx.beginPath();
        ctx.roundRect(24.5, -6.2, 4.2, 12.4, 1.2);
        ctx.roundRect(38.0, -5.8, 3.8, 11.6, 1.2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Render Tracer Slug or 8th-shot Molten Buster Core
     */
    static drawBullet(ctx, b) {
        const ink = '#141418';
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        if (b.isMoltenBuster) {
            const r = (b.radius || 11) * 1.28;
            ctx.fillStyle = b.isWeaponEvolved ? 'rgba(255, 211, 42, 0.38)' : 'rgba(255, 71, 87, 0.34)';
            ctx.beginPath();
            ctx.arc(0, 0, r * 1.45, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ff4757';
            ctx.strokeStyle = ink;
            ctx.lineWidth = 2.1;
            ctx.beginPath();
            ctx.moveTo(r * 1.2, 0);
            ctx.lineTo(0, -r * 0.82);
            ctx.lineTo(-r * 1.05, 0);
            ctx.lineTo(0, r * 0.82);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = b.isWeaponEvolved ? '#ffffff' : '#fed330';
            ctx.beginPath();
            ctx.arc(r * 0.15, 0, r * 0.42, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const r = b.radius || 7;
            ctx.fillStyle = b.isWeaponEvolved ? '#ffd32a' : '#ff9f43';
            ctx.strokeStyle = ink;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(r * 1.45, 0);
            ctx.lineTo(r * 0.1, -r * 0.42);
            ctx.lineTo(-r * 1.1, -r * 0.35);
            ctx.lineTo(-r * 1.1, r * 0.35);
            ctx.lineTo(r * 0.1, r * 0.42);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#fff3b0';
            ctx.beginPath();
            ctx.ellipse(r * 0.25, 0, r * 0.45, r * 0.16, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    /**
     * Trigger Molten Buster Splash AoE + (Evolved ★) Radial Forge Shards on impact
     */
    static onHit(b, e, finalDmg, enemies, effects, game) {
        if (!b || !b.isMoltenBuster || b._busterDetonated) return;
        b._busterDetonated = true;
        this._detonateBuster(b.x, b.y, finalDmg, !!b.isWeaponEvolved, enemies, effects, game, b.shooter);
    }

    static onExpire(b, effects) {
        if (!b || !b.isMoltenBuster || b._busterDetonated) return;
        b._busterDetonated = true;
        const g = (typeof window !== 'undefined') ? window.gameInstance : null;
        this._detonateBuster(b.x, b.y, b.damage || 35, !!b.isWeaponEvolved, g ? g.enemies : null, effects, g, b.shooter);
    }

    static _detonateBuster(x, y, baseDmg, isEvolved, enemies, effects, game, shooter) {
        const splashR = isEvolved ? 135 : 105;
        const splashR2 = splashR * splashR;
        const aoeDmg = Math.max(14, Math.round(baseDmg * (isEvolved ? 0.85 : 0.70)));

        if (enemies && !(game && game.isCoopGuest)) {
            const visitBuster = (other) => {
                if (!other || other.dead || other.isDying || other.isAirborneImmune) return;
                const dx = other.x - x, dy = other.y - y;
                if (dx * dx + dy * dy <= splashR2 && typeof other.takeDamage === 'function') {
                    other.takeDamage(aoeDmg, effects, false, false);
                }
            };
            if (typeof SpatialHashGrid !== 'undefined') SpatialHashGrid.forEachEnemyNear(x, y, splashR, enemies, visitBuster);
            else for (let i = 0; i < enemies.length; i++) visitBuster(enemies[i]);
        }
        if (effects) {
            effects.addShockwave(x, y, splashR, 'rgba(255, 107, 53, 0.85)');
            effects.addSparks(x, y, '#fed330', 9);
            effects.addSparks(x, y, '#ff4757', 7);
        }

        // Awakened ★ Bonus: Scatter 3 Forge Shards outward
        if (isEvolved && typeof Bullet !== 'undefined' && game && Array.isArray(game.bullets)) {
            const baseAng = Math.random() * Math.PI * 2;
            for (let k = 0; k < 3; k++) {
                const a = baseAng + (k * Math.PI * 2) / 3;
                const shard = new Bullet({
                    x, y,
                    vx: Math.cos(a) * 14,
                    vy: Math.sin(a) * 14,
                    damage: Math.round(aoeDmg * 0.58),
                    speed: 14,
                    radius: 6,
                    type: 'vulcan_minigun',
                    isEnemy: false,
                    pierce: 1,
                    maxBounces: 0,
                    range: 260,
                    shooter
                });
                shard.isWeaponEvolved = true;
                game.bullets.push(shard);
            }
        }
    }

    /**
     * Advance rotary barrel spin angle & decay Spin-Up Heat when idle
     */
    static update(dt = 1, game = null) {
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (!g) return;
        const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const players = [g.player, (g.coopSession && g.coopSession.remotePlayer) ? g.coopSession.remotePlayer : null];

        for (let i = 0; i < players.length; i++) {
            const p = players[i];
            if (!p || p.weaponType !== 'vulcan_minigun') continue;
            const lastShot = p._vulcanLastShotAt || 0;
            if (now - lastShot > 280) {
                p._vulcanHeat = Math.max(0, (p._vulcanHeat || 0) - 0.018 * dt);
            }
            const heat = p._vulcanHeat || 0;
            const speed = 0.06 + heat * 0.42;
            p._vulcanSpinAngle = ((p._vulcanSpinAngle || 0) + speed * dt) % (Math.PI * 200);
        }
    }
}

if (typeof window !== 'undefined') {
    window.HephaestusVulcanMinigun = HephaestusVulcanMinigun;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HephaestusVulcanMinigun };
}
