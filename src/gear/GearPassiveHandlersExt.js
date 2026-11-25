/**
 * Lesa.io - Mythic Chest Gear Signature Passives Extension
 * Handles combat mechanics for all 10 Mythic chest-obtainable gear pieces cleanly.
 */

class GearPassiveHandlersExt {
    static has(passiveId) {
        return typeof GearPassives !== 'undefined' && GearPassives.has(passiveId);
    }

    static initState(s) {
        if (!s) return;
        s.oracleSpeedTimer = 0;
        s.phoenixBuffTimer = 0;
        s.hermesBuffTimer = 0;
        s.valkyrieHitCount = 0;
        s.valkyrieSpeedTimer = 0;
        s.aresKillCount = 0;
    }

    static updateTimers(dt, s) {
        if (!s) return;
        if (s.oracleSpeedTimer > 0) s.oracleSpeedTimer = Math.max(0, s.oracleSpeedTimer - dt);
        if (s.phoenixBuffTimer > 0) s.phoenixBuffTimer = Math.max(0, s.phoenixBuffTimer - dt);
        if (s.hermesBuffTimer > 0) s.hermesBuffTimer = Math.max(0, s.hermesBuffTimer - dt);
        if (s.valkyrieSpeedTimer > 0) s.valkyrieSpeedTimer = Math.max(0, s.valkyrieSpeedTimer - dt);
    }

    static getSpeedBonusMult(player) {
        const s = player && player._gearPassiveState;
        if (!s) return 1.0;
        let m = 1.0;
        if (s.oracleSpeedTimer > 0) m *= 1.12;
        if (s.hermesBuffTimer > 0) m *= 1.18;
        if (s.valkyrieSpeedTimer > 0) m *= 1.16;
        return m;
    }

    static getFireRateBonusMult(player) {
        const s = player && player._gearPassiveState;
        return (s && s.hermesBuffTimer > 0) ? 1.12 : 1.0;
    }

    static getCritBonus(player) {
        const s = player && player._gearPassiveState;
        return (s && s.phoenixBuffTimer > 0) ? 0.15 : 0;
    }

    static getDamageMult(player, targetEnemy, isCrit, isBossOrElite) {
        const s = player && player._gearPassiveState;
        let m = 1.0;
        if (s && s.phoenixBuffTimer > 0) m *= 1.18;
        if (isCrit && isBossOrElite && this.has('oracle_foreshadow')) m *= 1.28;
        if (targetEnemy && (targetEnemy.isBoss || targetEnemy.isMiniBoss) && this.has('abyssal_surge')) m *= 1.14;
        return m;
    }

    static isSlowImmune() {
        return this.has('zephyr_tailwind');
    }

    static getMoveDashRate() {
        return this.has('stygian_tremor') ? 0.25 : 0;
    }

    static tryAvoidHit(player, effects) {
        if (this.has('zephyr_tailwind') && player.isMoving && Math.random() < 0.14) {
            player.invulnerableTimer = 18;
            if (effects) effects.addComicSplash(player.x, player.y - 25, '💨 ZEPHYR DODGE!');
            return true;
        }
        return false;
    }

    static getBarrierSpec() {
        if (this.has('chronos_bulwark')) {
            return { cap: 50, period: 600, rad: 92, col: 'rgba(192, 132, 252, 0.88)', msg: '⏳ CHRONOS BARRIER +50!' };
        }
        return null;
    }

    static onDash(player, s, effects) {
        const g = typeof window !== 'undefined' ? window.gameInstance : null;
        const enemies = g ? g.enemies : [];
        if (this.has('phoenix_wake')) {
            s.phoenixBuffTimer = 120;
            if (typeof GearPassives !== 'undefined') {
                GearPassives._triggerRadialStomp(player, enemies, effects, 145, 60 * (player.damageMultiplier || 1), 0, '🔥 PHOENIX WAKE +18% DMG!', '#f97316');
            }
        }
        if (this.has('quicksilver_magnet')) {
            s.hermesBuffTimer = 120;
            if (g && Array.isArray(g.drops)) {
                for (let i = 0; i < g.drops.length; i++) {
                    if (Math.hypot(g.drops[i].x - player.x, g.drops[i].y - player.y) <= 320) g.drops[i].magnetized = true;
                }
            }
            if (effects) effects.addComicSplash(player.x, player.y - 46, '🪽 QUICKSILVER SWEEP!');
        }
        if (this.has('zephyr_tailwind')) {
            player.invulnerableTimer = Math.max(player.invulnerableTimer || 0, 36);
            if (typeof GearPassives !== 'undefined') {
                GearPassives._triggerRadialStomp(player, enemies, effects, 165, 42 * (player.damageMultiplier || 1), 24, '💨 ZEPHYR GALE!', '#fbbf24');
            }
        }
    }

    static onDashLand(player, effects, game) {
        if (!this.has('stygian_tremor') || typeof GearPassives === 'undefined') return;
        const enemies = game ? game.enemies : [];
        GearPassives._triggerRadialStomp(player, enemies, effects, 175, 46 * (player.damageMultiplier || 1), 51, '🥾 STYGIAN QUAKE!', '#e74c3c');
    }

    static onShoot(player, s, bullets, effects) {
        if (this.has('oracle_foreshadow') && (s.shotCount || 0) % 4 === 0) {
            for (let i = 0; i < bullets.length; i++) {
                if (!bullets[i].isCrit) {
                    bullets[i].isCrit = true;
                    bullets[i].damage = Math.round((bullets[i].damage || 25) * (player.critMultiplier || 2.0));
                }
            }
            if (effects) effects.addComicSplash(player.x, player.y - 40, '🔮 ORACLE CRIT!');
        }
        if (this.has('valkyrie_siphon') && (s.shotCount || 0) % 6 === 0 && bullets[0]) {
            bullets[0].pierce = (bullets[0].pierce || 1) + 2;
            bullets[0].damage = Math.round((bullets[0].damage || 25) * 1.40);
            if (effects) effects.addComicSplash(player.x, player.y - 36, '🩸 CRIMSON LANCE!');
        }
        if (this.has('forgefire_arc') && (s.shotCount || 0) % 7 === 0 && bullets[0]) {
            bullets[0].isExplosiveMitts = true;
            bullets[0].radius = Math.round((bullets[0].radius || 8) * 1.5);
            bullets[0].damage = Math.round((bullets[0].damage || 25) * 1.45);
            if (effects) effects.addComicSplash(player.x, player.y - 36, '⚡ FORGEFIRE BLAST!');
        }
    }

    static onPlayerDamaged(player, effects, game) {
        const enemies = game && Array.isArray(game.enemies) ? game.enemies : [];
        if (this.has('chronos_bulwark') && enemies.length > 0) {
            const pulseDmg = Math.round(45 * (player.damageMultiplier || 1));
            for (let i = 0; i < enemies.length; i++) {
                const e = enemies[i];
                if (!e || e.dead || e.isDying || e.isAirborneImmune) continue;
                if (Math.hypot(e.x - player.x, e.y - player.y) <= 165 + (e.radius || 20)) {
                    e.slowTimer = Math.max(e.slowTimer || 0, 150);
                    e.slowFactor = Math.min(e.slowFactor || 1, 0.55);
                    if (typeof e.takeDamage === 'function') e.takeDamage(pulseDmg, effects, false);
                    if (game.isCoopGuest) e.dead = false;
                }
            }
            if (effects) effects.addShockwave(player.x, player.y, 165, 'rgba(192, 132, 252, 0.85)');
        }
        if (this.has('abyssal_surge') && typeof GearPassives !== 'undefined') {
            GearPassives._triggerRadialStomp(player, enemies, effects, 175, 58 * (player.damageMultiplier || 1), 36, '🔱 ABYSSAL RIPTIDE!', '#00f5ff');
        }
    }

    static onBulletHit(bullet, targetEnemy, damageDealt, enemies, player, s, effects, game) {
        if (!player || !s) return;
        if (bullet.isCrit && this.has('oracle_foreshadow')) s.oracleSpeedTimer = 90;

        if (bullet.isCrit && this.has('warlord_frenzy') && Array.isArray(enemies)) {
            const cleaveDmg = Math.max(8, Math.round(damageDealt * 0.38));
            for (let i = 0; i < enemies.length; i++) {
                const e = enemies[i];
                if (!e || e === targetEnemy || e.dead || e.isDying || e.isAirborneImmune) continue;
                if (Math.hypot(e.x - targetEnemy.x, e.y - targetEnemy.y) <= 110 + (e.radius || 20)) {
                    if (typeof e.takeDamage === 'function') e.takeDamage(cleaveDmg, effects, false);
                    if (game && game.isCoopGuest) e.dead = false;
                }
            }
            if (effects) effects.addSparks(targetEnemy.x, targetEnemy.y, '#ef4444', 5);
        }

        if (this.has('forgefire_arc') && Array.isArray(enemies) && Math.random() < 0.16 && typeof GearPassives !== 'undefined') {
            GearPassives._arcChainLightning(bullet, targetEnemy, Math.max(6, Math.round(damageDealt * 0.42)), '#f59e0b', '⚡ FORGEFIRE ARC!', enemies, effects, game);
        }

        if (this.has('valkyrie_siphon')) {
            s.valkyrieHitCount = (s.valkyrieHitCount || 0) + 1;
            if (s.valkyrieHitCount % 10 === 0) {
                if (typeof player.heal === 'function') player.heal(4);
                s.valkyrieSpeedTimer = 90;
                if (effects) effects.addComicSplash(player.x, player.y - 34, '🩸 +4 HP SIPHON!');
            }
        }
    }

    static onEnemyKilled(player, s, game) {
        if (!this.has('warlord_frenzy') || !player || !s) return;
        s.aresKillCount = (s.aresKillCount || 0) + 1;
        if (s.aresKillCount % 18 === 0 && typeof GearPassives !== 'undefined') {
            player.heal(5);
            GearPassives._triggerRadialStomp(player, game ? game.enemies : [], game ? game.effects : null, 175, 55 * (player.damageMultiplier || 1), 24, '⚔️ WARLORD +5 HP!', '#ef4444');
        }
    }
}

if (typeof window !== 'undefined') window.GearPassiveHandlersExt = GearPassiveHandlersExt;
if (typeof module !== 'undefined' && module.exports) module.exports = { GearPassiveHandlersExt };
