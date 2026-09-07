/**
 * Lesa.io - Bubble Gun Weapon Definition
 * Default ricochet projectile gun
 */

class BubbleGun extends WeaponBase {
    constructor() {
        super({
            id: 'bubble',
            name: 'Bubble Gun',
            type: 'bubble',
            rarity: 'Exclusive',
            hero: null,
            baseDelay: 12,
            baseDamage: 22,
            radius: 10,
            extraPierce: 0,
            maxBounces: 3,
            color: '#70a1ff',
            icon: 'assets/WeaponIcons/BubbleGun.png',
            description: 'Alpha Exclusive • Fires pressurized soapy bubble spheres that bounce off arena boundaries and obstacles.',
            stats: {
                damage: '22 Splash',
                fireRate: 'High (0.20s)',
                pierce: 'None',
                special: '3 Bounces (Exclusive)'
            }
        });
    }

    /**
     * Render 2.5D Rigged Bubble Gun matching Weapon Icon
     */
    static drawWeapon(ctx, flash, recoil, charge = 0) {
        ctx.save();
        ctx.translate(14, 0);

        const strokeColor = '#141416';
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = strokeColor;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // 1. Ergonomic Pistol Grip (Underneath, slanted back)
        ctx.fillStyle = flash ? '#ffffff' : '#dfe4ea';
        ctx.beginPath();
        ctx.moveTo(-1, 4);
        ctx.lineTo(-4, 16);
        ctx.quadraticCurveTo(-3, 19, 2, 18);
        ctx.lineTo(5, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Grip texture groove
        ctx.strokeStyle = '#a4b0be';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-2, 10);
        ctx.lineTo(3, 8);
        ctx.moveTo(-3, 14);
        ctx.lineTo(2, 12);
        ctx.stroke();

        // Trigger Guard
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(3, 4);
        ctx.quadraticCurveTo(8, 7, 7, 12);
        ctx.lineTo(2, 12);
        ctx.stroke();

        // Trigger
        ctx.strokeStyle = '#2f3542';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(2, 6);
        ctx.lineTo(4, 9);
        ctx.stroke();

        // 2. Rear Valve Bulb / Cap (Back of canister)
        ctx.fillStyle = flash ? '#ffffff' : '#dfe4ea';
        ctx.lineWidth = 2.2;
        ctx.strokeStyle = strokeColor;
        ctx.beginPath();
        ctx.arc(-5, -1, 5, Math.PI * 0.5, Math.PI * 1.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3. Main Canister Body (Purple Cylinder)
        const bodyGrad = ctx.createLinearGradient(0, -9, 0, 7);
        if (flash) {
            bodyGrad.addColorStop(0, '#ffffff');
            bodyGrad.addColorStop(1, '#dfe4ea');
        } else {
            bodyGrad.addColorStop(0, '#a55eea');
            bodyGrad.addColorStop(0.5, '#8854d0');
            bodyGrad.addColorStop(1, '#5f27cd');
        }
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.roundRect(-4, -8, 16, 14, [4, 2, 2, 4]);
        ctx.fill();
        ctx.stroke();

        // Specular highlight stripe across body
        if (!flash) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.fillRect(-2, -6, 12, 2.2);
        }

        // Gold Triangular Gauge / Emblem on canister side
        ctx.fillStyle = flash ? '#ffffff' : '#f1c40f';
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(1, -4);
        ctx.lineTo(7, -1);
        ctx.lineTo(1, 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner jewel on gauge
        ctx.fillStyle = flash ? '#ffffff' : '#e67e22';
        ctx.beginPath();
        ctx.arc(3, -1, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // 4. Wide Flared Front Funnel Bezel (White/Pearl Outer Ring)
        ctx.fillStyle = flash ? '#ffffff' : '#f5f6fa';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(11, -7);
        ctx.lineTo(20, -11);
        ctx.quadraticCurveTo(23, -11, 23, -8);
        ctx.lineTo(23, 6);
        ctx.quadraticCurveTo(23, 9, 20, 9);
        ctx.lineTo(11, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Front Rim Bevel (Deep Violet interior)
        ctx.fillStyle = flash ? '#ffffff' : '#4834d4';
        ctx.beginPath();
        ctx.ellipse(22, -1, 3, 9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Luminous Cyan Domed Bubble Emitter Lens
        const lensGrad = ctx.createRadialGradient(21, -3, 1, 22, -1, 7);
        if (flash) {
            lensGrad.addColorStop(0, '#ffffff');
            lensGrad.addColorStop(1, '#00d2d3');
        } else {
            lensGrad.addColorStop(0, '#70a1ff');
            lensGrad.addColorStop(0.6, '#00d2d3');
            lensGrad.addColorStop(1, '#0984e3');
        }
        ctx.fillStyle = lensGrad;
        ctx.beginPath();
        ctx.ellipse(22, -1, 2.2, 7.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bright white glint reflection on emitter lens
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(21.2, -3.5, 0.9, 2.4, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // 9. Charging Mega Bubble or Firing Froth
        if (charge > 0) {
            const chargeRadius = 4 + charge * 14;
            const wobble = Math.sin(Date.now() * 0.015) * 1.5;
            const bGrad = ctx.createRadialGradient(24 + chargeRadius * 0.6, -1, 1, 24 + chargeRadius * 0.6, -1, chargeRadius + wobble);
            bGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            bGrad.addColorStop(0.4, 'rgba(0, 206, 201, 0.65)');
            bGrad.addColorStop(0.8, 'rgba(224, 86, 253, 0.65)');
            bGrad.addColorStop(1, 'rgba(112, 161, 255, 0.85)');

            ctx.fillStyle = bGrad;
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.arc(24 + chargeRadius * 0.6, -1, chargeRadius + wobble, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Glow aura if fully charged
            if (charge >= 1.0) {
                ctx.strokeStyle = 'rgba(0, 206, 201, 0.85)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(24 + chargeRadius * 0.6, -1, chargeRadius + wobble + 3, 0, Math.PI * 2);
                ctx.stroke();
            }

            // High specular highlight
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(24 + chargeRadius * 0.3, -1 - chargeRadius * 0.3, Math.max(2, chargeRadius * 0.28), 0, Math.PI * 2);
            ctx.fill();
        } else if (flash > 0 || recoil > 2) {
            // Standard small froth bubble when firing normal shots
            ctx.fillStyle = 'rgba(112, 161, 255, 0.85)';
            ctx.beginPath();
            ctx.arc(29, -1, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Bubble shine
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(27.5, -3, 1.8, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.BubbleGun = BubbleGun;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BubbleGun };
}
