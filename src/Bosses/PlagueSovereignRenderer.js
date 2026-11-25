/**
 * Lesa.io - Endless Hard Mode Wave 10 Main Boss Renderer:
 * Malakor, Lord of Blight (Plague Sovereign)
 */

class PlagueSovereignRenderer {
    static draw(ctx, b) {
        const r = b.radius || 48;
        const flash = b.hitFlash > 0;
        const age = b.age || 0;
        const aimAngle = b.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const staffBehind = Math.sin(aimAngle) < -0.25;
        const hover = Math.sin(age * 0.08) * 3.5;

        if (typeof HardBossEntranceFX !== 'undefined') HardBossEntranceFX.drawEntrancePortal(ctx, b, '#2ed573', '#bef264');
        this.drawAcidZones(ctx, b);
        EndlessBossRenderer.drawTelegraphs(ctx, b.telegraphs);
        EndlessBossRenderer.drawShadow(ctx, b.x, b.y, r, b.isEnraged, false);

        ctx.save();
        ctx.translate(b.x, b.y + hover);
        ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = '#07140d';

        if (b.isEnraged && !flash) {
            ctx.strokeStyle = 'rgba(190, 242, 100, 0.55)'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(0, 0, r * 1.38 + Math.sin(age * 0.15) * 4, 0, Math.PI * 2); ctx.stroke();
            ctx.strokeStyle = '#07140d'; ctx.lineWidth = 3;
        }

        const ax = facingLeft ? -r * 0.30 : r * 0.30;
        if (staffBehind) EndlessBossRenderer.drawAimedLayer(ctx, aimAngle, ax, 0, () => this._drawBlightScythe(ctx, r, age, b.isEnraged, flash));

        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);
        // Floating Shoulder Skull-Cauldron Reliquaries
        for (const s of [-1, 1]) {
            const cy = -r * 0.36 + Math.sin(age * 0.12 + s) * 3;
            ctx.fillStyle = flash ? '#ffffff' : '#1c2420';
            ctx.beginPath(); ctx.arc(s * r * 0.96, cy, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            if (!flash) {
                ctx.fillStyle = b.isEnraged ? '#bef264' : '#2ed573';
                ctx.beginPath(); ctx.arc(s * r * 0.96, cy, 7.5, 0, Math.PI * 2); ctx.fill();
            }
        }
        // Tattered Sovereign Mantle & Emerald Plated Robes
        ctx.fillStyle = flash ? '#ffffff' : '#064e3b';
        ctx.beginPath();
        ctx.moveTo(-r * 0.72, -r * 0.35); ctx.lineTo(r * 0.72, -r * 0.35);
        ctx.lineTo(r * 0.58, r * 0.95); ctx.lineTo(0, r * 0.76); ctx.lineTo(-r * 0.58, r * 0.95);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = flash ? '#ffffff' : '#14532d';
        ctx.beginPath(); ctx.roundRect(-r * 0.50, -r * 0.36, r * 1.0, r * 0.84, 10); ctx.fill(); ctx.stroke();
        if (!flash && !isBack) {
            ctx.fillStyle = '#eab308'; ctx.fillRect(-r * 0.48, r * 0.22, r * 0.96, r * 0.14);
            ctx.fillStyle = '#bef264'; ctx.beginPath(); ctx.arc(0, -r * 0.04, 8, 0, Math.PI * 2); ctx.fill();
        }
        // Sovereign Horned Crown & Brass Plague Mask
        ctx.fillStyle = flash ? '#ffffff' : '#052e16';
        ctx.beginPath(); ctx.arc(0, -r * 0.62, r * 0.45, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        for (const s of [-1, 1]) {
            ctx.fillStyle = flash ? '#ffffff' : '#d97706';
            ctx.beginPath(); ctx.moveTo(s * r * 0.18, -r * 0.96); ctx.lineTo(s * r * 0.42, -r * 1.38); ctx.lineTo(s * r * 0.36, -r * 0.82); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
        if (!flash && !isBack) {
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath(); ctx.moveTo(-r * 0.28, -r * 0.62); ctx.lineTo(r * 0.28, -r * 0.62); ctx.lineTo(0, -r * 0.18); ctx.closePath(); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#bef264';
            ctx.beginPath(); ctx.arc(-r * 0.14, -r * 0.64, 5, 0, Math.PI * 2); ctx.arc(r * 0.14, -r * 0.64, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
        ctx.restore();

        if (!staffBehind) EndlessBossRenderer.drawAimedLayer(ctx, aimAngle, ax, 0, () => this._drawBlightScythe(ctx, r, age, b.isEnraged, flash));
        ctx.restore();
        if (!b.cutsceneState || b.cutsceneState === 'COMBAT') EndlessBossRenderer.drawBossHUD(ctx, b);
    }

    static drawAcidZones(ctx, b) {
        for (const z of (b._acidZones || [])) {
            const fade = Math.min(1, z.life / 45);
            const bub = 0.5 + 0.5 * Math.sin((b.age || 0) * 0.14 + z.x * 0.05);
            ctx.save(); ctx.globalAlpha = fade;
            const g = ctx.createRadialGradient(z.x, z.y, 4, z.x, z.y, z.radius);
            g.addColorStop(0, 'rgba(190, 242, 100, 0.42)');
            g.addColorStop(0.65, 'rgba(46, 213, 115, 0.26)');
            g.addColorStop(1, 'rgba(20, 83, 45, 0.10)');
            ctx.fillStyle = g; ctx.strokeStyle = 'rgba(7, 9, 15, 0.65)'; ctx.lineWidth = 4.5;
            ctx.beginPath(); ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.strokeStyle = '#2ed573'; ctx.lineWidth = 2.2; ctx.stroke();
            ctx.fillStyle = 'rgba(190, 242, 100, 0.55)';
            ctx.beginPath(); ctx.arc(z.x - z.radius * 0.28, z.y + z.radius * 0.12, 4 + bub * 4, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(z.x + z.radius * 0.26, z.y - z.radius * 0.18, 6 - bub * 3, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
    }

    static _drawBlightScythe(ctx, r, age, enraged, flash) {
        ctx.fillStyle = flash ? '#ffffff' : '#1e293b';
        ctx.beginPath(); ctx.roundRect(-r * 0.20, -4, r * 1.72, 8, 3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = flash ? '#ffffff' : (enraged ? '#bef264' : '#2ed573');
        ctx.beginPath();
        ctx.moveTo(r * 1.15, -4); ctx.quadraticCurveTo(r * 1.62, -32, r * 1.38, -50);
        ctx.quadraticCurveTo(r * 1.44, -14, r * 1.05, 4);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        if (!flash) {
            ctx.fillStyle = '#eab308';
            ctx.beginPath(); ctx.arc(r * 1.35, 0, 7.5 + Math.sin(age * 0.2) * 1.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
    }
}

if (typeof window !== 'undefined') window.PlagueSovereignRenderer = PlagueSovereignRenderer;
if (typeof module !== 'undefined' && module.exports) module.exports = { PlagueSovereignRenderer };
