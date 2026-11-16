/**
 * Lesa.io - Boss Weapon: Kiloumpas's Carbine
 * Unlocked by defeating Wave 15 Mini-Boss Kiloumpas.
 * Fires high-velocity steel-tipped hunting rounds with extra pierce and +15% crit chance.
 */

class KiloumpasCarbine extends WeaponBase {
    constructor() {
        super({
            id: 'carbine',
            name: "Kiloumpas's Carbine",
            type: 'carbine',
            rarity: 'Epic',
            hero: null,
            baseDelay: 22,
            baseDamage: 54,
            radius: 9,
            extraPierce: 2,
            maxBounces: 0,
            color: '#fed330',
            icon: 'assets/WeaponIcons/KiloumpasCarbine.png',
            description: 'Mini-Boss Trophy • Long-barrel Greek hunting carbine firing high-velocity piercing slugs with boosted critical strike chance.',
            stats: {
                damage: '54 Marksman',
                fireRate: 'Steady (0.37s)',
                pierce: '+2 Pierces',
                special: '+15% Crit & Fast Slug'
            }
        });
    }

    /**
     * Render 2.5D Rigged Hunting Carbine matching KiloumpasCarbine icon & boss karampina.
     */
    static drawWeapon(ctx, flash, recoil = 0) {
        ctx.save();
        ctx.translate(8, 0);

        const outline = '#141416';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // 1. Lever-action trigger loop underneath receiver
        ctx.strokeStyle = outline;
        ctx.lineWidth = 2.4;
        ctx.fillStyle = flash ? '#ffffff' : '#4f5b6b';
        ctx.beginPath();
        ctx.roundRect(-1, 3, 11, 7, 3);
        ctx.fill();
        ctx.stroke();

        // 2. Walnut buttstock extending back toward shoulder
        const woodGrad = ctx.createLinearGradient(0, -6, 0, 7);
        if (flash) {
            woodGrad.addColorStop(0, '#ffffff');
            woodGrad.addColorStop(1, '#dfe4ea');
        } else {
            woodGrad.addColorStop(0, '#c97a40');
            woodGrad.addColorStop(0.55, '#8d4c23');
            woodGrad.addColorStop(1, '#4e230d');
        }

        ctx.fillStyle = woodGrad;
        ctx.strokeStyle = outline;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-13, -4);
        ctx.lineTo(0, -4.5);
        ctx.lineTo(0, 4.5);
        ctx.lineTo(-14, 7.5);
        ctx.quadraticCurveTo(-17, 6.5, -16, -2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Steel buttplate cap
        ctx.fillStyle = flash ? '#ffffff' : '#2c333d';
        ctx.fillRect(-16.5, -3.5, 3, 10.5);
        ctx.strokeRect(-16.5, -3.5, 3, 10.5);

        // 3. Walnut wooden foregrip
        ctx.fillStyle = woodGrad;
        ctx.beginPath();
        ctx.roundRect(14, -2.5, 19, 6.5, 2);
        ctx.fill();
        ctx.stroke();

        // 4. Long gunmetal barrel + under-barrel mag tube
        const steelGrad = ctx.createLinearGradient(0, -6, 0, 2);
        if (flash) {
            steelGrad.addColorStop(0, '#ffffff');
            steelGrad.addColorStop(1, '#dfe4ea');
        } else {
            steelGrad.addColorStop(0, '#8595aa');
            steelGrad.addColorStop(0.45, '#3b4452');
            steelGrad.addColorStop(1, '#1d222b');
        }

        // Under-barrel tube
        ctx.fillStyle = flash ? '#ffffff' : '#2f3542';
        ctx.beginPath();
        ctx.roundRect(16, 0.5, 24, 3.2, 1.5);
        ctx.fill();
        ctx.stroke();

        // Main heavy barrel
        ctx.fillStyle = steelGrad;
        ctx.beginPath();
        ctx.roundRect(13, -5.5, 32, 5.2, 1.5);
        ctx.fill();
        ctx.stroke();

        // Twin brass barrel bands
        ctx.fillStyle = flash ? '#ffffff' : '#fed330';
        ctx.fillRect(23, -6, 2.8, 10);
        ctx.strokeRect(23, -6, 2.8, 10);
        ctx.fillRect(31, -6, 2.8, 10);
        ctx.strokeRect(31, -6, 2.8, 10);

        // Rear leaf sight & gold front bead sight
        ctx.fillStyle = flash ? '#ffffff' : '#2f3542';
        ctx.fillRect(16, -7.8, 4, 2.4);
        ctx.fillStyle = flash ? '#ffffff' : '#fed330';
        ctx.beginPath();
        ctx.arc(42, -6.5, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 5. Heavy steel receiver with brass action plate
        ctx.fillStyle = steelGrad;
        ctx.beginPath();
        ctx.roundRect(-2, -6.2, 17, 10.8, 2.5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#fed330';
        ctx.beginPath();
        ctx.roundRect(1, -3.5, 10, 5.5, 1.5);
        ctx.fill();
        ctx.strokeStyle = outline;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Muzzle hot flash aura during kickback
        if (recoil > 2) {
            const glowAlpha = Math.min(0.85, recoil / 8);
            ctx.fillStyle = `rgba(254, 211, 48, ${glowAlpha})`;
            ctx.beginPath();
            ctx.arc(46.5, -3, 5.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Render aerodynamic pointed hunting carbine round (player brass/gold vs boss crimson/steel).
     */
    static drawBullet(ctx, bullet) {
        const r = Math.max(6, bullet.radius || 9);
        const enemyRound = !!bullet.isEnemy;

        ctx.save();
        ctx.lineWidth = 2.0;
        ctx.strokeStyle = '#141416';
        ctx.lineJoin = 'round';

        // Outer tracer streak glow
        ctx.fillStyle = enemyRound ? 'rgba(255, 71, 87, 0.35)' : 'rgba(254, 211, 48, 0.40)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.45, 0, r * 1.45, r * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();

        // Brass casing rear
        ctx.fillStyle = enemyRound ? '#d63031' : '#f39c12';
        ctx.beginPath();
        ctx.roundRect(-r * 1.15, -r * 0.42, r * 1.15, r * 0.84, 2);
        ctx.fill();
        ctx.stroke();

        // Pointed copper/steel ballistic tip
        ctx.fillStyle = enemyRound ? '#fffa65' : '#fed330';
        ctx.beginPath();
        ctx.moveTo(-r * 0.05, -r * 0.44);
        ctx.quadraticCurveTo(r * 0.95, -r * 0.34, r * 1.55, 0);
        ctx.quadraticCurveTo(r * 0.95, r * 0.34, -r * 0.05, r * 0.44);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Specular sheen stripe
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(r * 0.35, -r * 0.14, r * 0.55, r * 0.13, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.KiloumpasCarbine = KiloumpasCarbine;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { KiloumpasCarbine };
}
