/**
 * Lesa.io - Wave 5 Mini-Boss 2.5D Vector Renderer: SouvlakiBrawler ("Psistis the Grillmaster")
 * Detailed comic taverna grill master with sizzling spit-roast skewer lance,
 * oven-mitt gauntlets, clamping steel tongs, "PSISTIS" apron, handlebar mustache,
 * and blazing dash trails.
 */

class SouvlakiBrawlerRenderer {
    static draw(ctx, b) {
        const r = b.radius || 36;
        const flash = b.hitFlash > 0;
        const age = b.age || 0;
        const aimAngle = b.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const isDashing = (b.dashTimer || 0) > 0;
        const bob = isDashing ? -4 : Math.sin(b.walkCycle || age * 0.14) * 3;

        EndlessBossRenderer.drawTelegraphs(ctx, b.telegraphs);

        ctx.save();
        EndlessBossRenderer.drawShadow(ctx, b.x, b.y, r, b.isEnraged, b.isApex);

        if (!flash && (b.isEnraged || isDashing)) {
            SouvlakiBrawlerRenderer.drawCharcoalAura(ctx, b.x, b.y + r * 0.72, r, age, isDashing);
        }

        ctx.translate(b.x, b.y + bob);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#141418';

        if (isDashing && !flash) {
            SouvlakiBrawlerRenderer.drawDashStreaks(ctx, b.dashAngle || aimAngle);
        }

        // Body & Character Layer
        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);
        if (isDashing) ctx.rotate(0.20);

        EndlessBossRenderer.drawLegs(ctx, r, b.walkCycle || age * 0.14, '#2f3640', '#5a3118', flash);
        SouvlakiBrawlerRenderer.drawApronTiesAndTongs(ctx, r, age, flash);
        SouvlakiBrawlerRenderer.drawTorsoAndApron(ctx, r, facingLeft, isBack, b.isEnraged, flash);
        SouvlakiBrawlerRenderer.drawHead(ctx, r, age, isBack, b.isEnraged, flash);
        ctx.restore();

        // Aimed Flaming Skewer Spear anchored from aiming shoulder so chest badge & face stay visible
        const anchorX = facingLeft ? -r * 0.24 : r * 0.24;
        EndlessBossRenderer.drawAimedLayer(ctx, aimAngle, anchorX, r * 0.04, () => {
            SouvlakiBrawlerRenderer.drawFlamingSkewer(ctx, r, age, b.isEnraged, isDashing, flash);
        });

        EndlessBossRenderer.endBody(ctx, b);
    }

    static drawCharcoalAura(ctx, x, y, r, age, isDashing) {
        ctx.save();
        ctx.translate(x, y);
        const pulse = 0.68 + Math.sin(age * 0.25) * 0.25;
        ctx.strokeStyle = isDashing ? 'rgba(255, 107, 107, 0.92)' : `rgba(255, 159, 67, ${pulse})`;
        ctx.lineWidth = 3.2;
        ctx.setLineDash([10, 7]);
        ctx.lineDashOffset = -age * 1.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.20, r * 0.45, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    static drawDashStreaks(ctx, dashAngle) {
        const dx = -Math.cos(dashAngle);
        const dy = -Math.sin(dashAngle);
        ctx.save();
        ctx.lineCap = 'round';
        for (const [off, col, len] of [[-14, '#ff4757', 48], [0, '#ffa502', 62], [14, '#ff6348', 48]]) {
            ctx.strokeStyle = col;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(dx * 16 - dy * off, dy * 16 + dx * off);
            ctx.lineTo(dx * (16 + len) - dy * off, dy * (16 + len) + dx * off);
            ctx.stroke();
        }
        ctx.restore();
    }

    static drawApronTiesAndTongs(ctx, r, age, flash) {
        if (!flash) {
            const tieWave = Math.sin(age * 0.22) * 5;
            ctx.strokeStyle = '#dfe6e9';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-r * 0.48, r * 0.14);
            ctx.quadraticCurveTo(-r * 0.72, r * 0.28 + tieWave, -r * 0.80, r * 0.44 + tieWave);
            ctx.stroke();
            ctx.strokeStyle = '#141418';
        }

        // Muscular off-hand arm + red oven mitt + steel grill tongs
        ctx.save();
        ctx.translate(-r * 0.68, -r * 0.04);
        ctx.rotate(-0.32 + Math.sin(age * 0.18) * 0.14);
        ctx.fillStyle = flash ? '#ffffff' : '#e0a27a';
        ctx.beginPath();
        ctx.roundRect(-r * 0.13, -r * 0.10, r * 0.24, r * 0.34, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#ff6b6b';
        ctx.beginPath();
        ctx.roundRect(-r * 0.16, r * 0.16, r * 0.30, r * 0.24, 7);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            const pinch = Math.abs(Math.sin(age * 0.24)) * 0.16;
            ctx.strokeStyle = '#d1d8e0';
            ctx.lineWidth = 3.2;
            ctx.beginPath();
            ctx.moveTo(0, r * 0.32);
            ctx.lineTo(-r * (0.14 - pinch * 0.45), r * 0.66);
            ctx.moveTo(0, r * 0.32);
            ctx.lineTo(r * (0.14 - pinch * 0.45), r * 0.66);
            ctx.stroke();
        }
        ctx.restore();
    }

    static drawTorsoAndApron(ctx, r, facingLeft, isBack, isEnraged, flash) {
        ctx.fillStyle = flash ? '#ffffff' : (isEnraged ? '#d35400' : '#e67e22');
        ctx.beginPath();
        ctx.roundRect(-r * 0.66, -r * 0.42, r * 1.32, r * 0.88, [14, 14, 9, 9]);
        ctx.fill();
        ctx.stroke();

        if (flash) return;

        if (!isBack) {
            // Apron straps + Crisp White Taverna Apron + Grill Splatters
            ctx.fillStyle = '#f5f6fa';
            ctx.fillRect(-r * 0.34, -r * 0.41, r * 0.11, r * 0.16);
            ctx.strokeRect(-r * 0.34, -r * 0.41, r * 0.11, r * 0.16);
            ctx.fillRect(r * 0.23, -r * 0.41, r * 0.11, r * 0.16);
            ctx.strokeRect(r * 0.23, -r * 0.41, r * 0.11, r * 0.16);

            ctx.fillStyle = '#fdfefe';
            ctx.beginPath();
            ctx.roundRect(-r * 0.45, -r * 0.30, r * 0.90, r * 0.82, [6, 6, 10, 10]);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ff6b6b';
            ctx.fillRect(-r * 0.43, r * 0.30, r * 0.86, r * 0.10);
            ctx.fillStyle = '#d35400';
            ctx.beginPath();
            ctx.arc(-r * 0.24, r * 0.08, 3.6, 0, Math.PI * 2);
            ctx.arc(r * 0.24, -r * 0.02, 2.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ecf0f1';
            ctx.fillRect(-r * 0.22, r * 0.06, r * 0.44, r * 0.19);
            ctx.strokeRect(-r * 0.22, r * 0.06, r * 0.44, r * 0.19);

            EndlessBossRenderer.drawUnmirroredText(
                ctx, facingLeft, 'PSISTIS', 0, -r * 0.13,
                '900 8.5px "Fredoka", Arial, sans-serif', '#c0392b', null, r * 0.82
            );
        } else {
            ctx.strokeStyle = '#f5f6fa';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-r * 0.36, -r * 0.36);
            ctx.lineTo(r * 0.36, r * 0.12);
            ctx.moveTo(r * 0.36, -r * 0.36);
            ctx.lineTo(-r * 0.36, r * 0.12);
            ctx.stroke();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#141418';
        }
    }

    static drawHead(ctx, r, age, isBack, isEnraged, flash) {
        ctx.save();
        ctx.translate(0, -r * 0.69);

        ctx.fillStyle = flash ? '#ffffff' : '#df9b72';
        for (const ex of [-r * 0.41, r * 0.41]) {
            ctx.beginPath();
            ctx.arc(ex, 0, r * 0.10, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        ctx.fillStyle = flash ? '#ffffff' : '#f3a683';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 0.42, r * 0.39, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Dark curly hair dome (full back hair when facing away)
        ctx.fillStyle = flash ? '#ffffff' : '#2d3436';
        ctx.beginPath();
        if (isBack) {
            ctx.arc(0, -r * 0.04, r * 0.42, 0, Math.PI * 2);
        } else {
            ctx.arc(0, -r * 0.15, r * 0.41, Math.PI * 0.96, Math.PI * 2.04);
        }
        ctx.fill();
        ctx.stroke();

        // Grillmaster Red Sweat Bandanna + trailing knot
        ctx.fillStyle = flash ? '#ffffff' : (isEnraged ? '#ff4757' : '#ee5253');
        ctx.beginPath();
        ctx.roundRect(-r * 0.43, -r * 0.26, r * 0.86, r * 0.18, 4);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            const knotWave = Math.sin(age * 0.28) * 3;
            ctx.beginPath();
            ctx.moveTo(-r * 0.41, -r * 0.19);
            ctx.lineTo(-r * 0.64, -r * 0.29 + knotWave);
            ctx.lineTo(-r * 0.58, -r * 0.10 + knotWave);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            if (!isBack) {
                // Fierce white eyes, pupils, and V-slanted angry eyebrows
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(-r * 0.11, -r * 0.01, r * 0.09, 0, Math.PI * 2);
                ctx.arc(r * 0.18, -r * 0.01, r * 0.09, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = isEnraged ? '#ff4757' : '#1e272e';
                ctx.beginPath();
                ctx.arc(-r * 0.08, -r * 0.01, r * 0.048, 0, Math.PI * 2);
                ctx.arc(r * 0.21, -r * 0.01, r * 0.048, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = '#1e272e';
                ctx.lineWidth = 3.2;
                ctx.beginPath();
                ctx.moveTo(-r * 0.22, -r * 0.12);
                ctx.lineTo(-r * 0.01, -r * 0.06);
                ctx.moveTo(r * 0.06, -r * 0.06);
                ctx.lineTo(r * 0.28, -r * 0.12);
                ctx.stroke();

                // Grill-flushed nose, thick Greek handlebar mustache & gritted teeth
                ctx.fillStyle = '#e17055';
                ctx.beginPath();
                ctx.arc(r * 0.05, r * 0.08, r * 0.085, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#2d3436';
                ctx.strokeStyle = '#141418';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(r * 0.05, r * 0.13);
                ctx.quadraticCurveTo(-r * 0.16, r * 0.08, -r * 0.30, r * 0.21);
                ctx.quadraticCurveTo(-r * 0.12, r * 0.25, r * 0.05, r * 0.18);
                ctx.quadraticCurveTo(r * 0.18, r * 0.25, r * 0.35, r * 0.20);
                ctx.quadraticCurveTo(r * 0.20, r * 0.08, r * 0.05, r * 0.13);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-r * 0.08, r * 0.22, r * 0.24, r * 0.08);
            }
        }
        ctx.restore();
    }

    static drawFlamingSkewer(ctx, r, age, isEnraged, isDashing, flash) {
        ctx.lineWidth = 2.8;
        ctx.strokeStyle = '#141418';

        ctx.fillStyle = flash ? '#ffffff' : '#8b4513';
        ctx.beginPath();
        ctx.roundRect(-r * 0.10, -r * 0.09, r * 0.40, r * 0.18, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#fed330';
        ctx.fillRect(r * 0.28, -r * 0.16, r * 0.09, r * 0.32);
        ctx.strokeRect(r * 0.28, -r * 0.16, r * 0.09, r * 0.32);

        ctx.fillStyle = flash ? '#ffffff' : '#b2bec3';
        ctx.beginPath();
        ctx.moveTo(r * 0.37, -r * 0.055);
        ctx.lineTo(r * 1.48, -r * 0.055);
        ctx.lineTo(r * 1.72, 0);
        ctx.lineTo(r * 1.48, r * 0.055);
        ctx.lineTo(r * 0.37, r * 0.055);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            const chunks = [
                { x: r * 0.56, w: r * 0.24, h: r * 0.28, col: '#b86228' },
                { x: r * 0.80, w: r * 0.12, h: r * 0.30, col: '#20bf6b' },
                { x: r * 0.96, w: r * 0.24, h: r * 0.28, col: '#a04d1c' },
                { x: r * 1.20, w: r * 0.12, h: r * 0.28, col: '#be2edd' },
                { x: r * 1.35, w: r * 0.16, h: r * 0.22, col: '#eb3b5a' }
            ];
            for (const c of chunks) {
                ctx.fillStyle = c.col;
                ctx.beginPath();
                ctx.roundRect(c.x - c.w / 2, -c.h / 2, c.w, c.h, 4);
                ctx.fill();
                ctx.stroke();
            }

            const flicker = Math.sin(age * 0.42) * 3.5;
            const flameScale = (isEnraged || isDashing) ? 1.35 : 1.0;
            ctx.fillStyle = 'rgba(255, 107, 53, 0.85)';
            ctx.beginPath();
            ctx.ellipse(r * 1.15, 0, r * 0.44 * flameScale, (r * 0.24 + flicker * 0.6) * flameScale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(254, 211, 48, 0.9)';
            ctx.beginPath();
            ctx.arc(r * 1.54, 0, (r * 0.13 + Math.abs(flicker) * 0.5) * flameScale, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = flash ? '#ffffff' : '#ff6b6b';
        ctx.beginPath();
        ctx.arc(r * 0.12, r * 0.02, r * 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}

if (typeof window !== 'undefined') {
    window.SouvlakiBrawlerRenderer = SouvlakiBrawlerRenderer;
}