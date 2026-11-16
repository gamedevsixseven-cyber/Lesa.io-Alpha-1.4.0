/**
 * Lesa.io - 50balos Hero Definition & High-Detail Visual Engine
 * Modeled faithfully after 50BalosT-POSE.png, 50balos.png, 50balosCrop.png & MoneyGun.png:
 * - Portrait-accurate likeness: high skin-taper temple & nape fade, boxy tousled chestnut curly top,
 *   cel-shaded tanned facial planes, straight-angled thick dark brows, relaxed almond smiling eyes,
 *   curved cheek smile folds, confident half-smirk, sculpted neck & tight-tucked detailed ears
 * - Broad navy athletic zip-up tracksuit with cobalt outer shoulder/arm panels, crisp cream racing stripe,
 *   stand-up collar over black crewneck inner tee, gunmetal zipper + silver O-ring pull,
 *   royal-blue 3-arc "TIMES" chest emblem, slanted pockets & split cream/cobalt/cream ribbed hem/cuffs
 * - Relaxed charcoal track joggers with drawstring + detailed Cream/Black Air Jordan 1 high-tops
 * - Crimson & 24K Gold Cash Cannon 50 with slanted clear bill hopper, "€" currency strap & un-mirrored 50€ notes
 */

class FiftyBalosHero {
    static getLegsConfig() {
        return {
            pantsColor: '#191a1e',
            pantsAccent: '#2b2d34',
            shoePrimary: '#101115',
            shoeAccent: '#e2d8c5',
            shoeQuarter: '#e2d8c5',
            midsoleColor: '#eae1cd',
            shoeSole: '#0e0f12',
            hipWidth: 7.6,
            thighHalf: 4.3,
            legTopY: -10,
            isHighTop: true
        };
    }

    static getArmConfig(flash) {
        return {
            sleeveColor: flash ? '#ffffff' : '#0f244d',
            sleevePanelColor: flash ? null : '#1162df',
            sleeveStripeColor: flash ? null : '#ece5d7',
            cuffColor: '#0a1834',
            cuffStripeColor: flash ? null : '#156be8',
            skinColor: flash ? '#ffffff' : '#db8f5d'
        };
    }

    /* ====================================================================
       1. RELAXED CHARCOAL JOGGERS & CREAM/BLACK AIR JORDAN 1 HIGH-TOPS
       ==================================================================== */
    static drawLegs(player, ctx, r, walkCycle, moving, facingLeft, flash = false) {
        const feetBaseY = r * 0.36;
        const hipWidth = 7.6;
        const strideRange = moving ? 10.5 : 0;
        const leftStride = Math.sin(walkCycle) * strideRange;
        const rightStride = Math.sin(walkCycle + Math.PI) * strideRange;
        const leftLift = moving ? Math.max(0, -Math.cos(walkCycle)) * 5.6 : 0;
        const rightLift = moving ? Math.max(0, -Math.cos(walkCycle + Math.PI)) * 5.6 : 0;

        // Draw receding back leg first, then lead leg for crisp overlap
        if (rightLift > leftLift) {
            FiftyBalosHero.drawSingleJoggerAndAJ1(ctx, hipWidth, feetBaseY, rightStride, rightLift, facingLeft, 1);
            FiftyBalosHero.drawSingleJoggerAndAJ1(ctx, -hipWidth, feetBaseY, leftStride, leftLift, facingLeft, -1);
        } else {
            FiftyBalosHero.drawSingleJoggerAndAJ1(ctx, -hipWidth, feetBaseY, leftStride, leftLift, facingLeft, -1);
            FiftyBalosHero.drawSingleJoggerAndAJ1(ctx, hipWidth, feetBaseY, rightStride, rightLift, facingLeft, 1);
        }
    }

    static drawSingleJoggerAndAJ1(ctx, hipX, baseY, strideX, liftY, facingLeft, sideSign) {
        ctx.save();
        ctx.translate(hipX, baseY);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        const footX = strideX;
        const footY = -liftY;
        const shoeDir = facingLeft ? -1 : 1;

        if (liftY > 1) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
            ctx.beginPath();
            ctx.ellipse(footX, 10.5, 7.4, 3.0, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Tapered relaxed track jogger leg
        const thighHalf = 4.1;
        const legTopY = -9;
        const kneeX = footX * 0.45;
        const kneeY = footY * 0.45 - 4.4;
        const legGrad = ctx.createLinearGradient(-thighHalf, legTopY, thighHalf, footY);
        legGrad.addColorStop(0, '#23252b');
        legGrad.addColorStop(0.55, '#191a1f');
        legGrad.addColorStop(1, '#111216');

        ctx.fillStyle = legGrad;
        ctx.strokeStyle = '#0a0b0e';
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.moveTo(-thighHalf, legTopY);
        ctx.lineTo(thighHalf, legTopY);
        ctx.quadraticCurveTo(kneeX + 4.9, kneeY, footX + 4.1, footY - 1.5);
        ctx.lineTo(footX - 4.1, footY - 1.5);
        ctx.quadraticCurveTo(kneeX - 4.9, kneeY, -thighHalf, legTopY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Subtle athletic drape crease & elastic gathered jogger ankle cuff
        ctx.strokeStyle = '#2d3038';
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(sideSign * 0.6, legTopY + 2.5);
        ctx.quadraticCurveTo(kneeX + sideSign * 1.4, kneeY + 1.0, footX + sideSign * 0.6, footY - 3.5);
        ctx.stroke();

        ctx.fillStyle = '#141519';
        ctx.strokeStyle = '#090a0d';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(footX - 4.4, footY - 3.2, 8.8, 3.0, 1.5);
        ctx.fill();
        ctx.stroke();

        // Air Jordan 1 High-Top (Cream/Sail Quarter + Black Collar/Toe Cap/Swoosh + Cream Cupsole)
        ctx.translate(footX, footY);

        // High-top black padded collar + cream heel foxing
        ctx.fillStyle = '#111216';
        ctx.strokeStyle = '#090a0d';
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.roundRect(-4.6, -6.2, 9.2, 6.2, 1.8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#e2d8c5';
        ctx.fillRect(-4.5 * shoeDir, -5.2, 4.1 * shoeDir, 4.2);
        // Collar wings-flap seam stitch
        ctx.strokeStyle = '#2c2f38';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-4.2 * shoeDir, -4.6);
        ctx.lineTo(-0.8 * shoeDir, -3.5);
        ctx.stroke();

        // Cream/Sail main upper silhouette
        ctx.fillStyle = '#e2d8c5';
        ctx.strokeStyle = '#0a0a0d';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(-6.2 * shoeDir, -2.8, 13.4 * shoeDir, 6.8, 2.8);
        ctx.fill();
        ctx.stroke();

        // Black heel counter overlay & black perforated toe mudguard
        ctx.fillStyle = '#111216';
        ctx.beginPath();
        ctx.roundRect(-6.0 * shoeDir, -2.4, 3.6 * shoeDir, 5.8, 1.5);
        ctx.fill();

        ctx.beginPath();
        ctx.roundRect(1.6 * shoeDir, -1.6, 5.5 * shoeDir, 5.1, 2.2);
        ctx.fill();

        // Cream perforated toebox inlay inside black mudguard
        ctx.fillStyle = '#d9ceb9';
        ctx.beginPath();
        ctx.ellipse(3.3 * shoeDir, -0.5, 1.9, 1.0, 0.08 * shoeDir, 0, Math.PI * 2);
        ctx.fill();

        // Black eyestay & criss-cross laces
        ctx.fillStyle = '#111216';
        ctx.fillRect(0.2 * shoeDir, -4.2, 2.5 * shoeDir, 3.2);
        ctx.strokeStyle = '#2c2f38';
        ctx.lineWidth = 0.75;
        for (const ly of [-3.6, -2.6]) {
            ctx.beginPath();
            ctx.moveTo(0.4 * shoeDir, ly);
            ctx.lineTo(2.4 * shoeDir, ly + 0.4);
            ctx.stroke();
        }

        // Bold Black Nike Swoosh across the cream midfoot panel
        ctx.fillStyle = '#0d0e11';
        ctx.beginPath();
        ctx.moveTo(-4.2 * shoeDir, -1.1);
        ctx.quadraticCurveTo(-0.5 * shoeDir, 1.8, 3.1 * shoeDir, -0.4);
        ctx.quadraticCurveTo(0.1 * shoeDir, 3.0, -4.4 * shoeDir, 0.3);
        ctx.closePath();
        ctx.fill();

        // Cream Cupsole Midsole + Black Rubber Outsole
        ctx.fillStyle = '#eae1cd';
        ctx.strokeStyle = '#1a1b20';
        ctx.lineWidth = 1.25;
        ctx.fillRect(-6.6 * shoeDir, 3.0, 14.2 * shoeDir, 2.5);
        ctx.strokeRect(-6.6 * shoeDir, 3.0, 14.2 * shoeDir, 2.5);

        ctx.fillStyle = '#0e0f12';
        ctx.fillRect(-6.6 * shoeDir, 5.2, 14.2 * shoeDir, 1.6);

        ctx.restore();
    }

    /* ====================================================================
       2. TORSO, ATHLETIC NAVY TRACKSUIT & PORTRAIT HEAD LIKENESS
       ==================================================================== */
    static drawLikeness(ctx, r, flash, dir, isBack) {
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        FiftyBalosHero.drawTracksuitTorso(ctx, r, flash, isBack);
        FiftyBalosHero.drawNeckAndHead(ctx, r, flash, dir, isBack);

        ctx.restore();
    }

    static drawTracksuitTorso(ctx, r, flash, isBack) {
        // Upper Charcoal Jogger Waistband + Drawstring Ties visible below zipper hem
        if (!flash) {
            ctx.fillStyle = '#18191d';
            ctx.strokeStyle = '#0a0b0e';
            ctx.lineWidth = 1.9;
            ctx.beginPath();
            ctx.roundRect(-r * 0.48, r * 0.25, r * 0.96, r * 0.14, 2.5);
            ctx.fill();
            ctx.stroke();

            if (!isBack) {
                ctx.strokeStyle = '#0b0c0f';
                ctx.lineWidth = 1.3;
                for (const s of [-1, 1]) {
                    ctx.beginPath();
                    ctx.moveTo(s * 1.4, r * 0.28);
                    ctx.quadraticCurveTo(s * 2.1, r * 0.34, s * 1.7, r * 0.38);
                    ctx.stroke();
                }
            }
        }

        // Broad Structured Athletic Navy Nylon Bomber Jacket (~1.46x head width)
        const jacketGrad = ctx.createLinearGradient(0, -r * 0.50, 0, r * 0.31);
        if (flash) {
            jacketGrad.addColorStop(0, '#ffffff');
            jacketGrad.addColorStop(1, '#f1f2f6');
        } else {
            jacketGrad.addColorStop(0, '#163368');
            jacketGrad.addColorStop(0.50, '#0d1f44');
            jacketGrad.addColorStop(1, '#071229');
        }

        ctx.fillStyle = jacketGrad;
        ctx.strokeStyle = '#070f20';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-r * 0.31, -r * 0.50);
        ctx.quadraticCurveTo(-r * 0.59, -r * 0.46, -r * 0.63, -r * 0.18);
        ctx.quadraticCurveTo(-r * 0.62, r * 0.10, -r * 0.54, r * 0.29);
        ctx.lineTo(r * 0.54, r * 0.29);
        ctx.quadraticCurveTo(r * 0.62, r * 0.10, r * 0.63, -r * 0.18);
        ctx.quadraticCurveTo(r * 0.59, -r * 0.46, r * 0.31, -r * 0.50);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            // Clip interior details strictly inside jacket silhouette
            ctx.save();
            ctx.clip();

            // Subtle Nylon Drape Highlights & Shadow Folds (matching 50balos.png fabric sheen)
            ctx.fillStyle = 'rgba(42, 92, 178, 0.22)';
            ctx.beginPath();
            ctx.ellipse(-r * 0.25, -r * 0.16, r * 0.18, r * 0.24, -0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(r * 0.25, -r * 0.16, r * 0.18, r * 0.24, 0.15, 0, Math.PI * 2);
            ctx.fill();

            // Outer Cobalt/Royal Blue Raglan Shoulder Blocks + Cream Racing Piping
            for (const s of [-1, 1]) {
                ctx.fillStyle = '#1162df';
                ctx.beginPath();
                ctx.moveTo(s * r * 0.25, -r * 0.52);
                ctx.quadraticCurveTo(s * r * 0.58, -r * 0.47, s * r * 0.65, -r * 0.14);
                ctx.lineTo(s * r * 0.53, -r * 0.12);
                ctx.quadraticCurveTo(s * r * 0.46, -r * 0.35, s * r * 0.23, -r * 0.40);
                ctx.closePath();
                ctx.fill();

                // Bright upper cobalt ridge highlight
                ctx.strokeStyle = '#2d84ff';
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(s * r * 0.30, -r * 0.47);
                ctx.quadraticCurveTo(s * r * 0.55, -r * 0.42, s * r * 0.61, -r * 0.18);
                ctx.stroke();

                // Iconic thick Cream/Off-White Shoulder Stripe below cobalt panel
                ctx.strokeStyle = '#ece5d7';
                ctx.lineWidth = 2.7;
                ctx.beginPath();
                ctx.moveTo(s * r * 0.25, -r * 0.42);
                ctx.quadraticCurveTo(s * r * 0.48, -r * 0.36, s * r * 0.55, -r * 0.12);
                ctx.stroke();

                ctx.strokeStyle = '#070f20';
                ctx.lineWidth = 0.85;
                ctx.beginPath();
                ctx.moveTo(s * r * 0.23, -r * 0.38);
                ctx.quadraticCurveTo(s * r * 0.44, -r * 0.32, s * r * 0.51, -r * 0.11);
                ctx.stroke();
            }

            if (!isBack) {
                // Chest & Lower Jacket Fabric Fold Shadow Lines
                ctx.strokeStyle = 'rgba(5, 11, 24, 0.72)';
                ctx.lineWidth = 1.25;
                for (const s of [-1, 1]) {
                    ctx.beginPath();
                    ctx.moveTo(s * r * 0.16, -r * 0.26);
                    ctx.quadraticCurveTo(s * r * 0.20, -r * 0.04, s * r * 0.14, r * 0.14);
                    ctx.stroke();

                    // Slanted Hand Pocket Welt Openings + Fold Shadow
                    ctx.beginPath();
                    ctx.moveTo(s * r * 0.44, r * 0.01);
                    ctx.lineTo(s * r * 0.27, r * 0.16);
                    ctx.stroke();

                    ctx.strokeStyle = 'rgba(28, 62, 128, 0.35)';
                    ctx.lineWidth = 1.0;
                    ctx.beginPath();
                    ctx.moveTo(s * r * 0.46, r * 0.02);
                    ctx.lineTo(s * r * 0.30, r * 0.17);
                    ctx.stroke();
                    ctx.strokeStyle = 'rgba(5, 11, 24, 0.72)';
                    ctx.lineWidth = 1.25;
                }

                // Wearer's Left-Chest Royal Blue 3-Arc "TIMES" Half-Dome Emblem
                const lx = r * 0.31;
                const ly = -r * 0.21;
                ctx.strokeStyle = '#1b76ff';
                ctx.lineCap = 'butt';
                ctx.lineWidth = 1.25;
                for (const rad of [1.15, 2.25, 3.40]) {
                    ctx.beginPath();
                    ctx.arc(lx - 1.3, ly - 0.7, rad, -Math.PI * 0.5, 0);
                    ctx.stroke();
                }
                ctx.lineCap = 'round';
                ctx.fillStyle = '#1b76ff';
                ctx.fillRect(lx - 1.3, ly - 0.9, 3.9, 0.8);
                ctx.fillStyle = '#2b86ff';
                ctx.font = 'italic 900 2.85px Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('TIMES', lx + 0.8, ly + 3.25);

                // Split Ribbed Waistband flanking center zipper (Cream / Cobalt / Cream)
                for (const s of [-1, 1]) {
                    const rx = (s < 0) ? -r * 0.54 : 1.5;
                    const rw = r * 0.54 - 1.5;
                    ctx.fillStyle = '#091632';
                    ctx.strokeStyle = '#060c1c';
                    ctx.lineWidth = 1.4;
                    ctx.fillRect(rx, r * 0.19, rw, r * 0.11);
                    ctx.strokeRect(rx, r * 0.19, rw, r * 0.11);

                    ctx.fillStyle = '#ece5d7';
                    ctx.fillRect(rx + 0.6, r * 0.215, rw - 1.2, 1.1);
                    ctx.fillStyle = '#146be6';
                    ctx.fillRect(rx + 0.6, r * 0.238, rw - 1.2, 1.5);
                    ctx.fillStyle = '#ece5d7';
                    ctx.fillRect(rx + 0.6, r * 0.265, rw - 1.2, 1.1);
                }

                // Gunmetal Toothed Zipper Track running cleanly down center front
                ctx.strokeStyle = '#283142';
                ctx.lineWidth = 2.4;
                ctx.beginPath();
                ctx.moveTo(0, -r * 0.42);
                ctx.lineTo(0, r * 0.30);
                ctx.stroke();

                ctx.strokeStyle = '#9aa5b5';
                ctx.lineWidth = 1.05;
                ctx.setLineDash([1.4, 1.5]);
                ctx.beginPath();
                ctx.moveTo(0, -r * 0.41);
                ctx.lineTo(0, r * 0.29);
                ctx.stroke();
                ctx.setLineDash([]);
            } else {
                // Back Jacket Center Seam, Horizontal Yoke Line & Full-Width Striped Waistband
                ctx.strokeStyle = '#071022';
                ctx.lineWidth = 1.4;
                ctx.beginPath();
                ctx.moveTo(0, -r * 0.40);
                ctx.lineTo(0, r * 0.20);
                ctx.moveTo(-r * 0.34, -r * 0.26);
                ctx.quadraticCurveTo(0, -r * 0.19, r * 0.34, -r * 0.26);
                ctx.stroke();

                ctx.fillStyle = '#091632';
                ctx.strokeStyle = '#060c1c';
                ctx.lineWidth = 1.4;
                ctx.fillRect(-r * 0.54, r * 0.19, r * 1.08, r * 0.11);
                ctx.strokeRect(-r * 0.54, r * 0.19, r * 1.08, r * 0.11);
                ctx.fillStyle = '#ece5d7';
                ctx.fillRect(-r * 0.52, r * 0.215, r * 1.04, 1.1);
                ctx.fillStyle = '#146be6';
                ctx.fillRect(-r * 0.52, r * 0.238, r * 1.04, 1.5);
                ctx.fillStyle = '#ece5d7';
                ctx.fillRect(-r * 0.52, r * 0.265, r * 1.04, 1.1);
            }

            ctx.restore();
        }

        // Tall Stand-Up Tracksuit Zip Collar Hugging Neck (open V reveals black inner tee + O-ring pull)
        ctx.fillStyle = flash ? '#ffffff' : '#102652';
        ctx.strokeStyle = '#070f20';
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.roundRect(-r * 0.30, -r * 0.61, r * 0.60, r * 0.20, [4, 4, 2, 2]);
        ctx.fill();
        ctx.stroke();

        if (!flash && !isBack) {
            // Ribbing / Collar Top Rim Highlight
            ctx.strokeStyle = '#254c91';
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.moveTo(-r * 0.27, -r * 0.585);
            ctx.lineTo(-r * 0.17, -r * 0.585);
            ctx.moveTo(r * 0.17, -r * 0.585);
            ctx.lineTo(r * 0.27, -r * 0.585);
            ctx.stroke();

            // Open V-Notch revealing Matte Black Inner Crewneck T-Shirt
            ctx.fillStyle = '#0c0d11';
            ctx.strokeStyle = '#070f20';
            ctx.lineWidth = 1.3;
            ctx.beginPath();
            ctx.moveTo(-r * 0.19, -r * 0.60);
            ctx.quadraticCurveTo(0, -r * 0.50, r * 0.19, -r * 0.60);
            ctx.lineTo(0, -r * 0.41);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Zipper Slider + Silver Circular O-Ring Pull (exact 50balosCrop.png signature!)
            ctx.fillStyle = '#cfd7e3';
            ctx.strokeStyle = '#181c24';
            ctx.lineWidth = 0.8;
            ctx.fillRect(-1.2, -r * 0.44, 2.4, 2.7);
            ctx.strokeRect(-1.2, -r * 0.44, 2.4, 2.7);

            ctx.strokeStyle = '#181c24';
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.arc(0, -r * 0.34, 2.4, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = '#eef3fa';
            ctx.lineWidth = 1.35;
            ctx.beginPath();
            ctx.arc(0, -r * 0.34, 2.4, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    static drawNeckAndHead(ctx, r, flash, dir, isBack) {
        const skinFill = flash ? '#ffffff' : '#db8f5d';
        const skinStroke = flash ? '#dfe4ea' : '#6c381a';

        // Athletic Tanned Neck with Sternocleidomastoid Muscle Contour
        ctx.fillStyle = skinFill;
        ctx.strokeStyle = skinStroke;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-r * 0.18, -r * 0.72, r * 0.36, r * 0.25, 3);
        ctx.fill();
        ctx.stroke();

        if (!flash && !isBack) {
            ctx.fillStyle = '#b0653c';
            ctx.beginPath();
            ctx.moveTo(-r * 0.15, -r * 0.65);
            ctx.lineTo(0, -r * 0.50);
            ctx.lineTo(r * 0.15, -r * 0.65);
            ctx.quadraticCurveTo(0, -r * 0.59, -r * 0.15, -r * 0.65);
            ctx.fill();

            ctx.strokeStyle = '#974f29';
            ctx.lineWidth = 1.1;
            for (const s of [-1, 1]) {
                ctx.beginPath();
                ctx.moveTo(s * r * 0.13, -r * 0.66);
                ctx.lineTo(s * r * 0.04, -r * 0.51);
                ctx.stroke();
            }
        }

        const headW = r * 0.43;
        const headH = r * 0.56;
        ctx.translate(0, -r * 0.90);

        // Compact, Tightly-Tucked Sculpted Ears (separate subpaths!)
        for (const s of [-1, 1]) {
            ctx.fillStyle = flash ? '#ffffff' : '#d68856';
            ctx.strokeStyle = '#22140c';
            ctx.lineWidth = 1.35;
            ctx.beginPath();
            ctx.ellipse(s * headW * 0.88, headH * 0.05, 2.0, 3.95, s * 0.10, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            if (!flash) {
                ctx.strokeStyle = '#9e5833';
                ctx.lineWidth = 0.85;
                ctx.beginPath();
                ctx.arc(s * headW * 0.86, headH * 0.05, 1.15, s > 0 ? -0.9 : 2.1, s > 0 ? 1.2 : 4.2);
                ctx.stroke();
            }
        }

        // Athletic Tapered Cheekbone & Defined Jawline Path
        const faceGrad = ctx.createLinearGradient(0, -headH * 0.85, 0, headH);
        if (flash) {
            faceGrad.addColorStop(0, '#ffffff');
            faceGrad.addColorStop(1, '#f1f2f6');
        } else {
            faceGrad.addColorStop(0, '#e59d6c');
            faceGrad.addColorStop(0.58, '#db8f5d');
            faceGrad.addColorStop(1, '#be7245');
        }

        ctx.fillStyle = faceGrad;
        ctx.strokeStyle = '#120d0a';
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.moveTo(-headW * 0.88, -headH * 0.16);
        ctx.quadraticCurveTo(-headW * 0.89, -headH * 0.94, 0, -headH * 0.96);
        ctx.quadraticCurveTo(headW * 0.89, -headH * 0.94, headW * 0.88, -headH * 0.16);
        ctx.quadraticCurveTo(headW * 0.88, headH * 0.25, headW * 0.67, headH * 0.56);
        ctx.quadraticCurveTo(headW * 0.36, headH * 0.90, 0, headH * 0.97);
        ctx.quadraticCurveTo(-headW * 0.36, headH * 0.90, -headW * 0.67, headH * 0.56);
        ctx.quadraticCurveTo(-headW * 0.88, headH * 0.25, -headW * 0.88, -headH * 0.16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (isBack) {
            FiftyBalosHero.drawBackHeadAndFade(ctx, headW, headH, flash);
        } else {
            FiftyBalosHero.drawFrontPortraitFeatures(ctx, headW, headH, flash, dir);
        }
    }

    static drawFrontPortraitFeatures(ctx, headW, headH, flash, dir) {
        if (!flash) {
            // Clip Skin Fade & Facial Cel-Shaded Planes Strictly Inside Head Path
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(-headW * 0.87, -headH * 0.16);
            ctx.quadraticCurveTo(-headW * 0.88, -headH * 0.93, 0, -headH * 0.95);
            ctx.quadraticCurveTo(headW * 0.88, -headH * 0.93, headW * 0.87, -headH * 0.16);
            ctx.quadraticCurveTo(headW * 0.87, headH * 0.25, headW * 0.66, headH * 0.55);
            ctx.quadraticCurveTo(headW * 0.35, headH * 0.89, 0, headH * 0.96);
            ctx.quadraticCurveTo(-headW * 0.35, headH * 0.89, -headW * 0.66, headH * 0.55);
            ctx.quadraticCurveTo(-headW * 0.87, headH * 0.25, -headW * 0.87, -headH * 0.16);
            ctx.closePath();
            ctx.clip();

            // 1. High Temple Skin-Taper Fade above ears blending upward into curly crop
            for (const s of [-1, 1]) {
                const templeGrad = ctx.createLinearGradient(0, -headH * 0.04, 0, -headH * 0.66);
                templeGrad.addColorStop(0, 'rgba(219, 143, 93, 0)');
                templeGrad.addColorStop(0.45, 'rgba(130, 80, 48, 0.34)');
                templeGrad.addColorStop(0.82, 'rgba(84, 48, 26, 0.72)');
                templeGrad.addColorStop(1, 'rgba(54, 28, 12, 0.95)');
                ctx.fillStyle = templeGrad;
                ctx.beginPath();
                ctx.moveTo(s * headW * 0.92, -headH * 0.02);
                ctx.lineTo(s * headW * 0.72, -headH * 0.06);
                ctx.lineTo(s * headW * 0.69, -headH * 0.64);
                ctx.lineTo(s * headW * 0.92, -headH * 0.72);
                ctx.closePath();
                ctx.fill();
            }

            // 2. Youthful Warm Sunlit Facial Planes (clean, smooth cheeks matching 50balosCrop.png)
            ctx.fillStyle = 'rgba(246, 185, 138, 0.55)';
            ctx.beginPath();
            ctx.ellipse(0, -headH * 0.39, headW * 0.44, headH * 0.15, 0, 0, Math.PI * 2);
            ctx.fill();

            for (const s of [-1, 1]) {
                ctx.fillStyle = 'rgba(246, 185, 138, 0.44)';
                ctx.beginPath();
                ctx.ellipse(s * headW * 0.40, headH * 0.15, 2.8, 1.8, s * 0.15, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = 'rgba(166, 91, 49, 0.22)';
                ctx.beginPath();
                ctx.moveTo(s * headW * 0.86, headH * 0.16);
                ctx.quadraticCurveTo(s * headW * 0.68, headH * 0.58, s * headW * 0.36, headH * 0.84);
                ctx.lineTo(s * headW * 0.28, headH * 0.72);
                ctx.quadraticCurveTo(s * headW * 0.58, headH * 0.48, s * headW * 0.72, headH * 0.18);
                ctx.closePath();
                ctx.fill();
            }

            ctx.fillStyle = 'rgba(246, 185, 138, 0.45)';
            ctx.beginPath();
            ctx.ellipse(0, headH * 0.77, 2.4, 1.35, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();

            // 3. Relaxed Youthful Straight-Angled Dark Espresso Eyebrows (opening clean brow bone)
            ctx.fillStyle = '#261409';
            for (const s of [-1, 1]) {
                ctx.beginPath();
                ctx.moveTo(s * headW * 0.16, -headH * 0.235);
                ctx.lineTo(s * headW * 0.44, -headH * 0.26);
                ctx.lineTo(s * headW * 0.62, -headH * 0.205);
                ctx.lineTo(s * headW * 0.44, -headH * 0.20);
                ctx.lineTo(s * headW * 0.16, -headH * 0.185);
                ctx.closePath();
                ctx.fill();
            }

            // 4. Warm Relaxed Smiling Almond Eyes (clean under-eye cheeks, zero dark circles!)
            const eyeShift = dir * 0.35;
            for (const s of [-1, 1]) {
                const ex = s * headW * 0.38;
                const ey = -headH * 0.01;

                // Narrow warm almond eye clipped aperture
                ctx.save();
                ctx.beginPath();
                ctx.ellipse(ex, ey, 3.05, 1.30, -s * 0.08, 0, Math.PI * 2);
                ctx.fillStyle = '#f5ebe2';
                ctx.fill();
                ctx.clip();

                // Dark warm espresso iris filling most of aperture height
                ctx.fillStyle = '#25130a';
                ctx.beginPath();
                ctx.arc(ex + eyeShift, ey, 1.38, 0, Math.PI * 2);
                ctx.fill();

                // Tiny crisp iris specular highlight
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(ex + eyeShift - 0.45, ey - 0.25, 0.42, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                // Crisp Upper Eyelid & Lash Curve defining the warm relaxed gaze
                ctx.strokeStyle = '#1b0f09';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(ex - 3.05, ey + (s < 0 ? 0.15 : -0.08));
                ctx.quadraticCurveTo(ex, ey - 1.48, ex + 3.05, ey + (s > 0 ? 0.15 : -0.08));
                ctx.stroke();

                // Subtle soft lower lid edge (warm skin-tan, no eye-bag circle)
                ctx.strokeStyle = 'rgba(165, 92, 54, 0.45)';
                ctx.lineWidth = 0.65;
                ctx.beginPath();
                ctx.moveTo(ex - 2.2, ey + 0.9);
                ctx.quadraticCurveTo(ex, ey + 1.35, ex + 2.2, ey + 0.9);
                ctx.stroke();
            }

            // 5. Sculpted Nose Bridge Highlight, Subtle Tip Shadow & Flanking Nostrils
            ctx.strokeStyle = 'rgba(248, 190, 142, 0.68)';
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.moveTo(0, -headH * 0.05);
            ctx.lineTo(0, headH * 0.15);
            ctx.stroke();

            ctx.strokeStyle = '#a45a35';
            ctx.lineWidth = 1.05;
            ctx.beginPath();
            ctx.moveTo(-1.05, headH * 0.175);
            ctx.quadraticCurveTo(0, headH * 0.225, 1.1, headH * 0.175);
            ctx.stroke();

            ctx.fillStyle = '#924b28';
            for (const s of [-1, 1]) {
                ctx.beginPath();
                ctx.arc(s * 0.85, headH * 0.195, 0.36, 0, Math.PI * 2);
                ctx.fill();
            }

            // 6. Delicate Outer Cheek Smile Dimples, Natural Sleek Lips & Confident Half-Smirk
            ctx.strokeStyle = 'rgba(163, 89, 51, 0.60)';
            ctx.lineWidth = 0.88;
            for (const s of [-1, 1]) {
                ctx.beginPath();
                ctx.moveTo(s * headW * 0.38, headH * 0.35);
                ctx.quadraticCurveTo(s * headW * 0.45, headH * 0.42, s * headW * 0.42, headH * 0.49);
                ctx.stroke();
            }

            // Soft natural skin-blended upper & lower lip tones + gleam
            ctx.fillStyle = '#cf8364';
            ctx.beginPath();
            ctx.ellipse(0.1, headH * 0.445, 2.75, 0.68, -0.04, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#e09574';
            ctx.beginPath();
            ctx.ellipse(0.1, headH * 0.495, 2.30, 0.78, -0.04, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#f2b790';
            ctx.beginPath();
            ctx.ellipse(0.1, headH * 0.495, 1.15, 0.36, -0.04, 0, Math.PI * 2);
            ctx.fill();

            // Clean warm closed-lip smirk line tilted gently higher on +x side
            ctx.strokeStyle = '#6c2e1c';
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.moveTo(-headW * 0.29, headH * 0.445);
            ctx.quadraticCurveTo(0, headH * 0.525, headW * 0.33, headH * 0.41);
            ctx.stroke();

            // Subtle sunlit chin hollow shadow below lower lip
            ctx.strokeStyle = 'rgba(168, 95, 58, 0.50)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(-0.9, headH * 0.635);
            ctx.quadraticCurveTo(0, headH * 0.655, 1.0, headH * 0.635);
            ctx.stroke();
        }

        FiftyBalosHero.drawCurlyCrown(ctx, headW, headH, flash);
    }

    static drawBackHeadAndFade(ctx, headW, headH, flash) {
        if (!flash) {
            // Smooth high skin-taper nape fade blending cleanly into neck skin
            const fadeGrad = ctx.createLinearGradient(0, headH * 0.04, 0, headH * 0.85);
            fadeGrad.addColorStop(0, '#4e2b14');
            fadeGrad.addColorStop(0.52, '#8b5737');
            fadeGrad.addColorStop(1, '#db8f5d');
            ctx.fillStyle = fadeGrad;
            ctx.beginPath();
            ctx.ellipse(0, headH * 0.42, headW * 0.77, headH * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Dense Chestnut Curly Crown Cap across Back Occiput
        ctx.fillStyle = flash ? '#ffffff' : '#3a1f0e';
        ctx.strokeStyle = '#120d0a';
        ctx.lineWidth = 2.1;
        ctx.beginPath();
        ctx.moveTo(-headW * 0.82, -headH * 0.14);
        ctx.quadraticCurveTo(-headW * 0.86, -headH * 1.18, 0, -headH * 1.26);
        ctx.quadraticCurveTo(headW * 0.86, -headH * 1.18, headW * 0.82, -headH * 0.14);
        ctx.quadraticCurveTo(headW * 0.42, headH * 0.22, 0, headH * 0.17);
        ctx.quadraticCurveTo(-headW * 0.42, headH * 0.22, -headW * 0.82, -headH * 0.14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            const backCurls = [
                [-headW * 0.36, -headH * 0.84, 2.4, '#6d3e1e'],
                [headW * 0.02, -headH * 0.96, 2.7, '#7a4622'],
                [headW * 0.38, -headH * 0.82, 2.3, '#6d3e1e'],
                [-headW * 0.24, -headH * 0.56, 2.2, '#62361a'],
                [headW * 0.24, -headH * 0.54, 2.2, '#62361a'],
                [0, -headH * 0.34, 2.1, '#582f16']
            ];
            ctx.lineWidth = 1.4;
            for (const [cx, cy, cr, col] of backCurls) {
                ctx.strokeStyle = col;
                ctx.beginPath();
                ctx.arc(cx, cy, cr, 0.25, Math.PI * 1.35);
                ctx.stroke();
            }
        }
    }

    static drawCurlyCrown(ctx, headW, headH, flash) {
        // Medium-Short Textured Chestnut Curly Crop matching 50balosCrop.png (boxy compact crown)
        const hairGrad = ctx.createLinearGradient(0, -headH * 1.18, 0, -headH * 0.54);
        if (flash) {
            hairGrad.addColorStop(0, '#ffffff');
            hairGrad.addColorStop(1, '#ffffff');
        } else {
            hairGrad.addColorStop(0, '#6c3e1c');
            hairGrad.addColorStop(0.5, '#4b2911');
            hairGrad.addColorStop(1, '#281408');
        }

        ctx.fillStyle = hairGrad;
        ctx.strokeStyle = '#120d0a';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(-headW * 0.72, -headH * 0.58);
        ctx.lineTo(-headW * 0.75, -headH * 0.80);
        ctx.quadraticCurveTo(-headW * 0.80, -headH * 0.98, -headW * 0.56, -headH * 1.09);
        ctx.quadraticCurveTo(-headW * 0.34, -headH * 1.19, -headW * 0.10, -headH * 1.16);
        ctx.quadraticCurveTo(headW * 0.06, -headH * 1.21, headW * 0.24, -headH * 1.16);
        ctx.quadraticCurveTo(headW * 0.50, -headH * 1.17, headW * 0.62, -headH * 1.07);
        ctx.quadraticCurveTo(headW * 0.79, -headH * 0.96, headW * 0.75, -headH * 0.78);
        ctx.lineTo(headW * 0.72, -headH * 0.58);
        // Clean textured forehead hairline (leaving tall athletic forehead exposed!)
        ctx.quadraticCurveTo(headW * 0.48, -headH * 0.63, headW * 0.28, -headH * 0.59);
        ctx.quadraticCurveTo(headW * 0.08, -headH * 0.64, -headW * 0.08, -headH * 0.60);
        ctx.quadraticCurveTo(-headW * 0.28, -headH * 0.65, -headW * 0.48, -headH * 0.59);
        ctx.quadraticCurveTo(-headW * 0.61, -headH * 0.62, -headW * 0.72, -headH * 0.58);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            const curls = [
                [-headW * 0.40, -headH * 0.90, 2.0, 0.3, 2.5, '#241106'],
                [-headW * 0.12, -headH * 0.99, 2.2, 0.2, 2.4, '#241106'],
                [headW * 0.18, -headH * 0.97, 2.1, 0.3, 2.5, '#241106'],
                [headW * 0.44, -headH * 0.87, 1.9, 0.4, 2.6, '#241106'],
                [-headW * 0.36, -headH * 0.94, 1.9, 3.3, 5.7, '#8f5728'],
                [-headW * 0.06, -headH * 1.04, 2.1, 3.2, 5.8, '#9b602e'],
                [headW * 0.24, -headH * 1.02, 2.0, 3.2, 5.8, '#8f5728'],
                [headW * 0.46, -headH * 0.90, 1.7, 3.3, 5.7, '#824d21'],
                [-headW * 0.24, -headH * 0.76, 1.8, 0.2, 2.3, '#7b481f'],
                [headW * 0.02, -headH * 0.80, 2.0, 0.3, 2.5, '#895224'],
                [headW * 0.28, -headH * 0.75, 1.8, 0.2, 2.4, '#7b481f']
            ];
            ctx.lineWidth = 1.15;
            for (const [cx, cy, cr, a0, a1, col] of curls) {
                ctx.strokeStyle = col;
                ctx.beginPath();
                ctx.arc(cx, cy, cr, a0, a1);
                ctx.stroke();
            }
        }
    }

    /* ====================================================================
       3. BLOUSED TRACKSUIT SLEEVES, TANNED HANDS & CASH CANNON 50
       ==================================================================== */
    static drawCustomArmsAndWeapon(ctx, r, flash, recoil, bladeTimer, player, weaponType) {
        // Anchored at actual torso chest/shoulder height (keeps chin, O-ring collar & face clear!)
        // 1. Far/Support Sleeve & Hand visibly cradling the underside of the Money Gun barrel
        FiftyBalosHero.drawTracksuitSleeve(ctx, -2, 0.5, 8.5, 9.5, 20.5, 6.2, 17.6, 6.9, -0.18, 5.6, flash, true);

        // 2. Equipped Weapon (Cash Cannon 50 default, or clean fallback if ever swapped)
        if (weaponType === 'money_gun' || !weaponType) {
            FiftyBalosHero.drawWeapon(ctx, flash, recoil);
        } else if ((weaponType === 'carbine' || weaponType === 'dialtone' || weaponType === 'zeus_thunderbolt') && typeof WeaponSystem !== 'undefined') {
            WeaponSystem.drawEquippedModel(ctx, weaponType, flash, recoil, player);
        } else if (typeof HeroSkinRenderer !== 'undefined' && HeroSkinRenderer.drawMoneyGun) {
            HeroSkinRenderer.drawMoneyGun(ctx, flash, recoil);
        }

        // 3. Near/Trigger Sleeve & Hand gripping trigger handle
        FiftyBalosHero.drawTracksuitSleeve(ctx, -3, 10.5, 4.5, 4.8, 13.0, -0.3, 10.2, 0.9, -0.30, 6.0, flash, false);
    }

    static drawTracksuitSleeve(ctx, ox, oy, cpx, cpy, endX, endY, cuffX, cuffY, cuffAng, width, flash, isSupport) {
        ctx.save();
        ctx.translate(ox, oy);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Crisp dark outline around bloused nylon sleeve
        ctx.strokeStyle = '#070f20';
        ctx.lineWidth = width + 2.2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(cpx, cpy, endX, endY);
        ctx.stroke();

        // Main Midnight Navy Sleeve Body
        ctx.strokeStyle = flash ? '#ffffff' : '#0f244d';
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(cpx, cpy, endX, endY);
        ctx.stroke();

        if (!flash) {
            // Subtle Navy Under-Fold Shading
            ctx.strokeStyle = '#08152e';
            ctx.lineWidth = width * 0.38;
            ctx.beginPath();
            ctx.moveTo(0, 1.1);
            ctx.quadraticCurveTo(cpx, cpy + 1.1, endX, endY + 1.1);
            ctx.stroke();

            // Signature Cobalt Blue Outer Ridge + Bold Cream Racing Stripe (50balos.png)
            ctx.strokeStyle = '#1162df';
            ctx.lineWidth = width * 0.44;
            ctx.beginPath();
            ctx.moveTo(0, -1.35);
            ctx.quadraticCurveTo(cpx, cpy - 1.35, endX, endY - 1.35);
            ctx.stroke();

            ctx.strokeStyle = '#ece5d7';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(0, -0.35);
            ctx.quadraticCurveTo(cpx, cpy - 0.35, endX, endY - 0.35);
            ctx.stroke();

            // Striped Ribbed Wrist Cuff (Navy base + Cream / Cobalt / Cream)
            ctx.save();
            ctx.translate(cuffX, cuffY);
            ctx.rotate(cuffAng);
            ctx.fillStyle = '#091632';
            ctx.strokeStyle = '#060c1c';
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.roundRect(-2.0, -3.2, 4.0, 6.4, 1.0);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ece5d7';
            ctx.fillRect(-1.3, -2.7, 0.75, 5.4);
            ctx.fillStyle = '#146be6';
            ctx.fillRect(-0.3, -2.7, 0.95, 5.4);
            ctx.fillStyle = '#ece5d7';
            ctx.fillRect(0.9, -2.7, 0.75, 5.4);
            ctx.restore();
        }

        // Detailed Tanned Hand with Knuckle & Thumb Definition
        const hx = endX + 0.6;
        const hy = endY - (isSupport ? 0.2 : 0.6);
        ctx.fillStyle = flash ? '#ffffff' : '#db8f5d';
        ctx.strokeStyle = '#120d0a';
        ctx.lineWidth = 1.55;
        ctx.beginPath();
        ctx.ellipse(hx, hy, isSupport ? 3.9 : 4.2, isSupport ? 3.8 : 4.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#f0af80';
            ctx.beginPath();
            ctx.ellipse(hx - 0.4, hy - 1.0, 1.8, 1.1, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * 50balos Signature Weapon: Crimson & 24K Gold Cash Cannon 50 (MoneyGun.png)
     */
    static drawWeapon(ctx, flash, recoil) {
        ctx.save();
        ctx.translate(11.5 - recoil * 0.45, 2.3);
        ctx.scale(0.86, 0.86);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // 1. Crimson Contoured Grip, Gold Pommel & Gold Trigger Guard
        ctx.fillStyle = flash ? '#ffffff' : '#9c141a';
        ctx.strokeStyle = '#120f12';
        ctx.lineWidth = 1.9;
        ctx.beginPath();
        ctx.roundRect(-2, 4.8, 6.5, 10.2, 2);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#f9ca24';
            ctx.fillRect(-2.5, 13.0, 7.5, 2.5);
            ctx.strokeRect(-2.5, 13.0, 7.5, 2.5);

            ctx.strokeStyle = '#f9ca24';
            ctx.lineWidth = 1.65;
            ctx.beginPath();
            ctx.moveTo(4.5, 5.8);
            ctx.lineTo(9.4, 5.8);
            ctx.lineTo(9.4, 10.6);
            ctx.lineTo(4.5, 10.6);
            ctx.stroke();
        }

        // 2. Top Acrylic Cash Hopper loaded with 50€ Notes & White "€" Currency Strap
        if (!flash) {
            ctx.fillStyle = '#e67e22';
            ctx.strokeStyle = '#120f12';
            ctx.lineWidth = 1.15;
            ctx.fillRect(-0.5, -10.2, 13.8, 4.0);
            ctx.strokeRect(-0.5, -10.2, 13.8, 4.0);

            // White € Currency Band wrapping stacked notes (MoneyGun.png!)
            ctx.fillStyle = '#f7f1e3';
            ctx.fillRect(4.8, -10.2, 3.2, 4.0);
            ctx.fillStyle = '#b35c00';
            ctx.font = 'bold 3.2px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('€', 6.4, -8.1);

            ctx.fillStyle = 'rgba(215, 240, 255, 0.36)';
            ctx.strokeStyle = '#e6ad00';
            ctx.lineWidth = 1.25;
            ctx.beginPath();
            ctx.roundRect(-2.2, -11.4, 16.8, 5.4, [2.5, 2, 0, 0]);
            ctx.fill();
            ctx.stroke();
        }

        // 3. Chamfered Crimson Receiver Body & 24K Gold Muzzle Shroud
        const gunGrad = ctx.createLinearGradient(0, -6.5, 0, 6.5);
        if (flash) {
            gunGrad.addColorStop(0, '#ffffff');
            gunGrad.addColorStop(1, '#f1f2f6');
        } else {
            gunGrad.addColorStop(0, '#eb3538');
            gunGrad.addColorStop(0.55, '#c21a22');
            gunGrad.addColorStop(1, '#7e0c13');
        }
        ctx.fillStyle = gunGrad;
        ctx.strokeStyle = '#120f12';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.roundRect(-4.6, -6.5, 25.2, 13, [3.5, 4.5, 4.5, 3.5]);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            const goldGrad = ctx.createLinearGradient(14.5, -7.2, 21.5, 7.2);
            goldGrad.addColorStop(0, '#fff29c');
            goldGrad.addColorStop(0.5, '#f9ca24');
            goldGrad.addColorStop(1, '#cc8c00');
            ctx.fillStyle = goldGrad;
            ctx.strokeStyle = '#120f12';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.roundRect(14.5, -7.1, 6.6, 14.0, [2, 3.5, 3.5, 2]);
            ctx.fill();
            ctx.stroke();

            // Rear gold trim strip & rear sight fin
            ctx.fillStyle = '#f9ca24';
            ctx.fillRect(-3.2, 4.5, 17.5, 1.75);
            ctx.fillRect(14.0, -8.5, 3.2, 1.8);

            // Un-mirrored "50€" Emblem centered cleanly on crimson body + small subtle rear "€"
            const m = ctx.getTransform();
            const mirrored = (m.a * m.d - m.b * m.c) < 0;

            ctx.save();
            ctx.translate(-2.2, 2.2);
            if (mirrored) ctx.scale(-1, 1);
            ctx.fillStyle = 'rgba(249, 202, 36, 0.85)';
            ctx.font = 'bold 3.1px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('€', 0, 0);
            ctx.restore();

            ctx.save();
            ctx.translate(6.6, -0.3);
            if (mirrored) ctx.scale(-1, 1);
            ctx.fillStyle = '#ffe47a';
            ctx.font = '900 5.5px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('50€', 0, 0);
            ctx.restore();

            // Ejecting 50€ Banknote & Golden Muzzle Spark Burst on Fire
            const ejectX = 21.6 + recoil * 1.25;
            ctx.save();
            ctx.translate(ejectX, -0.8);
            ctx.rotate(0.08);
            ctx.fillStyle = '#f39c12';
            ctx.strokeStyle = '#120f12';
            ctx.lineWidth = 1.1;
            ctx.fillRect(0, -2.7, 9.2, 5.4);
            ctx.strokeRect(0, -2.7, 9.2, 5.4);
            ctx.fillStyle = '#ffeaa7';
            ctx.fillRect(2.6, -2.1, 4.0, 4.2);

            ctx.save();
            ctx.translate(4.6, 0);
            if (mirrored) ctx.scale(-1, 1);
            ctx.fillStyle = '#1e272e';
            ctx.font = 'bold 3.8px Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('50', 0, 0.2);
            ctx.restore();
            ctx.restore();

            if (recoil > 0.8) {
                ctx.fillStyle = 'rgba(249, 202, 36, 0.72)';
                ctx.beginPath();
                ctx.arc(22.2, -0.8, 4.4 + recoil * 0.7, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.FiftyBalosHero = FiftyBalosHero;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FiftyBalosHero };
}
