/**
 * Lesa.io - Tactical Combat Shotgun: SPAS-12
 * Fires a 6-pellet 12-gauge buckshot blast with close-quarters knockback;
 * every 4th shot racks a fiery 8-pellet SPAS Breacher burst (+28% damage).
 */

class Spas12 extends WeaponBase {
    static PELLET_OFFSETS = [-0.21, -0.125, -0.042, 0.042, 0.125, 0.21];
    static BREACH_OFFSETS = [-0.25, -0.175, -0.105, -0.035, 0.035, 0.105, 0.175, 0.25];

    constructor() {
        super({
            id: 'spas12',
            name: 'SPAS-12',
            type: 'spas12',
            rarity: 'Rare',
            hero: null,
            baseDelay: 32,
            baseDamage: 16,
            radius: 6,
            extraPierce: 0,
            maxBounces: 0,
            speedMultiplier: 1.44,
            critChanceBonus: 0.08,
            range: 560,
            color: '#ff6348',
            icon: 'assets/WeaponIcons/Spas12.png',
            description: 'Dual-mode 12-gauge combat shotgun firing a 6-pellet knockback buckshot spread; every 4th blast unleashes an 8-pellet Breacher salvo.',
            stats: {
                damage: '16 x 6 Buckshot',
                fireRate: 'Pump (0.53s)',
                pierce: 'Spread Fan',
                special: 'Knockback + 4th Breacher'
            }
        });
    }

    /**
     * Render 2.5D Franchi SPAS-12 (folded hook wire stock, vented heatshield, pump forend & mag tube)
     */
    static drawWeapon(ctx, flash, recoil = 0) {
        ctx.save();
        ctx.translate(7, 0);
        const ink = '#14161c';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Folded top tubular steel wire stock + hook resting over receiver
        ctx.strokeStyle = ink;
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.moveTo(-11, -4.5);
        ctx.lineTo(-4.5, -8.2);
        ctx.lineTo(13.5, -8.2);
        ctx.lineTo(16.5, -4.8);
        ctx.stroke();
        if (!flash) {
            ctx.strokeStyle = '#636e72';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        // Contoured SPAS pistol grip & rear buttplate spur
        ctx.fillStyle = flash ? '#ffffff' : '#1f232b';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.85;
        ctx.beginPath();
        ctx.moveTo(-11.5, -3.5);
        ctx.lineTo(-4.5, -4.8);
        ctx.lineTo(-1.5, 2.5);
        ctx.lineTo(-5.8, 11.4);
        ctx.lineTo(-11.2, 10.2);
        ctx.lineTo(-7.8, 1.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Heavy stamped steel receiver + red 12ga shell in port
        const recGrad = ctx.createLinearGradient(0, -5.5, 0, 3.8);
        recGrad.addColorStop(0, flash ? '#ffffff' : '#596272');
        recGrad.addColorStop(0.55, flash ? '#f1f2f6' : '#2f3542');
        recGrad.addColorStop(1, flash ? '#dfe4ea' : '#191c24');
        ctx.fillStyle = recGrad;
        ctx.beginPath();
        ctx.roundRect(-4.5, -5.2, 20.5, 8.2, 1.6);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#ff4757';
            ctx.fillRect(1.5, -3.1, 5.6, 2.3);
            ctx.fillStyle = '#feca57';
            ctx.fillRect(7.1, -3.1, 1.8, 2.3);
        }

        // Underbarrel tubular 8-shell magazine
        ctx.fillStyle = flash ? '#ffffff' : '#3a4250';
        ctx.beginPath();
        ctx.roundRect(14.5, 0.2, 24.5, 3.0, 1.1);
        ctx.fill();
        ctx.stroke();

        // Chunky ribbed SPAS pump forend (cycles back smoothly with recoil)
        const pumpSlide = Math.min(3.0, recoil * 0.42);
        const fx = 16.5 - pumpSlide;
        ctx.fillStyle = flash ? '#ffffff' : '#1e222b';
        ctx.beginPath();
        ctx.roundRect(fx, -0.3, 14.5, 5.0, 1.3);
        ctx.fill();
        ctx.stroke();
        if (!flash) {
            ctx.fillStyle = '#485460';
            for (let rx = fx + 1.8; rx <= fx + 11.8; rx += 2.6) {
                ctx.fillRect(rx, 0.4, 1.3, 3.5);
            }
        }

        // Signature SPAS-12 rectangular ventilated barrel heatshield
        ctx.fillStyle = flash ? '#ffffff' : '#4a5262';
        ctx.beginPath();
        ctx.roundRect(15.2, -5.0, 20.2, 4.4, 1.0);
        ctx.fill();
        ctx.stroke();
        if (!flash) {
            ctx.fillStyle = ink;
            for (let vx = 17.0; vx <= 32.5; vx += 3.1) {
                ctx.fillRect(vx, -3.9, 1.7, 2.0);
            }
        }

        // Heavy 12-gauge barrel + front post sight + muzzle crown
        ctx.fillStyle = flash ? '#ffffff' : '#2c323f';
        ctx.beginPath();
        ctx.roundRect(34.0, -4.1, 8.8, 3.6, 1.0);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = ink;
        ctx.beginPath();
        ctx.moveTo(37.5, -4.1);
        ctx.lineTo(39.4, -6.8);
        ctx.lineTo(41.0, -4.1);
        ctx.closePath();
        ctx.fill();

        if (recoil > 2 && !flash) {
            ctx.fillStyle = `rgba(255, 130, 50, ${Math.min(0.85, recoil / 8)})`;
            ctx.beginPath();
            ctx.arc(43.5, -2.1, 4.4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    /**
     * Render hot 12-gauge tungsten buckshot pellet (fiery crimson-gold on 4th Breacher salvo)
     */
    static drawBullet(ctx, bullet) {
        const r = Math.max(4.5, bullet.radius || 6);
        const breach = !!bullet._spasBreach;
        ctx.save();

        ctx.fillStyle = breach ? 'rgba(255, 71, 87, 0.36)' : 'rgba(255, 165, 2, 0.30)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.4, 0, r * 1.45, r * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = breach ? '#ff4757' : '#ff9f43';
        ctx.strokeStyle = '#14161c';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fff5c0';
        ctx.beginPath();
        ctx.arc(r * 0.16, -r * 0.12, r * 0.28, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /**
     * Apply punchy close-quarters buckshot knockback to non-stationary enemies
     */
    static onHit(b, e, finalDmg, enemies, effects, game) {
        if (!e || e.dead || e.isStationary || e.isBoss) return;
        const speed = Math.hypot(b.vx, b.vy);
        if (speed <= 0.01) return;

        const basePush = b._spasBreach ? 7.5 : 4.5;
        const push = e.isMiniBoss ? basePush * 0.4 : basePush;
        e.x += (b.vx / speed) * push;
        e.y += (b.vy / speed) * push;
        if (game && game.arena && typeof e.applyArenaBounds === 'function') {
            e.applyArenaBounds(game.arena);
        }
        if (effects) {
            effects.addSparks(e.x, e.y, b._spasBreach ? '#ff4757' : '#ffd32a', 2);
        }
    }
}

if (typeof window !== 'undefined') window.Spas12 = Spas12;
if (typeof module !== 'undefined' && module.exports) module.exports = { Spas12 };
