/**
 * Lesa.io - Endless Hard 2.5D Renderer: Blood Wraith
 * Crimson spectral assassin with clawed obsidian-and-ruby bat wings,
 * ragged gradient shroud, sculpted horned reaper skull mask, spinal vertebrae
 * from behind, and depth-sorted dual Crimson Blood Scimitars.
 */

class CrimsonWraithRenderer {
    static draw(ctx, e) {
        const r = e.radius || 25;
        const flash = e.hitFlash > 0;
        const age = e.age || 0;
        const aimAngle = e.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const bladesBehind = Math.sin(aimAngle) < -0.25;
        const isWindup = (e.lungeWindup || 0) > 0;
        const isLunge = (e.lungeTimer || 0) > 0;
        const hover = Math.sin(age * 0.12) * 4;

        this.drawTelegraphAndAfterimages(ctx, e, r, isWindup);
        EndlessEnemyRenderer.drawShadow(ctx, e.x, e.y, r, 0.95, 0.34);

        if (typeof SpriteAtlasCache !== 'undefined') {
            const bins = SpriteAtlasCache.getWalkBins(6);
            const rKey = Math.round(r * 2);
            const walkBin = SpriteAtlasCache.quantizePhase(age * 0.16, bins);
            const pose = flash ? 'F' : (isLunge ? 'L' : (isWindup ? 'W' : walkBin));
            const qAge = (pose === 'F' || pose === 'L' || pose === 'W') ? 0 : ((walkBin + 0.5) / bins) * (Math.PI * 2 / 0.16);
            const bodyKey = `cw_b:${rKey}:${pose}:${isBack ? 1 : 0}:${flash ? 1 : 0}`;
            const bw = Math.ceil(r * 4.5);
            const bh = Math.ceil(r * 3.6);
            const wy = e.y + hover;
            const scKey = `cw_s:${rKey}:${isWindup ? 1 : 0}:${flash ? 1 : 0}`;
            const sw = Math.ceil(r * 2.2);
            const sh = Math.ceil(r * 2.6);

            const drawScimitars = () => {
                EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle, e.x, wy, () => {
                    SpriteAtlasCache.drawCached(ctx, scKey, sw, sh, Math.ceil(r * 0.35), sh * 0.5, (sctx) => {
                        sctx.lineWidth = 2.6;
                        sctx.lineJoin = 'round';
                        sctx.lineCap = 'round';
                        sctx.strokeStyle = '#09040a';
                        this.drawTwinScimitars(sctx, r, isWindup, flash);
                    });
                }, true);
            };

            if (e.isCloaked) ctx.globalAlpha = 0.48;
            if (bladesBehind) drawScimitars();

            SpriteAtlasCache.drawCachedAt(ctx, e.x, wy, bodyKey, bw, bh, bw * 0.5, Math.ceil(r * 2.2), (bctx) => {
                bctx.lineWidth = 2.6;
                bctx.lineJoin = 'round';
                bctx.lineCap = 'round';
                bctx.strokeStyle = '#09040a';
                if (isLunge) bctx.rotate(0.18);
                this.drawReaperWings(bctx, r, qAge, isLunge, isWindup, flash);
                this.drawTatteredShroudTorso(bctx, r, qAge, isBack, flash);
                this.drawSkullMaskHead(bctx, r, isBack, flash);
            }, { flipX: facingLeft });

            if (!bladesBehind) drawScimitars();
            if (e.isCloaked) ctx.globalAlpha = 1.0;

            if (typeof EnemyBatchRenderer === 'undefined' || !EnemyBatchRenderer.active) {
                e.drawBubbleTrap(ctx);
                e.drawOverheadHUD(ctx);
            }
            return;
        }

        ctx.save();
        ctx.globalAlpha = e.isCloaked ? 0.48 : 1.0;
        ctx.translate(e.x, e.y + hover);
        ctx.lineWidth = 2.6;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#09040a';

        if (bladesBehind) {
            EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle, 0, 0, () => {
                this.drawTwinScimitars(ctx, r, isWindup, flash);
            });
        }

        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);
        if (isLunge) ctx.rotate(0.18);
        this.drawReaperWings(ctx, r, age, isLunge, isWindup, flash);
        this.drawTatteredShroudTorso(ctx, r, age, isBack, flash);
        this.drawSkullMaskHead(ctx, r, isBack, flash);
        ctx.restore();

        if (!bladesBehind) {
            EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle, 0, 0, () => {
                this.drawTwinScimitars(ctx, r, isWindup, flash);
            });
        }
        ctx.restore();

        if (typeof EnemyBatchRenderer === 'undefined' || !EnemyBatchRenderer.active) {
            e.drawBubbleTrap(ctx);
            e.drawOverheadHUD(ctx);
        }
    }

    static drawTelegraphAndAfterimages(ctx, e, r, isWindup) {
        if (isWindup) {
            const p = 1 - Math.max(0, e.lungeWindup / (e.lungeWindupMax || 26));
            ctx.save();
            ctx.translate(e.x, e.y);
            ctx.rotate(e.lungeAngle || 0);
            ctx.strokeStyle = `rgba(255, 46, 76, ${0.42 + p * 0.56})`;
            ctx.lineWidth = 2.4 + p * 4;
            ctx.setLineDash([16, 8]);
            ctx.beginPath(); ctx.moveTo(0, -10); ctx.lineTo(315, -4); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(315, 4); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = 'rgba(255, 46, 76, 0.14)';
            ctx.fillRect(0, -14, 315 * p, 28);
            ctx.restore();
        }
        for (const g of (e._afterimages || [])) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, (g.life / 14) * 0.42);
            ctx.fillStyle = '#be123c';
            ctx.beginPath();
            ctx.moveTo(g.x - r * 1.1, g.y - r * 0.6);
            ctx.lineTo(g.x, g.y - r * 0.9);
            ctx.lineTo(g.x + r * 1.1, g.y - r * 0.6);
            ctx.lineTo(g.x, g.y + r * 0.8);
            ctx.closePath(); ctx.fill();
            ctx.restore();
        }
    }

    static drawReaperWings(ctx, r, age, isLunge, isWindup, flash) {
        const flap = isLunge ? -0.42 : (isWindup ? 0.28 : Math.sin(age * 0.16) * 0.18);
        for (const s of [-1, 1]) {
            ctx.save();
            ctx.translate(s * 6, -r * 0.24);
            ctx.rotate(s * flap);
            if (!flash) {
                const wg = ctx.createLinearGradient(0, -r * 0.9, s * r * 1.6, r * 0.4);
                wg.addColorStop(0, '#881337'); wg.addColorStop(1, '#310412');
                ctx.fillStyle = wg;
            } else ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(s * r * 1.68, -r * 0.94);
            ctx.lineTo(s * r * 1.32, -r * 0.08);
            ctx.lineTo(s * r * 1.46, r * 0.30);
            ctx.lineTo(s * r * 0.76, r * 0.18);
            ctx.lineTo(s * r * 0.56, r * 0.54);
            ctx.lineTo(0, r * 0.36);
            ctx.closePath(); ctx.fill(); ctx.stroke();

            if (!flash) {
                ctx.strokeStyle = '#ff2e4c'; ctx.lineWidth = 2.1;
                ctx.beginPath();
                ctx.moveTo(0, 0); ctx.lineTo(s * r * 1.60, -r * 0.90);
                ctx.moveTo(s * r * 0.72, -r * 0.38); ctx.lineTo(s * r * 1.28, -r * 0.06);
                ctx.moveTo(s * r * 0.44, -r * 0.22); ctx.lineTo(s * r * 0.72, r * 0.16);
                ctx.stroke();
                // Sharp bone spur claw at wing apex
                ctx.fillStyle = '#e2e8f0'; ctx.strokeStyle = '#09040a'; ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(s * r * 1.54, -r * 0.88);
                ctx.lineTo(s * r * 1.82, -r * 1.06);
                ctx.lineTo(s * r * 1.64, -r * 0.76);
                ctx.closePath(); ctx.fill(); ctx.stroke();
            }
            ctx.strokeStyle = '#09040a'; ctx.lineWidth = 2.6;
            ctx.restore();
        }
    }

    static drawTatteredShroudTorso(ctx, r, age, isBack, flash) {
        const tail = Math.sin(age * 0.18) * 3;
        ctx.fillStyle = flash ? '#ffffff' : '#881337';
        ctx.beginPath();
        ctx.moveTo(-r * 0.56, -r * 0.32);
        ctx.lineTo(r * 0.56, -r * 0.32);
        ctx.lineTo(r * 0.44, r * 0.96);
        ctx.lineTo(r * 0.14, r * 0.70 + tail);
        ctx.lineTo(0, r * 1.04 - tail);
        ctx.lineTo(-r * 0.16, r * 0.70 + tail);
        ctx.lineTo(-r * 0.44, r * 0.96);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#1f1624';
        ctx.beginPath(); ctx.roundRect(-r * 0.38, -r * 0.28, r * 0.76, r * 0.68, 6); ctx.fill(); ctx.stroke();
        if (flash) return;

        if (isBack) {
            ctx.fillStyle = '#e2e8f0';
            for (let k = 0; k < 4; k++) ctx.fillRect(-3.5, -r * 0.22 + k * 6.5, 7, 4);
        } else {
            ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.8;
            for (const ry of [-r * 0.10, r * 0.06, r * 0.22]) {
                ctx.beginPath(); ctx.moveTo(-r * 0.26, ry); ctx.lineTo(r * 0.26, ry); ctx.stroke();
            }
            ctx.fillStyle = '#ff2e4c';
            ctx.beginPath(); ctx.arc(0, -r * 0.08, 4.2, 0, Math.PI * 2); ctx.fill();
        }
        ctx.strokeStyle = '#09040a'; ctx.lineWidth = 2.6;
    }

    static drawSkullMaskHead(ctx, r, isBack, flash) {
        ctx.fillStyle = flash ? '#ffffff' : '#9f1239';
        ctx.beginPath();
        ctx.moveTo(-r * 0.44, -r * 0.24);
        ctx.quadraticCurveTo(-r * 0.58, -r * 0.82, 0, -r * 1.12);
        ctx.quadraticCurveTo(r * 0.58, -r * 0.82, r * 0.44, -r * 0.24);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        if (flash || isBack) return;
        // Sculpted pale reaper skull visage with cheekbones & fanged jaw (no bird beak)
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.moveTo(-r * 0.32, -r * 0.58);
        ctx.quadraticCurveTo(0, -r * 0.74, r * 0.32, -r * 0.58);
        ctx.lineTo(r * 0.24, -r * 0.30);
        ctx.lineTo(r * 0.14, -r * 0.20);
        ctx.lineTo(-r * 0.14, -r * 0.20);
        ctx.lineTo(-r * 0.24, -r * 0.30);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // Dark hollow sockets + fierce crimson-gold slit eyes
        ctx.fillStyle = '#0f0714';
        ctx.beginPath();
        ctx.ellipse(-r * 0.14, -r * 0.48, 5.2, 3.6, 0.25, 0, Math.PI * 2);
        ctx.ellipse(r * 0.14, -r * 0.48, 5.2, 3.6, -0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff2e4c';
        ctx.fillRect(-r * 0.19, -r * 0.50, 7, 3);
        ctx.fillRect(r * 0.08, -r * 0.50, 7, 3);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(-r * 0.14, -r * 0.49, 2.5, 2);
        ctx.fillRect(r * 0.11, -r * 0.49, 2.5, 2);
        // Dark nasal cavity & jagged teeth ticks
        ctx.fillStyle = '#0f0714';
        ctx.beginPath(); ctx.moveTo(-2.5, -r * 0.33); ctx.lineTo(0, -r * 0.40); ctx.lineTo(2.5, -r * 0.33); ctx.fill();
        for (const tx of [-5, 0, 5]) ctx.fillRect(tx - 1, -r * 0.26, 2, 4);
    }

    static drawTwinScimitars(ctx, r, isWindup, flash) {
        const spread = isWindup ? 0.34 : 0.14;
        for (const side of [-1, 1]) {
            ctx.save();
            ctx.translate(r * 0.34, side * r * 0.56);
            ctx.rotate(side * (-0.28 - spread));
            ctx.fillStyle = flash ? '#ffffff' : '#334155';
            ctx.fillRect(-5, -2.5, 10, 5);
            ctx.fillStyle = flash ? '#ffffff' : '#be123c';
            ctx.beginPath();
            ctx.moveTo(2, -3.5);
            ctx.quadraticCurveTo(r * 0.90, -side * 12, r * 1.15, side * 3.5);
            ctx.quadraticCurveTo(r * 0.70, side * 5, 2, 3);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            if (!flash) {
                ctx.strokeStyle = '#fecdd3'; ctx.lineWidth = 1.6;
                ctx.beginPath(); ctx.moveTo(6, -1); ctx.quadraticCurveTo(r * 0.82, -side * 8, r * 1.06, side * 2.5); ctx.stroke();
            }
            ctx.strokeStyle = '#09040a'; ctx.lineWidth = 2.4;
            ctx.restore();
        }
    }
}

if (typeof window !== 'undefined') window.CrimsonWraithRenderer = CrimsonWraithRenderer;
if (typeof module !== 'undefined' && module.exports) module.exports = { CrimsonWraithRenderer };
