/**
 * Lesa.io - Wave 25 Mini-Boss 2.5D Vector Renderer: ButcherGoliath ("Makis the Butcher")
 * Burly taverna master butcher in a grease-spotted leather apron, linked sausage
 * bandolier, "MAKIS" chest tag, walrus mustache, paper butcher garrison cap,
 * off-hand cross-cut meat tenderizer mallet, and a colossal beveled Goliath cleaver.
 */

class ButcherGoliathRenderer {
    static draw(ctx, b) {
        const r = b.radius || 42;
        const flash = b.hitFlash > 0;
        const age = b.age || 0;
        const aimAngle = b.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const chopWindup = (b.chopCooldown || 999) <= 24 || (b.cleaverCooldown || 999) <= 16;
        const bob = Math.sin(b.walkCycle || age * 0.13) * 3;

        EndlessBossRenderer.drawTelegraphs(ctx, b.telegraphs);

        ctx.save();
        EndlessBossRenderer.drawShadow(ctx, b.x, b.y, r, b.isEnraged, b.isApex);

        if (!flash && (b.isEnraged || chopWindup)) {
            ButcherGoliathRenderer.drawButcherAura(ctx, b.x, b.y + r * 0.72, r, age, b.isEnraged, chopWindup);
        }

        ctx.translate(b.x, b.y + bob);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#141418';

        // Character Body Layer
        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);

        EndlessBossRenderer.drawLegs(ctx, r, b.walkCycle || age * 0.13, '#2d3436', '#4a2511', flash);
        ButcherGoliathRenderer.drawOffHandMallet(ctx, r, age, b.isEnraged, chopWindup, flash);
        ButcherGoliathRenderer.drawButcherApronTorso(ctx, r, facingLeft, isBack, b.isEnraged, flash);
        ButcherGoliathRenderer.drawButcherHead(ctx, r, age, isBack, b.isEnraged, flash);
        ctx.restore();

        // Aimed Colossus Butcher Cleaver anchored on aiming shoulder
        const anchorX = facingLeft ? -r * 0.30 : r * 0.30;
        EndlessBossRenderer.drawAimedLayer(ctx, aimAngle, anchorX, r * 0.04, () => {
            ButcherGoliathRenderer.drawColossusCleaver(ctx, r, age, b.isEnraged, chopWindup, flash);
        });

        EndlessBossRenderer.endBody(ctx, b);
    }

    static drawButcherAura(ctx, x, y, r, age, isEnraged, chopWindup) {
        ctx.save();
        ctx.translate(x, y);
        const pulse = 0.65 + Math.sin(age * 0.28) * 0.25;
        ctx.strokeStyle = chopWindup
            ? 'rgba(255, 71, 87, 0.92)'
            : `rgba(230, 126, 34, ${pulse})`;
        ctx.lineWidth = chopWindup ? 4 : 3.2;
        ctx.setLineDash([12, 8]);
        ctx.lineDashOffset = -age * 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.24, r * 0.46, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        if (isEnraged) {
            for (let i = 0; i < 4; i++) {
                const a = age * 0.11 + (i * Math.PI * 0.5);
                const sx = Math.cos(a) * (r * 1.24);
                const sy = Math.sin(a) * (r * 0.46);
                ctx.fillStyle = i % 2 === 0 ? '#e67e22' : '#ff4757';
                ctx.beginPath();
                ctx.arc(sx, sy, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    static drawOffHandMallet(ctx, r, age, isEnraged, chopWindup, flash) {
        const swing = Math.sin(age * 0.20) * 0.14 - (chopWindup ? 0.24 : 0);

        // Hanging Iron Meat Hook on rear belt side
        if (!flash) {
            ctx.save();
            ctx.translate(-r * 0.56, r * 0.30);
            ctx.rotate(Math.sin(age * 0.15) * 0.12);
            ctx.strokeStyle = '#7f8c8d';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-r * 0.04, r * 0.22);
            ctx.arc(-r * 0.10, r * 0.24, r * 0.08, 0, Math.PI * 1.15);
            ctx.stroke();
            ctx.restore();
        }

        // Off-hand Muscular Arm + Waffle Meat Tenderizer Mallet
        ctx.save();
        ctx.translate(-r * 0.72, -r * 0.06);
        ctx.rotate(-0.34 + swing);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#141418';

        // Thick Butcher Forearm + Leather Wrist Guard
        ctx.fillStyle = flash ? '#ffffff' : '#df9b72';
        ctx.beginPath();
        ctx.roundRect(-r * 0.14, -r * 0.10, r * 0.28, r * 0.42, 7);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#5a3118';
        ctx.beginPath();
        ctx.roundRect(-r * 0.15, r * 0.18, r * 0.30, r * 0.20, 5);
        ctx.fill();
        ctx.stroke();

        // Wooden Mallet Shaft & Spiked Steel Tenderizer Head
        ctx.fillStyle = flash ? '#ffffff' : '#8d5524';
        ctx.beginPath();
        ctx.roundRect(-r * 0.06, -r * 0.46, r * 0.12, r * 0.86, 3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#b2bec3';
        ctx.beginPath();
        ctx.roundRect(-r * 0.24, -r * 0.58, r * 0.48, r * 0.26, 5);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#dfe6e9';
            ctx.fillRect(-r * 0.20, -r * 0.54, r * 0.40, r * 0.08);
            ctx.fillStyle = isEnraged ? '#ff4757' : '#c0392b';
            ctx.fillRect(-r * 0.18, -r * 0.36, r * 0.36, r * 0.05);
        }
        ctx.restore();
    }

    static drawButcherApronTorso(ctx, r, facingLeft, isBack, isEnraged, flash) {
        // Broad Burly Maroon Shirt Torso + Rolled Shoulder Sleeves
        ctx.fillStyle = flash ? '#ffffff' : '#6d214f';
        ctx.beginPath();
        ctx.roundRect(-r * 0.72, -r * 0.48, r * 1.44, r * 0.96, [18, 18, 11, 11]);
        ctx.fill();
        ctx.stroke();

        // Stitched Leather Butcher Pauldrons
        for (const px of [-r * 0.66, r * 0.66]) {
            ctx.fillStyle = flash ? '#ffffff' : '#5a3118';
            ctx.beginPath();
            ctx.roundRect(px - r * 0.18, -r * 0.48, r * 0.36, r * 0.30, 8);
            ctx.fill();
            ctx.stroke();
            if (!flash) {
                ctx.fillStyle = '#fed330';
                ctx.beginPath();
                ctx.arc(px - r * 0.07, -r * 0.34, 2.6, 0, Math.PI * 2);
                ctx.arc(px + r * 0.07, -r * 0.34, 2.6, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (isBack) {
            if (!flash) {
                // Back crossed heavy apron leather harness + brass ring
                ctx.strokeStyle = '#5a3118';
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.moveTo(-r * 0.42, -r * 0.44);
                ctx.lineTo(r * 0.42, r * 0.16);
                ctx.moveTo(r * 0.42, -r * 0.44);
                ctx.lineTo(-r * 0.42, r * 0.16);
                ctx.stroke();

                ctx.strokeStyle = '#141418';
                ctx.lineWidth = 2.6;
                ctx.fillStyle = '#fed330';
                ctx.beginPath();
                ctx.arc(0, -r * 0.14, r * 0.10, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        } else {
            // Waxed Ivory Leather Butcher Apron
            ctx.fillStyle = flash ? '#ffffff' : '#f5f6fa';
            ctx.beginPath();
            ctx.roundRect(-r * 0.56, -r * 0.44, r * 1.12, r * 0.90, [10, 10, 8, 8]);
            ctx.fill();
            ctx.stroke();

            if (!flash) {
                // Apron Straps + Brass Rivets
                ctx.fillStyle = '#8d5524';
                ctx.fillRect(-r * 0.44, -r * 0.44, r * 0.14, r * 0.24);
                ctx.fillRect(r * 0.30, -r * 0.44, r * 0.14, r * 0.24);

                // Linked Loukaniko Sausage Bandolier across upper chest
                for (let i = 0; i < 4; i++) {
                    const lx = -r * 0.33 + i * r * 0.22;
                    const ly = -r * 0.30 + i * r * 0.065;
                    ctx.save();
                    ctx.translate(lx, ly);
                    ctx.rotate(0.28);
                    ctx.fillStyle = '#9e3a20';
                    ctx.beginPath();
                    ctx.ellipse(0, 0, r * 0.115, r * 0.06, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                }

                // Artistic Crimson Butcher Block Stains
                ctx.fillStyle = 'rgba(192, 57, 43, 0.85)';
                ctx.beginPath();
                ctx.ellipse(-r * 0.30, r * 0.08, r * 0.14, r * 0.09, -0.3, 0, Math.PI * 2);
                ctx.ellipse(r * 0.28, r * 0.26, r * 0.12, r * 0.08, 0.4, 0, Math.PI * 2);
                ctx.fill();

                // Framed Leather Chest Badge "MAKIS"
                ctx.fillStyle = isEnraged ? '#ff6b6b' : '#fed330';
                ctx.lineWidth = 2.2;
                ctx.fillRect(-r * 0.28, -r * 0.04, r * 0.56, r * 0.19);
                ctx.strokeRect(-r * 0.28, -r * 0.04, r * 0.56, r * 0.19);
                EndlessBossRenderer.drawUnmirroredText(
                    ctx, facingLeft, 'MAKIS', 0, r * 0.055,
                    '900 8px "Fredoka", Arial, sans-serif', '#141418', null, r * 0.50
                );
            }
        }

        if (!flash) {
            // Heavy Leather Waist Belt + Steel Buckle + Tucked Honing Rod
            ctx.lineWidth = 2.6;
            ctx.strokeStyle = '#141418';
            ctx.fillStyle = '#3d2415';
            ctx.fillRect(-r * 0.66, r * 0.20, r * 1.32, r * 0.15);
            ctx.strokeRect(-r * 0.66, r * 0.20, r * 1.32, r * 0.15);

            ctx.fillStyle = '#b2bec3';
            ctx.beginPath();
            ctx.roundRect(-r * 0.14, r * 0.17, r * 0.28, r * 0.21, 4);
            ctx.fill();
            ctx.stroke();

            // Honing Rod & Spare Cleaver Handle tucked at hip
            if (!isBack) {
                ctx.fillStyle = '#dfe6e9';
                ctx.fillRect(r * 0.34, r * 0.04, r * 0.08, r * 0.34);
                ctx.strokeRect(r * 0.34, r * 0.04, r * 0.08, r * 0.34);
                ctx.fillStyle = '#c0392b';
                ctx.fillRect(r * 0.32, r * 0.02, r * 0.12, r * 0.10);
                ctx.strokeRect(r * 0.32, r * 0.02, r * 0.12, r * 0.10);
            }
        }
    }

    static drawButcherHead(ctx, r, age, isBack, isEnraged, flash) {
        ctx.save();
        ctx.translate(0, -r * 0.72);

        // Thick Ears
        ctx.fillStyle = flash ? '#ffffff' : '#df9b72';
        for (const ex of [-r * 0.42, r * 0.42]) {
            ctx.beginPath();
            ctx.arc(ex, 0, r * 0.11, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // Square Jaw Head
        ctx.fillStyle = flash ? '#ffffff' : '#eeaa7b';
        ctx.beginPath();
        ctx.roundRect(-r * 0.41, -r * 0.38, r * 0.82, r * 0.74, 16);
        ctx.fill();
        ctx.stroke();

        // Hair (full back fade if facing north)
        ctx.fillStyle = flash ? '#ffffff' : '#2c1e16';
        ctx.beginPath();
        if (isBack) {
            ctx.arc(0, -r * 0.02, r * 0.40, 0, Math.PI * 2);
        } else {
            ctx.arc(0, -r * 0.16, r * 0.40, Math.PI * 0.94, Math.PI * 2.06);
        }
        ctx.fill();
        ctx.stroke();

        if (!flash && !isBack) {
            // 5-o'clock jaw stubble
            ctx.fillStyle = 'rgba(44, 30, 22, 0.22)';
            ctx.beginPath();
            ctx.arc(0, r * 0.06, r * 0.36, 0.18, Math.PI - 0.18);
            ctx.fill();

            // Diagonal Butcher Eye Scar
            ctx.strokeStyle = '#b33939';
            ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.moveTo(-r * 0.24, -r * 0.18);
            ctx.lineTo(-r * 0.06, r * 0.04);
            ctx.stroke();

            // Glowing Fierce Eyes + Heavy Furrowed Brows
            for (const ex of [-r * 0.13, r * 0.15]) {
                ctx.fillStyle = isEnraged ? '#ff4757' : '#ffffff';
                ctx.strokeStyle = '#141418';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(ex, -r * 0.05, r * 0.075, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = isEnraged ? '#fed330' : '#141418';
                ctx.beginPath();
                ctx.arc(ex + r * 0.015, -r * 0.05, r * 0.036, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.strokeStyle = '#2c1e16';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-r * 0.26, -r * 0.18);
            ctx.lineTo(-r * 0.04, -r * 0.11);
            ctx.moveTo(r * 0.28, -r * 0.18);
            ctx.lineTo(r * 0.06, -r * 0.11);
            ctx.stroke();

            // Thick Greek Walrus Mustache + Snarl Gold Tooth
            ctx.fillStyle = '#3b2516';
            ctx.strokeStyle = '#141418';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(r * 0.02, r * 0.08);
            ctx.quadraticCurveTo(-r * 0.18, r * 0.04, -r * 0.30, r * 0.20);
            ctx.quadraticCurveTo(-r * 0.10, r * 0.24, r * 0.02, r * 0.16);
            ctx.quadraticCurveTo(r * 0.16, r * 0.24, r * 0.33, r * 0.19);
            ctx.quadraticCurveTo(r * 0.20, r * 0.04, r * 0.02, r * 0.08);
            ctx.fill();
            ctx.stroke();

            // Gold Snaggletooth grin under mustache when enraged
            if (isEnraged || Math.sin(age * 0.2) > 0.3) {
                ctx.fillStyle = '#fed330';
                ctx.fillRect(r * 0.08, r * 0.21, r * 0.07, r * 0.07);
                ctx.strokeRect(r * 0.08, r * 0.21, r * 0.07, r * 0.07);
            }
        }

        // Jaunty Striped White Paper Butcher Garrison Cap
        ctx.save();
        ctx.rotate(-0.08);
        ctx.strokeStyle = '#141418';
        ctx.lineWidth = 2.8;
        ctx.fillStyle = flash ? '#ffffff' : '#f5f6fa';
        ctx.beginPath();
        ctx.moveTo(-r * 0.42, -r * 0.22);
        ctx.lineTo(-r * 0.32, -r * 0.56);
        ctx.lineTo(r * 0.34, -r * 0.54);
        ctx.lineTo(r * 0.44, -r * 0.22);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#c0392b';
            ctx.fillRect(-r * 0.40, -r * 0.32, r * 0.80, r * 0.10);
            ctx.strokeRect(-r * 0.40, -r * 0.32, r * 0.80, r * 0.10);

            if (!isBack) {
                ctx.fillStyle = '#fed330';
                ctx.beginPath();
                ctx.arc(r * 0.02, -r * 0.27, r * 0.085, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }
        ctx.restore();
        ctx.restore();
    }

    static drawColossusCleaver(ctx, r, age, isEnraged, chopWindup, flash) {
        const pull = chopWindup ? -0.34 : Math.sin(age * 0.22) * 0.14;
        ctx.rotate(pull);
        ctx.lineWidth = 2.8;
        ctx.strokeStyle = '#141418';

        // Heavy Armed Butcher Shoulder/Forearm Guard
        ctx.fillStyle = flash ? '#ffffff' : '#df9b72';
        ctx.beginPath();
        ctx.roundRect(-r * 0.06, -r * 0.14, r * 0.34, r * 0.28, 7);
        ctx.fill();
        ctx.stroke();

        // Hardwood Grip + Brass Bolster Guard
        ctx.fillStyle = flash ? '#ffffff' : '#8d5524';
        ctx.beginPath();
        ctx.roundRect(r * 0.08, -r * 0.11, r * 0.46, r * 0.22, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#fed330';
        ctx.beginPath();
        ctx.roundRect(r * 0.46, -r * 0.24, r * 0.12, r * 0.48, 3);
        ctx.fill();
        ctx.stroke();

        // Enormous Beveled Goliath Cleaver Blade
        ctx.fillStyle = flash ? '#ffffff' : '#b2bec3';
        ctx.beginPath();
        ctx.moveTo(r * 0.56, -r * 0.44);
        ctx.lineTo(r * 1.44, -r * 0.52);
        ctx.quadraticCurveTo(r * 1.56, 0, r * 1.40, r * 0.42);
        ctx.lineTo(r * 0.56, r * 0.34);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            // Gleaming Razor Edge Highlight + Hanging Eye-Hole + Blood Stain
            ctx.fillStyle = (isEnraged || chopWindup) ? '#ffeaa7' : '#ffffff';
            ctx.beginPath();
            ctx.moveTo(r * 0.62, r * 0.22);
            ctx.lineTo(r * 1.38, r * 0.28);
            ctx.lineTo(r * 1.36, r * 0.39);
            ctx.lineTo(r * 0.60, r * 0.31);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#c0392b';
            ctx.beginPath();
            ctx.ellipse(r * 1.12, -r * 0.04, r * 0.19, r * 0.11, -0.25, 0, Math.PI * 2);
            ctx.fill();

            // Classic Butcher Hang Hole in blade corner
            ctx.fillStyle = '#2d3436';
            ctx.beginPath();
            ctx.arc(r * 1.30, -r * 0.34, r * 0.085, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            if (chopWindup || isEnraged) {
                ctx.strokeStyle = 'rgba(255, 71, 87, 0.9)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(r * 1.10, 0, r * 0.56, -0.5, 0.7);
                ctx.stroke();
            }
        }

        // Heavy Studded Glove Gripping Handle
        ctx.strokeStyle = '#141418';
        ctx.lineWidth = 2.8;
        ctx.fillStyle = flash ? '#ffffff' : '#5a3118';
        ctx.beginPath();
        ctx.arc(r * 0.26, 0, r * 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}

if (typeof window !== 'undefined') {
    window.ButcherGoliathRenderer = ButcherGoliathRenderer;
}
