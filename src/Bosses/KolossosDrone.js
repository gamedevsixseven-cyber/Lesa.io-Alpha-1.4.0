/**
 * Lesa.io - Kolossos Helios Siege Drone
 * Destructible hovering cyber-turret spawned by Kolossos MK-IV (W40 Endless Boss).
 */

class KolossosDrone extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0, owner = null, orbitIndex = 0) {
        super(x, y, 'kolossos_drone', waveMultiplier);
        this.name = 'Helios Drone';
        this.radius = 22;
        this.ownedByBoss = owner;
        this.orbitIndex = orbitIndex;
        this.orbitAngle = orbitIndex * Math.PI;
        this.orbitDist = 152;
        this.color = '#ff4757';

        const ownerMax = owner && owner.maxHp ? owner.maxHp : Math.round(24000 * Math.max(1.0, waveMultiplier));
        this.maxHp = Math.max(450, Math.round(ownerMax * 0.055));
        this.hp = this.maxHp;
        this.speed = 3.2;
        this.damage = owner && owner.damage ? Math.round(owner.damage * 0.52) : Math.round(26 * waveMultiplier * 0.35);
        this.xpDrop = 220;
        this.scoreValue = 350;
        this.fireCooldown = 55 + orbitIndex * 30;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;

        if (this.ownedByBoss && (this.ownedByBoss.dead || this.ownedByBoss.isDying)) {
            this.dead = true;
            if (effects) {
                effects.addShockwave(this.x, this.y, 75, 'rgba(255, 71, 87, 0.85)');
                effects.addSparks(this.x, this.y, '#ffa502', 8);
            }
            return;
        }

        if (this.ownedByBoss && !this.ownedByBoss.dead) {
            this.orbitAngle += (this.ownedByBoss.isEnraged ? 0.036 : 0.025) * dt;
            const tx = this.ownedByBoss.x + Math.cos(this.orbitAngle) * this.orbitDist;
            const ty = this.ownedByBoss.y + Math.sin(this.orbitAngle) * this.orbitDist;
            this.x += (tx - this.x) * Math.min(1, 0.14 * dt);
            this.y += (ty - this.y) * Math.min(1, 0.14 * dt);
        }
        this.applyArenaBounds(arena);

        if (!player || player.hp <= 0) return;
        this.angle = Math.atan2(player.y - this.y, player.x - this.x);

        if (this.fireCooldown > 0) this.fireCooldown -= dt;
        if (this.fireCooldown <= 0 && typeof Bullet !== 'undefined') {
            this.fireCooldown = (this.ownedByBoss && this.ownedByBoss.isEnraged) ? 68 : 92;
            bullets.push(new Bullet({
                x: this.x + Math.cos(this.angle) * (this.radius + 6),
                y: this.y + Math.sin(this.angle) * (this.radius + 6),
                vx: Math.cos(this.angle) * 12.2,
                vy: Math.sin(this.angle) * 12.2,
                damage: this.damage,
                speed: 12.2,
                radius: 8,
                type: 'kolossos_laser_bolt',
                isEnemy: true,
                range: 920
            }));
            if (effects) effects.addSparks(this.x, this.y, '#ff4757', 4);
        }
    }

    draw(ctx) {
        const flash = this.hitFlash > 0;
        const r = this.radius;
        ctx.save();
        ctx.translate(this.x, this.y + Math.sin(this.age * 0.14) * 3);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, r * 0.95, r * 0.85, r * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(this.angle);
        ctx.fillStyle = flash ? '#ffffff' : '#2f3542';
        ctx.strokeStyle = '#141418';
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.moveTo(r * 1.05, 0);
        ctx.lineTo(r * 0.35, -r * 0.82);
        ctx.lineTo(-r * 0.85, -r * 0.56);
        ctx.lineTo(-r * 0.85, r * 0.56);
        ctx.lineTo(r * 0.35, r * 0.82);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#cd6133';
            ctx.fillRect(-r * 0.35, -r * 0.42, r * 0.72, r * 0.84);
            ctx.strokeRect(-r * 0.35, -r * 0.42, r * 0.72, r * 0.84);
            ctx.fillStyle = '#ff2e4c';
            ctx.beginPath();
            ctx.arc(r * 0.25, 0, r * 0.32, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fed330';
            ctx.beginPath();
            ctx.arc(r * 0.32, 0, r * 0.13, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // Compact Drone Health Bar
        if (this.hp < this.maxHp) {
            const bw = 38;
            const ratio = Math.max(0, Math.min(1, this.hp / this.maxHp));
            ctx.save();
            ctx.fillStyle = '#1e272e';
            ctx.fillRect(this.x - bw * 0.5, this.y - r - 12, bw, 5);
            ctx.fillStyle = '#ff4757';
            ctx.fillRect(this.x - bw * 0.5, this.y - r - 12, bw * ratio, 5);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(this.x - bw * 0.5, this.y - r - 12, bw, 5);
            ctx.restore();
        }
    }
}

if (typeof window !== 'undefined') {
    window.KolossosDrone = KolossosDrone;
}
