/**
 * Lesa.io - Epic & Legendary Gear Signature Passives Engine (Alpha 1.5)
 * Handles combat passive triggers, periodic buffs, shields, AoE procs,
 * and stat modifiers for the 20 Epic & Legendary chest-only gear items.
 */

class GearPassives {
    static has(passiveId) {
        return typeof GearManager !== 'undefined' &&
            typeof GearManager.hasPassive === 'function' &&
            GearManager.hasPassive(passiveId);
    }

    static isAwakenedStormborn() {
        return this.has('stormborn_aegis') &&
            typeof GearUpgradeManager !== 'undefined' &&
            GearUpgradeManager.isEvolved('zeus_aegis_cuirass');
    }

    static initPlayer(player) {
        if (!player) return;
        player._gearPassiveState = {
            evilEyeTimer: 0,
            evilEyeReady: this.has('evil_eye_ward'),
            aegisShieldTimer: 0,
            aegisFatalUsed: false,
            charcoalTimer: 45,
            steadyRhythmTimer: 0,
            sonicCritTimer: 0,
            shockAbsorberTimer: 0,
            throttleStacks: 0,
            throttleDecayTimer: 0,
            dashCount: 0,
            shotCount: 0,
            killCount: 0,
            wasDashing: false,
            sonicDashHitSet: null
        };
        player.aegisBarrier = this.has('blessed_shield') ? 30 : 0;
    }

    static _ensureState(player) {
        if (!player._gearPassiveState) this.initPlayer(player);
        return player._gearPassiveState;
    }

    static _isBossOrElite(enemy) {
        if (!enemy) return false;
        if (enemy.isBoss || enemy.isMiniBoss || enemy.isElite) return true;
        return ['kleanthis', 'kiloumpas', 'rouf', 'zeus', 'frost_titan'].includes(enemy.type);
    }

    static isSlowImmune() {
        return this.has('sure_footed');
    }

    static getSpeedMultiplier(player) {
        const s = player && player._gearPassiveState;
        return (s && s.shockAbsorberTimer > 0) ? 1.25 : 1.0;
    }

    static getFireRateMultiplier(player) {
        const s = player && player._gearPassiveState;
        if (!s) return 1.0;
        let mult = 1.0;
        if (s.steadyRhythmTimer > 0) mult *= 1.12;
        if (this.has('throttle_grip') && s.throttleStacks > 0) {
            mult *= (1 + s.throttleStacks * 0.02);
        }
        return mult;
    }

    static getCritBonus(player) {
        const s = player && player._gearPassiveState;
        return (s && s.sonicCritTimer > 0) ? 0.20 : 0;
    }

    static getDamageMultiplier(player, targetEnemy, isCrit = false) {
        let mult = 1.0;
        const isBossOrElite = this._isBossOrElite(targetEnemy);
        if (isCrit && isBossOrElite && this.has('sharp_focus')) mult *= 1.15;
        if (targetEnemy && (targetEnemy.isBoss || targetEnemy.isMiniBoss) && this.has('charcoal_aura')) {
            mult *= 1.15;
        }
        return mult;
    }

    static getGoldMultiplier() {
        let mult = 1.0;
        if (this.has('tip_jar')) mult += 0.10;
        if (this.has('lucky_roll')) mult += 0.20;
        return mult;
    }

    static update(dt, player, game) {
        if (!player || player.hp <= 0) return;
        const s = this._ensureState(player);
        const effects = game ? game.effects : null;
        const enemies = game ? game.enemies : [];

        // Decay timed buffs
        if (s.steadyRhythmTimer > 0) s.steadyRhythmTimer = Math.max(0, s.steadyRhythmTimer - dt);
        if (s.sonicCritTimer > 0) s.sonicCritTimer = Math.max(0, s.sonicCritTimer - dt);
        if (s.shockAbsorberTimer > 0) s.shockAbsorberTimer = Math.max(0, s.shockAbsorberTimer - dt);
        if (s.throttleDecayTimer > 0) {
            s.throttleDecayTimer -= dt;
            if (s.throttleDecayTimer <= 0) s.throttleStacks = 0;
        }

        // Evil Eye Ward: every 20s (1200 frames) grants 1 hit block
        if (this.has('evil_eye_ward') && !s.evilEyeReady) {
            s.evilEyeTimer += dt;
            if (s.evilEyeTimer >= 1200) {
                s.evilEyeTimer = 0;
                s.evilEyeReady = true;
                if (effects) effects.addComicSplash(player.x, player.y - 36, '🧿 WARD READY!');
            }
        }

        // Stormborn Aegis (45 HP / 10s, or Awakened ★ 75 HP / 8s) or Blessed Shield (30 HP / 12s)
        const hasStormBarrier = this.has('stormborn_aegis');
        const awakenedStorm = hasStormBarrier && this.isAwakenedStormborn();
        const hasBlessedBarrier = this.has('blessed_shield');
        if (hasStormBarrier || hasBlessedBarrier) {
            const barrierCap = awakenedStorm ? 75 : (hasStormBarrier ? 45 : 30);
            const barrierPeriod = awakenedStorm ? 480 : (hasStormBarrier ? 600 : 720);
            if ((player.aegisBarrier || 0) < barrierCap) {
                s.aegisShieldTimer += dt;
                if (s.aegisShieldTimer >= barrierPeriod) {
                    s.aegisShieldTimer = 0;
                    player.aegisBarrier = barrierCap;
                    if (effects) {
                        const rCol = awakenedStorm ? 'rgba(251, 191, 36, 0.9)' : (hasStormBarrier ? 'rgba(0, 245, 255, 0.85)' : 'rgba(243, 156, 18, 0.75)');
                        const rMsg = awakenedStorm ? '⚡ AWAKENED BARRIER +75!' : (hasStormBarrier ? '⚡ STORM BARRIER +45!' : '🛡️ AEGIS +30!');
                        effects.addShockwave(player.x, player.y, awakenedStorm ? 98 : (hasStormBarrier ? 85 : 70), rCol);
                        effects.addComicSplash(player.x, player.y - 36, rMsg);
                        if (typeof CoopCombatFx !== 'undefined') CoopCombatFx.relayRing(player, awakenedStorm ? 98 : (hasStormBarrier ? 85 : 70), rCol, rMsg);
                    }
                }
            }
        } else {
            player.aegisBarrier = 0;
        }

        // Untouchable Stride: dash recharges 25% faster while moving
        if (this.has('untouchable_stride') && player.isMoving && player.dashCooldown > 0) {
            player.dashCooldown = Math.max(0, player.dashCooldown - 0.25 * dt);
        }

        // Sonic Slipstream: deal damage while dashing through enemies
        if (player.isDashing && this.has('sonic_slipstream') && enemies.length > 0) {
            if (!s.sonicDashHitSet) s.sonicDashHitSet = new Set();
            const slipDmg = Math.round(35 * (player.damageMultiplier || 1));
            for (let i = 0; i < enemies.length; i++) {
                const e = enemies[i];
                if (!e || e.dead || e.isDying || s.sonicDashHitSet.has(e)) continue;
                const rad = (player.radius || 22) + (e.radius || 22) + 18;
                if (Math.hypot(e.x - player.x, e.y - player.y) <= rad) {
                    s.sonicDashHitSet.add(e);
                    if (typeof e.takeDamage === 'function') e.takeDamage(slipDmg, effects, false);
                    if (effects) effects.addSparks(e.x, e.y, '#fed330', 6);
                }
            }
        }

        // Seismic Step: landing a dash triggers quake stomp stunning enemies for 0.8s
        if (s.wasDashing && !player.isDashing && this.has('seismic_step')) {
            this._triggerRadialStomp(player, enemies, effects, 160, 32 * (player.damageMultiplier || 1), 48, '🥾 SEISMIC STEP!', '#e67e22');
            if (typeof CoopCombatFx !== 'undefined') CoopCombatFx.relayRing(player, 160, '#e67e22', '🥾 SEISMIC STEP!');
        }
        s.wasDashing = !!player.isDashing;

        // Charcoal Aura: periodically scorch nearby enemies every 1.5s (90 frames)
        if (this.has('charcoal_aura') && enemies.length > 0) {
            s.charcoalTimer -= dt;
            if (s.charcoalTimer <= 0) {
                s.charcoalTimer = 90;
                const burnDmg = Math.round(18 * (player.damageMultiplier || 1));
                let scorchedAny = false;
                for (let i = 0; i < enemies.length; i++) {
                    const e = enemies[i];
                    if (!e || e.dead || e.isDying) continue;
                    if (Math.hypot(e.x - player.x, e.y - player.y) <= 155 + (e.radius || 20)) {
                        scorchedAny = true;
                        if (typeof e.takeDamage === 'function') e.takeDamage(burnDmg, effects, false);
                        if (effects) effects.addSparks(e.x, e.y, '#ff6b35', 4);
                    }
                }
                if (scorchedAny && effects) {
                    effects.addShockwave(player.x, player.y, 155, 'rgba(255, 107, 53, 0.45)');
                    if (typeof CoopCombatFx !== 'undefined') CoopCombatFx.relayRing(player, 155, 'rgba(255, 107, 53, 0.45)', '', '#ff6b35', 6);
                }
            }
        }
    }

    static onDash(player, effects) {
        const s = this._ensureState(player);
        s.dashCount = (s.dashCount || 0) + 1;
        s.sonicDashHitSet = new Set();

        if (this.has('steady_rhythm')) {
            s.steadyRhythmTimer = 150;
            if (effects) effects.addComicSplash(player.x, player.y - 44, '📿 +12% FIRE RATE!');
        }
        if (this.has('sonic_slipstream')) {
            s.sonicCritTimer = 90;
            if (effects) effects.addComicSplash(player.x, player.y - 54, '⚡ +20% CRIT!');
        }
        if (this.has('double_sixes') && s.dashCount % 6 === 0) {
            const game = typeof window !== 'undefined' ? window.gameInstance : null;
            this._triggerRadialStomp(player, game ? game.enemies : [], effects, 165, 30 * (player.damageMultiplier || 1), 50, '🎲 DOUBLE SIXES!', '#9b59b6');
            if (typeof CoopCombatFx !== 'undefined') CoopCombatFx.relayRing(player, 165, '#9b59b6', '🎲 DOUBLE SIXES!');
        }
    }

    static onShoot(player, bullets, effects) {
        if (!player || !Array.isArray(bullets) || bullets.length === 0) return;
        const s = this._ensureState(player);
        s.shotCount = (s.shotCount || 0) + 1;

        if (this.has('throttle_grip')) {
            s.throttleStacks = Math.min(5, (s.throttleStacks || 0) + 1);
            s.throttleDecayTimer = 75;
        }
        if (this.has('sizzling_skewers')) {
            for (let i = 0; i < bullets.length; i++) {
                if (Math.random() < 0.15) bullets[i].pierce = (bullets[i].pierce || 1) + 1;
            }
        }
        if (this.has('too_hot_to_handle') && s.shotCount % 8 === 0) {
            const lead = bullets[0];
            lead.isExplosiveMitts = true;
            lead.radius = Math.round((lead.radius || 8) * 1.65);
            lead.pierce = (lead.pierce || 1) + 1;
            lead.damage = Math.round((lead.damage || 25) * 1.35);
            if (effects) effects.addComicSplash(player.x, player.y - 36, '🧤 TOO HOT!');
        }
    }

    static tryAvoidHit(player, effects) {
        const s = this._ensureState(player);
        if (this.has('untouchable_stride') && player.isMoving && Math.random() < 0.15) {
            player.invulnerableTimer = 18;
            if (effects) {
                effects.addComicSplash(player.x, player.y - 25, '🪽 DODGED!');
                effects.addSparks(player.x, player.y, '#fed330', 6);
            }
            return true;
        }
        if (this.has('evil_eye_ward') && s.evilEyeReady) {
            s.evilEyeReady = false;
            s.evilEyeTimer = 0;
            player.invulnerableTimer = 30;
            if (effects) {
                effects.addComicSplash(player.x, player.y - 28, '🧿 WARD BLOCKED!');
                effects.addShockwave(player.x, player.y, 90, 'rgba(155, 89, 182, 0.85)');
            }
            return true;
        }
        return false;
    }

    static absorbBarrier(player, actualDamage, effects) {
        if (!player || !(player.aegisBarrier > 0)) return actualDamage;
        const absorbed = Math.min(player.aegisBarrier, actualDamage);
        player.aegisBarrier -= absorbed;
        if (effects && absorbed > 0) {
            effects.addPopup(player.x, player.y - 18, `🛡️ -${absorbed}`, '#f39c12', 20);
        }
        return Math.max(0, actualDamage - absorbed);
    }

    static tryPreventFatalHit(player, effects) {
        const s = this._ensureState(player);
        if (this.has('blessed_shield') && !s.aegisFatalUsed && player.hp <= 0) {
            s.aegisFatalUsed = true;
            player.hp = 1;
            player.invulnerableTimer = 120;
            if (effects) {
                effects.addComicSplash(player.x, player.y - 40, '🛡️ AEGIS REVIVE!');
                effects.addShockwave(player.x, player.y, 145, 'rgba(243, 156, 18, 0.95)');
                effects.addSparks(player.x, player.y, '#fed330', 14);
            }
            return true;
        }
        return false;
    }

    static onPlayerDamaged(player, actualDamage, effects, game) {
        const s = this._ensureState(player);
        if (this.has('shock_absorber')) {
            s.shockAbsorberTimer = 120;
            if (effects) effects.addComicSplash(player.x, player.y - 34, '⚡ +25% SPEED!');
        }
        if (this.has('stormborn_aegis')) {
            const awakened = this.isAwakenedStormborn();
            this._triggerRadialStomp(
                player,
                game ? game.enemies : [],
                effects,
                awakened ? 240 : 190,
                (awakened ? 105 : 65) * (player.damageMultiplier || 1),
                awakened ? 48 : 36,
                awakened ? '⚡ AWAKENED STORMBORN AEGIS!' : '⚡ STORMBORN AEGIS!',
                awakened ? '#fbbf24' : '#00f5ff'
            );
        }
        if (this.has('hot_coals') && game && Array.isArray(game.enemies)) {
            const coalDmg = Math.round(25 * (player.damageMultiplier || 1));
            for (let i = 0; i < game.enemies.length; i++) {
                const e = game.enemies[i];
                if (!e || e.dead || e.isDying) continue;
                const d = Math.hypot(e.x - player.x, e.y - player.y);
                if (d <= 130 + (e.radius || 20)) {
                    const ang = Math.atan2(e.y - player.y, e.x - player.x);
                    e.x += Math.cos(ang) * 28;
                    e.y += Math.sin(ang) * 28;
                    if (typeof e.takeDamage === 'function') e.takeDamage(coalDmg, effects, false);
                    if (game.isCoopGuest) e.dead = false;
                    if (effects) effects.addSparks(e.x, e.y, '#ff6348', 5);
                }
            }
            if (effects) {
                effects.addShockwave(player.x, player.y, 130, 'rgba(255, 99, 72, 0.85)');
                effects.addComicSplash(player.x, player.y - 46, '🔥 HOT COALS!');
            }
        }
    }

    static onBulletHit(bullet, targetEnemy, damageDealt, enemies, effects, game) {
        if (!bullet || !targetEnemy) return;
        const player = game ? game.player : bullet.shooter;

        // Bolt of Criticism: 20% chance on crit to lightning bolt target
        if (bullet.isCrit && this.has('bolt_of_criticism') && Math.random() < 0.20) {
            const boltDmg = Math.max(8, Math.round(damageDealt * 0.35));
            if (typeof targetEnemy.takeDamage === 'function') targetEnemy.takeDamage(boltDmg, effects, false);
            if (game && game.isCoopGuest) targetEnemy.dead = false;
            if (effects) {
                effects.addLightningChain(player ? player.x : targetEnemy.x, (player ? player.y : targetEnemy.y) - 40, targetEnemy.x, targetEnemy.y, '#f39c12');
                effects.addComicSplash(targetEnemy.x, targetEnemy.y - 32, '👑 CRIT BOLT!');
            }
            if (typeof CoopCombatFx !== 'undefined') CoopCombatFx.relayChain(bullet.shooter, player ? player.x : targetEnemy.x, (player ? player.y : targetEnemy.y) - 40, targetEnemy.x, targetEnemy.y, '#f39c12');
        }

        // Chain Shock: 15% chance on hit to arc lightning to 2 nearby enemies for 40% dmg
        if (this.has('chain_shock') && Array.isArray(enemies) && Math.random() < 0.15) {
            let lastX = targetEnemy.x, lastY = targetEnemy.y, jumps = 0;
            const visited = new Set([targetEnemy]);
            for (let step = 0; step < 2; step++) {
                let best = null, bestSq = 240 * 240;
                for (let i = 0; i < enemies.length; i++) {
                    const cand = enemies[i];
                    if (!cand || cand.dead || cand.isDying || cand.isAirborneImmune || visited.has(cand)) continue;
                    const dSq = (cand.x - lastX) ** 2 + (cand.y - lastY) ** 2;
                    if (dSq < bestSq) { bestSq = dSq; best = cand; }
                }
                if (!best) break;
                visited.add(best);
                jumps++;
                if (typeof best.takeDamage === 'function') best.takeDamage(Math.max(4, Math.round(damageDealt * 0.40)), effects, false);
                if (game && game.isCoopGuest) best.dead = false;
                if (effects) effects.addLightningChain(lastX, lastY, best.x, best.y, '#feca57');
                if (typeof CoopCombatFx !== 'undefined') CoopCombatFx.relayChain(bullet.shooter, lastX, lastY, best.x, best.y, '#feca57');
                lastX = best.x; lastY = best.y;
            }
            if (jumps > 0 && effects) effects.addComicSplash(targetEnemy.x, targetEnemy.y - 26, '⚡ CHAIN SHOCK!');
        }

        // Too Hot to Handle: oversized explosive 8th shot AoE
        if (bullet.isExplosiveMitts && Array.isArray(enemies)) {
            const blastDmg = Math.max(10, Math.round(damageDealt * 0.50));
            for (let i = 0; i < enemies.length; i++) {
                const e = enemies[i];
                if (!e || e.dead || e.isDying || e.isAirborneImmune || e === targetEnemy) continue;
                if (Math.hypot(e.x - bullet.x, e.y - bullet.y) <= 95 + (e.radius || 20)) {
                    if (typeof e.takeDamage === 'function') e.takeDamage(blastDmg, effects, false);
                    if (game && game.isCoopGuest) e.dead = false;
                }
            }
            if (effects) {
                effects.addShockwave(bullet.x, bullet.y, 95, 'rgba(255, 159, 67, 0.9)');
                effects.addSparks(bullet.x, bullet.y, '#ff9f43', 10);
            }
        }
    }

    static onEnemyKilled(player, enemy, game) {
        if (!player || !this.has('encore')) return;
        const s = this._ensureState(player);
        s.killCount = (s.killCount || 0) + 1;
        if (s.killCount % 15 === 0) {
            player.heal(4);
            const effects = game ? game.effects : null;
            const enemies = game ? game.enemies : [];
            this._triggerRadialStomp(player, enemies, effects, 165, 45 * (player.damageMultiplier || 1), 0, '🎩 ENCORE +4 HP!', '#f39c12');
        }
    }

    static onWaveCleared(game) {
        if (!game || !this.has('lucky_roll')) return;
        if (Array.isArray(game.drops)) {
            for (let i = 0; i < game.drops.length; i++) {
                game.drops[i].magnetized = true;
            }
        }
        if (game.effects && game.player) {
            game.effects.addComicSplash(game.player.x, game.player.y - 50, '🎲 LUCKY ROLL MAGNET!');
        }
    }

    static _triggerRadialStomp(player, enemies, effects, radius, damage, stunFrames, label, color) {
        if (Array.isArray(enemies)) {
            const dmg = Math.round(damage);
            for (let i = 0; i < enemies.length; i++) {
                const e = enemies[i];
                if (!e || e.dead || e.isDying || e.isAirborneImmune) continue;
                const d = Math.hypot(e.x - player.x, e.y - player.y);
                if (d <= radius + (e.radius || 20)) {
                    if (dmg > 0 && typeof e.takeDamage === 'function') e.takeDamage(dmg, effects, false);
                    if (!e.isStationary) {
                        if (stunFrames > 0) e.stunTimer = Math.max(e.stunTimer || 0, stunFrames);
                        const ang = Math.atan2(e.y - player.y, e.x - player.x);
                        e.x += Math.cos(ang) * 24;
                        e.y += Math.sin(ang) * 24;
                    }
                    if (effects) effects.addSparks(e.x, e.y, color, 4);
                }
            }
        }
        if (effects) {
            effects.addShockwave(player.x, player.y, radius, color);
            effects.addComicSplash(player.x, player.y - 38, label);
        }
    }
}

if (typeof window !== 'undefined') {
    window.GearPassives = GearPassives;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GearPassives };
}
