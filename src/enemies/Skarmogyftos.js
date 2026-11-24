/**
 * Lesa.io - Enemy: "Skarmogyftos"
 * Playstyle: Sleepy Smoke Conjurer & Loot Thief
 * 
 * Unique Features:
 * 1. 🪃 3-Way Curved Smoke Volley: Throws a spread of 3 curving purple smoke projectiles.
 * 2. 🥱 Drowsy Sleep Clouds: Leaves expanding hazy purple smoke rings that slow the player by 30% if stepped on.
 * 3. 💨 Smoke Teleport ("POOF!"): When cornered or hit, vanishes in a cloud of smoke and reappears at a flank.
 * 4. 🍪 Greedy Cookie Vacuum: Absorbs loose ground XP to build a shield; bursts like a piñata when killed!
 */

class SmokeHazard {
    static getSprite() {
        if (!SmokeHazard.cachedCanvas) {
            const c = document.createElement('canvas');
            c.width = 180;
            c.height = 180;
            const ctx = c.getContext('2d');
            if (!ctx) return null;
            const grad = ctx.createRadialGradient(90, 90, 15, 90, 90, 90);
            grad.addColorStop(0, 'rgba(155, 89, 182, 0.85)');
            grad.addColorStop(0.5, 'rgba(142, 68, 173, 0.55)');
            grad.addColorStop(0.85, 'rgba(142, 68, 173, 0.2)');
            grad.addColorStop(1, 'rgba(142, 68, 173, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(90, 90, 90, 0, Math.PI * 2);
            ctx.fill();
            SmokeHazard.cachedCanvas = c;
        }
        return SmokeHazard.cachedCanvas;
    }

    constructor(x, y, radius = 65, duration = 300) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.maxRadius = radius;
        this.duration = duration;
        this.maxDuration = duration;
        this.dead = false;
        this.pulse = 0;
    }

    update(dt = 1, player = null, effects = null) {
        this.duration -= dt;
        this.pulse += 0.05 * dt;

        if (this.duration <= 0) {
            this.dead = true;
            return;
        }

        // Check if player is inside the drowsy smoke zone
        if (player && player.hp > 0) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const currentR = this.radius * Math.min(1, (this.maxDuration - this.duration) / 25);
            if (dx * dx + dy * dy < currentR * currentR) {
                player.speedDebuffTimer = 15;
                if (Math.random() < 0.04 && effects) {
                    effects.addPopup(player.x, player.y - 20, 'Zzz...', '#9b59b6', 20, false);
                }
            }
        }
    }

    draw(ctx) {
        if (this.dead) return;
        const progress = Math.min(1, (this.maxDuration - this.duration) / 30);
        const alpha = Math.min(0.65, (this.duration / this.maxDuration) * 0.75);
        const r = this.radius * progress + Math.sin(this.pulse) * 4;
        const size = r * 2;

        ctx.save();
        ctx.globalAlpha = alpha;
        const sprite = SmokeHazard.getSprite();
        if (sprite) {
            ctx.drawImage(sprite, this.x - r, this.y - r, size, size);
        } else {
            ctx.fillStyle = 'rgba(142, 68, 173, 0.45)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, Math.max(1, r), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

class Skarmogyftos extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'skarmogyftos', waveMultiplier);
        this.name = 'Skarmogyftos';
        this.radius = 26;
        this.maxHp = Math.round(130 * waveMultiplier);
        this.hp = this.maxHp;
        this.speed = 2.7; // Relaxed, confident pacing
        this.damage = 22;
        this.color = '#8e44ad';
        this.xpDrop = 45;

        // Unique Playstyle Timers
        this.smokeVolleyCooldown = 130 + Math.random() * 60;
        this.sleepCloudCooldown = 200 + Math.random() * 80;
        this.teleportCooldown = 280 + Math.random() * 90;
        this.stolenLootCount = 0;
        this.shieldHp = 0;

        // Active smoke hazard zones
        this.smokeHazards = [];
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        if (this.hitFlash > 0) this.hitFlash -= dt;

        if (!player || player.hp <= 0) return;

        const pdx = player.x - this.x;
        const pdy = player.y - this.y;
        const distSq = pdx * pdx + pdy * pdy;
        const dist = Math.sqrt(distSq);
        const dir = Math.atan2(pdy, pdx);

        this.angle = dir;

        // Update active ground hazards
        for (let i = this.smokeHazards.length - 1; i >= 0; i--) {
            const h = this.smokeHazards[i];
            h.update(dt, player, effects);
            if (h.dead) this.smokeHazards.splice(i, 1);
        }

        if (this.smokeVolleyCooldown > 0) this.smokeVolleyCooldown -= dt;
        if (this.sleepCloudCooldown > 0) this.sleepCloudCooldown -= dt;
        if (this.teleportCooldown > 0) this.teleportCooldown -= dt;

        // 1. 🪃 3-Way Curved Smoke Volley
        if (this.smokeVolleyCooldown <= 0 && dist < 500) {
            this.smokeVolleyCooldown = 150 + Math.random() * 70;
            this.shootSmokeVolley(player, dir, bullets, effects);
        }

        // 2. 🥱 Drop Drowsy Sleep Cloud (slows player)
        if (this.sleepCloudCooldown <= 0 && dist < 320) {
            this.sleepCloudCooldown = 260 + Math.random() * 100;
            this.dropSleepCloud(effects);
        }

        // 3. 💨 Smoke Teleport / Vanish when overwhelmed
        if (this.teleportCooldown <= 0 && dist < 120) {
            this.teleportCooldown = 320 + Math.random() * 100;
            this.smokeTeleport(player, arena, effects);
        }

        // 4. 🍪 Greedy Cookie Vacuum (Draws nearby ground loot)
        if (window.gameInstance && window.gameInstance.drops) {
            const drops = window.gameInstance.drops;
            for (let i = 0; i < drops.length; i++) {
                const drop = drops[i];
                if (!drop.dead && drop.type === 'xp') {
                    const ddx = this.x - drop.x;
                    const ddy = this.y - drop.y;
                    const dDistSq = ddx * ddx + ddy * ddy;
                    if (dDistSq < 130 * 130) {
                        // Vacuum toward Skarmogyftos (guard dDistSq === 0 division -> NaN)
                        if (dDistSq > 0.0001) {
                            const inv = 1 / Math.sqrt(dDistSq);
                            drop.x += ddx * inv * 4.5 * dt;
                            drop.y += ddy * inv * 4.5 * dt;
                        }

                        if (dDistSq < 28 * 28) {
                            drop.dead = true;
                            this.stolenLootCount++;
                            this.shieldHp = Math.min(60, this.shieldHp + 10);
                            if (effects) {
                                effects.addPopup(this.x, this.y - 25, 'MINE! 🍪', '#fed330', 20, false);
                            }
                        }
                    }
                }
            }
        }

        // Relaxed, rhythmic orbital strafing movement
        const orbitAngle = dir + Math.PI / 2 + Math.sin(this.age * 0.04) * 0.4;
        this.updateDebuffs(dt);
        const curSpeed = this.getEffectiveSpeed();
        this.vx = Math.cos(orbitAngle) * curSpeed;
        this.vy = Math.sin(orbitAngle) * curSpeed;

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.applyArenaBounds(arena);
        this.applySeparation(enemies);
    }

    shootSmokeVolley(player, dir, bullets, effects) {
        if (window.soundEngine) window.soundEngine.playShoot('bubble');
        if (effects) {
            effects.addComicSplash(this.x, this.y - 25, 'SMOKE! 💨');
            effects.addDustPuff(this.x, this.y, '#9b59b6', 4);
        }

        // 3-way fan volley: -0.25 rad, 0 rad, +0.25 rad
        const angles = [-0.25, 0, 0.25];
        for (let i = 0; i < angles.length; i++) {
            const finalAngle = dir + angles[i];
            const muzzleX = this.x + Math.cos(finalAngle) * (this.radius + 10);
            const muzzleY = this.y + Math.sin(finalAngle) * (this.radius + 10);

            const b = new Bullet({
                x: muzzleX,
                y: muzzleY,
                vx: Math.cos(finalAngle) * 6.2,
                vy: Math.sin(finalAngle) * 6.2,
                damage: this.damage,
                speed: 6.2,
                radius: 10,
                type: 'smoke',
                isEnemy: true,
                range: 580,
                shooter: this
            });

            if (bullets) bullets.push(b);
            else if (window.gameInstance) window.gameInstance.bullets.push(b);
        }
    }

    dropSleepCloud(effects) {
        this.smokeHazards.push(new SmokeHazard(this.x, this.y, 85, 340));
        if (window.soundEngine) window.soundEngine.playShoot('bubble');
        if (effects) {
            effects.addPopup(this.x, this.y - 30, 'YAWN... 🥱', '#af52de', 24, true);
            effects.addDustPuff(this.x, this.y, '#af52de', 6);
        }
    }

    smokeTeleport(player, arena, effects) {
        if (effects) {
            effects.addComicSplash(this.x, this.y - 20, 'POOF! 💨');
            effects.addShockwave(this.x, this.y, 90, 'rgba(155, 89, 182, 0.8)');
            effects.addDustPuff(this.x, this.y, '#9b59b6', 8);
        }

        // Teleport to a flank behind/side of the player (~280px away)
        const teleportAngle = Math.random() * Math.PI * 2;
        const targetX = player.x + Math.cos(teleportAngle) * 280;
        const targetY = player.y + Math.sin(teleportAngle) * 280;

        this.x = targetX;
        this.y = targetY;
        this.applyArenaBounds(arena);

        if (window.soundEngine) window.soundEngine.playDash();
        if (effects) {
            effects.addDustPuff(this.x, this.y, '#9b59b6', 8);
        }
    }

    takeDamage(amount, effects = null, fromCrit = null, playSound = true) {
        // Absorb shield first if he ate stolen cookies
        if (this.shieldHp > 0) {
            this.shieldHp -= amount;
            if (this.shieldHp < 0) {
                const overflowDamage = -this.shieldHp;
                this.shieldHp = 0;
                if (effects) {
                    effects.addPopup(this.x, this.y - 15, 'SHIELD BROKE!', '#ff4757', 22, true);
                    effects.addSparks(this.x, this.y, '#ffd32a', 6);
                }
                return super.takeDamage(overflowDamage, effects, fromCrit, playSound);
            }
            if (effects) {
                effects.addPopup(this.x, this.y - 15, 'BLOCKED!', '#fed330', 20, false);
                effects.addSparks(this.x, this.y, '#ffd32a', 4);
            }
            return false;
        }

        return super.takeDamage(amount, effects, fromCrit, playSound);
    }

    draw(ctx) {
        const batched = typeof EnemyBatchRenderer !== 'undefined' && EnemyBatchRenderer.active;
        if (!batched) {
            for (let i = 0; i < this.smokeHazards.length; i++) {
                this.smokeHazards[i].draw(ctx);
            }
        }

        const flash = this.hitFlash > 0;
        if (batched && typeof SpriteAtlasCache !== 'undefined' && this.shieldHp <= 0 && !flash && EnemyBatchRenderer.canDirectTransform) {
            const r = this.radius || 26;
            const rKey = Math.round(r * 2);
            const sw = Math.ceil(r * 2.8);
            const sh = Math.ceil(r * 2.8);
            const key = `skarmo_b:${rKey}:0`;
            const S = EnemyBatchRenderer.camScale;
            const c = Math.cos(this.angle) * S;
            const s = Math.sin(this.angle) * S;
            ctx.setTransform(c, s, -s, c, EnemyBatchRenderer.camTx + S * this.x, EnemyBatchRenderer.camTy + S * this.y);
            SpriteAtlasCache.drawCached(ctx, key, sw, sh, sw * 0.5, sh * 0.5, (sctx) => {
                this._drawSkarmogyftosVectorBody(sctx, false);
            });
            ctx.setTransform(S, 0, 0, S, EnemyBatchRenderer.camTx, EnemyBatchRenderer.camTy);
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y);

        // Shield aura if he stole cookies
        if (this.shieldHp > 0) {
            ctx.strokeStyle = '#fed330';
            ctx.lineWidth = 3.5;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Hit flash
        if (flash) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Shadow
        if (!batched) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
            ctx.beginPath();
            ctx.ellipse(0, this.radius * 0.75, this.radius * 0.95, this.radius * 0.45, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Rotate facing direction
        ctx.rotate(this.angle);

        if (typeof SpriteAtlasCache !== 'undefined') {
            const r = this.radius || 26;
            const rKey = Math.round(r * 2);
            const sw = Math.ceil(r * 2.8);
            const sh = Math.ceil(r * 2.8);
            const key = `skarmo_b:${rKey}:${flash ? 1 : 0}`;
            SpriteAtlasCache.drawCached(ctx, key, sw, sh, sw * 0.5, sh * 0.5, (sctx) => {
                this._drawSkarmogyftosVectorBody(sctx, flash);
            });
            ctx.restore();
            this.drawOverheadHUD(ctx);
            return;
        }

        this._drawSkarmogyftosVectorBody(ctx, flash);

        ctx.restore();

        // Overhead health HUD from EnemyBase
        this.drawOverheadHUD(ctx);
    }

    _drawSkarmogyftosVectorBody(ctx, flash) {

        // Body / Jacket (Teal & Orange Hoodie)
        ctx.fillStyle = flash ? '#ffffff' : '#006266';
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(-4, 0, this.radius * 0.82, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Orange hoodie trim
        ctx.fillStyle = flash ? '#ffffff' : '#f39c12';
        ctx.beginPath();
        ctx.arc(2, 0, this.radius * 0.45, -Math.PI / 2, Math.PI / 2);
        ctx.fill();

        // Head (Warm skin tone)
        ctx.fillStyle = flash ? '#ffffff' : '#e5b184';
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(3, 0, this.radius * 0.72, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // --- WILD CURLY DARK HAIR AROUND HEAD ---
        ctx.fillStyle = flash ? '#ffffff' : '#3d2314';
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 2.5;

        const curls = [
            { cx: -8, cy: -15, r: 7.5 },
            { cx: -15, cy: -8, r: 8 },
            { cx: -17, cy: 0, r: 8.5 },
            { cx: -15, cy: 8, r: 8 },
            { cx: -8, cy: 15, r: 7.5 },
            { cx: -2, cy: -18, r: 7 },
            { cx: -2, cy: 18, r: 7 },
            { cx: 5, cy: -16, r: 6.5 },
            { cx: 5, cy: 16, r: 6.5 }
        ];

        for (let i = 0; i < curls.length; i++) {
            const c = curls[i];
            ctx.beginPath();
            ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }

        // --- 80% OPEN SLEEPY RELAXED EYES ---
        const eyeX = 9;
        
        // Left Eye
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(eyeX, -6, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Right Eye
        ctx.beginPath();
        ctx.arc(eyeX, 6, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Dark Sleepy Eyelids (Covering ~20-25% from top for the iconic 80% open look)
        ctx.fillStyle = '#d49b6a';
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.arc(eyeX, -6, 4.8, -Math.PI * 0.9, -Math.PI * 0.1, false);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(eyeX, 6, 4.8, -Math.PI * 0.9, -Math.PI * 0.1, false);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Pupils looking slyly
        ctx.fillStyle = '#2c1810';
        ctx.beginPath();
        ctx.arc(eyeX + 1.2, -5.5, 2, 0, Math.PI * 2);
        ctx.arc(eyeX + 1.2, 6.5, 2, 0, Math.PI * 2);
        ctx.fill();

        // Smirking Mouth
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(eyeX + 1, 0, 3.8, -0.4, 0.6);
        ctx.stroke();

        // --- GOATEE BEARD & MUSTACHE ---
        ctx.fillStyle = '#3d2314';
        
        // Mustache
        ctx.beginPath();
        ctx.ellipse(eyeX + 2, 0, 1.8, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Goatee on Chin
        ctx.strokeStyle = '#1e272e';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(eyeX + 4, -3);
        ctx.lineTo(eyeX + 8, 0);
        ctx.lineTo(eyeX + 4, 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
}
