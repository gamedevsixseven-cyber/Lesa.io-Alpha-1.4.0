/**
 * Lesa.io - Base Enemy Class
 * Shared enemy functionality, overhead HUD, health, and hit flash
 */

class EnemyBase {
    constructor(x, y, type, waveMultiplier = 1.0) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.type = type;
        this.waveMultiplier = waveMultiplier;

        this.hp = 100;
        this.maxHp = 100;
        this.speed = 3;
        this.damage = 20;
        this.radius = 26;
        this.name = 'Enemy';
        this.color = '#ff4757';
        this.xpDrop = 25;

        this.angle = 0;
        this.hitFlash = 0;
        this.dead = false;
        this.age = Math.random() * 100;
        this.walkCycle = 0;

        // Water Balloon (Nerobalonaki) Debuff State
        this.waterDrenchedTimer = 0;
        this.waterSlowMultiplier = 1.0;
        this.damageVulnerabilityMultiplier = 1.0;

        // Bubble Gun Stasis / Trap State (Right-Click Big Bubble)
        this.bubbleTrappedTimer = 0; // In frames (120 = 2 seconds)
        this.bubbleTrapPopDamage = 25;
        this.bubbleTrapAge = 0;

        // Stun State (Seismic Quake)
        this.stunTimer = 0;

        // Fear State (Yaya Scream)
        this.fearTimer = 0;

        // Ice Slow State (Frappes+ Pagakia)
        this.iceSlowTimer = 0;
        this.iceSlowMultiplier = 1.0;

        // Sonic Slow State (Rouf Dial-Tone Blaster)
        this.sonicSlowTimer = 0;
        this.sonicSlowMultiplier = 1.0;

        // Shock Vulnerability State (Wrath of Olympus)
        this.shockedTimer = 0;
        this.shockVulnerabilityMultiplier = 1.0;

        // Chronos Time-Rift Slow State
        this.chronoSlowTimer = 0;
        this.chronoSlowMultiplier = 1.0;
    }

    takeDamage(amount, effects = null, fromCrit = null, playSound = true) {
        const isDrenched = this.waterDrenchedTimer > 0;
        const isShocked = this.shockedTimer > 0;
        let dmgScale = 1.0;
        if (isDrenched) dmgScale *= (this.damageVulnerabilityMultiplier || 1.30);
        if (isShocked) dmgScale *= (this.shockVulnerabilityMultiplier || 1.12);
        const finalAmount = dmgScale > 1.0 ? Math.round(amount * dmgScale) : amount;

        this.hp -= finalAmount;
        this.hitFlash = 8;

        const isCrit = (fromCrit !== null && fromCrit !== undefined) ? fromCrit : (Math.random() < 0.25);
        if (playSound && window.soundEngine) {
            window.soundEngine.playHit(true, isCrit);
        }
        if (isCrit && typeof window !== 'undefined' && window.gameInstance && window.gameInstance.camera && typeof window.gameInstance.camera.punchZoom === 'function') {
            window.gameInstance.camera.punchZoom(0.022, true);
        }

        if (effects) {
            effects.addDamage(this.x, this.y, finalAmount, isCrit, false, isDrenched);
            effects.addSparks(this.x, this.y, this.type === 'fatmir' ? '#eb4d4b' : '#2ed573', isCrit ? 7 : 5);
            if (isDrenched) {
                effects.addSparks(this.x, this.y - 12, '#00d2d3', 3);
            }
        }

        if (this.hp <= 0) {
            this.dead = true;
            if (window.soundEngine) {
                window.soundEngine.playKill();
            }
            if (typeof window !== 'undefined' && window.EventBus) {
                window.EventBus.emit('enemyKilled', {
                    enemyType: this.type,
                    x: this.x,
                    y: this.y,
                    scoreValue: this.scoreValue
                });
            }
            if (effects) {
                effects.addComicSplash(this.x, this.y, 'K.O!');
                if (typeof effects.addDeathPop === 'function') {
                    this._deathPopped = true;
                    effects.addDeathPop(this.x, this.y, this.radius, this.color, this.isBoss || this.isMiniBoss);
                } else {
                    effects.addDust(this.x, this.y, 8, 14);
                }
            }
            return true; // Killed
        }
        return false;
    }

    applySeparation(enemies) {
        // High-Performance Separation with Push Budget (Prevents O(N^2) CPU spikes in massive swarms)
        const myX = this.x;
        const myY = this.y;
        const myRad = this.radius;
        let appliedPushes = 0;

        for (let i = 0; i < enemies.length; i++) {
            const other = enemies[i];
            if (other === this || other.dead) continue;

            const minDist = myRad + other.radius;
            const edx = myX - other.x;
            if (Math.abs(edx) >= minDist) continue;

            const edy = myY - other.y;
            if (Math.abs(edy) >= minDist) continue;

            const distSq = edx * edx + edy * edy;
            if (distSq > 0 && distSq < minDist * minDist) {
                const edist = Math.sqrt(distSq);
                const push = (minDist - edist) * 0.08;
                this.x += (edx / edist) * push;
                this.y += (edy / edist) * push;
                appliedPushes++;
                if (appliedPushes >= 5) break; // Maximum push saturation reached
            }
        }
    }

    applyArenaBounds(arena) {
        if (!arena) return;
        const b = arena.dungeonBounds;
        const minX = b ? b.minX : -arena.halfWidth;
        const maxX = b ? b.maxX : arena.halfWidth;
        const minY = b ? b.minY : -arena.halfHeight;
        const maxY = b ? b.maxY : arena.halfHeight;
        if (this.x - this.radius < minX) this.x = minX + this.radius;
        if (this.x + this.radius > maxX) this.x = maxX - this.radius;
        if (this.y - this.radius < minY) this.y = minY + this.radius;
        if (this.y + this.radius > maxY) this.y = maxY - this.radius;
    }

    updateDebuffs(dt = 1) {
        if (this.waterDrenchedTimer > 0) {
            this.waterDrenchedTimer -= dt;
            if (this.waterDrenchedTimer <= 0) {
                this.waterSlowMultiplier = 1.0;
                this.damageVulnerabilityMultiplier = 1.0;
            }
        }
        if (this.iceSlowTimer > 0) {
            this.iceSlowTimer -= dt;
            if (this.iceSlowTimer <= 0) {
                this.iceSlowMultiplier = 1.0;
            }
        }
        if (this.sonicSlowTimer > 0) {
            this.sonicSlowTimer -= dt;
            if (this.sonicSlowTimer <= 0) {
                this.sonicSlowMultiplier = 1.0;
            }
        }
        if (this.shockedTimer > 0) {
            this.shockedTimer -= dt;
            if (this.shockedTimer <= 0) {
                this.shockVulnerabilityMultiplier = 1.0;
            }
        }
        if (this.chronoSlowTimer > 0) {
            this.chronoSlowTimer -= dt;
            if (this.chronoSlowTimer <= 0) this.chronoSlowMultiplier = 1.0;
        }
    }

    getEffectiveSpeed() {
        let mult = 1.0;
        if (this.waterDrenchedTimer > 0) mult *= (this.waterSlowMultiplier || 0.55);
        if (this.iceSlowTimer > 0) mult *= (this.iceSlowMultiplier || 0.50);
        if (this.sonicSlowTimer > 0) mult *= (this.sonicSlowMultiplier || 0.70);
        if (this.chronoSlowTimer > 0) mult *= (this.chronoSlowMultiplier || 0.50);
        return this.speed * mult;
    }

    applyChronoSlow(durationSeconds = 0.4, slowMultiplier = 0.50) {
        this.chronoSlowTimer = Math.max(this.chronoSlowTimer || 0, Math.round(durationSeconds * 60));
        this.chronoSlowMultiplier = Math.min(this.chronoSlowMultiplier || 1.0, slowMultiplier);
    }

    applyStun(durationSeconds = 2.0, effects = null) {
        this.stunTimer = Math.max(this.stunTimer, Math.round(durationSeconds * 60));
        this.vx = 0;
        this.vy = 0;
        if (this.isCharging !== undefined) {
            this.isCharging = false;
            this.chargeWindup = 0;
        }
        if (effects) {
            effects.addComicSplash(this.x, this.y - 25, 'STUNNED! 💫');
            effects.addSparks(this.x, this.y, '#f1c40f', 6);
        }
    }

    applyFear(durationSeconds = 3.0, effects = null) {
        const duration = this.isBoss ? durationSeconds * 0.5 : durationSeconds;
        this.fearTimer = Math.max(this.fearTimer, Math.round(duration * 60));
        if (effects) {
            effects.addComicSplash(this.x, this.y - 25, '😱 FLEE!');
            effects.addSparks(this.x, this.y, '#74b9ff', 6);
        }
    }

    applyIceSlow(durationSeconds = 3.0, slowMultiplier = 0.50, effects = null) {
        this.iceSlowTimer = Math.max(this.iceSlowTimer, Math.round(durationSeconds * 60));
        this.iceSlowMultiplier = Math.min(this.iceSlowMultiplier, slowMultiplier);
        if (effects && Math.random() < 0.35) {
            effects.addSparks(this.x, this.y, '#00cec9', 4);
        }
    }

    applySonicSlow(durationSeconds = 1.5, slowMultiplier = 0.70, effects = null) {
        this.sonicSlowTimer = Math.max(this.sonicSlowTimer, Math.round(durationSeconds * 60));
        this.sonicSlowMultiplier = Math.min(this.sonicSlowMultiplier, slowMultiplier);
        if (effects && Math.random() < 0.45) {
            effects.addSparks(this.x, this.y, '#fed330', 4);
        }
    }

    applyShockVulnerability(durationSeconds = 3.5, damageMult = 1.12, effects = null) {
        this.shockedTimer = Math.max(this.shockedTimer, Math.round(durationSeconds * 60));
        this.shockVulnerabilityMultiplier = Math.max(this.shockVulnerabilityMultiplier || 1.0, damageMult);
        if (effects && Math.random() < 0.35) {
            effects.addSparks(this.x, this.y, '#00f5ff', 3);
        }
    }

    updateStun(dt = 1, effects = null) {
        if (this.stunTimer <= 0) return false;
        this.stunTimer -= dt;
        this.vx = 0;
        this.vy = 0;
        if (effects && Math.floor(this.age) % 15 === 0) {
            effects.addSparks(this.x, this.y - this.radius, '#f1c40f', 2);
        }
        return true;
    }

    updateFear(dt = 1, player = null, effects = null) {
        if (this.fearTimer <= 0) return false;
        this.fearTimer -= dt;
        if (player) {
            const fdir = Math.atan2(this.y - player.y, this.x - player.x);
            const fleeSpeed = this.getEffectiveSpeed() * 1.25;
            this.vx = Math.cos(fdir) * fleeSpeed;
            this.vy = Math.sin(fdir) * fleeSpeed;
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.angle = fdir;
        }
        if (effects && Math.floor(this.age) % 12 === 0) {
            effects.addSparks(this.x, this.y - this.radius, '#74b9ff', 2);
        }
        return true;
    }

    drawOverheadHUD(ctx) {
        const offset = this.type === 'fatmir' ? 94 : (this.hudOffsetY || (this.radius + 14));
        const hudY = this.y - offset;

        let displayName = this.name;
        let nameColor = this.type === 'fatmir' ? '#ff6b6b' : '#2ed573';
        if (this.stunTimer > 0) {
            displayName = `💫 ${(this.stunTimer / 60).toFixed(1)}s`;
            nameColor = '#f1c40f';
        } else if (this.fearTimer > 0) {
            displayName = `😱 FLEEING (${(this.fearTimer / 60).toFixed(1)}s)`;
            nameColor = '#74b9ff';
        } else if (this.iceSlowTimer > 0) {
            displayName = `${this.name} 🧊 -50%`;
            nameColor = '#00cec9';
        } else if (this.sonicSlowTimer > 0) {
            const pct = Math.round((1 - (this.sonicSlowMultiplier || 0.70)) * 100);
            displayName = `${this.name} 📡 -${pct}%`;
            nameColor = '#fed330';
        } else if (this.chronoSlowTimer > 0) {
            const pct = Math.round((1 - (this.chronoSlowMultiplier || 0.50)) * 100);
            displayName = `${this.name} ⏳ -${pct}%`;
            nameColor = '#00cec9';
        } else if (this.waterDrenchedTimer > 0) {
            displayName = `${this.name} 💧 -45%`;
        } else if (this.shockedTimer > 0) {
            const pct = Math.round(((this.shockVulnerabilityMultiplier || 1.12) - 1) * 100);
            displayName = `${this.name} ⚡ +${pct}%`;
            nameColor = '#fed330';
        }

        const lbl = EnemyBase.getLabelSprite(
            displayName,
            '800 12px "Luckiest Guy", "Fredoka", sans-serif',
            nameColor,
            '#1e272e',
            3,
            0,
            'bottom'
        );
        EnemyBase.drawLabel(ctx, lbl, this.x, hudY - 3);

        // Health Bar
        const barW = this.type === 'fatmir' ? 46 : 36;
        const barH = 5;
        const hpRatio = Math.max(0, this.hp / this.maxHp);

        ctx.save();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#1e272e';
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(this.x - barW / 2, hudY, barW, barH);
        ctx.strokeRect(this.x - barW / 2, hudY, barW, barH);

        ctx.fillStyle = this.type === 'fatmir' ? '#eb4d4b' : '#20bf6b';
        ctx.fillRect(this.x - barW / 2, hudY, barW * hpRatio, barH);

        // Trapped in Bubble Indicator Tag
        if (this.bubbleTrappedTimer > 0) {
            const timeLeftSec = (this.bubbleTrappedTimer / 60).toFixed(1);
            const trapLbl = EnemyBase.getLabelSprite(
                `🫧 TRAPPED (${timeLeftSec}s)`,
                '800 11px "Luckiest Guy", cursive',
                '#00d2d3',
                '#1e272e',
                2,
                0,
                'bottom'
            );
            EnemyBase.drawLabel(ctx, trapLbl, this.x, hudY - 14);
        }

        ctx.restore();
    }

    trapInBubble(durationSeconds = 2.0, popDamage = 25) {
        if (this.isBoss || this.isMiniBoss) return; // Bosses cannot go in the bubble
        this.bubbleTrappedTimer = Math.round(durationSeconds * 60); // 120 frames at 60fps = 2 seconds
        this.bubbleTrapPopDamage = popDamage;
        this.bubbleTrapAge = 0;
        this.vx = 0;
        this.vy = 0;
    }

    updateBubbleTrap(dt = 1, effects = null) {
        if (this.bubbleTrappedTimer <= 0) return false;

        this.bubbleTrappedTimer -= dt;
        this.bubbleTrapAge += dt;
        this.vx = 0;
        this.vy = 0;

        // Bob gently up and down while floating in stasis
        this.y += Math.sin(this.bubbleTrapAge * 0.15) * 0.45;

        // When the 2 seconds expire, POP!
        if (this.bubbleTrappedTimer <= 0) {
            this.bubbleTrappedTimer = 0;
            if (window.soundEngine) {
                window.soundEngine.playShoot('bubble');
            }
            if (effects) {
                effects.addComicSplash(this.x, this.y - 25, '🫧 POP!');
                effects.addSparks(this.x, this.y, '#70a1ff', 8);
                effects.addSparks(this.x, this.y, '#00d2d3', 6);
            }
            this.takeDamage(this.bubbleTrapPopDamage, effects);
        }

        return true; // Enemy is immobilized
    }

    static getLabelSprite(text, font, fillStyle, strokeStyle = '', lineWidth = 0, maxWidth = 0, baseline = 'bottom') {
        let cache = EnemyBase._labelCache;
        if (!cache) {
            cache = EnemyBase._labelCache = new Map();
            if (typeof document !== 'undefined' && document.fonts && document.fonts.ready && !EnemyBase._fontsHooked) {
                EnemyBase._fontsHooked = true;
                document.fonts.ready.then(() => { if (EnemyBase._labelCache) EnemyBase._labelCache.clear(); });
            }
        }
        const roundedMaxW = maxWidth > 0 ? Math.round(maxWidth * 2) / 2 : 0;
        const key = `${text}|${font}|${fillStyle}|${strokeStyle}|${lineWidth}|${roundedMaxW}|${baseline}`;
        const hit = cache.get(key);
        if (hit && hit.canvas && hit.canvas.width > 0 && hit.canvas.height > 0) return hit;

        if (cache.size >= 480) {
            let count = 0;
            for (const k of cache.keys()) {
                cache.delete(k);
                if (++count >= 80) break;
            }
        }

        if (!EnemyBase._measureCtx && typeof document !== 'undefined') {
            const mc = document.createElement('canvas');
            mc.width = 4;
            mc.height = 4;
            EnemyBase._measureCtx = mc.getContext('2d');
        }
        const mctx = EnemyBase._measureCtx;
        const dpr = 2;
        mctx.font = font;
        const m = mctx.measureText(text);
        const pxMatch = /(\d+(?:\.\d+)?)px/.exec(font);
        const fontPx = pxMatch ? parseFloat(pxMatch[1]) : 12;
        const rawW = Math.ceil(m.width || text.length * fontPx * 0.6);
        const textW = roundedMaxW > 0 ? Math.min(rawW, Math.ceil(roundedMaxW)) : rawW;
        const strokePad = Math.ceil(lineWidth || 0);
        const padX = strokePad + 6;
        const padY = strokePad + 8;
        const ascent = Math.max(fontPx * 1.15, Math.ceil(m.actualBoundingBoxAscent || fontPx * 1.1));
        const descent = Math.max(4, Math.ceil(m.actualBoundingBoxDescent || 4));
        const logicalW = Math.max(4, textW + padX * 2);
        const logicalH = Math.max(4, Math.ceil(ascent + descent + padY * 2));

        const cx = logicalW / 2;
        const drawY = baseline === 'middle' ? (logicalH / 2) : (padY + ascent);
        const paintLabel = (targetCtx) => {
            targetCtx.font = font;
            targetCtx.textAlign = 'center';
            targetCtx.textBaseline = baseline === 'middle' ? 'middle' : 'bottom';
            targetCtx.lineJoin = 'round';
            targetCtx.miterLimit = 2;
            if (strokeStyle && lineWidth > 0) {
                targetCtx.lineWidth = lineWidth;
                targetCtx.strokeStyle = strokeStyle;
                if (roundedMaxW > 0) targetCtx.strokeText(text, cx, drawY, roundedMaxW);
                else targetCtx.strokeText(text, cx, drawY);
            }
            targetCtx.fillStyle = fillStyle;
            if (roundedMaxW > 0) targetCtx.fillText(text, cx, drawY, roundedMaxW);
            else targetCtx.fillText(text, cx, drawY);
        };

        let entry;
        if (typeof SpriteAtlasCache !== 'undefined') {
            const atlasEntry = SpriteAtlasCache.bakeCustom(
                `lbl:${key}`,
                logicalW,
                logicalH,
                dpr,
                paintLabel,
                true
            );
            entry = {
                canvas: atlasEntry.canvas,
                sx: atlasEntry.sx,
                sy: atlasEntry.sy,
                sw: atlasEntry.sw,
                sh: atlasEntry.sh,
                logicalW: atlasEntry.logicalW,
                logicalH: atlasEntry.logicalH,
                anchorX: cx,
                anchorY: drawY
            };
        } else {
            const c = document.createElement('canvas');
            c.width = Math.ceil(logicalW * dpr);
            c.height = Math.ceil(logicalH * dpr);
            const cctx = c.getContext('2d');
            cctx.scale(dpr, dpr);
            paintLabel(cctx);
            entry = {
                canvas: c,
                sx: 0,
                sy: 0,
                sw: c.width,
                sh: c.height,
                logicalW,
                logicalH,
                anchorX: cx,
                anchorY: drawY
            };
        }
        cache.set(key, entry);
        return entry;
    }

    static drawLabel(ctx, lbl, x, y) {
        if (!lbl || !lbl.canvas || lbl.canvas.width === 0 || lbl.canvas.height === 0) return;
        ctx.drawImage(
            lbl.canvas,
            lbl.sx, lbl.sy, lbl.sw, lbl.sh,
            x - lbl.anchorX, y - lbl.anchorY, lbl.logicalW, lbl.logicalH
        );
    }

    static _getBubbleDisc() {
        if (EnemyBase._bubbleDiscCanvas) return EnemyBase._bubbleDiscCanvas;
        const size = 128;
        const r = 64;
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const bctx = c.getContext('2d');
        const g = bctx.createRadialGradient(r - r * 0.3, r - r * 0.3, r * 0.1, r, r, r);
        g.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        g.addColorStop(0.35, 'rgba(112, 161, 255, 0.45)');
        g.addColorStop(0.7, 'rgba(0, 206, 201, 0.5)');
        g.addColorStop(0.95, 'rgba(224, 86, 253, 0.6)');
        g.addColorStop(1, 'rgba(112, 161, 255, 0.75)');
        bctx.fillStyle = g;
        bctx.beginPath();
        bctx.arc(r, r, r, 0, Math.PI * 2);
        bctx.fill();
        EnemyBase._bubbleDiscCanvas = c;
        return c;
    }

    drawBubbleTrap(ctx) {
        if (this.bubbleTrappedTimer <= 0) return;

        ctx.save();
        const r = this.radius * 1.45;
        const wobble = Math.sin(this.bubbleTrapAge * 0.2) * (r * 0.05);
        const R = r + wobble;

        // Translucent iridescent bubble enclosing the trapped enemy
        const disc = EnemyBase._getBubbleDisc();
        ctx.drawImage(disc, this.x - R, this.y - R, R * 2, R * 2);

        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 2.4;

        ctx.beginPath();
        ctx.arc(this.x, this.y, R, 0, Math.PI * 2);
        ctx.stroke();

        // Rainbow soap film ring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(this.x, this.y, R * 0.88, 0, Math.PI * 2);
        ctx.stroke();

        // Gloss highlights
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(this.x - r * 0.45, this.y - r * 0.45, r * 0.35, r * 0.18, -0.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x + r * 0.45, this.y + r * 0.45, r * 0.14, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.EnemyBase = EnemyBase;
}
