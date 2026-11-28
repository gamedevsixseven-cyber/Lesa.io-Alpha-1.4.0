/**
 * Lesa.io - Endless Hard 2.5D Renderer: Void Acolyte
 * Abyssal Arch-Warlock with depth-sorted Void Scepter, floating rune grimoire,
 * sculpted gradient vestments, glowing arcane hood runes, and swirling vortex traps.
 */

class VoidAcolyteRenderer {
    static draw(ctx, e) {
        const r = e.radius || 25;
        const flash = e.hitFlash > 0;
        const age = e.age || 0;
        const aimAngle = e.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const scepterBehind = Math.sin(aimAngle) < -0.25;
        const hovering = Math.sin(age * 0.09) * 4.5;
        const charging = (e.riftWindup || 0) > 0;

        this.drawFloorSigilsAndTraps(ctx, e, r, age, charging);
        EndlessEnemyRenderer.drawShadow(ctx, e.x, e.y, r, 0.92, 0.34);

        const anchorX = facingLeft ? -r * 0.28 : r * 0.28;

        if (typeof SpriteAtlasCache !== 'undefined') {
            const bins = SpriteAtlasCache.getWalkBins(6);
            const rKey = Math.round(r * 2);
            const animBin = flash ? 0 : SpriteAtlasCache.quantizePhase(age * 0.14, bins);
            const qAge = flash ? 0 : ((animBin + 0.5) / bins) * (Math.PI * 2 / 0.14);
            const bodyKey = `va_b:${rKey}:${animBin}:${isBack ? 1 : 0}:${flash ? 1 : 0}`;
            const bw = Math.ceil(r * 2.6);
            const bh = Math.ceil(r * 2.6);
            const wy = e.y + hovering;
            const orbBin = (flash || charging) ? 0 : (Math.floor((age * 0.22) / Math.PI) % 2);
            const wKey = `va_w:${rKey}:${charging ? 1 : 0}:${orbBin}:${flash ? 1 : 0}`;
            const sw = Math.ceil(r * 2.3);
            const sh = 44;

            const drawScepter = () => {
                EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle, e.x + anchorX, wy + (scepterBehind ? 0 : r * 0.06), () => {
                    SpriteAtlasCache.drawCached(ctx, wKey, sw, sh, Math.ceil(r * 0.25), 22, (sctx) => {
                        sctx.lineWidth = 2.6;
                        sctx.lineJoin = 'round';
                        sctx.lineCap = 'round';
                        sctx.strokeStyle = '#0c0618';
                        this.drawVoidScepter(sctx, r, orbBin ? 2.2 : 0, charging, flash);
                    });
                }, true);
            };

            if (scepterBehind) drawScepter();

            SpriteAtlasCache.drawCachedAt(ctx, e.x, wy, bodyKey, bw, bh, bw * 0.5, Math.ceil(bh * 0.52), (bctx) => {
                bctx.lineWidth = 2.6;
                bctx.lineJoin = 'round';
                bctx.lineCap = 'round';
                bctx.strokeStyle = '#0c0618';
                if (!isBack) this.drawFloatingGrimoire(bctx, r, qAge, flash);
                this.drawRobesAndVestments(bctx, r, qAge, isBack, flash);
                if (isBack) this.drawFloatingGrimoire(bctx, r, qAge, flash);
                this.drawHornedCowlHead(bctx, r, isBack, flash);
            }, { flipX: facingLeft });

            if (!scepterBehind) drawScepter();

            if (typeof EnemyBatchRenderer === 'undefined' || !EnemyBatchRenderer.active) {
                e.drawBubbleTrap(ctx);
                e.drawOverheadHUD(ctx);
            }
            return;
        }

        ctx.save();
        ctx.translate(e.x, e.y + hovering);
        ctx.lineWidth = 2.6;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#0c0618';

        if (scepterBehind) {
            EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle, anchorX, 0, () => {
                this.drawVoidScepter(ctx, r, age, charging, flash);
            });
        }

        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);
        if (!isBack) this.drawFloatingGrimoire(ctx, r, age, flash);
        this.drawRobesAndVestments(ctx, r, age, isBack, flash);
        if (isBack) this.drawFloatingGrimoire(ctx, r, age, flash);
        this.drawHornedCowlHead(ctx, r, isBack, flash);
        ctx.restore();

        if (!scepterBehind) {
            EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle, anchorX, r * 0.06, () => {
                this.drawVoidScepter(ctx, r, age, charging, flash);
            });
        }
        ctx.restore();

        if (typeof EnemyBatchRenderer === 'undefined' || !EnemyBatchRenderer.active) {
            e.drawBubbleTrap(ctx);
            e.drawOverheadHUD(ctx);
        }
    }

    static drawFloorSigilsAndTraps(ctx, e, r, age, charging) {
        const traps = e._rifts;
        if (traps && traps.length > 0) {
            for (const trap of traps) {
                const p = 1 - Math.max(0, trap.timer / trap.maxTimer);
                ctx.save();
                ctx.translate(trap.x, trap.y);
                ctx.fillStyle = `rgba(109, 40, 217, ${0.16 + p * 0.24})`;
                ctx.strokeStyle = p > 0.72 ? '#38bdf8' : '#c084fc';
                ctx.lineWidth = 2.6;
                ctx.beginPath(); ctx.arc(0, 0, trap.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
                ctx.rotate(age * 0.07);
                ctx.setLineDash([12, 9]);
                ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 2.2;
                ctx.beginPath(); ctx.arc(0, 0, trap.radius * 0.68, 0, Math.PI * 2); ctx.stroke();
                ctx.setLineDash([]);
                ctx.fillStyle = 'rgba(56, 189, 248, 0.36)';
                ctx.beginPath(); ctx.arc(0, 0, Math.max(5, trap.radius * p * 0.44), 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
        }

        if (e._blinkGhost && e._blinkGhost.life > 0) {
            ctx.save();
            ctx.globalAlpha = (e._blinkGhost.life / 20) * 0.55;
            ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 2.6;
            ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
            ctx.beginPath(); ctx.arc(e._blinkGhost.x, e._blinkGhost.y, r * 1.05, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.restore();
        }

        if (typeof SpriteAtlasCache !== 'undefined') {
            const rKey = Math.round(r * 2);
            const dashBin = Math.floor((((age * 0.85) % 13) / 13) * 4) % 4;
            const rw = Math.ceil(r * 2.5);
            const rh = Math.ceil(r * 1.1);
            SpriteAtlasCache.drawCachedAt(ctx, e.x, e.y + r * 0.74, `va_rng:${rKey}:${charging ? 1 : 0}:${dashBin}`, rw, rh, rw * 0.5, rh * 0.5, (rctx) => {
                rctx.strokeStyle = charging ? 'rgba(56, 189, 248, 0.85)' : 'rgba(192, 132, 252, 0.55)';
                rctx.lineWidth = 2.0;
                rctx.setLineDash([7, 6]);
                rctx.lineDashOffset = -(dashBin / 4) * 13;
                rctx.beginPath(); rctx.ellipse(0, 0, r * 1.08, r * 0.40, 0, 0, Math.PI * 2); rctx.stroke();
            });
            return;
        }

        ctx.save();
        ctx.translate(e.x, e.y + r * 0.74);
        ctx.strokeStyle = charging ? 'rgba(56, 189, 248, 0.85)' : 'rgba(192, 132, 252, 0.55)';
        ctx.lineWidth = 2.0;
        ctx.setLineDash([7, 6]);
        ctx.lineDashOffset = -age * 0.85;
        ctx.beginPath(); ctx.ellipse(0, 0, r * 1.08, r * 0.40, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    static drawFloatingGrimoire(ctx, r, age, flash) {
        const fy = Math.sin(age * 0.13) * 3 - r * 0.28;
        ctx.save();
        ctx.translate(-r * 0.72, fy);
        ctx.rotate(-0.22 + Math.sin(age * 0.08) * 0.08);
        ctx.fillStyle = flash ? '#ffffff' : '#3b0764';
        ctx.beginPath(); ctx.roundRect(-r * 0.23, -r * 0.29, r * 0.46, r * 0.58, 4); ctx.fill(); ctx.stroke();
        if (!flash) {
            ctx.fillStyle = '#eab308';
            ctx.fillRect(-r * 0.23, -r * 0.29, r * 0.09, r * 0.58);
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(r * 0.12, -r * 0.22, r * 0.08, r * 0.44);
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath(); ctx.arc(0, 0, 3.4, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }

    static drawRobesAndVestments(ctx, r, age, isBack, flash) {
        const wave = Math.sin(age * 0.14) * 3.2;
        if (!flash) {
            const cloakG = ctx.createLinearGradient(0, -r * 0.3, 0, r * 0.98);
            cloakG.addColorStop(0, '#4c1d95'); cloakG.addColorStop(1, '#1e0b36');
            ctx.fillStyle = cloakG;
        } else ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-r * 0.68, -r * 0.24);
        ctx.quadraticCurveTo(-r * 0.92, r * 0.45, -r * 0.56, r * 0.94);
        ctx.lineTo(-r * 0.22, r * 0.74 + wave * 0.5);
        ctx.lineTo(0, r * 0.96 - wave * 0.4);
        ctx.lineTo(r * 0.24, r * 0.74 + wave * 0.5);
        ctx.lineTo(r * 0.56, r * 0.94);
        ctx.quadraticCurveTo(r * 0.92, r * 0.45, r * 0.68, -r * 0.24);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        // Inner armored royal tunic + layered fold shading
        ctx.fillStyle = flash ? '#ffffff' : '#5b21b6';
        ctx.beginPath(); ctx.roundRect(-r * 0.44, -r * 0.28, r * 0.88, r * 0.74, 8); ctx.fill(); ctx.stroke();

        for (const s of [-1, 1]) {
            ctx.fillStyle = flash ? '#ffffff' : '#1e1b4b';
            ctx.beginPath();
            ctx.moveTo(s * r * 0.34, -r * 0.36);
            ctx.lineTo(s * r * 0.88, -r * 0.46);
            ctx.lineTo(s * r * 0.76, -r * 0.04);
            ctx.lineTo(s * r * 0.38, -r * 0.06);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            if (!flash) {
                ctx.fillStyle = '#d97706';
                ctx.fillRect(s * r * 0.42, -r * 0.33, s * r * 0.28, 3);
                ctx.fillStyle = '#38bdf8';
                ctx.beginPath(); ctx.arc(s * r * 0.64, -r * 0.22, 3, 0, Math.PI * 2); ctx.fill();
            }
        }

        if (!flash && !isBack) {
            ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(-r * 0.28, -r * 0.20); ctx.lineTo(0, r * 0.14); ctx.lineTo(r * 0.28, -r * 0.20); ctx.stroke();
            ctx.fillStyle = '#b45309'; ctx.strokeStyle = '#0c0618'; ctx.lineWidth = 2.1;
            ctx.fillRect(-r * 0.44, r * 0.22, r * 0.88, r * 0.12);
            ctx.strokeRect(-r * 0.44, r * 0.22, r * 0.88, r * 0.12);
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath(); ctx.arc(0, r * 0.28, 4.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
        ctx.strokeStyle = '#0c0618'; ctx.lineWidth = 2.6;
    }

    static drawHornedCowlHead(ctx, r, isBack, flash) {
        if (!flash) {
            const hoodG = ctx.createLinearGradient(0, -r * 1.12, 0, -r * 0.18);
            hoodG.addColorStop(0, '#6d28d9'); hoodG.addColorStop(1, '#2e1065');
            ctx.fillStyle = hoodG;
        } else ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-r * 0.56, -r * 0.22);
        ctx.quadraticCurveTo(-r * 0.72, -r * 0.90, -r * 0.24, -r * 1.12);
        ctx.lineTo(0, -r * 0.86);
        ctx.lineTo(r * 0.24, -r * 1.12);
        ctx.quadraticCurveTo(r * 0.72, -r * 0.90, r * 0.56, -r * 0.22);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        if (flash) return;
        if (isBack) {
            ctx.strokeStyle = '#eab308'; ctx.lineWidth = 2.2;
            ctx.beginPath(); ctx.moveTo(0, -r * 0.82); ctx.lineTo(0, -r * 0.30); ctx.stroke();
            ctx.fillStyle = '#a855f7';
            ctx.beginPath(); ctx.arc(0, -r * 0.58, 3.5, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#0c0618'; ctx.lineWidth = 2.6;
            return;
        }
        // Hollow abyssal cowl interior + brass jaw-mask + razor glowing cyan slits
        ctx.fillStyle = '#080212';
        ctx.beginPath(); ctx.ellipse(0, -r * 0.48, r * 0.35, r * 0.31, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.moveTo(-r * 0.26, -r * 0.38); ctx.lineTo(r * 0.26, -r * 0.38);
        ctx.lineTo(r * 0.14, -r * 0.21); ctx.lineTo(-r * 0.14, -r * 0.21);
        ctx.closePath(); ctx.fill(); ctx.stroke();
        // Slanted piercing void eyes + tiny forehead astral gem
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(-r * 0.23, -r * 0.56); ctx.lineTo(-r * 0.06, -r * 0.50); ctx.lineTo(-r * 0.20, -r * 0.47); ctx.closePath();
        ctx.moveTo(r * 0.23, -r * 0.56); ctx.lineTo(r * 0.06, -r * 0.50); ctx.lineTo(r * 0.20, -r * 0.47); ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#c084fc';
        ctx.beginPath(); ctx.arc(0, -r * 0.69, 2.6, 0, Math.PI * 2); ctx.fill();
    }

    static drawVoidScepter(ctx, r, age, charging, flash) {
        ctx.fillStyle = flash ? '#ffffff' : '#4c1d95';
        ctx.beginPath(); ctx.roundRect(-2, -4.5, r * 0.48, 9, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = flash ? '#ffffff' : '#d97706';
        ctx.beginPath(); ctx.arc(r * 0.44, 0, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#1e1b4b';
        ctx.beginPath(); ctx.roundRect(r * 0.24, -3, r * 1.08, 6, 3); ctx.fill(); ctx.stroke();
        if (flash) return;

        ctx.strokeStyle = '#eab308'; ctx.lineWidth = 2.8;
        ctx.beginPath(); ctx.arc(r * 1.34, 0, 9.5, -1.9, 1.9); ctx.stroke();
        ctx.strokeStyle = '#0c0618'; ctx.lineWidth = 2.2;

        const orbR = charging ? 8.6 : 6.2 + Math.sin(age * 0.22) * 0.8;
        ctx.fillStyle = charging ? 'rgba(56, 189, 248, 0.34)' : 'rgba(168, 85, 247, 0.30)';
        ctx.beginPath(); ctx.arc(r * 1.40, 0, orbR * 1.65, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = charging ? '#38bdf8' : '#a855f7';
        ctx.beginPath(); ctx.arc(r * 1.40, 0, orbR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f3e8ff';
        ctx.beginPath(); ctx.arc(r * 1.38, -1.2, orbR * 0.36, 0, Math.PI * 2); ctx.fill();
    }
}

if (typeof window !== 'undefined') window.VoidAcolyteRenderer = VoidAcolyteRenderer;
if (typeof module !== 'undefined' && module.exports) module.exports = { VoidAcolyteRenderer };
