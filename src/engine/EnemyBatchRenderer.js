/**
 * Lesa.io - AAA Multi-Pass Enemy Batch Renderer
 * Eliminates 2D Canvas state/texture ping-ponging across 120+ simultaneous on-screen enemies:
 *   Pass 0: Under-body ground hazards (smoke clouds, Molotov fire zones)
 *   Pass 1: Batched pre-baked atlas shadows (1 texture bind, 0 live ctx.ellipse() paths)
 *   Pass 2: Enemy bodies grouped by type/atlas page + direct setTransform hit-squash
 *   Pass 3: Batched fillRect health bars grouped by fillStyle (0 strokeRect / 0 save-restore)
 *   Pass 4: Batched overhead name & debuff labels from the shared label atlas
 * Preserves 100% identical visuals on both Mobile and Desktop PC.
 */

class EnemyBatchRenderer {
    static active = false;
    static canDirectTransform = false;
    static camScale = 1;
    static camTx = 0;
    static camTy = 0;
    static _visRegular = [];
    static _visBosses = [];
    static _buckets = new Map();
    static _bucketOrder = [];
    static _astynomosDamaged = [];
    static _matDamaged = [];

    static _getShadowEntry(isIce) {
        if (typeof SpriteAtlasCache === 'undefined') return null;
        const key = isIce ? 'fx_shadow_ice_v1' : 'fx_shadow_std_v1';
        return SpriteAtlasCache.getOrBake(key, 64, 32, 32, 16, (sctx) => {
            sctx.fillStyle = isIce ? 'rgba(9, 21, 37, 0.39)' : 'rgba(0, 0, 0, 0.29)';
            sctx.beginPath();
            sctx.ellipse(0, 0, 30, 14, 0, 0, Math.PI * 2);
            sctx.fill();
        }, { dpr: 1 });
    }

    static _drawShadowsPass(ctx, list, isMobile) {
        if (list.length === 0) return;
        const stdShadow = EnemyBatchRenderer._getShadowEntry(false);
        let iceCount = 0;

        if (stdShadow && stdShadow.canvas && stdShadow.canvas.width > 0) {
            const sc = stdShadow.canvas;
            const sx = stdShadow.sx, sy = stdShadow.sy, sw = stdShadow.sw, sh = stdShadow.sh;
            for (let i = 0; i < list.length; i++) {
                const e = list[i];
                const t = e.type;
                if (t === 'frost_wolf' || t === 'ice_golem') {
                    iceCount++;
                    continue;
                }
                const r = e.radius || 25;
                let yOff = r * 0.88;
                let rx = r * 0.96;
                let ry = r * 0.38;
                if (t === 'fatmir' || t === 'astynomos' || t === 'mat_officer') {
                    yOff = r * 0.75; rx = r * 0.90; ry = r * 0.35;
                } else if (t === 'casillas') {
                    yOff = r * 0.88; rx = r * 0.85; ry = r * 0.34;
                } else if (t === 'skarmogyftos') {
                    yOff = r * 0.75; rx = r * 0.95; ry = r * 0.45;
                } else if (t === 'psaltis') {
                    yOff = r * 0.78; rx = r * 0.92; ry = r * 0.36;
                } else if (t === 'kafeneio_tank') {
                    rx = r * 1.16; ry = r * 0.44;
                } else if (t === 'ouzo_bomber') {
                    rx = r * 0.98; ry = r * 0.38;
                } else if (t === 'dimotiki_enforcer') {
                    rx = r * ((e.dashTimer || 0) > 0 ? 1.18 : 1.04); ry = r * 0.40;
                } else if (t === 'bio_alchemist') {
                    rx = r * 1.05; ry = r * 0.40;
                }
                const dw = rx * 2.133;
                const dh = ry * 2.285;
                const dx = isMobile ? Math.round(e.x - dw * 0.5) : (e.x - dw * 0.5);
                const dy = isMobile ? Math.round(e.y + yOff - dh * 0.5) : (e.y + yOff - dh * 0.5);
                ctx.drawImage(sc, sx, sy, sw, sh, dx, dy, dw, dh);
            }
        } else {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.29)';
            for (let i = 0; i < list.length; i++) {
                const e = list[i];
                const r = e.radius || 25;
                ctx.beginPath();
                ctx.ellipse(e.x, e.y + r * 0.82, r * 0.92, r * 0.36, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            return;
        }

        if (iceCount > 0) {
            const iceShadow = EnemyBatchRenderer._getShadowEntry(true);
            if (iceShadow && iceShadow.canvas && iceShadow.canvas.width > 0) {
                const ic = iceShadow.canvas;
                const sx = iceShadow.sx, sy = iceShadow.sy, sw = iceShadow.sw, sh = iceShadow.sh;
                for (let i = 0; i < list.length; i++) {
                    const e = list[i];
                    const t = e.type;
                    if (t !== 'frost_wolf' && t !== 'ice_golem') continue;
                    const r = e.radius || 24;
                    const yOff = t === 'ice_golem' ? r * 0.92 : r * 0.72;
                    const rx = t === 'ice_golem' ? r * 1.15 : r * 1.08;
                    const ry = t === 'ice_golem' ? r * 0.42 : r * 0.36;
                    const dw = rx * 2.133;
                    const dh = ry * 2.285;
                    const dx = isMobile ? Math.round(e.x - dw * 0.5) : (e.x - dw * 0.5);
                    const dy = isMobile ? Math.round(e.y + yOff - dh * 0.5) : (e.y + yOff - dh * 0.5);
                    ctx.drawImage(ic, sx, sy, sw, sh, dx, dy, dw, dh);
                }
            }
        }
    }

    static _drawHealthBarsPass(ctx, list, isMobile) {
        if (list.length === 0) return;
        const astDamaged = EnemyBatchRenderer._astynomosDamaged;
        const matDamaged = EnemyBatchRenderer._matDamaged;
        astDamaged.length = 0;
        matDamaged.length = 0;
        let hasDamagedStd = false;
        let hasFatmir = false;

        // Pass 3A: Single #1e272e border bed for all visible bars
        ctx.fillStyle = '#1e272e';
        for (let i = 0; i < list.length; i++) {
            const e = list[i];
            const t = e.type;
            if (t === 'astynomos' || t === 'mat_officer') {
                if (e.hp < e.maxHp) {
                    if (e.isMAT) matDamaged.push(e);
                    else astDamaged.push(e);
                    const bw = (e.radius || 24) * 1.8;
                    const bx = isMobile ? Math.round(e.x - bw * 0.5) : (e.x - bw * 0.5);
                    const by = isMobile ? Math.round(e.y - (e.radius || 24) - 14) : (e.y - (e.radius || 24) - 14);
                    ctx.fillRect(bx - 1, by - 1, bw + 2, 7);
                }
                continue;
            }
            if (t === 'fatmir') hasFatmir = true;
            if (e.hp < e.maxHp) hasDamagedStd = true;
            const barW = t === 'fatmir' ? 46 : 36;
            const offset = t === 'fatmir' ? 94 : (e.hudOffsetY || ((e.radius || 26) + 14));
            const bx = isMobile ? Math.round(e.x - barW * 0.5) : (e.x - barW * 0.5);
            const by = isMobile ? Math.round(e.y - offset) : (e.y - offset);
            ctx.fillRect(bx - 1, by - 1, barW + 2, 7);
        }

        // Pass 3B: Dark #2f3542 trough only on damaged EnemyBase mobs
        if (hasDamagedStd) {
            ctx.fillStyle = '#2f3542';
            for (let i = 0; i < list.length; i++) {
                const e = list[i];
                const t = e.type;
                if (e.hp >= e.maxHp || t === 'astynomos' || t === 'mat_officer') continue;
                const barW = t === 'fatmir' ? 46 : 36;
                const offset = t === 'fatmir' ? 94 : (e.hudOffsetY || ((e.radius || 26) + 14));
                const bx = isMobile ? Math.round(e.x - barW * 0.5) : (e.x - barW * 0.5);
                const by = isMobile ? Math.round(e.y - offset) : (e.y - offset);
                ctx.fillRect(bx, by, barW, 5);
            }
        }

        // Pass 3C: Green HP fills (#20bf6b) for standard non-Fatmir enemies
        ctx.fillStyle = '#20bf6b';
        for (let i = 0; i < list.length; i++) {
            const e = list[i];
            const t = e.type;
            if (t === 'fatmir' || t === 'astynomos' || t === 'mat_officer' || e.hp <= 0) continue;
            const barW = 36;
            const offset = e.hudOffsetY || ((e.radius || 26) + 14);
            const bx = isMobile ? Math.round(e.x - 18) : (e.x - 18);
            const by = isMobile ? Math.round(e.y - offset) : (e.y - offset);
            const ratio = e.hp >= e.maxHp ? 1 : (e.hp / e.maxHp);
            ctx.fillRect(bx, by, barW * ratio, 5);
        }

        // Pass 3D: Red HP fills (#eb4d4b) for Fatmirs
        if (hasFatmir) {
            ctx.fillStyle = '#eb4d4b';
            for (let i = 0; i < list.length; i++) {
                const e = list[i];
                if (e.type !== 'fatmir' || e.hp <= 0) continue;
                const bx = isMobile ? Math.round(e.x - 23) : (e.x - 23);
                const by = isMobile ? Math.round(e.y - 94) : (e.y - 94);
                const ratio = e.hp >= e.maxHp ? 1 : (e.hp / e.maxHp);
                ctx.fillRect(bx, by, 46 * ratio, 5);
            }
        }

        if (astDamaged.length > 0) {
            ctx.fillStyle = '#2ecc71';
            for (let i = 0; i < astDamaged.length; i++) {
                const e = astDamaged[i];
                if (e.hp <= 0) continue;
                const bw = (e.radius || 24) * 1.8;
                const bx = isMobile ? Math.round(e.x - bw * 0.5) : (e.x - bw * 0.5);
                const by = isMobile ? Math.round(e.y - (e.radius || 24) - 14) : (e.y - (e.radius || 24) - 14);
                ctx.fillRect(bx, by, bw * Math.max(0, e.hp / e.maxHp), 5);
            }
        }
        if (matDamaged.length > 0) {
            ctx.fillStyle = '#3498db';
            for (let i = 0; i < matDamaged.length; i++) {
                const e = matDamaged[i];
                if (e.hp <= 0) continue;
                const bw = (e.radius || 24) * 1.8;
                const bx = isMobile ? Math.round(e.x - bw * 0.5) : (e.x - bw * 0.5);
                const by = isMobile ? Math.round(e.y - (e.radius || 24) - 14) : (e.y - (e.radius || 24) - 14);
                ctx.fillRect(bx, by, bw * Math.max(0, e.hp / e.maxHp), 5);
            }
        }
    }

    static _drawLabelsPass(ctx, list, isMobile) {
        if (list.length === 0 || typeof EnemyBase === 'undefined') return;
        for (let i = 0; i < list.length; i++) {
            const e = list[i];
            const t = e.type;
            if (t === 'astynomos' || t === 'mat_officer' || typeof e.getOverheadLabelSprite !== 'function') continue;
            const offset = t === 'fatmir' ? 94 : (e.hudOffsetY || ((e.radius || 26) + 14));
            const hudY = e.y - offset;
            EnemyBase.drawLabel(ctx, e.getOverheadLabelSprite(isMobile), e.x, hudY - 3);
            if (e.bubbleTrappedTimer > 0) {
                const sec = isMobile ? Math.ceil(e.bubbleTrappedTimer / 60) : (e.bubbleTrappedTimer / 60).toFixed(1);
                const trapLbl = EnemyBase.getLabelSprite(`🫧 TRAPPED (${sec}s)`, '800 11px "Luckiest Guy", cursive', '#00d2d3', '#1e272e', 2, 0, 'bottom');
                EnemyBase.drawLabel(ctx, trapLbl, e.x, hudY - 14);
            }
        }
    }

    static render(ctx, camera, enemies) {
        if (!enemies || enemies.length === 0) return;
        const visRegular = EnemyBatchRenderer._visRegular;
        const visBosses = EnemyBatchRenderer._visBosses;
        const buckets = EnemyBatchRenderer._buckets;
        const bucketOrder = EnemyBatchRenderer._bucketOrder;

        visRegular.length = 0;
        visBosses.length = 0;
        for (let i = 0; i < bucketOrder.length; i++) {
            bucketOrder[i].length = 0;
        }
        bucketOrder.length = 0;

        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];
            if (!enemy || enemy.dead) continue;
            const isSpecial = !!(enemy.isBoss || enemy.isMiniBoss || enemy.isEndlessBoss || enemy.isApexPillar || enemy.policeCar);
            const visPad = isSpecial ? 450 : 50;
            if (!camera.isVisible(enemy.x, enemy.y, (enemy.radius || 26) + visPad)) continue;
            if (isSpecial) {
                visBosses.push(enemy);
            } else {
                visRegular.push(enemy);
                const key = enemy.type || 'default';
                let b = buckets.get(key);
                if (!b) {
                    b = [];
                    buckets.set(key, b);
                }
                if (b.length === 0) bucketOrder.push(b);
                b.push(enemy);
            }
        }

        const isMobile = typeof MobilePerf !== 'undefined' && MobilePerf.isMobile;
        const dpr = camera.dpr || 1;
        const camScale = camera.zoom * dpr;
        const camTx = (camera.canvas.width * 0.5) + (camera.shakeOffsetX || 0) * dpr - camera.x * camScale;
        const camTy = (camera.canvas.height * 0.5) + (camera.shakeOffsetY || 0) * dpr - camera.y * camScale;
        const canDirectMatrix = typeof ctx.setTransform === 'function';

        if (visRegular.length > 0) {
            EnemyBatchRenderer.active = true;
            EnemyBatchRenderer.camScale = camScale;
            EnemyBatchRenderer.camTx = camTx;
            EnemyBatchRenderer.camTy = camTy;
            try {
                // Pass 0: Under-body ground hazards (smoke clouds & Molotov fire puddles)
                for (let i = 0; i < visRegular.length; i++) {
                    const e = visRegular[i];
                    if (e.smokeHazards && e.smokeHazards.length > 0) {
                        for (let s = 0; s < e.smokeHazards.length; s++) e.smokeHazards[s].draw(ctx);
                    }
                    if (e.fireZones && e.fireZones.length > 0 && typeof OuzoBomberRenderer !== 'undefined') {
                        OuzoBomberRenderer.drawFireZones(ctx, e.fireZones, e.age || 0);
                    }
                }

                // Pass 1: Batched Atlas Shadows
                EnemyBatchRenderer._drawShadowsPass(ctx, visRegular, isMobile);

                // Pass 2: Type-Grouped Enemy Bodies + Direct Matrix Hit-Squash
                for (let bIdx = 0; bIdx < bucketOrder.length; bIdx++) {
                    const group = bucketOrder[bIdx];
                    for (let i = 0; i < group.length; i++) {
                        const enemy = group[i];
                        if (enemy.hitFlash > 0 && canDirectMatrix) {
                            EnemyBatchRenderer.canDirectTransform = false;
                            const t = Math.min(1, enemy.hitFlash / 8);
                            const squash = Math.sin(t * Math.PI * 0.68) * 0.16;
                            const sx = 1 + squash;
                            const sy = 1 - squash * 0.85;
                            const jx = t > 0.65 ? (Math.sin(enemy.x * 1.7 + enemy.hitFlash * 9) * 2) : 0;
                            ctx.setTransform(
                                camScale * sx, 0, 0, camScale * sy,
                                camTx + camScale * (enemy.x + jx - sx * enemy.x),
                                camTy + camScale * (enemy.y - sy * enemy.y)
                            );
                            enemy.draw(ctx);
                            ctx.setTransform(camScale, 0, 0, camScale, camTx, camTy);
                        } else if (enemy.hitFlash > 0 && typeof CombatRenderFX !== 'undefined') {
                            EnemyBatchRenderer.canDirectTransform = false;
                            const sq = CombatRenderFX.beginEnemyTransform(ctx, enemy);
                            enemy.draw(ctx);
                            if (sq) CombatRenderFX.endEnemyTransform(ctx, sq);
                        } else {
                            EnemyBatchRenderer.canDirectTransform = canDirectMatrix;
                            enemy.draw(ctx);
                        }

                        if (enemy._lilXasFleeing && typeof LilXasCutsceneFX !== 'undefined') {
                            LilXasCutsceneFX.drawFleeingEnemyOverlay(ctx, enemy);
                        }
                        if (enemy.bubbleTrappedTimer > 0 && enemy.drawBubbleTrap) {
                            enemy.drawBubbleTrap(ctx);
                        }
                    }
                }

                // Pass 3: Batched fillRect Health Bars
                EnemyBatchRenderer._drawHealthBarsPass(ctx, visRegular, isMobile);

                // Pass 4: Batched Overhead Name & Debuff Labels
                EnemyBatchRenderer._drawLabelsPass(ctx, visRegular, isMobile);
            } finally {
                EnemyBatchRenderer.active = false;
                EnemyBatchRenderer.canDirectTransform = false;
                if (canDirectMatrix) ctx.setTransform(camScale, 0, 0, camScale, camTx, camTy);
            }
        }

        // Bosses, Mini-Bosses & Special Vehicle Enemies (Full Custom Render)
        for (let i = 0; i < visBosses.length; i++) {
            const boss = visBosses[i];
            const hitSquashed = (typeof CombatRenderFX !== 'undefined') && CombatRenderFX.beginEnemyTransform(ctx, boss);
            boss.draw(ctx);
            if (hitSquashed) CombatRenderFX.endEnemyTransform(ctx, hitSquashed);
            if (boss._lilXasFleeing && typeof LilXasCutsceneFX !== 'undefined') {
                LilXasCutsceneFX.drawFleeingEnemyOverlay(ctx, boss);
            }
            if (boss.bubbleTrappedTimer > 0 && boss.drawBubbleTrap) {
                boss.drawBubbleTrap(ctx);
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.EnemyBatchRenderer = EnemyBatchRenderer;
}
