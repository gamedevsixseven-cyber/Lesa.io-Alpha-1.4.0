/**
 * Lesa.io - Hero Vector Renderer & Overhead HUD Coordinator
 * Orchestrates cartoon rendering, weapons, drawn tactical knife, bubble shields, and overhead health tags
 */

class HeroRenderer {
    static draw(player, ctx) {
        // 1. Ghost dash, sprint & airborne trails
        for (const ghost of player.ghostTrails) {
            if (typeof CombatRenderFX !== 'undefined') {
                CombatRenderFX.drawHeroAfterimage(ctx, player, ghost);
            } else {
                ctx.save();
                ctx.translate(ghost.x, ghost.y);
                ctx.globalAlpha = ghost.alpha * (ghost.isBlade ? 0.65 : 0.4);
                if (ghost.isAirborne) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                    ctx.beginPath();
                    ctx.arc(0, 0, (player.radius || 25) * 0.75, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    HeroSkinRenderer.drawModel(player, ctx, 0, ghost.isBlade, false);
                }
                ctx.restore();
            }
        }

        if (typeof HeroUltimates !== 'undefined') {
            HeroUltimates.drawUnderPlayer(player, ctx);
        }

        ctx.save();
        ctx.translate(player.x, player.y);

        const airZ = player.airZ || 0;
        const isAirborne = player.isAirborne;
        const isGrabbed = player.isGrabbed;

        // Mounted Petros VF185 Rideable Mode (replaces walking rig with bike+rider model)
        if (player.vf185Active && typeof VF185Model !== 'undefined') {
            ctx.save();
            if (airZ > 0) ctx.translate(0, -airZ);
            VF185Model.drawMountedPetros(player, ctx, player.hitFlash > 0);
            if (player.shieldActive) HeroRenderer.drawShieldBubble(player, ctx);
            ctx.restore();
            ctx.restore();
            if (typeof HeroUltimates !== 'undefined') HeroUltimates.drawOverPlayer(player, ctx);
            if (!isAirborne) HeroRenderer.drawOverheadHUD(player, ctx, airZ);
            return;
        }

        // 2. Dynamic Ground Shadow (Grounded at arena floor, scales down with height)
        const shadowAlpha = 0.32 * Math.max(0.08, 1.0 - airZ / 220);
        const heightScale = Math.max(0.26, 1.0 - airZ / 220);
        const shadowScale = (player.isMoving ? 1.0 + Math.sin((player.walkCycle || 0) * 2) * 0.08 : 1.0) * heightScale;
        if (typeof MobilePerf !== 'undefined' && MobilePerf.isHighGraphics()) {
            ctx.fillStyle = `rgba(12, 24, 28, ${shadowAlpha * 0.45})`;
            ctx.beginPath();
            ctx.ellipse(0, player.radius * 0.8, player.radius * 1.1 * shadowScale, player.radius * 0.42 * shadowScale, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(0, player.radius * 0.75, player.radius * 0.85 * shadowScale, player.radius * 0.32 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();

        // 3. Render Advanced Rigged Hero Model (Elevated into the air)
        ctx.save();
        if (airZ > 0) {
            ctx.translate(0, -airZ);
            const scale = 1.0 + Math.min(0.32, airZ / 260);
            ctx.scale(scale, scale);
        }

        // Landing cartoon squash & stretch
        if (player.landingSquashTimer > 0) {
            const sqRatio = player.landingSquashTimer / 14;
            ctx.scale(1.0 + sqRatio * 0.35, 1.0 - sqRatio * 0.35);
        }

        // Airborne Tumble Rotation or Grab struggle tilt
        if (isAirborne) {
            ctx.rotate(player.airRotation || 0);
        } else if (isGrabbed) {
            ctx.rotate(Math.sin((player.age || 0) * 0.5) * 0.16);
        }

        const flash = player.hitFlash > 0;
        const walkParam = isGrabbed ? (player.age || 0) * 0.6 : (player.walkCycle || 0);
        HeroSkinRenderer.drawModel(player, ctx, walkParam, flash, (player.isMoving || isGrabbed));

        // 4. Bouncy Bubble Shield
        if (player.shieldActive) {
            HeroRenderer.drawShieldBubble(player, ctx);
        }
        ctx.restore();

        ctx.restore();

        if (typeof HeroUltimates !== 'undefined') {
            HeroUltimates.drawOverPlayer(player, ctx);
        }

        // 5. Overhead Name & HP Bar (Hides while airborne, tracks with height during grab)
        if (!isAirborne) {
            HeroRenderer.drawOverheadHUD(player, ctx, airZ);
        }
    }

    static drawCartoonBody(player, ctx, bob, flash, moving) {
        HeroSkinRenderer.drawModel(player, ctx, player.walkCycle || 0, flash, moving);
    }

    static drawHandsAndWeapon(player, ctx, r, flash) {
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#1e272e';

        const isSpriteHero = (player.heroType === 'psogas' || player.heroType === 'petros');

        ctx.save();
        if (isSpriteHero) {
            ctx.translate(0, -r * 0.35);
            ctx.rotate(player.angle);
            ctx.translate(r * 0.75, 0);
        } else {
            const weaponX = r * 0.8;
            ctx.translate(weaponX, 0);
        }

        if (player.weaponType === 'watermelon') {
            ctx.fillStyle = flash ? '#ffffff' : '#20bf6b';
            ctx.fillRect(0, -7, 18, 14);
            ctx.strokeRect(0, -7, 18, 14);
        } else if (player.weaponType === 'pepper') {
            ctx.fillStyle = flash ? '#ffffff' : '#eb4d4b';
            ctx.fillRect(0, -5, 16, 10);
            ctx.strokeRect(0, -5, 16, 10);
        } else if (typeof WeaponSystem !== 'undefined' && WeaponSystem.drawEquippedModel(ctx, player.weaponType, flash, 0, player)) {
            // Shared unlockable weapon rendered by WeaponSystem
        } else {
            ctx.fillStyle = flash ? '#ffffff' : '#9c6615';
            ctx.beginPath();
            ctx.moveTo(0, -2);
            ctx.lineTo(8, -2);
            ctx.lineTo(14, -10);
            ctx.lineTo(18, -9);
            ctx.lineTo(12, -1);
            ctx.lineTo(12, 1);
            ctx.lineTo(18, 9);
            ctx.lineTo(14, 10);
            ctx.lineTo(8, 2);
            ctx.lineTo(0, 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(16, -9);
            ctx.lineTo(4, 0);
            ctx.lineTo(16, 9);
            ctx.stroke();
        }

        ctx.restore();

        // Hands for top-down circular heroes (Psanas)
        if (!isSpriteHero) {
            ctx.fillStyle = flash ? '#ffffff' : '#f5cd79';
            ctx.beginPath();
            ctx.arc(r * 0.6, -r * 0.6, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(r * 0.6, r * 0.6, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // Drawn Tactical Knife during Blade Rush (Swish stance)
        if (player.bladeTimer > 0) {
            ctx.save();
            ctx.translate(r * 0.65, r * 0.55);
            const slashAngleProgress = Math.sin((player.bladeTimer / 24) * Math.PI);
            ctx.rotate(0.35 + slashAngleProgress * 0.5);

            // Knife Hilt / Grip
            ctx.fillStyle = flash ? '#ffffff' : '#2d3436';
            ctx.fillRect(-3, -2.5, 8, 5);
            ctx.strokeRect(-3, -2.5, 8, 5);

            // Crossguard
            ctx.fillStyle = flash ? '#ffffff' : '#636e72';
            ctx.fillRect(5, -6, 3, 12);
            ctx.strokeRect(5, -6, 3, 12);

            // Razor Steel Blade
            ctx.fillStyle = flash ? '#ffffff' : '#dfe6e9';
            ctx.strokeStyle = '#1e272e';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(8, -4);
            ctx.lineTo(26, -1);
            ctx.lineTo(29, 0);
            ctx.lineTo(24, 4);
            ctx.lineTo(8, 4);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Blade Edge Highlight / Cyan Energy Glint
            ctx.strokeStyle = flash ? '#ffffff' : '#00d2d3';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(9, -2);
            ctx.lineTo(28, 0);
            ctx.stroke();

            ctx.restore();
        }
    }

    static _traceHex(ctx, cx, cy, r) {
        ctx.moveTo(cx + r, cy);
        for (let i = 1; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        }
        ctx.closePath();
    }

    static drawShieldBubble(player, ctx) {
        const t = Date.now() * 0.001;
        const baseR = (player.radius || 25) * 1.62;
        const pulse = Math.sin(t * 4.2) * 1.6;
        const R = baseR + pulse;
        const glowPulse = 0.5 + 0.5 * Math.sin(t * 5.6);

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // 1. Hollow-core Fresnel energy dome gradient (keeps hero crisp, charges up the rim)
        const domeGrad = ctx.createRadialGradient(0, 0, R * 0.34, 0, 0, R);
        domeGrad.addColorStop(0.00, 'rgba(56, 189, 248, 0.02)');
        domeGrad.addColorStop(0.58, 'rgba(37, 99, 235, 0.09)');
        domeGrad.addColorStop(0.84, 'rgba(14, 165, 233, 0.28)');
        domeGrad.addColorStop(0.95, `rgba(125, 211, 252, ${(0.52 + glowPulse * 0.14).toFixed(2)})`);
        domeGrad.addColorStop(1.00, 'rgba(224, 242, 254, 0.72)');
        ctx.fillStyle = domeGrad;
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.fill();

        // 2. Clipped internal hexagonal energy lattice + sweeping plasma scan band
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, R * 0.96, 0, Math.PI * 2);
        ctx.clip();

        ctx.save();
        ctx.rotate(t * 0.24);
        const cellR = R * 0.33;
        const ringD = cellR * 1.732;
        ctx.strokeStyle = `rgba(186, 230, 253, ${(0.20 + glowPulse * 0.10).toFixed(2)})`;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3 + Math.PI / 6;
            HeroRenderer._traceHex(ctx, Math.cos(a) * ringD * 1.15, Math.sin(a) * ringD * 1.15, cellR);
        }
        ctx.stroke();

        // Inner faceted barrier hex + radial energy struts linking rim nodes
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.38)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        HeroRenderer._traceHex(ctx, 0, 0, R * 0.86);
        for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3;
            ctx.moveTo(Math.cos(a) * (R * 0.86), Math.sin(a) * (R * 0.86));
            ctx.lineTo(Math.cos(a) * R, Math.sin(a) * R);
        }
        ctx.stroke();
        ctx.restore();

        // Subtle diagonal energy sweep wave across the dome
        const sweep = ((t * 0.65) % 1) * (R * 2.6) - R * 1.3;
        ctx.save();
        ctx.rotate(-0.55);
        const bandGrad = ctx.createLinearGradient(sweep - 14, 0, sweep + 14, 0);
        bandGrad.addColorStop(0.0, 'rgba(186, 230, 253, 0)');
        bandGrad.addColorStop(0.5, 'rgba(224, 242, 254, 0.24)');
        bandGrad.addColorStop(1.0, 'rgba(186, 230, 253, 0)');
        ctx.fillStyle = bandGrad;
        ctx.fillRect(sweep - 14, -R, 28, R * 2);
        ctx.restore();

        ctx.restore(); // end dome clip

        // 3. Comic-inked outer energy barrier rim + crisp Fresnel specular arc
        ctx.strokeStyle = '#0c2461';
        ctx.lineWidth = 4.2;
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.3;
        ctx.beginPath();
        ctx.arc(0, 0, R - 0.5, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(240, 249, 255, 0.88)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(0, 0, R - 2.6, -2.55, -1.25);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(186, 230, 253, 0.65)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(0, 0, R - 2.6, 0.55, 1.15);
        ctx.stroke();

        // 4. Orbiting kinetic shield bracket arcs & 4 diamond emitter nodes
        const guardR = R + 4.8;
        ctx.save();
        ctx.rotate(t * 1.05);
        for (let i = 0; i < 2; i++) {
            const a0 = i * Math.PI - 0.52;
            const a1 = i * Math.PI + 0.52;
            ctx.strokeStyle = '#0c2461';
            ctx.lineWidth = 4.6;
            ctx.beginPath();
            ctx.arc(0, 0, guardR, a0, a1);
            ctx.stroke();

            ctx.strokeStyle = '#7dd3fc';
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.arc(0, 0, guardR, a0, a1);
            ctx.stroke();
        }
        ctx.restore();

        ctx.save();
        ctx.rotate(-t * 0.72);
        for (let i = 0; i < 4; i++) {
            const na = (i * Math.PI) / 2;
            const nx = Math.cos(na) * (R + 1.2);
            const ny = Math.sin(na) * (R + 1.2);
            ctx.save();
            ctx.translate(nx, ny);
            ctx.rotate(na);
            ctx.fillStyle = '#e0f2fe';
            ctx.strokeStyle = '#0c2461';
            ctx.lineWidth = 1.7;
            ctx.beginPath();
            ctx.moveTo(4.2, 0);
            ctx.lineTo(0, 2.8);
            ctx.lineTo(-4.2, 0);
            ctx.lineTo(0, -2.8);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();

        ctx.restore();
    }

    static drawOverheadHUD(player, ctx, airZ = 0) {
        const hpBarW = 46;
        const hpBarH = 6.5;
        const barX = player.x - hpBarW / 2;
        const barY = player.y - airZ - player.radius - 14;

        // Name Tag
        ctx.save();
        ctx.font = '900 11px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 2.5;
        ctx.strokeText(player.name || 'Hero', player.x, barY - 4);
        ctx.fillText(player.name || 'Hero', player.x, barY - 4);

        // Background
        ctx.fillStyle = '#1e272e';
        ctx.beginPath();
        ctx.roundRect(barX - 1.5, barY - 1.5, hpBarW + 3, hpBarH + 3, 4);
        ctx.fill();

        // HP Fill
        const safeMaxHp = (Number.isFinite(player.maxHp) && player.maxHp > 0) ? player.maxHp : 100;
        const safeHp = Number.isFinite(player.hp) ? player.hp : 0;
        const hpPct = Math.max(0, Math.min(1, safeHp / safeMaxHp));
        let hpColor = '#2ed573';
        if (hpPct < 0.3) hpColor = '#ff4757';
        else if (hpPct < 0.6) hpColor = '#ffa502';

        ctx.fillStyle = hpColor;
        ctx.beginPath();
        ctx.roundRect(barX, barY, hpBarW * hpPct, hpBarH, 3);
        ctx.fill();

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.HeroRenderer = HeroRenderer;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HeroRenderer };
}
