/**
 * Lesa.io - Endless Hard 2.5D Renderer: Hellfire Mortar (Inferno Artillery)
 * 4-legged bronze-and-obsidian Siege Spider Construct featuring articulated
 * piston crab legs, glowing furnace boiler hull, rear ammo rack (isBack),
 * aimed volcanic bombard tube, and arced mortar strike reticles.
 */

class InfernoArtilleryRenderer {
    static draw(ctx, e) {
        const r = e.radius || 32;
        const flash = e.hitFlash > 0;
        const age = e.age || 0;
        const aimAngle = e.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const firing = (e.siegeWindup || 0) > 0;
        const bob = firing ? 1.5 : Math.sin(e.walkCycle || age * 0.16) * 2.2;

        this.drawMortarTargets(ctx, e);
        EndlessEnemyRenderer.drawShadow(ctx, e.x, e.y, r, 1.24, 0.46);

        ctx.save();
        ctx.translate(e.x, e.y + bob);
        ctx.lineWidth = 2.8; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = '#0e0b10';

        this.drawSpiderLegs(ctx, r, e.walkCycle || age * 0.16, flash);

        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);
        this.drawBoilerHull(ctx, r, age, isBack, flash);
        ctx.restore();

        EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle, 0, -r * 0.25, () => {
            this.drawMortarCannon(ctx, r, firing, flash);
        });
        ctx.restore();

        e.drawBubbleTrap(ctx);
        e.drawOverheadHUD(ctx);
    }

    static drawMortarTargets(ctx, e) {
        for (const m of (e._mortars || [])) {
            const p = 1 - Math.max(0, m.timer / m.maxTimer);
            ctx.save();
            ctx.fillStyle = `rgba(255, 107, 53, ${0.14 + p * 0.24})`;
            ctx.strokeStyle = '#ff2e4c'; ctx.lineWidth = 2.6;
            ctx.beginPath(); ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(m.x, m.y, Math.max(6, m.radius * p), 0, Math.PI * 2); ctx.stroke();
            // Descending burning mortar shell visual
            const arcY = m.y - Math.sin(p * Math.PI) * 190 - (1 - p) * 120;
            ctx.fillStyle = '#fed330'; ctx.strokeStyle = '#9a3412'; ctx.lineWidth = 2.2;
            ctx.beginPath(); ctx.arc(m.x, arcY, 8.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.restore();
        }
    }

    static drawSpiderLegs(ctx, r, cycle, flash) {
        const offsets = [
            { x: -r * 0.65, y: -r * 0.18, ang: -0.65, s: -1 },
            { x: r * 0.65, y: -r * 0.18, ang: 0.65, s: 1 },
            { x: -r * 0.60, y: r * 0.30, ang: 0.55, s: -1 },
            { x: r * 0.60, y: r * 0.30, ang: -0.55, s: 1 }
        ];
        offsets.forEach((leg, idx) => {
            const sw = Math.sin(cycle + idx * 1.5) * 4;
            ctx.save();
            ctx.translate(leg.x, leg.y);
            ctx.fillStyle = flash ? '#ffffff' : '#27272a';
            ctx.beginPath();
            ctx.moveTo(0, -4); ctx.lineTo(leg.s * r * 0.55, leg.ang * 14 - 8);
            ctx.lineTo(leg.s * r * 0.62, r * 0.42 + sw); ctx.lineTo(leg.s * r * 0.42, r * 0.42 + sw);
            ctx.lineTo(leg.s * r * 0.36, leg.ang * 10 + 4); ctx.lineTo(0, 4);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            if (!flash) {
                ctx.fillStyle = '#ff6b35';
                ctx.beginPath(); ctx.arc(leg.s * r * 0.44, leg.ang * 10 - 2, 3.6, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
        });
    }

    static drawBoilerHull(ctx, r, age, isBack, flash) {
        if (!flash) {
            const g = ctx.createRadialGradient(0, -r * 0.12, 6, 0, 0, r * 0.85);
            g.addColorStop(0, '#44403c'); g.addColorStop(1, '#18181b');
            ctx.fillStyle = g;
        } else ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.ellipse(0, 0, r * 0.82, r * 0.66, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        if (flash) return;

        // Bronze boiler rings & spinning core vent
        ctx.strokeStyle = '#d97706'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(0, 0, r * 0.72, r * 0.52, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = isBack ? '#9a3412' : '#ff6b35';
        ctx.beginPath(); ctx.arc(0, isBack ? -r * 0.08 : r * 0.12, 7.5 + Math.sin(age * 0.2) * 1.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fed330';
        ctx.beginPath(); ctx.arc(0, isBack ? -r * 0.08 : r * 0.12, 3.8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#0e0b10'; ctx.lineWidth = 2.8;
    }

    static drawMortarCannon(ctx, r, firing, flash) {
        ctx.fillStyle = flash ? '#ffffff' : '#b45309';
        ctx.beginPath(); ctx.roundRect(-8, -12, r * 1.02, 24, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = flash ? '#ffffff' : '#18181b';
        ctx.beginPath(); ctx.roundRect(r * 0.68, -14, r * 0.34, 28, 4); ctx.fill(); ctx.stroke();
        if (!flash) {
            ctx.fillStyle = firing ? '#fef08a' : '#ff6b35';
            ctx.beginPath(); ctx.arc(r * 1.04, 0, firing ? 8 : 5.5, 0, Math.PI * 2); ctx.fill();
        }
    }
}

if (typeof window !== 'undefined') window.InfernoArtilleryRenderer = InfernoArtilleryRenderer;
if (typeof module !== 'undefined' && module.exports) module.exports = { InfernoArtilleryRenderer };
