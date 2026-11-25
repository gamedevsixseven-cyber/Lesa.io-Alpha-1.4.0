/**
 * Lesa.io - Endless Hard 2.5D Renderer: Plague Weaver (Blight Necromancer)
 * Moss-obsidian apothecary necromancer with spinal bone-cage mutagen pack,
 * tattered blight robes, hooked plague mask with glowing emerald goggles,
 * bone crown, aimed Plague Censer Lantern, and bubbling Miasma Spore clouds.
 */

class BlightNecromancerRenderer {
    static draw(ctx, e) {
        const r = e.radius || 27;
        const flash = e.hitFlash > 0;
        const age = e.age || 0;
        const aimAngle = e.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const staffBehind = Math.sin(aimAngle) < -0.25;
        const bob = Math.sin(e.walkCycle || age * 0.14) * 2.5;

        this.drawMiasmaSpores(ctx, e, age);
        EndlessEnemyRenderer.drawShadow(ctx, e.x, e.y, r, 1.0, 0.38);

        ctx.save();
        ctx.translate(e.x, e.y + bob);
        ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = '#07140d';

        const ax = facingLeft ? -r * 0.24 : r * 0.24;
        if (staffBehind) {
            EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle, ax, 0, () => {
                this.drawPlagueCenser(ctx, r, age, (e.sporeWindup || 0) > 0, flash);
            });
        }

        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);
        EndlessEnemyRenderer.drawLimbs(ctx, r, e.walkCycle || age * 0.14, '#14261c', '#07140d', flash);
        if (!isBack) this.drawBoneMutagenPack(ctx, r, age, false, flash);
        this.drawPlagueRobes(ctx, r, age, isBack, flash);
        if (isBack) this.drawBoneMutagenPack(ctx, r, age, true, flash);
        this.drawPlagueMaskHead(ctx, r, isBack, flash);
        ctx.restore();

        if (!staffBehind) {
            EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle, ax, r * 0.04, () => {
                this.drawPlagueCenser(ctx, r, age, (e.sporeWindup || 0) > 0, flash);
            });
        }
        ctx.restore();

        e.drawBubbleTrap(ctx);
        e.drawOverheadHUD(ctx);
    }

    static drawMiasmaSpores(ctx, e, age) {
        for (const sp of (e._spores || [])) {
            const fade = Math.min(1, sp.life / 35);
            ctx.save();
            ctx.globalAlpha = fade;
            ctx.translate(sp.x, sp.y);
            const g = ctx.createRadialGradient(0, 0, 8, 0, 0, sp.radius);
            g.addColorStop(0, 'rgba(190, 242, 100, 0.34)');
            g.addColorStop(0.65, 'rgba(46, 213, 115, 0.20)');
            g.addColorStop(1, 'rgba(6, 78, 59, 0)');
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(0, 0, sp.radius, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(46, 213, 115, 0.65)'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
            ctx.lineDashOffset = -age * 0.6;
            ctx.beginPath(); ctx.arc(0, 0, sp.radius * 0.92, 0, Math.PI * 2); ctx.stroke();
            ctx.restore();
        }
    }

    static drawBoneMutagenPack(ctx, r, age, isBack, flash) {
        if (!isBack) {
            ctx.fillStyle = flash ? '#ffffff' : '#14532d';
            ctx.beginPath(); ctx.roundRect(-r * 0.68, -r * 0.36, r * 0.24, r * 0.56, 5); ctx.fill(); ctx.stroke();
            return;
        }
        ctx.fillStyle = flash ? '#ffffff' : '#1c2420';
        ctx.beginPath(); ctx.roundRect(-r * 0.44, -r * 0.40, r * 0.88, r * 0.62, 7); ctx.fill(); ctx.stroke();
        if (flash) return;
        for (const sx of [-r * 0.22, r * 0.22]) {
            ctx.fillStyle = '#10ac84'; ctx.fillRect(sx - 6, -r * 0.32, 12, r * 0.44);
            ctx.fillStyle = '#bef264'; ctx.beginPath();
            ctx.arc(sx, -r * 0.10 - ((age * 0.4) % 12), 2.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-r * 0.32, -r * 0.16, r * 0.64, 4);
    }

    static drawPlagueRobes(ctx, r, age, isBack, flash) {
        if (!flash) {
            const g = ctx.createLinearGradient(0, -r * 0.36, 0, r * 0.78);
            g.addColorStop(0, '#14532d'); g.addColorStop(1, '#052e16');
            ctx.fillStyle = g;
        } else ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-r * 0.58, -r * 0.30); ctx.lineTo(r * 0.58, -r * 0.30);
        ctx.lineTo(r * 0.46, r * 0.68); ctx.lineTo(0, r * 0.56); ctx.lineTo(-r * 0.46, r * 0.68);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // Tattered rib/bone shoulder guards
        for (const s of [-1, 1]) {
            ctx.fillStyle = flash ? '#ffffff' : '#e2e8f0';
            ctx.beginPath(); ctx.roundRect(s > 0 ? r * 0.34 : -r * 0.70, -r * 0.42, r * 0.36, r * 0.24, 5); ctx.fill(); ctx.stroke();
        }
        if (flash || isBack) return;
        ctx.fillStyle = '#bef264';
        for (const bx of [-6, 0, 6]) { ctx.beginPath(); ctx.arc(bx, -r * 0.12, 2.8, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = '#334155'; ctx.fillRect(-r * 0.46, r * 0.16, r * 0.92, r * 0.12);
    }

    static drawPlagueMaskHead(ctx, r, isBack, flash) {
        ctx.fillStyle = flash ? '#ffffff' : '#064e3b';
        ctx.beginPath(); ctx.arc(0, -r * 0.62, r * 0.44, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (flash || isBack) return;
        // Hooked bone plague-doctor mask + dual glowing toxic green goggles
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(-r * 0.28, -r * 0.62); ctx.lineTo(r * 0.28, -r * 0.62);
        ctx.lineTo(0, -r * 0.22); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#bef264';
        ctx.beginPath();
        ctx.arc(-r * 0.14, -r * 0.64, 4.2, 0, Math.PI * 2);
        ctx.arc(r * 0.14, -r * 0.64, 4.2, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
    }

    static drawPlagueCenser(ctx, r, age, casting, flash) {
        ctx.fillStyle = flash ? '#ffffff' : '#1e293b';
        ctx.beginPath(); ctx.roundRect(0, -3, r * 1.18, 6, 3); ctx.fill(); ctx.stroke();
        if (flash) return;
        ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.moveTo(r * 1.12, 0); ctx.lineTo(r * 1.24, 12 + Math.sin(age * 0.2) * 3); ctx.stroke();
        ctx.fillStyle = casting ? '#bef264' : '#2ed573'; ctx.strokeStyle = '#07140d'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(r * 1.24, 14 + Math.sin(age * 0.2) * 3, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
}

if (typeof window !== 'undefined') window.BlightNecromancerRenderer = BlightNecromancerRenderer;
if (typeof module !== 'undefined' && module.exports) module.exports = { BlightNecromancerRenderer };
