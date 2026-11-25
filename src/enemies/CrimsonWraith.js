/**
 * Lesa.io - Endless Hard Exclusive Enemy: "Blood Wraith"
 * Spectral predator that stalks in translucent cloak, locks a razor lunge lane,
 * dashes with ghost afterimages, fires crimson slash waves, and siphons HP on hit.
 */

class CrimsonWraith extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'crimson_wraith', waveMultiplier);
        this.name = 'Blood Wraith';
        this.radius = 25;
        this.hudOffsetY = 44;
        this.maxHp = Math.round(165 * waveMultiplier);
        this.hp = this.maxHp;
        this.speed = 3.25;
        this.damage = Math.round(28 * (1 + Math.max(0, waveMultiplier - 1) * 0.45));
        this.color = '#ff2e4c';
        this.xpDrop = 85;
        this.scoreValue = 480;

        this.isCloaked = true;
        this.lungeCooldown = 100 + Math.random() * 55;
        this.lungeWindup = 0;
        this.lungeWindupMax = 26;
        this.lungeTimer = 0;
        this.lungeAngle = 0;
        this.lungeHitDealt = false;
        this._afterimages = [];
        this.strafeDir = Math.random() < 0.5 ? 1 : -1;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        for (let i = this._afterimages.length - 1; i >= 0; i--) {
            this._afterimages[i].life -= dt;
            if (this._afterimages[i].life <= 0) this._afterimages.splice(i, 1);
        }

        if (this.updateBubbleTrap(dt, effects) || this.updateStun(dt, effects)) {
            this.lungeWindup = 0;
            this.lungeTimer = 0;
            this.isCloaked = false;
            return;
        }
        if (this.updateFear(dt, player, effects)) { this.applyArenaBounds(arena); return; }
        if (!player || player.hp <= 0) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (this.lungeCooldown > 0) this.lungeCooldown -= dt;

        // 1. Razor Lunge Dash Execution
        if (this.lungeTimer > 0) {
            this.lungeTimer -= dt;
            const dSpd = 12.6 * dt;
            this.x += Math.cos(this.lungeAngle) * dSpd;
            this.y += Math.sin(this.lungeAngle) * dSpd;
            if (Math.floor(this.age) % 2 === 0 && this._afterimages.length < 8) {
                this._afterimages.push({ x: this.x, y: this.y, life: 14 });
            }
            if (!this.lungeHitDealt && Math.hypot(player.x - this.x, player.y - this.y) <= this.radius + player.radius + 14) {
                this.lungeHitDealt = true;
                if (player.invulnerableTimer <= 0) {
                    player.takeDamage(Math.round(this.damage * 1.15), effects);
                    const heal = Math.round(this.maxHp * 0.08);
                    this.hp = Math.min(this.maxHp, this.hp + heal);
                    if (effects) effects.addPopup(this.x, this.y - 34, `+${heal} 🩸`, '#ff2e4c', 18, false);
                }
            }
            this.applyArenaBounds(arena);
            if (this.lungeTimer <= 0) { this.isCloaked = true; this.lungeCooldown = 145 + Math.random() * 50; }
            return;
        }

        // 2. Windup Telegraph Lock-on
        if (this.lungeWindup > 0) {
            this.lungeWindup -= dt;
            this.vx = 0; this.vy = 0;
            this.isCloaked = false;
            if (this.lungeWindup <= 0) {
                this.lungeTimer = 18;
                this.lungeHitDealt = false;
                if (typeof Bullet !== 'undefined') {
                    bullets.push(new Bullet({
                        x: this.x + Math.cos(this.lungeAngle) * 24, y: this.y + Math.sin(this.lungeAngle) * 24,
                        vx: Math.cos(this.lungeAngle) * 11.2, vy: Math.sin(this.lungeAngle) * 11.2,
                        damage: Math.max(14, Math.round(this.damage * 0.8)),
                        speed: 11.2, radius: 13, type: 'crimson_slash', isEnemy: true, range: 480
                    }));
                }
            }
            return;
        }

        this.angle = Math.atan2(dy, dx);
        if (this.lungeCooldown <= 0 && dist < 340) {
            this.lungeWindup = this.lungeWindupMax;
            this.lungeAngle = this.angle;
            return;
        }

        // Flanking spectral weave approach
        this.isCloaked = dist > 190;
        const flank = this.angle + (dist > 220 ? this.strafeDir * 0.55 : 0);
        const spd = this.getEffectiveSpeed() * dt;
        this.vx = Math.cos(flank) * spd;
        this.vy = Math.sin(flank) * spd;
        this.x += this.vx; this.y += this.vy;
        this.applySeparation(enemies);
        this.applyArenaBounds(arena);
    }

    draw(ctx) {
        if (typeof HardEnemyRenderer !== 'undefined') HardEnemyRenderer.drawCrimsonWraith(ctx, this);
    }
}

if (typeof window !== 'undefined') window.CrimsonWraith = CrimsonWraith;
if (typeof module !== 'undefined' && module.exports) module.exports = { CrimsonWraith };
