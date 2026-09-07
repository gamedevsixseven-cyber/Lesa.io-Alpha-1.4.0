/**
 * Lesa.io - 50balos Hero Definition & Visual Engine
 * The Cash Hustler:
 * - Athletic deep navy blue zip-up tracksuit jacket with white racing shoulder stripes
 * - Silver circular O-ring zipper pull at collar and cyan chest logo
 * - Black cuffed athletic jogger pants & Air Jordan high-top sneakers (black & mocha/beige)
 * - Wavy textured brown hair with fade and confident smirk
 * - Signature Money Gun cash cannon blasting crisp 50€ banknotes
 */

class FiftyBalosHero {
    static getLegsConfig() {
        return {
            pantsColor: '#18191c',
            pantsAccent: '#28292d',
            shoePrimary: '#111113',
            shoeAccent: '#c5b8a5',
            isHighTop: true
        };
    }

    static getArmConfig(flash) {
        return {
            sleeveColor: flash ? '#ffffff' : '#162c50', // deep navy tracksuit sleeve
            cuffColor: '#0d1b33',
            skinColor: flash ? '#ffffff' : '#e0ab7e'
        };
    }

    /**
     * 50balos Torso & Head Likeness
     */
    static drawLikeness(ctx, r, flash, dir, isBack) {
        ctx.save();

        // 1. Navy Athletic Tracksuit Jacket
        const jacketColor = flash ? '#ffffff' : '#162c50';
        ctx.fillStyle = jacketColor;
        ctx.strokeStyle = '#0d1b33';
        ctx.lineWidth = 2.8;

        ctx.beginPath();
        ctx.roundRect(-r * 0.54, -r * 0.46, r * 1.08, r * 0.88, [9, 9, 5, 5]);
        ctx.fill();
        ctx.stroke();

        // Shoulder & Sleeve Racing Stripes (White / Cream)
        if (!flash) {
            ctx.fillStyle = '#eaeaea';
            ctx.strokeStyle = '#0d1b33';
            ctx.lineWidth = 1.2;

            // Left Shoulder Racing Stripe
            ctx.beginPath();
            ctx.roundRect(-r * 0.52, -r * 0.44, 7, r * 0.82, 3);
            ctx.fill();
            ctx.stroke();

            // Right Shoulder Racing Stripe
            ctx.beginPath();
            ctx.roundRect(r * 0.52 - 7, -r * 0.44, 7, r * 0.82, 3);
            ctx.fill();
            ctx.stroke();

            // Ribbed Tracksuit Hem
            ctx.fillStyle = '#0f203b';
            ctx.fillRect(-r * 0.5, r * 0.34, r * 1.0, 6);
            ctx.fillStyle = '#eaeaea';
            ctx.fillRect(-r * 0.48, r * 0.36, r * 0.96, 1.6);
        }

        if (!isBack && !flash) {
            // Center Zipper Line
            ctx.strokeStyle = '#0a1424';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -r * 0.46);
            ctx.lineTo(0, r * 0.34);
            ctx.stroke();

            // Silver O-Ring Zipper Pull at Collar
            ctx.strokeStyle = '#dcdde1';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.arc(0, -r * 0.28, 3.8, 0, Math.PI * 2);
            ctx.stroke();

            // Cyan Chest Logo ("TIMES" badge on left chest)
            ctx.fillStyle = '#00d2d3';
            ctx.beginPath();
            ctx.arc(-r * 0.26, -r * 0.16, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#3867d6';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // 2. High Zip Collar
        ctx.fillStyle = flash ? '#ffffff' : '#13243f';
        ctx.strokeStyle = '#0d1b33';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.roundRect(-r * 0.32, -r * 0.54, r * 0.64, r * 0.24, [4, 4, 2, 2]);
        ctx.fill();
        ctx.stroke();

        // 3. Head & Facial Likeness
        const headRadius = r * 0.52;
        const headY = -r * 0.82;

        ctx.save();
        ctx.translate(0, headY);

        // Neck
        ctx.fillStyle = flash ? '#ffffff' : '#c99368';
        ctx.fillRect(-r * 0.18, 0, r * 0.36, r * 0.34);

        // Face Base
        ctx.fillStyle = flash ? '#ffffff' : '#e0ab7e';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, headRadius * 0.88, headRadius * 0.98, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Ears
        ctx.fillStyle = flash ? '#ffffff' : '#e0ab7e';
        ctx.lineWidth = 2;
        // Left Ear
        ctx.beginPath();
        ctx.ellipse(-headRadius * 0.86, 0, 3.5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Right Ear
        ctx.beginPath();
        ctx.ellipse(headRadius * 0.86, 0, 3.5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (!isBack && !flash) {
            // Expressive Brown Eyes with confident glint
            ctx.fillStyle = '#2c1810';
            ctx.beginPath();
            ctx.ellipse(-headRadius * 0.34, -headRadius * 0.1, 3.2, 4.2, 0.05, 0, Math.PI * 2);
            ctx.ellipse(headRadius * 0.34, -headRadius * 0.1, 3.2, 4.2, -0.05, 0, Math.PI * 2);
            ctx.fill();

            // Eye Highlights
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-headRadius * 0.32, -headRadius * 0.14, 1.3, 0, Math.PI * 2);
            ctx.arc(headRadius * 0.36, -headRadius * 0.14, 1.3, 0, Math.PI * 2);
            ctx.fill();

            // Arched Groomed Eyebrows
            ctx.strokeStyle = '#3e2723';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(-headRadius * 0.52, -headRadius * 0.28);
            ctx.quadraticCurveTo(-headRadius * 0.34, -headRadius * 0.38, -headRadius * 0.14, -headRadius * 0.24);
            ctx.moveTo(headRadius * 0.14, -headRadius * 0.24);
            ctx.quadraticCurveTo(headRadius * 0.34, -headRadius * 0.38, headRadius * 0.52, -headRadius * 0.28);
            ctx.stroke();

            // Nose
            ctx.strokeStyle = '#b88155';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(0, -headRadius * 0.12);
            ctx.lineTo(-2, headRadius * 0.15);
            ctx.lineTo(2, headRadius * 0.16);
            ctx.stroke();

            // Signature Confident Smirk / Smile
            ctx.strokeStyle = '#8d4b32';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(-headRadius * 0.28, headRadius * 0.34);
            ctx.quadraticCurveTo(0, headRadius * 0.52, headRadius * 0.32, headRadius * 0.38);
            ctx.stroke();

            // Subtle Dimple / Cheek Smile Crease
            ctx.strokeStyle = '#c99368';
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.arc(headRadius * 0.36, headRadius * 0.34, 3, -0.6, 0.8);
            ctx.stroke();
        }

        // 4. Textured Wavy Brown Hair (Fade on sides, wavy quiff fringe on top)
        if (!flash) {
            ctx.fillStyle = '#4a2f20';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2.4;

            // Hair Volume Top & Wavy Fringe
            ctx.beginPath();
            ctx.moveTo(-headRadius * 0.85, -headRadius * 0.3);
            ctx.quadraticCurveTo(-headRadius * 0.95, -headRadius * 0.85, -headRadius * 0.5, -headRadius * 1.15);
            ctx.quadraticCurveTo(0, -headRadius * 1.3, headRadius * 0.55, -headRadius * 1.12);
            ctx.quadraticCurveTo(headRadius * 0.95, -headRadius * 0.8, headRadius * 0.85, -headRadius * 0.25);
            // Fringe waves
            ctx.quadraticCurveTo(headRadius * 0.5, -headRadius * 0.55, headRadius * 0.2, -headRadius * 0.7);
            ctx.quadraticCurveTo(-headRadius * 0.2, -headRadius * 0.65, -headRadius * 0.85, -headRadius * 0.3);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Individual Wavy Locks / Curls Highlight
            ctx.strokeStyle = '#6d4833';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-headRadius * 0.3, -headRadius * 1.1);
            ctx.quadraticCurveTo(-headRadius * 0.1, -headRadius * 1.22, headRadius * 0.1, -headRadius * 1.05);
            ctx.moveTo(0, -headRadius * 0.95);
            ctx.quadraticCurveTo(headRadius * 0.25, -headRadius * 1.1, headRadius * 0.4, -headRadius * 0.9);
            ctx.stroke();
        }

        ctx.restore();
        ctx.restore();
    }

    /**
     * 50balos Signature Weapon: Money Gun
     */
    static drawWeapon(ctx, flash, recoil) {
        ctx.save();
        ctx.translate(14 - recoil * 0.5, 4);

        // 1. Money Gun Main Red Body
        ctx.fillStyle = flash ? '#ffffff' : '#d63031';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.roundRect(-4, -8, 28, 16, [4, 6, 6, 4]);
        ctx.fill();
        ctx.stroke();

        // 2. Gold Luxury Trims
        if (!flash) {
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(18, -8, 6, 16);
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.4;
            ctx.strokeRect(18, -8, 6, 16);

            // "50€" Logo on Gun Flank
            ctx.fillStyle = '#f5cd79';
            ctx.font = 'bold 7px sans-serif';
            ctx.fillText('50€', 0, 3);

            // Transparent Acrylic Top Cash Hopper
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.fillRect(-2, -12, 18, 4);
            ctx.strokeStyle = '#f39c12';
            ctx.lineWidth = 1.2;
            ctx.strokeRect(-2, -12, 18, 4);

            // Loaded 50€ Bills Stack inside Hopper
            ctx.fillStyle = '#e67e22';
            ctx.fillRect(0, -11, 14, 2.5);

            // Ejecting 50€ Banknote from front slot!
            ctx.save();
            ctx.translate(25, -2);
            ctx.rotate(0.1);
            ctx.fillStyle = '#f39c12';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.2;
            ctx.fillRect(0, -3, 10, 6);
            ctx.strokeRect(0, -3, 10, 6);
            ctx.fillStyle = '#2c3e50';
            ctx.font = 'bold 4px sans-serif';
            ctx.fillText('50', 2, 1.5);
            ctx.restore();
        }

        // 3. Gun Pistol Grip
        ctx.fillStyle = flash ? '#ffffff' : '#2d3436';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-2, 8, 8, 12, 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.FiftyBalosHero = FiftyBalosHero;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FiftyBalosHero };
}
