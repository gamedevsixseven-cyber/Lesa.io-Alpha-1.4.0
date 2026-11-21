/**
 * Lesa.io - Combat Render Transforms, Afterimages, Trails & Screen Feedback
 * Handles themed projectile trails, hero dash/sprint silhouette ghosts,
 * uniform enemy hit squash-and-stretch, low-HP heartbeat vignette, and level-up screen flash.
 */

class CombatRenderFX {
    constructor() {
        this.screenFlash = {
            active: false,
            color: '#ffd32a',
            maxAlpha: 0.34,
            timer: 0,
            duration: 28
        };
        this.lowHpTime = 0;
    }

    clear() {
        this.screenFlash.active = false;
        this.lowHpTime = 0;
    }

    triggerScreenFlash(color = '#ffd32a', maxAlpha = 0.34, durationFrames = 28) {
        this.screenFlash.active = true;
        this.screenFlash.color = color;
        this.screenFlash.maxAlpha = maxAlpha;
        this.screenFlash.duration = Math.max(8, durationFrames);
        this.screenFlash.timer = this.screenFlash.duration;
    }

    update(dt = 1) {
        if (this.screenFlash.active) {
            this.screenFlash.timer -= dt;
            if (this.screenFlash.timer <= 0) this.screenFlash.active = false;
        }
        this.lowHpTime += dt;
    }

    static _getLowHpVignetteSprite() {
        if (CombatRenderFX._lowHpVigSprite) return CombatRenderFX._lowHpVigSprite;
        const size = 256;
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const gctx = c.getContext('2d');
        gctx.translate(size * 0.5, size * 0.5);
        gctx.scale(size / 2.1, size / 2.1);
        const vig = gctx.createRadialGradient(0, 0, 0.54, 0, 0, 1.08);
        vig.addColorStop(0, 'rgba(220, 20, 40, 0)');
        vig.addColorStop(0.62, 'rgba(220, 20, 40, 0.38)');
        vig.addColorStop(1, 'rgba(175, 10, 28, 1)');
        gctx.fillStyle = vig;
        gctx.fillRect(-1.05, -1.05, 2.1, 2.1);
        CombatRenderFX._lowHpVigSprite = c;
        return c;
    }

    static _getFlashSprite() {
        if (CombatRenderFX._flashSprite) return CombatRenderFX._flashSprite;
        const size = 256;
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const gctx = c.getContext('2d');
        gctx.translate(size * 0.5, size * 0.5);
        gctx.scale(size / 2.1, size / 2.1);
        const flashGrad = gctx.createRadialGradient(0, 0, 0.15, 0, 0, 1.05);
        flashGrad.addColorStop(0, 'rgba(255, 243, 180, 0.48)');
        flashGrad.addColorStop(0.55, 'rgba(255, 211, 42, 0.76)');
        flashGrad.addColorStop(1, 'rgba(255, 165, 2, 1)');
        gctx.fillStyle = flashGrad;
        gctx.fillRect(-1.05, -1.05, 2.1, 2.1);
        CombatRenderFX._flashSprite = c;
        return c;
    }

    static getIridescentBubbleDisc() {
        if (CombatRenderFX._bubbleDisc) return CombatRenderFX._bubbleDisc;
        const size = 128;
        const r = 64;
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const bctx = c.getContext('2d');
        const g = bctx.createRadialGradient(-r * 0.3 + r, -r * 0.3 + r, r * 0.1, r, r, r);
        g.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        g.addColorStop(0.3, 'rgba(112, 161, 255, 0.45)');
        g.addColorStop(0.7, 'rgba(0, 206, 201, 0.55)');
        g.addColorStop(0.95, 'rgba(224, 86, 253, 0.65)');
        g.addColorStop(1, 'rgba(112, 161, 255, 0.7)');
        bctx.fillStyle = g;
        bctx.beginPath();
        bctx.arc(r, r, r, 0, Math.PI * 2);
        bctx.fill();
        CombatRenderFX._bubbleDisc = c;
        return c;
    }

    drawScreenOverlays(ctx, width, height, player) {
        if (!ctx || width <= 0 || height <= 0) return;

        // Pulsing Red Low-HP Heartbeat Vignette (<= 30% HP) + subtle damage tick
        if (player && player.hp > 0 && player.maxHp > 0) {
            const hpRatio = player.hp / player.maxHp;
            let edgeAlpha = 0;
            if (hpRatio <= 0.30) {
                const severity = Math.min(1, (0.30 - hpRatio) / 0.30);
                const beatSpeed = 0.08 + severity * 0.06;
                const phase = (this.lowHpTime * beatSpeed) % (Math.PI * 2);
                const lub = Math.pow(Math.max(0, Math.sin(phase)), 4);
                const dub = Math.pow(Math.max(0, Math.sin(phase - 0.75)), 6) * 0.7;
                edgeAlpha = (0.22 + severity * 0.30) * (0.40 + Math.max(lub, dub) * 0.60);
            }
            if (player.hitFlash > 0) {
                edgeAlpha = Math.max(edgeAlpha, Math.min(0.24, (player.hitFlash / 12) * 0.24));
            }
            if (edgeAlpha > 0.005) {
                const prevAlpha = ctx.globalAlpha;
                ctx.globalAlpha = prevAlpha * edgeAlpha;
                ctx.drawImage(CombatRenderFX._getLowHpVignetteSprite(), -width * 0.025, -height * 0.025, width * 1.05, height * 1.05);
                ctx.globalAlpha = prevAlpha;
            }
        }

        // Warm Golden Screen Flash on Level-Up
        if (this.screenFlash.active) {
            const t = Math.max(0, this.screenFlash.timer / this.screenFlash.duration);
            const alpha = this.screenFlash.maxAlpha * (t * t);
            if (alpha > 0.004) {
                const prevAlpha = ctx.globalAlpha;
                ctx.globalAlpha = prevAlpha * Math.min(0.75, alpha * 1.25);
                ctx.drawImage(CombatRenderFX._getFlashSprite(), -width * 0.025, -height * 0.025, width * 1.05, height * 1.05);
                ctx.globalAlpha = prevAlpha;
            }
        }
    }

    static drawBulletTrail(ctx, bullet) {
        if (!bullet.trail || bullet.trail.length === 0) return;
        const len = bullet.trail.length;
        const type = bullet.type;
        if (typeof BossProjectileFX !== 'undefined' && BossProjectileFX.drawTrail(ctx, bullet)) return;

        if (type === 'lightning') {
            ctx.save();
            ctx.strokeStyle = '#00d2d3';
            ctx.lineWidth = 3.2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.globalAlpha = 0.78;
            ctx.beginPath();
            ctx.moveTo(bullet.x, bullet.y);
            for (let i = 0; i < len; i++) {
                const jx = (i % 2 === 0 ? 1 : -1) * 3.5;
                ctx.lineTo(bullet.trail[i].x + jx, bullet.trail[i].y - jx);
            }
            ctx.stroke();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.4;
            ctx.stroke();
            ctx.restore();
            return;
        }

        ctx.save();
        for (let i = 0; i < len; i++) {
            const pt = bullet.trail[i];
            const ratio = 1 - (i + 1) / (len + 1);
            ctx.globalAlpha = Math.max(0.08, ratio * 0.52);

            if (type === 'bubble') {
                const br = Math.max(2, bullet.radius * ratio * 0.52);
                ctx.strokeStyle = '#70a1ff';
                ctx.lineWidth = 1.4;
                ctx.fillStyle = 'rgba(0, 206, 201, 0.25)';
                ctx.beginPath(); ctx.arc(pt.x, pt.y, br, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            } else if (type === 'pepper') {
                ctx.fillStyle = i < 2 ? '#ffa502' : '#ff4757';
                ctx.beginPath(); ctx.arc(pt.x, pt.y, Math.max(2, bullet.radius * ratio * 0.8), 0, Math.PI * 2); ctx.fill();
            } else if (type === 'carbine' || type === 'm4_carbine' || type === 'spas12' || type === 'zeus_thunderbolt' || type === 'chrono_rifle') {
                const segW = Math.max(4, (type === 'zeus_thunderbolt' ? 17 : (type === 'spas12' ? 9 : (type === 'm4_carbine' ? 11 : 14))) * ratio);
                ctx.save();
                ctx.translate(pt.x, pt.y);
                ctx.rotate(Math.atan2(bullet.vy, bullet.vx));
                ctx.fillStyle = type === 'zeus_thunderbolt'
                    ? (i % 2 === 0 ? '#fed330' : '#00f5ff')
                    : (type === 'chrono_rifle' ? (i % 2 === 0 ? '#00f5ff' : '#a55eea') : ((type === 'spas12' && bullet._spasBreach) ? '#ff4757' : (i % 2 === 0 ? '#ffd32a' : '#ff9f43')));
                ctx.fillRect(-segW * 0.5, -1.6 * ratio, segW, 3.2 * ratio);
                ctx.restore();
            } else if (type === 'boomerang_saw') {
                ctx.strokeStyle = bullet._returning ? (i % 2 === 0 ? '#00f5ff' : '#dfe6e9') : (i % 2 === 0 ? '#ff9f43' : '#feca57');
                ctx.lineWidth = Math.max(1.5, 3.0 * ratio);
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, Math.max(3, (bullet.radius || 15) * 0.72 * ratio), i * 0.8, i * 0.8 + Math.PI * 1.15);
                ctx.stroke();
            } else if (type === 'soundwave' || type === 'dialtone') {
                ctx.strokeStyle = i % 2 === 0 ? '#00d2d3' : '#fed330';
                ctx.lineWidth = Math.max(1.2, 2.2 * ratio);
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, Math.max(2, (bullet.radius || 10) * 0.65 * ratio), 0, Math.PI * 2);
                ctx.stroke();
            } else if (type === 'money_gun' || type === 'euro') {
                const sr = Math.max(2, 4.5 * ratio);
                ctx.fillStyle = i % 2 === 0 ? '#ffd32a' : '#2ecc71';
                ctx.translate(pt.x, pt.y);
                ctx.rotate(bullet.age * 0.2 + i);
                ctx.fillRect(-sr, -sr * 0.5, sr * 2, sr);
                ctx.rotate(-(bullet.age * 0.2 + i));
                ctx.translate(-pt.x, -pt.y);
            } else {
                ctx.fillStyle = bullet.getTrailColor();
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, Math.max(1.5, bullet.radius * (1 - (i + 1) / (len + 1) * 0.55)), 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    static onDashStart(player, effects) {
        if (!player || !player.ghostTrails) return;
        player.ghostTrails.push({
            x: player.x, y: player.y, angle: player.angle,
            walkCycle: player.walkCycle || 0, vx: player.vx, vy: player.vy,
            alpha: 0.9, isBlade: !!player.isBladeRushing
        });
        if (effects) {
            effects.addDust(player.x, player.y, 8, 12);
            effects.addComicSplash(player.x, player.y - 30, 'WHOOSH!');
        }
    }

    static recordDashGhost(player, dt = 1) {
        if (!player || !player.ghostTrails) return;
        const speedSq = player.vx * player.vx + player.vy * player.vy;
        const isFrenzySprint = !player.isDashing && !player.isBladeRushing && (player.frenzyTimer > 0 || player.frappesFrenzyTimer > 0) && speedSq > 16;

        if (player.isBladeRushing || player.isDashing) {
            player.trailSpawnTimer = (player.trailSpawnTimer || 0) + dt;
            if (player.trailSpawnTimer >= (player.isBladeRushing ? 1.5 : 1.7)) {
                player.trailSpawnTimer = 0;
                player.ghostTrails.push({
                    x: player.x, y: player.y, angle: player.angle,
                    walkCycle: player.walkCycle || 0, vx: player.vx, vy: player.vy,
                    alpha: player.isBladeRushing ? 0.9 : 0.78, isBlade: !!player.isBladeRushing
                });
            }
        } else if (isFrenzySprint) {
            player.trailSpawnTimer = (player.trailSpawnTimer || 0) + dt;
            if (player.trailSpawnTimer >= 3.2) {
                player.trailSpawnTimer = 0;
                player.ghostTrails.push({
                    x: player.x, y: player.y, angle: player.angle,
                    walkCycle: player.walkCycle || 0, vx: player.vx, vy: player.vy,
                    alpha: 0.45, isSprint: true
                });
            }
        }
        if (player.ghostTrails.length > 10) player.ghostTrails.splice(0, player.ghostTrails.length - 10);
    }

    static _getGhostBuffer() {
        if (typeof document === 'undefined') return null;
        if (!CombatRenderFX._ghostCanvas) {
            const c = document.createElement('canvas');
            c.width = 160;
            c.height = 160;
            CombatRenderFX._ghostCanvas = c;
            CombatRenderFX._ghostCtx = c.getContext('2d');
            CombatRenderFX._ghostProxy = {};
        }
        return CombatRenderFX._ghostCanvas;
    }

    static drawHeroAfterimage(ctx, player, ghost) {
        if (!ghost || ghost.alpha <= 0.02) return;
        if (ghost.isAirborne) {
            ctx.save();
            ctx.translate(ghost.x, ghost.y);
            ctx.globalAlpha = ghost.alpha * 0.55;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath(); ctx.arc(0, 0, (player.radius || 25) * 0.75, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
            return;
        }

        const tint = ghost.isBlade ? '#5ef2f2' : (ghost.isSprint ? '#ffbe76' : '#48dbfb');
        const buf = CombatRenderFX._getGhostBuffer();

        if (buf && typeof HeroSkinRenderer !== 'undefined') {
            const gctx = CombatRenderFX._ghostCtx;
            const proxy = CombatRenderFX._ghostProxy;
            proxy.radius = player.radius || 25;
            proxy.angle = typeof ghost.angle === 'number' ? ghost.angle : player.angle;
            proxy.vx = ghost.vx || 0;
            proxy.vy = ghost.vy || 0;
            proxy.heroType = player.heroType;
            proxy.weaponType = player.weaponType;
            proxy.recoilOffset = 0;
            proxy.bladeTimer = ghost.isBlade ? 12 : 0;
            proxy.bubbleCharge = 0;

            gctx.clearRect(0, 0, 160, 160);
            gctx.save();
            gctx.translate(80, 92);
            HeroSkinRenderer.drawModel(proxy, gctx, ghost.walkCycle || 0, true, true);
            gctx.restore();

            gctx.save();
            gctx.globalCompositeOperation = 'source-in';
            gctx.fillStyle = tint;
            gctx.fillRect(0, 0, 160, 160);
            gctx.restore();

            ctx.save();
            ctx.globalAlpha = ghost.alpha * (ghost.isBlade ? 0.68 : 0.58);
            ctx.drawImage(buf, ghost.x - 80, ghost.y - 92);

            const spd = Math.hypot(ghost.vx || 0, ghost.vy || 0);
            if (spd > 2) {
                const nx = -(ghost.vx / spd);
                const ny = -(ghost.vy / spd);
                ctx.strokeStyle = tint;
                ctx.lineWidth = 2.8;
                ctx.lineCap = 'round';
                for (let l = -1; l <= 1; l++) {
                    const ox = -ny * l * 10;
                    const oy = nx * l * 10;
                    ctx.beginPath();
                    ctx.moveTo(ghost.x + ox, ghost.y + oy);
                    ctx.lineTo(ghost.x + ox + nx * 26, ghost.y + oy + ny * 26);
                    ctx.stroke();
                }
            }
            ctx.restore();
            return;
        }

        ctx.save();
        ctx.translate(ghost.x, ghost.y);
        ctx.globalAlpha = ghost.alpha * 0.45;
        ctx.fillStyle = tint;
        ctx.beginPath(); ctx.arc(0, 0, player.radius || 25, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    static beginEnemyTransform(ctx, enemy) {
        if (!enemy || !(enemy.hitFlash > 0)) return false;
        const t = Math.min(1, enemy.hitFlash / 8);
        const amp = (enemy.isBoss || enemy.isMiniBoss) ? 0.08 : 0.16;
        const squash = Math.sin(t * Math.PI * 0.68) * amp;
        const jitterX = t > 0.65 ? (Math.sin(enemy.x * 1.7 + enemy.hitFlash * 9) * 2) : 0;

        ctx.save();
        ctx.translate(enemy.x + jitterX, enemy.y);
        ctx.scale(1 + squash, 1 - squash * 0.85);
        ctx.translate(-enemy.x, -enemy.y);
        return true;
    }

    static endEnemyTransform(ctx, applied) {
        if (applied) ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.CombatRenderFX = CombatRenderFX;
}
