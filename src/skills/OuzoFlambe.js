/**
 * Lesa.io - Active Skill: Ouzo Flambé (Rare)
 * Lobs an ignited Ouzo bottle that shatters into roaring cartoon blue flames:
 * burns enemies in the fire pool and empowers player bullets passing through it.
 */

class OuzoFlambeHazard {
    constructor(startX, startY, targetX, targetY, cfg, damageMult, game) {
        this.startX = startX;
        this.startY = startY;
        this.x = targetX;
        this.y = targetY;
        this.radius = cfg.radius || 145;
        this.duration = cfg.duration || 240;
        this.maxDuration = this.duration;
        this.tickDamage = (cfg.tickDamage || 34) * (damageMult || 1);
        this.bulletAmp = cfg.bulletAmp || 1.20;
        this.game = game;
        this.flightTime = 16;
        this.age = 0;
        this.detonated = false;
        this.dead = false;
        this.burnTimer = 0;

        this.points = [];
        for (let i = 0; i < 14; i++) {
            this.points.push({ angle: (i / 14) * Math.PI * 2, variance: 0.82 + Math.random() * 0.34, phase: Math.random() * Math.PI * 2 });
        }
    }

    update(dt = 1, enemies = [], player = null, effects = null) {
        if (this.dead) return;
        this.age += dt;

        // Phase 1: Parabolic Airborne Bottle Lob
        if (!this.detonated) {
            if (this.age < this.flightTime) {
                if (effects && Math.random() < 0.7) {
                    const t = this.age / this.flightTime;
                    const bx = this.startX + (this.x - this.startX) * t;
                    const by = this.startY + (this.y - this.startY) * t - Math.sin(t * Math.PI) * 58;
                    effects.addSparks(bx, by, '#00f5ff', 2);
                }
                return;
            }
            this.detonated = true;
            if (effects) {
                effects.addComicSplash(this.x, this.y - 30, 'OPA! FLAMBÉ! 🔥', '#00f5ff', 26, true);
                effects.addShockwave(this.x, this.y, this.radius + 14, 'rgba(0, 245, 255, 0.88)');
                effects.addSparks(this.x, this.y, '#00f5ff', 16);
                effects.addSparks(this.x, this.y, '#ffffff', 8);
            }
            if (window.soundEngine && typeof window.soundEngine.playHit === 'function') window.soundEngine.playHit(true, true);
        }

        // Phase 2: Persistent Cartoon Blue Flame Pool
        this.duration -= dt;
        if (this.duration <= 0) { this.dead = true; return; }

        this.burnTimer += dt;
        const doTick = this.burnTimer >= 24;
        if (doTick) this.burnTimer -= 24;

        const rSq = this.radius * this.radius;
        if (doTick && Array.isArray(enemies)) {
            for (const e of enemies) {
                if (!e || e.dead || e.isDying || e.isAirborneImmune) continue;
                const dx = e.x - this.x, dy = e.y - this.y;
                const maxD = this.radius + (e.radius || 20);
                if (dx * dx + dy * dy <= maxD * maxD) {
                    e.takeDamage(this.tickDamage, effects, false);
                    if (effects) effects.addSparks(e.x, e.y, '#00f5ff', 4);
                }
            }
        }

        // Ignite Friendly Projectiles Passing Through the Flames
        const g = this.game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (g && Array.isArray(g.bullets)) {
            for (const b of g.bullets) {
                if (!b || b.dead || b.isEnemy || b._ouzoIgnited) continue;
                const dx = b.x - this.x, dy = b.y - this.y;
                if (dx * dx + dy * dy <= rSq) {
                    b._ouzoIgnited = true;
                    b.damage *= this.bulletAmp;
                    b.color = '#00f5ff';
                    if (effects) effects.addSparks(b.x, b.y, '#00f5ff', 3);
                }
            }
        }

        if (effects && Math.random() < 0.35 * dt) {
            const ang = Math.random() * Math.PI * 2, dist = Math.random() * this.radius * 0.78;
            effects.addSparks(this.x + Math.cos(ang) * dist, this.y + Math.sin(ang) * dist, Math.random() < 0.5 ? '#00f5ff' : '#e0f2fe', 1);
        }
    }

    draw(ctx) {
        if (this.dead) return;
        ctx.save();

        // Draw Airborne Tumbling Frosted Green Ouzo Bottle
        if (!this.detonated) {
            const t = Math.min(1, this.age / this.flightTime);
            const bx = this.startX + (this.x - this.startX) * t;
            const by = this.startY + (this.y - this.startY) * t;
            const z = Math.sin(t * Math.PI) * 58;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.beginPath(); ctx.ellipse(bx, by, 10, 5, 0, 0, Math.PI * 2); ctx.fill();

            ctx.translate(bx, by - z);
            ctx.rotate(this.age * 0.48);
            ctx.fillStyle = '#1dd1a1'; ctx.strokeStyle = '#1a1d2b'; ctx.lineWidth = 2.2;
            ctx.beginPath(); ctx.roundRect(-6, -12, 12, 22, 3); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#fef3c7'; ctx.fillRect(-5, -4, 10, 8);
            ctx.fillStyle = '#00f5ff';
            ctx.beginPath(); ctx.arc(0, -16, 4.5 + Math.sin(this.age) * 1.2, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
            return;
        }

        // Draw Roaring Blue Alcohol Fire Pool
        const lifeRatio = Math.max(0, this.duration / this.maxDuration);
        const fade = Math.min(1, (this.age - this.flightTime + 4) / 10) * Math.min(1, lifeRatio * 3.0);
        const wobble = this.age * 0.14;
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = fade;

        ctx.beginPath();
        for (let i = 0; i < this.points.length; i++) {
            const p = this.points[i];
            const rad = this.radius * (p.variance + Math.sin(wobble + p.phase) * 0.05);
            const px = Math.cos(p.angle) * rad, py = Math.sin(p.angle) * rad;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(2, 132, 199, 0.42)';
        ctx.fill();
        ctx.lineWidth = 3.0; ctx.strokeStyle = '#00f5ff'; ctx.stroke();

        // Inner Electric-Cyan Core Flame Ring & Dancing Tongues
        ctx.fillStyle = 'rgba(0, 245, 255, 0.28)';
        ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.62, 0, Math.PI * 2); ctx.fill();

        for (let i = 0; i < 6; i++) {
            const fa = (i / 6) * Math.PI * 2 + wobble * 0.35;
            const fr = this.radius * 0.42;
            const fx = Math.cos(fa) * fr, fy = Math.sin(fa) * fr;
            const fh = 15 + Math.sin(wobble * 2 + i) * 5;
            ctx.fillStyle = i % 2 === 0 ? '#00f5ff' : '#e0f2fe';
            ctx.beginPath();
            ctx.moveTo(fx - 6, fy); ctx.quadraticCurveTo(fx, fy - fh, fx + 6, fy); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
    }
}

class OuzoFlambeSkill {
    static execute(player, level, enemies = [], effects = null, camera = null, game = null) {
        const sd = (typeof SKILLS !== 'undefined' && SKILLS.ouzo_flambe) ? SKILLS.ouzo_flambe : null;
        const ld = (sd && sd.levels) ? (sd.levels[level] || sd.levels[1]) : { radius: 145, duration: 240, tickDamage: 34, bulletAmp: 1.20 };
        const cdSec = sd ? sd.cooldown : 10.0;
        player.skillCooldown = Math.round(cdSec * 60);
        player.maxSkillCooldown = player.skillCooldown;

        const activeGame = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        let tx = player.x + Math.cos(player.angle) * 200;
        let ty = player.y + Math.sin(player.angle) * 200;
        if (activeGame && activeGame.arena) {
            tx = Math.max(80, Math.min(activeGame.arena.width - 80, tx));
            ty = Math.max(80, Math.min(activeGame.arena.height - 80, ty));
        }

        if (effects) effects.addComicSplash(player.x, player.y - 30, 'YIAMAS! 🥃', '#38bdf8');
        if (camera && typeof camera.shake === 'function') camera.shake(5, 6);
        if (window.soundEngine && typeof window.soundEngine.playBladeSwish === 'function') window.soundEngine.playBladeSwish();

        if (activeGame) {
            if (!activeGame.hazards) activeGame.hazards = [];
            activeGame.hazards.push(new OuzoFlambeHazard(player.x, player.y, tx, ty, ld, player.damageMultiplier || 1, activeGame));
        }
    }
}

if (typeof window !== 'undefined') window.OuzoFlambeSkill = OuzoFlambeSkill;
if (typeof module !== 'undefined' && module.exports) module.exports = { OuzoFlambeSkill, OuzoFlambeHazard };
