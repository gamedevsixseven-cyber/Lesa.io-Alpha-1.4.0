/**
 * Lesa.io - Active Skill: Kafenio Chair Throw (Uncommon)
 * Hurls a spinning oak Greek tavern chair along aim angle with 1x obstacle/wall ricochet,
 * bowling through enemies with heavy knockback, splinters & micro-stun.
 */

class ThrownChairHazard {
    constructor(x, y, angle, cfg, damageMult, game) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * (cfg.speed || 14);
        this.vy = Math.sin(angle) * (cfg.speed || 14);
        this.speed = cfg.speed || 14;
        this.radius = cfg.radius || 30;
        this.damage = (cfg.damage || 115) * (damageMult || 1);
        this.stunDuration = cfg.stunDuration || 0.65;
        this.remainingRange = cfg.range || 430;
        this.bouncesLeft = cfg.bounces !== undefined ? cfg.bounces : 1;
        this.arena = game ? game.arena : null;
        this.spin = angle;
        this.age = 0;
        this.dead = false;
        this.hitCooldowns = new Map();
    }

    _bounceIfHitWallOrObstacle(effects) {
        if (!this.arena) return;
        const pad = 28;
        let nx = 0, ny = 0;
        if (this.x - this.radius <= pad && this.vx < 0) nx = 1;
        else if (this.x + this.radius >= this.arena.width - pad && this.vx > 0) nx = -1;
        if (this.y - this.radius <= pad && this.vy < 0) ny = 1;
        else if (this.y + this.radius >= this.arena.height - pad && this.vy > 0) ny = -1;

        if (!nx && !ny && Array.isArray(this.arena.obstacles)) {
            for (const obs of this.arena.obstacles) {
                if (!obs || obs.destroyed) continue;
                const r = (obs.radius || 32) + this.radius * 0.72;
                const dx = this.x - obs.x, dy = this.y - obs.y;
                if (dx * dx + dy * dy <= r * r) {
                    const d = Math.max(1, Math.hypot(dx, dy));
                    nx = dx / d; ny = dy / d;
                    break;
                }
            }
        }
        if (nx || ny) {
            if (this.bouncesLeft <= 0) { this.dead = true; return; }
            this.bouncesLeft--;
            if (nx && ny && Math.abs(nx) + Math.abs(ny) > 1.2) {
                const l = Math.hypot(nx, ny); nx /= l; ny /= l;
            }
            const dot = this.vx * nx + this.vy * ny;
            if (dot < 0) { this.vx -= 2 * dot * nx; this.vy -= 2 * dot * ny; }
            this.x += nx * 8; this.y += ny * 8;
            this.hitCooldowns.clear();
            if (effects) {
                effects.addSparks(this.x, this.y, '#d4a359', 8);
                effects.addComicSplash(this.x, this.y - 24, 'RICOCHET! 🪑', '#fed330');
            }
            if (window.soundEngine && typeof window.soundEngine.playHit === 'function') window.soundEngine.playHit(false, true);
        }
    }

    update(dt = 1, enemies = [], player = null, effects = null) {
        if (this.dead) return;
        this.age += dt;
        this.spin += 0.34 * dt;

        const stepX = this.vx * dt, stepY = this.vy * dt;
        this.x += stepX; this.y += stepY;
        this.remainingRange -= Math.hypot(stepX, stepY);

        if (effects && Math.random() < 0.45 * dt) {
            effects.addSparks(this.x, this.y, '#fed330', 1);
            effects.addDust(this.x, this.y, 1, 4);
        }
        this._bounceIfHitWallOrObstacle(effects);
        if (this.dead || this.remainingRange <= 0) { this.dead = true; return; }

        if (!Array.isArray(enemies)) return;
        const speedLen = Math.max(1, Math.hypot(this.vx, this.vy));
        for (const e of enemies) {
            if (!e || e.dead || e.isDying || e.isAirborneImmune) continue;
            const last = this.hitCooldowns.get(e);
            if (last !== undefined && (this.age - last) < 16) continue;
            const dx = e.x - this.x, dy = e.y - this.y;
            const hitR = this.radius + (e.radius || 22);
            if (dx * dx + dy * dy <= hitR * hitR) {
                this.hitCooldowns.set(e, this.age);
                e.takeDamage(this.damage, effects, false);
                if (!e.isStationary) {
                    e.x += (this.vx / speedLen) * 20;
                    e.y += (this.vy / speedLen) * 20;
                    if (typeof e.applyStun === 'function') e.applyStun(this.stunDuration, effects);
                    else e.stunTimer = Math.max(e.stunTimer || 0, Math.round(this.stunDuration * 60));
                }
                if (effects) {
                    effects.addSparks(e.x, e.y, '#c89d4c', 6);
                    effects.addComicSplash(e.x, e.y - 22, "CHAIR'D! 🪑", '#2ecc71');
                }
                if (window.soundEngine && typeof window.soundEngine.playHit === 'function') window.soundEngine.playHit(true, true);
            }
        }
    }

    draw(ctx) {
        if (this.dead) return;
        ctx.save();
        ctx.translate(this.x, this.y);

        // Ground shadow & motion blur spin arc
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.beginPath(); ctx.ellipse(0, 14, this.radius * 0.72, 8, 0, 0, Math.PI * 2); ctx.fill();

        ctx.strokeStyle = 'rgba(254, 211, 48, 0.7)';
        ctx.lineWidth = 3.2;
        ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.94, this.spin, this.spin + 1.9); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.94, this.spin + Math.PI, this.spin + Math.PI + 1.9); ctx.stroke();

        ctx.rotate(this.spin);
        ctx.strokeStyle = '#1a1d2b'; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';

        // 4 Wooden Legs extending cleanly outward
        ctx.fillStyle = '#6b3410';
        for (const [lx, ly] of [[-13, 8], [13, 8], [-15, -10], [15, -10]]) {
            ctx.beginPath(); ctx.arc(lx, ly, 3.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
        // Woven Straw Taverna Seat
        ctx.fillStyle = '#f3d285';
        ctx.beginPath(); ctx.roundRect(-14, -12, 28, 22, 4); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#c89d4c'; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.moveTo(-10, -8); ctx.lineTo(10, 7); ctx.moveTo(10, -8); ctx.lineTo(-10, 7); ctx.stroke();

        // Carved Oak Backrest Rail
        ctx.fillStyle = '#8b4513'; ctx.strokeStyle = '#1a1d2b'; ctx.lineWidth = 2.6;
        ctx.beginPath(); ctx.roundRect(-15, -18, 30, 8, 3); ctx.fill(); ctx.stroke();
        ctx.restore();
    }
}

class ChairThrowSkill {
    static execute(player, level, enemies = [], effects = null, camera = null, game = null) {
        const sd = (typeof SKILLS !== 'undefined' && SKILLS.chair_throw) ? SKILLS.chair_throw : null;
        const ld = (sd && sd.levels) ? (sd.levels[level] || sd.levels[1]) : { damage: 115, radius: 30, speed: 14, range: 430, stunDuration: 0.65, bounces: 1 };
        const cdSec = sd ? sd.cooldown : 7.0;
        player.skillCooldown = Math.round(cdSec * 60);
        player.maxSkillCooldown = player.skillCooldown;

        const activeGame = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (effects) {
            effects.addComicSplash(player.x, player.y - 32, 'OPA! 🪑', '#2ecc71');
            effects.addDust(player.x, player.y, 5, 8);
        }
        if (camera && typeof camera.shake === 'function') camera.shake(5, 6);
        if (window.soundEngine && typeof window.soundEngine.playBladeSwish === 'function') window.soundEngine.playBladeSwish();

        if (activeGame) {
            if (!activeGame.hazards) activeGame.hazards = [];
            activeGame.hazards.push(new ThrownChairHazard(
                player.x + Math.cos(player.angle) * 26,
                player.y + Math.sin(player.angle) * 26,
                player.angle, ld, player.damageMultiplier || 1, activeGame
            ));
        }
    }
}

if (typeof window !== 'undefined') window.ChairThrowSkill = ChairThrowSkill;
if (typeof module !== 'undefined' && module.exports) module.exports = { ChairThrowSkill, ThrownChairHazard };
