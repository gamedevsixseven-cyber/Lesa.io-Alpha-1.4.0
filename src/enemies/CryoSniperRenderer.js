/**
 * Lesa.io - Endless Hard 2.5D Renderer: Glacial Marksman (Cryo Sniper)
 * Arctic-obsidian sharpshooter with frosted mantle, crystalline monocle visor,
 * dorsal liquid-nitrogen tank pack, shimmering Frost Laser Sight telegraph,
 * and an elongated Cryo-Rail Sniper Rifle.
 */

class CryoSniperRenderer {
    static draw(ctx, e) {
        const r = e.radius || 25;
        const flash = e.hitFlash > 0;
        const age = e.age || 0;
        const aimAngle = e.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const gunBehind = Math.sin(aimAngle) < -0.25;
        const bob = Math.sin(e.walkCycle || age * 0.16) * 2;

        this.drawLaserTelegraph(ctx, e, r);
        EndlessEnemyRenderer.drawShadow(ctx, e.x, e.y, r, 0.94, 0.36);

        ctx.save();
        ctx.translate(e.x, e.y + bob);
        ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = '#081826';

        const ax = facingLeft ? -r * 0.22 : r * 0.22;
        if (gunBehind) {
            EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle, ax, 0, () => {
                this.drawCryoRailRifle(ctx, r, (e.aimWindup || 0) > 0, flash);
            });
        }

        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);
        EndlessEnemyRenderer.drawLimbs(ctx, r, e.walkCycle || age * 0.16, '#1e293b', '#0f172a', flash);
        if (!isBack) this.drawNitrogenPack(ctx, r, false, flash);
        this.drawArcticCloak(ctx, r, isBack, flash);
        if (isBack) this.drawNitrogenPack(ctx, r, true, flash);
        this.drawSniperHoodHead(ctx, r, isBack, flash);
        ctx.restore();

        if (!gunBehind) {
            EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle, ax, r * 0.04, () => {
                this.drawCryoRailRifle(ctx, r, (e.aimWindup || 0) > 0, flash);
            });
        }
        ctx.restore();

        e.drawBubbleTrap(ctx);
        e.drawOverheadHUD(ctx);
    }

    static drawLaserTelegraph(ctx, e, r) {
        if ((e.aimWindup || 0) <= 0) return;
        const locked = e.aimWindup <= 18;
        const a = locked ? e.lockedAngle : e.angle;
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(a);
        ctx.strokeStyle = locked ? 'rgba(224, 242, 254, 0.92)' : 'rgba(56, 189, 248, 0.55)';
        ctx.lineWidth = locked ? 3.2 : 1.8;
        if (!locked) ctx.setLineDash([12, 8]);
        ctx.beginPath(); ctx.moveTo(r * 1.2, 0); ctx.lineTo(640, 0); ctx.stroke();
        ctx.restore();
    }

    static drawNitrogenPack(ctx, r, isBack, flash) {
        if (!isBack) {
            ctx.fillStyle = flash ? '#ffffff' : '#0284c7';
            ctx.beginPath(); ctx.roundRect(-r * 0.66, -r * 0.34, r * 0.22, r * 0.50, 5); ctx.fill(); ctx.stroke();
            return;
        }
        ctx.fillStyle = flash ? '#ffffff' : '#1e293b';
        ctx.beginPath(); ctx.roundRect(-r * 0.42, -r * 0.38, r * 0.84, r * 0.58, 6); ctx.fill(); ctx.stroke();
        if (flash) return;
        for (const cx of [-r * 0.20, r * 0.20]) {
            ctx.fillStyle = '#0ea5e9';
            ctx.beginPath(); ctx.roundRect(cx - 5.5, -r * 0.32, 11, r * 0.46, 4); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#e0f2fe'; ctx.fillRect(cx - 2, -r * 0.26, 4, r * 0.30);
        }
    }

    static drawArcticCloak(ctx, r, isBack, flash) {
        if (!flash) {
            const g = ctx.createLinearGradient(0, -r * 0.36, 0, r * 0.72);
            g.addColorStop(0, '#0c4a6e'); g.addColorStop(1, '#082f49');
            ctx.fillStyle = g;
        } else ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-r * 0.56, -r * 0.30); ctx.lineTo(r * 0.56, -r * 0.30);
        ctx.lineTo(r * 0.44, r * 0.68); ctx.lineTo(-r * 0.44, r * 0.68);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // Frosted fur/crystal collar mantle
        ctx.fillStyle = flash ? '#ffffff' : '#bae6fd';
        ctx.beginPath(); ctx.ellipse(0, -r * 0.28, r * 0.58, r * 0.18, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (!flash && !isBack) {
            ctx.fillStyle = '#334155'; ctx.fillRect(-r * 0.44, r * 0.16, r * 0.88, r * 0.12);
        }
    }

    static drawSniperHoodHead(ctx, r, isBack, flash) {
        ctx.fillStyle = flash ? '#ffffff' : '#0369a1';
        ctx.beginPath();
        ctx.moveTo(-r * 0.44, -r * 0.34);
        ctx.quadraticCurveTo(-r * 0.50, -r * 0.96, 0, -r * 1.06);
        ctx.quadraticCurveTo(r * 0.50, -r * 0.96, r * 0.44, -r * 0.34);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        if (flash || isBack) return;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.roundRect(-r * 0.28, -r * 0.72, r * 0.56, r * 0.32, 6); ctx.fill(); ctx.stroke();
        // Glowing Cryo Monocle Lens
        ctx.fillStyle = '#00f5ff';
        ctx.beginPath(); ctx.arc(r * 0.12, -r * 0.58, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(r * 0.14, -r * 0.60, 1.8, 0, Math.PI * 2); ctx.fill();
    }

    static drawCryoRailRifle(ctx, r, aiming, flash) {
        ctx.fillStyle = flash ? '#ffffff' : '#1e293b';
        ctx.beginPath(); ctx.roundRect(-4, -4, r * 1.68, 8, 3); ctx.fill(); ctx.stroke();
        if (flash) return;
        ctx.fillStyle = '#7dd3fc';
        ctx.fillRect(r * 0.45, -7.5, r * 0.36, 4);
        ctx.fillStyle = aiming ? '#ffffff' : '#00f5ff';
        ctx.fillRect(r * 0.55, -1.8, r * 1.05, 3.6);
        // Crystal bayonet muzzle tips
        ctx.fillStyle = '#bae6fd';
        ctx.beginPath(); ctx.moveTo(r * 1.64, -3); ctx.lineTo(r * 1.92, -6); ctx.lineTo(r * 1.72, -1); ctx.closePath(); ctx.fill();
    }
}

if (typeof window !== 'undefined') window.CryoSniperRenderer = CryoSniperRenderer;
if (typeof module !== 'undefined' && module.exports) module.exports = { CryoSniperRenderer };
