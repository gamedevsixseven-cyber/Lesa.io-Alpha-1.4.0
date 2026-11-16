/**
 * Lesa.io - Boss Subsystem: KleanthisRenderer
 * Dedicated rendering engine for Kleanthis Boss:
 * - Scaled boss model with Front/Back sprite and vector fallback
 * - Wine bottle in hand with drinking animation & gulping FX
 * - Flying Karate Kick mid-air pose & aerial shadow projection
 * - Drunken sway animation & Crimson Rage fire aura
 * - Overhead Boss HUD: Name badge, Boss HP bar, and Wine Drunk Meter
 */

class KleanthisRenderer {
    static draw(boss, ctx) {
        ctx.save();

        const isJumping = boss.jumpHeight > 0;
        const groundY = boss.y;
        const renderY = boss.y - (boss.jumpHeight || 0);

        // 1. Ground Shadow (stays on ground during jump)
        ctx.save();
        ctx.translate(boss.x, groundY);
        const shadowScale = Math.max(0.35, 1.0 - (boss.jumpHeight || 0) / 180);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
        ctx.beginPath();
        ctx.ellipse(0, boss.radius * 0.75, boss.radius * 0.95 * shadowScale, boss.radius * 0.38 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 2. Boss Body & Actions
        ctx.save();
        ctx.translate(boss.x, renderY);

        // Rage Mode Aura
        if (boss.isRageMode) {
            this.drawRageAura(boss, ctx);
        }

        // Drunk Sway
        let swayAngle = 0;
        if (boss.isDrunk && !isJumping) {
            swayAngle = Math.sin(boss.age * 0.09) * 0.18;
            ctx.rotate(swayAngle);
        }

        const bob = isJumping ? 0 : Math.sin(boss.walkCycle) * 3.5;
        ctx.translate(0, bob);

        // Death Sequence Visual Effect
        if (boss.isDying) {
            const progress = Math.max(0, Math.min(1, 1 - (boss.deathTimer / boss.maxDeathTimer)));
            const shakeMag = 5 + progress * 9;
            const sx = (Math.random() - 0.5) * shakeMag;
            const sy = (Math.random() - 0.5) * shakeMag;
            ctx.translate(sx, sy);

            // Flickering comic white/red strobe flash
            const deathFlash = Math.floor(boss.deathTimer / 5) % 2 === 0;

            // Fading alpha
            ctx.globalAlpha = Math.max(0.2, 1.0 - progress * 0.6);

            // Expanding golden energy burst ring
            ctx.save();
            ctx.strokeStyle = `rgba(254, 211, 48, ${0.4 + 0.6 * (1 - progress)})`;
            ctx.lineWidth = 4 + progress * 6;
            ctx.beginPath();
            ctx.arc(0, 0, boss.radius * (1.1 + progress * 0.5), 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            this.drawBossBody(boss, ctx, deathFlash);
            ctx.restore();
            ctx.restore();
            return; // Skip overhead HUD while dying
        }

        // Flash on hit
        const flash = boss.hitFlash > 0;

        if (isJumping) {
            this.drawKarateKickPose(boss, ctx, flash);
        } else {
            this.drawBossBody(boss, ctx, flash);
            this.drawWineBottle(boss, ctx);
        }

        ctx.restore();
        ctx.restore();

        // 3. Overhead Boss HUD (Health & Drunk Meter)
        this.drawBossHUD(boss, ctx);
    }

    static drawRageAura(boss, ctx) {
        ctx.save();
        const pulse = 1.0 + Math.sin(boss.age * 0.2) * 0.12;
        const grad = ctx.createRadialGradient(0, 0, boss.radius * 0.4, 0, 0, boss.radius * 1.5 * pulse);
        grad.addColorStop(0, 'rgba(255, 71, 87, 0.45)');
        grad.addColorStop(0.7, 'rgba(235, 47, 6, 0.25)');
        grad.addColorStop(1, 'rgba(255, 71, 87, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, boss.radius * 1.5 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    static drawBossBody(boss, ctx, flash) {
        const isBack = Math.sin(boss.angle) < -0.25;
        const facingLeft = Math.cos(boss.angle) < 0;
        const spriteSrc = isBack ? boss.backSpriteSrc : boss.frontSpriteSrc;

        const sprites = typeof window !== 'undefined' ? window.CharacterSprites : null;
        if (sprites && sprites.isReady(spriteSrc)) {
            const img = sprites.get(spriteSrc);
            const spriteH = 135; // Boss scale
            const aspect = (img.naturalWidth && img.naturalHeight) ? (img.naturalWidth / img.naturalHeight) : 0.44;
            const spriteW = spriteH * aspect;
            const feetY = boss.radius * 0.75;

            ctx.save();
            if (facingLeft) ctx.scale(-1, 1);
            if (flash && typeof CharacterSprites !== 'undefined' && CharacterSprites.getFiltered) {
                const cached = CharacterSprites.getFiltered(img, 'flash_25', 'brightness(2.5)', 0);
                ctx.drawImage(cached ? cached.canvas : img, -spriteW / 2, feetY - spriteH, spriteW, spriteH);
            } else {
                ctx.drawImage(img, -spriteW / 2, feetY - spriteH, spriteW, spriteH);
            }
            ctx.restore();
            return;
        }

        // Vector Character Fallback (Boss Scale)
        const r = boss.radius;
        ctx.lineWidth = 3.5;
        ctx.strokeStyle = '#1e272e';

        // Trousers
        ctx.fillStyle = flash ? '#ffffff' : (boss.isRageMode ? '#801313' : '#57606f');
        ctx.beginPath();
        ctx.rect(-r * 0.5, r * 0.1, r * 1.0, r * 0.75);
        ctx.fill();
        ctx.stroke();

        // Vest / Shirt
        ctx.fillStyle = flash ? '#ffffff' : (boss.isRageMode ? '#2c0c0c' : '#2f3542');
        ctx.beginPath();
        ctx.arc(0, -r * 0.2, r * 0.88, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Head
        ctx.fillStyle = flash ? '#ffffff' : (boss.isRageMode ? '#ff7979' : '#fab1a0');
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.85, r * 0.46, r * 0.46, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Beard
        ctx.fillStyle = flash ? '#ffffff' : '#b2bec3';
        ctx.beginPath();
        ctx.arc(0, -r * 0.75, r * 0.38, 0, Math.PI);
        ctx.fill();

        // Cap
        ctx.fillStyle = flash ? '#ffffff' : '#1e272e';
        ctx.beginPath();
        ctx.ellipse(0, -r * 1.15, r * 0.56, r * 0.26, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    static drawWineBottle(boss, ctx) {
        ctx.save();
        const facingLeft = Math.cos(boss.angle) < 0;
        const handX = (facingLeft ? -1 : 1) * (boss.radius * 0.65);
        const handY = -boss.radius * 0.1;

        ctx.translate(handX, handY);

        if (boss.isDrinking) {
            // Tilted back towards mouth
            const tilt = (facingLeft ? -1 : 1) * (Math.PI * 0.65);
            ctx.rotate(tilt);
            ctx.translate(0, -10);
        } else {
            // Held at side
            ctx.rotate((facingLeft ? 0.25 : -0.25));
        }

        // Bottle Body (Dark Green Glass with Red Wine)
        ctx.lineWidth = 2.0;
        ctx.strokeStyle = '#1e272e';
        ctx.fillStyle = '#1b4332'; // Dark green bottle
        ctx.beginPath();
        ctx.roundRect(-7, -14, 14, 24, 4);
        ctx.fill();
        ctx.stroke();

        // Wine Label
        ctx.fillStyle = '#fed330';
        ctx.fillRect(-5, -6, 10, 11);

        // Bottle Neck
        ctx.fillStyle = '#1b4332';
        ctx.beginPath();
        ctx.rect(-3.5, -23, 7, 10);
        ctx.fill();
        ctx.stroke();

        // Cork
        ctx.fillStyle = '#d35400';
        ctx.fillRect(-3, -26, 6, 4);

        ctx.restore();
    }

    static drawKarateKickPose(boss, ctx, flash) {
        const facingLeft = Math.cos(boss.angle) < 0;
        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);
        ctx.rotate(0.35); // Flying forward angle

        // Karate Flying Kick Silhouette
        const r = boss.radius;
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#1e272e';

        // Torso
        ctx.fillStyle = flash ? '#ffffff' : (boss.isRageMode ? '#801313' : '#2f3542');
        ctx.beginPath();
        ctx.ellipse(0, -r * 0.2, r * 0.7, r * 0.9, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Extended Karate Kicking Leg
        ctx.fillStyle = flash ? '#ffffff' : '#57606f';
        ctx.beginPath();
        ctx.moveTo(r * 0.2, 0);
        ctx.lineTo(r * 1.5, -r * 0.1); // Extended foot
        ctx.lineTo(r * 1.4, r * 0.35);
        ctx.lineTo(0, r * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Martial Arts Foot Strike
        ctx.fillStyle = '#fed330';
        ctx.beginPath();
        ctx.arc(r * 1.5, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Head
        ctx.fillStyle = flash ? '#ffffff' : '#fab1a0';
        ctx.beginPath();
        ctx.arc(-r * 0.4, -r * 0.7, r * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    static drawBossHUD(boss, ctx) {
        const hudY = boss.y - 126 - (boss.jumpHeight || 0);
        const barW = 120;
        const barH = 10;
        const halfW = barW / 2;

        ctx.save();

        // 1. Boss Name Badge
        let title = '👑 KLEANTHIS [NORMAL BOSS]';
        let titleColor = '#fed330';
        if (boss.isRageMode) {
            title = '🔥 KLEANTHIS [NORMAL - RAGE]';
            titleColor = '#ff4757';
        } else if (boss.isDrunk) {
            title = '🍷 KLEANTHIS [NORMAL - DRUNK]';
            titleColor = '#e056fd';
        }

        ctx.font = '900 13px "Luckiest Guy", cursive';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1e272e';
        ctx.strokeText(title, boss.x, hudY - 14);
        ctx.fillStyle = titleColor;
        ctx.fillText(title, boss.x, hudY - 14);

        // 2. Health Bar
        const hpPct = Math.max(0, Math.min(1.0, boss.hp / boss.maxHp));
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(boss.x - halfW, hudY - 12, barW, barH);

        ctx.fillStyle = boss.isRageMode ? '#ff4757' : (boss.isDrunk ? '#ff793f' : '#2ed573');
        ctx.fillRect(boss.x - halfW, hudY - 12, barW * hpPct, barH);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#1e272e';
        ctx.strokeRect(boss.x - halfW, hudY - 12, barW, barH);

        // 3. Drunk Meter Bar (Below HP Bar)
        const drunkPct = Math.max(0, Math.min(1.0, boss.drunkMeter / 100));
        const drunkBarH = 7;
        const drunkBarY = hudY + 2;

        ctx.fillStyle = 'rgba(20, 10, 30, 0.85)';
        ctx.fillRect(boss.x - halfW, drunkBarY, barW, drunkBarH);

        // Purple / Wine Gradient for Drunk Bar
        ctx.fillStyle = boss.isDrunk ? '#be2edd' : '#e056fd';
        ctx.fillRect(boss.x - halfW, drunkBarY, barW * drunkPct, drunkBarH);

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#1e272e';
        ctx.strokeRect(boss.x - halfW, drunkBarY, barW, drunkBarH);

        // Small Label inside Drunk Bar
        ctx.font = '800 8px "Luckiest Guy", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(boss.isDrunk ? 'DRUNK 100% ⭐' : `🍷 WINE ${Math.round(boss.drunkMeter)}%`, boss.x, drunkBarY + 6);

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.KleanthisRenderer = KleanthisRenderer;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { KleanthisRenderer };
}
