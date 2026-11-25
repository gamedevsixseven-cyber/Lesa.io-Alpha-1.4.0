/**
 * Lesa.io - Endless Hard 2.5D Renderer: Eclipse Harbinger
 * Apex blood-gold Seraph Knight featuring multi-plumed Crimson-Gold Wings,
 * rotating shattered gold halo, ornate engraved breastplate & plumed war-helm,
 * flowing scarlet cape ribbons, war banner aura, and massive aimed Eclipse Glaive.
 */

class EclipseHarbingerRenderer {
    static draw(ctx, e) {
        const r = e.radius || 30;
        const flash = e.hitFlash > 0;
        const age = e.age || 0;
        const aimAngle = e.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const glaiveBehind = Math.sin(aimAngle) < -0.25;
        const charging = (e.novaWindup || 0) > 0;
        const hover = Math.sin(age * 0.10) * 3.8;

        this.drawWarBannerAndTelegraph(ctx, e, r, age, charging);
        EndlessEnemyRenderer.drawShadow(ctx, e.x, e.y, r, 1.10, 0.38);

        ctx.save();
        ctx.translate(e.x, e.y + hover);
        ctx.lineWidth = 2.8;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#12060a';

        const glaiveSpin = charging ? age * 0.22 : aimAngle;
        if (glaiveBehind) {
            EndlessEnemyRenderer.drawAimedLayer(ctx, glaiveSpin, 0, 0, () => {
                this.drawEclipseGlaive(ctx, r, charging, flash);
            });
        }

        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);
        this.drawSolarEclipseHalo(ctx, r, age, flash);
        this.drawPlumedSeraphWings(ctx, r, age, charging, flash);
        EndlessEnemyRenderer.drawLimbs(ctx, r, e.walkCycle || age * 0.14, '#1e1b24', '#450a0a', flash);
        this.drawCrusaderArmor(ctx, r, isBack, flash);
        this.drawPlumedWarHelm(ctx, r, isBack, flash);
        ctx.restore();

        if (!glaiveBehind) {
            EndlessEnemyRenderer.drawAimedLayer(ctx, glaiveSpin, 0, r * 0.04, () => {
                this.drawEclipseGlaive(ctx, r, charging, flash);
            });
        }
        ctx.restore();

        e.drawBubbleTrap(ctx);
        e.drawOverheadHUD(ctx);
    }

    static drawWarBannerAndTelegraph(ctx, e, r, age, charging) {
        ctx.save();
        ctx.strokeStyle = 'rgba(254, 211, 48, 0.24)';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([12, 10]);
        ctx.lineDashOffset = -age * 0.8;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.auraRadius || 230, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);

        if (charging) {
            const p = 1 - Math.max(0, e.novaWindup / (e.novaWindupMax || 34));
            ctx.fillStyle = `rgba(255, 46, 76, ${0.12 + p * 0.22})`;
            ctx.strokeStyle = '#fed330'; ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(e.x, e.y, 175, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(e.x, e.y, 175 * Math.max(0.12, p), 0, Math.PI * 2); ctx.stroke();
        }
        ctx.restore();
    }

    static drawSolarEclipseHalo(ctx, r, age, flash) {
        if (flash) return;
        ctx.save();
        ctx.translate(0, -r * 0.78);
        ctx.rotate(age * 0.025);
        ctx.strokeStyle = '#fed330'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, 0, r * 0.62, -2.5, 2.5); ctx.stroke();
        ctx.fillStyle = '#ff2e4c';
        for (const a of [-1.8, 0, 1.8]) {
            ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62, 3.2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    static drawPlumedSeraphWings(ctx, r, age, charging, flash) {
        const lift = charging ? -0.35 : Math.sin(age * 0.14) * 0.16;
        for (const s of [-1, 1]) {
            ctx.save();
            ctx.translate(s * r * 0.22, -r * 0.22);
            ctx.rotate(s * lift);
            // 3 layered crimson-and-gold blade-feathers per wing
            const feathers = [
                { len: r * 1.72, ang: -0.58, col: '#9f1239' },
                { len: r * 1.45, ang: -0.22, col: '#be123c' },
                { len: r * 1.12, ang: 0.16, col: '#881337' }
            ];
            for (const f of feathers) {
                ctx.save();
                ctx.rotate(s * f.ang);
                ctx.fillStyle = flash ? '#ffffff' : f.col;
                ctx.beginPath();
                ctx.moveTo(0, -5);
                ctx.quadraticCurveTo(s * f.len * 0.65, -10, s * f.len, 0);
                ctx.quadraticCurveTo(s * f.len * 0.65, 8, 0, 5);
                ctx.closePath(); ctx.fill(); ctx.stroke();
                if (!flash) {
                    ctx.strokeStyle = '#fed330'; ctx.lineWidth = 1.6;
                    ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(s * f.len * 0.85, 0); ctx.stroke();
                    ctx.strokeStyle = '#12060a'; ctx.lineWidth = 2.6;
                }
                ctx.restore();
            }
            ctx.restore();
        }
    }

    static drawCrusaderArmor(ctx, r, isBack, flash) {
        // Scarlet split cape behind torso
        ctx.fillStyle = flash ? '#ffffff' : '#7f1d1d';
        ctx.beginPath();
        ctx.moveTo(-r * 0.56, -r * 0.30); ctx.lineTo(r * 0.56, -r * 0.30);
        ctx.lineTo(r * 0.44, r * 0.88); ctx.lineTo(0, r * 0.68); ctx.lineTo(-r * 0.44, r * 0.88);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // Gilded Obsidian Cuirass
        if (!flash) {
            const g = ctx.createLinearGradient(0, -r * 0.42, 0, r * 0.44);
            g.addColorStop(0, '#27272a'); g.addColorStop(1, '#09090b');
            ctx.fillStyle = g;
        } else ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.roundRect(-r * 0.46, -r * 0.36, r * 0.92, r * 0.78, 7); ctx.fill(); ctx.stroke();

        // Ornate Gold Shoulder Guards
        for (const s of [-1, 1]) {
            ctx.fillStyle = flash ? '#ffffff' : '#b45309';
            ctx.beginPath(); ctx.roundRect(s > 0 ? r * 0.34 : -r * 0.74, -r * 0.46, r * 0.40, r * 0.34, 6); ctx.fill(); ctx.stroke();
            if (!flash) {
                ctx.fillStyle = '#ff2e4c';
                ctx.beginPath(); ctx.arc(s * r * 0.54, -r * 0.30, 3.8, 0, Math.PI * 2); ctx.fill();
            }
        }

        if (flash || isBack) return;
        // Engraved Solar-Eclipse Chest Crest + Gold Belt
        ctx.fillStyle = '#fed330';
        ctx.beginPath(); ctx.arc(0, -r * 0.08, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ff2e4c';
        ctx.beginPath(); ctx.arc(0, -r * 0.08, 4.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#d97706';
        ctx.fillRect(-r * 0.46, r * 0.18, r * 0.92, r * 0.12);
    }

    static drawPlumedWarHelm(ctx, r, isBack, flash) {
        // High Crimson Crest Plume
        ctx.fillStyle = flash ? '#ffffff' : '#e11d48';
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.94);
        ctx.quadraticCurveTo(-r * 0.24, -r * 1.38, -r * 0.42, -r * 1.10);
        ctx.quadraticCurveTo(-r * 0.14, -r * 0.94, 0, -r * 0.84);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#18181b';
        ctx.beginPath(); ctx.roundRect(-r * 0.32, -r * 0.96, r * 0.64, r * 0.54, 9); ctx.fill(); ctx.stroke();
        if (flash || isBack) return;

        // Gold Barbute T-Visor Trim & Glowing Eyes
        ctx.strokeStyle = '#fed330'; ctx.lineWidth = 2.4;
        ctx.strokeRect(-r * 0.24, -r * 0.80, r * 0.48, r * 0.26);
        ctx.fillStyle = '#ff2e4c';
        ctx.fillRect(-r * 0.20, -r * 0.74, r * 0.14, 4);
        ctx.fillRect(r * 0.06, -r * 0.74, r * 0.14, 4);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(-r * 0.14, -r * 0.73, 3, 2.5);
        ctx.fillRect(r * 0.10, -r * 0.73, 3, 2.5);
        ctx.strokeStyle = '#12060a'; ctx.lineWidth = 2.8;
    }

    static drawEclipseGlaive(ctx, r, charging, flash) {
        ctx.fillStyle = flash ? '#ffffff' : '#27272a';
        ctx.beginPath(); ctx.roundRect(-r * 0.35, -3, r * 1.78, 6, 3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = flash ? '#ffffff' : (charging ? '#fef08a' : '#be123c');
        ctx.beginPath();
        ctx.moveTo(r * 1.05, -3);
        ctx.quadraticCurveTo(r * 1.38, -22, r * 1.62, 0);
        ctx.quadraticCurveTo(r * 1.38, 22, r * 1.05, 3);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        if (!flash) {
            ctx.strokeStyle = '#fed330'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(r * 1.32, 0, 12, -1.2, 1.2); ctx.stroke();
        }
    }
}

if (typeof window !== 'undefined') window.EclipseHarbingerRenderer = EclipseHarbingerRenderer;
if (typeof module !== 'undefined' && module.exports) module.exports = { EclipseHarbingerRenderer };
