/**
 * Lesa.io - Endless Hard Exclusive Enemy: "Glacial Marksman" (Wave 23+)
 * Extreme-range sniper pinning player movement with a tracking-then-locked laser beam
 * before firing high-velocity chilling Cryo-Rail bolts.
 */

class CryoSniper extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'cryo_sniper', waveMultiplier);
        this.name = 'Glacial Marksman';
        this.radius = 25;
        this.hudOffsetY = 46;
        this.maxHp = Math.round(175 * waveMultiplier);
        this.hp = this.maxHp;
        this.speed = 2.75;
        this.damage = Math.round(32 * (1 + Math.max(0, waveMultiplier - 1) * 0.45));
        this.color = '#38bdf8';
        this.xpDrop = 95;
        this.scoreValue = 550;

        this.aimCooldown = 115 + Math.random() * 55;
        this.aimWindup = 0;
        this.lockedAngle = 0;
        this.strafeDir = Math.random() < 0.5 ? 1 : -1;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;

        if (this.updateBubbleTrap(dt, effects) || this.updateStun(dt, effects)) {
            this.aimWindup = 0;
            return;
        }
        if (this.updateFear(dt, player, effects)) { this.applyArenaBounds(arena); return; }
        if (!player || player.hp <= 0) return;

        const dx = player.x - this.x, dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (this.aimCooldown > 0) this.aimCooldown -= dt;

        // 1. Laser Sight Lock-On Channel (50f: track 50..18, freeze trajectory 18..0, snap shot)
        if (this.aimWindup > 0) {
            this.aimWindup -= dt;
            this.vx = 0; this.vy = 0;
            if (this.aimWindup > 18) {
                this.angle = Math.atan2(dy, dx);
                this.lockedAngle = this.angle;
            } else {
                this.angle = this.lockedAngle;
            }
            if (this.aimWindup <= 0) {
                if (typeof Bullet !== 'undefined') {
                    bullets.push(new Bullet({
                        x: this.x + Math.cos(this.lockedAngle) * 34, y: this.y + Math.sin(this.lockedAngle) * 34,
                        vx: Math.cos(this.lockedAngle) * 16.5, vy: Math.sin(this.lockedAngle) * 16.5,
                        damage: this.damage, speed: 16.5, radius: 8,
                        type: 'boreas_frost_lance', isEnemy: true, range: 760
                    }));
                }
                if (effects) effects.addSparks(this.x + Math.cos(this.lockedAngle) * 32, this.y + Math.sin(this.lockedAngle) * 32, '#00f5ff', 6);
                this.aimCooldown = 140 + Math.random() * 45;
            }
            return;
        }

        this.angle = Math.atan2(dy, dx);
        if (this.aimCooldown <= 0 && dist < 660) {
            this.aimWindup = 50;
            this.lockedAngle = this.angle;
            return;
        }

        const spd = this.getEffectiveSpeed() * dt;
        if (dist > 540) { this.vx = (dx / dist) * spd; this.vy = (dy / dist) * spd; }
        else if (dist < 360) { this.vx = -(dx / dist) * spd * 1.05; this.vy = -(dy / dist) * spd * 1.05; }
        else {
            const sa = this.angle + this.strafeDir * Math.PI * 0.5;
            this.vx = Math.cos(sa) * spd * 0.85; this.vy = Math.sin(sa) * spd * 0.85;
        }
        this.x += this.vx; this.y += this.vy;
        this.walkCycle += 0.18 * dt;
        this.applySeparation(enemies);
        this.applyArenaBounds(arena);
    }

    draw(ctx) {
        if (typeof CryoSniperRenderer !== 'undefined') CryoSniperRenderer.draw(ctx, this);
    }
}

if (typeof window !== 'undefined') window.CryoSniper = CryoSniper;
if (typeof module !== 'undefined' && module.exports) module.exports = { CryoSniper };
