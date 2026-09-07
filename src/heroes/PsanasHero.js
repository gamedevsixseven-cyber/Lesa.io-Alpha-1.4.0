/**
 * Lesa.io - Psanas Hero Definition & Visual Engine
 * The Slingshot Master:
 * - Athletic sleeveless black muscle tank top & gold cross necklace
 * - Backward purple/cyan snapback cap, dark curly fringe, and goatee
 * - Black athletic sweatpants & Air Jordan high-top sneakers
 * - Titanium Tactical Slingshot with neon power bands & charged kinetic pea
 */

class PsanasHero {
    static getLegsConfig() {
        return {
            pantsColor: '#1a1a1c',
            pantsAccent: '#2a2a2e',
            shoePrimary: '#111113',
            shoeAccent: '#c8d6e5',
            isHighTop: true
        };
    }

    static getArmConfig(flash) {
        return {
            sleeveColor: null, // bare athletic arms with wristband
            cuffColor: '#1e1e24',
            skinColor: flash ? '#ffffff' : '#d49b6a'
        };
    }

    /**
     * Psanas Torso & Head Likeness
     */
    static drawLikeness(ctx, r, flash, dir, isBack) {
        ctx.save();

        // 1. Muscular Torso & Shoulders
        ctx.fillStyle = flash ? '#ffffff' : '#1e1e24';
        ctx.strokeStyle = '#0f0f11';
        ctx.lineWidth = 2.6;

        // Black Sleeveless Tank Top
        ctx.beginPath();
        ctx.roundRect(-r * 0.52, -r * 0.45, r * 1.04, r * 0.85, [8, 8, 4, 4]);
        ctx.fill();
        ctx.stroke();

        // Tank top ribbing & chest contours
        if (!isBack && !flash) {
            ctx.strokeStyle = '#2d3436';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-r * 0.28, -r * 0.42);
            ctx.lineTo(-r * 0.28, r * 0.35);
            ctx.moveTo(r * 0.28, -r * 0.42);
            ctx.lineTo(r * 0.28, r * 0.35);
            ctx.stroke();

            // Gold Cross Necklace
            ctx.strokeStyle = '#f1c40f';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.arc(0, -r * 0.48, r * 0.32, 0.4, Math.PI - 0.4);
            ctx.stroke();

            // Golden Cross Pendant
            ctx.fillStyle = '#f39c12';
            ctx.strokeStyle = '#b7791f';
            ctx.lineWidth = 1.2;
            const crossY = -r * 0.16;
            ctx.fillRect(-2, crossY - 6, 4, 11);
            ctx.fillRect(-5, crossY - 3, 10, 3.5);
            ctx.strokeRect(-2, crossY - 6, 4, 11);
        }

        // Bare Shoulders (Athletic skin tone)
        const skinColor = flash ? '#ffffff' : '#d49b6a';
        ctx.fillStyle = skinColor;
        ctx.strokeStyle = '#8c5932';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(-r * 0.54, -r * 0.36, 6, 8, -0.3, 0, Math.PI * 2);
        ctx.ellipse(r * 0.54, -r * 0.36, 6, 8, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 2. Neck
        ctx.fillStyle = skinColor;
        ctx.fillRect(-r * 0.18, -r * 0.65, r * 0.36, r * 0.28);

        // 3. Head & Face
        ctx.translate(0, -r * 0.75);

        // Head base
        ctx.fillStyle = skinColor;
        ctx.strokeStyle = '#8c5932';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.42, r * 0.48, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Ears
        ctx.beginPath();
        ctx.ellipse(-r * 0.44, 0, 3.5, 6, 0, 0, Math.PI * 2);
        ctx.ellipse(r * 0.44, 0, 3.5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (isBack) {
            // Backward Snapback Cap (Back view: cap dome & snapback plastic strap)
            ctx.fillStyle = flash ? '#ffffff' : '#5f27cd';
            ctx.beginPath();
            ctx.ellipse(0, -2, r * 0.44, r * 0.42, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Cyan bill sticking out towards front
            ctx.fillStyle = '#00d2d3';
            ctx.fillRect(-r * 0.3 * dir, -8, r * 0.45 * dir, 4.5);

            // Snapback opening & plastic strap
            ctx.fillStyle = '#341f97';
            ctx.beginPath();
            ctx.arc(0, 2, 7, 0, Math.PI);
            ctx.fill();
            ctx.fillStyle = '#00d2d3';
            ctx.fillRect(-7, 5, 14, 3);
        } else {
            // Dark Curly Fringe Hair
            ctx.fillStyle = '#1e1e24';
            ctx.beginPath();
            ctx.arc(-8, -9, 6, 0, Math.PI * 2);
            ctx.arc(-2, -11, 7, 0, Math.PI * 2);
            ctx.arc(5, -10, 6, 0, Math.PI * 2);
            ctx.arc(10, -7, 5, 0, Math.PI * 2);
            ctx.fill();

            // Backward Snapback Cap Crown
            ctx.fillStyle = flash ? '#ffffff' : '#5f27cd';
            ctx.strokeStyle = '#0f0f11';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.ellipse(0, -7, r * 0.44, r * 0.36, 0, Math.PI, 0);
            ctx.fill();
            ctx.stroke();

            // Cyan Bill extending slightly to the back/side
            ctx.fillStyle = '#00d2d3';
            ctx.fillRect(-12 * dir, -11, 15 * dir, 4);

            // Facial Features
            if (!flash) {
                // Intense eyebrows
                ctx.strokeStyle = '#1a1a1c';
                ctx.lineWidth = 2.8;
                ctx.beginPath();
                ctx.moveTo(-9, -4);
                ctx.lineTo(-2, -3);
                ctx.moveTo(9, -4);
                ctx.lineTo(2, -3);
                ctx.stroke();

                // Eyes
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.ellipse(-6, 0, 3.5, 2.5, 0, 0, Math.PI * 2);
                ctx.ellipse(6, 0, 3.5, 2.5, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#1e1e24';
                ctx.beginPath();
                ctx.arc(-5.5 + dir * 0.8, 0, 1.8, 0, Math.PI * 2);
                ctx.arc(6.5 + dir * 0.8, 0, 1.8, 0, Math.PI * 2);
                ctx.fill();

                // Goatee / Beard
                ctx.fillStyle = '#1e1e24';
                ctx.beginPath();
                ctx.ellipse(0, 8, 4, 3, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(-4, 5, 8, 1.5);
            }
        }

        ctx.restore();
    }

    /**
     * TACTICAL SLINGSHOT (Psanas' Signature Weapon)
     * Titanium combat Y-fork, dual high-tension neon green power bands,
     * glowing kinetic pea projectile chambered
     */
    static drawWeapon(ctx, flash, recoil) {
        ctx.save();

        // Titanium Y-Fork Frame
        ctx.fillStyle = flash ? '#ffffff' : '#2f3542';
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 2.4;

        // Tactical Handle (Held firmly by support hand at x=22)
        ctx.beginPath();
        ctx.roundRect(16, 2, 7, 14, 2);
        ctx.fill();
        ctx.stroke();

        // Upper Y-Fork prongs
        ctx.fillStyle = flash ? '#ffffff' : '#57606f';
        ctx.beginPath();
        ctx.moveTo(17, 2);
        ctx.lineTo(24, -12);
        ctx.lineTo(29, -11);
        ctx.lineTo(23, 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(17, 2);
        ctx.lineTo(24, 14);
        ctx.lineTo(29, 13);
        ctx.lineTo(23, 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // High-Tension Neon Green Power Bands
        const pullX = 8 - (recoil * 1.5); // Pulls back with recoil
        ctx.strokeStyle = flash ? '#ffffff' : '#2ed573';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(27, -11);
        ctx.lineTo(pullX, 0);
        ctx.lineTo(27, 13);
        ctx.stroke();

        // Leather Launch Pouch (held by trigger hand)
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(pullX - 3, -3.5, 5, 7);

        // Charged Kinetic Pea Projectile
        ctx.fillStyle = flash ? '#ffffff' : '#26de81';
        ctx.strokeStyle = '#05c46b';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(pullX + 1, 0, 3.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Spark Burst on Fire
        if (recoil > 1.2) {
            ctx.fillStyle = '#2ed573';
            ctx.beginPath();
            ctx.arc(32, 0, 6 + recoil, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(31, 0, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.PsanasHero = PsanasHero;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PsanasHero };
}
