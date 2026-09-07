/**
 * Lesa.io - Petros Hero Definition & Visual Engine
 * The Blue Hood Sentinel:
 * - Heavy royal blue puffer jacket with quilted baffles & silver metal zipper
 * - Puffer hood resting around collar, clean fade haircut, friendly determined smile
 * - Heavy black combat cargo pants & Nike sneakers
 * - Heavy Watermelon Cannon bazooka with rotary striped drum magazine
 */

class PetrosHero {
    static getLegsConfig() {
        return {
            pantsColor: '#242426',
            pantsAccent: '#18181a',
            shoePrimary: '#1e272e',
            shoeAccent: '#f1f2f6',
            isHighTop: false
        };
    }

    static getArmConfig(flash) {
        return {
            sleeveColor: flash ? '#ffffff' : '#1e70d6', // royal blue puffer sleeve
            cuffColor: '#1455a4',
            skinColor: flash ? '#ffffff' : '#e0a97c'
        };
    }

    /**
     * Petros Torso & Head Likeness
     */
    static drawLikeness(ctx, r, flash, dir, isBack) {
        ctx.save();

        // 1. Royal Blue Puffer Jacket
        const jacketColor = flash ? '#ffffff' : '#1e70d6';
        ctx.fillStyle = jacketColor;
        ctx.strokeStyle = '#0f2f5c';
        ctx.lineWidth = 2.8;

        ctx.beginPath();
        ctx.roundRect(-r * 0.58, -r * 0.48, r * 1.16, r * 0.9, [10, 10, 6, 6]);
        ctx.fill();
        ctx.stroke();

        // Puffer Quilted Baffles & Zipper
        if (!flash) {
            ctx.strokeStyle = '#1555a6';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-r * 0.55, -r * 0.2);
            ctx.lineTo(r * 0.55, -r * 0.2);
            ctx.moveTo(-r * 0.55, r * 0.08);
            ctx.lineTo(r * 0.55, r * 0.08);
            ctx.stroke();

            if (!isBack) {
                // Silver Metal Zipper
                ctx.strokeStyle = '#f1f2f6';
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.moveTo(0, -r * 0.48);
                ctx.lineTo(0, r * 0.4);
                ctx.stroke();

                // Zipper pull tab
                ctx.fillStyle = '#ced6e0';
                ctx.fillRect(-2.5, -r * 0.35, 5, 6);
            }
        }

        // 2. Head & Hood
        ctx.translate(0, -r * 0.78);

        // Puffer Hood Resting Around Neck
        ctx.fillStyle = '#1455a4';
        ctx.strokeStyle = '#0b356d';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(0, 4, r * 0.54, r * 0.36, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Head
        const skinColor = flash ? '#ffffff' : '#e0a97c';
        ctx.fillStyle = skinColor;
        ctx.strokeStyle = '#8a532d';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.44, r * 0.46, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Clean Fade Haircut
        ctx.fillStyle = '#2c1810';
        ctx.beginPath();
        ctx.ellipse(0, -6, r * 0.45, r * 0.38, 0, Math.PI, 0);
        ctx.fill();
        // Hairline fade
        ctx.fillRect(-r * 0.44, -6, 5, 8);
        ctx.fillRect(r * 0.44 - 5, -6, 5, 8);

        if (!isBack && !flash) {
            // Friendly defined eyebrows
            ctx.strokeStyle = '#2c1810';
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.moveTo(-10, -4);
            ctx.lineTo(-3, -3);
            ctx.moveTo(10, -4);
            ctx.lineTo(3, -3);
            ctx.stroke();

            // Eyes
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(-7, 1, 4, 3, 0, 0, Math.PI * 2);
            ctx.ellipse(7, 1, 4, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#1e272e';
            ctx.beginPath();
            ctx.arc(-6.5 + dir * 0.7, 1, 2, 0, Math.PI * 2);
            ctx.arc(7.5 + dir * 0.7, 1, 2, 0, Math.PI * 2);
            ctx.fill();

            // Friendly confident smile
            ctx.strokeStyle = '#8a532d';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 5, 5, 0.2, Math.PI - 0.2);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * WATERMELON CANNON (Petros' Signature Weapon)
     * Heavy ordnance bazooka launcher with striped watermelon drum magazine,
     * cooling vents, assault foregrip, and optical sight
     */
    static drawWeapon(ctx, flash, recoil) {
        ctx.save();

        // Gun Receiver / Main Body
        ctx.fillStyle = flash ? '#ffffff' : '#2d3436';
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 2.4;
        ctx.fillRect(6, -6, 26, 12);
        ctx.strokeRect(6, -6, 26, 12);

        // Heavy Barrel Tube with muzzle break
        ctx.fillStyle = flash ? '#ffffff' : '#3d484d';
        ctx.fillRect(32, -4.5, 14, 9);
        ctx.strokeRect(32, -4.5, 14, 9);

        // Muzzle Brake Crown
        ctx.fillStyle = flash ? '#ffffff' : '#636e72';
        ctx.fillRect(44, -6.5, 5, 13);
        ctx.strokeRect(44, -6.5, 5, 13);

        // Top Optical Sight Rail
        ctx.fillStyle = '#636e72';
        ctx.fillRect(14, -10, 14, 4);
        ctx.fillStyle = '#00d2d3';
        ctx.fillRect(18, -9, 6, 2);

        // Front Tactical Assault Foregrip (Gripped by support hand)
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(23, 6, 5, 8);

        // Rear Pistol Grip (Gripped by trigger hand)
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(9, 6, 4.5, 9);

        // WATERMELON DRUM MAGAZINE (Rotary grenade cylinder)
        ctx.fillStyle = flash ? '#ffffff' : '#20bf6b';
        ctx.strokeStyle = '#107a43';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(18, 0, 9, 8.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Watermelon Dark Green Stripes
        if (!flash) {
            ctx.fillStyle = '#0f5132';
            ctx.beginPath();
            ctx.ellipse(18, -4, 7, 2, 0, 0, Math.PI * 2);
            ctx.ellipse(18, 4, 7, 2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Golden Center Pin
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(18, 0, 2.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Muzzle Blast when firing (recoil kick active)
        if (recoil > 1.8) {
            ctx.fillStyle = '#2ed573';
            ctx.beginPath();
            ctx.arc(52, 0, 9 + recoil, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(51, 0, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.PetrosHero = PetrosHero;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PetrosHero };
}
