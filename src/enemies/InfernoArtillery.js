/**
 * Lesa.io - Endless Hard Exclusive Enemy: "Hellfire Mortar" (Wave 28+)
 * Heavy Volcanic Siege Construct firing arced Hellfire Mortar salvos that shatter
 * into magma_shards, plus an Overheat Steam Knockback Ring when rushed up close.
 */

class InfernoArtillery extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'inferno_artillery', waveMultiplier);
        this.name = 'Hellfire Mortar';
        this.radius = 32;
        this.hudOffsetY = 50;
        this.maxHp = Math.round(350 * waveMultiplier);
        this.hp = this.maxHp;
        this.speed = 1.95;
        this.damage = Math.round(36 * (1 + Math.max(0, waveMultiplier - 1) * 0.45));
        this.color = '#ff6b35';
        this.xpDrop = 120;
        this.scoreValue = 660;

        this.siegeCooldown = 140 + Math.random() * 55;
        this.siegeWindup = 0;
        this.ventCooldown = 180;
        this._mortars = [];
        this.strafeDir = Math.random() < 0.5 ? 1 : -1;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        this._tickMortars(dt, player, bullets, effects);

        if (this.updateBubbleTrap(dt, effects) || this.updateStun(dt, effects)) {
            this.siegeWindup = 0;
            return;
        }
        if (this.updateFear(dt, player, effects)) { this.applyArenaBounds(arena); return; }
        if (!player || player.hp <= 0) return;

        const dx = player.x - this.x, dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);
        if (this.siegeCooldown > 0) this.siegeCooldown -= dt;
        if (this.ventCooldown > 0) this.ventCooldown -= dt;

        // 1. Overheat Steam Knockback when cornered (< 140px)
        if (dist < 140 && this.ventCooldown <= 0) {
            this.ventCooldown = 230;
            if (effects) {
                effects.addShockwave(this.x, this.y, 155, 'rgba(255, 107, 53, 0.90)');
                effects.addComicSplash(this.x, this.y - 40, 'OVERHEAT VENT! 🔥', '#fed330', 18);
            }
            if (player.invulnerableTimer <= 0) {
                player.takeDamage(Math.round(this.damage * 0.72), effects);
                player.x += (dx / dist) * 38;
                player.y += (dy / dist) * 38;
            }
            return;
        }

        // 2. Siege Mortar Bombardment Salvo (2 targeted shells)
        if (this.siegeWindup > 0) {
            this.siegeWindup -= dt;
            this.vx = 0; this.vy = 0;
            if (this.siegeWindup <= 0) {
                for (let s = 0; s < 2; s++) {
                    const ang = Math.random() * Math.PI * 2;
                    const off = s === 0 ? 18 : 95;
                    this._mortars.push({
                        x: player.x + Math.cos(ang) * off,
                        y: player.y + Math.sin(ang) * off,
                        radius: 82, timer: 52, maxTimer: 52
                    });
                }
                this.siegeCooldown = 195 + Math.random() * 55;
            }
            return;
        }

        if (this.siegeCooldown <= 0 && dist < 640 && this._mortars.length === 0) {
            this.siegeWindup = 26;
            return;
        }

        const spd = this.getEffectiveSpeed() * dt;
        if (dist > 470) { this.vx = (dx / dist) * spd; this.vy = (dy / dist) * spd; }
        else if (dist < 280) { this.vx = -(dx / dist) * spd * 0.85; this.vy = -(dy / dist) * spd * 0.85; }
        else {
            const sa = this.angle + this.strafeDir * Math.PI * 0.5;
            this.vx = Math.cos(sa) * spd * 0.72; this.vy = Math.sin(sa) * spd * 0.72;
        }
        this.x += this.vx; this.y += this.vy;
        this.walkCycle += 0.16 * dt;
        this.applySeparation(enemies);
        this.applyArenaBounds(arena);
    }

    _tickMortars(dt, player, bullets, effects) {
        for (let i = this._mortars.length - 1; i >= 0; i--) {
            const m = this._mortars[i];
            m.timer -= dt;
            if (m.timer <= 0) {
                if (effects) {
                    effects.addShockwave(m.x, m.y, m.radius + 20, 'rgba(255, 107, 53, 0.92)');
                    effects.addSparks(m.x, m.y, '#fed330', 10);
                }
                if (player && Math.hypot(player.x - m.x, player.y - m.y) <= m.radius && player.invulnerableTimer <= 0) {
                    player.takeDamage(this.damage, effects);
                }
                if (typeof Bullet !== 'undefined') {
                    for (let k = 0; k < 4; k++) {
                        const a = (k / 4) * Math.PI * 2 + 0.4;
                        bullets.push(new Bullet({
                            x: m.x, y: m.y, vx: Math.cos(a) * 7.8, vy: Math.sin(a) * 7.8,
                            damage: Math.max(12, Math.round(this.damage * 0.52)),
                            speed: 7.8, radius: 8, type: 'magma_shard', isEnemy: true, range: 260
                        }));
                    }
                }
                this._mortars.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        if (typeof InfernoArtilleryRenderer !== 'undefined') InfernoArtilleryRenderer.draw(ctx, this);
    }
}

if (typeof window !== 'undefined') window.InfernoArtillery = InfernoArtillery;
if (typeof module !== 'undefined' && module.exports) module.exports = { InfernoArtillery };
