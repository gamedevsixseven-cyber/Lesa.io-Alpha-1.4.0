/**
 * Lesa.io - Wave 35 Insane Mini-Boss 2.5D Vector Renderer: SyndicateCapo ("Don Stavros")
 * High-stakes Athenian Underworld Kingpin in a draped fur-trimmed mob overcoat,
 * cream pinstripe double-breasted suit, ruby tie & Cuban gold chain, lit cigar,
 * mirrored mafia shades, fedora with tucked Ace card, laser-rigged Syndicate
 * briefcase, and a gold-drum Chicago Typewriter Tommy Gun.
 */

class SyndicateCapoRenderer {
    static draw(ctx, b) {
        const r = b.radius || 38;
        const flash = b.hitFlash > 0;
        const age = b.age || 0;
        const aimAngle = b.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const blinkWindup = (b.blinkCooldown || 999) <= 22;
        const recoil = (b.tommyCooldown || 999) <= 10 ? 0.15 : 0;
        const bob = Math.sin(b.walkCycle || age * 0.14) * 2.8;

        EndlessBossRenderer.drawTelegraphs(ctx, b.telegraphs);

        ctx.save();
        EndlessBossRenderer.drawShadow(ctx, b.x, b.y, r, b.isEnraged, b.isApex);

        if (!flash && (b.isEnraged || blinkWindup)) {
            SyndicateCapoRenderer.drawSyndicateAura(ctx, b.x, b.y + r * 0.72, r, age, b.isEnraged, blinkWindup);
        }

        ctx.translate(b.x, b.y + bob);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#141418';

        // Character Body Layer
        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);

        SyndicateCapoRenderer.drawMobOvercoat(ctx, r, age, facingLeft, isBack, b.isEnraged, flash);
        EndlessBossRenderer.drawLegs(ctx, r, b.walkCycle || age * 0.14, '#dcdde1', '#141418', flash);
        SyndicateCapoRenderer.drawSyndicateBriefcase(ctx, r, age, b.isEnraged, blinkWindup, flash);
        SyndicateCapoRenderer.drawPinstripeTorso(ctx, r, isBack, b.isEnraged, flash);
        SyndicateCapoRenderer.drawCapoHead(ctx, r, age, isBack, b.isEnraged, blinkWindup, flash);
        ctx.restore();

        // Aimed Gold-Drum Syndicate Tommy Gun
        const anchorX = facingLeft ? -r * 0.24 : r * 0.24;
        EndlessBossRenderer.drawAimedLayer(ctx, aimAngle, anchorX, r * 0.04, () => {
            SyndicateCapoRenderer.drawTommyGun(ctx, r, age, b.isEnraged, recoil, flash);
        });

        EndlessBossRenderer.endBody(ctx, b);
    }

    static drawSyndicateAura(ctx, x, y, r, age, isEnraged, blinkWindup) {
        ctx.save();
        ctx.translate(x, y);
        ctx.strokeStyle = blinkWindup ? 'rgba(255, 71, 87, 0.92)' : 'rgba(254, 211, 48, 0.78)';
        ctx.lineWidth = blinkWindup ? 3.8 : 3;
        ctx.setLineDash([10, 7]);
        ctx.lineDashOffset = -age * 1.6;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.28, r * 0.46, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Orbiting Crimson-Gold Syndicate Chips
        const count = isEnraged ? 4 : 2;
        for (let i = 0; i < count; i++) {
            const a = age * 0.11 + (i * Math.PI * 2 / count);
            const sx = Math.cos(a) * (r * 1.28);
            const sy = Math.sin(a) * (r * 0.46);
            ctx.fillStyle = '#2f3542';
            ctx.strokeStyle = i % 2 === 0 ? '#ff4757' : '#fed330';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.arc(sx, sy, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }

    static drawMobOvercoat(ctx, r, age, facingLeft, isBack, isEnraged, flash) {
        const sway = Math.sin(age * 0.16) * r * 0.08;
        // Draped charcoal gangster trenchcoat cape
        ctx.fillStyle = flash ? '#ffffff' : (isBack ? '#2f3640' : '#1e272e');
        ctx.beginPath();
        ctx.moveTo(-r * 0.56, -r * 0.44);
        ctx.quadraticCurveTo(-r * 0.86, r * 0.15, -r * 0.76 + sway, r * 0.78);
        ctx.lineTo(r * 0.72 + sway, r * 0.78);
        ctx.quadraticCurveTo(r * 0.80, r * 0.15, r * 0.56, -r * 0.44);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (flash) return;

        // Crimson silk inner coat lining peek
        if (!isBack) {
            ctx.fillStyle = '#b33939';
            ctx.beginPath();
            ctx.moveTo(-r * 0.70 + sway * 0.8, r * 0.74);
            ctx.lineTo(-r * 0.52, -r * 0.25);
            ctx.lineTo(-r * 0.46, r * 0.65);
            ctx.closePath();
            ctx.fill();
        } else {
            // Back view crimson syndicate diamond crest
            ctx.fillStyle = isEnraged ? '#ff4757' : '#fed330';
            ctx.beginPath();
            ctx.moveTo(sway * 0.4, -r * 0.10);
            ctx.lineTo(r * 0.18 + sway * 0.4, r * 0.14);
            ctx.lineTo(sway * 0.4, r * 0.38);
            ctx.lineTo(-r * 0.18 + sway * 0.4, r * 0.14);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        // Plush fur coat collar across shoulders
        ctx.fillStyle = '#dcdde1';
        ctx.beginPath();
        ctx.roundRect(-r * 0.64, -r * 0.52, r * 1.28, r * 0.24, 9);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#7f8c8d';
        for (const sx of [-r * 0.42, -r * 0.14, r * 0.16, r * 0.42]) {
            ctx.beginPath();
            ctx.arc(sx, -r * 0.40, r * 0.04, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    static drawSyndicateBriefcase(ctx, r, age, isEnraged, blinkWindup, flash) {
        const swing = Math.sin(age * 0.18) * 0.12 - (blinkWindup ? 0.22 : 0);
        ctx.save();
        ctx.translate(-r * 0.68, -r * 0.04);
        ctx.rotate(swing);

        // Armored sleeve + leather gloved hand
        ctx.fillStyle = flash ? '#ffffff' : '#1e272e';
        ctx.beginPath();
        ctx.roundRect(-r * 0.12, -r * 0.06, r * 0.24, r * 0.36, 5);
        ctx.fill();
        ctx.stroke();

        // Chrome handcuff chain link down to laser briefcase
        if (!flash) {
            ctx.strokeStyle = '#b2bec3';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, r * 0.26);
            ctx.lineTo(-r * 0.04, r * 0.38);
            ctx.stroke();
        }

        // Syndicate Briefcase (gunmetal shell + ruby seam glow)
        ctx.translate(-r * 0.02, r * 0.48);
        ctx.strokeStyle = '#141418';
        ctx.lineWidth = 2.6;
        ctx.fillStyle = flash ? '#ffffff' : '#2f3542';
        ctx.beginPath();
        ctx.roundRect(-r * 0.30, -r * 0.18, r * 0.60, r * 0.40, 5);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            // Glowing ruby laser crack across lid + gold locks
            ctx.fillStyle = (blinkWindup || isEnraged) ? '#ff4757' : '#eb4d4b';
            ctx.fillRect(-r * 0.26, -r * 0.03, r * 0.52, r * 0.07);
            ctx.fillStyle = '#fed330';
            ctx.fillRect(-r * 0.18, -r * 0.18, r * 0.09, r * 0.12);
            ctx.fillRect(r * 0.09, -r * 0.18, r * 0.09, r * 0.12);
        }
        ctx.restore();
    }

    static drawPinstripeTorso(ctx, r, isBack, isEnraged, flash) {
        if (isBack) {
            // Back view shows the draped black trenchcoat & crimson syndicate emblem unobstructed
            ctx.fillStyle = flash ? '#ffffff' : '#1e272e';
            ctx.beginPath();
            ctx.roundRect(-r * 0.52, -r * 0.40, r * 1.04, r * 0.86, 8);
            ctx.fill();
            ctx.stroke();
            if (!flash) {
                ctx.strokeStyle = '#485460';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(0, -r * 0.36); ctx.lineTo(0, r * 0.42);
                ctx.stroke();
                ctx.fillStyle = isEnraged ? '#ff4757' : '#fed330';
                ctx.strokeStyle = '#141418';
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.moveTo(0, -r * 0.14); ctx.lineTo(r * 0.18, r * 0.08);
                ctx.lineTo(0, r * 0.30); ctx.lineTo(-r * 0.18, r * 0.08);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
            return;
        }

        // White-ivory tailored suit jacket
        ctx.fillStyle = flash ? '#ffffff' : '#f5f6fa';
        ctx.beginPath();
        ctx.moveTo(-r * 0.54, -r * 0.40);
        ctx.lineTo(r * 0.54, -r * 0.40);
        ctx.lineTo(r * 0.44, r * 0.42);
        ctx.lineTo(-r * 0.44, r * 0.42);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (flash || isBack) return;

        // Crisp vertical charcoal pinstripes
        ctx.strokeStyle = 'rgba(47, 54, 64, 0.28)';
        ctx.lineWidth = 1.6;
        for (const px of [-r * 0.32, -r * 0.18, r * 0.18, r * 0.32]) {
            ctx.beginPath();
            ctx.moveTo(px, -r * 0.36);
            ctx.lineTo(px * 0.85, r * 0.38);
            ctx.stroke();
        }
        ctx.strokeStyle = '#141418';
        ctx.lineWidth = 2.4;

        // Ruby Silk Vest V + Black Silk Tie
        ctx.fillStyle = '#b33939';
        ctx.beginPath();
        ctx.moveTo(-r * 0.24, -r * 0.40);
        ctx.lineTo(r * 0.24, -r * 0.40);
        ctx.lineTo(0, r * 0.18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1e272e';
        ctx.beginPath();
        ctx.moveTo(-r * 0.08, -r * 0.38);
        ctx.lineTo(r * 0.08, -r * 0.38);
        ctx.lineTo(0, r * 0.06);
        ctx.closePath();
        ctx.fill();

        // Heavy 24k Gold Cuban Chain draped across chest
        ctx.strokeStyle = '#141418';
        ctx.lineWidth = 5.5;
        ctx.beginPath();
        ctx.arc(0, -r * 0.38, r * 0.24, 0.15, Math.PI - 0.15);
        ctx.stroke();
        ctx.strokeStyle = '#fed330';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Crimson rose lapel pin + gold tie clasp
        ctx.fillStyle = isEnraged ? '#ff4757' : '#eb4d4b';
        ctx.beginPath();
        ctx.arc(-r * 0.28, -r * 0.18, r * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#141418';
        ctx.lineWidth = 1.8;
        ctx.stroke();
    }

    static drawCapoHead(ctx, r, age, isBack, isEnraged, blinkWindup, flash) {
        // Head base
        ctx.fillStyle = flash ? '#ffffff' : '#e5b184';
        ctx.beginPath();
        ctx.arc(0, -r * 0.64, r * 0.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            if (isBack) {
                ctx.fillStyle = '#2f3640';
                ctx.beginPath();
                ctx.arc(0, -r * 0.60, r * 0.35, 0, Math.PI);
                ctx.fill();
                ctx.stroke();
            } else {
                // Trim Mafia goatee & sharp charcoal mustache
                ctx.fillStyle = '#2f3640';
                ctx.beginPath();
                ctx.moveTo(-r * 0.14, -r * 0.48);
                ctx.quadraticCurveTo(0, -r * 0.56, r * 0.24, -r * 0.48);
                ctx.lineTo(r * 0.14, -r * 0.42);
                ctx.closePath();
                ctx.fill();
                ctx.beginPath();
                ctx.arc(r * 0.08, -r * 0.33, r * 0.10, 0, Math.PI);
                ctx.fill();

                // Glossy Mafia Shades + crimson target eye gleam when enraged/blinking
                ctx.fillStyle = '#141418';
                ctx.beginPath();
                ctx.roundRect(-r * 0.22, -r * 0.74, r * 0.56, r * 0.16, 4);
                ctx.fill();
                ctx.strokeStyle = '#fed330';
                ctx.lineWidth = 1.6;
                ctx.stroke();
                ctx.fillStyle = (isEnraged || blinkWindup) ? '#ff4757' : 'rgba(255,255,255,0.75)';
                ctx.fillRect(r * 0.08, -r * 0.70, r * 0.16, r * 0.07);

                // Glowing Cuban Cigar + smoke puff
                ctx.strokeStyle = '#141418';
                ctx.lineWidth = 2;
                ctx.fillStyle = '#8b4513';
                ctx.beginPath();
                ctx.roundRect(r * 0.14, -r * 0.46, r * 0.28, r * 0.08, 2);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#ff6348';
                ctx.beginPath();
                ctx.arc(r * 0.42, -r * 0.42, r * 0.045, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Jaunty Borsalino Mafia Fedora + Crimson Ribbon + Tucked Playing Card
        ctx.save();
        ctx.translate(0, -r * 0.90);
        ctx.rotate(-0.08);
        ctx.strokeStyle = '#141418';
        ctx.lineWidth = 2.6;

        // Wide fedora brim
        ctx.fillStyle = flash ? '#ffffff' : '#f5f6fa';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.56, r * 0.13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Fedora crown
        ctx.beginPath();
        ctx.roundRect(-r * 0.30, -r * 0.36, r * 0.60, r * 0.36, 7);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#b33939';
            ctx.fillRect(-r * 0.29, -r * 0.12, r * 0.58, r * 0.10);
            // Tiny Ace playing card tucked in hatband
            ctx.save();
            ctx.translate(-r * 0.20, -r * 0.20);
            ctx.rotate(-0.25);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-r * 0.08, -r * 0.14, r * 0.16, r * 0.22);
            ctx.strokeRect(-r * 0.08, -r * 0.14, r * 0.16, r * 0.22);
            ctx.fillStyle = '#eb4d4b';
            ctx.fillRect(-r * 0.03, -r * 0.06, r * 0.06, r * 0.08);
            ctx.restore();
        }
        ctx.restore();
    }

    static drawTommyGun(ctx, r, age, isEnraged, recoil, flash) {
        const kick = recoil * r * 0.6;
        ctx.save();
        ctx.translate(-kick, 0);

        // Wooden buttstock + main blackened steel receiver
        ctx.fillStyle = flash ? '#ffffff' : '#6c4a32';
        ctx.beginPath();
        ctx.roundRect(r * 0.02, -r * 0.10, r * 0.34, r * 0.22, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#1e272e';
        ctx.beginPath();
        ctx.roundRect(r * 0.30, -r * 0.14, r * 0.68, r * 0.22, 4);
        ctx.fill();
        ctx.stroke();

        // Finned barrel + gold muzzle Cutts compensator
        ctx.fillStyle = flash ? '#ffffff' : '#576574';
        ctx.beginPath();
        ctx.roundRect(r * 0.94, -r * 0.07, r * 0.34, r * 0.12, 2);
        ctx.fill();
        ctx.stroke();

        // Iconic 24k Gold Drum Magazine hanging below receiver
        ctx.fillStyle = flash ? '#ffffff' : '#fed330';
        ctx.beginPath();
        ctx.arc(r * 0.64, r * 0.20, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            ctx.fillStyle = isEnraged ? '#ff4757' : '#b33939';
            ctx.beginPath();
            ctx.arc(r * 0.64, r * 0.20, r * 0.09, 0, Math.PI * 2);
            ctx.fill();

            // Red-laser sight beam dot & muzzle flash on rapid tommy fire
            if (recoil > 0) {
                ctx.fillStyle = '#fed330';
                ctx.beginPath();
                ctx.moveTo(r * 1.28, -r * 0.16);
                ctx.lineTo(r * 1.54, 0);
                ctx.lineTo(r * 1.28, r * 0.16);
                ctx.closePath();
                ctx.fill();
            }
        }
        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.SyndicateCapoRenderer = SyndicateCapoRenderer;
}
