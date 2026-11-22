/**
 * Lesa.io - Kolossos MK-I Helios Trooper
 * Armored miniature robot troops modeled after Kolossos MK-IV,
 * deployed below 75% HP to flank the player and lay down suppressive plasma fire.
 */

class KolossosTrooper extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0, owner = null, slotIndex = 0) {
        super(x, y, 'kolossos_trooper', waveMultiplier);
        this.name = 'Helios Trooper';
        this.radius = 23;
        this.ownedByBoss = owner;
        this.slotIndex = owner ? slotIndex : Math.floor(Math.random() * 12);
        this.color = '#cd6133';

        const hasOwner = !!(owner && owner.maxHp);
        const softDmgScale = 1.0 + Math.max(0, waveMultiplier - 1.0) * 0.35;
        this.maxHp = hasOwner
            ? Math.max(700, Math.round(owner.maxHp * 0.048))
            : Math.round(390 * Math.max(1.0, waveMultiplier));
        this.hp = this.maxHp;
        this.baseSpeed = 3.15;
        this.speed = this.baseSpeed;
        this.damage = (owner && owner.damage)
            ? Math.round(owner.damage * 0.46)
            : Math.round(32 * softDmgScale);
        this.xpDrop = hasOwner ? 260 : 95;
        this.scoreValue = 420;
        this.fireCooldown = owner ? (44 + (this.slotIndex % 3) * 18) : (48 + Math.random() * 55);
        this.strafeDir = this.slotIndex % 2 === 0 ? 1 : -1;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;

        if (this.ownedByBoss && (this.ownedByBoss.dead || this.ownedByBoss.isDying)) {
            this.dead = true;
            if (effects) {
                effects.addShockwave(this.x, this.y, 70, 'rgba(255, 71, 87, 0.85)');
                effects.addSparks(this.x, this.y, '#ff9f43', 8);
            }
            return;
        }

        if (!player || player.hp <= 0) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);

        if (!(this.stunTimer > 0) && !(this.bubbleTrappedTimer > 0) && !(this._chronoStasisTimer > 0)) {
            const effSpeed = typeof this.getEffectiveSpeed === 'function' ? this.getEffectiveSpeed() : this.speed;
            const strafe = Math.sin(this.age * 0.055 + this.slotIndex * 1.9) * this.strafeDir * 0.52;
            if (dist > 175) {
                this.vx = ((dx / dist) - (dy / dist) * strafe) * effSpeed;
                this.vy = ((dy / dist) + (dx / dist) * strafe) * effSpeed;
            } else {
                this.vx = (-dy / dist) * this.strafeDir * effSpeed * 0.85;
                this.vy = (dx / dist) * this.strafeDir * effSpeed * 0.85;
            }
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.walkCycle = (this.walkCycle || 0) + 0.16 * dt;
            if (typeof this.applySeparation === 'function') this.applySeparation(enemies);
        } else {
            this.vx = 0;
            this.vy = 0;
        }
        this.applyArenaBounds(arena);

        if (this.fireCooldown > 0) this.fireCooldown -= dt;
        if (this.fireCooldown <= 0 && dist < 760 && typeof Bullet !== 'undefined') {
            const bossEnr = !!(this.ownedByBoss && this.ownedByBoss.isEnraged);
            this.fireCooldown = bossEnr ? 68 : 88;
            const bSpd = bossEnr ? 11.4 : 10.4;
            bullets.push(new Bullet({
                x: this.x + Math.cos(this.angle) * (this.radius + 6),
                y: this.y + Math.sin(this.angle) * (this.radius + 6),
                vx: Math.cos(this.angle) * bSpd,
                vy: Math.sin(this.angle) * bSpd,
                damage: this.damage,
                speed: bSpd,
                radius: 8.5,
                type: 'kolossos_plasma',
                isEnemy: true,
                range: 780
            }));
            if (effects) effects.addSparks(this.x + Math.cos(this.angle) * 20, this.y + Math.sin(this.angle) * 20, '#ff9f43', 4);
        }
    }

    draw(ctx) {
        const flash = this.hitFlash > 0;
        const r = this.radius;
        const facingLeft = Math.cos(this.angle) < 0;
        const bob = Math.sin(this.walkCycle || this.age * 0.15) * 1.8;
        const stride = Math.sin(this.walkCycle || this.age * 0.15) * (r * 0.24);
        const outline = '#141418';

        ctx.save();
        ctx.translate(this.x, this.y);

        // Ground shadow & crimson mini-reactor ring
        ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
        ctx.beginPath();
        ctx.ellipse(0, r * 0.92, r * 0.88, r * 0.34, 0, 0, Math.PI * 2);
        ctx.fill();

        if (!flash) {
            ctx.strokeStyle = 'rgba(255, 71, 87, 0.55)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(0, r * 0.88, r * 1.02, r * 0.36, 0, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.translate(0, bob);
        ctx.save();
        if (facingLeft) ctx.scale(-1, 1);

        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = outline;
        ctx.lineWidth = 2.4;

        // 1. Mini Piston Boots
        ctx.fillStyle = flash ? '#ffffff' : '#9c5a25';
        ctx.beginPath();
        ctx.roundRect(-r * 0.56, r * 0.32 + stride, r * 0.40, r * 0.48, 4);
        ctx.roundRect(r * 0.16, r * 0.32 - stride, r * 0.40, r * 0.48, 4);
        ctx.fill();
        ctx.stroke();

        // 2. Bronze & Obsidian Mini Chassis Chestplate
        ctx.fillStyle = flash ? '#ffffff' : '#2f3542';
        ctx.beginPath();
        ctx.roundRect(-r * 0.72, -r * 0.42, r * 1.44, r * 0.88, 6);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#cd6133';
            ctx.beginPath();
            ctx.roundRect(-r * 0.58, -r * 0.34, r * 1.16, r * 0.70, 4);
            ctx.fill();
            ctx.stroke();

            // Chest Reactor Eye
            ctx.fillStyle = '#ff2e4c';
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.24, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fed330';
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.11, 0, Math.PI * 2);
            ctx.fill();
        }

        // 3. Obsidian Visor Helmet + 3-Spiked Mini Helios Crown
        ctx.fillStyle = flash ? '#ffffff' : '#1e272e';
        ctx.beginPath();
        ctx.roundRect(-r * 0.48, -r * 0.94, r * 0.96, r * 0.58, 5);
        ctx.fill();
        ctx.stroke();

        if (!flash) {
            ctx.fillStyle = '#ff2e4c';
            ctx.fillRect(-r * 0.28, -r * 0.72, r * 0.64, r * 0.16);
            ctx.fillStyle = '#fed330';
            for (let s = -1; s <= 1; s++) {
                const sx = s * r * 0.28;
                const sh = s === 0 ? r * 0.42 : r * 0.30;
                ctx.beginPath();
                ctx.moveTo(sx - r * 0.11, -r * 0.94);
                ctx.lineTo(sx, -r * 0.94 - sh);
                ctx.lineTo(sx + r * 0.11, -r * 0.94);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        }
        ctx.restore();

        // 4. Aimed Mini Siege Plasma Blaster
        ctx.save();
        ctx.rotate(this.angle);
        ctx.fillStyle = flash ? '#ffffff' : '#d4893b';
        ctx.strokeStyle = outline;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.roundRect(r * 0.32, -4.5, r * 0.78, 9, 3);
        ctx.fill();
        ctx.stroke();
        if (!flash) {
            ctx.fillStyle = '#ff2e4c';
            ctx.beginPath();
            ctx.arc(r * 1.08, 0, 3.2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // 5. Compact Health Bar when damaged
        if (this.hp < this.maxHp) {
            const bw = 38;
            const ratio = Math.max(0, Math.min(1, this.hp / this.maxHp));
            ctx.fillStyle = '#1e272e';
            ctx.fillRect(-bw * 0.5, -r * 1.65, bw, 5);
            ctx.fillStyle = '#ff9f43';
            ctx.fillRect(-bw * 0.5, -r * 1.65, bw * ratio, 5);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 1.4;
            ctx.strokeRect(-bw * 0.5, -r * 1.65, bw, 5);
        }

        ctx.restore();
    }
}

if (typeof window !== 'undefined') {
    window.KolossosTrooper = KolossosTrooper;
}
