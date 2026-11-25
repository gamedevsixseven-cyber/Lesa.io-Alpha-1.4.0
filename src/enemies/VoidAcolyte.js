/**
 * Lesa.io - Endless Hard Exclusive Enemy: "Void Acolyte"
 * Phase-blinking sorcerer that places predicted Abyssal Rift vortex traps
 * and fires twin Void Orbs from mid-range.
 */

class VoidAcolyte extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'void_acolyte', waveMultiplier);
        this.name = 'Void Acolyte';
        this.radius = 25;
        this.hudOffsetY = 44;
        this.maxHp = Math.round(185 * waveMultiplier);
        this.hp = this.maxHp;
        this.speed = 2.7;
        this.damage = Math.round(24 * (1 + Math.max(0, waveMultiplier - 1) * 0.45));
        this.color = '#a855f7';
        this.xpDrop = 75;
        this.scoreValue = 420;

        this.boltCooldown = 85 + Math.random() * 45;
        this.riftCooldown = 140 + Math.random() * 70;
        this.riftWindup = 0;
        this.blinkCooldown = 110;
        this._rifts = [];
        this._blinkGhost = null;
        this.strafeDir = Math.random() < 0.5 ? 1 : -1;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (this._blinkGhost) {
            this._blinkGhost.life -= dt;
            if (this._blinkGhost.life <= 0) this._blinkGhost = null;
        }
        this._tickRifts(dt, player, effects);

        if (this.updateBubbleTrap(dt, effects) || this.updateStun(dt, effects)) {
            this.riftWindup = 0;
            return;
        }
        if (this.updateFear(dt, player, effects)) { this.applyArenaBounds(arena); return; }
        if (!player || player.hp <= 0) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);

        if (this.boltCooldown > 0) this.boltCooldown -= dt;
        if (this.riftCooldown > 0) this.riftCooldown -= dt;
        if (this.blinkCooldown > 0) this.blinkCooldown -= dt;

        // 1. Blink Step Escape when rushed close (< 155px)
        if (dist < 155 && this.blinkCooldown <= 0) {
            this.blinkCooldown = 230;
            this._blinkGhost = { x: this.x, y: this.y, life: 20 };
            if (effects) {
                effects.addShockwave(this.x, this.y, 115, 'rgba(168, 85, 247, 0.86)');
                effects.addComicSplash(this.x, this.y - 34, 'VOID BLINK! 🔮', '#c084fc', 18);
            }
            const away = Math.atan2(-dy, -dx) + this.strafeDir * 0.55;
            this.x += Math.cos(away) * 210;
            this.y += Math.sin(away) * 210;
            this.applyArenaBounds(arena);
            return;
        }

        // 2. Abyssal Rift Predicted Trap Channel
        if (this.riftWindup > 0) {
            this.riftWindup -= dt;
            this.vx = 0; this.vy = 0;
            if (this.riftWindup <= 0) {
                const leadX = player.x + (player.vx || 0) * 16;
                const leadY = player.y + (player.vy || 0) * 16;
                this._rifts.push({ x: leadX, y: leadY, radius: 88, timer: 44, maxTimer: 44 });
                this.riftCooldown = 210 + Math.random() * 65;
            }
            return;
        }
        if (this.riftCooldown <= 0 && dist < 520) {
            this.riftWindup = 20;
            return;
        }

        // 3. Twin Void Orb Volley
        if (this.boltCooldown <= 0 && dist < 540 && typeof Bullet !== 'undefined') {
            this.boltCooldown = 115 + Math.random() * 40;
            for (const off of [-0.14, 0.14]) {
                const a = this.angle + off;
                bullets.push(new Bullet({
                    x: this.x + Math.cos(a) * 26, y: this.y + Math.sin(a) * 26,
                    vx: Math.cos(a) * 9.5, vy: Math.sin(a) * 9.5,
                    damage: Math.max(14, Math.round(this.damage * 0.85)),
                    speed: 9.5, radius: 9, type: 'void_orb', isEnemy: true, range: 640
                }));
            }
        }

        // Maintain tactical kite distance (270-400px)
        const spd = this.getEffectiveSpeed() * dt;
        if (dist > 400) { this.vx = (dx / dist) * spd; this.vy = (dy / dist) * spd; }
        else if (dist < 260) { this.vx = -(dx / dist) * spd * 0.9; this.vy = -(dy / dist) * spd * 0.9; }
        else {
            const sa = this.angle + this.strafeDir * Math.PI * 0.5;
            this.vx = Math.cos(sa) * spd * 0.8; this.vy = Math.sin(sa) * spd * 0.8;
        }
        this.x += this.vx; this.y += this.vy;
        this.applySeparation(enemies);
        this.applyArenaBounds(arena);
    }

    _tickRifts(dt, player, effects) {
        for (let i = this._rifts.length - 1; i >= 0; i--) {
            const r = this._rifts[i];
            r.timer -= dt;
            if (r.timer <= 0) {
                if (effects) {
                    effects.addShockwave(r.x, r.y, r.radius + 18, 'rgba(168, 85, 247, 0.92)');
                    effects.addSparks(r.x, r.y, '#c084fc', 10);
                }
                if (player && Math.hypot(player.x - r.x, player.y - r.y) <= r.radius && player.invulnerableTimer <= 0) {
                    player.takeDamage(Math.round(this.damage * 1.15), effects);
                    player.speedDebuffTimer = Math.max(player.speedDebuffTimer || 0, 42);
                }
                this._rifts.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        if (typeof HardEnemyRenderer !== 'undefined') HardEnemyRenderer.drawVoidAcolyte(ctx, this);
    }
}

if (typeof window !== 'undefined') window.VoidAcolyte = VoidAcolyte;
if (typeof module !== 'undefined' && module.exports) module.exports = { VoidAcolyte };
