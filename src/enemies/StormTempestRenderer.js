/**
 * Lesa.io - Endless Hard 2.5D Renderer: Aether Tempest
 * Levitating cobalt-and-gold storm sentinel built from floating slate armor plates,
 * crackling twin shoulder Tesla pylons, white-hot reactor heart, horned lightning crown,
 * swirling vortex wind skirt, dorsal turbine dynamo, and aimed Arc-Coil Cannon.
 */

class StormTempestRenderer {
    static draw(ctx, e) {
        const r = e.radius || 28;
        const flash = e.hitFlash > 0;
        const age = e.age || 0;
        const aimAngle = e.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const gunBehind = Math.sin(aimAngle) < -0.25;
        const charging = (e.nodeWindup || 0) > 0;
        const hover = Math.sin(age * 0.11) * 5;

        this.drawStormNodes(ctx, e, age);
        EndlessEnemyRenderer.drawShadow(ctx, e.x, e.y, r, 0.96, 0.36);

        const ax = facingLeft ? -r * 0.24 : r * 0.24;

        if (typeof SpriteAtlasCache !== 'undefined') {
            const bins = SpriteAtlasCache.getWalkBins(6);
            const rKey = Math.round(r * 2);
            const animBin = flash ? 0 : SpriteAtlasCache.quantizePhase(age * 0.16, bins);
            const qAge = flash ? 0 : ((animBin + 0.5) / bins) * (Math.PI * 2 / 0.16);
            const bodyKey = `st_b:${rKey}:${animBin}:${isBack ? 1 : 0}:${flash ? 1 : 0}`;
            const bw = Math.ceil(r * 2.5);
            const bh = Math.ceil(r * 2.6);
            const wy = e.y + hover;
            const gKey = `st_g:${rKey}:${charging ? 1 : 0}:${flash ? 1 : 0}`;
            const sw = Math.ceil(r * 1.8);
            const sh = 28;

            const drawCannon = () => {
                EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle, e.x + ax, wy + (gunBehind ? 0 : r * 0.05), () => {
                    SpriteAtlasCache.drawCached(ctx, gKey, sw, sh, 8, 14, (gctx) => {
                        gctx.lineWidth = 2.6;
                        gctx.lineJoin = 'round';
                        gctx.lineCap = 'round';
                        gctx.strokeStyle = '#081020';
                        this.drawArcCannon(gctx, r, 0, charging, flash);
                    });
                }, true);
            };

            if (gunBehind) drawCannon();

            SpriteAtlasCache.drawCachedAt(ctx, e.x, wy, bodyKey, bw, bh, bw * 0.5, Math.ceil(r * 1.4), (bctx) => {
                bctx.lineWidth = 2.6;
                bctx.lineJoin = 'round';
                bctx.lineCap = 'round';
                bctx.strokeStyle = '#081020';
                this.drawWindVortexSkirt(bctx, r, qAge, flash);
                if (!isBack) this.drawDynamoPack(bctx, r, qAge, false, flash);
                this.drawStormArmorTorso(bctx, r, qAge, isBack, flash);
                if (isBack) this.drawDynamoPack(bctx, r, qAge, true, flash);
                this.drawShoulderPylons(bctx, r, qAge, flash);
                this.drawLightningCrownHead(bctx, r, isBack, flash);
            }, { flipX: facingLeft });

            if (!gunBehind) drawCannon();

            if (typeof EnemyBatchRenderer === 'undefined' || !EnemyBatchRenderer.active) {
                e.drawBubbleTrap(ctx);
                e.drawOverheadHUD(ctx);
            }
            return;
        }

        ctx.save();
        ctx.translate(e.x, e.y + hover);
        ctx.lineWidth = 2.6;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#081020';

        if (gunBehind) {
            EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle, ax, 0, () => {
                this.drawArcCannon(ctx, r, age, charging, flash);
            });
        }

        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);
        this.drawWindVortexSkirt(ctx, r, age, flash);
        if (!isBack) this.drawDynamoPack(ctx, r, age, false, flash);
        this.drawStormArmorTorso(ctx, r, age, isBack, flash);
        if (isBack) this.drawDynamoPack(ctx, r, age, true, flash);
        this.drawShoulderPylons(ctx, r, age, flash);
        this.drawLightningCrownHead(ctx, r, isBack, flash);
        ctx.restore();

        if (!gunBehind) {
            EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle, ax, r * 0.05, () => {
                this.drawArcCannon(ctx, r, age, charging, flash);
            });
        }
        ctx.restore();

        if (typeof EnemyBatchRenderer === 'undefined' || !EnemyBatchRenderer.active) {
            e.drawBubbleTrap(ctx);
            e.drawOverheadHUD(ctx);
        }
    }

    static drawStormNodes(ctx, e, age) {
        const nodes = e._conduits || [];
        if (nodes.length === 0) return;
        ctx.save();
        if (nodes.length >= 2) {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.72)';
            ctx.lineWidth = 3;
            ctx.setLineDash([12, 8]);
            ctx.beginPath();
            ctx.moveTo(nodes[0].x, nodes[0].y);
            for (let i = 1; i < nodes.length; i++) ctx.lineTo(nodes[i].x, nodes[i].y);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        for (const n of nodes) {
            const p = 1 - Math.max(0, n.timer / n.maxTimer);
            ctx.fillStyle = `rgba(56, 189, 248, ${0.14 + p * 0.25})`;
            ctx.strokeStyle = p > 0.72 ? '#fef08a' : '#38bdf8';
            ctx.lineWidth = 2.6;
            ctx.beginPath(); ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.arc(n.x, n.y, n.radius * Math.max(0.1, p), 0, Math.PI * 2); ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath(); ctx.arc(n.x, n.y, 4 + Math.sin(age * 0.3) * 1.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    static drawWindVortexSkirt(ctx, r, age, flash) {
        for (let k = 0; k < 2; k++) {
            const w = r * (0.72 - k * 0.22) + Math.sin(age * 0.2 + k) * 3;
            const yy = r * (0.48 + k * 0.24);
            ctx.strokeStyle = flash ? '#ffffff' : (k === 0 ? '#38bdf8' : '#7dd3fc');
            ctx.lineWidth = 3 - k * 0.8;
            ctx.beginPath(); ctx.ellipse(0, yy, w, 6.5, 0, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.strokeStyle = '#081020'; ctx.lineWidth = 2.6;
    }

    static drawDynamoPack(ctx, r, age, isBack, flash) {
        if (!isBack) {
            ctx.fillStyle = flash ? '#ffffff' : '#1e3a8a';
            ctx.beginPath(); ctx.roundRect(-r * 0.70, -r * 0.38, r * 0.22, r * 0.52, 4); ctx.fill(); ctx.stroke();
            return;
        }
        ctx.fillStyle = flash ? '#ffffff' : '#0f172a';
        ctx.beginPath(); ctx.roundRect(-r * 0.44, -r * 0.42, r * 0.88, r * 0.62, 8); ctx.fill(); ctx.stroke();
        if (flash) return;
        ctx.save(); ctx.translate(0, -r * 0.12); ctx.rotate(age * 0.14);
        ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2.6;
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI;
            ctx.beginPath(); ctx.moveTo(-Math.cos(a) * r * 0.32, -Math.sin(a) * r * 0.32);
            ctx.lineTo(Math.cos(a) * r * 0.32, Math.sin(a) * r * 0.32); ctx.stroke();
        }
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    static drawStormArmorTorso(ctx, r, age, isBack, flash) {
        if (!flash) {
            const g = ctx.createLinearGradient(0, -r * 0.45, 0, r * 0.45);
            g.addColorStop(0, '#1e40af'); g.addColorStop(1, '#0f172a');
            ctx.fillStyle = g;
        } else ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-r * 0.56, -r * 0.42); ctx.lineTo(r * 0.56, -r * 0.42);
        ctx.lineTo(r * 0.40, r * 0.38); ctx.lineTo(0, r * 0.54); ctx.lineTo(-r * 0.40, r * 0.38);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        if (flash || isBack) return;
        ctx.fillStyle = '#eab308';
        ctx.fillRect(-r * 0.40, -r * 0.36, r * 0.80, 4);
        // Crackling Cyan Plasma Core
        ctx.fillStyle = 'rgba(56, 189, 248, 0.38)';
        ctx.beginPath(); ctx.arc(0, -r * 0.04, 10 + Math.sin(age * 0.25) * 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.arc(0, -r * 0.04, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#081020'; ctx.lineWidth = 2.6;
    }

    static drawShoulderPylons(ctx, r, age, flash) {
        const hoverP = Math.sin(age * 0.16) * 2.5;
        for (const s of [-1, 1]) {
            ctx.fillStyle = flash ? '#ffffff' : '#1e293b';
            ctx.beginPath();
            ctx.moveTo(s * r * 0.56, -r * 0.22 + hoverP);
            ctx.lineTo(s * r * 0.88, -r * 0.68 + hoverP);
            ctx.lineTo(s * r * 0.96, -r * 0.20 + hoverP);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            if (!flash) {
                ctx.fillStyle = '#38bdf8';
                ctx.beginPath(); ctx.arc(s * r * 0.86, -r * 0.70 + hoverP, 4, 0, Math.PI * 2); ctx.fill();
            }
        }
    }

    static drawLightningCrownHead(ctx, r, isBack, flash) {
        ctx.fillStyle = flash ? '#ffffff' : '#1e3a8a';
        ctx.beginPath();
        ctx.moveTo(-r * 0.36, -r * 0.50);
        ctx.lineTo(-r * 0.48, -r * 1.02);
        ctx.lineTo(-r * 0.16, -r * 0.88);
        ctx.lineTo(0, -r * 1.18);
        ctx.lineTo(r * 0.16, -r * 0.88);
        ctx.lineTo(r * 0.48, -r * 1.02);
        ctx.lineTo(r * 0.36, -r * 0.50);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        if (flash || isBack) return;
        ctx.fillStyle = '#090d16';
        ctx.fillRect(-r * 0.26, -r * 0.74, r * 0.52, r * 0.14);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-r * 0.20, -r * 0.70, r * 0.40, r * 0.06);
        ctx.fillStyle = '#fef08a';
        ctx.beginPath(); ctx.arc(0, -r * 0.92, 3.2, 0, Math.PI * 2); ctx.fill();
    }

    static drawArcCannon(ctx, r, age, charging, flash) {
        ctx.fillStyle = flash ? '#ffffff' : '#334155';
        ctx.beginPath(); ctx.roundRect(0, -6, r * 0.98, 12, 4); ctx.fill(); ctx.stroke();
        if (flash) return;
        ctx.fillStyle = '#eab308';
        for (const cx of [r * 0.45, r * 0.72]) ctx.fillRect(cx, -7.5, 4, 15);
        ctx.fillStyle = charging ? '#fef08a' : '#38bdf8';
        ctx.beginPath(); ctx.arc(r * 1.04, 0, 5.5 + Math.sin(age * 0.3) * 1.1, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
}

if (typeof window !== 'undefined') window.StormTempestRenderer = StormTempestRenderer;
if (typeof module !== 'undefined' && module.exports) module.exports = { StormTempestRenderer };
