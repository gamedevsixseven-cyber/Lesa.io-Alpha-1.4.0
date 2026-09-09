/**
 * Lesa.io - Kitsos Hero Definition & Visual Engine
 * The Electric Speedster:
 * - Textured dark brown curly hair with high fade on sides & voluminous curls on top
 * - Black speckled crewneck t-shirt with white Nike swoosh chest logo
 * - Burgundy/maroon athletic shorts, black crew socks & Air Jordan high-top sneakers
 * - Signature Weapon: Drops high-voltage lightning bolts with 10% chance for 4-enemy chain lightning
 * - Fastest hero in the game (+0.2 speed advantage)
 */

class KitsosHero {
    static getLegsConfig() {
        return {
            pantsColor: '#782832', // burgundy athletic shorts
            pantsAccent: '#581822',
            shoePrimary: '#141416',
            shoeAccent: '#95a5a6',
            isHighTop: true
        };
    }

    static getArmConfig(flash) {
        return {
            sleeveColor: flash ? '#ffffff' : '#1e1f24', // black speckled short sleeve
            cuffColor: '#121316',
            skinColor: flash ? '#ffffff' : '#dfa575'
        };
    }

    /**
     * Kitsos Torso & Head Likeness
     */
    static drawLikeness(ctx, r, flash, dir, isBack) {
        ctx.save();

        // 1. Athletic Slim Torso (Black Speckled Nike T-Shirt)
        const shirtColor = flash ? '#ffffff' : '#1e1f24';
        ctx.fillStyle = shirtColor;
        ctx.strokeStyle = '#0d0e11';
        ctx.lineWidth = 2.6;

        ctx.beginPath();
        ctx.roundRect(-r * 0.52, -r * 0.44, r * 1.04, r * 0.86, [7, 7, 4, 4]);
        ctx.fill();
        ctx.stroke();

        // Crewneck collar
        ctx.fillStyle = flash ? '#ffffff' : '#141518';
        ctx.strokeStyle = '#0a0a0c';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.43, r * 0.25, 4.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // White speckles pattern on t-shirt
        if (!flash) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            const speckles = [
                [-r * 0.35, -r * 0.2], [-r * 0.2, -r * 0.05], [-r * 0.38, r * 0.15],
                [r * 0.35, -r * 0.22], [r * 0.22, -r * 0.08], [r * 0.32, r * 0.2],
                [-r * 0.12, r * 0.22], [r * 0.1, r * 0.25], [-r * 0.28, r * 0.32], [r * 0.25, r * 0.32]
            ];
            for (let i = 0; i < speckles.length; i++) {
                ctx.fillRect(speckles[i][0], speckles[i][1], 1.2, 1.2);
            }
        }

        // Front details: Nike text & swoosh logo
        if (!isBack && !flash) {
            ctx.save();
            ctx.translate(0, -r * 0.16);

            // "NIKE" bold athletic text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'italic bold 7.5px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('NIKE', 0, 0);

            // Iconic Swoosh curve underneath
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.moveTo(-r * 0.26, 2.5);
            ctx.quadraticCurveTo(0, 6.0, r * 0.24, 0.5);
            ctx.stroke();
            ctx.restore();
        }

        // 2. Neck
        const skinColor = flash ? '#ffffff' : '#dfa575';
        ctx.fillStyle = skinColor;
        ctx.fillRect(-r * 0.16, -r * 0.62, r * 0.32, r * 0.24);

        // 3. Head & Facial Likeness (Curly textured hair fade, athletic facial structure)
        const headRadius = r * 0.50;
        const headY = -r * 0.82;

        ctx.save();
        ctx.translate(0, headY);

        // Face Base
        ctx.fillStyle = skinColor;
        ctx.strokeStyle = '#8c522b';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, headRadius * 0.88, headRadius * 0.98, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Ears
        ctx.fillStyle = skinColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(-headRadius * 0.88, 0, 3.6, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(headRadius * 0.88, 0, 3.6, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (isBack) {
            // Dark Brown Curly Hair Back View with high fade
            ctx.fillStyle = flash ? '#ffffff' : '#331e13';
            ctx.strokeStyle = '#0d0d0f';
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.ellipse(0, -headRadius * 0.3, headRadius * 0.90, headRadius * 0.85, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // High fade nape
            ctx.fillStyle = '#22140c';
            ctx.beginPath();
            ctx.roundRect(-headRadius * 0.45, headRadius * 0.1, headRadius * 0.9, headRadius * 0.4, 3);
            ctx.fill();
        } else {
            // Expressive Dark Eyebrows
            ctx.strokeStyle = '#24140b';
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            // Left eyebrow with high arch
            ctx.moveTo(-headRadius * 0.54, -headRadius * 0.18);
            ctx.quadraticCurveTo(-headRadius * 0.32, -headRadius * 0.32, -headRadius * 0.12, -headRadius * 0.18);
            // Right eyebrow
            ctx.moveTo(headRadius * 0.12, -headRadius * 0.18);
            ctx.quadraticCurveTo(headRadius * 0.32, -headRadius * 0.32, headRadius * 0.54, -headRadius * 0.18);
            ctx.stroke();

            // Lively Athletic Dark Eyes
            ctx.fillStyle = '#1c1009';
            ctx.beginPath();
            ctx.ellipse(-headRadius * 0.34, -headRadius * 0.05, 3.4, 4.2, 0.05, 0, Math.PI * 2);
            ctx.ellipse(headRadius * 0.34, -headRadius * 0.05, 3.4, 4.2, -0.05, 0, Math.PI * 2);
            ctx.fill();

            // Eye Highlights
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-headRadius * 0.32, -headRadius * 0.09, 1.3, 0, Math.PI * 2);
            ctx.arc(headRadius * 0.36, -headRadius * 0.09, 1.3, 0, Math.PI * 2);
            ctx.fill();

            // Athletic Defined Nose
            ctx.strokeStyle = '#a4653a';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(0, -headRadius * 0.08);
            ctx.lineTo(-2, headRadius * 0.16);
            ctx.quadraticCurveTo(0, headRadius * 0.20, 2, headRadius * 0.16);
            ctx.stroke();

            // Confident Radiant Smile
            ctx.strokeStyle = '#85422e';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(-headRadius * 0.30, headRadius * 0.36);
            ctx.quadraticCurveTo(0, headRadius * 0.52, headRadius * 0.30, headRadius * 0.36);
            ctx.stroke();

            // High Fade Sideburns
            ctx.fillStyle = '#2a180e';
            ctx.fillRect(-headRadius * 0.88, -headRadius * 0.5, 4, headRadius * 0.6);
            ctx.fillRect(headRadius * 0.88 - 4, -headRadius * 0.5, 4, headRadius * 0.6);

            // Voluminous Textured Curly Hair on Top (Crown & Fringe Curls)
            ctx.fillStyle = flash ? '#ffffff' : '#331e13';
            ctx.strokeStyle = '#0e0805';
            ctx.lineWidth = 2.4;

            // Base crown volume
            ctx.beginPath();
            ctx.moveTo(-headRadius * 0.88, -headRadius * 0.25);
            ctx.quadraticCurveTo(-headRadius * 1.0, -headRadius * 0.95, -headRadius * 0.5, -headRadius * 1.25);
            ctx.quadraticCurveTo(0, -headRadius * 1.38, headRadius * 0.5, -headRadius * 1.25);
            ctx.quadraticCurveTo(headRadius * 1.0, -headRadius * 0.95, headRadius * 0.88, -headRadius * 0.25);
            ctx.quadraticCurveTo(headRadius * 0.45, -headRadius * 0.6, 0, -headRadius * 0.65);
            ctx.quadraticCurveTo(-headRadius * 0.45, -headRadius * 0.6, -headRadius * 0.88, -headRadius * 0.25);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Individual Curls & Ringlets on Top
            ctx.fillStyle = flash ? '#ffffff' : '#3f2518';
            const curls = [
                [-headRadius * 0.6, -headRadius * 0.95, 4.5],
                [-headRadius * 0.3, -headRadius * 1.15, 5.0],
                [0, -headRadius * 1.25, 5.5],
                [headRadius * 0.3, -headRadius * 1.15, 5.0],
                [headRadius * 0.6, -headRadius * 0.95, 4.5],
                [-headRadius * 0.45, -headRadius * 0.75, 4.0],
                [-headRadius * 0.15, -headRadius * 0.85, 4.5],
                [headRadius * 0.15, -headRadius * 0.85, 4.5],
                [headRadius * 0.45, -headRadius * 0.75, 4.0],
                [-headRadius * 0.05, -headRadius * 0.62, 3.8] // fringe curly ringlet
            ];
            for (let i = 0; i < curls.length; i++) {
                ctx.beginPath();
                ctx.arc(curls[i][0], curls[i][1], curls[i][2], 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }

            // Curly highlight accents
            ctx.strokeStyle = '#5a3824';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(-headRadius * 0.3, -headRadius * 1.15, 2.8, 0.4, Math.PI);
            ctx.arc(0, -headRadius * 1.25, 3.2, 0.4, Math.PI);
            ctx.arc(headRadius * 0.3, -headRadius * 1.15, 2.8, 0.4, Math.PI);
            ctx.stroke();
        }

        ctx.restore();
        ctx.restore();
    }

    /**
     * Kitsos Signature Weapon: High-Voltage Lightning Gauntlet
     */
    static drawWeapon(ctx, flash, recoil) {
        ctx.save();
        ctx.translate(14 - recoil * 0.5, 3);

        const time = Date.now() * 0.008;

        // 1. Sleek Tactical Wrist Gauntlet
        ctx.fillStyle = flash ? '#ffffff' : '#1e272e';
        ctx.strokeStyle = '#0fbcf9';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(-4, -6, 20, 12, 3);
        ctx.fill();
        ctx.stroke();

        // 2. Glowing Lightning Battery Core
        ctx.fillStyle = flash ? '#ffffff' : '#00d2d3';
        ctx.beginPath();
        ctx.roundRect(0, -3, 12, 6, 2);
        ctx.fill();

        // High-voltage lightning bolt emblem on core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(7, -4);
        ctx.lineTo(3, 0);
        ctx.lineTo(6, 0);
        ctx.lineTo(4, 4);
        ctx.lineTo(9, -0.5);
        ctx.lineTo(6, -0.5);
        ctx.closePath();
        ctx.fill();

        // 3. Crackling Cyan/White Electric Spark Arcs around hands
        if (!flash) {
            ctx.strokeStyle = '#00d2d3';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            const jitter1 = Math.sin(time * 3) * 4;
            const jitter2 = Math.cos(time * 4) * 4;
            ctx.moveTo(12, -2);
            ctx.lineTo(18, -4 + jitter1);
            ctx.lineTo(24, 1 + jitter2);
            ctx.lineTo(30, -1);
            ctx.stroke();

            // Inner white core
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(12, -2);
            ctx.lineTo(18, -4 + jitter1);
            ctx.lineTo(24, 1 + jitter2);
            ctx.lineTo(30, -1);
            ctx.stroke();

            // Radiating electric sparks
            ctx.fillStyle = '#70a1ff';
            ctx.beginPath();
            ctx.arc(22, -6 + jitter2, 1.8, 0, Math.PI * 2);
            ctx.arc(26, 6 + jitter1, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.KitsosHero = KitsosHero;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { KitsosHero };
}
