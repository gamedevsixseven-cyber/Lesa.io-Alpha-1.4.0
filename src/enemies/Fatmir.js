/**
 * Lesa.io - Enemy: "Fatmir"
 * Heavy Bruiser / Tank with charge rushes & ground slam shockwaves
 */

class Fatmir extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'fatmir', waveMultiplier);
        this.name = 'Skatmir';
        this.radius = 32;
        this.maxHp = Math.round(180 * waveMultiplier);
        this.hp = this.maxHp;
        this.speed = 2.4;
        this.damage = 28;
        this.color = '#20bf6b';
        this.xpDrop = 45;

        // Fatmir Special State
        this.isCharging = false;
        this.chargeWindup = 0;
        this.chargeTimer = 0;
        this.chargeCooldown = 180 + Math.random() * 80;
        this.chargeTargetAngle = 0;
        this.slamCooldown = 240 + Math.random() * 100;

        // Character Model Textures
        this.frontSpriteSrc = 'assets/HeroesIcons/Fatmirfront.png';
        this.backSpriteSrc = 'assets/HeroesIcons/FatmirBack.png';

        if (typeof window !== 'undefined' && window.CharacterSprites) {
            window.CharacterSprites.get(this.frontSpriteSrc);
            window.CharacterSprites.get(this.backSpriteSrc);
        }
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

        if (this.chargeCooldown > 0) this.chargeCooldown -= dt;
        if (this.slamCooldown > 0) this.slamCooldown -= dt;

        // Ground Slam check (when within 120px)
        if (dist < 120 && this.slamCooldown <= 0 && !this.isCharging) {
            this.slamCooldown = 260 + Math.random() * 80;
            if (window.soundEngine) {
                window.soundEngine.playFatmirSlam();
            }
            if (effects) {
                effects.addShockwave(this.x, this.y, 140, 'rgba(235, 77, 75, 0.9)');
                effects.addComicSplash(this.x, this.y - 40, 'SLAM!');
                if (typeof effects.onBossSlam === 'function') effects.onBossSlam(0.036);
            }
            if (dist < 130) {
                player.takeDamage(this.damage * 1.2, effects);
            }
        }

        // Charge Windup & Execution
        if (this.chargeWindup > 0) {
            this.chargeWindup -= dt;
            this.vx = 0;
            this.vy = 0;
            if (effects && Math.floor(this.age) % 5 === 0) {
                effects.addDust(this.x, this.y + this.radius * 0.7, 1, 5);
            }
            if (this.chargeWindup <= 0) {
                this.isCharging = true;
                this.chargeTimer = 25; // charge duration
                if (effects) effects.addComicSplash(this.x, this.y - 35, 'CHARGE!');
            }
        } else if (this.isCharging) {
            this.chargeTimer -= dt;
            const chargeSpeed = 8.5;
            this.vx = Math.cos(this.chargeTargetAngle) * chargeSpeed;
            this.vy = Math.sin(this.chargeTargetAngle) * chargeSpeed;
            this.angle = this.chargeTargetAngle;

            if (effects && Math.floor(this.age) % 3 === 0) {
                effects.addDust(this.x, this.y + this.radius * 0.7, 1, 6);
            }

            // Hit player during charge
            if (dist < this.radius + player.radius) {
                player.takeDamage(this.damage * 1.5, effects);
                this.isCharging = false;
                this.chargeCooldown = 220;
            }

            if (this.chargeTimer <= 0) {
                this.isCharging = false;
                this.chargeCooldown = 200 + Math.random() * 60;
            }
        } else {
            // Trigger charge windup when in 150-320px range
            if (dist > 140 && dist < 340 && this.chargeCooldown <= 0) {
                this.chargeWindup = 25;
                this.chargeTargetAngle = dir;
                this.angle = dir;
                if (effects) {
                    effects.addPopup(this.x, this.y - 45, '!', '#ff3838', 36, true);
                }
            } else {
                // Normal march towards Psanas (reduced by 45% if drenched by Nerobalonaki!)
                this.updateDebuffs(dt);
                const curSpeed = this.getEffectiveSpeed();
                this.angle = dir;
                this.vx = Math.cos(dir) * curSpeed;
                this.vy = Math.sin(dir) * curSpeed;
            }
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Separation & Bounds
        this.applySeparation(enemies);
        this.applyArenaBounds(arena);

        // Walking animation
        if (Math.abs(this.vx) > 0.3 || Math.abs(this.vy) > 0.3) {
            this.walkCycle += 0.2 * dt;
        }
    }

    draw(ctx) {
        const bob = Math.sin(this.walkCycle) * 4;
        const flash = this.hitFlash > 0;
        const isBack = Math.sin(this.angle) < -0.25;
        const spriteSrc = isBack ? this.backSpriteSrc : this.frontSpriteSrc;
        const sprites = typeof window !== 'undefined' ? window.CharacterSprites : null;

        if (typeof EnemyBatchRenderer === 'undefined' || !EnemyBatchRenderer.active) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.26)';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + this.radius * 0.75, this.radius * 0.9, this.radius * 0.35, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        if (!this.isCharging && sprites && sprites.isReady(spriteSrc) && typeof SpriteAtlasCache !== 'undefined') {
            const img = sprites.get(spriteSrc);
            const spriteH = 100;
            const aspect = (img.naturalWidth && img.naturalHeight) ? (img.naturalWidth / img.naturalHeight) : 0.44;
            const spriteW = spriteH * aspect;
            const feetY = this.radius * 0.65;
            const fKey = `fatmir:${isBack ? 'b' : 'f'}:${flash ? 1 : 0}`;
            const fw = Math.ceil(spriteW + 4);
            const fh = Math.ceil(spriteH + 4);
            const ax = fw * 0.5;
            const ay = Math.ceil(spriteH - feetY + 2);
            SpriteAtlasCache.drawCachedAt(ctx, this.x, this.y + bob, fKey, fw, fh, ax, ay, (fctx) => {
                if (flash) {
                    const cached = CharacterSprites.getFiltered(img, 'flash_25', 'brightness(2.5)', 0);
                    fctx.drawImage(cached ? cached.canvas : img, -spriteW / 2, feetY - spriteH, spriteW, spriteH);
                } else {
                    fctx.drawImage(img, -spriteW / 2, feetY - spriteH, spriteW, spriteH);
                }
            });
            this.drawOverheadHUD(ctx);
            return;
        }

        ctx.save();
        ctx.translate(this.x, this.y + bob);
        this.drawFatmirBody(ctx, bob, flash);
        ctx.restore();

        // Overhead HUD
        this.drawOverheadHUD(ctx);
    }

    drawFatmirBody(ctx, bob, flash) {
        const isBack = Math.sin(this.angle) < -0.25;
        const facingLeft = Math.cos(this.angle) < 0;
        const spriteSrc = isBack ? this.backSpriteSrc : this.frontSpriteSrc;

        const sprites = typeof window !== 'undefined' ? window.CharacterSprites : null;
        if (sprites && sprites.isReady(spriteSrc)) {
            const img = sprites.get(spriteSrc);
            const spriteH = 100;
            const aspect = (img.naturalWidth && img.naturalHeight) ? (img.naturalWidth / img.naturalHeight) : 0.44;
            const spriteW = spriteH * aspect;
            const feetY = this.radius * 0.65;

            ctx.save();
            if (facingLeft) {
                ctx.scale(-1, 1);
            }
            if (!this.isCharging && typeof SpriteAtlasCache !== 'undefined') {
                const fKey = `fatmir:${isBack ? 'b' : 'f'}:${flash ? 1 : 0}`;
                const fw = Math.ceil(spriteW + 4);
                const fh = Math.ceil(spriteH + 4);
                const ax = fw * 0.5;
                const ay = Math.ceil(spriteH - feetY + 2);
                SpriteAtlasCache.drawCached(ctx, fKey, fw, fh, ax, ay, (fctx) => {
                    if (flash) {
                        const cached = CharacterSprites.getFiltered(img, 'flash_25', 'brightness(2.5)', 0);
                        fctx.drawImage(cached ? cached.canvas : img, -spriteW / 2, feetY - spriteH, spriteW, spriteH);
                    } else {
                        fctx.drawImage(img, -spriteW / 2, feetY - spriteH, spriteW, spriteH);
                    }
                }, { flipX: facingLeft });
                ctx.restore();
                return;
            }
            if (flash) {
                const cached = CharacterSprites.getFiltered(img, 'flash_25', 'brightness(2.5)', 0);
                ctx.drawImage(cached ? cached.canvas : img, -spriteW / 2, feetY - spriteH, spriteW, spriteH);
            } else if (this.isCharging) {
                const cached = CharacterSprites.getFiltered(img, 'charge_red', 'drop-shadow(0 0 18px rgba(235, 77, 75, 0.9))', 24);
                if (cached) {
                    const padW = cached.padPx * (spriteW / cached.w);
                    const padH = cached.padPx * (spriteH / cached.h);
                    ctx.drawImage(cached.canvas, -spriteW / 2 - padW, feetY - spriteH - padH, spriteW + padW * 2, spriteH + padH * 2);
                } else {
                    ctx.drawImage(img, -spriteW / 2, feetY - spriteH, spriteW, spriteH);
                }
            } else {
                ctx.drawImage(img, -spriteW / 2, feetY - spriteH, spriteW, spriteH);
            }
            ctx.restore();
            return;
        }

        ctx.save();
        ctx.rotate(this.angle);

        const r = this.radius;
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#1e272e';

        // Big Spiked Wooden Club in Hand
        ctx.save();
        ctx.translate(r * 0.8, r * 0.5);
        ctx.rotate(0.3 + (this.isCharging ? 0.6 : 0));
        ctx.fillStyle = flash ? '#ffffff' : '#8b4513';
        ctx.beginPath();
        ctx.moveTo(-4, -18);
        ctx.lineTo(10, -22);
        ctx.lineTo(8, 10);
        ctx.lineTo(-4, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Iron Spikes on Club
        ctx.fillStyle = '#dfe4ea';
        ctx.beginPath();
        ctx.arc(8, -14, 3, 0, Math.PI * 2);
        ctx.arc(-2, -10, 3, 0, Math.PI * 2);
        ctx.arc(6, -4, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Fatmir Chunky Body (Green Orc Brute)
        ctx.fillStyle = flash ? '#ffffff' : '#88b04b';
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Blue Tunic vest
        ctx.fillStyle = flash ? '#ffffff' : '#3867d6';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.85, Math.PI * 0.3, Math.PI * 1.7, false);
        ctx.fill();
        ctx.stroke();

        // Skull Belt
        ctx.fillStyle = '#2f3542';
        ctx.fillRect(-r * 0.8, -4, r * 1.6, 8);
        ctx.strokeRect(-r * 0.8, -4, r * 1.6, 8);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Face & Menacing Bushy Eyebrows
        if (!flash) {
            const eyeX = r * 0.35;
            ctx.fillStyle = '#2f3542';
            ctx.beginPath();
            ctx.moveTo(eyeX - 4, -14);
            ctx.lineTo(eyeX + 8, -6);
            ctx.lineTo(eyeX - 2, -4);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(eyeX - 4, 14);
            ctx.lineTo(eyeX + 8, 6);
            ctx.lineTo(eyeX - 2, 4);
            ctx.closePath();
            ctx.fill();

            // Yellow Orc Eyes
            ctx.fillStyle = '#fed330';
            ctx.strokeStyle = '#1e272e';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(eyeX, -6, 5, 0, Math.PI * 2);
            ctx.arc(eyeX, 6, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Black Pupils
            ctx.fillStyle = '#1e272e';
            ctx.beginPath();
            ctx.arc(eyeX + 2, -6, 2, 0, Math.PI * 2);
            ctx.arc(eyeX + 2, 6, 2, 0, Math.PI * 2);
            ctx.fill();

            // Tusks / Underbite Fangs
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#1e272e';
            ctx.beginPath();
            ctx.moveTo(eyeX + 4, -4);
            ctx.lineTo(eyeX + 10, -2);
            ctx.lineTo(eyeX + 4, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(eyeX + 4, 4);
            ctx.lineTo(eyeX + 10, 2);
            ctx.lineTo(eyeX + 4, 0);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.Fatmir = Fatmir;
    window.Skatmir = Fatmir;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Fatmir, Skatmir: Fatmir };
}
