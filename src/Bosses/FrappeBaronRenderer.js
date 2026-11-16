/**
 * Lesa.io - Wave 10 Main Boss 2.5D Vector Renderer: FrappeBaron ("Frappe Baron")
 * Stylish Greek summer coffee mogul wearing a coastal turquoise suit, frosted ice
 * pauldrons, gold-rimmed aviator shades, towering Frappe-Cup crown with bendy straw,
 * cocktail shaker off-hand, and pressurized "Frappomixer" foam cannon.
 */

class FrappeBaronRenderer {
    static draw(ctx, b) {
        const r = b.radius || 44;
        const flash = b.hitFlash > 0;
        const age = b.age || 0;
        const aimAngle = b.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const bob = Math.sin(b.walkCycle || age * 0.12) * 3;

        EndlessBossRenderer.drawTelegraphs(ctx, b.telegraphs);

        ctx.save();
        EndlessBossRenderer.drawShadow(ctx, b.x, b.y, r, b.isEnraged, b.isApex);

        if (!flash && b.isEnraged) {
            FrappeBaronRenderer.drawCryoAura(ctx, b.x, b.y, r, age);
        }

        ctx.translate(b.x, b.y + bob);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#141418';

        // Character Body Layer
        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);

        EndlessBossRenderer.drawLegs(ctx, r, b.walkCycle || age * 0.12, '#0984e3', '#f5f6fa', flash);
        FrappeBaronRenderer.drawCapeAndShaker(ctx, r, age, flash);
        FrappeBaronRenderer.drawSuitTorso(ctx, r, isBack, flash);
        FrappeBaronRenderer.drawHeadAndFrappeCrown(ctx, r, isBack, b.isEnraged, flash);
        ctx.restore();

        // Aimed Frappomixer Cannon from aiming shoulder so suit tie & aviators stay crisp
        const anchorX = facingLeft ? -r * 0.30 : r * 0.30;
        EndlessBossRenderer.drawAimedLayer(ctx, aimAngle, anchorX, r * 0.04, () => {
            FrappeBaronRenderer.drawFrappomixerCannon(ctx, r, age, b.isEnraged, flash);
        });

        EndlessBossRenderer.endBody(ctx, b);
    }

    static drawCryoAura(ctx, x, y, r, age) {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = 'rgba(0, 245, 255, 0.58)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, r + 14 + Math.sin(age * 0.2) * 3, 0, Math.PI * 2);
        ctx.stroke();

        for (let i = 0; i < 4; i++) {
            const oa = age * 0.09 + (i * Math.PI * 0.5);
            const sx = Math.cos(oa) * (r + 17);
            const sy = Math.sin(oa) * (r + 17) * 0.70;
            ctx.fillStyle = '#81ecec';
            ctx.strokeStyle = '#00a8ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(sx, sy - 7);
            ctx.lineTo(sx + 5, sy);
            ctx.lineTo(sx, sy + 7);
            ctx.lineTo(sx - 5, sy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }

    static drawCapeAndShaker(ctx, r, age, flash) {
        // Flowing Espresso-Dark Velvet Coat Tails
        ctx.fillStyle = flash ? '#ffffff' : '#1b263b';
        ctx.beginPath();
        ctx.moveTo(-r * 0.44, -r * 0.36);
        ctx.lineTo(-r * 0.94, r * 0.44 + Math.sin(age * 0.16) * 4);
        ctx.lineTo(-r * 0.20, r * 0.62);
        ctx.lineTo(r * 0.42, r * 0.40);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Off-Hand Silver Frappe Cocktail Shaker
        ctx.save();
        const shakeY = Math.sin(age * 0.38) * 3.5;
        ctx.translate(-r * 0.74, -r * 0.06 + shakeY);
        ctx.rotate(-0.22 + Math.sin(age * 0.30) * 0.18);

        ctx.fillStyle = flash ? '#ffffff' : '#ffffff';
        ctx.beginPath();
        ctx.arc(0, r * 0.15, r * 0.13, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#dfe6e9';
        ctx.beginPath();
        ctx.moveTo(-r * 0.13, -r * 0.19);
        ctx.lineTo(r * 0.13, -r * 0.19);
        ctx.lineTo(r * 0.09, r * 0.12);
        ctx.lineTo(-r * 0.09, r * 0.12);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#00f5ff';
            ctx.fillRect(-r * 0.08, -r * 0.24, r * 0.16, r * 0.06);
            ctx.strokeRect(-r * 0.08, -r * 0.24, r * 0.16, r * 0.06);
        }
        ctx.restore();
    }

    static drawSuitTorso(ctx, r, isBack, flash) {
        ctx.fillStyle = flash ? '#ffffff' : '#00d2d3';
        ctx.beginPath();
        ctx.roundRect(-r * 0.62, -r * 0.42, r * 1.24, r * 0.88, [13, 13, 8, 8]);
        ctx.fill();
        ctx.stroke();

        // Frosted Ice Shoulder Pauldrons
        for (const px of [-r * 0.62, r * 0.62]) {
            ctx.fillStyle = flash ? '#ffffff' : '#81ecec';
            ctx.beginPath();
            ctx.roundRect(px - r * 0.18, -r * 0.44, r * 0.36, r * 0.32, 7);
            ctx.fill();
            ctx.stroke();
        }

        if (flash) return;

        if (!isBack) {
            // Crisp V-Shirt + Lapels + Gold Necktie + Pocket Square + Belt
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(-r * 0.24, -r * 0.40);
            ctx.lineTo(0, r * 0.08);
            ctx.lineTo(r * 0.24, -r * 0.40);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#fed330';
            ctx.beginPath();
            ctx.moveTo(-r * 0.07, -r * 0.36);
            ctx.lineTo(r * 0.07, -r * 0.36);
            ctx.lineTo(r * 0.09, r * 0.02);
            ctx.lineTo(0, r * 0.18);
            ctx.lineTo(-r * 0.09, r * 0.02);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Breast pocket & mint handkerchief
            ctx.fillStyle = '#81ecec';
            ctx.beginPath();
            ctx.moveTo(-r * 0.44, -r * 0.16);
            ctx.lineTo(-r * 0.36, -r * 0.28);
            ctx.lineTo(-r * 0.28, -r * 0.16);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#1e272e';
            ctx.fillRect(-r * 0.46, -r * 0.16, r * 0.20, r * 0.06);

            ctx.fillStyle = '#2d3436';
            ctx.fillRect(-r * 0.58, r * 0.23, r * 1.16, r * 0.11);
            ctx.fillStyle = '#fed330';
            ctx.beginPath();
            ctx.roundRect(-r * 0.14, r * 0.20, r * 0.28, r * 0.17, 4);
            ctx.fill();
            ctx.stroke();
        } else {
            // Tailored Suit Collar & Back Seam
            ctx.fillStyle = '#0984e3';
            ctx.fillRect(-r * 0.26, -r * 0.42, r * 0.52, r * 0.12);
            ctx.strokeRect(-r * 0.26, -r * 0.42, r * 0.52, r * 0.12);
        }
    }

    static drawHeadAndFrappeCrown(ctx, r, isBack, isEnraged, flash) {
        ctx.save();
        ctx.translate(0, -r * 0.68);

        ctx.fillStyle = flash ? '#ffffff' : '#e0ab70';
        for (const ex of [-r * 0.39, r * 0.39]) {
            ctx.beginPath();
            ctx.arc(ex, 0, r * 0.09, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        ctx.fillStyle = flash ? '#ffffff' : '#f5cd79';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.39, r * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Sleek dark espresso hair along temples & full back cranium
        ctx.fillStyle = flash ? '#ffffff' : '#2d1e12';
        ctx.beginPath();
        if (isBack) {
            ctx.arc(0, -r * 0.04, r * 0.39, 0, Math.PI * 2);
        } else {
            ctx.arc(0, -r * 0.16, r * 0.38, Math.PI * 0.94, Math.PI * 2.06);
        }
        ctx.fill();
        ctx.stroke();

        if (!flash && !isBack) {
            // Gold-Rimmed Aviator Shades with glowing cyan lenses
            ctx.fillStyle = '#1e272e';
            ctx.strokeStyle = '#fed330';
            ctx.lineWidth = 2.4;
            for (const lx of [-r * 0.16, r * 0.16]) {
                ctx.beginPath();
                ctx.roundRect(lx - r * 0.14, -r * 0.11, r * 0.28, r * 0.18, [4, 4, 8, 8]);
                ctx.fill();
                ctx.stroke();
            }
            ctx.beginPath();
            ctx.moveTo(-r * 0.02, -r * 0.06);
            ctx.lineTo(r * 0.02, -r * 0.06);
            ctx.stroke();

            ctx.strokeStyle = isEnraged ? '#ff6b6b' : '#00f5ff';
            ctx.lineWidth = 2.1;
            ctx.beginPath();
            ctx.moveTo(-r * 0.23, -r * 0.07);
            ctx.lineTo(-r * 0.12, r * 0.01);
            ctx.moveTo(r * 0.09, -r * 0.07);
            ctx.lineTo(r * 0.20, r * 0.01);
            ctx.stroke();

            // Confident Baron Mustache, Smirk & Goatee
            ctx.fillStyle = '#2d1e12';
            ctx.strokeStyle = '#141418';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.roundRect(-r * 0.18, r * 0.10, r * 0.36, r * 0.06, 3);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(0, r * 0.18, r * 0.11, 0.15, Math.PI - 0.25);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(0, r * 0.29, r * 0.10, r * 0.065, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Iconic Towering Frappe Cup Crown + Floating Ice + Cream Foam + Bendy Straw
        ctx.strokeStyle = '#141418';
        ctx.lineWidth = 2.5;
        ctx.fillStyle = flash ? '#ffffff' : '#fed330';
        ctx.beginPath();
        ctx.roundRect(-r * 0.40, -r * 0.36, r * 0.80, r * 0.11, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#b8763e';
        ctx.beginPath();
        ctx.moveTo(-r * 0.22, -r * 0.35);
        ctx.lineTo(-r * 0.30, -r * 0.68);
        ctx.lineTo(r * 0.30, -r * 0.68);
        ctx.lineTo(r * 0.22, -r * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            ctx.fillStyle = 'rgba(129, 236, 236, 0.88)';
            ctx.fillRect(-r * 0.16, -r * 0.60, r * 0.13, r * 0.12);
            ctx.fillRect(r * 0.04, -r * 0.58, r * 0.12, r * 0.12);

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4.8;
            ctx.beginPath();
            ctx.moveTo(r * 0.09, -r * 0.68);
            ctx.lineTo(r * 0.17, -r * 0.94);
            ctx.lineTo(r * 0.33, -r * 0.99);
            ctx.stroke();
            ctx.strokeStyle = '#ff4757';
            ctx.lineWidth = 2.4;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#fff9f0';
            ctx.strokeStyle = '#141418';
            ctx.lineWidth = 2.2;
            for (const [fx, fy, fr] of [[-r * 0.16, -r * 0.69, r * 0.15], [r * 0.16, -r * 0.69, r * 0.15], [0, -r * 0.76, r * 0.18]]) {
                ctx.beginPath();
                ctx.arc(fx, fy, fr, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    static drawFrappomixerCannon(ctx, r, age, isEnraged, flash) {
        ctx.lineWidth = 2.6;
        ctx.strokeStyle = '#141418';

        ctx.fillStyle = flash ? '#ffffff' : '#2f3640';
        ctx.beginPath();
        ctx.roundRect(r * 0.06, -r * 0.18, r * 0.94, r * 0.36, 7);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#00a8ff';
        ctx.beginPath();
        ctx.roundRect(r * 0.96, -r * 0.22, r * 0.24, r * 0.44, 6);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            // Swirling Caramel Coffee Mixing Tank
            ctx.fillStyle = '#c48145';
            ctx.beginPath();
            ctx.roundRect(r * 0.22, -r * 0.30, r * 0.48, r * 0.24, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            const swirlX = r * 0.46 + Math.sin(age * 0.45) * (r * 0.12);
            ctx.beginPath();
            ctx.arc(swirlX, -r * 0.18, r * 0.06, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(r * 0.82, 0, r * 0.11, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            const needleA = -0.8 + Math.sin(age * (isEnraged ? 0.8 : 0.25)) * 0.9;
            ctx.strokeStyle = isEnraged ? '#ff4757' : '#0984e3';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(r * 0.82, 0);
            ctx.lineTo(r * 0.82 + Math.cos(needleA) * r * 0.08, Math.sin(needleA) * r * 0.08);
            ctx.stroke();
        }

        ctx.strokeStyle = '#141418';
        ctx.lineWidth = 2.6;
        ctx.fillStyle = flash ? '#ffffff' : '#ffffff';
        ctx.beginPath();
        ctx.arc(r * 0.18, r * 0.10, r * 0.13, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}

if (typeof window !== 'undefined') {
    window.FrappeBaronRenderer = FrappeBaronRenderer;
}