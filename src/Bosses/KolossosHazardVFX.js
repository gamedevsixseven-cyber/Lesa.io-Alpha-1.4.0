/**
 * Lesa.io - Kolossos MK-IV Hazard & Attack Visual FX Renderer
 * Renders Laser Cross-Grids + active laser flashes, Magnetic Singularity Vortexes,
 * Omega Thermal Laser Beams, and the Phase-3 Solar Reactor Nova ultimate.
 */

class KolossosHazardVFX {
    static drawWorldHazards(ctx, boss) {
        if (!ctx || !boss) return;
        const now = boss.age || 0;

        this.drawLaserGridTelegraphs(ctx, boss, now);
        this.drawLaserGridFlashes(ctx, boss);
        this.drawGravityWells(ctx, boss, now);
        this.drawJumpTelegraph(ctx, boss, now);
        this.drawLeapShockwaves(ctx, boss);
        this.drawSolarNova(ctx, boss, now);
    }

    static drawJumpTelegraph(ctx, boss, now) {
        const j = boss.jumpAttack;
        if (!j) return;
        const p = j.phase === 'telegraph'
            ? Math.max(0, Math.min(1, 1 - j.timer / j.maxTimer)) * 0.45
            : 0.45 + Math.max(0, Math.min(1, 1 - j.timer / j.maxTimer)) * 0.55;

        ctx.save();
        // Dashed flight trajectory line from boss floor coords to locked slam crater
        ctx.strokeStyle = `rgba(255, 165, 2, ${0.35 + p * 0.45})`;
        ctx.lineWidth = 3;
        ctx.setLineDash([12, 10]);
        ctx.lineDashOffset = -now * 5;
        ctx.beginPath();
        ctx.moveTo(boss.x, boss.y);
        ctx.lineTo(j.targetX, j.targetY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.translate(j.targetX, j.targetY);
        const r = j.impactRadius || 185;
        const grad = ctx.createRadialGradient(0, 0, 12, 0, 0, r);
        grad.addColorStop(0, `rgba(255, 211, 42, ${0.18 + p * 0.34})`);
        grad.addColorStop(0.65, `rgba(255, 46, 76, ${0.22 + p * 0.36})`);
        grad.addColorStop(1, 'rgba(255, 46, 76, 0.06)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Expanding fill timing ring & crisp outer slam perimeter
        ctx.strokeStyle = p > 0.80 ? '#ffffff' : '#ff2e4c';
        ctx.lineWidth = p > 0.80 ? 4.2 : 3.0;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#fed330';
        ctx.lineWidth = 2.8;
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(16, r * p), 0, Math.PI * 2);
        ctx.stroke();

        // Crosshair lock lines + clear "DASH!" warning tag
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-26, 0); ctx.lineTo(26, 0);
        ctx.moveTo(0, -26); ctx.lineTo(0, 26);
        ctx.stroke();

        ctx.fillStyle = p > 0.80 ? '#ffffff' : '#fed330';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DASH!', 0, -34);
        ctx.restore();
    }

    static drawLeapShockwaves(ctx, boss) {
        const list = boss.leapShockwaves || [];
        for (let i = 0; i < list.length; i++) {
            const sw = list[i];
            const ratio = Math.max(0, 1 - sw.radius / sw.maxRadius);
            ctx.save();
            ctx.globalAlpha = Math.min(1, ratio * 1.45 + 0.15);
            ctx.beginPath();
            ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 46, 76, 0.55)';
            ctx.lineWidth = sw.thickness * 1.35;
            ctx.stroke();

            ctx.strokeStyle = '#ffa502';
            ctx.lineWidth = sw.thickness * 0.65;
            ctx.stroke();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3.5;
            ctx.stroke();
            ctx.restore();
        }
    }

    static drawLaserGridTelegraphs(ctx, boss, now) {
        const list = boss.laserGrids || [];
        for (let i = 0; i < list.length; i++) {
            const g = list[i];
            const p = Math.max(0, Math.min(1, 1 - g.timer / g.maxTimer));
            ctx.save();
            ctx.translate(g.cx, g.cy);
            for (let a = 0; a < g.angles.length; a++) {
                ctx.save();
                ctx.rotate(g.angles[a]);
                ctx.fillStyle = `rgba(255, 46, 76, ${0.12 + p * 0.24})`;
                ctx.fillRect(-g.span * 0.5, -g.halfWidth, g.span, g.halfWidth * 2);

                // Animated hazard chevron rails along lane
                ctx.strokeStyle = `rgba(255, 165, 2, ${0.28 + p * 0.45})`;
                ctx.lineWidth = 2;
                const shift = (now * 10) % 60;
                ctx.beginPath();
                for (let x = -g.span * 0.5 + shift; x < g.span * 0.5 - 12; x += 60) {
                    ctx.moveTo(x - 10, -g.halfWidth * 0.6);
                    ctx.lineTo(x + 6, 0);
                    ctx.lineTo(x - 10, g.halfWidth * 0.6);
                }
                ctx.stroke();

                // Swelling plasma core bar from center
                const fillH = g.halfWidth * 2 * p;
                ctx.fillStyle = p > 0.78 ? 'rgba(255, 224, 102, 0.58)' : 'rgba(255, 71, 87, 0.40)';
                ctx.fillRect(-g.span * 0.5, -fillH * 0.5, g.span, fillH);

                // Crisp laser containment edges
                ctx.strokeStyle = p > 0.80 ? '#ffffff' : '#ff2e4c';
                ctx.lineWidth = p > 0.80 ? 3.2 : 2.4;
                ctx.strokeRect(-g.span * 0.5, -g.halfWidth, g.span, g.halfWidth * 2);
                ctx.restore();
            }
            ctx.fillStyle = p > 0.78 ? '#ffffff' : '#fed330';
            ctx.strokeStyle = '#ff2e4c';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, 11 + p * 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
    }

    static drawLaserGridFlashes(ctx, boss) {
        const list = boss.laserFlashes || [];
        for (let i = 0; i < list.length; i++) {
            const f = list[i];
            if (!f || !Array.isArray(f.angles) || !f.maxTimer) continue;
            const ratio = Math.max(0, f.timer / f.maxTimer);
            const wScale = 0.5 + ratio * 0.9;
            ctx.save();
            ctx.translate(f.cx, f.cy);
            ctx.globalAlpha = Math.min(1, ratio * 1.25);
            for (let a = 0; a < f.angles.length; a++) {
                ctx.save();
                ctx.rotate(f.angles[a]);
                ctx.fillStyle = 'rgba(255, 46, 76, 0.45)';
                ctx.fillRect(-f.span * 0.5, -f.halfWidth * wScale, f.span, f.halfWidth * 2 * wScale);
                ctx.fillStyle = '#ff9f43';
                ctx.fillRect(-f.span * 0.5, -f.halfWidth * 0.55 * wScale, f.span, f.halfWidth * 1.1 * wScale);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(-f.span * 0.5, -f.halfWidth * 0.24 * wScale, f.span, f.halfWidth * 0.48 * wScale);
                ctx.restore();
            }
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, 26 * ratio, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    static drawGravityWells(ctx, boss, now) {
        const list = boss.gravityWells || [];
        for (let i = 0; i < list.length; i++) {
            const w = list[i];
            const p = Math.max(0, Math.min(1, 1 - w.timer / w.maxTimer));
            ctx.save();
            ctx.translate(w.x, w.y);

            if (w.phase === 'windup') {
                ctx.fillStyle = `rgba(180, 20, 48, ${0.14 + p * 0.24})`;
                ctx.beginPath();
                ctx.arc(0, 0, w.blastRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ff2e4c';
                ctx.lineWidth = 3;
                ctx.setLineDash([10, 6]);
                ctx.lineDashOffset = -now * 2;
                ctx.beginPath();
                ctx.arc(0, 0, w.pullRadius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            } else {
                const grad = ctx.createRadialGradient(0, 0, 8, 0, 0, w.pullRadius);
                grad.addColorStop(0, 'rgba(18, 4, 10, 0.90)');
                grad.addColorStop(0.55, 'rgba(255, 46, 76, 0.28)');
                grad.addColorStop(1, 'rgba(255, 46, 76, 0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(0, 0, w.pullRadius, 0, Math.PI * 2);
                ctx.fill();

                // Swirling inward vortex arms
                ctx.save();
                ctx.rotate(-now * 0.11);
                ctx.strokeStyle = 'rgba(255, 165, 2, 0.55)';
                ctx.lineWidth = 2.4;
                for (let arm = 0; arm < 6; arm++) {
                    const baseA = (arm / 6) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.arc(0, 0, w.pullRadius * 0.72, baseA, baseA + 0.55);
                    ctx.stroke();
                }
                ctx.restore();

                // Inner blast ring + contracting horizon rings
                ctx.strokeStyle = p > 0.75 ? '#ffffff' : '#ff4757';
                ctx.lineWidth = 2.8;
                ctx.beginPath();
                ctx.arc(0, 0, w.blastRadius, 0, Math.PI * 2);
                ctx.stroke();

                ctx.save();
                ctx.rotate(now * 0.09);
                ctx.strokeStyle = p > 0.75 ? '#ffffff' : '#ffa502';
                ctx.lineWidth = 3;
                for (let k = 0; k < 3; k++) {
                    const sa = (k / 3) * Math.PI * 2;
                    ctx.beginPath();
                    ctx.arc(0, 0, Math.max(18, w.blastRadius * (1 - p * 0.58)), sa, sa + 1.25);
                    ctx.stroke();
                }
                ctx.restore();

                ctx.fillStyle = '#141418';
                ctx.strokeStyle = '#ff2e4c';
                ctx.lineWidth = 3.2;
                ctx.beginPath();
                ctx.arc(0, 0, 19 + Math.sin(now * 0.35) * 3.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    static drawSolarNova(ctx, boss, now) {
        const sn = boss.solarNova;
        if (!sn) return;
        ctx.save();
        ctx.translate(sn.x, sn.y);

        if (sn.phase === 'windup') {
            const p = Math.max(0, Math.min(1, 1 - sn.timer / sn.maxTimer));

            // 1. 8 Star-Fissure Lance Lanes (safe wedges remain clearly visible between them!)
            for (let i = 0; i < sn.rayAngles.length; i++) {
                ctx.save();
                ctx.rotate(sn.rayAngles[i]);
                ctx.fillStyle = `rgba(255, 71, 87, ${0.14 + p * 0.25})`;
                ctx.fillRect(0, -sn.rayHalfWidth, sn.rayLength, sn.rayHalfWidth * 2);

                const beamH = sn.rayHalfWidth * 2 * p;
                ctx.fillStyle = p > 0.76 ? 'rgba(255, 224, 102, 0.65)' : 'rgba(255, 165, 2, 0.42)';
                ctx.fillRect(0, -beamH * 0.5, sn.rayLength, beamH);

                ctx.strokeStyle = p > 0.78 ? '#ffffff' : '#ff2e4c';
                ctx.lineWidth = 2.2;
                ctx.strokeRect(0, -sn.rayHalfWidth, sn.rayLength, sn.rayHalfWidth * 2);
                ctx.restore();
            }

            // 2. Central Supernova Blast Dome + Converging Solar Rings
            const domGrad = ctx.createRadialGradient(0, 0, 12, 0, 0, sn.innerRadius);
            domGrad.addColorStop(0, `rgba(255, 211, 42, ${0.30 + p * 0.35})`);
            domGrad.addColorStop(0.7, `rgba(255, 46, 76, ${0.22 + p * 0.30})`);
            domGrad.addColorStop(1, 'rgba(255, 46, 76, 0.06)');
            ctx.fillStyle = domGrad;
            ctx.beginPath();
            ctx.arc(0, 0, sn.innerRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = p > 0.78 ? '#ffffff' : '#ff2e4c';
            ctx.lineWidth = 3.6;
            ctx.beginPath();
            ctx.arc(0, 0, sn.innerRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Contracting charge circle
            ctx.strokeStyle = '#fed330';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, Math.max(24, sn.innerRadius * p), 0, Math.PI * 2);
            ctx.stroke();
        } else {
            // Blinding Solar Nova Eruption Beams fading smoothly
            const ratio = Math.max(0, sn.timer / sn.maxTimer);
            ctx.globalAlpha = Math.min(1, ratio * 1.3);
            for (let i = 0; i < sn.rayAngles.length; i++) {
                ctx.save();
                ctx.rotate(sn.rayAngles[i]);
                ctx.fillStyle = 'rgba(255, 46, 76, 0.52)';
                ctx.fillRect(0, -sn.rayHalfWidth * 1.15, sn.rayLength, sn.rayHalfWidth * 2.3);
                ctx.fillStyle = '#ffa502';
                ctx.fillRect(0, -sn.rayHalfWidth * 0.62, sn.rayLength, sn.rayHalfWidth * 1.24);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, -sn.rayHalfWidth * 0.25, sn.rayLength, sn.rayHalfWidth * 0.50);
                ctx.restore();
            }
            const blastR = sn.innerRadius * (1.25 - ratio * 0.25);
            const g = ctx.createRadialGradient(0, 0, 10, 0, 0, blastR);
            g.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
            g.addColorStop(0.5, 'rgba(255, 165, 2, 0.68)');
            g.addColorStop(1, 'rgba(255, 46, 76, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(0, 0, blastR, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    static drawOmegaBeam(ctx, boss) {
        const b = boss.omegaBeam;
        if (!b) return;
        const age = boss.age || 0;
        ctx.save();
        ctx.translate(boss.x, boss.y);

        if (b.phase === 'windup') {
            const p = Math.max(0, Math.min(1, 1 - b.timer / b.maxTimer));
            const sA = Math.min(b.startAngle, b.endAngle);
            const eA = Math.max(b.startAngle, b.endAngle);

            ctx.fillStyle = `rgba(255, 46, 76, ${0.10 + p * 0.17})`;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, b.length, sA, eA);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = 'rgba(255, 165, 2, 0.45)';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(0, 0, b.length * 0.68, sA, eA);
            ctx.stroke();

            ctx.save();
            ctx.rotate(b.startAngle);
            ctx.strokeStyle = p > 0.72 ? '#ffffff' : '#ff2e4c';
            ctx.lineWidth = 3.5 + p * 4.5;
            ctx.setLineDash([18, 10]);
            ctx.lineDashOffset = -age * 4;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(b.length, 0);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();

            ctx.fillStyle = p > 0.72 ? '#ffffff' : '#ffa502';
            ctx.beginPath();
            ctx.arc(0, 0, 12 + p * 14, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.rotate(b.currentAngle);
            const pulse = 1 + Math.sin(age * 0.75) * 0.13;
            ctx.lineCap = 'round';

            ctx.strokeStyle = 'rgba(255, 46, 76, 0.36)';
            ctx.lineWidth = 48 * pulse;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(b.length, 0); ctx.stroke();

            ctx.strokeStyle = '#ff2e4c';
            ctx.lineWidth = 26 * pulse;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(b.length, 0); ctx.stroke();

            ctx.strokeStyle = '#ffa502';
            ctx.lineWidth = 13 * pulse;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(b.length, 0); ctx.stroke();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 5.5;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(b.length, 0); ctx.stroke();

            // Traveling energy pulses & scorching tip flare
            const ringOffset = (age * 42) % 240;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
            ctx.lineWidth = 2.6;
            for (let rx = ringOffset; rx < b.length; rx += 240) {
                ctx.beginPath();
                ctx.ellipse(rx, 0, 5, 18 * pulse, 0, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.fillStyle = '#ffa502';
            ctx.beginPath();
            ctx.arc(b.length, 0, 20 * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, 23 * pulse, 0, Math.PI * 2);
            ctx.arc(b.length, 0, 10 * pulse, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.KolossosHazardVFX = KolossosHazardVFX;
}
