/**
 * Lesa.io - Mythic Capstone Perks Combat Engine
 * Implements runtime effects and canvas visuals for the 4 Mythic Capstones:
 *  - zeus_storm_crown  (Offense: +Dmg/+Crit & Crit Sky-Bolt AoE; -25% Max HP)
 *  - immortal_ambrosia (Survival: Phoenix Revive + Sunburst Stun + Low-HP Regen; +35% Dash CD)
 *  - chronos_hourglass (Chaos: Dash/Skill Time-Rift slow & Fire Rate zone + Skill CD trim; -12% Move Speed)
 *  - midas_curse       (Economy: +Coins/XP + Gold-scaled Dmg + Bonus Elite/Boss Materials; -35% Heart Heal)
 */

const MYTHIC_ELITE_SET = new Set([
    'fatmir', 'casillas', 'skarmogyftos', 'kafeneio_tank',
    'dimotiki_enforcer', 'psaltis', 'kleanthis'
]);

class MythicPerkEffects {
    constructor() {
        this.reset();
    }

    reset() {
        this.skyBoltCooldown = 0;
        this.ambrosiaReviveCd = 0;
        this.regenFxTimer = 0;
        this.chronoField = null;
        this.skyBolts = [];
        this.reviveRings = [];
    }

    _has(perkId) {
        return typeof PerkSystem !== 'undefined' && PerkSystem.hasPerk(perkId);
    }

    _stats(perkId) {
        return (typeof PerkSystem !== 'undefined') ? (PerkSystem.getRankStats(perkId) || {}) : {};
    }

    _damageEnemy(enemy, amount, effects, game, isCrit = false) {
        if (!enemy || enemy.dead || enemy.isDying || amount <= 0) return;
        const dmg = Math.max(1, Math.round(amount));
        const killed = enemy.takeDamage(dmg, effects, isCrit, false);
        if (killed && game && typeof game.handleEnemyKill === 'function' && !enemy._mythicKillHandled) {
            enemy._mythicKillHandled = true;
            game.handleEnemyKill(enemy);
        }
    }

    /**
     * Apply persistent run stat modifiers & capstone drawbacks cleanly & idempotently.
     */
    applyPlayerStatModifiers(player, refreshBaseline = false) {
        if (!player) return;
        if (refreshBaseline || !player._mythicBase) {
            player._mythicBase = {
                maxHp: player.maxHp || 100,
                baseSpeed: player.baseSpeed || 5.0,
                damageMultiplier: player.damageMultiplier || 1.0,
                critChance: player.critChance !== undefined ? player.critChance : 0.1,
                maxDashCooldown: player.maxDashCooldown || 180
            };
        }
        const b = player._mythicBase;
        const prevMaxHp = player.maxHp || b.maxHp;
        const wasFull = (player.hp === undefined || player.hp >= prevMaxHp);

        let maxHp = b.maxHp;
        let baseSpeed = b.baseSpeed;
        let dmgMult = b.damageMultiplier;
        let critChance = b.critChance;
        let maxDashCd = b.maxDashCooldown;

        if (this._has('zeus_storm_crown')) {
            const st = this._stats('zeus_storm_crown');
            maxHp = Math.max(25, Math.round(maxHp * (1 - (st.maxHpPenalty || 0.25))));
            dmgMult *= (1 + (st.damageBonus || 0.25));
            critChance = Math.min(0.85, critChance + (st.critBonus || 0.12));
        }

        if (this._has('immortal_ambrosia')) {
            const st = this._stats('immortal_ambrosia');
            maxDashCd = Math.round(maxDashCd * (1 + (st.dashCdPenalty || 0.35)));
        }

        if (this._has('chronos_hourglass')) {
            const st = this._stats('chronos_hourglass');
            baseSpeed *= (1 - (st.moveSpeedPenalty || 0.12));
        }

        player.maxHp = maxHp;
        if (wasFull) {
            player.hp = maxHp;
        } else if (typeof player.hp === 'number') {
            player.hp = Math.min(player.hp, maxHp);
        }
        player.baseSpeed = baseSpeed;
        player.speed = baseSpeed;
        player.damageMultiplier = dmgMult;
        player.critChance = critChance;
        player.maxDashCooldown = maxDashCd;
    }

    getFireRateMultiplier(player) {
        if (!this._has('chronos_hourglass') || !this.chronoField || !player) return 1.0;
        const dx = player.x - this.chronoField.x;
        const dy = player.y - this.chronoField.y;
        const reach = (this.chronoField.radius || 300) + 20;
        if ((dx * dx + dy * dy) <= reach * reach) {
            return 1 + (this.chronoField.fireRateBonus || 0.35);
        }
        return 1.0;
    }

    getCoinMultiplier() {
        if (!this._has('midas_curse')) return 1.0;
        const st = this._stats('midas_curse');
        return 1 + (st.coinBonus || 0.25);
    }

    getXpMultiplier() {
        if (!this._has('midas_curse')) return 1.0;
        const st = this._stats('midas_curse');
        return 1 + (st.xpBonus || 0.25);
    }

    getHealMultiplier() {
        if (!this._has('midas_curse')) return 1.0;
        const st = this._stats('midas_curse');
        return Math.max(0.25, 1 - (st.healPenalty || 0.35));
    }

    _getRunCoins(game = null) {
        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        const pouchCoins = (g && g.coinsEarnedThisRun) || 0;
        const playerCoins = (g && g.player && g.player.coins) || 0;
        return Math.max(0, pouchCoins + playerCoins);
    }

    getDamageMultiplier(targetEnemy, game = null) {
        if (!this._has('midas_curse')) return 1.0;
        const coins = this._getRunCoins(game);
        const st = this._stats('midas_curse');
        const perPct = Math.max(1, st.coinsPerPct || 20);
        const maxBonus = st.maxCoinDmgBonus || 0.25;
        const bonus = Math.min(maxBonus, Math.floor(coins / perPct) * 0.01);
        return 1 + bonus;
    }

    _spawnChronoField(player, effects) {
        if (!this._has('chronos_hourglass') || !player) return;
        const st = this._stats('chronos_hourglass');
        const frames = Math.round((st.riftDurationSec || 3.0) * 60);
        this.chronoField = {
            x: player.x,
            y: player.y,
            radius: st.riftRadius || 300,
            life: frames,
            maxLife: frames,
            slowMult: st.enemySlowMult || 0.50,
            fireRateBonus: st.insideFireRateBonus || 0.35,
            rot: 0
        };
        if (effects) {
            effects.addShockwave(player.x, player.y, st.riftRadius || 300, 'rgba(0, 206, 201, 0.75)');
            effects.addComicSplash(player.x, player.y - 36, '⏳ TIME RIFT!');
            effects.addSparks(player.x, player.y, '#ffd32a', 12);
        }
    }

    onDash(player, effects) {
        if (!player) return;
        if (this._has('chronos_hourglass')) {
            this._spawnChronoField(player, effects);
        }
    }

    onSkillActivated(player, effects) {
        if (!player || !this._has('chronos_hourglass')) return;
        const st = this._stats('chronos_hourglass');
        const keep = Math.max(0.2, 1 - (st.skillCdReduction || 0.20));
        if (player.skillCooldown > 0) player.skillCooldown = Math.round(player.skillCooldown * keep);
        if (player.maxSkillCooldown > 0) player.maxSkillCooldown = Math.round(player.maxSkillCooldown * keep);
        this._spawnChronoField(player, effects);
    }

    onBulletHit(bullet, targetEnemy, damageDealt, enemies, effects, game) {
        if (!bullet || bullet.isEnemy || !targetEnemy) return;
        if (!bullet.isCrit || !this._has('zeus_storm_crown') || this.skyBoltCooldown > 0) return;

        const st = this._stats('zeus_storm_crown');
        this.skyBoltCooldown = Math.round((st.boltCdSec || 0.25) * 60);

        const radius = st.boltRadius || 115;
        const boltDmg = Math.max(st.boltMinDmg || 75, Math.round((damageDealt || 50) * (st.boltScale || 0.55)));
        const shockMult = 1 + (st.shockBonus || 0.15);

        this.skyBolts.push({
            x: targetEnemy.x,
            y: targetEnemy.y,
            radius,
            life: 16,
            maxLife: 16,
            seed: Math.random() * 10
        });

        const radSq = radius * radius;
        if (Array.isArray(enemies)) {
            for (let i = 0; i < enemies.length; i++) {
                const e = enemies[i];
                if (!e || e.dead || e.isDying || e.isAirborneImmune) continue;
                const dSq = (e.x - targetEnemy.x) ** 2 + (e.y - targetEnemy.y) ** 2;
                if (dSq <= radSq + (e.radius || 20) ** 2) {
                    if (typeof e.applyShockVulnerability === 'function') {
                        e.applyShockVulnerability(2.5, shockMult, effects);
                    }
                    this._damageEnemy(e, boltDmg, effects, game, true);
                }
            }
        }

        if (effects) {
            effects.addShockwave(targetEnemy.x, targetEnemy.y, radius, 'rgba(0, 245, 255, 0.85)');
            effects.addComicSplash(targetEnemy.x, targetEnemy.y - 34, '⚡ SKY-BOLT!');
            effects.addSparks(targetEnemy.x, targetEnemy.y, '#00f5ff', 10);
        }
        if (window.soundEngine && typeof window.soundEngine.playHitmarker === 'function') {
            window.soundEngine.playHitmarker(true);
        }
    }

    onPlayerDamage(player, amount, effects, camera, game) {
        if (!player || player.hp > 0) return;
        if (!this._has('immortal_ambrosia') || this.ambrosiaReviveCd > 0) return;

        const st = this._stats('immortal_ambrosia');
        const reviveHp = Math.max(1, Math.round((player.maxHp || 100) * (st.reviveHpRatio || 0.45)));
        player.hp = reviveHp;
        player.invulnerableTimer = Math.round((st.invulnSec || 2.5) * 60);
        this.ambrosiaReviveCd = Math.round((st.cooldownSec || 110) * 60);

        const radius = st.sunburstRadius || 210;
        const burstDmg = st.sunburstDamage || 240;
        const stunSec = st.stunSec || 1.5;

        this.reviveRings.push({ x: player.x, y: player.y, radius, life: 36, maxLife: 36 });

        const g = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        const enemies = (g && Array.isArray(g.enemies)) ? g.enemies : [];
        const radSq = radius * radius;
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (!e || e.dead || e.isDying || e.isAirborneImmune) continue;
            const dx = e.x - player.x;
            const dy = e.y - player.y;
            if ((dx * dx + dy * dy) <= radSq + (e.radius || 20) ** 2) {
                if (typeof e.applyStun === 'function') e.applyStun(stunSec, effects);
                const dist = Math.hypot(dx, dy) || 1;
                e.x += (dx / dist) * 44;
                e.y += (dy / dist) * 44;
                this._damageEnemy(e, burstDmg, effects, g, true);
            }
        }

        if (camera && typeof camera.addShake === 'function') camera.addShake(14);
        if (effects) {
            effects.addShockwave(player.x, player.y, radius, 'rgba(255, 211, 42, 0.95)');
            effects.addComicSplash(player.x, player.y - 44, '🔥 AMBROSIA REVIVE!');
            effects.addConfetti(player.x, player.y, 26);
        }
        if (window.soundEngine && typeof window.soundEngine.playPickup === 'function') {
            window.soundEngine.playPickup('star');
        }
    }

    onEnemyKilled(enemy, game) {
        if (!enemy || !game || !game.drops || typeof Drop === 'undefined') return;
        if (game.isCoopGuest || !this._has('midas_curse')) return;

        const isPriority = MYTHIC_ELITE_SET.has(enemy.type) || enemy.isMiniBoss || enemy.isBoss || enemy.isEndlessBoss;
        if (!isPriority || enemy._midasDropChecked) return;
        enemy._midasDropChecked = true;

        const st = this._stats('midas_curse');
        const guaranteed = !!(st.guaranteedMiniBossDrop && (enemy.isMiniBoss || enemy.isEndlessBoss || enemy.isBoss));
        if (!guaranteed && Math.random() >= (st.matDropChance || 0.22)) return;

        // Ambrosia Spark remains exclusively tied to Mount Olympus Floor 5 (Zeus).
        const isCrystal = Math.random() < (st.crystalShare || 0.25);
        const dropType = isCrystal ? 'mat_mati_crystal' : 'mat_armory_shards';
        game.drops.push(new Drop(enemy.x + 8, enemy.y - 6, dropType, 1));
    }

    update(dt = 1, game) {
        if (!game) return;
        if (this.skyBoltCooldown > 0) this.skyBoltCooldown = Math.max(0, this.skyBoltCooldown - dt);
        if (this.ambrosiaReviveCd > 0) this.ambrosiaReviveCd = Math.max(0, this.ambrosiaReviveCd - dt);

        const player = game.player;
        const enemies = Array.isArray(game.enemies) ? game.enemies : [];
        const effects = game.effects;

        // Immortal Ambrosia passive low-HP regeneration (< 50% Max HP)
        if (player && player.hp > 0 && this._has('immortal_ambrosia')) {
            const st = this._stats('immortal_ambrosia');
            const capHp = (player.maxHp || 100) * (st.regenThreshold || 0.50);
            if (player.hp < capHp) {
                const tick = ((st.regenPerSec || 4) / 60) * dt;
                player.hp = Math.min(capHp, player.hp + tick);
                this.regenFxTimer += dt;
                if (effects && this.regenFxTimer >= 24) {
                    this.regenFxTimer = 0;
                    effects.addSparks(player.x, player.y - 8, '#ffd32a', 2);
                }
            }
        }

        // Chronos Time-Rift active zone enemy slow
        if (this.chronoField) {
            this.chronoField.life -= dt;
            this.chronoField.rot += 0.028 * dt;
            if (this.chronoField.life <= 0) {
                this.chronoField = null;
            } else {
                const cf = this.chronoField;
                for (let i = 0; i < enemies.length; i++) {
                    const e = enemies[i];
                    if (!e || e.dead || e.isDying) continue;
                    const dist = Math.hypot(e.x - cf.x, e.y - cf.y);
                    if (dist <= cf.radius + (e.radius || 20)) {
                        if (typeof e.applyChronoSlow === 'function') {
                            e.applyChronoSlow(0.35, cf.slowMult);
                        }
                    }
                }
            }
        }

        for (let i = this.skyBolts.length - 1; i >= 0; i--) {
            this.skyBolts[i].life -= dt;
            if (this.skyBolts[i].life <= 0) this.skyBolts.splice(i, 1);
        }
        for (let i = this.reviveRings.length - 1; i >= 0; i--) {
            this.reviveRings[i].life -= dt;
            if (this.reviveRings[i].life <= 0) this.reviveRings.splice(i, 1);
        }
    }

    draw(ctx, game) {
        if (!ctx) return;

        // 1. Chronos Time-Rift Rune Circle
        if (this.chronoField) {
            const cf = this.chronoField;
            const fade = Math.min(1, cf.life / 25);
            ctx.save();
            ctx.translate(cf.x, cf.y);
            ctx.globalAlpha = 0.24 * fade;
            ctx.fillStyle = '#00cec9';
            ctx.beginPath();
            ctx.arc(0, 0, cf.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.globalAlpha = 0.85 * fade;
            ctx.strokeStyle = '#ffd32a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, cf.radius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.rotate(cf.rot);
            ctx.strokeStyle = '#00f5ff';
            ctx.lineWidth = 2;
            ctx.setLineDash([16, 12]);
            ctx.beginPath();
            ctx.arc(0, 0, cf.radius * 0.76, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            for (let i = 0; i < 12; i++) {
                const a = (i / 12) * Math.PI * 2;
                ctx.beginPath();
                ctx.moveTo(Math.cos(a) * (cf.radius * 0.86), Math.sin(a) * (cf.radius * 0.86));
                ctx.lineTo(Math.cos(a) * (cf.radius * 0.96), Math.sin(a) * (cf.radius * 0.96));
                ctx.stroke();
            }
            ctx.restore();
        }

        // 2. Midas Curse Golden Aura around Player when stacks are earned
        const player = game && game.player;
        if (player && this._has('midas_curse') && this._getRunCoins(game) >= 20) {
            ctx.save();
            ctx.globalAlpha = 0.35;
            ctx.strokeStyle = '#ffd32a';
            ctx.lineWidth = 2;
            ctx.setLineDash([7, 7]);
            ctx.beginPath();
            ctx.arc(player.x, player.y, (player.radius || 24) + 12, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // 3. Zeus Sky-Bolt Arcs
        for (let i = 0; i < this.skyBolts.length; i++) {
            const b = this.skyBolts[i];
            const alpha = Math.max(0, b.life / b.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = '#00f5ff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(b.x - 10, b.y - 240);
            ctx.lineTo(b.x + 14, b.y - 140);
            ctx.lineTo(b.x - 8, b.y - 55);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();

            ctx.strokeStyle = '#ffd32a';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius * (1 - alpha * 0.35), 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        // 4. Immortal Ambrosia Sunburst Rings
        for (let i = 0; i < this.reviveRings.length; i++) {
            const r = this.reviveRings[i];
            const prog = 1 - (r.life / r.maxLife);
            ctx.save();
            ctx.globalAlpha = Math.max(0, (r.life / r.maxLife) * 0.9);
            ctx.strokeStyle = '#ffd32a';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(r.x, r.y, Math.max(20, r.radius * prog), 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }
}

if (typeof window !== 'undefined') {
    window.MythicPerkEffects = MythicPerkEffects;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MythicPerkEffects };
}
