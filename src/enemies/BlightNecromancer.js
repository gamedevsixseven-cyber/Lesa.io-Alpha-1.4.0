/**
 * Lesa.io - Endless Hard Exclusive Enemy: "Plague Weaver" (Wave 18+)
 * Toxic necromancer-medic casting Miasma Spore clouds that mend Hard allies
 * while punishing nearby players and lobbing Bio-Acid mutagen globs.
 */

class BlightNecromancer extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'blight_necromancer', waveMultiplier);
        this.name = 'Plague Weaver';
        this.radius = 27;
        this.hudOffsetY = 48;
        this.maxHp = Math.round(270 * waveMultiplier);
        this.hp = this.maxHp;
        this.speed = 2.55;
        this.damage = Math.round(28 * (1 + Math.max(0, waveMultiplier - 1) * 0.45));
        this.color = '#2ed573';
        this.xpDrop = 105;
        this.scoreValue = 590;

        this.globCooldown = 105 + Math.random() * 45;
        this.sporeCooldown = 175 + Math.random() * 60;
        this.sporeWindup = 0;
        this._spores = [];
        this.strafeDir = Math.random() < 0.5 ? 1 : -1;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        this._tickSpores(dt, player, enemies, effects);

        if (this.updateBubbleTrap(dt, effects) || this.updateStun(dt, effects)) {
            this.sporeWindup = 0;
            return;
        }
        if (this.updateFear(dt, player, effects)) { this.applyArenaBounds(arena); return; }
        if (!player || player.hp <= 0) return;

        const dx = player.x - this.x, dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);
        if (this.globCooldown > 0) this.globCooldown -= dt;
        if (this.sporeCooldown > 0) this.sporeCooldown -= dt;

        // 1. Deploy Miasma Spore Bloom near injured allies or mid-field
        if (this.sporeWindup > 0) {
            this.sporeWindup -= dt;
            this.vx = 0; this.vy = 0;
            if (this.sporeWindup <= 0) {
                let tx = this.x + Math.cos(this.angle) * 90, ty = this.y + Math.sin(this.angle) * 90;
                let hurt = null;
                let bestSq = 340 * 340;
                const findHurt = (ally) => {
                    if (!ally || ally === this || ally.dead || ally.hp >= ally.maxHp) return;
                    const dSq = (ally.x - this.x) * (ally.x - this.x) + (ally.y - this.y) * (ally.y - this.y);
                    if (dSq < bestSq) {
                        bestSq = dSq;
                        hurt = ally;
                    }
                };
                if (typeof SpatialHashGrid !== 'undefined' && SpatialHashGrid.forEachEnemyNear) {
                    SpatialHashGrid.forEachEnemyNear(this.x, this.y, 340, enemies, findHurt);
                } else {
                    for (let j = 0; j < enemies.length; j++) findHurt(enemies[j]);
                }
                if (hurt) { tx = hurt.x; ty = hurt.y; }
                this._spores.push({ x: tx, y: ty, radius: 98, life: 240, tickCd: 10 });
                if (effects) effects.addShockwave(tx, ty, 98, 'rgba(46, 213, 115, 0.78)');
                this.sporeCooldown = 230 + Math.random() * 60;
            }
            return;
        }
        if (this.sporeCooldown <= 0 && dist < 520 && this._spores.length < 2) {
            this.sporeWindup = 22;
            return;
        }

        // 2. Twin Corrosive Glob Volley
        if (this.globCooldown <= 0 && dist < 520 && typeof Bullet !== 'undefined') {
            this.globCooldown = 125 + Math.random() * 45;
            for (const off of [-0.15, 0.15]) {
                const a = this.angle + off;
                bullets.push(new Bullet({
                    x: this.x + Math.cos(a) * 26, y: this.y + Math.sin(a) * 26,
                    vx: Math.cos(a) * 9.8, vy: Math.sin(a) * 9.8,
                    damage: Math.max(14, Math.round(this.damage * 0.80)),
                    speed: 9.8, radius: 9, type: 'bio_acid', isEnemy: true, range: 600
                }));
            }
        }

        const spd = this.getEffectiveSpeed() * dt;
        if (dist > 370) { this.vx = (dx / dist) * spd; this.vy = (dy / dist) * spd; }
        else if (dist < 230) { this.vx = -(dx / dist) * spd * 0.9; this.vy = -(dy / dist) * spd * 0.9; }
        else {
            const sa = this.angle + this.strafeDir * Math.PI * 0.5;
            this.vx = Math.cos(sa) * spd * 0.78; this.vy = Math.sin(sa) * spd * 0.78;
        }
        this.x += this.vx; this.y += this.vy;
        this.walkCycle += 0.16 * dt;
        this.applySeparation(enemies);
        this.applyArenaBounds(arena);
    }

    _tickSpores(dt, player, enemies, effects) {
        for (let i = this._spores.length - 1; i >= 0; i--) {
            const sp = this._spores[i];
            sp.life -= dt;
            sp.tickCd -= dt;
            if (sp.tickCd <= 0) {
                sp.tickCd = 36;
                if (player && Math.hypot(player.x - sp.x, player.y - sp.y) <= sp.radius && player.invulnerableTimer <= 0) {
                    player.takeDamage(Math.max(8, Math.round(this.damage * 0.42)), effects);
                }
                const healSq = sp.radius * sp.radius;
                const healAlly = (ally) => {
                    if (!ally || ally.dead || ally.isEndlessBoss || ally.hp >= ally.maxHp) return;
                    const adx = ally.x - sp.x, ady = ally.y - sp.y;
                    if (adx * adx + ady * ady <= healSq) {
                        ally.hp = Math.min(ally.maxHp, ally.hp + Math.max(8, Math.round(ally.maxHp * 0.03)));
                    }
                };
                if (typeof SpatialHashGrid !== 'undefined' && SpatialHashGrid.forEachEnemyNear) {
                    SpatialHashGrid.forEachEnemyNear(sp.x, sp.y, sp.radius, enemies, healAlly);
                } else {
                    for (let j = 0; j < enemies.length; j++) healAlly(enemies[j]);
                }
            }
            if (sp.life <= 0) this._spores.splice(i, 1);
        }
    }

    draw(ctx) {
        if (typeof BlightNecromancerRenderer !== 'undefined') BlightNecromancerRenderer.draw(ctx, this);
    }
}

if (typeof window !== 'undefined') window.BlightNecromancer = BlightNecromancer;
if (typeof module !== 'undefined' && module.exports) module.exports = { BlightNecromancer };
