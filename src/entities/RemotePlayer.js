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
        this._hideOverheadName = true;
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
        this.equippedArmorId = null; this.armorEvolved = false; this.weaponEvolved = false;
        this.recoilOffset = 0; this.bubbleCharge = 0;
        this.magnetRadius = 140;
        this.starBlessed = false;
        this._starReviveUsed = false;
        this._shieldBrokenUntil = 0;
        this.onShieldConsumed = null;
        this.isBladeRushing = false;
        this.knockbackVx = 0;
        this.knockbackVy = 0;
        this.knockbackTimer = 0;
        this.airVz = 0;
        this.airRotation = 0;
        this.landingDamage = 0;
        this.landingSquashTimer = 0;
        this.age = 0;
        this.ultActive = false;
        this.ultId = null;
        this.ultTimer = 0;
        this.ultMaxTimer = 1;
        this.rageUltActive = false;
        this.infernoUltActive = false;
        this.vf185Active = false;
        this.vf185Angle = 0;
        this._vfWheelSpin = 0;
        this._vfSkids = [];

        this.applyHeroStats(heroType);
    }

    applyHeroStats(heroType, opts = null) {
        this.heroType = heroType;
        const wasFull = !this.hp || this.hp >= this.maxHp;
        const heroData = (typeof HEROES !== 'undefined' && HEROES[heroType]) ? HEROES[heroType] : null;
        if (heroData) {
            this.radius = heroData.radius || (heroType === 'petros' ? 26 : 24);
            this.maxHp = heroData.hp || 100;
            this.weaponType = heroData.weaponType || 'pea';
            this.heroColor = heroData.heroColor || '#1e70d6';
            this.damageReduction = heroData.damageReduction || 0;
        } else {
            this.radius = heroType === 'petros' ? 26 : 24;
            this.maxHp = heroType === 'petros' ? 150 : 100;
            this.weaponType = 'pea';
            this.heroColor = '#1e70d6';
            this.damageReduction = heroType === 'petros' ? 0.08 : 0;
        }
        if (opts) {
            if (typeof opts.weaponType === 'string' && opts.weaponType) this.weaponType = opts.weaponType;
            if ('equippedArmorId' in opts) this.equippedArmorId = opts.equippedArmorId || null;
            if (typeof opts.armorEvolved === 'boolean') this.armorEvolved = opts.armorEvolved;
            if (typeof opts.weaponEvolved === 'boolean') this.weaponEvolved = opts.weaponEvolved;
            if (typeof opts.heroSkin === 'string') this.heroSkin = opts.heroSkin;
            if (opts.heroStyle !== undefined) this.heroStyle = opts.heroStyle;
            if (typeof opts.starBlessed === 'boolean') this.starBlessed = opts.starBlessed;
            if (typeof opts.maxHp === 'number' && Number.isFinite(opts.maxHp)) {
                this.maxHp = Math.max(25, Math.min(1200, Math.round(opts.maxHp)));
            }
            if (typeof opts.damageReduction === 'number' && Number.isFinite(opts.damageReduction)) {
                this.damageReduction = Math.max(0, Math.min(0.70, opts.damageReduction));
            }
            if (typeof opts.magnetRadius === 'number' && Number.isFinite(opts.magnetRadius)) {
                this.magnetRadius = Math.max(80, Math.min(400, Math.round(opts.magnetRadius)));
            }
        }
        if (wasFull || this.hp > this.maxHp) this.hp = this.maxHp;
    }

    takeDamage(amount, effects = null, camera = null) {
        if (this.invulnerableTimer > 0 || this.isDashing || this.isBladeRushing || this.hp <= 0) return false;
        if (this.shieldActive) {
            this.shieldActive = false;
            this.invulnerableTimer = 30;
            this._shieldBrokenUntil = performance.now() + 350;
            if (typeof this.onShieldConsumed === 'function') this.onShieldConsumed();
            if (window.soundEngine) window.soundEngine.playHit(false, true);
            if (effects) {
                effects.addComicSplash(this.x, this.y, 'BLOCKED!');
                effects.addShockwave(this.x, this.y, 80, 'rgba(112, 161, 255, 0.9)');
            }
            return false;
        }
        const mult = (this.damageReduction && this.damageReduction > 0) ? (1 - this.damageReduction) : 1;
        const actualDamage = Math.max(1, Math.round(amount * mult));
        this.hp = Math.max(0, this.hp - actualDamage);
        this.hitFlash = 12;
        this.invulnerableTimer = 18;

        if (effects) {
            effects.addDamage(this.x, this.y, actualDamage, false, true);
            effects.addSparks(this.x, this.y, '#ff4757', 6);
        }

        if (this.hp <= 0 && this.starBlessed && !this._starReviveUsed) {
            this._starReviveUsed = true;
            this.hp = Math.max(1, Math.round(this.maxHp * 0.50));
            this.shieldActive = true;
            this.invulnerableTimer = 120;
            if (effects) {
                effects.addComicSplash(this.x, this.y - 38, '🌟 STAR REVIVE!');
                effects.addShockwave(this.x, this.y, 130, 'rgba(250, 204, 21, 0.92)');
            }
            return true;
        }

        if (this.hp <= 0) {
            this.isDowned = true;
            if (effects) {
                effects.addComicSplash(this.x, this.y, 'DOWNED!');
            }
        }
        return true;
    }

    applyKnockback(vx, vy, duration = 20) {
        this.knockbackVx = vx || 0;
        this.knockbackVy = vy || 0;
        this.knockbackTimer = duration || 20;
    }

    launchAirborne(vx, vy, vz = 17.5, damage = 38) {
        this.isGrabbed = false;
        this.isAirborne = true;
        this.knockbackVx = vx || 0;
        this.knockbackVy = vy || 0;
        this.airVz = vz || 17.5;
        this.airZ = Math.max(this.airZ || 0, 24);
        this.airRotation = this.airRotation || 0.2;
        this.landingDamage = damage || 38;
    }

    setTargetState(data) {
        if (!data) return;
        if (typeof data.seq === 'number' && Number.isFinite(data.seq)) {
            const prevSeq = this._lastRxSeq || 0;
            if (data.seq < prevSeq && (prevSeq - data.seq) < 100000) return;
            this._lastRxSeq = data.seq;
        }
        this._lastNetRxMs = performance.now();
        const lockPosFromKiloumpas = !this.isHost && (this.isGrabbed || this.isAirborne);
        if (lockPosFromKiloumpas) {
            this.isDashing = false; this.isBladeRushing = false; this.stunTimer = 0; this.knockbackTimer = 0;
        } else {
            if (typeof data.x === 'number') this.targetX = data.x;
            if (typeof data.y === 'number') this.targetY = data.y;
            if (typeof data.vx === 'number') this.vx = data.vx;
            if (typeof data.vy === 'number') this.vy = data.vy;
        }
        if (typeof data.angle === 'number') this.targetAngle = data.angle;

        // Snap immediately if large discrepancy (e.g. spawn, teleport, or dash)
        const distSq = (this.targetX - this.x) ** 2 + (this.targetY - this.y) ** 2;
        if (!lockPosFromKiloumpas && (distSq > 20000 || data.isDashing)) {
            this.x = this.targetX;
            this.y = this.targetY;
        }

        if (this.isHost && typeof data.hp === 'number') {
            if (data.hp < this.hp) this.hitFlash = 10;
            this.hp = Math.max(0, Math.min(this.maxHp, data.hp));
            this.isDowned = (this.hp <= 0);
        }
        if (this.isHost) {
            const wasAirborne = !!this.isAirborne;
            if (typeof data.isGrabbed === 'boolean') this.isGrabbed = data.isGrabbed;
            if (typeof data.isAirborne === 'boolean') this.isAirborne = data.isAirborne;
            if (typeof data.airZ === 'number') this.airZ = data.airZ;
            if (typeof data.airRot === 'number') this.airRotation = data.airRot;
            if (wasAirborne && typeof data.isAirborne === 'boolean' && !data.isAirborne && this.hp > 0) {
                this.landingSquashTimer = 14;
                const fx = (typeof window !== 'undefined' && window.gameInstance) ? window.gameInstance.effects : null;
                if (fx) {
                    fx.addComicSplash(this.x, this.y - 40, 'YEET! 💥');
                    fx.addShockwave(this.x, this.y, 160, 'rgba(235, 77, 75, 0.95)');
                    fx.addDust(this.x, this.y, 20, 20);
                    fx.addSparks(this.x, this.y, '#fed330', 10);
                }
                if (window.soundEngine && typeof window.soundEngine.playHit === 'function') window.soundEngine.playHit(true, true);
            }
        }
        if (typeof data.maxHp === 'number' && Number.isFinite(data.maxHp)) {
            this.maxHp = Math.max(25, Math.min(1200, Math.round(data.maxHp)));
        }
        if (typeof data.isMoving === 'boolean') this.isMoving = data.isMoving;
        if (typeof data.shieldActive === 'boolean' && performance.now() >= (this._shieldBrokenUntil || 0)) {
            this.shieldActive = data.shieldActive;
        }
        if (!lockPosFromKiloumpas && typeof data.isDashing === 'boolean') this.isDashing = data.isDashing;
        if (typeof data.weaponType === 'string' && data.weaponType) this.weaponType = data.weaponType;
        if ('equippedArmorId' in data) this.equippedArmorId = data.equippedArmorId || null;
        if (typeof data.armorEvolved === 'boolean') this.armorEvolved = data.armorEvolved;
        if (typeof data.weaponEvolved === 'boolean') this.weaponEvolved = data.weaponEvolved;
        if (typeof data.bubbleCharge === 'number') this.bubbleCharge = data.bubbleCharge;
        if (typeof data.heroSkin === 'string') this.heroSkin = data.heroSkin;
        if (typeof data.starBlessed === 'boolean') this.starBlessed = data.starBlessed;
        if (typeof data.name === 'string' && data.name.trim()) this.name = data.name.trim();
        if (typeof data.ultId === 'string') {
            const uid = data.ultId || null;
            const nowMs = (typeof performance !== 'undefined') ? performance.now() : Date.now();
            if (uid || !this._ultStartedMs || (nowMs - this._ultStartedMs) > 280) {
                this.ultId = uid;
                this.ultActive = !!uid;
                this.rageUltActive = (uid === 'rage');
                this.infernoUltActive = (uid === 'inferno_storm');
                this.vf185Active = (uid === 'vf185');
                if (!uid) this.ultTimer = 0;
            }
        }
        if (typeof data.vfAng === 'number' && Number.isFinite(data.vfAng)) this.vf185Angle = data.vfAng;
        if (data.heroType && data.heroType !== this.heroType) {
            const preserved = { maxHp: this.maxHp, damageReduction: this.damageReduction, magnetRadius: this.magnetRadius, starBlessed: this.starBlessed, equippedArmorId: this.equippedArmorId, armorEvolved: this.armorEvolved, weaponEvolved: this.weaponEvolved, ...data };
            this.applyHeroStats(data.heroType, preserved);
        }
    }

    update(dt) {
        const normDt = dt || 1.0;
        this.age = (this.age || 0) + normDt;
        if (this.landingSquashTimer > 0) this.landingSquashTimer = Math.max(0, this.landingSquashTimer - normDt);

        if (!this.isHost && this.isAirborne) {
            this.isMoving = false;
            this.airZ += this.airVz * normDt;
            this.airVz -= 0.58 * normDt;
            this.airRotation += 0.24 * normDt;
            this.x += (this.knockbackVx || 0) * normDt;
            this.y += (this.knockbackVy || 0) * normDt;
            const ar = (typeof window !== 'undefined' && window.gameInstance) ? window.gameInstance.arena : null;
            if (ar) {
                const b = ar.dungeonBounds;
                const minX = (b ? b.minX : -ar.halfWidth) + this.radius, maxX = (b ? b.maxX : ar.halfWidth) - this.radius;
                const minY = (b ? b.minY : -ar.halfHeight) + this.radius, maxY = (b ? b.maxY : ar.halfHeight) - this.radius;
                if (this.x < minX) this.x = minX; else if (this.x > maxX) this.x = maxX;
                if (this.y < minY) this.y = minY; else if (this.y > maxY) this.y = maxY;
            }
            this.targetX = this.x;
            this.targetY = this.y;
            this.knockbackVx *= Math.pow(0.972, normDt);
            this.knockbackVy *= Math.pow(0.972, normDt);
            if (this.ghostTrails && Math.random() < 0.45 * normDt) {
                this.ghostTrails.push({ x: this.x, y: this.y - this.airZ, alpha: 0.6, isAirborne: true });
            }
            if (this.airZ <= 0 && this.airVz < 0) {
                this.airZ = 0; this.airVz = 0; this.isAirborne = false; this.airRotation = 0;
                this.knockbackVx = 0; this.knockbackVy = 0; this.landingSquashTimer = 14;
                const fx = (typeof window !== 'undefined' && window.gameInstance) ? window.gameInstance.effects : null;
                if (fx) {
                    fx.addComicSplash(this.x, this.y - 40, 'YEET! 💥');
                    fx.addShockwave(this.x, this.y, 160, 'rgba(235, 77, 75, 0.95)');
                    fx.addDust(this.x, this.y, 20, 20);
                    fx.addSparks(this.x, this.y, '#fed330', 10);
                }
                if (window.soundEngine && typeof window.soundEngine.playHit === 'function') window.soundEngine.playHit(true, true);
                if (this.landingDamage > 0 && !this.isDowned) this.takeDamage(this.landingDamage, fx);
                this.landingDamage = 0;
            }
        } else if (!this.isGrabbed) {
            // Clamped Dead Reckoning: cap extrapolation window on cellular packet stalls to prevent rubberbanding
            if (this.isMoving && (this.vx || this.vy)) {
                const netAgeMs = this._lastNetRxMs ? (performance.now() - this._lastNetRxMs) : 0;
                if (netAgeMs < 160) {
                    const scale = netAgeMs > 70 ? Math.max(0.15, 1 - (netAgeMs - 70) / 100) : 1.0;
                    this.targetX += (this.vx || 0) * normDt * scale;
                    this.targetY += (this.vy || 0) * normDt * scale;
                }
            }

            // Adaptive responsive lerp: tighter convergence to eliminate dragging lag
            const distSq = (this.targetX - this.x) ** 2 + (this.targetY - this.y) ** 2;
            const lerpFactor = distSq > 15000 ? 1.0 : (distSq > 3000 ? Math.min(1.0, 0.72 * normDt) : Math.min(1.0, 0.52 * normDt));
            this.x += (this.targetX - this.x) * lerpFactor;
            this.y += (this.targetY - this.y) * lerpFactor;
        }

        // Angle lerp with shortest-arc unwrapping
        let diff = this.targetAngle - this.angle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        this.angle += diff * Math.min(1.0, 0.60 * normDt);

        if (this.vf185Active && typeof VF185Model !== 'undefined') {
            VF185Model.recordStep(this, normDt, null);
        }
        if (this.ghostTrails && this.ghostTrails.length > 0) {
            for (let i = this.ghostTrails.length - 1; i >= 0; i--) {
                this.ghostTrails[i].alpha -= 0.062 * normDt;
                if (this.ghostTrails[i].alpha <= 0) this.ghostTrails.splice(i, 1);
            }
        }

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
        if (this.recoilOffset > 0) {
            this.recoilOffset *= Math.pow(0.85, normDt);
            if (this.recoilOffset < 0.1) this.recoilOffset = 0;
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
        RemotePlayer.drawChatBubble(ctx, this);
    }

    static drawChatBubble(ctx, entity) {
        if (!ctx || !entity || !entity._chatBubble) return;
        const rem = entity._chatBubble.expiresAt - Date.now();
        if (rem <= 0) { entity._chatBubble = null; return; }
        const txt = String(entity._chatBubble.text || '').trim();
        if (!txt) return;
        ctx.save();
        const alpha = rem < 600 ? Math.max(0, rem / 600) : 1;
        ctx.globalAlpha = alpha;
        ctx.font = '800 11.5px Fredoka, sans-serif';
        const padX = 10, h = 24;
        const w = Math.min(240, Math.max(44, ctx.measureText(txt).width + padX * 2));
        const bx = entity.x, by = entity.y - (entity.airZ || 0) - (entity.radius || 24) - 38;
        ctx.translate(bx, by);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') ctx.roundRect(-w / 2, -h, w, h, 9);
        else ctx.rect(-w / 2, -h, w, h);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-5, 0); ctx.lineTo(0, 6); ctx.lineTo(5, 0); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#1e272e';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(txt, 0, -h / 2 + 0.5, w - 12);
        ctx.restore();
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
        if (this.isDowned || this.isAirborne) return;
        ctx.save();
        ctx.translate(this.x, this.y - (this.airZ || 0) - this.radius - 18);
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
