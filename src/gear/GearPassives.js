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
            ruinBuffTimer: 0,
            shockAbsorberTimer: 0,
            throttleStacks: 0,
            throttleDecayTimer: 0,
            dashCount: 0,
            shotCount: 0,
            killCount: 0,
            wasDashing: false,
            sonicDashHitSet: null
        };
        if (typeof GearPassiveHandlersExt !== 'undefined') GearPassiveHandlersExt.initState(player._gearPassiveState);
        player.aegisBarrier = this.has('omega_aegis_barrier') ? 95 : (this.has('blessed_shield') ? 30 : 0);
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
        return this.has('sure_footed') || this.has('eclipse_phase_step') || (typeof GearPassiveHandlersExt !== 'undefined' && GearPassiveHandlersExt.isSlowImmune());
    }

    static getSpeedMultiplier(player) {
        const s = player && player._gearPassiveState;
        let m = (s && s.shockAbsorberTimer > 0) ? 1.25 : 1.0;
        if (typeof GearPassiveHandlersExt !== 'undefined') m *= GearPassiveHandlersExt.getSpeedBonusMult(player);
        return m;
    }

    static getFireRateMultiplier(player) {
        const s = player && player._gearPassiveState;
        if (!s) return 1.0;
        let mult = 1.0;
        if (s.steadyRhythmTimer > 0) mult *= 1.12;
        if (s.ruinBuffTimer > 0) mult *= 1.12;
        if (this.has('throttle_grip') && s.throttleStacks > 0) {
            mult *= (1 + s.throttleStacks * 0.02);
        }
        if (typeof GearPassiveHandlersExt !== 'undefined') mult *= GearPassiveHandlersExt.getFireRateBonusMult(player);
        return mult;
    }

    static getCritBonus(player) {
        const s = player && player._gearPassiveState;
        if (!s) return 0;
        const extCrit = (typeof GearPassiveHandlersExt !== 'undefined') ? GearPassiveHandlersExt.getCritBonus(player) : 0;
        return (s.sonicCritTimer > 0 ? 0.20 : 0) + (s.ruinBuffTimer > 0 ? 0.22 : 0) + extCrit;
    }

    static getDamageMultiplier(player, targetEnemy, isCrit = false) {
        let mult = 1.0;
        const isBossOrElite = this._isBossOrElite(targetEnemy);
        if (isCrit && isBossOrElite && this.has('sharp_focus')) mult *= 1.15;
        if (isCrit && isBossOrElite && this.has('sovereign_execution')) mult *= 1.22;
        if (targetEnemy && (targetEnemy.isBoss || targetEnemy.isMiniBoss)) {
            if (this.has('charcoal_aura')) mult *= 1.15;
            if (this.has('omega_aegis_barrier')) mult *= 1.18;
        }
        if (typeof GearPassiveHandlersExt !== 'undefined') {
            mult *= GearPassiveHandlersExt.getDamageMult(player, targetEnemy, isCrit, isBossOrElite);
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
        if (s.ruinBuffTimer > 0) s.ruinBuffTimer = Math.max(0, s.ruinBuffTimer - dt);
        if (s.shockAbsorberTimer > 0) s.shockAbsorberTimer = Math.max(0, s.shockAbsorberTimer - dt);
        if (typeof GearPassiveHandlersExt !== 'undefined') GearPassiveHandlersExt.updateTimers(dt, s);
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

        // Omega Eclipse (95 HP / 7s), Stormborn Aegis (45 HP / 10s, or Awakened 75 HP / 8s), Chronos (50 HP / 10s), or Blessed Shield (30 HP / 12s)
        const hasOmegaBarrier = this.has('omega_aegis_barrier');
        const hasStormBarrier = this.has('stormborn_aegis');
        const awakenedStorm = hasStormBarrier && this.isAwakenedStormborn();
        const hasBlessedBarrier = this.has('blessed_shield');
        const extBarrier = (typeof GearPassiveHandlersExt !== 'undefined') ? GearPassiveHandlersExt.getBarrierSpec() : null;
        if (hasOmegaBarrier || hasStormBarrier || hasBlessedBarrier || extBarrier) {
            const barrierCap = hasOmegaBarrier ? 95 : (awakenedStorm ? 75 : (extBarrier ? extBarrier.cap : (hasStormBarrier ? 45 : 30)));
            const barrierPeriod = hasOmegaBarrier ? 420 : (awakenedStorm ? 480 : ((hasStormBarrier || extBarrier) ? 600 : 720));
            if ((player.aegisBarrier || 0) < barrierCap) {
                s.aegisShieldTimer += dt;
                if (s.aegisShieldTimer >= barrierPeriod) {
                    s.aegisShieldTimer = 0;
                    player.aegisBarrier = barrierCap;
                    if (effects) {
                        const rCol = hasOmegaBarrier ? 'rgba(255, 46, 76, 0.92)' : (awakenedStorm ? 'rgba(251, 191, 36, 0.9)' : (extBarrier ? extBarrier.col : (hasStormBarrier ? 'rgba(0, 245, 255, 0.85)' : 'rgba(243, 156, 18, 0.75)')));
                        const rRad = hasOmegaBarrier ? 106 : (awakenedStorm ? 98 : (extBarrier ? extBarrier.rad : (hasStormBarrier ? 85 : 70)));
                        const rMsg = hasOmegaBarrier ? '♦️ OMEGA BARRIER +95!' : (awakenedStorm ? '⚡ AWAKENED BARRIER +75!' : (extBarrier ? extBarrier.msg : (hasStormBarrier ? '⚡ STORM BARRIER +45!' : '🛡️ AEGIS +30!')));
                        effects.addShockwave(player.x, player.y, rRad, rCol);
                        effects.addComicSplash(player.x, player.y - 36, rMsg);
                        if (typeof CoopCombatFx !== 'undefined') CoopCombatFx.relayRing(player, rRad, rCol, rMsg);
                    }
                }
            }
        } else {
            player.aegisBarrier = 0;
        }

        // Faster dash recharge while moving
        const extDashRate = (typeof GearPassiveHandlersExt !== 'undefined') ? GearPassiveHandlersExt.getMoveDashRate() : 0;
        const moveDashRate = Math.max(this.has('eclipse_phase_step') ? 0.30 : (this.has('untouchable_stride') ? 0.25 : 0), extDashRate);
        if (moveDashRate > 0 && player.isMoving && player.dashCooldown > 0) {
            player.dashCooldown = Math.max(0, player.dashCooldown - moveDashRate * dt);
        }

        // Sonic Slipstream / Ruin Slipstream: deal damage while dashing through enemies
        const hasRuinSlip = this.has('ruin_slipstream');
        const hasSonicSlip = this.has('sonic_slipstream');
        if (player.isDashing && (hasRuinSlip || hasSonicSlip) && enemies.length > 0) {
            if (!s.sonicDashHitSet) s.sonicDashHitSet = new Set();
            const slipDmg = Math.round((hasRuinSlip ? 55 : 35) * (player.damageMultiplier || 1));
            const slipCol = hasRuinSlip ? '#ff2e4c' : '#fed330';
            const reach = (player.radius || 22) + (hasRuinSlip ? 26 : 18);
            const visitSlip = (e) => {
                if (!e || e.dead || e.isDying || s.sonicDashHitSet.has(e)) return;
                if (Math.hypot(e.x - player.x, e.y - player.y) <= reach + (e.radius || 22)) {
                    s.sonicDashHitSet.add(e);
                    if (typeof e.takeDamage === 'function') e.takeDamage(slipDmg, effects, false);
                    if (effects) effects.addSparks(e.x, e.y, slipCol, 6);
                }
            };
            if (typeof SpatialHashGrid !== 'undefined') SpatialHashGrid.forEachEnemyNear(player.x, player.y, reach, enemies, visitSlip);
            else for (let i = 0; i < enemies.length; i++) visitSlip(enemies[i]);
        }

        if (s.wasDashing && !player.isDashing) {
            if (this.has('eclipse_phase_step') || this.has('seismic_step')) {
                const isEclipse = this.has('eclipse_phase_step');
                const stompRad = isEclipse ? 180 : 160;
                const stompDmg = (isEclipse ? 48 : 32) * (player.damageMultiplier || 1);
                const stompStun = isEclipse ? 54 : 48;
                const stompLbl = isEclipse ? '🌑 ECLIPSE QUAKE!' : '🥾 SEISMIC STEP!';
                const stompCol = isEclipse ? '#ff2e4c' : '#e67e22';
                this._triggerRadialStomp(player, enemies, effects, stompRad, stompDmg, stompStun, stompLbl, stompCol);
                if (typeof CoopCombatFx !== 'undefined') CoopCombatFx.relayRing(player, stompRad, stompCol, stompLbl);
            }
            if (typeof GearPassiveHandlersExt !== 'undefined') GearPassiveHandlersExt.onDashLand(player, effects, game);
        }
        s.wasDashing = !!player.isDashing;

        // Charcoal Aura: periodically scorch nearby enemies every 1.5s (90 frames)
        if (this.has('charcoal_aura') && enemies.length > 0) {
            s.charcoalTimer -= dt;
            if (s.charcoalTimer <= 0) {
                s.charcoalTimer = 90;
                const burnDmg = Math.round(18 * (player.damageMultiplier || 1));
                let scorchedAny = false;
                const visitBurn = (e) => {
                    if (!e || e.dead || e.isDying) return;
                    if (Math.hypot(e.x - player.x, e.y - player.y) <= 155 + (e.radius || 20)) {
                        scorchedAny = true;
                        if (typeof e.takeDamage === 'function') e.takeDamage(burnDmg, effects, false);
                        if (effects) effects.addSparks(e.x, e.y, '#ff6b35', 4);
                    }
                };
                if (typeof SpatialHashGrid !== 'undefined') SpatialHashGrid.forEachEnemyNear(player.x, player.y, 155, enemies, visitBurn);
                else for (let i = 0; i < enemies.length; i++) visitBurn(enemies[i]);
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
        if (this.has('ruin_slipstream')) {
            s.ruinBuffTimer = 120;
            const g = typeof window !== 'undefined' ? window.gameInstance : null;
            if (g && Array.isArray(g.drops)) {
                for (let i = 0; i < g.drops.length; i++) {
                    if (Math.hypot(g.drops[i].x - player.x, g.drops[i].y - player.y) <= 340) g.drops[i].magnetized = true;
                }
            }
            if (effects) effects.addComicSplash(player.x, player.y - 56, '♦️ RUIN SLIPSTREAM!');
        }
        if (this.has('double_sixes') && s.dashCount % 6 === 0) {
            const game = typeof window !== 'undefined' ? window.gameInstance : null;
            this._triggerRadialStomp(player, game ? game.enemies : [], effects, 165, 30 * (player.damageMultiplier || 1), 50, '🎲 DOUBLE SIXES!', '#9b59b6');
            if (typeof CoopCombatFx !== 'undefined') CoopCombatFx.relayRing(player, 165, '#9b59b6', '🎲 DOUBLE SIXES!');
        }
        if (typeof GearPassiveHandlersExt !== 'undefined') GearPassiveHandlersExt.onDash(player, s, effects);
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
        if (this.has('pylon_overload') && s.shotCount % 6 === 0) {
            const lead = bullets[0];
            lead.isPylonOvercharge = true;
            lead.radius = Math.round((lead.radius || 8) * 1.55);
            lead.pierce = (lead.pierce || 1) + 1;
            lead.damage = Math.round((lead.damage || 25) * 1.45);
            if (effects) effects.addComicSplash(player.x, player.y - 38, '🔺 OVERCHARGE!');
        }
        if (typeof GearPassiveHandlersExt !== 'undefined') GearPassiveHandlersExt.onShoot(player, s, bullets, effects);
    }

    static tryAvoidHit(player, effects) {
        const s = this._ensureState(player);
        const dodgeChance = this.has('eclipse_phase_step') ? 0.18 : (this.has('untouchable_stride') ? 0.15 : 0);
        if (dodgeChance > 0 && player.isMoving && Math.random() < dodgeChance) {
            player.invulnerableTimer = 18;
            if (effects) {
                effects.addComicSplash(player.x, player.y - 25, this.has('eclipse_phase_step') ? '🌑 ECLIPSE DODGE!' : '🪽 DODGED!');
                effects.addSparks(player.x, player.y, this.has('eclipse_phase_step') ? '#ff2e4c' : '#fed330', 6);
            }
            return true;
        }
        if (typeof GearPassiveHandlersExt !== 'undefined' && GearPassiveHandlersExt.tryAvoidHit(player, effects)) return true;
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
        const hasOmegaSave = this.has('omega_aegis_barrier');
        if ((hasOmegaSave || this.has('blessed_shield')) && !s.aegisFatalUsed && player.hp <= 0) {
            s.aegisFatalUsed = true;
            player.hp = 1;
            player.invulnerableTimer = 120;
            if (effects) {
                effects.addComicSplash(player.x, player.y - 40, hasOmegaSave ? '♦️ OMEGA REVIVE!' : '🛡️ AEGIS REVIVE!');
                effects.addShockwave(player.x, player.y, 165, hasOmegaSave ? 'rgba(255, 46, 76, 0.95)' : 'rgba(243, 156, 18, 0.95)');
                effects.addSparks(player.x, player.y, hasOmegaSave ? '#ff2e4c' : '#fed330', 14);
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
        if (this.has('omega_aegis_barrier')) {
            this._triggerRadialStomp(player, game ? game.enemies : [], effects, 225, 110 * (player.damageMultiplier || 1), 45, '♦️ OMEGA ECLIPSE BLAST!', '#ff2e4c');
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
            const visitCoals = (e) => {
                if (!e || e.dead || e.isDying) return;
                if (Math.hypot(e.x - player.x, e.y - player.y) <= 130 + (e.radius || 20)) {
                    const ang = Math.atan2(e.y - player.y, e.x - player.x);
                    e.x += Math.cos(ang) * 28; e.y += Math.sin(ang) * 28;
                    if (typeof e.takeDamage === 'function') e.takeDamage(coalDmg, effects, false);
                    if (game.isCoopGuest) e.dead = false;
                    if (effects) effects.addSparks(e.x, e.y, '#ff6348', 5);
                }
            };
            if (typeof SpatialHashGrid !== 'undefined') SpatialHashGrid.forEachEnemyNear(player.x, player.y, 130, game.enemies, visitCoals);
            else for (let i = 0; i < game.enemies.length; i++) visitCoals(game.enemies[i]);
            if (effects) {
                effects.addShockwave(player.x, player.y, 130, 'rgba(255, 99, 72, 0.85)');
                effects.addComicSplash(player.x, player.y - 46, '🔥 HOT COALS!');
            }
        }
        if (typeof GearPassiveHandlersExt !== 'undefined') GearPassiveHandlersExt.onPlayerDamaged(player, effects, game);
    }

    static onBulletHit(bullet, targetEnemy, damageDealt, enemies, effects, game) {
        if (!bullet || !targetEnemy) return;
        const player = game ? game.player : bullet.shooter;

        // Sovereign Execution / Bolt of Criticism: crit lightning smite
        if (bullet.isCrit && this.has('sovereign_execution') && Math.random() < 0.22) {
            this._strikeCritSmite(bullet, targetEnemy, player, Math.max(12, Math.round(damageDealt * 0.42)), '#ff2e4c', '👑 EXECUTION SMITE!', effects, game);
        } else if (bullet.isCrit && this.has('bolt_of_criticism') && Math.random() < 0.20) {
            this._strikeCritSmite(bullet, targetEnemy, player, Math.max(8, Math.round(damageDealt * 0.35)), '#f39c12', '👑 CRIT BOLT!', effects, game);
        }

        // Pylon Overload / Chain Shock: arc lightning to 2 nearby enemies
        if (Array.isArray(enemies)) {
            if (this.has('pylon_overload') && Math.random() < 0.18) {
                this._arcChainLightning(bullet, targetEnemy, Math.max(6, Math.round(damageDealt * 0.48)), '#ff2e4c', '🔺 PYLON ARC!', enemies, effects, game);
            } else if (this.has('chain_shock') && Math.random() < 0.15) {
                this._arcChainLightning(bullet, targetEnemy, Math.max(4, Math.round(damageDealt * 0.40)), '#feca57', '⚡ CHAIN SHOCK!', enemies, effects, game);
            }
        }

        // Too Hot to Handle / Pylon Overload explosive overcharge AoE
        if (Array.isArray(enemies) && (bullet.isPylonOvercharge || bullet.isExplosiveMitts)) {
            const isOvercharge = !!bullet.isPylonOvercharge;
            this._triggerBulletBlast(bullet, targetEnemy, Math.max(12, Math.round(damageDealt * (isOvercharge ? 0.58 : 0.50))), isOvercharge ? 110 : 95, isOvercharge ? '#ff2e4c' : '#ff9f43', enemies, effects, game);
        }
        if (typeof GearPassiveHandlersExt !== 'undefined' && player) {
            GearPassiveHandlersExt.onBulletHit(bullet, targetEnemy, damageDealt, enemies, player, this._ensureState(player), effects, game);
        }
    }

    static _strikeCritSmite(bullet, targetEnemy, player, dmg, color, label, effects, game) {
        if (typeof targetEnemy.takeDamage === 'function') targetEnemy.takeDamage(dmg, effects, false);
        if (game && game.isCoopGuest) targetEnemy.dead = false;
        const sx = player ? player.x : targetEnemy.x, sy = (player ? player.y : targetEnemy.y) - 40;
        if (effects) {
            effects.addLightningChain(sx, sy, targetEnemy.x, targetEnemy.y, color);
            effects.addComicSplash(targetEnemy.x, targetEnemy.y - 32, label);
        }
        if (typeof CoopCombatFx !== 'undefined') CoopCombatFx.relayChain(bullet.shooter, sx, sy, targetEnemy.x, targetEnemy.y, color);
    }

    static _arcChainLightning(bullet, targetEnemy, jumpDmg, color, label, enemies, effects, game) {
        let lastX = targetEnemy.x, lastY = targetEnemy.y, jumps = 0;
        const visited = new Set([targetEnemy]);
        for (let step = 0; step < 2; step++) {
            let best = null, bestSq = 250 * 250;
            const pick = (cand) => {
                if (!cand || cand.dead || cand.isDying || cand.isAirborneImmune || visited.has(cand)) return;
                const dSq = (cand.x - lastX) ** 2 + (cand.y - lastY) ** 2;
                if (dSq < bestSq) { bestSq = dSq; best = cand; }
            };
            if (typeof SpatialHashGrid !== 'undefined') SpatialHashGrid.forEachEnemyNear(lastX, lastY, 250, enemies, pick);
            else for (let i = 0; i < enemies.length; i++) pick(enemies[i]);
            if (!best) break;
            visited.add(best);
            jumps++;
            if (typeof best.takeDamage === 'function') best.takeDamage(jumpDmg, effects, false);
            if (game && game.isCoopGuest) best.dead = false;
            if (effects) effects.addLightningChain(lastX, lastY, best.x, best.y, color);
            if (typeof CoopCombatFx !== 'undefined') CoopCombatFx.relayChain(bullet.shooter, lastX, lastY, best.x, best.y, color);
            lastX = best.x; lastY = best.y;
        }
        if (jumps > 0 && effects) effects.addComicSplash(targetEnemy.x, targetEnemy.y - 26, label);
    }

    static _triggerBulletBlast(bullet, targetEnemy, blastDmg, rad, color, enemies, effects, game) {
        const visitBlast = (e) => {
            if (!e || e.dead || e.isDying || e.isAirborneImmune || e === targetEnemy) return;
            if (Math.hypot(e.x - bullet.x, e.y - bullet.y) <= rad + (e.radius || 20)) {
                if (typeof e.takeDamage === 'function') e.takeDamage(blastDmg, effects, false);
                if (game && game.isCoopGuest) e.dead = false;
            }
        };
        if (typeof SpatialHashGrid !== 'undefined') SpatialHashGrid.forEachEnemyNear(bullet.x, bullet.y, rad, enemies, visitBlast);
        else for (let i = 0; i < enemies.length; i++) visitBlast(enemies[i]);
        if (effects) {
            effects.addShockwave(bullet.x, bullet.y, rad, color);
            effects.addSparks(bullet.x, bullet.y, color, 10);
        }
    }

    static onEnemyKilled(player, enemy, game) {
        if (!player) return;
        const s = this._ensureState(player);
        if (typeof GearPassiveHandlersExt !== 'undefined') GearPassiveHandlersExt.onEnemyKilled(player, s, game);
        const hasExec = this.has('sovereign_execution');
        const hasEncore = this.has('encore');
        if (!hasExec && !hasEncore) return;
        s.killCount = (s.killCount || 0) + 1;
        if (s.killCount % 15 === 0) {
            player.heal(hasExec ? 6 : 4);
            const effects = game ? game.effects : null;
            const enemies = game ? game.enemies : [];
            this._triggerRadialStomp(
                player, enemies, effects,
                hasExec ? 185 : 165,
                (hasExec ? 75 : 45) * (player.damageMultiplier || 1),
                0,
                hasExec ? '👑 SOVEREIGN EXECUTION +6 HP!' : '🎩 ENCORE +4 HP!',
                hasExec ? '#ff2e4c' : '#f39c12'
            );
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
            const visitStomp = (e) => {
                if (!e || e.dead || e.isDying || e.isAirborneImmune) return;
                if (Math.hypot(e.x - player.x, e.y - player.y) <= radius + (e.radius || 20)) {
                    if (dmg > 0 && typeof e.takeDamage === 'function') e.takeDamage(dmg, effects, false);
                    if (!e.isStationary) {
                        if (stunFrames > 0) e.stunTimer = Math.max(e.stunTimer || 0, stunFrames);
                        const ang = Math.atan2(e.y - player.y, e.x - player.x);
                        e.x += Math.cos(ang) * 24;
                        e.y += Math.sin(ang) * 24;
                    }
                    if (effects) effects.addSparks(e.x, e.y, color, 4);
                }
            };
            if (typeof SpatialHashGrid !== 'undefined') SpatialHashGrid.forEachEnemyNear(player.x, player.y, radius, enemies, visitStomp);
            else for (let i = 0; i < enemies.length; i++) visitStomp(enemies[i]);
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
