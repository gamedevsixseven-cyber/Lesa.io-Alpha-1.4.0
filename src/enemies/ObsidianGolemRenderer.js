/**
 * Lesa.io - Endless Hard 2.5D Renderer: Obsidian Juggernaut
 * Volcanic titan with beveled basalt chestplates, glowing magma fractures,
 * flame-etched obsidian horns, twin dorsal exhaust stacks, and depth-sorted
 * Molten-Crystal Bulwark Shield with hexagonal runes & corner rivets.
 */

class ObsidianGolemRenderer {
    static draw(ctx, e) {
        const r = e.radius || 34;
        const flash = e.hitFlash > 0;
        const age = e.age || 0;
        const aimAngle = e.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const shieldBehind = Math.sin(aimAngle) < -0.25;
        const enraged = !!e.shieldBroken;
        const isSlam = (e.slamWindup || 0) > 0;
        const bob = isSlam ? -3.5 : Math.sin(e.walkCycle || age * 0.15) * 2.6;

        if (isSlam) this.drawSlamLaneTelegraph(ctx, e, r);
        EndlessEnemyRenderer.drawShadow(ctx, e.x, e.y, r, 1.20, 0.44);

        const aimOff = isSlam ? Math.sin(age * 0.65) * 0.14 : 0;

        if (typeof SpriteAtlasCache !== 'undefined') {
            const bins = SpriteAtlasCache.getWalkBins(6);
            const rKey = Math.round(r * 2);
            const rawPhase = e.walkCycle || age * 0.15;
            const walkBin = SpriteAtlasCache.quantizePhase(rawPhase, bins);
            const pose = flash ? 'F' : (isSlam ? 'S' : walkBin);
            const qAge = (pose === 'F' || pose === 'S') ? 0 : ((walkBin + 0.5) / bins) * (Math.PI * 2 / 0.15);
            const qCycle = (pose === 'F' || pose === 'S') ? 0 : SpriteAtlasCache.binAngle(walkBin, bins);
            const bodyKey = `og_b:${rKey}:${pose}:${isBack ? 1 : 0}:${enraged ? 1 : 0}:${flash ? 1 : 0}`;
            const bw = Math.ceil(r * 2.6);
            const bh = Math.ceil(r * 2.7);
            const wy = e.y + bob;

            const hasShield = !enraged && e.frontShieldHp > 0;
            const hpQ = hasShield ? Math.min(3, Math.floor((e.frontShieldHp / (e.frontShieldMax || 1)) * 4)) : 0;
            const shKey = `og_sh:${rKey}:${hasShield ? 's' + hpQ : 'f'}:${flash ? 1 : 0}`;
            const sw = Math.ceil(r * 1.9);
            const sh = Math.ceil(r * 2.3);

            const drawShieldLayer = () => {
                EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle + aimOff, e.x, wy, () => {
                    SpriteAtlasCache.drawCached(ctx, shKey, sw, sh, 4, sh * 0.5, (sctx) => {
                        sctx.lineWidth = 3;
                        sctx.lineJoin = 'round';
                        sctx.lineCap = 'round';
                        sctx.strokeStyle = '#0c0d14';
                        this.drawFrontShieldOrFist(sctx, r, e, enraged, flash);
                    });
                }, true);
            };

            if (shieldBehind) drawShieldLayer();

            SpriteAtlasCache.drawCachedAt(ctx, e.x, wy, bodyKey, bw, bh, bw * 0.5, Math.ceil(r * 1.55), (bctx) => {
                bctx.lineWidth = 3;
                bctx.lineJoin = 'round';
                bctx.lineCap = 'round';
                bctx.strokeStyle = '#0c0d14';
                if (!isBack) this.drawFurnacePack(bctx, r, false, enraged, flash);
                this.drawVolcanicLegs(bctx, r, qCycle, enraged, flash);
                this.drawOffhandGauntlet(bctx, r, qAge, isSlam, enraged, flash);
                this.drawBasaltArmorTorso(bctx, r, qAge, isBack, enraged, flash);
                if (isBack) this.drawFurnacePack(bctx, r, true, enraged, flash);
                this.drawTitanHornedHead(bctx, r, isBack, enraged, flash);
            }, { flipX: facingLeft });

            if (!shieldBehind) drawShieldLayer();

            if (typeof EnemyBatchRenderer === 'undefined' || !EnemyBatchRenderer.active) {
                e.drawBubbleTrap(ctx);
                e.drawOverheadHUD(ctx);
            }
            return;
        }

        ctx.save();
        ctx.translate(e.x, e.y + bob);
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#0c0d14';

        if (shieldBehind) {
            EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle + aimOff, 0, 0, () => {
                this.drawFrontShieldOrFist(ctx, r, e, enraged, flash);
            });
        }

        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);
        if (!isBack) this.drawFurnacePack(ctx, r, false, enraged, flash);
        this.drawVolcanicLegs(ctx, r, e.walkCycle || age * 0.15, enraged, flash);
        this.drawOffhandGauntlet(ctx, r, age, isSlam, enraged, flash);
        this.drawBasaltArmorTorso(ctx, r, age, isBack, enraged, flash);
        if (isBack) this.drawFurnacePack(ctx, r, true, enraged, flash);
        this.drawTitanHornedHead(ctx, r, isBack, enraged, flash);
        ctx.restore();

        if (!shieldBehind) {
            EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle + aimOff, 0, 0, () => {
                this.drawFrontShieldOrFist(ctx, r, e, enraged, flash);
            });
        }
        ctx.restore();

        if (typeof EnemyBatchRenderer === 'undefined' || !EnemyBatchRenderer.active) {
            e.drawBubbleTrap(ctx);
            e.drawOverheadHUD(ctx);
        }
    }

    static drawSlamLaneTelegraph(ctx, e, r) {
        const p = 1 - Math.max(0, e.slamWindup / (e.slamWindupMax || 38));
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.slamAngle || 0);
        ctx.fillStyle = `rgba(255, 107, 53, ${0.14 + p * 0.24})`;
        ctx.strokeStyle = '#ff6b35'; ctx.lineWidth = 2.8;
        ctx.fillRect(r * 0.5, -34, 320, 68);
        ctx.strokeRect(r * 0.5, -34, 320, 68);
        ctx.fillStyle = 'rgba(254, 211, 48, 0.42)';
        ctx.fillRect(r * 0.5, -34, 320 * p, 68);
        ctx.restore();
    }

    static drawFurnacePack(ctx, r, isBack, enraged, flash) {
        const glow = enraged ? '#fef08a' : '#ff6b35';
        if (!isBack) {
            ctx.fillStyle = flash ? '#ffffff' : '#181c28';
            ctx.beginPath(); ctx.roundRect(-r * 0.84, -r * 0.50, r * 0.24, r * 0.56, 5); ctx.fill(); ctx.stroke();
            if (!flash) {
                ctx.fillStyle = glow;
                ctx.fillRect(-r * 0.78, -r * 0.36, r * 0.10, r * 0.28);
            }
            return;
        }
        // Heavy dark-iron volcanic core backplate with twin tapered chimney vents
        ctx.fillStyle = flash ? '#ffffff' : '#1a1e2b';
        ctx.beginPath(); ctx.roundRect(-r * 0.52, -r * 0.48, r * 1.04, r * 0.66, 8); ctx.fill(); ctx.stroke();
        for (const s of [-1, 1]) {
            ctx.fillStyle = flash ? '#ffffff' : '#2d3347';
            ctx.beginPath();
            ctx.moveTo(s * r * 0.20, -r * 0.42);
            ctx.lineTo(s * r * 0.42, -r * 0.42);
            ctx.lineTo(s * r * 0.48, -r * 0.72);
            ctx.lineTo(s * r * 0.24, -r * 0.72);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            if (!flash) {
                ctx.fillStyle = glow;
                ctx.fillRect(s * r * 0.25 - (s < 0 ? 5 : -2), -r * 0.68, r * 0.12, 4);
            }
        }
        if (!flash) {
            ctx.fillStyle = '#090b10';
            ctx.fillRect(-r * 0.26, -r * 0.34, r * 0.52, r * 0.34);
            ctx.fillStyle = glow;
            for (let k = 0; k < 3; k++) {
                ctx.fillRect(-r * 0.18, -r * 0.30 + k * 9, r * 0.36, 4);
            }
        }
    }

    static drawVolcanicLegs(ctx, r, phase, enraged, flash) {
        const swing = Math.sin(phase) * 0.22;
        const lava = enraged ? '#fef08a' : '#ff6b35';
        for (const [lx, rot] of [[-r * 0.32, -swing], [r * 0.32, swing]]) {
            ctx.save();
            ctx.translate(lx, r * 0.32);
            ctx.rotate(rot);
            ctx.fillStyle = flash ? '#ffffff' : '#1e2230';
            ctx.beginPath(); ctx.roundRect(-r * 0.18, 0, r * 0.36, r * 0.46, 5); ctx.fill(); ctx.stroke();
            if (!flash) {
                ctx.fillStyle = '#334155'; ctx.fillRect(-r * 0.14, 4, r * 0.28, 7);
                ctx.fillStyle = lava; ctx.fillRect(-r * 0.08, r * 0.20, r * 0.16, 4);
            }
            ctx.fillStyle = flash ? '#ffffff' : '#11131d';
            ctx.beginPath(); ctx.roundRect(-r * 0.22, r * 0.36, r * 0.44, r * 0.22, 5); ctx.fill(); ctx.stroke();
            ctx.restore();
        }
    }

    static drawOffhandGauntlet(ctx, r, age, isSlam, enraged, flash) {
        ctx.save();
        ctx.translate(-r * 0.86, -r * 0.04);
        ctx.rotate(isSlam ? -0.82 : Math.sin(age * 0.12) * 0.14);
        ctx.fillStyle = flash ? '#ffffff' : '#2b3044';
        ctx.beginPath(); ctx.roundRect(-r * 0.18, -r * 0.14, r * 0.36, r * 0.56, 7); ctx.fill(); ctx.stroke();
        if (!flash) {
            ctx.fillStyle = enraged ? '#fef08a' : '#ff6b35';
            ctx.fillRect(-r * 0.12, r * 0.28, r * 0.24, r * 0.12);
        }
        ctx.restore();
    }

    static drawBasaltArmorTorso(ctx, r, age, isBack, enraged, flash) {
        const pulse = 0.72 + Math.sin(age * 0.18) * 0.28;
        if (!flash) {
            const bodyG = ctx.createLinearGradient(0, -r * 0.72, 0, r * 0.44);
            bodyG.addColorStop(0, '#2e3448'); bodyG.addColorStop(1, '#141724');
            ctx.fillStyle = bodyG;
        } else ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-r * 0.84, -r * 0.40);
        ctx.lineTo(-r * 0.50, -r * 0.72);
        ctx.lineTo(r * 0.50, -r * 0.72);
        ctx.lineTo(r * 0.84, -r * 0.40);
        ctx.lineTo(r * 0.60, r * 0.44);
        ctx.lineTo(-r * 0.60, r * 0.44);
        ctx.closePath(); ctx.fill(); ctx.stroke();

        for (const s of [-1, 1]) {
            ctx.fillStyle = flash ? '#ffffff' : '#31364c';
            ctx.beginPath(); ctx.roundRect(s > 0 ? 4 : -r * 0.62, -r * 0.56, r * 0.56, r * 0.50, 6); ctx.fill(); ctx.stroke();
            ctx.fillStyle = flash ? '#ffffff' : '#262b3d';
            ctx.beginPath();
            ctx.moveTo(s * r * 0.48, -r * 0.60);
            ctx.lineTo(s * r * 1.02, -r * 0.74);
            ctx.lineTo(s * r * 0.94, -r * 0.18);
            ctx.lineTo(s * r * 0.54, -r * 0.20);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            if (!flash) {
                ctx.fillStyle = enraged ? '#fef08a' : '#ff6b35';
                ctx.fillRect(s * r * 0.68, -r * 0.52, s * r * 0.18, 4);
            }
        }

        if (flash) return;
        ctx.strokeStyle = enraged ? '#fef08a' : `rgba(255, 107, 53, ${pulse})`;
        ctx.lineWidth = enraged ? 3.2 : 2.3;
        ctx.beginPath();
        ctx.moveTo(-r * 0.44, -r * 0.36); ctx.lineTo(0, -r * 0.12); ctx.lineTo(r * 0.44, -r * 0.36);
        ctx.moveTo(0, -r * 0.12); ctx.lineTo(0, r * 0.24);
        ctx.stroke();
        ctx.fillStyle = '#fed330';
        ctx.beginPath(); ctx.arc(0, -r * 0.16, enraged ? 8.5 : 6, 0, Math.PI * 2); ctx.fill();

        if (!isBack) {
            ctx.fillStyle = '#334155'; ctx.strokeStyle = '#0c0d14'; ctx.lineWidth = 2.4;
            ctx.fillRect(-r * 0.56, r * 0.24, r * 1.12, r * 0.15);
            ctx.strokeRect(-r * 0.56, r * 0.24, r * 1.12, r * 0.15);
            ctx.fillStyle = '#d97706';
            ctx.beginPath(); ctx.roundRect(-r * 0.15, r * 0.20, r * 0.30, r * 0.23, 3); ctx.fill(); ctx.stroke();
        }
        ctx.strokeStyle = '#0c0d14'; ctx.lineWidth = 3;
    }

    static drawTitanHornedHead(ctx, r, isBack, enraged, flash) {
        ctx.fillStyle = flash ? '#ffffff' : '#262b3d';
        ctx.beginPath(); ctx.roundRect(-r * 0.36, -r * 1.02, r * 0.72, r * 0.48, 8); ctx.fill(); ctx.stroke();

        // Sharp curved basalt horns with glowing etched ridge rings (no round ball tips!)
        for (const s of [-1, 1]) {
            ctx.fillStyle = flash ? '#ffffff' : '#181b26';
            ctx.beginPath();
            ctx.moveTo(s * r * 0.24, -r * 0.94);
            ctx.quadraticCurveTo(s * r * 0.62, -r * 1.16, s * r * 0.76, -r * 1.40);
            ctx.quadraticCurveTo(s * r * 0.44, -r * 1.04, s * r * 0.22, -r * 0.76);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            if (!flash) {
                ctx.strokeStyle = enraged ? '#fef08a' : '#ff6b35'; ctx.lineWidth = 2.2;
                ctx.beginPath();
                ctx.moveTo(s * r * 0.50, -r * 1.14); ctx.lineTo(s * r * 0.72, -r * 1.36);
                ctx.stroke();
                ctx.strokeStyle = '#0c0d14'; ctx.lineWidth = 3;
            }
        }

        if (flash || isBack) return;
        ctx.fillStyle = '#090b10';
        ctx.fillRect(-r * 0.26, -r * 0.84, r * 0.52, r * 0.14);
        ctx.fillStyle = enraged ? '#ffffff' : '#fed330';
        ctx.fillRect(-r * 0.22, -r * 0.80, r * 0.16, r * 0.06);
        ctx.fillRect(r * 0.06, -r * 0.80, r * 0.16, r * 0.06);
        ctx.fillStyle = '#475569';
        ctx.fillRect(-3, -r * 0.86, 6, r * 0.22);
    }

    static drawFrontShieldOrFist(ctx, r, e, enraged, flash) {
        if (!enraged && e.frontShieldHp > 0) {
            ctx.save();
            ctx.translate(r * 0.90, 0);
            ctx.fillStyle = flash ? '#ffffff' : '#1f2333';
            ctx.beginPath();
            ctx.moveTo(-8, -r * 0.86); ctx.lineTo(13, -r * 0.58);
            ctx.lineTo(16, 0); ctx.lineTo(13, r * 0.58);
            ctx.lineTo(-8, r * 0.86); ctx.lineTo(-12, 0);
            ctx.closePath(); ctx.fill(); ctx.stroke();
            if (!flash) {
                ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2.4;
                ctx.strokeRect(-4, -r * 0.44, 11, r * 0.88);
                ctx.fillStyle = '#fed330';
                ctx.beginPath();
                ctx.moveTo(0, -r * 0.28); ctx.lineTo(10, 0); ctx.lineTo(0, r * 0.28); ctx.lineTo(-6, 0);
                ctx.closePath(); ctx.fill();
                const ratio = Math.max(0.15, e.frontShieldHp / (e.frontShieldMax || 1));
                ctx.strokeStyle = `rgba(254, 211, 48, ${0.45 + ratio * 0.45})`;
                ctx.lineWidth = 4;
                ctx.beginPath(); ctx.arc(-r * 0.10, 0, r * 0.94, -0.82, 0.82); ctx.stroke();
            }
            ctx.restore();
        } else {
            ctx.fillStyle = flash ? '#ffffff' : '#ff6b35';
            ctx.beginPath(); ctx.roundRect(r * 0.46, -11, r * 0.46, 22, 6); ctx.fill(); ctx.stroke();
            if (!flash) {
                ctx.fillStyle = '#fef08a'; ctx.fillRect(r * 0.72, -7, r * 0.14, 14);
            }
        }
    }
}

if (typeof window !== 'undefined') window.ObsidianGolemRenderer = ObsidianGolemRenderer;
if (typeof module !== 'undefined' && module.exports) module.exports = { ObsidianGolemRenderer };
