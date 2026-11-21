/**
 * Lesa.io - Tactical Weapon: M4 Carbine
 * Shared unlockable automatic tactical assault rifle usable by any hero.
 */

class M4Carbine extends WeaponBase {
    constructor() {
        super({
            id: 'm4_carbine',
            name: 'M4 Carbine',
            type: 'm4_carbine',
            rarity: 'Rare',
            hero: null,
            baseDelay: 8,
            baseDamage: 24,
            radius: 7,
            extraPierce: 1,
            maxBounces: 0,
            speedMultiplier: 1.48,
            critChanceBonus: 0.08,
            range: 980,
            color: '#ffa502',
            icon: 'assets/WeaponIcons/M4Carbine.png',
            description: 'Tactical 5.56mm NATO assault carbine firing rapid supersonic armor-piercing rounds with red-dot precision.',
            stats: {
                damage: '24 AP Round',
                fireRate: 'Auto (0.13s)',
                pierce: '1 Target',
                special: '+8% Crit & Fast Burst'
            }
        });
    }

    /**
     * Render 2.5D Tactical M4 Carbine (collapsible stock, curved STANAG mag, holo optic, quad rail & flash hider)
     */
    static drawWeapon(ctx, flash, recoil = 0) {
        ctx.save();
        ctx.translate(7, 0);
        const ink = '#14161c';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Collapsible M4 tactical stock + buffer tube
        ctx.fillStyle = flash ? '#ffffff' : '#232730';
        ctx.strokeStyle = ink;
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.moveTo(-14, -4.5);
        ctx.lineTo(-4, -3.8);
        ctx.lineTo(-4, 2.2);
        ctx.lineTo(-12, 6.2);
        ctx.lineTo(-14.5, 5.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#3a404d';
        ctx.beginPath();
        ctx.roundRect(-5, -3.4, 7, 3.6, 1);
        ctx.fill();
        ctx.stroke();

        // Pistol grip + curved 30-rd STANAG magazine
        ctx.fillStyle = flash ? '#ffffff' : '#1e222a';
        ctx.beginPath();
        ctx.moveTo(0, 2.5);
        ctx.lineTo(5, 2.5);
        ctx.lineTo(2.5, 11);
        ctx.lineTo(-2, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#4a5260';
        ctx.beginPath();
        ctx.moveTo(8, 3);
        ctx.lineTo(13.5, 3);
        ctx.quadraticCurveTo(15, 9, 17, 13.5);
        ctx.lineTo(11.5, 14.5);
        ctx.quadraticCurveTo(9, 9.5, 8, 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Flat-top AR-15 upper/lower receiver
        const steelGrad = ctx.createLinearGradient(0, -5, 0, 4);
        steelGrad.addColorStop(0, flash ? '#ffffff' : '#596374');
        steelGrad.addColorStop(0.55, flash ? '#f1f2f6' : '#2d333d');
        steelGrad.addColorStop(1, flash ? '#dfe4ea' : '#191c22');
        ctx.fillStyle = steelGrad;
        ctx.beginPath();
        ctx.roundRect(-1, -4.4, 17, 7.6, 1.5);
        ctx.fill();
        ctx.stroke();

        // Red-dot Holo Optic on top rail
        ctx.fillStyle = flash ? '#ffffff' : '#252a34';
        ctx.beginPath();
        ctx.roundRect(4, -9.2, 8.5, 5.0, 1.4);
        ctx.fill();
        ctx.stroke();
        if (!flash) {
            ctx.fillStyle = '#00d2d3';
            ctx.fillRect(6, -7.8, 4.5, 2.4);
            ctx.fillStyle = '#ff4757';
            ctx.fillRect(7.7, -7.1, 1.1, 1.1);
        }

        // Quad Railed Handguard + Picatinny rib ticks
        ctx.fillStyle = flash ? '#ffffff' : '#292e38';
        ctx.beginPath();
        ctx.roundRect(15.5, -4.1, 15.5, 6.2, 1.5);
        ctx.fill();
        ctx.stroke();
        if (!flash) {
            ctx.fillStyle = '#4c5464';
            for (let rx = 17.5; rx <= 28; rx += 3.2) {
                ctx.fillRect(rx, -3.2, 1.8, 4.4);
            }
        }

        // Front A2 sight triangle + step-cut barrel & A2 birdcage flash hider
        ctx.fillStyle = flash ? '#ffffff' : '#1d2028';
        ctx.beginPath();
        ctx.moveTo(30.5, -3.8);
        ctx.lineTo(33.5, -8.5);
        ctx.lineTo(35.5, -8.5);
        ctx.lineTo(35.8, -3.8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#4a5262';
        ctx.beginPath();
        ctx.roundRect(31, -2.5, 11, 2.9, 1);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#262b35';
        ctx.beginPath();
        ctx.roundRect(40.5, -3.2, 5.2, 4.3, 1);
        ctx.fill();
        ctx.stroke();

        if (recoil > 2) {
            ctx.fillStyle = `rgba(255, 180, 50, ${Math.min(0.85, recoil / 8)})`;
            ctx.beginPath();
            ctx.arc(47, -1, 4.8, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    /**
     * Render high-velocity 5.56mm NATO copper-jacketed FMJ bullet + warm tracer streak
     */
    static drawBullet(ctx, bullet) {
        const r = Math.max(5, bullet.radius || 7);
        ctx.save();
        ctx.fillStyle = 'rgba(255, 185, 56, 0.36)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.5, 0, r * 1.4, r * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.lineWidth = 1.6;
        ctx.strokeStyle = '#14161c';
        ctx.fillStyle = '#e67e22';
        ctx.beginPath();
        ctx.roundRect(-r * 1.0, -r * 0.34, r * 1.0, r * 0.68, 1.5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffd32a';
        ctx.beginPath();
        ctx.moveTo(-r * 0.05, -r * 0.36);
        ctx.quadraticCurveTo(r * 0.85, -r * 0.25, r * 1.35, 0);
        ctx.quadraticCurveTo(r * 0.85, r * 0.25, -r * 0.05, r * 0.36);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }
}

if (typeof window !== 'undefined') window.M4Carbine = M4Carbine;
if (typeof module !== 'undefined' && module.exports) module.exports = { M4Carbine };
