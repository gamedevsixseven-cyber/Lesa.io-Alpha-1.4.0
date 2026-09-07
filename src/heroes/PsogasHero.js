/**
 * Lesa.io - Psogas Hero Definition & Visual Engine
 * The Fiery Chili Rebel:
 * - Dark navy windbreaker with bold red & white racing chest stripes
 * - Dark hood collar, sporty dark hair with fringe tufts, expressive eyes & confident smirk
 * - Black jogger cargo pants & sporty runners
 * - High-velocity Chili Blaster with glowing plasma core & laser sight guide
 */

class PsogasHero {
    static getLegsConfig() {
        return {
            pantsColor: '#1e1e20',
            pantsAccent: '#2d3436',
            shoePrimary: '#222f3e',
            shoeAccent: '#c8d6e5',
            isHighTop: false
        };
    }

    static getArmConfig(flash) {
        return {
            sleeveColor: flash ? '#ffffff' : '#222f3e', // dark navy windbreaker sleeve
            cuffColor: '#0f172a',
            skinColor: flash ? '#ffffff' : '#e4b087'
        };
    }

    /**
     * Psogas Torso & Head Likeness
     */
    static drawLikeness(ctx, r, flash, dir, isBack) {
        ctx.save();

        // 1. Navy Windbreaker
        const jacketColor = flash ? '#ffffff' : '#222f3e';
        ctx.fillStyle = jacketColor;
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.8;

        ctx.beginPath();
        ctx.roundRect(-r * 0.54, -r * 0.46, r * 1.08, r * 0.88, [8, 8, 5, 5]);
        ctx.fill();
        ctx.stroke();

        // Signature Red & White Racing Stripes across Chest
        if (!flash) {
            // Bold Red Stripe
            ctx.fillStyle = '#eb4d4b';
            ctx.fillRect(-r * 0.52, -r * 0.22, r * 1.04, 7);
            // Crisp White Stripe
            ctx.fillStyle = '#f5f6fa';
            ctx.fillRect(-r * 0.52, -r * 0.08, r * 1.04, 6);

            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.4;
            ctx.strokeRect(-r * 0.52, -r * 0.22, r * 1.04, 13);

            if (!isBack) {
                // Front zipper line
                ctx.strokeStyle = '#dfe4ea';
                ctx.lineWidth = 1.8;
                ctx.beginPath();
                ctx.moveTo(0, -r * 0.46);
                ctx.lineTo(0, r * 0.38);
                ctx.stroke();
            }
        }

        // 2. Head & Hood
        ctx.translate(0, -r * 0.76);

        // Dark Navy Hood Around Collar
        ctx.fillStyle = '#1b2636';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(0, 3, r * 0.5, r * 0.34, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Head
        const skinColor = flash ? '#ffffff' : '#e4b087';
        ctx.fillStyle = skinColor;
        ctx.strokeStyle = '#94613b';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.42, r * 0.46, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Sporty Dark Hair with textured fringe
        ctx.fillStyle = '#1c1b20';
        ctx.beginPath();
        ctx.ellipse(0, -6, r * 0.43, r * 0.36, 0, Math.PI, 0);
        ctx.fill();
        // Fringe tufts
        ctx.beginPath();
        ctx.moveTo(-10, -6);
        ctx.lineTo(-6, -1);
        ctx.lineTo(-2, -6);
        ctx.lineTo(2, 0);
        ctx.lineTo(6, -6);
        ctx.lineTo(10, -2);
        ctx.lineTo(12, -6);
        ctx.closePath();
        ctx.fill();

        if (!isBack && !flash) {
            // Energetic athletic eyebrows
            ctx.strokeStyle = '#1c1b20';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-9, -3);
            ctx.lineTo(-2, -2);
            ctx.moveTo(9, -3);
            ctx.lineTo(2, -2);
            ctx.stroke();

            // Expressive bright eyes
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(-6, 1.5, 3.8, 2.8, 0, 0, Math.PI * 2);
            ctx.ellipse(6, 1.5, 3.8, 2.8, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#2f3542';
            ctx.beginPath();
            ctx.arc(-5.5 + dir * 0.7, 1.5, 2, 0, Math.PI * 2);
            ctx.arc(6.5 + dir * 0.7, 1.5, 2, 0, Math.PI * 2);
            ctx.fill();

            // Sporty smirk
            ctx.strokeStyle = '#94613b';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(1, 6, 4, 0.3, Math.PI - 0.5);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * CHILI BLASTER (Psogas' Signature Weapon)
     * High-velocity dual-barrel blaster with glowing red/orange chili plasma core,
     * angled foregrip, and laser sight guide
     */
    static drawWeapon(ctx, flash, recoil) {
        ctx.save();

        // Laser Sight Guide
        ctx.strokeStyle = 'rgba(235, 77, 75, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(38, 0);
        ctx.lineTo(120, 0);
        ctx.stroke();
        ctx.setLineDash([]);

        // Blaster Frame / Receiver
        ctx.fillStyle = flash ? '#ffffff' : '#1e1e24';
        ctx.strokeStyle = '#0f0f11';
        ctx.lineWidth = 2.2;
        ctx.fillRect(8, -5, 22, 10);
        ctx.strokeRect(8, -5, 22, 10);

        // Dual Chrome Barrels
        ctx.fillStyle = flash ? '#ffffff' : '#747d8c';
        ctx.fillRect(30, -4, 10, 3.5);
        ctx.fillRect(30, 0.5, 10, 3.5);
        ctx.strokeRect(30, -4, 10, 3.5);
        ctx.strokeRect(30, 0.5, 10, 3.5);

        // Angled Front Foregrip
        ctx.fillStyle = '#2f3542';
        ctx.beginPath();
        ctx.moveTo(22, 5);
        ctx.lineTo(26, 12);
        ctx.lineTo(22, 12);
        ctx.lineTo(18, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Rear Pistol Grip
        ctx.fillStyle = '#1e1e24';
        ctx.fillRect(10, 5, 4.5, 8);

        // GLOWING CHILI PLASMA CORE
        ctx.fillStyle = flash ? '#ffffff' : '#eb4d4b';
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(14, -3, 11, 6, 3);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            // Hot plasma gradient core
            ctx.fillStyle = '#f9ca24';
            ctx.fillRect(16, -1.5, 7, 3);
        }

        // Fiery Muzzle Flash on shot
        if (recoil > 1.2) {
            ctx.fillStyle = '#f0932b';
            ctx.beginPath();
            ctx.arc(43, 0, 7 + recoil, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(42, 0, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.PsogasHero = PsogasHero;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PsogasHero };
}
