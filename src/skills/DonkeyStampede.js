/**
 * Lesa.io - Active Skill: Gaidaros Stampede (Epic)
 * Summons an oversized cartoon Greek Village Donkey that charges furiously across a wide lane,
 * trampling enemies with heavy damage, knocking mobs aside, stunning, and kicking up dust plumes.
 */

class DonkeyStampedeHazard {
    constructor(x, y, angle, cfg, damageMult, game) {
        this.x = x;
        this.y = y;
        this.angle = Number.isFinite(angle) ? angle : 0;
        const speed = cfg.speed || 15.5;
        this.vx = Math.cos(this.angle) * speed;
        this.vy = Math.sin(this.angle) * speed;
        this.radius = cfg.radius || 48;
        this.damage = (cfg.damage || 160) * (damageMult || 1);
        this.stunDuration = cfg.stunDuration || 1.2;
        this.remainingRange = cfg.range || 650;
        this.game = game;
        this.age = 0;
        this.dead = false;
        this.hitEnemies = new Set();
    }

    _rRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(x, y, w, h, r);
        } else {
            ctx.moveTo(x + r, y);
            ctx.lineTo(x + w - r, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + r);
            ctx.lineTo(x + w, y + h - r);
            ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            ctx.lineTo(x + r, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - r);
            ctx.lineTo(x, y + r);
            ctx.quadraticCurveTo(x, y, x + r, y);
            ctx.closePath();
        }
    }

    update(dt = 1, enemies = [], player = null, effects = null) {
        if (this.dead) return;
        this.age += dt;

        const stepX = this.vx * dt;
        const stepY = this.vy * dt;
        this.x += stepX;
        this.y += stepY;
        this.remainingRange -= Math.hypot(stepX, stepY);

        // Hoof dust plumes & golden motion sparks
        if (effects && Math.random() < 0.90 * dt) {
            effects.addDust(this.x - Math.cos(this.angle) * 28, this.y - Math.sin(this.angle) * 28, 3, 8);
            if (Math.random() < 0.45) {
                effects.addSparks(this.x, this.y, '#fed330', 2);
            }
        }

        // Centered world boundary check (-halfWidth .. +halfWidth, -halfHeight .. +halfHeight)
        const arena = this.game ? this.game.arena : null;
        if (arena) {
            const hw = (arena.halfWidth || (arena.width ? arena.width * 0.5 : 1400)) - 22;
            const hh = (arena.halfHeight || (arena.height ? arena.height * 0.5 : 1400)) - 22;
            if (this.x < -hw || this.y < -hh || this.x > hw || this.y > hh) {
                if (effects) {
                    effects.addDust(this.x, this.y, 7, 10);
                    effects.addSparks(this.x, this.y, '#ff9f43', 10);
                }
                this.dead = true;
                return;
            }
        }

        if (this.remainingRange <= 0) {
            if (effects) {
                effects.addDust(this.x, this.y, 7, 10);
                effects.addShockwave(this.x, this.y, this.radius * 1.4, 'rgba(255, 159, 67, 0.72)');
            }
            this.dead = true;
            return;
        }

        // Trample enemies along wide stampede lane
        if (!Array.isArray(enemies)) return;
        const dirLen = Math.max(1, Math.hypot(this.vx, this.vy));
        const fx = this.vx / dirLen;
        const fy = this.vy / dirLen;
        const px = -fy;
        const py = fx;

        for (const e of enemies) {
            if (!e || e.dead || e.isDying || e.isAirborneImmune || this.hitEnemies.has(e)) continue;
            const dx = e.x - this.x;
            const dy = e.y - this.y;
            const hitR = this.radius + (e.radius || 22);
            if (dx * dx + dy * dy <= hitR * hitR) {
                this.hitEnemies.add(e);
                e.takeDamage(this.damage, effects, false);

                if (!e.isStationary && !e.dead && e.hp > 0) {
                    const sideSign = (dx * px + dy * py) >= 0 ? 1 : -1;
                    const pushMult = e.isBoss ? 0.35 : 1.0;
                    e.x += (fx * 20 + px * sideSign * 30) * pushMult;
                    e.y += (fy * 20 + py * sideSign * 30) * pushMult;
                    if (typeof e.applyStun === 'function') e.applyStun(this.stunDuration, effects);
                    else e.stunTimer = Math.max(e.stunTimer || 0, Math.round(this.stunDuration * 60));
                }

                if (effects) {
                    effects.addSparks(e.x, e.y, '#ff9f43', 9);
                    effects.addSparks(e.x, e.y, '#fed330', 6);
                    effects.addComicSplash(e.x, e.y - 26, 'TRAMPLED! 🫏', '#ff9f43');
                }
                if (window.soundEngine && typeof window.soundEngine.playHit === 'function') {
                    window.soundEngine.playHit(true, true);
                }
            }
        }
    }

    draw(ctx) {
        if (this.dead) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        const gallop = Math.sin(this.age * 0.65);
        const bounceY = -Math.abs(gallop) * 6;
        const facingLeft = Math.cos(this.angle) < 0;

        ctx.rotate(this.angle);

        // Glowing Stampede Lane Rush Cone Ahead & Trail Behind
        ctx.fillStyle = 'rgba(255, 159, 67, 0.22)';
        ctx.beginPath();
        ctx.ellipse(-18, 0, this.radius * 1.4, this.radius * 0.72, 0, 0, Math.PI * 2);
        ctx.fill();

        // Keep donkey upright even when charging left
        if (facingLeft) ctx.scale(1, -1);

        // Ground shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
        ctx.beginPath();
        ctx.ellipse(0, 22, 42, 13, 0, 0, Math.PI * 2);
        ctx.fill();

        // Speed Wind Streaks
        ctx.strokeStyle = 'rgba(255, 234, 167, 0.92)';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        for (const sy of [-22, -4, 16]) {
            ctx.beginPath();
            ctx.moveTo(-78, sy);
            ctx.lineTo(-42, sy);
            ctx.stroke();
        }

        // Front Shock-Cone Air Arc
        ctx.strokeStyle = 'rgba(254, 211, 48, 0.75)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(36, -2, 32, -0.75, 0.75);
        ctx.stroke();

        ctx.scale(1.32, 1.32);
        ctx.translate(0, bounceY);
        ctx.strokeStyle = '#0f1419';
        ctx.lineWidth = 2.6;
        ctx.lineJoin = 'round';

        // Animating Galloping Hooves & Legs
        ctx.fillStyle = '#57606f';
        const backSwing = gallop * 10;
        const frontSwing = -gallop * 11;
        this._rRect(ctx, -26 + backSwing, 6, 8, 17, 3); ctx.fill(); ctx.stroke();
        this._rRect(ctx, 13 + frontSwing, 5, 8, 17, 3); ctx.fill(); ctx.stroke();

        // Flying Dark Tail
        ctx.beginPath();
        ctx.moveTo(-27, -2);
        ctx.quadraticCurveTo(-43, -11 + gallop * 5, -47, -2);
        ctx.strokeStyle = '#2f3542'; ctx.lineWidth = 4.5; ctx.stroke();

        // Muscular Greek Donkey Torso
        ctx.strokeStyle = '#0f1419'; ctx.lineWidth = 2.6;
        ctx.fillStyle = '#747d8c';
        ctx.beginPath();
        ctx.ellipse(-4, 0, 28, 16, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        // Woven Crimson Village Saddle Blanket & Gold Border
        ctx.fillStyle = '#ff4757';
        this._rRect(ctx, -16, -15, 22, 23, 4); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#fed330'; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(-13, 4); ctx.lineTo(4, 4); ctx.stroke();

        // Neck & Furious Charging Head
        ctx.strokeStyle = '#0f1419'; ctx.lineWidth = 2.6;
        ctx.fillStyle = '#a4b0be';
        ctx.beginPath();
        ctx.ellipse(23, -7, 16, 12, 0.16, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();

        // Long Swept-Back Flapping Ears
        const earWobble = gallop * 0.14;
        ctx.fillStyle = '#747d8c';
        ctx.beginPath();
        ctx.moveTo(16, -15); ctx.lineTo(-4, -29 + earWobble * 12); ctx.lineTo(13, -9); ctx.closePath();
        ctx.fill(); ctx.stroke();

        // Tan Snout, Glowing Red Eye, Brass Bell & Angry Nostril Puff
        ctx.fillStyle = '#dfe6e9';
        ctx.beginPath(); ctx.ellipse(36, -4, 8, 6.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ff4757';
        ctx.beginPath(); ctx.arc(25, -10, 3.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fed330';
        ctx.beginPath(); ctx.arc(20, 9, 4.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        ctx.restore();
    }
}

class DonkeyStampedeSkill {
    static execute(player, level, enemies = [], effects = null, camera = null, game = null) {
        const sd = (typeof SKILLS !== 'undefined' && SKILLS.donkey_stampede) ? SKILLS.donkey_stampede : null;
        const ld = (sd && sd.levels) ? (sd.levels[level] || sd.levels[1]) : { damage: 160, radius: 48, range: 650, speed: 15.5, stunDuration: 1.2 };
        const cdSec = sd ? sd.cooldown : 11.5;
        player.skillCooldown = Math.round(cdSec * 60);
        player.maxSkillCooldown = player.skillCooldown;

        const activeGame = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        const angle = Number.isFinite(player.angle) ? player.angle : 0;
        const shouts = ['HEE-HAW! 🫏', 'ΓΚΑΪΝΤΑΡΟΣ! 🫏', 'MOVE IT! 💨'];
        if (effects) {
            effects.addComicSplash(player.x, player.y - 34, shouts[Math.floor(Math.random() * shouts.length)], '#ff9f43');
            effects.addDust(player.x, player.y, 7, 10);
            effects.addShockwave(player.x, player.y, 70, 'rgba(255, 159, 67, 0.8)');
        }
        if (camera && typeof camera.addShake === 'function') camera.addShake(8);
        if (window.soundEngine && typeof window.soundEngine.playBladeSwish === 'function') window.soundEngine.playBladeSwish();

        if (activeGame) {
            if (!activeGame.hazards) activeGame.hazards = [];
            activeGame.hazards.push(new DonkeyStampedeHazard(
                player.x + Math.cos(angle) * 28,
                player.y + Math.sin(angle) * 28,
                angle, ld, player.damageMultiplier || 1, activeGame
            ));
        }
    }
}

if (typeof window !== 'undefined') window.DonkeyStampedeSkill = DonkeyStampedeSkill;
if (typeof module !== 'undefined' && module.exports) module.exports = { DonkeyStampedeSkill, DonkeyStampedeHazard };
