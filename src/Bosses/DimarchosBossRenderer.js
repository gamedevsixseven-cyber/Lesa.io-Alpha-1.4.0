/**
 * Lesa.io - Wave 30 Main Boss 2.5D Vector Renderer: DimarchosBoss ("O Dimarchos")
 * Regal Greek City Mayor Boss in royal Hellenic mayoral cape, pinstripe navy suit,
 * diagonal sky-blue ceremonial sash, heavy gold chain of office, briefcase spilling
 * banknotes, gold monocle, puffed cigar, tall civic top hat, and golden Tax Cannon.
 */

class DimarchosBossRenderer {
    static draw(ctx, b) {
        const r = b.radius || 46;
        const flash = b.hitFlash > 0;
        const age = b.age || 0;
        const aimAngle = b.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const bob = Math.sin(b.walkCycle || age * 0.12) * 3;
        const recoil = (b.decreeCooldown || 999) <= 10 ? 0.16 : 0;

        EndlessBossRenderer.drawTelegraphs(ctx, b.telegraphs);

        ctx.save();
        EndlessBossRenderer.drawShadow(ctx, b.x, b.y, r, b.isEnraged, b.isApex);

        if (!flash && b.isEnraged) {
            DimarchosBossRenderer.drawCivicAura(ctx, b.x, b.y + r * 0.72, r, age);
        }

        ctx.translate(b.x, b.y + bob);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#141418';

        // Character Body Layer
        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);

        DimarchosBossRenderer.drawCapeCoattails(ctx, r, age, isBack, flash);
        EndlessBossRenderer.drawLegs(ctx, r, b.walkCycle || age * 0.12, '#192a56', '#141418', flash);
        DimarchosBossRenderer.drawBriefcaseOffHand(ctx, r, age, facingLeft, b.isEnraged, flash);
        DimarchosBossRenderer.drawMayoralTorso(ctx, r, isBack, b.isEnraged, flash);
        DimarchosBossRenderer.drawMayorHead(ctx, r, age, isBack, b.isEnraged, flash);
        ctx.restore();

        // Aimed Corinthian Gold Tax-Decree Cannon from aiming shoulder
        const anchorX = facingLeft ? -r * 0.30 : r * 0.30;
        EndlessBossRenderer.drawAimedLayer(ctx, aimAngle, anchorX, r * 0.05, () => {
            DimarchosBossRenderer.drawTaxCannon(ctx, r, age, b.isEnraged, recoil, flash);
        });

        EndlessBossRenderer.endBody(ctx, b);
    }

    static drawCivicAura(ctx, x, y, r, age) {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = 'rgba(254, 211, 48, 0.86)';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([12, 8]);
        ctx.lineDashOffset = -age * 1.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.26, r * 0.47, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Orbiting Municipal Gold Seal Coins
        for (let i = 0; i < 4; i++) {
            const a = age * 0.09 + (i * Math.PI * 0.5);
            const sx = Math.cos(a) * (r * 1.28);
            const sy = Math.sin(a) * (r * 0.48);
            ctx.fillStyle = '#fed330';
            ctx.strokeStyle = '#e67e22';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(sx, sy, 5.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }

    static drawCapeCoattails(ctx, r, age, isBack, flash) {
        const sway = Math.sin(age * 0.14) * r * 0.07;
        // Flowing Royal Navy & Crimson Velvet Civic Cape
        ctx.fillStyle = flash ? '#ffffff' : (isBack ? '#192a56' : '#8c1d18');
        ctx.beginPath();
        ctx.moveTo(-r * 0.54, -r * 0.42);
        ctx.quadraticCurveTo(-r * 0.88, r * 0.18, -r * 0.78 + sway, r * 0.78);
        ctx.lineTo(r * 0.72 + sway, r * 0.78);
        ctx.quadraticCurveTo(r * 0.82, r * 0.18, r * 0.54, -r * 0.42);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#fed330';
            ctx.fillRect(-r * 0.72 + sway, r * 0.68, r * 1.40, r * 0.09);
            if (isBack) {
                ctx.beginPath();
                ctx.arc(sway * 0.4, r * 0.16, r * 0.22, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }
    }

    static drawBriefcaseOffHand(ctx, r, age, facingLeft, isEnraged, flash) {
        ctx.save();
        ctx.translate(-r * 0.70, r * 0.04);
        ctx.rotate(-0.18 + Math.sin(age * 0.16) * 0.10);

        // Coat Sleeve & White Cuff + Gold Cufflink
        ctx.fillStyle = flash ? '#ffffff' : '#1e3799';
        ctx.beginPath();
        ctx.roundRect(-r * 0.13, -r * 0.14, r * 0.26, r * 0.36, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#f5f6fa';
        ctx.fillRect(-r * 0.11, r * 0.16, r * 0.22, r * 0.10);
        ctx.strokeRect(-r * 0.11, r * 0.16, r * 0.22, r * 0.10);

        // Municipal Mahogany Briefcase overflowing with Banknotes & Tax Seal
        ctx.fillStyle = flash ? '#ffffff' : '#6f381c';
        ctx.beginPath();
        ctx.roundRect(-r * 0.30, r * 0.24, r * 0.56, r * 0.38, 6);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            // Protruding Euro Banknotes & Red Tax Scroll
            ctx.fillStyle = '#2ed573';
            ctx.fillRect(-r * 0.22, r * 0.13, r * 0.18, r * 0.13);
            ctx.strokeRect(-r * 0.22, r * 0.13, r * 0.18, r * 0.13);
            ctx.fillRect(-r * 0.02, r * 0.11, r * 0.18, r * 0.15);
            ctx.strokeRect(-r * 0.02, r * 0.11, r * 0.18, r * 0.15);

            // Brass Corner Studs & "€" Emblem
            ctx.fillStyle = isEnraged ? '#ff4757' : '#fed330';
            ctx.fillRect(-r * 0.10, r * 0.24, r * 0.16, r * 0.10);
            ctx.strokeRect(-r * 0.10, r * 0.24, r * 0.16, r * 0.10);
            EndlessBossRenderer.drawUnmirroredText(
                ctx, facingLeft, '€€€', -r * 0.02, r * 0.45,
                '900 9px "Fredoka", Arial, sans-serif', '#fed330', null, r * 0.48
            );
        }
        ctx.restore();
    }

    static drawMayoralTorso(ctx, r, isBack, isEnraged, flash) {
        // Tailored Aegean Navy Pinstripe Double-Breasted Jacket
        ctx.fillStyle = flash ? '#ffffff' : '#1e3799';
        ctx.beginPath();
        ctx.roundRect(-r * 0.66, -r * 0.46, r * 1.32, r * 0.94, [15, 15, 10, 10]);
        ctx.fill();
        ctx.stroke();

        // Ceremonial Padded Gold-Trimmed Epaulettes
        for (const sx of [-r * 0.60, r * 0.60]) {
            ctx.fillStyle = flash ? '#ffffff' : '#fed330';
            ctx.beginPath();
            ctx.roundRect(sx - r * 0.16, -r * 0.48, r * 0.32, r * 0.22, 6);
            ctx.fill();
            ctx.stroke();
        }

        if (flash) return;

        // Crisp Pinstripes
        ctx.strokeStyle = 'rgba(130, 204, 221, 0.28)';
        ctx.lineWidth = 2;
        for (const px of [-r * 0.42, -r * 0.24, 0, r * 0.24, r * 0.42]) {
            ctx.beginPath();
            ctx.moveTo(px, -r * 0.40);
            ctx.lineTo(px, r * 0.44);
            ctx.stroke();
        }
        ctx.lineWidth = 2.6;
        ctx.strokeStyle = '#141418';

        if (!isBack) {
            // Crisp White Dress Shirt V & Vivid Crimson Silk Tie
            ctx.fillStyle = '#f5f6fa';
            ctx.beginPath();
            ctx.moveTo(-r * 0.22, -r * 0.44);
            ctx.lineTo(0, -r * 0.06);
            ctx.lineTo(r * 0.22, -r * 0.44);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#e84118';
            ctx.beginPath();
            ctx.moveTo(-r * 0.07, -r * 0.40);
            ctx.lineTo(r * 0.07, -r * 0.40);
            ctx.lineTo(0, -r * 0.02);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Hellas Sky-Blue Ceremonial Mayoral Sash + White Piping
            ctx.fillStyle = '#00a8ff';
            ctx.beginPath();
            ctx.moveTo(-r * 0.56, -r * 0.45);
            ctx.lineTo(r * 0.34, r * 0.48);
            ctx.lineTo(r * 0.58, r * 0.48);
            ctx.lineTo(-r * 0.30, -r * 0.45);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Breast Pocket stuffed with Euro bills
            ctx.fillStyle = '#2ed573';
            ctx.fillRect(r * 0.14, -r * 0.28, r * 0.20, r * 0.14);
            ctx.strokeRect(r * 0.14, -r * 0.28, r * 0.20, r * 0.14);

            // Multi-Link Heavy Gold Chain of Office & Civic Medallion
            ctx.strokeStyle = '#f6b93b';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(0, -r * 0.38, r * 0.34, 0.18, Math.PI - 0.18);
            ctx.stroke();

            ctx.strokeStyle = '#141418';
            ctx.lineWidth = 2.6;
            ctx.fillStyle = '#fed330';
            ctx.beginPath();
            ctx.arc(0, -r * 0.04, r * 0.18, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = isEnraged ? '#ff4757' : '#00a8ff';
            ctx.beginPath();
            ctx.arc(0, -r * 0.04, r * 0.08, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }

    static drawMayorHead(ctx, r, age, isBack, isEnraged, flash) {
        ctx.save();
        ctx.translate(0, -r * 0.72);

        // Rosy Pompous Mayor Head & Ears
        ctx.fillStyle = flash ? '#ffffff' : '#f7caa0';
        for (const ex of [-r * 0.40, r * 0.40]) {
            ctx.beginPath();
            ctx.arc(ex, 0, r * 0.095, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.40, r * 0.37, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Distinguished Silver-White Sideburns / Back Hair
        ctx.fillStyle = flash ? '#ffffff' : '#dfe6e9';
        ctx.beginPath();
        if (isBack) {
            ctx.arc(0, 0, r * 0.39, 0, Math.PI * 2);
        } else {
            ctx.arc(0, -r * 0.12, r * 0.39, Math.PI * 0.92, Math.PI * 2.08);
        }
        ctx.fill();
        ctx.stroke();

        if (!flash && !isBack) {
            // Piercing Left Eye + Gleaming Gold Monocle on Right Eye
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-r * 0.13, -r * 0.06, r * 0.075, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = isEnraged ? '#ff4757' : '#141418';
            ctx.beginPath();
            ctx.arc(-r * 0.11, -r * 0.06, r * 0.036, 0, Math.PI * 2);
            ctx.fill();

            // Monocle Frame + Chain
            ctx.strokeStyle = '#fed330';
            ctx.lineWidth = 2.8;
            ctx.fillStyle = isEnraged ? 'rgba(255, 71, 87, 0.38)' : 'rgba(0, 210, 211, 0.32)';
            ctx.beginPath();
            ctx.arc(r * 0.15, -r * 0.06, r * 0.105, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(r * 0.25, -r * 0.02);
            ctx.quadraticCurveTo(r * 0.32, r * 0.18, r * 0.20, r * 0.36);
            ctx.stroke();

            // Arrogant Silver Eyebrows
            ctx.strokeStyle = '#b2bec3';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(-r * 0.24, -r * 0.18);
            ctx.lineTo(-r * 0.04, -r * 0.14);
            ctx.moveTo(r * 0.06, -r * 0.19);
            ctx.lineTo(r * 0.27, -r * 0.23);
            ctx.stroke();

            // Grand Aristocratic Silver Handlebar Mustache
            ctx.strokeStyle = '#141418';
            ctx.lineWidth = 2;
            ctx.fillStyle = '#f5f6fa';
            ctx.beginPath();
            ctx.moveTo(0, r * 0.08);
            ctx.quadraticCurveTo(-r * 0.20, r * 0.04, -r * 0.32, r * 0.18);
            ctx.quadraticCurveTo(-r * 0.12, r * 0.22, 0, r * 0.15);
            ctx.quadraticCurveTo(r * 0.12, r * 0.22, r * 0.34, r * 0.17);
            ctx.quadraticCurveTo(r * 0.20, r * 0.04, 0, r * 0.08);
            ctx.fill();
            ctx.stroke();

            // Fat Lit Cigar + Animated Smoke Puffs
            ctx.fillStyle = '#6f381c';
            ctx.fillRect(r * 0.08, r * 0.18, r * 0.30, r * 0.085);
            ctx.strokeRect(r * 0.08, r * 0.18, r * 0.30, r * 0.085);
            ctx.fillStyle = '#ff6348';
            ctx.fillRect(r * 0.33, r * 0.18, r * 0.06, r * 0.085);

            const puff = (age * 0.06) % 1;
            ctx.fillStyle = `rgba(223, 230, 233, ${0.75 * (1 - puff)})`;
            ctx.beginPath();
            ctx.arc(r * (0.40 + puff * 0.16), r * (0.14 - puff * 0.34), r * (0.06 + puff * 0.07), 0, Math.PI * 2);
            ctx.fill();
        }

        // Tall Ceremonial Blue & Gold Civic Top Hat
        ctx.strokeStyle = '#141418';
        ctx.lineWidth = 2.8;
        ctx.fillStyle = flash ? '#ffffff' : '#192a56';
        ctx.beginPath();
        ctx.roundRect(-r * 0.34, -r * 0.74, r * 0.68, r * 0.56, [7, 7, 2, 2]);
        ctx.fill();
        ctx.stroke();

        // Hat Brim
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.20, r * 0.52, r * 0.095, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#00a8ff';
            ctx.fillRect(-r * 0.33, -r * 0.35, r * 0.66, r * 0.12);
            ctx.strokeRect(-r * 0.33, -r * 0.35, r * 0.66, r * 0.12);

            if (!isBack) {
                ctx.fillStyle = '#fed330';
                ctx.beginPath();
                ctx.arc(0, -r * 0.30, r * 0.105, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    static drawTaxCannon(ctx, r, age, isEnraged, recoil, flash) {
        ctx.rotate(-recoil);
        ctx.lineWidth = 2.8;
        ctx.strokeStyle = '#141418';

        // Gilded Corinthian Cannon Breech & Flared Bell Muzzle
        ctx.fillStyle = flash ? '#ffffff' : '#f6b93b';
        ctx.beginPath();
        ctx.roundRect(r * 0.06, -r * 0.18, r * 0.72, r * 0.36, 7);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#fed330';
        ctx.beginPath();
        ctx.moveTo(r * 0.72, -r * 0.18);
        ctx.lineTo(r * 1.16, -r * 0.34);
        ctx.lineTo(r * 1.16, r * 0.34);
        ctx.lineTo(r * 0.72, r * 0.18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            // Aegean Sky-Blue Decorative Fluting Rings & Cash Hopper
            ctx.fillStyle = '#00a8ff';
            ctx.fillRect(r * 0.38, -r * 0.17, r * 0.10, r * 0.34);
            ctx.fillRect(r * 0.98, -r * 0.28, r * 0.08, r * 0.56);

            // Top Cash Hopper packed with Green Bills & Spinning Stamp Drum
            ctx.fillStyle = '#2ed573';
            ctx.beginPath();
            ctx.roundRect(r * 0.26, -r * 0.35, r * 0.40, r * 0.18, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = isEnraged ? '#ff4757' : '#e84118';
            ctx.beginPath();
            ctx.arc(r * 0.22, 0, r * 0.10, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            if (isEnraged) {
                const gl = 0.7 + Math.sin(age * 0.4) * 0.3;
                ctx.fillStyle = `rgba(254, 211, 48, ${gl})`;
                ctx.beginPath();
                ctx.arc(r * 1.16, 0, r * 0.14, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Crisp White Magistrate Glove on Grip
        ctx.fillStyle = flash ? '#ffffff' : '#f5f6fa';
        ctx.beginPath();
        ctx.arc(r * 0.16, r * 0.10, r * 0.13, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}

if (typeof window !== 'undefined') {
    window.DimarchosBossRenderer = DimarchosBossRenderer;
}
