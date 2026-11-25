/**
 * Lesa.io - Endless Hard Mode W45 & W55 Mini-Bosses
 *   - StormforgeAutomaton (W45): Magnetic Fence Pylons (N/S push-pull), Returning Boomerang Saw-Discs,
 *     and Wall-Ricocheting Ion Orbs.
 *   - AbyssalLeviathan (W55): Invulnerable Burrowing Trench Surge, Criss-Crossing Tentacle Crush Lanes,
 *     and Splitting Cluster Depth-Charge Mines.
 */

class StormforgeAutomaton extends EndlessBossBase {
    constructor(x, y, waveMultiplier = 1.0, extra = {}) {
        super(x, y, 'magnetar_forgemaster', waveMultiplier, {
            name: 'Voltaire Forgemaster',
            hudLabel: extra.hudLabel || '🧲 VOLTAIRE FORGEMASTER [HARD MINI] 🧲',
            isMiniBoss: true,
            bossRank: 'insane',
            rankColor: extra.rankColor || '#38bdf8',
            crateId: extra.crateId || 'boss_crate_insane',
            radius: 48,
            baseHp: 11200,
            speed: 2.75,
            baseDmg: 56,
            xpDrop: 1480,
            scoreValue: 4400,
            goldBonus: 1180,
            xpBonus: 880
        });
        this.pylonCooldown = 145;
        this.boomerangCooldown = 105;
        this.repulseCooldown = 190;
        this._polarPylons = [];
        this.summoned = false;
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        this.updateTelegraphs(dt, player, effects);
        this._tickPolarPylons(dt, player, effects);
        if (!player || player.hp <= 0) return;

        if (this.checkEnrage(0.50, effects, '🧲 MAGNETAR OVERDRIVE! 🧲', 1.28, 'rgba(56, 189, 248, 0.96)') && !this.summoned) {
            this.summoned = true;
            if (typeof StormTempest === 'function') {
                enemies.push(new StormTempest(this.x - 105, this.y + 40, this.waveMultiplier * 0.85));
                enemies.push(new StormTempest(this.x + 105, this.y - 40, this.waveMultiplier * 0.85));
            }
        }

        const dx = player.x - this.x, dy = player.y - this.y, dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);
        if (this.pylonCooldown > 0) this.pylonCooldown -= dt;
        if (this.boomerangCooldown > 0) this.boomerangCooldown -= dt;
        if (this.repulseCooldown > 0) this.repulseCooldown -= dt;

        // 1. Deploy Paired Magnetic Stakes with High-Voltage Fence + Polarity Pull/Push
        if (this.pylonCooldown <= 0 && this._polarPylons.length < 2) {
            this.pylonCooldown = this.isEnraged ? 145 : 185;
            const perp = this.angle + Math.PI * 0.5 + (Math.random() - 0.5) * 0.6;
            const halfSpan = 165;
            this._polarPylons.push({
                stakes: [
                    { x: player.x + Math.cos(perp) * halfSpan, y: player.y + Math.sin(perp) * halfSpan },
                    { x: player.x - Math.cos(perp) * halfSpan, y: player.y - Math.sin(perp) * halfSpan }
                ],
                warnTimer: 44,
                activeTimer: 190
            });
            if (effects) effects.addSparks(player.x, player.y, '#00f5ff', 8);
        }

        // 2. Triple Returning Boomerang Magnet Saw-Discs
        if (this.boomerangCooldown <= 0 && typeof Bullet !== 'undefined') {
            this.boomerangCooldown = this.isEnraged ? 82 : 112;
            const offsets = this.isEnraged ? [-0.36, -0.12, 0.12, 0.36] : [-0.28, 0, 0.28];
            for (const off of offsets) {
                const a = this.angle + off;
                const spd = 12.6;
                const saw = new Bullet({
                    x: this.x + Math.cos(a) * (this.radius + 10),
                    y: this.y + Math.sin(a) * (this.radius + 10),
                    vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
                    damage: Math.round(this.damage * 0.85), speed: spd, radius: 13,
                    type: 'kolossos_saw', isEnemy: true, range: 1700, shooter: this
                });
                saw.isBoomerang = true;
                saw.originX = this.x;
                saw.originY = this.y;
                bullets.push(saw);
            }
        }

        // 3. Polarity Repulse Ring + Wall-Ricocheting Ion Orbs
        if (this.repulseCooldown <= 0 && typeof Bullet !== 'undefined') {
            this.repulseCooldown = this.isEnraged ? 140 : 185;
            if (effects) effects.addShockwave(this.x, this.y, 240, 'rgba(0, 245, 255, 0.92)');
            if (dist < 245 && player.invulnerableTimer <= 0) {
                player.x += (dx / dist) * 65;
                player.y += (dy / dist) * 65;
                player.takeDamage(Math.round(this.damage * 0.92), effects);
            }
            const count = this.isEnraged ? 10 : 6;
            for (let k = 0; k < count; k++) {
                const a = (k / count) * Math.PI * 2 + this.age * 0.04;
                bullets.push(new Bullet({
                    x: this.x + Math.cos(a) * (this.radius + 8),
                    y: this.y + Math.sin(a) * (this.radius + 8),
                    vx: Math.cos(a) * 9.8, vy: Math.sin(a) * 9.8,
                    damage: Math.round(this.damage * 0.78), speed: 9.8, radius: 10,
                    type: 'tempest_bolt', isEnemy: true, maxBounces: 2, range: 1400
                }));
            }
        }
        this.moveTowards(dt, dx, dy, dist, 240, arena);
    }

    _tickPolarPylons(dt, player, effects) {
        for (let i = this._polarPylons.length - 1; i >= 0; i--) {
            const pair = this._polarPylons[i];
            if (pair.warnTimer > 0) {
                pair.warnTimer -= dt;
                if (pair.warnTimer <= 0 && effects) {
                    effects.addLightningChain(pair.stakes[0].x, pair.stakes[0].y, pair.stakes[1].x, pair.stakes[1].y, '#00f5ff');
                }
            } else {
                pair.activeTimer -= dt;
                if (player && player.hp > 0) {
                    const [a, b] = pair.stakes;
                    // Gentle magnetic attraction toward N-Pole & repulsion away from S-Pole
                    const ndx = a.x - player.x, ndy = a.y - player.y, nd = Math.hypot(ndx, ndy) || 1;
                    if (nd > 22 && nd < 280) { player.x += (ndx / nd) * 1.15 * dt; player.y += (ndy / nd) * 1.15 * dt; }
                    // Finite segment collision check along Arc Fence Laser
                    const vx = b.x - a.x, vy = b.y - a.y, lenSq = vx * vx + vy * vy || 1;
                    const u = Math.max(0, Math.min(1, ((player.x - a.x) * vx + (player.y - a.y) * vy) / lenSq));
                    const d = Math.hypot(player.x - (a.x + vx * u), player.y - (a.y + vy * u));
                    if (d <= 20 && player.invulnerableTimer <= 0) {
                        player.takeDamage(Math.round(this.damage * 0.85), effects);
                    }
                }
                if (pair.activeTimer <= 0) this._polarPylons.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        if (typeof HardW45_55MiniRenderers !== 'undefined') HardW45_55MiniRenderers.drawMagnetarForgemaster(ctx, this);
    }
}

class AbyssalLeviathan extends EndlessBossBase {
    constructor(x, y, waveMultiplier = 1.0, extra = {}) {
        super(x, y, 'abyssal_leviathan', waveMultiplier, {
            name: 'Nautilor Leviathan',
            hudLabel: extra.hudLabel || '🐙 NAUTILOR LEVIATHAN [HARD MINI] 🐙',
            isMiniBoss: true,
            bossRank: 'insane',
            rankColor: extra.rankColor || '#00d2d3',
            crateId: extra.crateId || 'boss_crate_insane',
            radius: 50,
            baseHp: 14800,
            speed: 2.95,
            baseDmg: 62,
            xpDrop: 1850,
            scoreValue: 5600,
            goldBonus: 1450,
            xpBonus: 1120
        });
        this.laneCooldown = 118;
        this.mineCooldown = 152;
        this.submergeCooldown = 215;
        this.submergeTimer = 0;
        this.surgeAngle = 0;
        this._tentacleLanes = [];
        this._depthCharges = [];
        this.summoned = false;
    }

    takeDamage(amount, effects = null, fromCrit = null, playSound = true) {
        if (this.submergeTimer > 0) {
            if (effects && Math.random() < 0.45) effects.addSparks(this.x, this.y, '#00f5ff', 3);
            return false;
        }
        return super.takeDamage(amount, effects, fromCrit, playSound);
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        this.updateTelegraphs(dt, player, effects);
        this._tickTentacleLanes(dt, player, effects);
        this._tickDepthCharges(dt, player, bullets, effects);
        if (!player || player.hp <= 0) return;

        if (this.checkEnrage(0.50, effects, '🐙 ABYSSAL TRENCH AWAKENING! 🐙', 1.30, 'rgba(0, 210, 211, 0.96)') && !this.summoned) {
            this.summoned = true;
            if (typeof BioAlchemist === 'function') enemies.push(new BioAlchemist(this.x - 115, this.y + 35, this.waveMultiplier * 0.85));
            if (typeof EclipseHarbinger === 'function') enemies.push(new EclipseHarbinger(this.x + 115, this.y - 35, this.waveMultiplier * 0.85));
        }

        const dx = player.x - this.x, dy = player.y - this.y, dist = Math.hypot(dx, dy) || 1;
        // 1. Invulnerable Burrowing Trench Surge -> Erupts with Bouncing Pearl Ring
        if (this.submergeTimer > 0) {
            this.submergeTimer -= dt;
            this.isAirborne = true;
            this.isAirborneImmune = true;
            this.surgeAngle = Math.atan2(dy, dx);
            const spd = (this.isEnraged ? 11.2 : 9.4) * dt;
            this.x += Math.cos(this.surgeAngle) * spd;
            this.y += Math.sin(this.surgeAngle) * spd;
            this.applyArenaBounds(arena);
            if (this.submergeTimer <= 0) {
                this.isAirborne = false;
                this.isAirborneImmune = false;
                if (effects) {
                    effects.addShockwave(this.x, this.y, 195, 'rgba(0, 245, 255, 0.95)');
                    effects.addComicSplash(this.x, this.y - 52, '🌊 TRENCH ERUPTION! 🌊', '#00f5ff');
                }
                if (Math.hypot(player.x - this.x, player.y - this.y) <= 180 && player.invulnerableTimer <= 0) {
                    player.takeDamage(Math.round(this.damage * 1.18), effects);
                }
                if (typeof Bullet !== 'undefined') {
                    const count = this.isEnraged ? 10 : 7;
                    for (let k = 0; k < count; k++) {
                        const a = (k / count) * Math.PI * 2;
                        bullets.push(new Bullet({
                            x: this.x + Math.cos(a) * 28, y: this.y + Math.sin(a) * 28,
                            vx: Math.cos(a) * 9.5, vy: Math.sin(a) * 9.5,
                            damage: Math.round(this.damage * 0.78), speed: 9.5, radius: 10,
                            type: 'boreas_icicle_shard', isEnemy: true, maxBounces: 1, range: 1100
                        }));
                    }
                }
            }
            return;
        }

        this.angle = Math.atan2(dy, dx);
        if (this.laneCooldown > 0) this.laneCooldown -= dt;
        if (this.mineCooldown > 0) this.mineCooldown -= dt;
        if (this.submergeCooldown > 0) this.submergeCooldown -= dt;

        // 2. Serrated Parallel/Criss-Crossing Tentacle Crush Lanes
        if (this.laneCooldown <= 0) {
            this.laneCooldown = this.isEnraged ? 96 : 126;
            const laneCount = this.isEnraged ? 4 : 3;
            const baseA = this.angle + (Math.random() - 0.5) * 0.4;
            const perpX = Math.cos(baseA + Math.PI * 0.5), perpY = Math.sin(baseA + Math.PI * 0.5);
            for (let i = 0; i < laneCount; i++) {
                const shift = (i - (laneCount - 1) * 0.5) * 98;
                const cx = player.x + perpX * shift, cy = player.y + perpY * shift;
                this._tentacleLanes.push({
                    ax: cx - Math.cos(baseA) * 185, ay: cy - Math.sin(baseA) * 185,
                    ang: baseA, len: 370, hw: 24, warnTimer: 44, slamTimer: 16, hit: false
                });
            }
        }

        // 3. Drifting Coral Cluster Depth-Charge Mines
        if (this.mineCooldown <= 0) {
            this.mineCooldown = this.isEnraged ? 115 : 155;
            for (const spread of [-0.36, 0.36]) {
                const a = this.angle + spread;
                this._depthCharges.push({
                    x: this.x + Math.cos(a) * (this.radius + 14),
                    y: this.y + Math.sin(a) * (this.radius + 14),
                    vx: Math.cos(a) * 4.4, vy: Math.sin(a) * 4.4,
                    blastRadius: 112, timer: 64, maxTimer: 64
                });
            }
        }

        // 4. Dive into Trench Surge
        if (this.submergeCooldown <= 0 && dist < 520) {
            this.submergeCooldown = this.isEnraged ? 165 : 220;
            this.submergeTimer = 42;
            if (effects) effects.addShockwave(this.x, this.y, 130, 'rgba(0, 210, 211, 0.9)');
            return;
        }
        this.moveTowards(dt, dx, dy, dist, 235, arena);
    }

    _tickTentacleLanes(dt, player, effects) {
        for (let i = this._tentacleLanes.length - 1; i >= 0; i--) {
            const ln = this._tentacleLanes[i];
            if (ln.warnTimer > 0) ln.warnTimer -= dt;
            else {
                ln.slamTimer -= dt;
                if (!ln.hit && player && player.invulnerableTimer <= 0) {
                    const bx = ln.ax + Math.cos(ln.ang) * ln.len, by = ln.ay + Math.sin(ln.ang) * ln.len;
                    const vx = bx - ln.ax, vy = by - ln.ay, lenSq = vx * vx + vy * vy || 1;
                    const u = Math.max(0, Math.min(1, ((player.x - ln.ax) * vx + (player.y - ln.ay) * vy) / lenSq));
                    const d = Math.hypot(player.x - (ln.ax + vx * u), player.y - (ln.ay + vy * u));
                    if (d <= ln.hw + (player.radius || 18) * 0.5) {
                        ln.hit = true;
                        player.takeDamage(Math.round(this.damage * 1.12), effects);
                    }
                }
                if (ln.slamTimer <= 0) this._tentacleLanes.splice(i, 1);
            }
        }
    }

    _tickDepthCharges(dt, player, bullets, effects) {
        for (let i = this._depthCharges.length - 1; i >= 0; i--) {
            const dc = this._depthCharges[i];
            dc.timer -= dt;
            if (player) {
                const dx = player.x - dc.x, dy = player.y - dc.y, d = Math.hypot(dx, dy) || 1;
                dc.vx += (dx / d) * 0.14 * dt; dc.vy += (dy / d) * 0.14 * dt;
            }
            dc.x += dc.vx * dt; dc.y += dc.vy * dt;
            const near = player && Math.hypot(player.x - dc.x, player.y - dc.y) <= 52;
            if (dc.timer <= 0 || near) {
                if (effects) effects.addShockwave(dc.x, dc.y, dc.blastRadius, 'rgba(255, 71, 87, 0.92)');
                if (player && player.invulnerableTimer <= 0 && Math.hypot(player.x - dc.x, player.y - dc.y) <= dc.blastRadius) {
                    player.takeDamage(Math.round(this.damage * 1.05), effects);
                }
                if (typeof Bullet !== 'undefined') {
                    for (let k = 0; k < 6; k++) {
                        const a = (k / 6) * Math.PI * 2 + this.age * 0.05;
                        bullets.push(new Bullet({
                            x: dc.x, y: dc.y, vx: Math.cos(a) * 9.8, vy: Math.sin(a) * 9.8,
                            damage: Math.round(this.damage * 0.72), speed: 9.8, radius: 10,
                            type: 'bio_acid', isEnemy: true, range: 640
                        }));
                    }
                }
                this._depthCharges.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        if (typeof HardW45_55MiniRenderers !== 'undefined') HardW45_55MiniRenderers.drawAbyssalLeviathan(ctx, this);
    }
}

if (typeof window !== 'undefined') {
    window.StormforgeAutomaton = StormforgeAutomaton;
    window.AbyssalLeviathan = AbyssalLeviathan;
}
if (typeof module !== 'undefined' && module.exports) module.exports = { StormforgeAutomaton, AbyssalLeviathan };
