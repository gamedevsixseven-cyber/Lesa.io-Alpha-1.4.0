/**
 * Lesa.io - Billias Hero Definition & Visual Engine
 * The Burger Slugger:
 * - Youthful rounded face with chubby cheeks, neat dark crop hair & dark defined eyebrows
 * - Black oversized crewneck t-shirt with white script chest logo
 * - Black cargo sweatpants with side pocket flaps & Air Jordan high-top sneakers (black & light grey)
 * - Signature Weapon: Throws juicy stacked cheeseburgers
 * - Passive: Moving builds hunger; eats 1 burger every 1 minute to restore +20 HP!
 */

class BilliasHero {
    static getLegsConfig() {
        return {
            pantsColor: '#18191c',
            pantsAccent: '#2d3034',
            shoePrimary: '#141416',
            shoeAccent: '#95a5a6',
            isHighTop: true
        };
    }

    static getArmConfig(flash) {
        return {
            sleeveColor: flash ? '#ffffff' : '#1b1b1e', // black oversized tee short sleeve
            cuffColor: '#111114',
            skinColor: flash ? '#ffffff' : '#e2ad82'
        };
    }

    /**
     * Billias Torso & Head Likeness
     */
    static drawLikeness(ctx, r, flash, dir, isBack) {
        ctx.save();

        // 1. Slightly stockier torso with black oversized t-shirt
        const shirtColor = flash ? '#ffffff' : '#1b1b1e';
        ctx.fillStyle = shirtColor;
        ctx.strokeStyle = '#0d0d0f';
        ctx.lineWidth = 2.8;

        // Oversized relaxed t-shirt shape
        ctx.beginPath();
        ctx.roundRect(-r * 0.58, -r * 0.44, r * 1.16, r * 0.90, [8, 8, 5, 5]);
        ctx.fill();
        ctx.stroke();

        // Crewneck collar
        ctx.fillStyle = flash ? '#ffffff' : '#121215';
        ctx.strokeStyle = '#0a0a0c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.43, r * 0.28, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Front details: script logo and relaxed folds
        if (!isBack && !flash) {
            // White script logo on left chest ("Santa")
            ctx.fillStyle = '#f5f6fa';
            ctx.font = 'italic bold 6.5px sans-serif';
            ctx.fillText('Santa', -r * 0.38, -r * 0.16);

            // Subtle shirt fold lines
            ctx.strokeStyle = '#27272c';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(-r * 0.40, r * 0.18);
            ctx.quadraticCurveTo(0, r * 0.25, r * 0.38, r * 0.16);
            ctx.moveTo(-r * 0.45, r * 0.32);
            ctx.quadraticCurveTo(0, r * 0.38, r * 0.45, r * 0.30);
            ctx.stroke();
        }

        // 2. Neck
        const skinColor = flash ? '#ffffff' : '#e2ad82';
        ctx.fillStyle = skinColor;
        ctx.fillRect(-r * 0.19, -r * 0.62, r * 0.38, r * 0.24);

        // 3. Head & Facial Likeness (Chubby cheeks, youthful rounded face)
        const headRadius = r * 0.53;
        const headY = -r * 0.82;

        ctx.save();
        ctx.translate(0, headY);

        // Face base
        ctx.fillStyle = skinColor;
        ctx.strokeStyle = '#8d5530';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        // Slightly wider lower cheek curve
        ctx.ellipse(0, 0, headRadius * 0.94, headRadius * 0.96, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Chubby Cheeks Highlight / Contour
        if (!isBack && !flash) {
            ctx.fillStyle = 'rgba(235, 130, 110, 0.25)';
            ctx.beginPath();
            ctx.ellipse(-headRadius * 0.52, headRadius * 0.22, 6.5, 4.5, -0.15, 0, Math.PI * 2);
            ctx.ellipse(headRadius * 0.52, headRadius * 0.22, 6.5, 4.5, 0.15, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ears
        ctx.fillStyle = skinColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(-headRadius * 0.92, 0, 3.8, 6.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(headRadius * 0.92, 0, 3.8, 6.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (isBack) {
            // Dark Brown Hair Back View
            ctx.fillStyle = flash ? '#ffffff' : '#2b1b14';
            ctx.strokeStyle = '#0d0d0f';
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.ellipse(0, -headRadius * 0.25, headRadius * 0.94, headRadius * 0.78, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else {
            // Dark Defined Eyebrows
            ctx.strokeStyle = '#1d120d';
            ctx.lineWidth = 2.8;
            ctx.beginPath();
            // Left eyebrow
            ctx.moveTo(-headRadius * 0.58, -headRadius * 0.18);
            ctx.quadraticCurveTo(-headRadius * 0.36, -headRadius * 0.30, -headRadius * 0.14, -headRadius * 0.16);
            // Right eyebrow
            ctx.moveTo(headRadius * 0.14, -headRadius * 0.16);
            ctx.quadraticCurveTo(headRadius * 0.36, -headRadius * 0.30, headRadius * 0.58, -headRadius * 0.18);
            ctx.stroke();

            // Large Warm Dark Brown Eyes
            ctx.fillStyle = '#20120b';
            ctx.beginPath();
            ctx.ellipse(-headRadius * 0.36, -headRadius * 0.04, 3.8, 4.5, 0, 0, Math.PI * 2);
            ctx.ellipse(headRadius * 0.36, -headRadius * 0.04, 3.8, 4.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Eye specular glints
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-headRadius * 0.33, -headRadius * 0.08, 1.4, 0, Math.PI * 2);
            ctx.arc(headRadius * 0.39, -headRadius * 0.08, 1.4, 0, Math.PI * 2);
            ctx.fill();

            // Soft Rounded Nose
            ctx.strokeStyle = '#9e623a';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(0, -headRadius * 0.06);
            ctx.lineTo(-2, headRadius * 0.18);
            ctx.quadraticCurveTo(0, headRadius * 0.22, 2, headRadius * 0.18);
            ctx.stroke();

            // Gentle Calm Smile
            ctx.strokeStyle = '#7c3f2b';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(-headRadius * 0.30, headRadius * 0.38);
            ctx.quadraticCurveTo(0, headRadius * 0.48, headRadius * 0.30, headRadius * 0.38);
            ctx.stroke();

            // Neat Dark Hair Crop (Fringe combed neatly with subtle texture)
            ctx.fillStyle = flash ? '#ffffff' : '#2b1b14';
            ctx.strokeStyle = '#0d0d0f';
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.moveTo(-headRadius * 0.92, -headRadius * 0.25);
            ctx.quadraticCurveTo(-headRadius * 0.95, -headRadius * 0.95, -headRadius * 0.45, -headRadius * 1.18);
            ctx.quadraticCurveTo(0, -headRadius * 1.25, headRadius * 0.45, -headRadius * 1.18);
            ctx.quadraticCurveTo(headRadius * 0.95, -headRadius * 0.95, headRadius * 0.92, -headRadius * 0.25);
            // Front fringe sweep
            ctx.quadraticCurveTo(headRadius * 0.5, -headRadius * 0.55, 0, -headRadius * 0.58);
            ctx.quadraticCurveTo(-headRadius * 0.5, -headRadius * 0.60, -headRadius * 0.92, -headRadius * 0.25);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Hair texture strands
            ctx.strokeStyle = '#422a1f';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(-headRadius * 0.3, -headRadius * 1.05);
            ctx.quadraticCurveTo(0, -headRadius * 1.15, headRadius * 0.3, -headRadius * 1.05);
            ctx.stroke();
        }

        ctx.restore();
        ctx.restore();
    }

    /**
     * Billias Signature Weapon: Stacked Cheeseburger
     */
    static drawWeapon(ctx, flash, recoil) {
        ctx.save();
        ctx.translate(16 - recoil * 0.5, 4);

        if (flash) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(0, 0, 13, 10, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return;
        }

        // 1. Bottom Bun
        ctx.fillStyle = '#d38b43';
        ctx.strokeStyle = '#1b120c';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.roundRect(-10, 3, 20, 5, [2, 2, 4, 4]);
        ctx.fill();
        ctx.stroke();

        // 2. Grilled Beef Patty
        ctx.fillStyle = '#54321d';
        ctx.beginPath();
        ctx.roundRect(-11, 0, 22, 4.5, 2);
        ctx.fill();
        ctx.stroke();

        // 3. Melted Yellow Cheddar Cheese (drooping corners)
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.moveTo(-11, 0);
        ctx.lineTo(11, 0);
        ctx.lineTo(8, 3.5);
        ctx.lineTo(2, 0.5);
        ctx.lineTo(-4, 3.5);
        ctx.lineTo(-11, 0);
        ctx.closePath();
        ctx.fill();

        // 4. Fresh Red Tomato & Wavy Green Lettuce
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(-9, -2.5, 18, 2.5);

        ctx.fillStyle = '#2ecc71';
        ctx.beginPath();
        ctx.moveTo(-11, -2.5);
        ctx.quadraticCurveTo(-7, -4.5, -3, -2.5);
        ctx.quadraticCurveTo(2, -4.5, 6, -2.5);
        ctx.quadraticCurveTo(9, -4.5, 11, -2.5);
        ctx.lineTo(11, -1);
        ctx.lineTo(-11, -1);
        ctx.closePath();
        ctx.fill();

        // 5. Golden Top Bun with Sesame Seeds
        ctx.fillStyle = '#e59b52';
        ctx.strokeStyle = '#1b120c';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(0, -5, 11, 6.5, 0, Math.PI, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Sesame Seeds
        ctx.fillStyle = '#fdf6e2';
        const seeds = [[-5, -7], [-1, -9], [3, -7], [6, -6], [-4, -4], [2, -4]];
        for (let i = 0; i < seeds.length; i++) {
            ctx.beginPath();
            ctx.ellipse(seeds[i][0], seeds[i][1], 1.2, 0.7, 0.3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Billias Movement Hunger Mechanic:
     * "the more he moves the more he gets hungry so he will eat 1 burger every 1 minute that gains him 20hp"
     */
    static updateHunger(player, dt, effects) {
        if (!player || player.heroType !== 'billias' || player.hp <= 0) return;

        // Baseline: 60 seconds = 3600 frames at 60 FPS
        const BASE_HUNGER_INTERVAL = 3600;

        if (typeof player.billiasHungerTimer === 'undefined') {
            player.billiasHungerTimer = 0;
        }

        // The more he moves, the hungrier he gets! Moving accelerates hunger accumulation.
        const hungerRate = player.isMoving ? 1.25 : 0.45;
        player.billiasHungerTimer += dt * hungerRate;

        if (player.billiasHungerTimer >= BASE_HUNGER_INTERVAL) {
            player.billiasHungerTimer = 0;

            // Heal +20 HP up to maxHp
            const prevHp = player.hp;
            player.hp = Math.min(player.maxHp, player.hp + 20);

            // Visual celebration: Comic splash & green/gold crumb sparks
            if (effects) {
                effects.addComicSplash(player.x, player.y - 32, '🍔 CHOMP! +20 HP');
                effects.addSparks(player.x, player.y, '#2ecc71', 8);
                effects.addSparks(player.x, player.y, '#f39c12', 6);
                effects.addDust(player.x, player.y, 4, 6);
            }

            // Audio crunch / pickup feedback
            if (window.soundEngine) {
                if (typeof window.soundEngine.playPickup === 'function') {
                    window.soundEngine.playPickup('heart');
                } else if (typeof window.soundEngine.playPowerup === 'function') {
                    window.soundEngine.playPowerup();
                }
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.BilliasHero = BilliasHero;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BilliasHero };
}
