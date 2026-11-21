/**
 * Lesa.io - Active Skill: Komboloi Vortex (Rare)
 * Orbits gleaming amber worry beads + crimson tassel around the hero:
 * slices enemies, shreds incoming bullets, and magnetically pulls pickups inward.
 */

class KomboloiVortexHazard {
    constructor(player, cfg, game) {
        this.player = player;
        this.x = player.x;
        this.y = player.y;
        this.beads = cfg.beads || 4;
        this.radius = cfg.radius || 120;
        this.duration = cfg.duration || 192;
        this.maxDuration = this.duration;
        this.damage = (cfg.damage || 48) * (player.damageMultiplier || 1);
        this.deflectChance = cfg.deflectChance || 0.45;
        this.game = game;
        this.age = 0;
        this.rot = 0;
        this.dead = false;
        this.hitCooldowns = new Map();
    }

    update(dt = 1, enemies = [], player = null, effects = null) {
        if (this.dead) return;
        const owner = this.player || player;
        if (!owner || owner.hp <= 0) { this.dead = true; return; }

        this.x = owner.x;
        this.y = owner.y;
        this.age += dt;
        this.duration -= dt;
        this.rot += 0.11 * dt;
        if (this.duration <= 0) { this.dead = true; return; }

        const g = this.game || (typeof window !== 'undefined' ? window.gameInstance : null);
        // 1. Slice nearby enemies touched by bead orbit ring
        if (Array.isArray(enemies)) {
            const innerR = Math.max(24, this.radius - 26);
            const outerR = this.radius + 26;
            for (const e of enemies) {
                if (!e || e.dead || e.isDying || e.isAirborneImmune) continue;
                const last = this.hitCooldowns.get(e);
                if (last !== undefined && (this.age - last) < 16) continue;
                const dx = e.x - this.x, dy = e.y - this.y;
                const dist = Math.hypot(dx, dy);
                if (dist <= outerR + (e.radius || 20) && dist >= innerR - (e.radius || 20)) {
                    this.hitCooldowns.set(e, this.age);
                    e.takeDamage(this.damage, effects, false);
                    if (!e.isStationary && dist > 1) { e.x += (dx / dist) * 10; e.y += (dy / dist) * 10; }
                    if (effects) effects.addSparks(e.x, e.y, '#fbbf24', 5);
                }
            }
        }

        // 2. Shred incoming enemy projectiles intersecting the orbit
        if (g && Array.isArray(g.bullets)) {
            for (const b of g.bullets) {
                if (!b || b.dead || !b.isEnemy || b._komboloiChecked) continue;
                const dx = b.x - this.x, dy = b.y - this.y;
                if (Math.hypot(dx, dy) <= this.radius + 14) {
                    b._komboloiChecked = true;
                    if (Math.random() < this.deflectChance) {
                        b.dead = true;
                        if (effects) {
                            effects.addSparks(b.x, b.y, '#00f5ff', 6);
                            effects.addComicSplash(b.x, b.y - 14, 'PARRIED! 📿', '#00f5ff');
                        }
                        if (window.soundEngine && typeof window.soundEngine.playHit === 'function') window.soundEngine.playHit(false, true);
                    }
                }
            }
        }

        // 3. Magnetically attract XP Stars / Coins toward the hero
        if (g && Array.isArray(g.drops)) {
            const pullSq = Math.pow(this.radius * 1.45, 2);
            for (const d of g.drops) {
                if (!d || d.dead) continue;
                const dx = this.x - d.x, dy = this.y - d.y;
                const distSq = dx * dx + dy * dy;
                if (distSq > 25 && distSq <= pullSq) {
                    const dist = Math.sqrt(distSq);
                    d.x += (dx / dist) * 6.5 * dt;
                    d.y += (dy / dist) * 6.5 * dt;
                }
            }
        }
    }

    draw(ctx) {
        if (this.dead) return;
        const fade = Math.min(1, this.age / 10) * Math.min(1, (this.duration / this.maxDuration) * 3.5);
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.globalAlpha = fade;

        // Kinetic Gold & Cyan Hurricane String Ring
        ctx.strokeStyle = 'rgba(0, 245, 255, 0.45)';
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.stroke();

        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([10, 7]);
        ctx.beginPath(); ctx.arc(0, 0, this.radius, this.rot, this.rot + Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]);

        // Orbiting Amber Worry Beads + Whipping Crimson Silk Tassel
        for (let i = 0; i < this.beads; i++) {
            const a = this.rot + (i * (Math.PI * 2)) / this.beads;
            const bx = Math.cos(a) * this.radius;
            const by = Math.sin(a) * this.radius;

            if (i === 0) {
                ctx.fillStyle = '#e11d48';
                ctx.strokeStyle = '#1a1d2b';
                ctx.lineWidth = 2.0;
                ctx.beginPath();
                ctx.moveTo(bx, by);
                ctx.lineTo(bx - Math.cos(a - 0.35) * 18, by - Math.sin(a - 0.35) * 18);
                ctx.lineTo(bx - Math.cos(a + 0.35) * 18, by - Math.sin(a + 0.35) * 18);
                ctx.closePath(); ctx.fill(); ctx.stroke();
            }

            const g = ctx.createRadialGradient(bx - 2.5, by - 2.5, 1, bx, by, 9.5);
            g.addColorStop(0, '#fff7ae');
            g.addColorStop(0.45, '#fbbf24');
            g.addColorStop(1, '#b45309');
            ctx.fillStyle = g;
            ctx.strokeStyle = '#1a1d2b';
            ctx.lineWidth = 2.2;
            ctx.beginPath(); ctx.arc(bx, by, 9.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        }
        ctx.restore();
    }
}

class KomboloiVortexSkill {
    static execute(player, level, enemies = [], effects = null, camera = null, game = null) {
        const sd = (typeof SKILLS !== 'undefined' && SKILLS.komboloi_vortex) ? SKILLS.komboloi_vortex : null;
        const ld = (sd && sd.levels) ? (sd.levels[level] || sd.levels[1]) : { beads: 4, radius: 120, duration: 192, damage: 48, deflectChance: 0.45 };
        const cdSec = sd ? sd.cooldown : 9.5;
        player.skillCooldown = Math.round(cdSec * 60);
        player.maxSkillCooldown = player.skillCooldown;

        const activeGame = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (effects) {
            effects.addComicSplash(player.x, player.y - 34, 'KOMBOLOI VORTEX! 📿', '#fbbf24');
            effects.addShockwave(player.x, player.y, ld.radius, 'rgba(251, 191, 36, 0.85)');
            effects.addSparks(player.x, player.y, '#00f5ff', 10);
        }
        if (camera && typeof camera.shake === 'function') camera.shake(6, 7);
        if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') window.soundEngine.playSelect();

        if (activeGame) {
            if (!activeGame.hazards) activeGame.hazards = [];
            activeGame.hazards.push(new KomboloiVortexHazard(player, ld, activeGame));
        }
    }
}

if (typeof window !== 'undefined') window.KomboloiVortexSkill = KomboloiVortexSkill;
if (typeof module !== 'undefined' && module.exports) module.exports = { KomboloiVortexSkill, KomboloiVortexHazard };
