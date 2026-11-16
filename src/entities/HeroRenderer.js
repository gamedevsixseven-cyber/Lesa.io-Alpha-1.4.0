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

        ctx.save();
        ctx.translate(player.x, player.y);

        const airZ = player.airZ || 0;
        const isAirborne = player.isAirborne;
        const isGrabbed = player.isGrabbed;

        // 2. Dynamic Ground Shadow (Grounded at arena floor, scales down with height)
        const shadowAlpha = 0.32 * Math.max(0.08, 1.0 - airZ / 220);
        ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
        ctx.beginPath();
        const heightScale = Math.max(0.26, 1.0 - airZ / 220);
        const shadowScale = (player.isMoving ? 1.0 + Math.sin((player.walkCycle || 0) * 2) * 0.08 : 1.0) * heightScale;
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

    static drawShieldBubble(player, ctx) {
        const shieldR = player.radius * 1.55;
        const pulse = Math.sin(Date.now() / 200) * 2.5;

        ctx.save();
        ctx.strokeStyle = 'rgba(116, 185, 255, 0.9)';
        ctx.fillStyle = 'rgba(116, 185, 255, 0.22)';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, shieldR + pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Shimmer highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.ellipse(-shieldR * 0.45, -shieldR * 0.45, 6, 3, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
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
        const hpPct = Math.max(0, Math.min(1, player.hp / player.maxHp));
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
