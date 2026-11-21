/**
 * Lesa.io - Remote Player Entity (Co-op Partner)
 * Manages interpolation, remote animations, overhead team tags, and downed states
 */

class RemotePlayer {
    constructor(x = 0, y = 0, heroType = 'petros', name = 'Partner') {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.vx = 0;
        this.vy = 0;

        this.heroType = heroType;
        this.name = name;
        this.weaponType = 'pea';

        this.radius = 24;
        this.maxHp = 100;
        this.hp = 100;
        this.isDowned = false;
        this.isHost = false;

        // Visual / Rigging state for HeroRenderer
        this.angle = 0;
        this.targetAngle = 0;
        this.walkCycle = 0;
        this.isMoving = false;
        this.hitFlash = 0;
        this.shieldActive = false;
        this.isDashing = false;
        this.isAirborne = false;
        this.isGrabbed = false;
        this.airZ = 0;
        this.ghostTrails = [];
        this.invulnerableTimer = 0;
        this.speedDebuffTimer = 0;
        this.damageReduction = 0;
        this.isBladeRushing = false;

        this.applyHeroStats(heroType);
    }

    applyHeroStats(heroType, opts = null) {
        this.heroType = heroType;
        const wasFull = !this.hp || this.hp >= this.maxHp;
        const heroData = (typeof HEROES !== 'undefined' && HEROES[heroType]) ? HEROES[heroType] : null;
        if (heroData) {
            this.maxHp = heroData.hp || 100;
            this.weaponType = heroData.weaponType || 'pea';
            this.heroColor = heroData.heroColor || '#1e70d6';
            this.damageReduction = heroData.damageReduction || 0;
        } else {
            this.maxHp = heroType === 'petros' ? 150 : 100;
            this.weaponType = 'pea';
            this.heroColor = '#1e70d6';
            this.damageReduction = heroType === 'petros' ? 0.08 : 0;
        }
        if (opts) {
            if (typeof opts.weaponType === 'string' && opts.weaponType) this.weaponType = opts.weaponType;
            if (typeof opts.heroSkin === 'string') this.heroSkin = opts.heroSkin;
            if (opts.heroStyle !== undefined) this.heroStyle = opts.heroStyle;
            if (typeof opts.starBlessed === 'boolean') this.starBlessed = opts.starBlessed;
            if (typeof opts.maxHp === 'number' && Number.isFinite(opts.maxHp)) {
                this.maxHp = Math.max(60, Math.min(1200, Math.round(opts.maxHp)));
            }
            if (typeof opts.damageReduction === 'number' && Number.isFinite(opts.damageReduction)) {
                this.damageReduction = Math.max(0, Math.min(0.70, opts.damageReduction));
            }
        }
        if (wasFull || this.hp > this.maxHp) this.hp = this.maxHp;
    }

    takeDamage(amount, effects = null, camera = null) {
        if (this.invulnerableTimer > 0 || this.hp <= 0) return false;
        const mult = (this.damageReduction && this.damageReduction > 0) ? (1 - this.damageReduction) : 1;
        const actualDamage = Math.max(1, Math.round(amount * mult));
        this.hp = Math.max(0, this.hp - actualDamage);
        this.hitFlash = 12;
        this.invulnerableTimer = 18;

        if (effects) {
            effects.addDamage(this.x, this.y, actualDamage, false, true);
            effects.addSparks(this.x, this.y, '#ff4757', 6);
        }

        if (this.hp <= 0) {
            this.isDowned = true;
            if (effects) {
                effects.addComicSplash(this.x, this.y, 'DOWNED!');
            }
        }
        return true;
    }

    setTargetState(data) {
        if (!data) return;
        if (typeof data.x === 'number') this.targetX = data.x;
        if (typeof data.y === 'number') this.targetY = data.y;
        if (typeof data.vx === 'number') this.vx = data.vx;
        if (typeof data.vy === 'number') this.vy = data.vy;
        if (typeof data.angle === 'number') this.targetAngle = data.angle;

        // Snap immediately if large discrepancy (e.g. spawn, teleport, or dash)
        const distSq = (this.targetX - this.x) ** 2 + (this.targetY - this.y) ** 2;
        if (distSq > 20000 || data.isDashing) {
            this.x = this.targetX;
            this.y = this.targetY;
        }

        if (this.isHost && typeof data.hp === 'number') {
            if (data.hp < this.hp) this.hitFlash = 10;
            this.hp = Math.max(0, Math.min(this.maxHp, data.hp));
            this.isDowned = (this.hp <= 0);
        }
        if (typeof data.maxHp === 'number' && Number.isFinite(data.maxHp)) {
            this.maxHp = Math.max(60, Math.min(1200, Math.round(data.maxHp)));
        }
        if (typeof data.isMoving === 'boolean') this.isMoving = data.isMoving;
        if (typeof data.shieldActive === 'boolean') this.shieldActive = data.shieldActive;
        if (typeof data.isDashing === 'boolean') this.isDashing = data.isDashing;
        if (typeof data.weaponType === 'string' && data.weaponType) this.weaponType = data.weaponType;
        if (typeof data.heroSkin === 'string') this.heroSkin = data.heroSkin;
        if (typeof data.starBlessed === 'boolean') this.starBlessed = data.starBlessed;
        if (data.heroType && data.heroType !== this.heroType) {
            this.applyHeroStats(data.heroType, data);
        }
    }

    update(dt) {
        const normDt = dt || 1.0;

        // Predictive Dead Reckoning: extrapolate target coordinates with velocity
        if (this.isMoving && (this.vx || this.vy)) {
            this.targetX += (this.vx || 0) * normDt;
            this.targetY += (this.vy || 0) * normDt;
        }

        // Adaptive responsive lerp: tighter convergence to eliminate dragging lag
        const distSq = (this.targetX - this.x) ** 2 + (this.targetY - this.y) ** 2;
        const lerpFactor = distSq > 15000 ? 1.0 : (distSq > 3000 ? Math.min(1.0, 0.72 * normDt) : Math.min(1.0, 0.52 * normDt));
        this.x += (this.targetX - this.x) * lerpFactor;
        this.y += (this.targetY - this.y) * lerpFactor;

        // Angle lerp with shortest-arc unwrapping
        let diff = this.targetAngle - this.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.angle += diff * Math.min(1.0, 0.60 * normDt);

        if (this.isMoving && !this.isDowned) {
            this.walkCycle += 0.26 * normDt;
        }

        if (this.hitFlash > 0) {
            this.hitFlash -= (dt || 1.0);
        }
        if (this.invulnerableTimer > 0) {
            this.invulnerableTimer -= (dt || 1.0);
        }
        if (this.speedDebuffTimer > 0) {
            this.speedDebuffTimer -= (dt || 1.0);
        }
        if (this.stunTimer > 0) {
            this.stunTimer -= (dt || 1.0);
        }
    }

    draw(ctx) {
        ctx.save();

        if (this.isDowned) {
            // Downed Ghost / Revive Beacon appearance
            ctx.globalAlpha = 0.55 + Math.sin(Date.now() / 200) * 0.25;
            if (typeof HeroRenderer !== 'undefined') {
                HeroRenderer.draw(this, ctx);
            }
            this.drawDownedHalo(ctx);
        } else {
            if (typeof HeroRenderer !== 'undefined') {
                HeroRenderer.draw(this, ctx);
            }
        }

        ctx.restore();

        // Custom overhead co-op badge
        this.drawCoopTag(ctx);
    }

    drawDownedHalo(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y - this.radius - 22);
        ctx.fillStyle = '#ff4757';
        ctx.font = '900 12px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.strokeText('💀 DOWNED!', 0, 0);
        ctx.fillText('💀 DOWNED!', 0, 0);
        ctx.restore();
    }

    drawCoopTag(ctx) {
        if (this.isDowned) return;
        ctx.save();
        ctx.translate(this.x, this.y - this.radius - 28);
        const tagText = `🤝 ${this.name}`;
        ctx.font = '900 11px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = 'rgba(0,0,0,0.85)';
        ctx.lineWidth = 3;
        ctx.strokeText(tagText, 0, 0);
        ctx.fillStyle = this.isHost ? '#00d2d3' : '#2ed573';
        ctx.fillText(tagText, 0, 0);
        ctx.restore();
    }

    drawRadarIndicator(ctx, localPlayer, camera) {
        if (!camera || !localPlayer) return;
        const dpr = camera.dpr || 1;
        const vw = camera.canvas ? (camera.canvas.width / dpr) : window.innerWidth;
        const vh = camera.canvas ? (camera.canvas.height / dpr) : window.innerHeight;
        const halfW = vw / (camera.zoom || 1) / 2;
        const halfH = vh / (camera.zoom || 1) / 2;
        const dx = this.x - localPlayer.x;
        const dy = this.y - localPlayer.y;

        const isOffScreen = Math.abs(dx) > halfW - 40 || Math.abs(dy) > halfH - 40;
        if (!isOffScreen) return;

        // Draw indicator arrow pointing towards teammate at screen periphery
        const angle = Math.atan2(dy, dx);
        const distMeters = Math.round(Math.hypot(dx, dy) / 10);

        ctx.save();
        ctx.translate(localPlayer.x, localPlayer.y);
        const clampedDistX = Math.max(-halfW + 55, Math.min(halfW - 55, Math.cos(angle) * (halfW - 55)));
        const clampedDistY = Math.max(-halfH + 55, Math.min(halfH - 55, Math.sin(angle) * (halfH - 55)));
        ctx.translate(clampedDistX, clampedDistY);

        // Arrow
        ctx.rotate(angle);
        ctx.fillStyle = this.isDowned ? '#ff4757' : '#2ed573';
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(-8, -10);
        ctx.lineTo(-3, 0);
        ctx.lineTo(-8, 10);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.rotate(-angle);

        // Distance text
        ctx.font = '900 10px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.5;
        const label = `${this.name} (${distMeters}m)`;
        ctx.strokeText(label, 0, 18);
        ctx.fillText(label, 0, 18);

        ctx.restore();
    }

    static drawLocalDownedBanner(ctx, localPlayer) {
        if (!localPlayer || localPlayer.hp > 0) return;
        ctx.save();
        ctx.translate(localPlayer.x, localPlayer.y - localPlayer.radius - 36);
        const pulse = 0.75 + Math.sin(Date.now() / 160) * 0.25;
        ctx.globalAlpha = pulse;
        ctx.font = '900 13px Fredoka, sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#0f1419';
        ctx.lineWidth = 4;
        const msg = '💀 DOWNED! WAITING FOR WAVE CLEAR';
        ctx.strokeText(msg, 0, 0);
        ctx.fillStyle = '#ff4757';
        ctx.fillText(msg, 0, 0);
        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.RemotePlayer = RemotePlayer;
}
