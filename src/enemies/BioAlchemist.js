/**
 * Lesa.io - Endgame Elite Healer Enemy: "Bio-Alchemist" (Wave 32+)
 * High-priority tactical medic that sustains lategame Endless swarms unless focused down.
 *
 * Abilities:
 * 1. Vital Healing Tether Beam: Locks onto the most injured non-boss ally (340px) and heals over time.
 * 2. Emerald Cleanse Pulse: Telegraph burst (230px) that heals allies and purifies slow/chill/drench debuffs.
 * 3. Toxic Vial Volley: 3-orb bio_acid fanning barrage keeping kiting players under pressure.
 * 4. Corrosive Smoke-Dash: Short-range knockback blast + evasive dash when rushed in melee (< 155px).
 * Counterplay: Water drench cuts tether healing in half and interrupts Cleanse channels; stun/bubble breaks tether.
 */

class BioAlchemist extends EnemyBase {
    constructor(x, y, waveMultiplier = 1.0) {
        super(x, y, 'bio_alchemist', waveMultiplier);
        this.name = 'Bio-Alchemist';
        this.radius = 28;
        const softDmg = 1.0 + Math.max(0, waveMultiplier - 1.0) * 0.35;
        this.maxHp = Math.round(420 * Math.max(1.0, waveMultiplier));
        this.hp = this.maxHp;
        this.speed = 2.85;
        this.baseSpeed = 2.85;
        this.damage = Math.round(31 * softDmg);
        this.color = '#10ac84';
        this.xpDrop = 115;
        this.scoreValue = 520;

        this.tetherRange = 340;
        this.tetherTick = 0;
        this._tetherTarget = null;

        this.cleanseRadius = 230;
        this.cleanseCooldown = 140 + Math.random() * 60;
        this.cleanseWindup = 0;
        this.cleanseWindupMax = 28;

        this.volleyCooldown = 95 + Math.random() * 45;
        this.escapeCooldown = 160;
        this.dashTimer = 0;
        this.dashAngle = 0;
        this.strafeDir = Math.random() < 0.5 ? 1 : -1;
    }

    _pickTetherTarget(enemies) {
        let best = null;
        let bestRatio = 1.01;
        const rSq = this.tetherRange * this.tetherRange;

        for (let i = 0; i < enemies.length; i++) {
            const ally = enemies[i];
            if (!ally || ally === this || ally.dead || ally.isDying || ally.isBoss || ally.isMiniBoss || ally.isEndlessBoss) continue;
            const dx = ally.x - this.x;
            const dy = ally.y - this.y;
            if (dx * dx + dy * dy > rSq) continue;

            const ratio = ally.maxHp > 0 ? (ally.hp / ally.maxHp) : 1;
            if (ratio < 0.99 && ratio < bestRatio) {
                bestRatio = ratio;
                best = ally;
            }
        }
        return best;
    }

    _tickVitalTether(dt, enemies, effects) {
        if (this.stunTimer > 0 || this.bubbleTrappedTimer > 0 || this._chronoStasisTimer > 0) {
            this._tetherTarget = null;
            return;
        }
        const cur = this._tetherTarget;
        const curValid = cur && !cur.dead && !cur.isDying && cur.hp < cur.maxHp &&
            Math.hypot(cur.x - this.x, cur.y - this.y) <= this.tetherRange;
        if (!curValid) this._tetherTarget = this._pickTetherTarget(enemies);
        if (!this._tetherTarget) return;

        this.tetherTick += dt;
        if (this.tetherTick >= 24) {
            this.tetherTick = 0;
            const drenchPenalty = this.waterDrenchedTimer > 0 ? 0.5 : 1.0;
            const healAmt = Math.max(12, Math.round(this._tetherTarget.maxHp * 0.032 * drenchPenalty));
            const actual = Math.min(healAmt, Math.max(0, this._tetherTarget.maxHp - this._tetherTarget.hp));
            if (actual > 0) {
                this._tetherTarget.hp += actual;
                if (effects) {
                    effects.addPopup(this._tetherTarget.x, this._tetherTarget.y - (this._tetherTarget.radius || 22), `+${actual} 💚`, '#2ed573', 18, false);
                    effects.addSparks(this._tetherTarget.x, this._tetherTarget.y, '#2ed573', 4);
                }
            }
        }
    }

    _triggerCleansePulse(enemies, effects) {
        const radSq = this.cleanseRadius * this.cleanseRadius;
        let affected = 0;
        for (let i = 0; i < enemies.length; i++) {
            const ally = enemies[i];
            if (!ally || ally.dead || ally.isDying || ally.isBoss || ally.isMiniBoss || ally.isEndlessBoss) continue;
            const dx = ally.x - this.x;
            const dy = ally.y - this.y;
            if (dx * dx + dy * dy > radSq) continue;

            const pct = ally === this ? 0.04 : 0.065;
            const healAmt = Math.max(15, Math.round(ally.maxHp * pct));
            const before = ally.hp;
            ally.hp = Math.min(ally.maxHp, ally.hp + healAmt);

            // Purify slow & drench debuffs on allies (not stuns/bubble stasis)
            if (ally !== this) {
                ally.iceSlowTimer = 0; ally.iceSlowMultiplier = 1.0;
                ally.sonicSlowTimer = 0; ally.sonicSlowMultiplier = 1.0;
                ally.chronoSlowTimer = 0; ally.chronoSlowMultiplier = 1.0;
                ally.waterDrenchedTimer = 0; ally.waterSlowMultiplier = 1.0;
            }
            if (ally.hp > before) affected++;
        }
        if (effects) {
            effects.addShockwave(this.x, this.y, this.cleanseRadius, 'rgba(46, 213, 115, 0.9)');
            effects.addComicSplash(this.x, this.y - 42, affected > 0 ? 'CLEANSE PULSE! 💚' : 'PURIFY! 🧪', '#2ed573', 20, true);
        }
    }

    _fireAcidVolley(bullets, effects) {
        if (typeof Bullet === 'undefined') return;
        const spd = 10.6;
        const dmg = Math.max(12, Math.round(this.damage * 0.72));
        for (const offset of [-0.18, 0, 0.18]) {
            const a = this.angle + offset;
            bullets.push(new Bullet({
                x: this.x + Math.cos(a) * (this.radius + 8),
                y: this.y + Math.sin(a) * (this.radius + 8),
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                damage: dmg,
                speed: spd,
                radius: 9,
                type: 'bio_acid',
                isEnemy: true,
                range: 590
            }));
        }
        if (effects) effects.addSparks(this.x + Math.cos(this.angle) * 24, this.y + Math.sin(this.angle) * 24, '#bef264', 6);
    }

    update(dt = 1, player = null, enemies = [], bullets = [], effects = null, arena = null) {
        this.age += dt;
        this.updateDebuffs(dt);
        if (this.hitFlash > 0) this.hitFlash -= dt;

        this._tickVitalTether(dt, enemies, effects);

        if (this.cleanseCooldown > 0) this.cleanseCooldown -= dt;
        if (this.volleyCooldown > 0) this.volleyCooldown -= dt;
        if (this.escapeCooldown > 0) this.escapeCooldown -= dt;

        if (this.stunTimer > 0 || this.bubbleTrappedTimer > 0 || this._chronoStasisTimer > 0) {
            this.cleanseWindup = 0;
            this.vx = 0; this.vy = 0;
            return;
        }

        if (this.cleanseWindup > 0) {
            if (this.waterDrenchedTimer > 0) {
                this.cleanseWindup = 0;
                this.cleanseCooldown = 190;
                if (effects) effects.addComicSplash(this.x, this.y - 36, 'SHORTED! 💧', '#74b9ff', 20, true);
                return;
            }
            this.cleanseWindup -= dt;
            this.vx = 0; this.vy = 0;
            if (this.cleanseWindup <= 0) {
                this._triggerCleansePulse(enemies, effects);
                this.cleanseCooldown = 250 + Math.random() * 60;
            }
            return;
        }

        if (!player || player.hp <= 0) return;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        this.angle = Math.atan2(dy, dx);

        // Smoke-dash escape if player rushes melee range
        if (this.dashTimer > 0) {
            this.dashTimer -= dt;
            const dSpd = 8.8 * dt;
            this.vx = Math.cos(this.dashAngle) * dSpd;
            this.vy = Math.sin(this.dashAngle) * dSpd;
            this.x += this.vx; this.y += this.vy;
            if (effects && Math.floor(this.age) % 3 === 0) effects.addSparks(this.x, this.y, '#2ed573', 3);
            this.applyArenaBounds(arena);
            return;
        }

        if (dist < 155 && this.escapeCooldown <= 0) {
            this.escapeCooldown = 260;
            this.dashTimer = 16;
            this.dashAngle = Math.atan2(-dy, -dx) + this.strafeDir * 0.45;
            if (dist <= 135) player.takeDamage(Math.round(this.damage * 0.75), effects);
            if (effects) {
                effects.addShockwave(this.x, this.y, 130, 'rgba(46, 213, 115, 0.85)');
                effects.addComicSplash(this.x, this.y - 34, 'TOXIC ESCAPE! 💨', '#bef264', 18);
            }
            return;
        }

        if (this.cleanseCooldown <= 0 && this.waterDrenchedTimer <= 0 && enemies.length > 1) {
            const hasAlly = enemies.some(e => e && e !== this && !e.dead && !e.isBoss && Math.hypot(e.x - this.x, e.y - this.y) <= this.cleanseRadius && (e.hp < e.maxHp || e.iceSlowTimer > 0 || e.waterDrenchedTimer > 0 || e.chronoSlowTimer > 0));
            if (hasAlly) {
                this.cleanseWindup = this.cleanseWindupMax;
                return;
            }
        }

        if (dist < 470 && this.volleyCooldown <= 0) {
            this.volleyCooldown = 135 + Math.random() * 40;
            this._fireAcidVolley(bullets, effects);
        }

        // Maintain midline medic range (230-340px)
        const spd = (typeof this.getEffectiveSpeed === 'function' ? this.getEffectiveSpeed() : this.speed) * dt;
        if (dist > 340) {
            this.vx = (dx / dist) * spd; this.vy = (dy / dist) * spd;
        } else if (dist < 210) {
            this.vx = -(dx / dist) * spd * 0.9; this.vy = -(dy / dist) * spd * 0.9;
        } else {
            const sa = this.angle + this.strafeDir * Math.PI * 0.5;
            this.vx = Math.cos(sa) * spd * 0.75; this.vy = Math.sin(sa) * spd * 0.75;
        }
        this.x += this.vx; this.y += this.vy;
        this.walkCycle += 0.20 * dt;
        this.applySeparation(enemies);
        this.applyArenaBounds(arena);
    }

    draw(ctx) {
        if (typeof EndlessEnemyRenderer !== 'undefined') EndlessEnemyRenderer.drawBioAlchemist(ctx, this);
    }
}

if (typeof window !== 'undefined') window.BioAlchemist = BioAlchemist;
if (typeof module !== 'undefined' && module.exports) module.exports = { BioAlchemist };
