/**
 * Lesa.io - Endless Hard Exclusive Enemy: "Obsidian Juggernaut"
 * Front-shielded volcanic brute. Absorbs frontal hits until carapace breaks
 * into Molten Frenzy; executes telegraphed Seismic Magma Line Slams.
 */

class ObsidianGolem extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'obsidian_golem', waveMultiplier);
        this.name = 'Obsidian Juggernaut';
        this.radius = 34;
        this.hudOffsetY = 58;
        this.maxHp = Math.round(310 * waveMultiplier);
        this.hp = this.maxHp;
        this.speed = 2.05;
        this.damage = Math.round(36 * (1 + Math.max(0, waveMultiplier - 1) * 0.42));
        this.color = '#ff6b35';
        this.xpDrop = 95;
        this.scoreValue = 540;

        this.frontShieldMax = Math.round(130 * waveMultiplier);
        this.frontShieldHp = this.frontShieldMax;
        this.shieldBroken = false;

        this.slamCooldown = 140 + Math.random() * 60;
        this.slamWindup = 0;
        this.slamWindupMax = 38;
        this.slamAngle = 0;
    }

    takeDamage(amount, effects = null, fromCrit = null, playSound = true) {
        let finalAmt = amount;
        const p = (typeof window !== 'undefined' && window.gameInstance) ? window.gameInstance.player : null;
        if (!this.shieldBroken && this.frontShieldHp > 0 && p) {
            const hitAngle = Math.atan2(p.y - this.y, p.x - this.x);
            let diff = Math.abs(hitAngle - this.angle);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;
            if (diff <= 1.05) {
                const blocked = Math.round(amount * 0.45);
                finalAmt = Math.max(1, amount - blocked);
                this.frontShieldHp = Math.max(0, this.frontShieldHp - blocked);
                if (effects) effects.addSparks(this.x + Math.cos(this.angle) * 28, this.y + Math.sin(this.angle) * 28, '#fed330', 4);
                if (this.frontShieldHp <= 0) {
                    this.shieldBroken = true;
                    this.speed *= 1.28;
                    if (effects) {
                        effects.addShockwave(this.x, this.y, 110, 'rgba(255, 107, 53, 0.92)');
                        effects.addComicSplash(this.x, this.y - 44, 'ARMOR SHATTERED! 💥', '#fed330', 20, true);
                    }
                }
            }
        }
        return super.takeDamage(finalAmt, effects, fromCrit, playSound);
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;

        if (this.updateBubbleTrap(dt, effects) || this.updateStun(dt, effects)) {
            this.slamWindup = 0;
            return;
        }
        if (this.updateFear(dt, player, effects)) { this.applyArenaBounds(arena); return; }
        if (!player || player.hp <= 0) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        if (this.slamWindup <= 0) this.angle = Math.atan2(dy, dx);
        if (this.slamCooldown > 0) this.slamCooldown -= dt;

        if (this.slamWindup > 0) {
            this.slamWindup -= dt;
            this.vx = 0; this.vy = 0;
            if (this.slamWindup <= 0) {
                this._executeMagmaLineSlam(player, bullets, effects);
                this.slamCooldown = this.shieldBroken ? 145 : 195;
            }
            return;
        }

        if (this.slamCooldown <= 0 && dist < 310) {
            this.slamWindup = this.slamWindupMax;
            this.slamAngle = this.angle;
            return;
        }

        const spd = this.getEffectiveSpeed() * dt;
        this.vx = (dx / dist) * spd;
        this.vy = (dy / dist) * spd;
        this.x += this.vx; this.y += this.vy;
        this.walkCycle += (this.shieldBroken ? 0.22 : 0.14) * dt;
        this.applySeparation(enemies);
        this.applyArenaBounds(arena);
    }

    _executeMagmaLineSlam(player, bullets, effects) {
        const a = this.slamAngle;
        for (let k = 1; k <= 3; k++) {
            const hx = this.x + Math.cos(a) * (k * 95);
            const hy = this.y + Math.sin(a) * (k * 95);
            if (effects) effects.addShockwave(hx, hy, 82, 'rgba(255, 107, 53, 0.92)');
            if (Math.hypot(player.x - hx, player.y - hy) <= 72 && player.invulnerableTimer <= 0) {
                player.takeDamage(Math.round(this.damage * 0.95), effects);
            }
        }
        if (typeof Bullet !== 'undefined') {
            for (const off of [-0.22, 0, 0.22]) {
                const ang = a + off;
                bullets.push(new Bullet({
                    x: this.x + Math.cos(ang) * 30, y: this.y + Math.sin(ang) * 30,
                    vx: Math.cos(ang) * 8.6, vy: Math.sin(ang) * 8.6,
                    damage: Math.max(15, Math.round(this.damage * 0.78)),
                    speed: 8.6, radius: 10, type: 'magma_shard', isEnemy: true, range: 520
                }));
            }
        }
        if (effects) effects.addComicSplash(this.x, this.y - 42, 'MAGMA FISSURE! 🌋', '#ff6b35', 18);
    }

    draw(ctx) {
        if (typeof HardEnemyRenderer !== 'undefined') HardEnemyRenderer.drawObsidianGolem(ctx, this);
    }
}

if (typeof window !== 'undefined') window.ObsidianGolem = ObsidianGolem;
if (typeof module !== 'undefined' && module.exports) module.exports = { ObsidianGolem };
