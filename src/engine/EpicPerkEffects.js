/**
 * Lesa.io - Epic Battle Perks Runtime Effects System
 * Executes combat mechanics and visuals for the 5 Epic Battle Perks:
 * - Phantom Espresso (Dash decoy taunt/shock + Skill CD trim + Fire Rate surge)
 * - Evil-Eye Mirror (Orbiting Mati Ward hit block/absorb + piercing Curse Bolt)
 * - Bloodstring Bouzouki (Kill-rhythm heal -> Temp Shield overflow + Magnet surge)
 * - Ouzo Chain-Spark (Crit/Kill lightning arcs with bonus damage vs slowed targets)
 * - Tavli Double-Sixes (+Coins/XP bonus + Crate/Brute Double-Sixes jackpot drops)
 */

class EpicPerkEffects {
    constructor() {
        this.reset();
    }

    reset() {
        this.decoys = [];
        this.curseBolts = [];
        this.wardTimer = 0;
        this.wardReady = false;
        this.bouzoukiKills = 0;
        this.bouzoukiShield = 0;
        this.bouzoukiShieldTimer = 0;
        this.magnetBuffTimer = 0;
        this.magnetBonus = 0;
        this.tavliCounter = 0;
    }

    _has(perkId) {
        return typeof PerkSystem !== 'undefined' && PerkSystem.hasPerk(perkId);
    }

    _stats(perkId) {
        return typeof PerkSystem !== 'undefined' ? PerkSystem.getRankStats(perkId) : {};
    }

    /**
     * Phantom Espresso: Spawn holographic coffee decoy, trim Skill CD, surge Fire Rate
     */
    onDash(player, effects = null) {
        if (!player || !this._has('phantom_espresso')) return;
        const st = this._stats('phantom_espresso');

        const lifeFrames = Math.max(30, Math.round((st.decoyDurationSec || 1.1) * 60));
        this.decoys.push({
            x: player.x,
            y: player.y,
            radius: 22,
            life: lifeFrames,
            maxLife: lifeFrames,
            blastRadius: st.blastRadius || 115,
            blastDamage: st.blastDamage || 45,
            tauntRadius: st.tauntRadius || 320,
            hitFlash: 0
        });

        if (player.skillCooldown > 0 && st.skillCdTrim > 0) {
            player.skillCooldown = Math.max(0, player.skillCooldown * (1 - st.skillCdTrim));
        }

        player.espressoFireRateBonus = st.fireRateBonus || 0.22;
        player.espressoHasteTimer = Math.round((st.hasteDurationSec || 1.6) * 60);

        if (effects) {
            effects.addShockwave(player.x, player.y, 70, 'rgba(108, 92, 231, 0.85)');
            effects.addComicSplash(player.x, player.y - 34, '☕ PHANTOM ESPRESSO!');
            effects.addSparks(player.x, player.y, '#a29bfe', 8);
        }
    }

    /**
     * Phantom Espresso: Redirect nearby non-boss enemies toward an active Espresso Decoy
     */
    getTargetOverride(enemy, fallbackTarget) {
        if (!enemy || enemy.isBoss || enemy.isMiniBoss || enemy.isStationary || this.decoys.length === 0) {
            return fallbackTarget;
        }
        let bestDecoy = null;
        let bestSq = Infinity;
        for (let i = 0; i < this.decoys.length; i++) {
            const d = this.decoys[i];
            if (d.life <= 0) continue;
            const dx = d.x - enemy.x;
            const dy = d.y - enemy.y;
            const distSq = dx * dx + dy * dy;
            if (distSq <= d.tauntRadius * d.tauntRadius && distSq < bestSq) {
                bestSq = distSq;
                bestDecoy = d;
            }
        }
        if (!bestDecoy) return fallbackTarget;

        if (!bestDecoy._targetProxy) {
            bestDecoy._targetProxy = {
                x: bestDecoy.x,
                y: bestDecoy.y,
                vx: 0,
                vy: 0,
                radius: bestDecoy.radius,
                hp: 9999,
                maxHp: 9999,
                isDecoy: true,
                takeDamage() {
                    bestDecoy.hitFlash = 8;
                    return false;
                }
            };
        }
        return bestDecoy._targetProxy;
    }

    getFireRateMultiplier(player) {
        if (!player || !(player.espressoHasteTimer > 0) || !this._has('phantom_espresso')) return 1.0;
        return 1.0 + (player.espressoFireRateBonus || this._stats('phantom_espresso').fireRateBonus || 0.22);
    }

    getMagnetMultiplier() {
        if (!(this.magnetBuffTimer > 0) || !this._has('bloodstring_bouzouki')) return 1.0;
        return 1.0 + (this.magnetBonus || this._stats('bloodstring_bouzouki').magnetBonus || 0.50);
    }

    getCoinMultiplier() {
        if (!this._has('tavli_double_sixes')) return 1.0;
        const st = this._stats('tavli_double_sixes');
        return 1.0 + (st.coinMultBonus || 0.08);
    }

    getXpMultiplier() {
        if (!this._has('tavli_double_sixes')) return 1.0;
        const st = this._stats('tavli_double_sixes');
        return 1.0 + (st.xpMultBonus || 0.08);
    }

    /**
     * Evil-Eye Mirror + Bloodstring Bouzouki barrier mitigation before HP loss
     */
    interceptPlayerDamage(player, amount, effects = null, game = null) {
        if (!player || amount <= 0) return { blocked: false, remainingDamage: amount };
        let remaining = amount;

        // 1. Evil-Eye Mirror Ward orb check
        if (this._has('evil_eye_mirror') && this.wardReady) {
            const st = this._stats('evil_eye_mirror');
            this.wardReady = false;
            this.wardTimer = 0;
            this._fireCurseBolt(player, st, game, effects);

            const fullBlock = (st.absorbRatio >= 1.0) || (st.fullBlockNonBoss && remaining < 45);
            if (fullBlock) {
                player.invulnerableTimer = Math.max(player.invulnerableTimer || 0, 30);
                if (window.soundEngine && typeof window.soundEngine.playHit === 'function') {
                    window.soundEngine.playHit(false, true);
                }
                if (effects) {
                    effects.addComicSplash(player.x, player.y - 32, '🧿 MIRROR BLOCK!');
                    effects.addShockwave(player.x, player.y, 95, 'rgba(9, 132, 227, 0.9)');
                }
                return { blocked: true, remainingDamage: 0 };
            }

            const absorbed = Math.round(remaining * (st.absorbRatio || 0.65));
            remaining = Math.max(1, remaining - absorbed);
            if (effects) {
                effects.addPopup(player.x, player.y - 24, `🧿 -${absorbed}`, '#74b9ff', 22);
                effects.addShockwave(player.x, player.y, 80, 'rgba(9, 132, 227, 0.75)');
            }
        }

        // 2. Bloodstring Bouzouki overflow Temp Shield
        if (this.bouzoukiShield > 0 && remaining > 0) {
            const absorbed = Math.min(this.bouzoukiShield, remaining);
            this.bouzoukiShield -= absorbed;
            remaining = Math.max(0, remaining - absorbed);
            if (effects && absorbed > 0) {
                effects.addPopup(player.x, player.y - 20, `🪕 -${absorbed}`, '#fd79a8', 20);
            }
            if (remaining <= 0) {
                player.invulnerableTimer = Math.max(player.invulnerableTimer || 0, 18);
                if (effects) effects.addComicSplash(player.x, player.y - 34, '🪕 CHORD SHIELD!');
                return { blocked: true, remainingDamage: 0 };
            }
        }

        return { blocked: false, remainingDamage: remaining };
    }

    onPlayerDamage() {
        // Damage resets Evil-Eye Mirror's "without taking damage" recharge timer
        if (this._has('evil_eye_mirror') && !this.wardReady) {
            this.wardTimer = 0;
        }
    }

    _fireCurseBolt(player, stats, game, effects) {
        const enemies = (game && game.enemies) || [];
        let targetAngle = player.angle || 0;
        let bestSq = Infinity;
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (!e || e.dead || e.isDying || e.isAirborneImmune) continue;
            const dSq = (e.x - player.x) ** 2 + (e.y - player.y) ** 2;
            if (dSq < bestSq) {
                bestSq = dSq;
                targetAngle = Math.atan2(e.y - player.y, e.x - player.x);
            }
        }
        const speed = 13.5;
        this.curseBolts.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(targetAngle) * speed,
            vy: Math.sin(targetAngle) * speed,
            radius: stats.boltRadius || 11,
            damage: stats.reflectDamage || 55,
            slowSec: stats.slowSec || 1.5,
            freezeChill: (stats.absorbRatio || 0) >= 1.0,
            life: 45,
            hitEnemies: new Set()
        });
        if (effects) {
            effects.addSparks(player.x, player.y, '#74b9ff', 10);
        }
    }

    /**
     * Ouzo Chain-Spark: Arc lightning from crit hits or enemy kills
     */
    onBulletHit(bullet, targetEnemy, damageDealt, enemies, effects, game) {
        if (!bullet || !targetEnemy || !bullet.isCrit || !this._has('ouzo_chain_spark')) return;
        const st = this._stats('ouzo_chain_spark');
        if (Math.random() < (st.procChance || 0.30)) {
            targetEnemy._ouzoChainedFrame = true;
            this._triggerOuzoChain(targetEnemy, damageDealt, st, enemies, effects, game);
        }
    }

    onEnemyKilled(enemy, game) {
        if (!enemy || !game) return;
        const player = game.player;
        const effects = game.effects;

        // Bloodstring Bouzouki: Kill rhythm heal / overflow barrier + magnet surge
        if (player && this._has('bloodstring_bouzouki')) {
            const st = this._stats('bloodstring_bouzouki');
            const interval = Math.max(1, st.killsPerPulse || 12);
            this.bouzoukiKills++;
            if (this.bouzoukiKills >= interval) {
                this.bouzoukiKills = 0;
                const healAmt = st.healAmount || 12;
                const missing = Math.max(0, (player.maxHp || 100) - (player.hp || 0));
                const actualHeal = Math.min(missing, healAmt);
                const overflow = Math.max(0, healAmt - actualHeal);
                if (actualHeal > 0 && typeof player.heal === 'function') player.heal(actualHeal);
                if (overflow > 0) {
                    const maxCap = st.maxBarrier || 25;
                    this.bouzoukiShield = Math.min(maxCap, this.bouzoukiShield + overflow);
                    this.bouzoukiShieldTimer = 600; // 10s temporary barrier
                }
                this.magnetBonus = st.magnetBonus || 0.50;
                this.magnetBuffTimer = Math.round((st.magnetDurationSec || 4.0) * 60);
                if (window.soundEngine && typeof window.soundEngine.playPickup === 'function') {
                    window.soundEngine.playPickup('heart');
                }
                if (effects) {
                    effects.addShockwave(player.x, player.y, 105, 'rgba(232, 67, 147, 0.8)');
                    const lbl = overflow > 0 ? `🪕 +${Math.round(actualHeal)} HP +${Math.round(overflow)} 🛡️` : `🪕 +${Math.round(actualHeal)} HP!`;
                    effects.addComicSplash(player.x, player.y - 38, lbl);
                    effects.addSparks(player.x, player.y, '#fd79a8', 10);
                }
            }
        }

        // Ouzo Chain-Spark on kill (skipped if fatal crit just chained this enemy)
        if (this._has('ouzo_chain_spark')) {
            if (enemy._ouzoChainedFrame) {
                enemy._ouzoChainedFrame = false;
            } else {
                const st = this._stats('ouzo_chain_spark');
                if (Math.random() < (st.procChance || 0.30)) {
                    const baseDmg = Math.max(30, Math.round(55 * ((player && player.damageMultiplier) || 1)));
                    this._triggerOuzoChain(enemy, baseDmg, st, game.enemies, effects, game);
                }
            }
        }

        // Tavli Double-Sixes on Brute defeat
        const isBrute = enemy.type === 'fatmir' || enemy.type === 'casillas' || enemy.type === 'skarmogyftos' || enemy.type === 'kleanthis';
        if (isBrute && this._has('tavli_double_sixes')) {
            this._advanceTavliCounter(enemy.x, enemy.y, game);
        }
    }

    onCrateDestroyed(obs, game) {
        if (!obs || !game || !this._has('tavli_double_sixes')) return;
        this._advanceTavliCounter(obs.x, obs.y, game);
    }

    _advanceTavliCounter(x, y, game) {
        if (!game || !game.drops || typeof Drop === 'undefined') return;
        const st = this._stats('tavli_double_sixes');
        const everyN = Math.max(1, st.rollInterval || 6);
        this.tavliCounter++;
        if (this.tavliCounter < everyN) return;
        this.tavliCounter = 0;

        game.drops.push(new Drop(x, y, 'coin_pouch', st.pouchBonus || 22));
        game.drops.push(new Drop(x + 12, y - 8, 'xp', 20));
        if (!game.isCoopGuest) {
            if (Math.random() < (st.shardChance || 0.30)) {
                game.drops.push(new Drop(x - 14, y + 6, 'mat_armory_shards', 1));
            }
            if (Math.random() < (st.crystalChance || 0.12)) {
                game.drops.push(new Drop(x + 10, y + 12, 'mat_mati_crystal', 1));
            }
        }
        if (game.effects) {
            game.effects.addComicSplash(x, y - 30, '🎲 6-6 JACKPOT!');
            game.effects.addSparks(x, y, '#f39c12', 9);
        }
    }

    _triggerOuzoChain(origin, baseDamage, st, enemies, effects, game) {
        if (!origin || !Array.isArray(enemies) || enemies.length === 0) return;
        const maxJumps = st.maxJumps || 2;
        const radiusSq = (st.arcRadius || 160) ** 2;
        const visited = new Set([origin]);
        let lastX = origin.x;
        let lastY = origin.y;
        let jumped = 0;

        for (let step = 0; step < maxJumps; step++) {
            let best = null;
            let bestSq = radiusSq;
            for (let i = 0; i < enemies.length; i++) {
                const cand = enemies[i];
                if (!cand || cand.dead || cand.isDying || cand.isAirborneImmune || visited.has(cand)) continue;
                const dSq = (cand.x - lastX) ** 2 + (cand.y - lastY) ** 2;
                if (dSq <= bestSq) {
                    bestSq = dSq;
                    best = cand;
                }
            }
            if (!best) break;
            visited.add(best);
            jumped++;

            const isSlowed = (best.iceSlowTimer > 0 || best.sonicSlowTimer > 0 || best.waterDrenchedTimer > 0 || best.slowTimer > 0);
            const slowMult = isSlowed ? (st.slowedBonus || 1.20) : 1.0;
            const arcDmg = Math.max(8, Math.round(baseDamage * (st.dmgRatio || 0.35) * slowMult));
            if (typeof best.takeDamage === 'function') best.takeDamage(arcDmg, effects, isSlowed);
            if (game && game.isCoopGuest) best.dead = false;
            if (effects) effects.addLightningChain(lastX, lastY, best.x, best.y, '#74b9ff');
            lastX = best.x;
            lastY = best.y;
        }

        if (jumped > 0 && effects) {
            effects.addSparks(origin.x, origin.y, '#00a8ff', 6);
        }
    }

    update(dt = 1, game) {
        if (!game || !game.player) return;
        const player = game.player;
        const enemies = game.enemies || [];
        const effects = game.effects;

        // Evil-Eye Mirror recharge while alive
        if (this._has('evil_eye_mirror') && player.hp > 0) {
            if (!this.wardReady) {
                const st = this._stats('evil_eye_mirror');
                const needFrames = Math.round((st.rechargeSec || 14) * 60);
                this.wardTimer += dt;
                if (this.wardTimer >= needFrames) {
                    this.wardTimer = 0;
                    this.wardReady = true;
                    if (effects) effects.addComicSplash(player.x, player.y - 38, '🧿 MIRROR WARD READY!');
                }
            }
        } else {
            this.wardReady = false;
            this.wardTimer = 0;
        }

        // Bloodstring Bouzouki barrier & magnet timers
        if (this.bouzoukiShieldTimer > 0) {
            this.bouzoukiShieldTimer -= dt;
            if (this.bouzoukiShieldTimer <= 0) this.bouzoukiShield = 0;
        }
        if (this.magnetBuffTimer > 0) this.magnetBuffTimer = Math.max(0, this.magnetBuffTimer - dt);

        // Phantom Espresso active decoys
        for (let i = this.decoys.length - 1; i >= 0; i--) {
            const d = this.decoys[i];
            d.life -= dt;
            if (d.hitFlash > 0) d.hitFlash -= dt;
            if (d.life <= 0) {
                this.decoys.splice(i, 1);
                const blastSq = d.blastRadius * d.blastRadius;
                for (let ei = 0; ei < enemies.length; ei++) {
                    const e = enemies[ei];
                    if (!e || e.dead || e.isDying || e.isAirborneImmune) continue;
                    const distSq = (e.x - d.x) ** 2 + (e.y - d.y) ** 2;
                    if (distSq <= blastSq + (e.radius || 20) ** 2) {
                        if (typeof e.takeDamage === 'function') e.takeDamage(d.blastDamage, effects, true);
                        if (game.isCoopGuest) e.dead = false;
                        if (typeof e.applySonicSlow === 'function') e.applySonicSlow(1.2, 0.70, effects);
                    }
                }
                if (effects) {
                    effects.addShockwave(d.x, d.y, d.blastRadius, 'rgba(108, 92, 231, 0.9)');
                    effects.addSparks(d.x, d.y, '#a29bfe', 12);
                    effects.addComicSplash(d.x, d.y - 24, '☕ ZAP!');
                }
            }
        }

        // Evil-Eye Mirror piercing Curse Bolts
        for (let i = this.curseBolts.length - 1; i >= 0; i--) {
            const cb = this.curseBolts[i];
            cb.x += cb.vx * dt;
            cb.y += cb.vy * dt;
            cb.life -= dt;

            for (let ei = 0; ei < enemies.length; ei++) {
                const e = enemies[ei];
                if (!e || e.dead || e.isDying || e.isAirborneImmune || cb.hitEnemies.has(e)) continue;
                if (Math.hypot(e.x - cb.x, e.y - cb.y) <= cb.radius + (e.radius || 20)) {
                    cb.hitEnemies.add(e);
                    if (typeof e.takeDamage === 'function') e.takeDamage(cb.damage, effects, true);
                    if (typeof e.applySonicSlow === 'function') e.applySonicSlow(cb.slowSec, 0.68, effects);
                    if (cb.freezeChill && typeof e.applyIceSlow === 'function') e.applyIceSlow(cb.slowSec, 0.55, effects);
                    if (effects) effects.addSparks(e.x, e.y, '#74b9ff', 6);
                }
            }
            if (cb.life <= 0) this.curseBolts.splice(i, 1);
        }
    }

    draw(ctx, game) {
        if (!ctx || !game || !game.player) return;
        const player = game.player;
        const now = performance.now() * 0.004;

        // 1. Phantom Espresso Holographic Decoys
        for (let i = 0; i < this.decoys.length; i++) {
            const d = this.decoys[i];
            const ratio = Math.max(0.15, d.life / d.maxLife);
            ctx.save();
            ctx.globalAlpha = Math.min(0.9, ratio + 0.15);
            ctx.strokeStyle = d.hitFlash > 0 ? '#ffffff' : '#a29bfe';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.radius + Math.sin(now * 3) * 3, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = 'rgba(108, 92, 231, 0.45)';
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.radius * 0.78, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('☕', d.x, d.y + 1);
            ctx.restore();
        }

        // 2. Orbiting Evil-Eye Mirror Ward Orb (or subtle recharge arc)
        if (this._has('evil_eye_mirror') && player.hp > 0) {
            const st = this._stats('evil_eye_mirror');
            if (this.wardReady) {
                const ox = player.x + Math.cos(now * 1.1) * 38;
                const oy = player.y + Math.sin(now * 1.1) * 38;
                ctx.save();
                ctx.fillStyle = '#0984e3';
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(ox, oy, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#0a1931';
                ctx.beginPath();
                ctx.arc(ox, oy, 3.2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else if (this.wardTimer > 0) {
                const pct = Math.min(1, this.wardTimer / Math.max(1, (st.rechargeSec || 14) * 60));
                ctx.save();
                ctx.strokeStyle = 'rgba(116, 185, 255, 0.45)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(player.x, player.y, (player.radius || 22) + 9, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        }

        // 3. Flying Curse Bolts
        for (let i = 0; i < this.curseBolts.length; i++) {
            const cb = this.curseBolts[i];
            ctx.save();
            ctx.fillStyle = '#0984e3';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cb.x, cb.y, cb.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#dff9fb';
            ctx.beginPath();
            ctx.arc(cb.x, cb.y, cb.radius * 0.42, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 4. Bloodstring Bouzouki Barrier aura
        if (this.bouzoukiShield > 0 && player.hp > 0) {
            ctx.save();
            ctx.strokeStyle = 'rgba(253, 121, 168, 0.85)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(player.x, player.y, (player.radius || 22) + 7 + Math.sin(now * 2) * 1.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }
}

if (typeof window !== 'undefined') {
    window.EpicPerkEffects = EpicPerkEffects;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EpicPerkEffects };
}
