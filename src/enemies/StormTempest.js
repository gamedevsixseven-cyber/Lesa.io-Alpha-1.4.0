/**
 * Lesa.io - Endless Hard Exclusive Enemy: "Aether Tempest" (Wave 9+)
 * Long-range Storm Sentinel casting linked lightning Conduit Nodes + Twin Tempest Bolts.
 */

class StormTempest extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'storm_tempest', waveMultiplier);
        this.name = 'Aether Tempest';
        this.radius = 28;
        this.hudOffsetY = 50;
        this.maxHp = Math.round(235 * waveMultiplier);
        this.hp = this.maxHp;
        this.speed = 2.5;
        this.damage = Math.round(27 * (1 + Math.max(0, waveMultiplier - 1) * 0.45));
        this.color = '#38bdf8';
        this.xpDrop = 95;
        this.scoreValue = 560;

        this.boltCooldown = 95 + Math.random() * 45;
        this.nodeCooldown = 165 + Math.random() * 65;
        this.nodeWindup = 0;
        this._conduits = [];
        this.strafeDir = Math.random() < 0.5 ? 1 : -1;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        this._tickConduits(dt, player, effects);

        if (this.updateBubbleTrap(dt, effects) || this.updateStun(dt, effects)) {
            this.nodeWindup = 0;
            return;
        }
        if (this.updateFear(dt, player, effects)) { this.applyArenaBounds(arena); return; }
        if (!player || player.hp <= 0) return;

        const dx = player.x - this.x, dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);
        if (this.boltCooldown > 0) this.boltCooldown -= dt;
        if (this.nodeCooldown > 0) this.nodeCooldown -= dt;

        // 1. Storm Conduit Overcharge (2 linked nodes framing player path)
        if (this.nodeWindup > 0) {
            this.nodeWindup -= dt;
            this.vx = 0; this.vy = 0;
            if (this.nodeWindup <= 0) {
                const perp = this.angle + Math.PI * 0.5;
                for (const off of [-68, 68]) {
                    this._conduits.push({
                        x: player.x + Math.cos(perp) * off,
                        y: player.y + Math.sin(perp) * off,
                        radius: 74, timer: 42, maxTimer: 42
                    });
                }
                this.nodeCooldown = 215 + Math.random() * 60;
            }
            return;
        }
        if (this.nodeCooldown <= 0 && dist < 560 && this._conduits.length === 0) {
            this.nodeWindup = 22;
            return;
        }

        // 2. Twin Tempest Bolt Volley
        if (this.boltCooldown <= 0 && dist < 580 && typeof Bullet !== 'undefined') {
            this.boltCooldown = 110 + Math.random() * 40;
            for (const off of [-0.11, 0.11]) {
                const a = this.angle + off;
                bullets.push(new Bullet({
                    x: this.x + Math.cos(a) * 28, y: this.y + Math.sin(a) * 28,
                    vx: Math.cos(a) * 11.4, vy: Math.sin(a) * 11.4,
                    damage: Math.max(15, Math.round(this.damage * 0.85)),
                    speed: 11.4, radius: 9, type: 'tempest_bolt', isEnemy: true, range: 680
                }));
            }
        }

        // Keep artillery range (320-450px)
        const spd = this.getEffectiveSpeed() * dt;
        if (dist > 450) { this.vx = (dx / dist) * spd; this.vy = (dy / dist) * spd; }
        else if (dist < 280) { this.vx = -(dx / dist) * spd * 0.9; this.vy = -(dy / dist) * spd * 0.9; }
        else {
            const sa = this.angle + this.strafeDir * Math.PI * 0.5;
            this.vx = Math.cos(sa) * spd * 0.78; this.vy = Math.sin(sa) * spd * 0.78;
        }
        this.x += this.vx; this.y += this.vy;
        this.applySeparation(enemies);
        this.applyArenaBounds(arena);
    }

    _tickConduits(dt, player, effects) {
        if (this._conduits.length === 0) return;
        let detonate = false;
        for (const n of this._conduits) {
            n.timer -= dt;
            if (n.timer <= 0) detonate = true;
        }
        if (detonate) {
            for (const n of this._conduits) {
                if (effects) {
                    effects.addShockwave(n.x, n.y, n.radius + 18, 'rgba(56, 189, 248, 0.92)');
                    effects.addSparks(n.x, n.y, '#fef08a', 9);
                }
                if (player && Math.hypot(player.x - n.x, player.y - n.y) <= n.radius && player.invulnerableTimer <= 0) {
                    player.takeDamage(Math.round(this.damage * 1.12), effects);
                }
            }
            this._conduits = [];
        }
    }

    draw(ctx) {
        if (typeof StormTempestRenderer !== 'undefined') StormTempestRenderer.draw(ctx, this);
    }
}

if (typeof window !== 'undefined') window.StormTempest = StormTempest;
if (typeof module !== 'undefined' && module.exports) module.exports = { StormTempest };
