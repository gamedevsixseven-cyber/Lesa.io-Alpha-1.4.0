/**
 * Lesa.io - Endless Progressive Enemy 2.5D Renderer: DimotikiEnforcer
 * Armored Wave 26+ Municipal Shock Enforcer in midnight-navy riot plate,
 * dorsal copper-coil plasma jetpack, foreground ballistic riot shield,
 * illuminated riot faceplate visor, and a twin-rail Arc-Stun Pulse Carbine.
 */

class DimotikiEnforcerRenderer {
    static draw(ctx, e) {
        const r = e.radius || 27;
        const flash = e.hitFlash > 0;
        const age = e.age || 0;
        const aimAngle = e.angle || 0;
        const facingLeft = Math.cos(aimAngle) < 0;
        const isBack = Math.sin(aimAngle) < -0.68;
        const isDashing = (e.dashTimer || 0) > 0;
        const charging = (e.burstCooldown || 999) <= 18;
        const bob = isDashing ? -2.5 : Math.sin(e.walkCycle || age * 0.22) * 2.6;

        if (!flash && (isDashing || charging)) {
            DimotikiEnforcerRenderer.drawDashAura(ctx, e, r, age, isDashing, charging);
        }

        EndlessEnemyRenderer.drawShadow(ctx, e.x, e.y, r, isDashing ? 1.18 : 1.04, 0.40);

        const canCache = !isDashing && !charging && typeof SpriteAtlasCache !== 'undefined';
        if (canCache) {
            const bins = SpriteAtlasCache.getWalkBins(8);
            const rKey = Math.round(r * 2);
            const walkBin = SpriteAtlasCache.quantizePhase(e.walkCycle || age * 0.22, bins);
            const qCycle = SpriteAtlasCache.binAngle(walkBin, bins);
            const dirKey = (facingLeft ? 'l' : 'r') + (isBack ? 'b' : 'f');
            const blink = walkBin & 1;
            const qAge = isBack
                ? (blink === 0 ? 0 : Math.PI / 0.25)
                : (blink === 0 ? 0 : 5.0);
            const bodyKey = `enforcer_b:${rKey}:${walkBin}:${dirKey}:${flash ? 1 : 0}`;
            const bw = Math.ceil(r * 3.8);
            const bh = Math.ceil(r * 3.8);
            const wy = e.y + bob;

            SpriteAtlasCache.drawCachedAt(ctx, e.x, wy, bodyKey, bw, bh, bw * 0.5, bh * 0.5, (bctx) => {
                bctx.lineWidth = 2.6;
                bctx.strokeStyle = '#141418';
                if (facingLeft) bctx.scale(-1, 1);
                DimotikiEnforcerRenderer.drawDorsalPack(bctx, r, qAge, isBack, false, flash);
                EndlessEnemyRenderer.drawLimbs(bctx, r, qCycle, '#1e272e', '#2d3436', flash);
                DimotikiEnforcerRenderer.drawArmoredTorso(bctx, r, qAge, facingLeft, isBack, false, flash);
                DimotikiEnforcerRenderer.drawRiotHelmet(bctx, r, qAge, isBack, false, false, flash);
                DimotikiEnforcerRenderer.drawBallisticShield(bctx, r, qAge, false, flash);
            });

            const anchorX = facingLeft ? -r * 0.16 : r * 0.16;
            EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle, e.x + anchorX, wy + r * 0.04, () => {
                const gunKey = `enforcer_g:${rKey}:${flash ? 1 : 0}`;
                const gw = Math.ceil(r * 4.8);
                const gh = Math.ceil(r * 3.0);
                SpriteAtlasCache.drawCached(ctx, gunKey, gw, gh, Math.ceil(r * 1.4), gh * 0.5, (gctx) => {
                    gctx.lineWidth = 2.6;
                    gctx.strokeStyle = '#141418';
                    DimotikiEnforcerRenderer.drawPulseCarbine(gctx, r, 0, false, flash);
                });
            }, true);
            if (typeof e.drawOverheadHUD === 'function') e.drawOverheadHUD(ctx);
            return;
        }

        ctx.save();
        ctx.translate(e.x, e.y + bob);
        {
            ctx.lineWidth = 2.6;
            ctx.strokeStyle = '#141418';

            // Character Body Layer
            ctx.save();
            if (facingLeft) ctx.scale(-1, 1);
            if (isDashing) ctx.rotate(0.16);

            DimotikiEnforcerRenderer.drawDorsalPack(ctx, r, age, isBack, isDashing, flash);
            EndlessEnemyRenderer.drawLimbs(ctx, r, e.walkCycle || age * 0.22, '#1e272e', '#2d3436', flash);
            DimotikiEnforcerRenderer.drawArmoredTorso(ctx, r, age, facingLeft, isBack, charging, flash);
            DimotikiEnforcerRenderer.drawRiotHelmet(ctx, r, age, isBack, isDashing, charging, flash);
            DimotikiEnforcerRenderer.drawBallisticShield(ctx, r, age, isDashing, flash);
            ctx.restore();

            // Aimed Twin-Rail Pulse Carbine
            const anchorX = facingLeft ? -r * 0.16 : r * 0.16;
            EndlessEnemyRenderer.drawAimedLayer(ctx, aimAngle, anchorX, r * 0.04, () => {
                DimotikiEnforcerRenderer.drawPulseCarbine(ctx, r, age, charging, flash);
            });
        }

        ctx.restore();
        if (typeof e.drawOverheadHUD === 'function') e.drawOverheadHUD(ctx);
    }

    static drawDashAura(ctx, e, r, age, isDashing, charging) {
        ctx.save();
        ctx.translate(e.x, e.y);
        if (isDashing) {
            ctx.rotate(e.dashAngle || e.angle || 0);
            for (let i = 1; i <= 2; i++) {
                ctx.fillStyle = `rgba(0, 210, 211, ${0.28 - i * 0.09})`;
                ctx.beginPath();
                ctx.ellipse(-i * r * 0.65, 0, r * 0.65, r * 0.42, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();

        ctx.save();
        ctx.translate(e.x, e.y + r * 0.78);
        ctx.strokeStyle = isDashing ? 'rgba(0, 210, 211, 0.88)' : 'rgba(254, 211, 48, 0.72)';
        ctx.lineWidth = 2.6;
        ctx.setLineDash([7, 5]);
        ctx.lineDashOffset = -age * 1.4;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.15, r * 0.42, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    static drawDorsalPack(ctx, r, age, isBack, isDashing, flash) {
        if (!isBack) {
            // Side edge peek of dorsal arc battery pack
            ctx.fillStyle = flash ? '#ffffff' : '#3d3d4a';
            ctx.beginPath();
            ctx.roundRect(-r * 0.64, -r * 0.36, r * 0.24, r * 0.60, 5);
            ctx.fill();
            ctx.stroke();
            if (!flash) {
                ctx.fillStyle = isDashing ? '#00f5ff' : '#fed330';
                ctx.fillRect(-r * 0.60, -r * 0.24, r * 0.12, r * 0.36);
            }
            return;
        }

        // Full back view: Twin copper capacitor thruster pack + cyan charge bars
        ctx.fillStyle = flash ? '#ffffff' : '#2f3640';
        ctx.beginPath();
        ctx.roundRect(-r * 0.48, -r * 0.34, r * 0.96, r * 0.66, 7);
        ctx.fill();
        ctx.stroke();
        if (flash) return;

        for (const ox of [-r * 0.26, r * 0.26]) {
            ctx.fillStyle = '#cd6133';
            ctx.beginPath();
            ctx.roundRect(ox - r * 0.14, -r * 0.30, r * 0.28, r * 0.56, 5);
            ctx.fill();
            ctx.stroke();
            const lvl = 0.6 + Math.sin(age * 0.25) * 0.25;
            ctx.fillStyle = isDashing ? '#ffffff' : '#00d2d3';
            ctx.fillRect(ox - r * 0.08, -r * 0.16, r * 0.16, r * 0.34 * lvl);
        }
    }

    static drawArmoredTorso(ctx, r, age, facingLeft, isBack, charging, flash) {
        // Tapered heavy riot chestplate
        ctx.fillStyle = flash ? '#ffffff' : '#192a56';
        ctx.beginPath();
        ctx.moveTo(-r * 0.54, -r * 0.38);
        ctx.lineTo(r * 0.54, -r * 0.38);
        ctx.lineTo(r * 0.46, r * 0.40);
        ctx.lineTo(-r * 0.46, r * 0.40);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Twin angled gold-trimmed shoulder pauldrons
        for (const side of [-1, 1]) {
            ctx.fillStyle = flash ? '#ffffff' : '#2f3640';
            ctx.beginPath();
            ctx.roundRect(side * r * 0.36 - r * 0.20, -r * 0.44, r * 0.40, r * 0.24, 5);
            ctx.fill();
            ctx.stroke();
            if (!flash) {
                ctx.fillStyle = '#fed330';
                ctx.fillRect(side * r * 0.36 - r * 0.15, -r * 0.40, r * 0.30, r * 0.06);
            }
        }

        if (flash || isBack) return;

        // Tactical slate vest overlay + gold belt buckle
        ctx.fillStyle = '#2f3640';
        ctx.beginPath();
        ctx.roundRect(-r * 0.40, -r * 0.30, r * 0.80, r * 0.54, 6);
        ctx.fill();
        ctx.stroke();

        // Reflective municipal yellow belt & cross-strap
        ctx.fillStyle = '#fed330';
        ctx.fillRect(-r * 0.44, r * 0.22, r * 0.88, r * 0.12);
        ctx.strokeRect(-r * 0.44, r * 0.22, r * 0.88, r * 0.12);

        // Glowing Arc-Core Reactor in center chest
        ctx.fillStyle = '#1e272e';
        ctx.beginPath();
        ctx.arc(r * 0.04, -r * 0.06, r * 0.17, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = charging ? '#ffffff' : '#00d2d3';
        ctx.beginPath();
        ctx.arc(r * 0.04, -r * 0.06, r * (0.10 + (charging ? 0.03 : 0)), 0, Math.PI * 2);
        ctx.fill();

        // Crisp unmirrored Municipal Badge ('ΔΑ') on upper chest lapel
        EndlessEnemyRenderer.drawUnmirroredText(
            ctx, facingLeft, 'ΔΑ', -r * 0.22, -r * 0.16,
            `900 ${Math.max(8, Math.round(r * 0.26))}px sans-serif`, '#fed330', '#141418', r * 0.4
        );
    }

    static drawRiotHelmet(ctx, r, age, isBack, isDashing, charging, flash) {
        // Comms antenna + blinking beacon LED
        ctx.strokeStyle = '#141418';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-r * 0.28, -r * 0.82);
        ctx.lineTo(-r * 0.34, -r * 1.18);
        ctx.stroke();
        if (!flash) {
            ctx.fillStyle = (Math.floor(age * 0.22) % 2 === 0) ? '#00d2d3' : '#fed330';
            ctx.beginPath();
            ctx.arc(-r * 0.34, -r * 1.20, r * 0.09, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // Main tactical dome helmet
        ctx.fillStyle = flash ? '#ffffff' : '#192a56';
        ctx.beginPath();
        ctx.arc(0, -r * 0.58, r * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        if (flash) return;

        // Gold crest ridge across helmet crown
        ctx.fillStyle = '#fed330';
        ctx.beginPath();
        ctx.roundRect(-r * 0.10, -r * 1.00, r * 0.24, r * 0.18, 3);
        ctx.fill();
        ctx.stroke();

        if (isBack) {
            // Back neckplate armor strips
            ctx.fillStyle = '#2f3640';
            ctx.beginPath();
            ctx.roundRect(-r * 0.30, -r * 0.58, r * 0.60, r * 0.24, 4);
            ctx.fill();
            ctx.stroke();
            return;
        }

        // Ear comms cuff
        ctx.fillStyle = '#2f3640';
        ctx.beginPath();
        ctx.arc(-r * 0.34, -r * 0.56, r * 0.13, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Tinted riot polycarbonate visor + glowing gold HUD slit
        ctx.fillStyle = '#1e272e';
        ctx.beginPath();
        ctx.roundRect(-r * 0.12, -r * 0.72, r * 0.52, r * 0.26, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isDashing ? '#00f5ff' : (charging ? '#ffffff' : '#fed330');
        ctx.beginPath();
        ctx.roundRect(-r * 0.05, -r * 0.65, r * 0.42, r * 0.11, 3);
        ctx.fill();

        // Armored chin guard
        ctx.fillStyle = '#576574';
        ctx.beginPath();
        ctx.roundRect(-r * 0.06, -r * 0.46, r * 0.42, r * 0.14, 4);
        ctx.fill();
        ctx.stroke();
    }

    static drawBallisticShield(ctx, r, age, isDashing, flash) {
        // Off-hand angled polycarbonate/alloy Riot Shield on left side
        ctx.save();
        ctx.translate(-r * 0.64, -r * 0.04);
        ctx.rotate(isDashing ? -0.18 : 0.08);
        ctx.fillStyle = flash ? '#ffffff' : '#2f3640';
        ctx.beginPath();
        ctx.roundRect(-r * 0.18, -r * 0.42, r * 0.36, r * 0.86, 6);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            // Cyan armored viewport slit
            ctx.fillStyle = '#00d2d3';
            ctx.fillRect(-r * 0.11, -r * 0.30, r * 0.22, r * 0.16);
            ctx.strokeRect(-r * 0.11, -r * 0.30, r * 0.22, r * 0.16);
            // Gold Municipal Chevron on shield
            ctx.fillStyle = '#fed330';
            ctx.beginPath();
            ctx.moveTo(0, r * 0.02);
            ctx.lineTo(r * 0.12, r * 0.18);
            ctx.lineTo(0, r * 0.32);
            ctx.lineTo(-r * 0.12, r * 0.18);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }

    static drawPulseCarbine(ctx, r, age, charging, flash) {
        // Heavy twin-rail Municipal Pulse Blaster
        ctx.fillStyle = flash ? '#ffffff' : '#2f3640';
        ctx.beginPath();
        ctx.roundRect(r * 0.06, -r * 0.14, r * 0.50, r * 0.28, 4);
        ctx.fill();
        ctx.stroke();

        // Twin rail barrel assembly + cyan accelerator chamber
        ctx.fillStyle = flash ? '#ffffff' : '#576574';
        ctx.beginPath();
        ctx.roundRect(r * 0.48, -r * 0.15, r * 0.56, r * 0.10, 3);
        ctx.roundRect(r * 0.48, r * 0.05, r * 0.56, r * 0.10, 3);
        ctx.fill();
        ctx.stroke();

        if (flash) return;

        // Top holo optic
        ctx.fillStyle = '#192a56';
        ctx.fillRect(r * 0.26, -r * 0.23, r * 0.22, r * 0.10);
        ctx.strokeRect(r * 0.26, -r * 0.23, r * 0.22, r * 0.10);
        ctx.fillStyle = '#fed330';
        ctx.fillRect(r * 0.22, -r * 0.11, r * 0.20, r * 0.22);

        // Glowing cyan core rail + hot muzzle tip
        ctx.fillStyle = charging ? '#ffffff' : '#00d2d3';
        ctx.fillRect(r * 0.52, -r * 0.05, r * 0.48, r * 0.10);

        if (charging) {
            const pulse = r * (0.14 + Math.sin(age * 0.7) * 0.05);
            ctx.fillStyle = 'rgba(0, 245, 255, 0.85)';
            ctx.beginPath();
            ctx.arc(r * 1.08, 0, Math.max(2, pulse), 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

if (typeof window !== 'undefined') {
    window.DimotikiEnforcerRenderer = DimotikiEnforcerRenderer;
}
