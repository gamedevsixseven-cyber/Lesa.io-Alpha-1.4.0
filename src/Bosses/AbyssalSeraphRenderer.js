/**
 * Lesa.io - Endless Hard Mode Wave 20 Main Boss Renderer:
 * Vaelor, the Blood Eclipse Seraph
 */

class AbyssalSeraphRenderer {
    static draw(ctx, b) {
        const r = b.radius || 50;
        const flash = b.hitFlash > 0;
        const age = b.age || 0;
        const aimAngle = b.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const swordBehind = Math.sin(aimAngle) < -0.25;
        const hover = Math.sin(age * 0.09) * 4.5;

        if (typeof HardBossEntranceFX !== 'undefined') HardBossEntranceFX.drawEntrancePortal(ctx, b, '#ff2e4c', '#fed330');
        this.drawJudgmentBeams(ctx, b);
        EndlessBossRenderer.drawTelegraphs(ctx, b.telegraphs);
        EndlessBossRenderer.drawShadow(ctx, b.x, b.y, r, b.isEnraged || b.isCritical, true);

        ctx.save();
        ctx.translate(b.x, b.y + hover);
        ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = '#12060a';

        if (swordBehind) EndlessBossRenderer.drawAimedLayer(ctx, aimAngle, 0, 0, () => this._drawSolarGreatsword(ctx, r, b.isCritical, flash));

        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);

        // Dual Counter-Rotating Celestial Halos behind Seraph
        if (!flash) {
            ctx.save(); ctx.translate(0, -r * 0.35);
            ctx.rotate(age * 0.03);
            ctx.strokeStyle = '#fed330'; ctx.lineWidth = 3.6;
            ctx.beginPath(); ctx.arc(0, 0, r * 1.18, -2.5, 2.5); ctx.stroke();
            ctx.rotate(-age * 0.07);
            ctx.strokeStyle = '#ff2e4c'; ctx.lineWidth = 2.6;
            ctx.beginPath(); ctx.arc(0, 0, r * 0.92, -2.2, 2.2); ctx.stroke();
            ctx.restore();
        }

        // 6-Plumed Towering Crimson-Gold Seraph Wings
        const lift = (b.dashTimer || 0) > 0 ? -0.35 : Math.sin(age * 0.12) * 0.14;
        for (const s of [-1, 1]) {
            ctx.save(); ctx.translate(s * r * 0.24, -r * 0.20); ctx.rotate(s * lift);
            const blades = [
                { len: r * 1.95, ang: -0.68, col: '#9f1239' },
                { len: r * 1.68, ang: -0.32, col: '#be123c' },
                { len: r * 1.38, ang: 0.04, col: '#881337' },
                { len: r * 1.05, ang: 0.38, col: '#4c0519' }
            ];
            for (const f of blades) {
                ctx.save(); ctx.rotate(s * f.ang);
                ctx.fillStyle = flash ? '#ffffff' : f.col;
                ctx.beginPath(); ctx.moveTo(0, -6); ctx.quadraticCurveTo(s * f.len * 0.6, -12, s * f.len, 0);
                ctx.quadraticCurveTo(s * f.len * 0.6, 10, 0, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
                if (!flash) { ctx.strokeStyle = '#fed330'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(s * f.len * 0.85, 0); ctx.stroke(); ctx.strokeStyle = '#12060a'; ctx.lineWidth = 2.8; }
                ctx.restore();
            }
            ctx.restore();
        }

        // Gilded Archangel Plate + Flowing Cape
        ctx.fillStyle = flash ? '#ffffff' : '#7f1d1d';
        ctx.beginPath(); ctx.moveTo(-r * 0.64, -r * 0.25); ctx.lineTo(r * 0.64, -r * 0.25); ctx.lineTo(r * 0.50, r * 0.96); ctx.lineTo(0, r * 0.74); ctx.lineTo(-r * 0.50, r * 0.96); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = flash ? '#ffffff' : '#18181b';
        ctx.beginPath(); ctx.roundRect(-r * 0.52, -r * 0.40, r * 1.04, r * 0.82, 10); ctx.fill(); ctx.stroke();
        for (const s of [-1, 1]) {
            ctx.fillStyle = flash ? '#ffffff' : '#d97706';
            ctx.beginPath(); ctx.roundRect(s > 0 ? r * 0.38 : -r * 0.82, -r * 0.50, r * 0.44, r * 0.34, 7); ctx.fill(); ctx.stroke();
        }
        if (!flash && !isBack) {
            ctx.fillStyle = '#fed330'; ctx.beginPath(); ctx.arc(0, -r * 0.08, 10, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#ff2e4c'; ctx.beginPath(); ctx.arc(0, -r * 0.08, 6, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#d97706'; ctx.fillRect(-r * 0.50, r * 0.18, r * 1.0, r * 0.14);
        }
        // Crowned Seraph Helm
        ctx.fillStyle = flash ? '#ffffff' : '#18181b';
        ctx.beginPath(); ctx.roundRect(-r * 0.34, -r * 1.02, r * 0.68, r * 0.56, 9); ctx.fill(); ctx.stroke();
        if (!flash) {
            ctx.fillStyle = '#eab308';
            ctx.beginPath(); ctx.moveTo(-r * 0.30, -r * 0.94); ctx.lineTo(-r * 0.18, -r * 1.32); ctx.lineTo(0, -r * 1.08); ctx.lineTo(r * 0.18, -r * 1.32); ctx.lineTo(r * 0.30, -r * 0.94); ctx.closePath(); ctx.fill(); ctx.stroke();
            if (!isBack) {
                ctx.fillStyle = '#fef08a'; ctx.fillRect(-r * 0.22, -r * 0.78, r * 0.44, 5.5);
            }
        }
        ctx.restore();

        if (!swordBehind) EndlessBossRenderer.drawAimedLayer(ctx, aimAngle, 0, 0, () => this._drawSolarGreatsword(ctx, r, b.isCritical, flash));
        ctx.restore();
        if (!b.cutsceneState || b.cutsceneState === 'COMBAT') EndlessBossRenderer.drawBossHUD(ctx, b);
    }

    static drawJudgmentBeams(ctx, b) {
        for (const bm of (b._beams || [])) {
            const p = 1 - Math.max(0, bm.timer / bm.maxTimer);
            const active = bm.activeTimer > 0;
            ctx.save(); ctx.translate(bm.x, bm.y); ctx.rotate(bm.ang);
            if (!active) {
                ctx.fillStyle = `rgba(255, 46, 76, ${0.10 + p * 0.22})`;
                ctx.strokeStyle = '#fed330'; ctx.lineWidth = 2.4; ctx.setLineDash([16, 10]);
                ctx.fillRect(-750, -24, 1500, 48); ctx.strokeRect(-750, -24, 1500, 48);
            } else {
                ctx.fillStyle = 'rgba(255, 46, 76, 0.72)'; ctx.fillRect(-750, -26, 1500, 52);
                ctx.fillStyle = '#fef08a'; ctx.fillRect(-750, -9, 1500, 18);
            }
            ctx.restore();
        }
    }

    static _drawSolarGreatsword(ctx, r, critical, flash) {
        ctx.fillStyle = flash ? '#ffffff' : '#d97706';
        ctx.fillRect(0, -14, 10, 28); ctx.strokeRect(0, -14, 10, 28);
        ctx.fillStyle = flash ? '#ffffff' : (critical ? '#fef08a' : '#ff2e4c');
        ctx.beginPath();
        ctx.moveTo(8, -7); ctx.lineTo(r * 1.55, -10); ctx.lineTo(r * 1.88, 0);
        ctx.lineTo(r * 1.55, 10); ctx.lineTo(8, 7); ctx.closePath(); ctx.fill(); ctx.stroke();
        if (!flash) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(14, -2, r * 1.35, 4);
        }
    }
}

if (typeof window !== 'undefined') window.AbyssalSeraphRenderer = AbyssalSeraphRenderer;
if (typeof module !== 'undefined' && module.exports) module.exports = { AbyssalSeraphRenderer };
