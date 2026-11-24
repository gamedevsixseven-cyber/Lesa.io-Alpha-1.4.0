/**
 * Lesa.io - Endless Progressive Enemy 2.5D Renderer: KafeneioTank
 * Burly old-school Greek village kafeneio brawler in a maroon knit sweater,
 * stained linen apron, dangling aluminum briki coffee pot off-hand, thick
 * grizzled mustache, and a marble-inlaid wrought-iron kafeneio table shield.
 */

class KafeneioTankRenderer {
    static draw(ctx, e) {
        const r = e.radius || 35;
        const flash = e.hitFlash > 0;
        const age = e.age || 0;
        const aimAngle = e.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const isWindup = (e.slamWindup || 0) > 0;
        const bob = isWindup ? -3 : Math.sin(e.walkCycle || age * 0.13) * 2.2;

        if (isWindup) {
            KafeneioTankRenderer.drawSlamTelegraph(ctx, e);
        }

        EndlessEnemyRenderer.drawShadow(ctx, e.x, e.y, r, 1.16, 0.44);

        if (!isWindup && typeof SpriteAtlasCache !== 'undefined') {
            const bins = SpriteAtlasCache.getWalkBins(8);
            const rKey = Math.round(r * 2);
            const walkBin = SpriteAtlasCache.quantizePhase(e.walkCycle || age * 0.13, bins);
            const qCycle = SpriteAtlasCache.binAngle(walkBin, bins);
            const dirKey = isBack ? 'b' : (facingLeft ? 'fl' : 'fr');
            const bodyKey = `kafeneio_b:${rKey}:${walkBin}:${dirKey}:${flash ? 1 : 0}`;
            const bw = Math.ceil(r * 3.6);
            const bh = Math.ceil(r * 3.6);
            const wy = e.y + bob;

            SpriteAtlasCache.drawCachedAt(ctx, e.x, wy, bodyKey, bw, bh, bw * 0.5, bh * 0.5, (bctx) => {
                bctx.lineWidth = 3;
                bctx.strokeStyle = '#141418';
                if (facingLeft) bctx.scale(-1, 1);
                EndlessEnemyRenderer.drawLimbs(bctx, r, qCycle, '#2f3640', '#4a2511', flash);
                KafeneioTankRenderer.drawBrawlerApronTorso(bctx, r, facingLeft, isBack, false, flash);
                KafeneioTankRenderer.drawBrawlerHead(bctx, r, 0, isBack, false, flash);
            });

            const steamBin = Math.floor((((age * 0.08) % 1) + 1) % 1 * 4) & 3;
            const qSteamAge = ((steamBin + 0.5) / 4) / 0.08;
            const brikiKey = `kafeneio_briki:${rKey}:${facingLeft ? 1 : 0}:${steamBin}:${flash ? 1 : 0}`;
            const kw = Math.ceil(r * 3.2);
            SpriteAtlasCache.drawCachedAt(ctx, e.x, wy, brikiKey, kw, kw, kw * 0.5, kw * 0.5, (kctx) => {
                kctx.lineWidth = 3;
                kctx.strokeStyle = '#141418';
                if (facingLeft) kctx.scale(-1, 1);
                KafeneioTankRenderer.drawBrikiOffHand(kctx, r, qSteamAge, false, flash);
            });

            EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle, e.x, wy, () => {
                const shieldKey = `kafeneio_s:${rKey}:${flash ? 1 : 0}`;
                const sw = Math.ceil(r * 3.8);
                const sh = Math.ceil(r * 3.8);
                SpriteAtlasCache.drawCached(ctx, shieldKey, sw, sh, sw * 0.5, sh * 0.5, (sctx) => {
                    sctx.lineWidth = 3;
                    sctx.strokeStyle = '#141418';
                    KafeneioTankRenderer.drawTableShield(sctx, r, false, flash);
                });
            }, true);
            if (typeof e.drawOverheadHUD === 'function') e.drawOverheadHUD(ctx);
            return;
        }

        ctx.save();
        ctx.translate(e.x, e.y + bob);
        {
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#141418';

            // Character Body Layer
            ctx.save();
            if (facingLeft) ctx.scale(-1, 1);

            EndlessEnemyRenderer.drawLimbs(ctx, r, e.walkCycle || age * 0.13, '#2f3640', '#4a2511', flash);
            KafeneioTankRenderer.drawBrikiOffHand(ctx, r, age, isWindup, flash);
            KafeneioTankRenderer.drawBrawlerApronTorso(ctx, r, facingLeft, isBack, isWindup, flash);
            KafeneioTankRenderer.drawBrawlerHead(ctx, r, age, isBack, isWindup, flash);
            ctx.restore();

            // Aimed Marble & Wrought-Iron Kafeneio Table Shield
            const shieldOffset = isWindup ? Math.sin(age * 0.65) * 0.12 : 0;
            EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle + shieldOffset, 0, 0, () => {
                KafeneioTankRenderer.drawTableShield(ctx, r, isWindup, flash);
            });
        }

        ctx.restore();
        if (typeof e.drawOverheadHUD === 'function') e.drawOverheadHUD(ctx);
    }

    static drawSlamTelegraph(ctx, e) {
        const p = Math.max(0, Math.min(1, 1 - (e.slamWindup / 42)));
        ctx.save();
        ctx.strokeStyle = 'rgba(230, 126, 34, 0.94)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 6]);
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.slamRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(230, 126, 34, 0.24)';
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.slamRadius * p, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    static drawBrikiOffHand(ctx, r, age, isWindup, flash) {
        ctx.save();
        ctx.translate(-r * 0.78, -r * 0.12);
        ctx.rotate(0.52 + (isWindup ? -0.45 : Math.sin(age * 0.16) * 0.14));

        // Rolled Sweater Sleeve + Muscular Forearm + Clenched Fist
        ctx.fillStyle = flash ? '#ffffff' : '#b33939';
        ctx.beginPath();
        ctx.roundRect(-r * 0.13, -r * 0.12, r * 0.26, r * 0.22, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = flash ? '#ffffff' : '#df9b72';
        ctx.beginPath();
        ctx.roundRect(-r * 0.11, r * 0.04, r * 0.22, r * 0.28, 6);
        ctx.fill();
        ctx.stroke();

        // Tilted Brushed-Copper Greek Briki Coffee Pot swung on Off-Hand
        ctx.save();
        ctx.translate(-r * 0.10, r * 0.36);
        ctx.rotate(0.45);
        ctx.fillStyle = flash ? '#ffffff' : '#cd6133';
        ctx.beginPath();
        ctx.moveTo(-r * 0.16, -r * 0.12);
        ctx.lineTo(r * 0.16, -r * 0.12);
        ctx.lineTo(r * 0.22, r * 0.16);
        ctx.lineTo(-r * 0.22, r * 0.16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#3d2415';
            ctx.fillRect(-r * 0.36, -r * 0.08, r * 0.22, r * 0.07);
            ctx.strokeRect(-r * 0.36, -r * 0.08, r * 0.22, r * 0.07);

            const sp = (age * 0.08) % 1;
            ctx.fillStyle = `rgba(255, 255, 255, ${0.75 * (1 - sp)})`;
            ctx.beginPath();
            ctx.arc(0, -r * (0.18 + sp * 0.24), r * (0.06 + sp * 0.05), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        ctx.restore();
    }

    static drawBrawlerApronTorso(ctx, r, facingLeft, isBack, isWindup, flash) {
        // Broad Brawler Barrel Sweater Torso
        ctx.fillStyle = flash ? '#ffffff' : '#b33939';
        ctx.beginPath();
        ctx.roundRect(-r * 0.72, -r * 0.48, r * 1.44, r * 0.94, [18, 18, 12, 12]);
        ctx.fill();
        ctx.stroke();

        if (isBack) {
            if (!flash) {
                ctx.strokeStyle = '#f5cd79';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(-r * 0.56, r * 0.14);
                ctx.lineTo(r * 0.56, r * 0.14);
                ctx.stroke();
                ctx.strokeStyle = '#141418';
                ctx.lineWidth = 2.8;
            }
            return;
        }

        // Cream/Khaki Kafeneio Apron + Waist Ties
        ctx.fillStyle = flash ? '#ffffff' : '#f5cd79';
        ctx.beginPath();
        ctx.roundRect(-r * 0.46, -r * 0.42, r * 0.92, r * 0.84, [8, 8, 6, 6]);
        ctx.fill();
        ctx.stroke();

        if (flash) return;

        // Tucked White Towel & Gold Pocket Chain
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(r * 0.16, r * 0.04, r * 0.22, r * 0.28, 3);
        ctx.fill();
        ctx.stroke();

        // Dark Leather Belt & Apron Pocket
        ctx.fillStyle = '#3d2415';
        ctx.fillRect(-r * 0.50, -r * 0.02, r * 1.00, r * 0.11);
        ctx.fillStyle = '#e1b12c';
        ctx.beginPath();
        ctx.roundRect(-r * 0.30, -r * 0.28, r * 0.60, r * 0.22, 4);
        ctx.fill();
        ctx.stroke();

        EndlessEnemyRenderer.drawUnmirroredText(
            ctx, facingLeft, 'ΚΑΦΕ', 0, -r * 0.17,
            '900 7.5px "Fredoka", Arial, sans-serif', '#141418', null, r * 0.54
        );

        if (isWindup) {
            ctx.strokeStyle = 'rgba(255, 71, 87, 0.75)';
            ctx.lineWidth = 2.4;
            ctx.strokeRect(-r * 0.44, -r * 0.40, r * 0.88, r * 0.80);
        }
    }

    static drawBrawlerHead(ctx, r, age, isBack, isWindup, flash) {
        ctx.save();
        ctx.translate(0, -r * 0.64);

        // Burly Bald Head + Side Fringe Hair
        ctx.fillStyle = flash ? '#ffffff' : '#f3a683';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Silver-Grey Fringe on sides/back
        ctx.fillStyle = flash ? '#ffffff' : '#7f8c8d';
        ctx.beginPath();
        if (isBack) {
            ctx.arc(0, r * 0.06, r * 0.36, 0, Math.PI);
        } else {
            ctx.arc(-r * 0.33, 0, r * 0.10, 0, Math.PI * 2);
            ctx.arc(r * 0.33, 0, r * 0.10, 0, Math.PI * 2);
        }
        ctx.fill();

        if (!flash && !isBack) {
            // Sweaty Dome Shine Glint
            ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.beginPath();
            ctx.ellipse(-r * 0.12, -r * 0.20, r * 0.12, r * 0.06, -0.35, 0, Math.PI * 2);
            ctx.fill();

            // Bushy Knitted Brows & Glaring Eyes
            for (const ex of [-r * 0.12, r * 0.14]) {
                ctx.fillStyle = isWindup ? '#ff4757' : '#ffffff';
                ctx.beginPath();
                ctx.arc(ex, -r * 0.04, r * 0.075, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = '#141418';
                ctx.beginPath();
                ctx.arc(ex + r * 0.015, -r * 0.04, r * 0.032, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.strokeStyle = '#3d3d3d';
            ctx.lineWidth = 3.4;
            ctx.beginPath();
            ctx.moveTo(-r * 0.25, -r * 0.15);
            ctx.lineTo(-r * 0.04, -r * 0.09);
            ctx.moveTo(r * 0.27, -r * 0.15);
            ctx.lineTo(r * 0.06, -r * 0.09);
            ctx.stroke();

            // Thick Drooping Grizzled Village Mustache + Toothpick
            ctx.strokeStyle = '#141418';
            ctx.lineWidth = 2;
            ctx.fillStyle = '#2d3436';
            ctx.beginPath();
            ctx.moveTo(r * 0.02, r * 0.07);
            ctx.quadraticCurveTo(-r * 0.18, r * 0.05, -r * 0.28, r * 0.20);
            ctx.quadraticCurveTo(-r * 0.10, r * 0.22, r * 0.02, r * 0.15);
            ctx.quadraticCurveTo(r * 0.14, r * 0.22, r * 0.30, r * 0.20);
            ctx.quadraticCurveTo(r * 0.18, r * 0.05, r * 0.02, r * 0.07);
            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle = '#fed330';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(r * 0.12, r * 0.18);
            ctx.lineTo(r * 0.30, r * 0.25);
            ctx.stroke();
        }
        ctx.restore();
    }

    static drawTableShield(ctx, r, isWindup, flash) {
        ctx.lineWidth = 2.8;
        ctx.strokeStyle = '#141418';

        // Folded Wrought-Iron Table Legs behind Wooden Rim
        if (!flash) {
            ctx.strokeStyle = '#1e272e';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(r * 0.44, -r * 0.32);
            ctx.lineTo(r * 0.70, -r * 0.46);
            ctx.moveTo(r * 0.44, r * 0.32);
            ctx.lineTo(r * 0.70, r * 0.46);
            ctx.stroke();
        }

        // Oak Rim of Tilted Kafeneio Bistro Table Shield pushed forward of shoulder
        ctx.lineWidth = 2.8;
        ctx.strokeStyle = '#141418';
        ctx.fillStyle = flash ? '#ffffff' : (isWindup ? '#a0522d' : '#6f381c');
        ctx.beginPath();
        ctx.roundRect(r * 0.62, -r * 0.76, r * 0.38, r * 1.52, 9);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            // Inlaid Cream Greek Marble Face Panel + Subtle Marble Vein + Brass Studs
            ctx.fillStyle = '#f5f6fa';
            ctx.beginPath();
            ctx.roundRect(r * 0.74, -r * 0.64, r * 0.20, r * 1.28, 5);
            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle = '#b2bec3';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(r * 0.77, -r * 0.44);
            ctx.lineTo(r * 0.89, -r * 0.18);
            ctx.moveTo(r * 0.88, r * 0.12);
            ctx.lineTo(r * 0.77, r * 0.46);
            ctx.stroke();

            // Brass Shield Boss Studs
            ctx.fillStyle = '#f1c40f';
            ctx.strokeStyle = '#141418';
            ctx.lineWidth = 1.6;
            for (const sy of [-r * 0.48, 0, r * 0.48]) {
                ctx.beginPath();
                ctx.arc(r * 0.84, sy, r * 0.068, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            }
        }

        // Heavy Gauntlet Forearm bracing back of Table
        ctx.fillStyle = flash ? '#ffffff' : '#df9b72';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(r * 0.54, 0, r * 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}

if (typeof window !== 'undefined') {
    window.KafeneioTankRenderer = KafeneioTankRenderer;
}
