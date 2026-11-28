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
        this.strafeDir = Math.random() < 0.5 ? 1 : -1;
        this.color = '#ff4757';

        const hasOwner = !!(owner && owner.maxHp);
        const softDmgScale = 1.0 + Math.max(0, waveMultiplier - 1.0) * 0.35;
        this.maxHp = hasOwner
            ? Math.max(450, Math.round(owner.maxHp * 0.055))
            : Math.round(240 * Math.max(1.0, waveMultiplier));
        this.hp = this.maxHp;
        this.speed = 3.2;
        this.baseSpeed = this.speed;
        this.damage = (owner && owner.damage)
            ? Math.round(owner.damage * 0.52)
            : Math.round(25 * softDmgScale);
        this.xpDrop = hasOwner ? 220 : 80;
        this.scoreValue = 350;
        this.fireCooldown = owner ? (55 + orbitIndex * 30) : (45 + Math.random() * 55);
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
        } else if (!this.ownedByBoss && player && player.hp > 0 && !(this.stunTimer > 0) && !(this.bubbleTrappedTimer > 0) && !(this._chronoStasisTimer > 0)) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy) || 1;
            const effSpeed = typeof this.getEffectiveSpeed === 'function' ? this.getEffectiveSpeed() : this.speed;
            if (dist > 285) {
                this.vx = (dx / dist) * effSpeed;
                this.vy = (dy / dist) * effSpeed;
            } else if (dist < 150) {
                this.vx = -(dx / dist) * effSpeed * 0.8;
                this.vy = -(dy / dist) * effSpeed * 0.8;
            } else {
                this.vx = (-dy / dist) * this.strafeDir * effSpeed * 0.85;
                this.vy = (dx / dist) * this.strafeDir * effSpeed * 0.85;
            }
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            if (typeof this.applySeparation === 'function') this.applySeparation(enemies);
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
        const wy = this.y + Math.sin(this.age * 0.14) * 3;
        const batched = typeof EnemyBatchRenderer !== 'undefined' && EnemyBatchRenderer.active;

        if (typeof SpriteAtlasCache !== 'undefined') {
            if (!batched) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
                ctx.beginPath();
                ctx.ellipse(this.x, wy + r * 0.95, r * 0.85, r * 0.32, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            const rKey = Math.round(r * 2);
            const hullKey = `kol_d_b:${rKey}:${flash ? 1 : 0}`;
            const bw = Math.ceil(r * 2.2);
            const bh = Math.ceil(r * 2.0);
            const drawHull = () => {
                SpriteAtlasCache.drawCached(ctx, hullKey, bw, bh, Math.ceil(r * 1.0), bh * 0.5, (dctx) => {
                    dctx.fillStyle = flash ? '#ffffff' : '#2f3542';
                    dctx.strokeStyle = '#141418';
                    dctx.lineWidth = 2.6;
                    dctx.beginPath();
                    dctx.moveTo(r * 1.05, 0);
                    dctx.lineTo(r * 0.35, -r * 0.82);
                    dctx.lineTo(-r * 0.85, -r * 0.56);
                    dctx.lineTo(-r * 0.85, r * 0.56);
                    dctx.lineTo(r * 0.35, r * 0.82);
                    dctx.closePath();
                    dctx.fill();
                    dctx.stroke();

                    if (!flash) {
                        dctx.fillStyle = '#cd6133';
                        dctx.fillRect(-r * 0.35, -r * 0.42, r * 0.72, r * 0.84);
                        dctx.strokeRect(-r * 0.35, -r * 0.42, r * 0.72, r * 0.84);
                        dctx.fillStyle = '#ff2e4c';
                        dctx.beginPath();
                        dctx.arc(r * 0.25, 0, r * 0.32, 0, Math.PI * 2);
                        dctx.fill();
                        dctx.fillStyle = '#fed330';
                        dctx.beginPath();
                        dctx.arc(r * 0.32, 0, r * 0.13, 0, Math.PI * 2);
                        dctx.fill();
                    }
                });
            };
            if (typeof EndlessEnemyRenderer !== 'undefined') {
                EndlessEnemyRenderer.drawAimedLayer(ctx, this.angle, this.x, wy, drawHull, true);
            } else {
                ctx.save(); ctx.translate(this.x, wy); ctx.rotate(this.angle); drawHull(); ctx.restore();
            }

            if (!batched && this.hp < this.maxHp) {
                const bwBar = 38;
                const ratio = Math.max(0, Math.min(1, this.hp / this.maxHp));
                ctx.fillStyle = '#1e272e';
                ctx.fillRect(this.x - bwBar * 0.5, this.y - r - 12, bwBar, 5);
                ctx.fillStyle = '#ff4757';
                ctx.fillRect(this.x - bwBar * 0.5, this.y - r - 12, bwBar * ratio, 5);
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(this.x - bwBar * 0.5, this.y - r - 12, bwBar, 5);
            }
            return;
        }

        ctx.save();
        ctx.translate(this.x, wy);

        if (!batched) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.beginPath();
            ctx.ellipse(0, r * 0.95, r * 0.85, r * 0.32, 0, 0, Math.PI * 2);
            ctx.fill();
        }

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
        if (!batched && this.hp < this.maxHp) {
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
