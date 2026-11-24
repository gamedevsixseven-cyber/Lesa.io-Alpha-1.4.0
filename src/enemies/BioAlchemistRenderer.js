/**
 * Lesa.io - Endgame Healer Enemy 2.5D Vector Renderer: BioAlchemist
 * Draws the armored Bio-Alchemist medic in an emerald/obsidian hazmat coat with
 * a bubbling dual-canister healing pack, medical cross chest emblem, caduceus staff,
 * vital healing tether beam, and emerald cleanse-pulse telegraph ring.
 */

class BioAlchemistRenderer {
    static draw(ctx, e) {
        const r = e.radius || 28;
        const flash = e.hitFlash > 0;
        const age = e.age || 0;
        const aimAngle = e.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const bob = Math.sin(e.walkCycle || age * 0.16) * 2.2;

        // 1. Ambient medic halo + active Cleanse Pulse telegraph + Healing Tether
        BioAlchemistRenderer.drawSupportAuras(ctx, e, r, age);

        // 2. Character body
        EndlessEnemyRenderer.drawShadow(ctx, e.x, e.y, r, 1.05, 0.40);

        if (typeof SpriteAtlasCache !== 'undefined') {
            const bins = SpriteAtlasCache.getWalkBins(8);
            const rKey = Math.round(r * 2);
            const walkBin = SpriteAtlasCache.quantizePhase(e.walkCycle || age * 0.16, bins);
            const qCycle = SpriteAtlasCache.binAngle(walkBin, bins);
            const qAge = ((walkBin + 0.5) / bins) * ((r * 0.22) / 0.35);
            const bodyKey = `bio_b:${rKey}:${walkBin}:${isBack ? 1 : 0}:${flash ? 1 : 0}`;
            const bw = Math.ceil(r * 3.8);
            const bh = Math.ceil(r * 3.8);
            const wy = e.y + bob;

            SpriteAtlasCache.drawCachedAt(ctx, e.x, wy, bodyKey, bw, bh, bw * 0.5, bh * 0.5, (bctx) => {
                bctx.lineWidth = 2.6;
                bctx.lineJoin = 'round';
                bctx.lineCap = 'round';
                bctx.strokeStyle = '#141418';
                EndlessEnemyRenderer.drawLimbs(bctx, r, qCycle, '#1e272e', '#0f172a', flash);
                if (!isBack) BioAlchemistRenderer.drawTankPack(bctx, r, qAge, flash);
                BioAlchemistRenderer.drawMedicCoat(bctx, r, isBack, flash);
                if (isBack) BioAlchemistRenderer.drawTankPack(bctx, r, qAge, flash);
                BioAlchemistRenderer.drawMedicHead(bctx, r, isBack, flash);
            }, { flipX: facingLeft });

            const anchorX = facingLeft ? -r * 0.18 : r * 0.18;
            EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle, e.x + anchorX, wy + r * 0.04, () => {
                const staffKey = `bio_s:${rKey}:${flash ? 1 : 0}`;
                const sw = Math.ceil(r * 3.6);
                const sh = Math.ceil(r * 2.0);
                SpriteAtlasCache.drawCached(ctx, staffKey, sw, sh, Math.ceil(r * 0.4), sh * 0.5, (sctx) => {
                    sctx.lineWidth = 2.6;
                    sctx.lineJoin = 'round';
                    sctx.lineCap = 'round';
                    sctx.strokeStyle = '#141418';
                    BioAlchemistRenderer.drawStaff(sctx, r, 0, flash);
                });
            }, true);
            if (typeof e.drawOverheadHUD === 'function') e.drawOverheadHUD(ctx);
            return;
        }

        ctx.save();
        ctx.translate(e.x, e.y + bob);
        ctx.lineWidth = 2.6;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#141418';

        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);

        EndlessEnemyRenderer.drawLimbs(ctx, r, e.walkCycle || age * 0.16, '#1e272e', '#0f172a', flash);
        if (!isBack) BioAlchemistRenderer.drawTankPack(ctx, r, age, flash);
        BioAlchemistRenderer.drawMedicCoat(ctx, r, isBack, flash);
        if (isBack) BioAlchemistRenderer.drawTankPack(ctx, r, age, flash);
        BioAlchemistRenderer.drawMedicHead(ctx, r, isBack, flash);
        ctx.restore();

        // 3. Aimed Caduceus Bio-Lance Staff
        const anchorX = facingLeft ? -r * 0.18 : r * 0.18;
        EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle, anchorX, r * 0.04, () => {
            BioAlchemistRenderer.drawStaff(ctx, r, age, flash);
        });

        ctx.restore();
        if (typeof e.drawOverheadHUD === 'function') e.drawOverheadHUD(ctx);
    }

    static drawSupportAuras(ctx, e, r, age) {
        // Subtle rotating medic ring so Bio-Alchemists stand out inside 120-enemy swarms
        ctx.save();
        ctx.strokeStyle = e.waterDrenchedTimer > 0 ? 'rgba(116, 185, 255, 0.32)' : 'rgba(46, 213, 115, 0.30)';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([7, 7]);
        ctx.lineDashOffset = -age * 0.7;
        ctx.beginPath();
        ctx.arc(e.x, e.y, r + 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Cleanse Pulse expanding telegraph ring
        if (e.cleanseWindup > 0 && e.cleanseWindupMax > 0) {
            const p = Math.max(0, Math.min(1, 1 - e.cleanseWindup / e.cleanseWindupMax));
            const rad = e.cleanseRadius || 230;
            ctx.fillStyle = `rgba(46, 213, 115, ${0.06 + p * 0.10})`;
            ctx.beginPath();
            ctx.arc(e.x, e.y, rad, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = p > 0.72 ? '#bef264' : 'rgba(46, 213, 115, 0.85)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(e.x, e.y, rad * (0.25 + p * 0.75), 0, Math.PI * 2);
            ctx.stroke();
        }

        // Vital Healing Tether beam toward injured ally
        const t = e._tetherTarget;
        if (t && !t.dead && Number.isFinite(t.x) && Number.isFinite(t.y)) {
            const dx = t.x - e.x;
            const dy = t.y - e.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 5 && dist <= 380) {
                const mx = (e.x + t.x) * 0.5 - (dy / dist) * Math.sin(age * 0.14) * 18;
                const my = (e.y + t.y) * 0.5 + (dx / dist) * Math.sin(age * 0.14) * 18;

                ctx.strokeStyle = 'rgba(16, 172, 132, 0.35)';
                ctx.lineWidth = 8;
                ctx.beginPath(); ctx.moveTo(e.x, e.y - 6); ctx.quadraticCurveTo(mx, my, t.x, t.y - 4); ctx.stroke();

                ctx.strokeStyle = '#2ed573';
                ctx.lineWidth = 3.2;
                ctx.beginPath(); ctx.moveTo(e.x, e.y - 6); ctx.quadraticCurveTo(mx, my, t.x, t.y - 4); ctx.stroke();

                // Traveling heal pulse orbs along quadratic curve
                for (let k = 0; k < 2; k++) {
                    const u = (age * 0.03 + k * 0.5) % 1;
                    const inv = 1 - u;
                    const ox = inv * inv * e.x + 2 * inv * u * mx + u * u * t.x;
                    const oy = inv * inv * (e.y - 6) + 2 * inv * u * my + u * u * (t.y - 4);
                    ctx.fillStyle = '#bef264';
                    ctx.beginPath(); ctx.arc(ox, oy, 4.2, 0, Math.PI * 2); ctx.fill();
                }

                // Target heal ring
                ctx.strokeStyle = 'rgba(190, 242, 100, 0.72)';
                ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.arc(t.x, t.y, (t.radius || 24) + 6 + Math.sin(age * 0.25) * 2, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        ctx.restore();
    }

    static drawTankPack(ctx, r, age, flash) {
        const px = -r * 0.62;
        ctx.fillStyle = flash ? '#ffffff' : '#2f3640';
        ctx.beginPath();
        ctx.roundRect(px - r * 0.24, -r * 0.38, r * 0.44, r * 0.72, 5);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            // Glowing green bio-serum chamber inside canister
            ctx.fillStyle = '#10ac84';
            ctx.fillRect(px - r * 0.16, -r * 0.24, r * 0.26, r * 0.46);
            ctx.fillStyle = '#bef264';
            const bY = -r * 0.04 - ((age * 0.35) % (r * 0.22));
            ctx.beginPath(); ctx.arc(px - r * 0.03, bY, 2.3, 0, Math.PI * 2); ctx.fill();
        }
    }

    static drawMedicCoat(ctx, r, isBack, flash) {
        // Armored teal-emerald hazmat coat
        ctx.fillStyle = flash ? '#ffffff' : '#0f766e';
        ctx.beginPath();
        ctx.roundRect(-r * 0.56, -r * 0.34, r * 1.12, r * 0.84, 9);
        ctx.fill();
        ctx.stroke();

        // Reinforced dark chestplate & gold shoulder trim
        ctx.fillStyle = flash ? '#ffffff' : '#1e293b';
        ctx.beginPath();
        ctx.roundRect(-r * 0.40, -r * 0.30, r * 0.80, r * 0.52, 6);
        ctx.fill();
        ctx.stroke();

        if (!flash && !isBack) {
            // Medical cross badge
            ctx.fillStyle = '#2ed573';
            ctx.fillRect(-r * 0.07, -r * 0.20, r * 0.14, r * 0.32);
            ctx.fillRect(-r * 0.16, -r * 0.11, r * 0.32, r * 0.14);
        }
        if (!flash) {
            ctx.fillStyle = '#fed330';
            ctx.fillRect(-r * 0.56, r * 0.20, r * 1.12, r * 0.11);
        }
    }

    static drawMedicHead(ctx, r, isBack, flash) {
        // Hazmat hood / cap
        ctx.fillStyle = flash ? '#ffffff' : '#115e59';
        ctx.beginPath();
        ctx.arc(0, -r * 0.62, r * 0.48, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (!flash && !isBack) {
            // Breather respirator + dual glowing lime bio-goggles
            ctx.fillStyle = '#1e272e';
            ctx.beginPath();
            ctx.roundRect(-r * 0.28, -r * 0.56, r * 0.56, r * 0.30, 5);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#bef264';
            ctx.beginPath();
            ctx.arc(-r * 0.14, -r * 0.68, r * 0.11, 0, Math.PI * 2);
            ctx.arc(r * 0.16, -r * 0.68, r * 0.11, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }

    static drawStaff(ctx, r, age, flash) {
        // Gold-trimmed bio-emitter staff
        ctx.fillStyle = flash ? '#ffffff' : '#334155';
        ctx.beginPath();
        ctx.roundRect(0, -3.5, r * 1.32, 7, 3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#fed330';
        ctx.beginPath();
        ctx.roundRect(r * 0.92, -6, r * 0.22, 12, 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#2ed573';
        ctx.beginPath();
        ctx.arc(r * 1.38, 0, 5.5 + Math.sin(age * 0.22) * 0.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}

if (typeof window !== 'undefined') window.BioAlchemistRenderer = BioAlchemistRenderer;
if (typeof module !== 'undefined' && module.exports) module.exports = { BioAlchemistRenderer };
