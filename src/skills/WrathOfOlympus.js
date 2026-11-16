/**
 * Lesa.io - Mythic Active Skill: Wrath of Olympus
 * Unlocked on first victory over Zeus (Mount Olympus Floor 5).
 * Calls down targeted sky lightning bolts that damage, stun, and inflict Shock Vulnerability.
 */

class WrathOfOlympusSkill {
    static getLevelConfig(level = 1) {
        const skillData = (typeof SKILLS !== 'undefined' && SKILLS.wrath_of_olympus) ? SKILLS.wrath_of_olympus : null;
        if (skillData && skillData.levels && skillData.levels[level]) {
            return skillData.levels[level];
        }
        const defaults = {
            1: { strikes: 5, damage: 140, radius: 95, stunDuration: 0.8, shockBonus: 0, shockDuration: 0, targetRadius: 360, cooldown: 9.5 },
            2: { strikes: 6, damage: 180, radius: 105, stunDuration: 0.9, shockBonus: 0.12, shockDuration: 3.5, targetRadius: 380, cooldown: 9.5 },
            3: { strikes: 7, damage: 225, radius: 115, stunDuration: 1.1, shockBonus: 0.18, shockDuration: 4.0, targetRadius: 400, cooldown: 9.5 },
            4: { strikes: 8, damage: 280, radius: 125, stunDuration: 1.3, shockBonus: 0.22, shockDuration: 4.5, targetRadius: 420, cooldown: 9.5 },
            5: { strikes: 9, damage: 340, radius: 135, megaDamage: 420, megaRadius: 165, stunDuration: 1.5, shockBonus: 0.25, shockDuration: 5.0, targetRadius: 450, cooldown: 9.5, isMastered: true }
        };
        return defaults[level] || defaults[1];
    }

    static execute(player, level = 1, enemies = [], effects = null, camera = null, game = null) {
        if (!player) return;
        const cfg = this.getLevelConfig(level);
        const cdFrames = Math.round((cfg.cooldown || 9.5) * 60);

        player.skillCooldown = cdFrames;
        player.maxSkillCooldown = cdFrames;
        player.invulnerableTimer = Math.max(player.invulnerableTimer || 0, 48); // 0.8s divine protection

        const dmgMult = player.damageMultiplier || 1;
        const strikeCount = cfg.strikes || 5;
        const targetRadius = cfg.targetRadius || 360;
        const aoeRadius = cfg.radius || 95;
        const strikeDmg = (cfg.damage || 140) * dmgMult;
        const stunSec = cfg.stunDuration || 0.8;
        const shockBonus = cfg.shockBonus || 0;
        const shockDuration = cfg.shockDuration || 0;

        // Pick closest living enemies inside targetRadius so bolts focus real threats first
        const living = [];
        if (Array.isArray(enemies)) {
            for (let i = 0; i < enemies.length; i++) {
                const e = enemies[i];
                if (!e || e.dead || e.isDying || e.isAirborneImmune) continue;
                const d = Math.hypot(e.x - player.x, e.y - player.y);
                if (d <= targetRadius + (e.radius || 0)) {
                    living.push({ enemy: e, dist: d });
                }
            }
            living.sort((a, b) => a.dist - b.dist);
        }

        const strikePoints = [];
        for (let i = 0; i < strikeCount; i++) {
            if (i < living.length) {
                const target = living[i].enemy;
                strikePoints.push({ x: target.x, y: target.y });
            } else if (living.length > 0) {
                const host = living[i % living.length].enemy;
                const ang = Math.random() * Math.PI * 2;
                const jitter = 28 + Math.random() * 55;
                strikePoints.push({ x: host.x + Math.cos(ang) * jitter, y: host.y + Math.sin(ang) * jitter });
            } else {
                const ang = (i / strikeCount) * Math.PI * 2 + Math.random() * 0.4;
                const dist = 85 + Math.random() * (targetRadius * 0.65);
                strikePoints.push({ x: player.x + Math.cos(ang) * dist, y: player.y + Math.sin(ang) * dist });
            }
        }

        const applyBoltImpact = (bx, by, radius, damage, isMega = false) => {
            if (effects) {
                if (typeof effects.addLightningChain === 'function') {
                    effects.addLightningChain(bx + (Math.random() - 0.5) * 26, by - (isMega ? 380 : 320), bx, by, '#fed330');
                    effects.addLightningChain(bx + (isMega ? 10 : 5), by - (isMega ? 360 : 300), bx, by, isMega ? '#ffffff' : '#00f5ff');
                }
                if (typeof effects.addGroundCrack === 'function') {
                    effects.addGroundCrack(bx, by, isMega ? 72 : 42, '#2d2308', 'rgba(0, 245, 255, 0.5)', isMega ? 95 : 65);
                }
                effects.addShockwave(bx, by, radius, isMega ? 'rgba(255, 215, 0, 0.96)' : 'rgba(0, 245, 255, 0.85)');
                effects.addSparks(bx, by, '#fed330', isMega ? 16 : 8);
                effects.addSparks(bx, by, '#00f5ff', isMega ? 12 : 6);
            }

            if (!Array.isArray(enemies)) return;
            const hitSet = new Set();
            for (let j = 0; j < enemies.length; j++) {
                const e = enemies[j];
                if (!e || e.dead || e.isDying || e.isAirborneImmune || hitSet.has(e)) continue;
                const dist = Math.hypot(e.x - bx, e.y - by);
                if (dist <= radius + (e.radius || 0)) {
                    hitSet.add(e);
                    if (typeof e.takeDamage === 'function') {
                        e.takeDamage(damage, effects, isMega || level >= 4);
                    }
                    if (game && game.isCoopGuest) e.dead = false;
                    if (shockBonus > 0 && typeof e.applyShockVulnerability === 'function') {
                        e.applyShockVulnerability(shockDuration, 1 + shockBonus, effects);
                    }
                    if (stunSec > 0 && !e.isStationary && typeof e.applyStun === 'function') {
                        e.applyStun(stunSec, null);
                    }
                }
            }
        };

        for (let i = 0; i < strikePoints.length; i++) {
            const pt = strikePoints[i];
            applyBoltImpact(pt.x, pt.y, aoeRadius, strikeDmg, false);
        }

        // Level 5 Olympian Mastery: Central Mega-Bolt
        if (cfg.megaDamage > 0) {
            const megaX = living.length > 0 ? living[0].enemy.x : player.x + Math.cos(player.angle || 0) * 105;
            const megaY = living.length > 0 ? living[0].enemy.y : player.y + Math.sin(player.angle || 0) * 105;
            applyBoltImpact(megaX, megaY, cfg.megaRadius || 165, cfg.megaDamage * dmgMult, true);
            if (effects) {
                effects.addComicSplash(megaX, megaY - 52, '⚡ OLYMPIAN MEGA-BOLT!', '#fed330', 22, true);
            }
        }

        if (effects) {
            effects.addComicSplash(player.x, player.y - 44, level >= 5 ? '⚡ OLYMPIAN WRATH!' : '⚡ WRATH OF OLYMPUS!', '#fed330', 22, true);
            effects.addShockwave(player.x, player.y, 120, 'rgba(254, 211, 48, 0.85)');
            effects.addSparks(player.x, player.y, '#00f5ff', 14);
        }

        if (camera && typeof camera.shake === 'function') {
            camera.shake(level >= 5 ? 14 : 9 + level, level >= 5 ? 16 : 12);
        }

        if (window.soundEngine) {
            if (typeof window.soundEngine.playCrit === 'function') window.soundEngine.playCrit();
            if (typeof window.soundEngine.playPowerup === 'function') window.soundEngine.playPowerup();
        }
    }
}

if (typeof window !== 'undefined') {
    window.WrathOfOlympusSkill = WrathOfOlympusSkill;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WrathOfOlympusSkill };
}
