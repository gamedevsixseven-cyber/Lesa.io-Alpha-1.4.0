/**
 * Lesa.io - Psanas Hero Definition & Visual Engine
 * The Slingshot Master (faithfully modeled after PsanasFront, PsanasBack, PsanasAvatar & PsanasT-POSE):
 * - Fitted washed-black sleeveless athletic tank top exposing sculpted bare deltoid/biceps arms
 * - Fine gold chain with gold cross pendant (visible front pendant & rear collar chain)
 * - Sculpted tanned Mediterranean face with intense eyebrows, curly dark fringe, mustache, soul patch & goatee
 * - Backward royal-purple & cyan-teal snapback cap (front keyhole + teal strap + rear brim flare; back dome + flat brim)
 * - Charcoal-black tapered sweatpants, white ankle socks & Mocha/Sail/Black Air Jordan 1 high-top sneakers
 * - Titanium Tactical Slingshot with neon power bands & charged kinetic pea
 */

class PsanasHero {
    static getLegsConfig() {
        return {
            pantsColor: '#1b1c20',
            pantsAccent: '#2c2e35',
            sockColor: '#f5f6fa',
            shoePrimary: '#141416',
            shoeAccent: '#947e6b',
            shoeQuarter: '#f4f2ed',
            shoeSole: '#7c6857',
            isHighTop: true
        };
    }

    static getArmConfig(flash) {
        return {
            sleeveColor: null,
            cuffColor: null,
            skinColor: flash ? '#ffffff' : '#d28e5d'
        };
    }

    /**
     * Psanas Torso & Head Likeness
     */
    static drawLikeness(ctx, r, flash, dir, isBack) {
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        const skinFill = flash ? '#ffffff' : '#d28e5d';
        const skinShadow = flash ? '#ffffff' : '#a86538';
        const skinStroke = flash ? '#dfe4ea' : '#733e1e';

        // 1. Bare Sculpted Shoulders (behind tank straps / protruding cleanly at armholes)
        ctx.fillStyle = skinFill;
        ctx.strokeStyle = '#0f0f11';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.ellipse(-r * 0.53, -r * 0.25, 7.2, 9.2, -0.25, 0, Math.PI * 2);
        ctx.ellipse(r * 0.53, -r * 0.25, 7.2, 9.2, 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Deltoid contour highlight
        if (!flash) {
            ctx.fillStyle = '#e6ad7e';
            ctx.beginPath();
            ctx.ellipse(-r * 0.55, -r * 0.30, 3.0, 4.5, -0.2, 0, Math.PI * 2);
            ctx.ellipse(r * 0.55, -r * 0.30, 3.0, 4.5, 0.2, 0, Math.PI * 2);
            ctx.fill();
        }

        // 2. Fitted Charcoal-Black Sleeveless Athletic Tank Top (V-taper ending at waist to reveal joggers & AJ1s)
        const tankGrad = ctx.createLinearGradient(0, -r * 0.50, 0, r * 0.25);
        if (flash) {
            tankGrad.addColorStop(0, '#ffffff');
            tankGrad.addColorStop(1, '#f1f2f6');
        } else {
            tankGrad.addColorStop(0, '#2b2d34');
            tankGrad.addColorStop(0.55, '#1e2025');
            tankGrad.addColorStop(1, '#141519');
        }

        ctx.fillStyle = tankGrad;
        ctx.strokeStyle = '#0c0d0f';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-r * 0.36, -r * 0.49);
        ctx.quadraticCurveTo(0, -r * 0.40, r * 0.36, -r * 0.49); // crew neck scoop
        ctx.lineTo(r * 0.50, -r * 0.42);
        ctx.quadraticCurveTo(r * 0.41, -r * 0.16, r * 0.45, -0.02); // right sleeveless armhole curve
        ctx.lineTo(r * 0.42, r * 0.24);
        ctx.quadraticCurveTo(0, r * 0.28, -r * 0.42, r * 0.24); // fitted tank hem at waist
        ctx.lineTo(-r * 0.45, -0.02);
        ctx.quadraticCurveTo(-r * 0.41, -r * 0.16, -r * 0.50, -r * 0.42); // left sleeveless armhole curve
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Sweatpants waistband + crisp black upper thighs below tank hem
        if (!flash) {
            ctx.fillStyle = '#191a1f';
            ctx.strokeStyle = '#0c0d0f';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.roundRect(-r * 0.42, r * 0.23, r * 0.84, r * 0.14, 2);
            ctx.fill();
            ctx.stroke();
            if (!isBack) {
                ctx.strokeStyle = '#333640';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(-2, r * 0.24);
                ctx.lineTo(-2.8, r * 0.33);
                ctx.moveTo(2, r * 0.24);
                ctx.lineTo(2.8, r * 0.33);
                ctx.stroke();
            }
        }

        // Tank collar rib, chest contour & high Gold Cross Necklace
        if (!flash) {
            ctx.strokeStyle = '#32353d';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(-r * 0.34, -r * 0.46);
            ctx.quadraticCurveTo(0, -r * 0.36, r * 0.34, -r * 0.46);
            ctx.stroke();

            if (!isBack) {
                ctx.strokeStyle = '#2c2e35';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(-r * 0.26, -r * 0.14);
                ctx.quadraticCurveTo(-r * 0.12, -r * 0.08, -r * 0.04, -r * 0.11);
                ctx.moveTo(r * 0.26, -r * 0.14);
                ctx.quadraticCurveTo(r * 0.12, -r * 0.08, r * 0.04, -r * 0.11);
                ctx.stroke();

                // Gold Chain (V drape centered high on upper chest above hands)
                ctx.strokeStyle = '#f6c945';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(-r * 0.23, -r * 0.44);
                ctx.lineTo(0, -r * 0.23);
                ctx.lineTo(r * 0.23, -r * 0.44);
                ctx.stroke();

                // Gold Cross Pendant
                const crossY = -r * 0.18;
                ctx.fillStyle = '#f8cf4e';
                ctx.strokeStyle = '#8b5e12';
                ctx.lineWidth = 1.0;
                ctx.fillRect(-1.4, crossY - 4.0, 2.8, 7.6);
                ctx.strokeRect(-1.4, crossY - 4.0, 2.8, 7.6);
                ctx.fillRect(-3.4, crossY - 2.0, 6.8, 2.4);
                ctx.strokeRect(-3.4, crossY - 2.0, 6.8, 2.4);
                ctx.fillStyle = '#fff5b8';
                ctx.fillRect(-0.6, crossY - 3.2, 1.2, 1.6);
            } else {
                // Subtle back trapezius / fabric folds
                ctx.strokeStyle = '#2b2d34';
                ctx.lineWidth = 1.3;
                ctx.beginPath();
                ctx.moveTo(-r * 0.22, -r * 0.28);
                ctx.lineTo(-r * 0.04, -r * 0.10);
                ctx.moveTo(r * 0.22, -r * 0.28);
                ctx.lineTo(r * 0.04, -r * 0.10);
                ctx.stroke();
            }
        }

        // 3. Athletic Neck + Throat/Collarbone Shadow (+ Gold Chain on Back of Neck)
        ctx.fillStyle = skinFill;
        ctx.strokeStyle = skinStroke;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.roundRect(-r * 0.20, -r * 0.68, r * 0.40, r * 0.30, 3);
        ctx.fill();
        ctx.stroke();

        if (!flash && !isBack) {
            ctx.fillStyle = skinShadow;
            ctx.beginPath();
            ctx.moveTo(-r * 0.15, -r * 0.62);
            ctx.lineTo(0, -r * 0.50);
            ctx.lineTo(r * 0.15, -r * 0.62);
            ctx.quadraticCurveTo(0, -r * 0.56, -r * 0.15, -r * 0.62);
            ctx.fill();
        } else if (!flash && isBack) {
            // Gold chain visible on back of neck above collar
            ctx.strokeStyle = '#f6c945';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(-r * 0.22, -r * 0.47);
            ctx.quadraticCurveTo(0, -r * 0.41, r * 0.22, -r * 0.47);
            ctx.stroke();
        }

        // 4. Sculpted Head, Hair, Face & Backward Purple/Teal Snapback Cap
        const headW = r * 0.47;
        const headH = r * 0.55;
        ctx.translate(0, -r * 0.94);

        if (!isBack) {
            // Behind-Head Cyan-Teal Flat Brim Peeking Behind Ears & Purple Crown Flare (Front 3/4 Snapback Silhouette)
            ctx.fillStyle = flash ? '#ffffff' : '#0f9fc4';
            ctx.strokeStyle = '#0c0d10';
            ctx.lineWidth = 2.0;
            ctx.beginPath();
            ctx.ellipse(-dir * headW * 0.34, headH * 0.16, headW * 0.92, headH * 0.36, -0.22 * dir, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = flash ? '#ffffff' : '#4a25ab';
            ctx.beginPath();
            ctx.ellipse(0, -headH * 0.12, headW * 1.12, headH * 0.66, 0, Math.PI * 0.85, Math.PI * 0.15);
            ctx.fill();
            ctx.stroke();
        }

        // Ears
        ctx.fillStyle = skinFill;
        ctx.strokeStyle = '#0f0f11';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.ellipse(-headW * 0.98, headH * 0.04, 3.6, 5.8, -0.1, 0, Math.PI * 2);
        ctx.ellipse(headW * 0.98, headH * 0.04, 3.6, 5.8, 0.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Sculpted Head & Jawline
        const faceGrad = ctx.createLinearGradient(0, -headH * 0.8, 0, headH);
        if (flash) {
            faceGrad.addColorStop(0, '#ffffff');
            faceGrad.addColorStop(1, '#f1f2f6');
        } else {
            faceGrad.addColorStop(0, '#dda06b');
            faceGrad.addColorStop(0.65, '#ce8956');
            faceGrad.addColorStop(1, '#b16e41');
        }
        ctx.fillStyle = faceGrad;
        ctx.strokeStyle = '#0f0f11';
        ctx.lineWidth = 2.3;
        ctx.beginPath();
        ctx.moveTo(-headW * 0.92, -headH * 0.12);
        ctx.quadraticCurveTo(-headW * 0.96, -headH * 0.95, 0, -headH * 0.98);
        ctx.quadraticCurveTo(headW * 0.96, -headH * 0.95, headW * 0.92, -headH * 0.12);
        ctx.quadraticCurveTo(headW * 0.90, headH * 0.56, headW * 0.34, headH * 0.88);
        ctx.quadraticCurveTo(0, headH * 1.02, -headW * 0.34, headH * 0.88);
        ctx.quadraticCurveTo(-headW * 0.90, headH * 0.56, -headW * 0.92, -headH * 0.12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (isBack) {
            PsanasHero.drawBackHairAndCap(ctx, headW, headH, flash, dir);
        } else {
            PsanasHero.drawFrontFaceAndCap(ctx, headW, headH, flash, dir);
        }

        ctx.restore();
    }

    static drawFrontFaceAndCap(ctx, headW, headH, flash, dir) {
        if (!flash) {
            // Intense Angled Dark Eyebrows + Brow Furrow
            ctx.strokeStyle = '#141110';
            ctx.lineWidth = 2.7;
            ctx.beginPath();
            ctx.moveTo(-headW * 0.62, -headH * 0.14);
            ctx.lineTo(-headW * 0.16, -headH * 0.05);
            ctx.moveTo(headW * 0.62, -headH * 0.14);
            ctx.lineTo(headW * 0.16, -headH * 0.05);
            ctx.stroke();

            // Subtle brow furrow crease
            ctx.strokeStyle = '#8b4e2b';
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(0, -headH * 0.16);
            ctx.lineTo(0, -headH * 0.03);
            ctx.stroke();

            // Deep Brown Almond Eyes + White Specular Glint
            const eyeShift = dir * 0.6;
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#141110';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.ellipse(-headW * 0.38, headH * 0.06, 3.6, 2.3, 0, 0, Math.PI * 2);
            ctx.ellipse(headW * 0.38, headH * 0.06, 3.6, 2.3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#1f130d';
            ctx.beginPath();
            ctx.arc(-headW * 0.38 + eyeShift, headH * 0.06, 1.85, 0, Math.PI * 2);
            ctx.arc(headW * 0.38 + eyeShift, headH * 0.06, 1.85, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-headW * 0.38 + eyeShift - 0.6, headH * 0.06 - 0.6, 0.7, 0, Math.PI * 2);
            ctx.arc(headW * 0.38 + eyeShift - 0.6, headH * 0.06 - 0.6, 0.7, 0, Math.PI * 2);
            ctx.fill();

            // Sculpted Nose Contour
            ctx.strokeStyle = '#9c5931';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, headH * 0.02);
            ctx.lineTo(-1.4, headH * 0.30);
            ctx.lineTo(1.6, headH * 0.32);
            ctx.stroke();

            // Mustache, Composed Lips, Soul Patch & Trim Chin Goatee (matching PsanasAvatar.png)
            ctx.fillStyle = '#b97458';
            ctx.beginPath();
            ctx.ellipse(0, headH * 0.54, 4.2, 2.0, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#6f3c29';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-3.8, headH * 0.52);
            ctx.lineTo(3.8, headH * 0.52);
            ctx.stroke();

            // Mustache arch
            ctx.strokeStyle = '#171210';
            ctx.lineWidth = 1.9;
            ctx.beginPath();
            ctx.moveTo(-4.8, headH * 0.49);
            ctx.quadraticCurveTo(0, headH * 0.40, 4.8, headH * 0.49);
            ctx.stroke();

            // Soul patch + Trim chin goatee
            ctx.fillStyle = '#171210';
            ctx.fillRect(-1.8, headH * 0.60, 3.6, 2.1);
            ctx.beginPath();
            ctx.moveTo(-headW * 0.42, headH * 0.76);
            ctx.quadraticCurveTo(0, headH * 1.04, headW * 0.42, headH * 0.76);
            ctx.quadraticCurveTo(0, headH * 0.88, -headW * 0.42, headH * 0.76);
            ctx.fill();
        }

        // Lush Dark Curly Fringe across Forehead & Temples
        ctx.fillStyle = flash ? '#ffffff' : '#15100e';
        ctx.strokeStyle = '#0c0d0f';
        ctx.lineWidth = 1.7;
        const curls = [
            [-headW * 0.84, -headH * 0.38, 4.2], [-headW * 0.52, -headH * 0.44, 5.2],
            [-headW * 0.14, -headH * 0.42, 5.4], [headW * 0.24, -headH * 0.44, 5.3],
            [headW * 0.58, -headH * 0.42, 5.0], [headW * 0.86, -headH * 0.36, 4.1]
        ];
        ctx.beginPath();
        for (const [cx, cy, cr] of curls) {
            ctx.moveTo(cx + cr, cy);
            ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.stroke();

        // Backward Royal Purple Crown + Forehead Keyhole & Turquoise Snapback Strap
        ctx.fillStyle = flash ? '#ffffff' : '#4f2bb8';
        ctx.strokeStyle = '#0f0f11';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(-headW * 0.96, -headH * 0.38);
        ctx.quadraticCurveTo(-headW * 1.02, -headH * 1.24, 0, -headH * 1.26);
        ctx.quadraticCurveTo(headW * 1.02, -headH * 1.24, headW * 0.96, -headH * 0.38);
        ctx.quadraticCurveTo(headW * 0.52, -headH * 0.52, headW * 0.38, -headH * 0.58);
        ctx.arc(0, -headH * 0.62, headW * 0.38, 0, Math.PI, true); // forehead keyhole arch
        ctx.quadraticCurveTo(-headW * 0.52, -headH * 0.52, -headW * 0.96, -headH * 0.38);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            // Curl lock peeking above strap inside the keyhole
            ctx.fillStyle = '#181210';
            ctx.beginPath();
            ctx.arc(-2, -headH * 0.78, 3.6, 0, Math.PI * 2);
            ctx.arc(3, -headH * 0.74, 3.2, 0, Math.PI * 2);
            ctx.fill();

            // Turquoise Plastic Snapback Strap across Keyhole
            ctx.fillStyle = '#15b2d7';
            ctx.strokeStyle = '#0a5e75';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.roundRect(-headW * 0.42, -headH * 0.66, headW * 0.84, 3.8, 1.5);
            ctx.fill();
            ctx.stroke();

            // Tiny teal embroidered side emblem nested cleanly inside purple panel + curl coil texture
            ctx.strokeStyle = '#331a80';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(-headW * 0.54, -headH * 0.54);
            ctx.quadraticCurveTo(-headW * 0.42, -headH * 1.06, 0, -headH * 1.24);
            ctx.moveTo(headW * 0.54, -headH * 0.54);
            ctx.quadraticCurveTo(headW * 0.42, -headH * 1.06, 0, -headH * 1.24);
            ctx.stroke();

            ctx.fillStyle = '#15b2d7';
            ctx.fillRect(-headW * 0.72 * dir - 1.2, -headH * 0.68, 2.4, 2.8);

            // Subtle dark espresso S-curl highlights on bangs
            ctx.strokeStyle = '#34241c';
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.arc(-headW * 0.45, -headH * 0.42, 2.4, 0.3, 2.5);
            ctx.arc(0, -headH * 0.40, 2.6, 0.2, 2.4);
            ctx.arc(headW * 0.42, -headH * 0.42, 2.4, 0.3, 2.5);
            ctx.stroke();
        }
    }

    static drawBackHairAndCap(ctx, headW, headH, flash, dir) {
        // Dark Curly Hair Framing Nape & Sides Underneath Brim
        ctx.fillStyle = flash ? '#ffffff' : '#15100e';
        ctx.strokeStyle = '#0c0d0f';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(-headW * 0.55, headH * 0.14, 5.2, 0, Math.PI * 2);
        ctx.arc(0, headH * 0.22, 6.2, 0, Math.PI * 2);
        ctx.arc(headW * 0.55, headH * 0.14, 5.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Full 6-Panel Royal Purple Dome
        ctx.fillStyle = flash ? '#ffffff' : '#4f2bb8';
        ctx.strokeStyle = '#0f0f11';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(0, -headH * 0.56, headW * 0.98, headH * 0.72, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            // 6-panel seams + top cyan button
            ctx.strokeStyle = '#341b84';
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.moveTo(0, -headH * 1.24);
            ctx.lineTo(0, -headH * 0.12);
            ctx.moveTo(0, -headH * 1.24);
            ctx.quadraticCurveTo(-headW * 0.52, -headH * 0.85, -headW * 0.66, -headH * 0.18);
            ctx.moveTo(0, -headH * 1.24);
            ctx.quadraticCurveTo(headW * 0.52, -headH * 0.85, headW * 0.66, -headH * 0.18);
            ctx.stroke();

            // Teal crown button
            ctx.fillStyle = '#15b2d7';
            ctx.strokeStyle = '#0f0f11';
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.arc(0, -headH * 1.24, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Teal embroidered crest badge above brim (matching PsanasBack.png)
            ctx.strokeStyle = '#15b2d7';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(-4, -headH * 0.50);
            ctx.lineTo(0, -headH * 0.64);
            ctx.lineTo(4, -headH * 0.50);
            ctx.lineTo(0, -headH * 0.36);
            ctx.closePath();
            ctx.stroke();
        }

        // Bold Angled Flat Cyan-Teal Brim on Back of Head (PsanasBack.png)
        ctx.fillStyle = flash ? '#ffffff' : '#15b2d7';
        ctx.strokeStyle = '#0f0f11';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(-dir * 1.8, -headH * 0.04, headW * 1.04, headH * 0.36, -0.18 * dir, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
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
        const pullX = 8 - (recoil * 1.5);
        ctx.strokeStyle = flash ? '#ffffff' : '#2ed573';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(27, -11);
        ctx.lineTo(pullX, 0);
        ctx.lineTo(27, 13);
        ctx.stroke();

        // Leather Launch Pouch
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
