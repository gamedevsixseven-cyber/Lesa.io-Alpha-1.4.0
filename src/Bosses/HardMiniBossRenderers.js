/**
 * Lesa.io - Endless Hard Mode Mini-Boss 2.5D Vector Renderers:
 * - Wave 5: Malkor the Blood Executioner (spiked crimson-iron armor + giant Blood Cleaver)
 * - Wave 15: Kaelos, Warden of Stasis (rotating clockwork astrolabes + Temporal Halberd)
 */

class HardMiniBossRenderers {
    static drawExecutioner(ctx, b) {
        const r = b.radius || 40;
        const flash = b.hitFlash > 0;
        const age = b.age || 0;
        const aimAngle = b.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const axeBehind = Math.sin(aimAngle) < -0.25 && (b.whirlTimer || 0) <= 0;
        const airLift = b.isAirborne ? -Math.sin(Math.max(0, Math.min(1, b.leapProg || 0)) * Math.PI) * 95 : 0;

        EndlessBossRenderer.drawTelegraphs(ctx, b.telegraphs);
        if (b.leapTarget) {
            const p = Math.max(0, Math.min(1, b.leapProg || 0));
            ctx.save();
            ctx.fillStyle = `rgba(255, 46, 76, ${0.16 + p * 0.28})`;
            ctx.strokeStyle = '#ff2e4c'; ctx.lineWidth = 3.2;
            ctx.beginPath(); ctx.arc(b.leapTarget.x, b.leapTarget.y, 155, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(b.leapTarget.x, b.leapTarget.y, 155 * p, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        }
        EndlessBossRenderer.drawShadow(ctx, b.x, b.y, r, b.isEnraged, false);

        ctx.save();
        ctx.translate(b.x, b.y + airLift);
        ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = '#10080c';

        const axeAngle = (b.whirlTimer || 0) > 0 ? age * 0.34 : aimAngle;
        if (axeBehind) EndlessBossRenderer.drawAimedLayer(ctx, axeAngle, 0, 0, () => this._drawBloodCleaver(ctx, r, b.isEnraged, flash));

        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);
        EndlessBossRenderer.drawLegs(ctx, r, b.walkCycle || age * 0.16, '#1f1620', '#09060a', flash);
        // Crimson Tabard + Dark Executioner Plate Torso
        ctx.fillStyle = flash ? '#ffffff' : '#881337';
        ctx.beginPath(); ctx.roundRect(-r * 0.42, r * 0.08, r * 0.84, r * 0.62, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = flash ? '#ffffff' : '#27272a';
        ctx.beginPath(); ctx.roundRect(-r * 0.60, -r * 0.46, r * 1.20, r * 0.72, 9); ctx.fill(); ctx.stroke();
        for (const s of [-1, 1]) {
            ctx.fillStyle = flash ? '#ffffff' : '#3f3f46';
            ctx.beginPath();
            ctx.moveTo(s * r * 0.44, -r * 0.50); ctx.lineTo(s * r * 0.98, -r * 0.68);
            ctx.lineTo(s * r * 0.88, -r * 0.14); ctx.lineTo(s * r * 0.52, -r * 0.16);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        if (!flash && !isBack) {
            ctx.fillStyle = '#ff2e4c'; ctx.beginPath(); ctx.arc(0, -r * 0.12, 7.5, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#b45309'; ctx.fillRect(-r * 0.58, r * 0.16, r * 1.16, r * 0.14);
        }
        // Horned Executioner Helm
        ctx.fillStyle = flash ? '#ffffff' : '#18181b';
        ctx.beginPath(); ctx.roundRect(-r * 0.36, -r * 0.96, r * 0.72, r * 0.52, 8); ctx.fill(); ctx.stroke();
        for (const s of [-1, 1]) {
            ctx.fillStyle = flash ? '#ffffff' : '#9f1239';
            ctx.beginPath(); ctx.moveTo(s * r * 0.24, -r * 0.90); ctx.lineTo(s * r * 0.64, -r * 1.32); ctx.lineTo(s * r * 0.36, -r * 0.72); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        if (!flash && !isBack) {
            ctx.fillStyle = '#ff2e4c'; ctx.fillRect(-r * 0.22, -r * 0.74, r * 0.44, 5);
            ctx.fillStyle = '#fef08a'; ctx.fillRect(-r * 0.14, -r * 0.73, r * 0.10, 3); ctx.fillRect(r * 0.04, -r * 0.73, r * 0.10, 3);
        }
        ctx.restore();

        if (!axeBehind) EndlessBossRenderer.drawAimedLayer(ctx, axeAngle, 0, 0, () => this._drawBloodCleaver(ctx, r, b.isEnraged, flash));
        ctx.restore();
        EndlessBossRenderer.drawBossHUD(ctx, b);
    }

    static _drawBloodCleaver(ctx, r, enraged, flash) {
        ctx.fillStyle = flash ? '#ffffff' : '#334155';
        ctx.beginPath(); ctx.roundRect(-r * 0.25, -4, r * 1.72, 8, 3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = flash ? '#ffffff' : (enraged ? '#ff2e4c' : '#9f1239');
        ctx.beginPath();
        ctx.moveTo(r * 0.95, -5); ctx.lineTo(r * 1.56, -24);
        ctx.quadraticCurveTo(r * 1.76, 0, r * 1.56, 24); ctx.lineTo(r * 0.95, 5);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        if (!flash) {
            ctx.strokeStyle = '#fecdd3'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(r * 1.38, 0, 18, -0.95, 0.95); ctx.stroke();
        }
    }

    static drawChronoWarden(ctx, b) {
        const r = b.radius || 40;
        const flash = b.hitFlash > 0;
        const age = b.age || 0;
        const aimAngle = b.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const hover = Math.sin(age * 0.10) * 5;

        EndlessBossRenderer.drawTelegraphs(ctx, b.telegraphs);
        // Temporal Mirage Afterimage Clones aiming lasers
        for (const ec of (b._echoes || [])) {
            ctx.save();
            ctx.globalAlpha = Math.max(0.25, (ec.life / 85) * 0.65);
            ctx.fillStyle = 'rgba(56, 189, 248, 0.35)'; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.4;
            ctx.beginPath(); ctx.arc(ec.x, ec.y, r * 0.82, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            if (ec.aiming > 0) {
                ctx.rotate(0); ctx.beginPath(); ctx.moveTo(ec.x, ec.y);
                ctx.lineTo(ec.x + Math.cos(ec.ang) * 520, ec.y + Math.sin(ec.ang) * 520); ctx.stroke();
            }
            ctx.restore();
        }

        EndlessBossRenderer.drawShadow(ctx, b.x, b.y, r, b.isEnraged, false);
        ctx.save();
        ctx.translate(b.x, b.y + hover);
        ctx.lineWidth = 2.8; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = '#081224';

        // Rotating Bronze Astrolabe Gyroscope Rings behind Warden
        ctx.save(); ctx.rotate(age * (b.isEnraged ? 0.06 : 0.032));
        ctx.strokeStyle = '#eab308'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(0, 0, r * 1.25, r * 0.56, 0.3, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, 0, r * 1.25, r * 0.56, -0.3, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();

        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);
        ctx.fillStyle = flash ? '#ffffff' : '#0c4a6e';
        ctx.beginPath();
        ctx.moveTo(-r * 0.54, -r * 0.36); ctx.lineTo(r * 0.54, -r * 0.36);
        ctx.lineTo(r * 0.38, r * 0.56); ctx.lineTo(0, r * 0.84); ctx.lineTo(-r * 0.38, r * 0.56);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#00f5ff';
            ctx.beginPath(); ctx.moveTo(0, -r * 0.24); ctx.lineTo(10, 0); ctx.lineTo(0, r * 0.24); ctx.lineTo(-10, 0); ctx.closePath(); ctx.fill();
        }
        // Hourglass Crown Helm
        ctx.fillStyle = flash ? '#ffffff' : '#1e293b';
        ctx.beginPath(); ctx.roundRect(-r * 0.34, -r * 0.94, r * 0.68, r * 0.54, 9); ctx.fill(); ctx.stroke();
        if (!flash && !isBack) {
            ctx.fillStyle = '#38bdf8'; ctx.fillRect(-r * 0.22, -r * 0.72, r * 0.44, 7);
            ctx.fillStyle = '#fef08a'; ctx.beginPath(); ctx.arc(0, -r * 0.94, 5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();

        EndlessBossRenderer.drawAimedLayer(ctx, aimAngle, 0, 0, () => {
            ctx.fillStyle = flash ? '#ffffff' : '#334155';
            ctx.beginPath(); ctx.roundRect(0, -5, r * 1.56, 10, 4); ctx.fill(); ctx.stroke();
            if (!flash) {
                ctx.fillStyle = '#38bdf8';
                ctx.beginPath(); ctx.arc(r * 1.60, 0, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.strokeStyle = '#eab308'; ctx.lineWidth = 2.6;
                ctx.beginPath(); ctx.moveTo(r * 1.25, -14); ctx.lineTo(r * 1.68, 0); ctx.lineTo(r * 1.25, 14); ctx.stroke();
            }
        });
        ctx.restore();
        EndlessBossRenderer.drawBossHUD(ctx, b);
    }
}

if (typeof window !== 'undefined') window.HardMiniBossRenderers = HardMiniBossRenderers;
if (typeof module !== 'undefined' && module.exports) module.exports = { HardMiniBossRenderers };
