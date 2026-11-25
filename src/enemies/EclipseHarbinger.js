/**
 * Lesa.io - Endless Hard Exclusive Enemy: "Eclipse Harbinger" (Wave 14+)
 * Apex Seraph Knight that rallies nearby allies with a haste aura and unleashes
 * sweeping Solar-Eclipse Crescent Nova fans from its Blood-Gold Glaive.
 */

class EclipseHarbinger extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'eclipse_harbinger', waveMultiplier);
        this.name = 'Eclipse Harbinger';
        this.radius = 30;
        this.hudOffsetY = 56;
        this.maxHp = Math.round(320 * waveMultiplier);
        this.hp = this.maxHp;
        this.speed = 2.65;
        this.damage = Math.round(35 * (1 + Math.max(0, waveMultiplier - 1) * 0.45));
        this.color = '#ff2e4c';
        this.xpDrop = 115;
        this.scoreValue = 680;

        this.auraRadius = 230;
        this.novaCooldown = 140 + Math.random() * 55;
        this.novaWindup = 0;
        this.novaWindupMax = 34;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;

        if (this.updateBubbleTrap(dt, effects) || this.updateStun(dt, effects)) {
            this.novaWindup = 0;
            return;
        }
        if (this.updateFear(dt, player, effects)) { this.applyArenaBounds(arena); return; }
        if (!player || player.hp <= 0) return;

        // Passive War Banner Rally: haste nearby Hard allies subtly
        const rSq = this.auraRadius * this.auraRadius;
        for (let i = 0; i < enemies.length; i++) {
            const ally = enemies[i];
            if (!ally || ally === this || ally.dead) continue;
            const adx = ally.x - this.x, ady = ally.y - this.y;
            if (adx * adx + ady * ady <= rSq) {
                ally.x += (ally.vx || 0) * 0.16;
                ally.y += (ally.vy || 0) * 0.16;
            }
        }

        const dx = player.x - this.x, dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);
        if (this.novaCooldown > 0) this.novaCooldown -= dt;

        if (this.novaWindup > 0) {
            this.novaWindup -= dt;
            this.vx = 0; this.vy = 0;
            if (this.novaWindup <= 0) {
                this._releaseEclipseNova(player, bullets, effects);
                this.novaCooldown = 185 + Math.random() * 50;
            }
            return;
        }

        if (this.novaCooldown <= 0 && dist < 340) {
            this.novaWindup = this.novaWindupMax;
            return;
        }

        const spd = this.getEffectiveSpeed() * dt;
        this.vx = (dx / dist) * spd;
        this.vy = (dy / dist) * spd;
        this.x += this.vx; this.y += this.vy;
        this.walkCycle += 0.16 * dt;
        this.applySeparation(enemies);
        this.applyArenaBounds(arena);
    }

    _releaseEclipseNova(player, bullets, effects) {
        if (effects) {
            effects.addShockwave(this.x, this.y, 180, 'rgba(255, 46, 76, 0.92)');
            effects.addComicSplash(this.x, this.y - 42, 'ECLIPSE NOVA! ⚔️', '#fed330', 18);
        }
        if (Math.hypot(player.x - this.x, player.y - this.y) <= 165 && player.invulnerableTimer <= 0) {
            player.takeDamage(Math.round(this.damage * 1.10), effects);
        }
        if (typeof Bullet !== 'undefined') {
            for (const off of [-0.42, -0.21, 0, 0.21, 0.42]) {
                const a = this.angle + off;
                bullets.push(new Bullet({
                    x: this.x + Math.cos(a) * 32, y: this.y + Math.sin(a) * 32,
                    vx: Math.cos(a) * 10.6, vy: Math.sin(a) * 10.6,
                    damage: Math.max(16, Math.round(this.damage * 0.82)),
                    speed: 10.6, radius: 11, type: 'eclipse_glaive', isEnemy: true, range: 540
                }));
            }
        }
    }

    draw(ctx) {
        if (typeof EclipseHarbingerRenderer !== 'undefined') EclipseHarbingerRenderer.draw(ctx, this);
    }
}

if (typeof window !== 'undefined') window.EclipseHarbinger = EclipseHarbinger;
if (typeof module !== 'undefined' && module.exports) module.exports = { EclipseHarbinger };
