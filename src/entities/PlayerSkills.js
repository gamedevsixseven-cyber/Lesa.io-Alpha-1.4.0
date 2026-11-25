/**
 * Lesa.io - Player Active Skills Engine
 * Central dispatcher for player active skills:
 *  - Nerobalonaki (Common ⚪)
 *  - Blade Rush (Uncommon 🟢)
 *  - Seismic Quake (Rare 🔵)
 *  - Yaya Scream (Epic 🟣)
 *  - Frappes with Pagakia Mastery (Legendary 🟠)
 */

class PlayerSkills {
    static getSkillLevel(skillId) {
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player && window.GameState.player.skillLevels) {
            return window.GameState.player.skillLevels[skillId] || 1;
        }
        const saved = JSON.parse(localStorage.getItem('lesaio_skill_levels') || '{}');
        return saved[skillId] || 1;
    }

    static getEffectiveCooldown(skillId, level) {
        if (typeof SKILLS === 'undefined' || !SKILLS[skillId]) return 8.0;
        const skill = SKILLS[skillId];
        if (skill.levels && skill.levels[level] && skill.levels[level].cooldown) {
            return skill.levels[level].cooldown;
        }
        if ((skillId === 'frappes' || skillId === 'chrono_hourglass') && level >= 5 && skill.masteryCooldown) {
            return skill.masteryCooldown; // Permanent Mastery CDR
        }
        return skill.cooldown;
    }

    static execute(player, enemies = [], effects = null, camera = null, game = null) {
        if (player.skillCooldown > 0 || player.isBladeRushing || (player.frappesFrenzyTimer > 0)) return;

        const activeGame = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        const skillId = player.selectedSkill || 'blade_rush';
        const level = this.getSkillLevel(skillId);

        switch (skillId) {
            case 'nerobalonaki':
                this.executeNerobalonaki(player, level, effects, camera, activeGame);
                break;
            case 'blade_rush':
                this.executeBladeRush(player, level, enemies, effects, camera);
                break;
            case 'seismic_quake':
                if (typeof SeismicQuakeSkill !== 'undefined') SeismicQuakeSkill.execute(player, level, enemies, effects, camera, activeGame);
                break;
            case 'chair_throw':
                if (typeof ChairThrowSkill !== 'undefined') ChairThrowSkill.execute(player, level, enemies, effects, camera, activeGame);
                break;
            case 'komboloi_vortex':
                if (typeof KomboloiVortexSkill !== 'undefined') KomboloiVortexSkill.execute(player, level, enemies, effects, camera, activeGame);
                break;
            case 'ouzo_flambe':
                if (typeof OuzoFlambeSkill !== 'undefined') OuzoFlambeSkill.execute(player, level, enemies, effects, camera, activeGame);
                break;
            case 'donkey_stampede':
                if (typeof DonkeyStampedeSkill !== 'undefined') DonkeyStampedeSkill.execute(player, level, enemies, effects, camera, activeGame);
                break;
            case 'bouzouki_decoy':
                if (typeof BouzoukiDecoySkill !== 'undefined') BouzoukiDecoySkill.execute(player, level, enemies, effects, camera, activeGame);
                break;
            case 'chrono_hourglass':
                if (typeof ChronosHourglassSkill !== 'undefined') ChronosHourglassSkill.execute(player, level, enemies, effects, camera, activeGame);
                break;
            case 'yaya_scream':
                if (typeof YayaScreamSkill !== 'undefined') {
                    YayaScreamSkill.execute(player, level, enemies, effects, camera, activeGame);
                }
                break;
            case 'frappes':
                if (typeof FrappesSkill !== 'undefined') {
                    FrappesSkill.execute(player, level, enemies, effects, camera, activeGame);
                }
                break;
            case 'wrath_of_olympus':
                if (typeof WrathOfOlympusSkill !== 'undefined') {
                    WrathOfOlympusSkill.execute(player, level, enemies, effects, camera, activeGame);
                }
                break;
            default:
                this.executeBladeRush(player, level, enemies, effects, camera);
                break;
        }

        if (typeof window !== 'undefined' && window.perkSystem && typeof window.perkSystem.onSkillActivated === 'function') {
            window.perkSystem.onSkillActivated(player, effects, activeGame);
        }
    }

    static update(player, dt = 1, effects = null, enemies = []) {
        if (!player) return;
        if (player.frappesFrenzyTimer > 0 && typeof FrappesSkill !== 'undefined') {
            FrappesSkill.update(player, dt, effects, enemies);
        }
    }

    static executeNerobalonaki(player, level, effects, camera, game) {
        const skillData = (typeof SKILLS !== 'undefined' && SKILLS.nerobalonaki) ? SKILLS.nerobalonaki : null;
        const levelData = (skillData && skillData.levels) ? skillData.levels[level] : null;

        // Invariant Cooldown: 6.0s (360 frames)
        player.skillCooldown = 360;
        player.maxSkillCooldown = 360;

        // Base stats scaled by level
        const radius = levelData ? levelData.radius : 105;
        const duration = levelData ? levelData.duration : 360;
        const slowMult = levelData ? levelData.slowMultiplier : 0.55;
        const dmgAmp = levelData ? levelData.damageAmp : 1.30;

        // Target spot slightly in front of player
        const dropDist = 45;
        const dropX = player.x + Math.cos(player.angle) * dropDist;
        const dropY = player.y + Math.sin(player.angle) * dropDist;

        if (effects) {
            effects.addComicSplash(dropX, dropY - 28, 'SPLASH! 💦');
            effects.addShockwave(dropX, dropY, radius + 10, 'rgba(0, 210, 211, 0.85)');
            effects.addSparks(dropX, dropY, '#00d2d3', 14);
            effects.addSparks(dropX, dropY, '#54a0ff', 10);
            effects.addDust(dropX, dropY, 8, 12);
        }

        if (camera) {
            camera.shake(5, 7);
        }

        if (window.soundEngine) {
            if (typeof window.soundEngine.playWaterSplash === 'function') {
                window.soundEngine.playWaterSplash();
            } else if (typeof window.soundEngine.playShoot === 'function') {
                window.soundEngine.playShoot('bubble');
            } else if (typeof window.soundEngine.playPickup === 'function') {
                window.soundEngine.playPickup('xp');
            }
        }

        // Spawn Water Puddle hazard with level-scaled stats
        if (typeof WaterPuddle !== 'undefined' && game) {
            if (!game.hazards) game.hazards = [];
            game.hazards.push(new WaterPuddle(dropX, dropY, radius, duration, slowMult, dmgAmp));
        }
    }

    static executeBladeRush(player, level, enemies, effects, camera) {
        const skillData = (typeof SKILLS !== 'undefined' && SKILLS.blade_rush) ? SKILLS.blade_rush : null;
        const levelData = (skillData && skillData.levels) ? skillData.levels[level] : null;

        // Invariant Cooldown: 8.0s (480 frames)
        player.skillCooldown = 480;
        player.maxSkillCooldown = 480;
        player.isBladeRushing = true;
        player.bladeRushTimer = 11;
        player.bladeTimer = 24;
        player.invulnerableTimer = 14;

        // Base stats scaled by level
        const baseDamage = levelData ? levelData.damage : 90;
        const reach = levelData ? levelData.reach : 75;
        const rushDist = levelData ? levelData.rushDist : 210;

        const rushSpeed = 19;
        player.vx = Math.cos(player.angle) * rushSpeed;
        player.vy = Math.sin(player.angle) * rushSpeed;

        const slashOffset = 36;
        const slashX = player.x + Math.cos(player.angle) * slashOffset;
        const slashY = player.y + Math.sin(player.angle) * slashOffset;

        if (effects) {
            effects.addSlash(slashX, slashY, player.angle, reach + 5, '#00d2d3');
            effects.addDust(player.x, player.y, 6, 8);
            effects.addComicSplash(slashX, slashY - 26, level >= 3 ? 'CLEAVE!' : 'SWISH!');
        }

        if (camera) {
            camera.shake(6, 8);
        }

        if (window.soundEngine) {
            window.soundEngine.playBladeSwish();
        }

        // Dash Path Trajectory Segment
        const x1 = player.x;
        const y1 = player.y;
        const x2 = player.x + Math.cos(player.angle) * rushDist;
        const y2 = player.y + Math.sin(player.angle) * rushDist;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const l2 = dx * dx + dy * dy;

        player.bladeRushHitEnemies = new Set();

        if (enemies && enemies.length > 0) {
            let hitCount = 0;

            for (let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                if (enemy.dead) continue;

                let t = l2 > 0 ? ((enemy.x - x1) * dx + (enemy.y - y1) * dy) / l2 : 0;
                t = Math.max(0, Math.min(1, t));
                const projX = x1 + t * dx;
                const projY = y1 + t * dy;
                const dist = Math.hypot(enemy.x - projX, enemy.y - projY);

                if (dist <= reach + enemy.radius) {
                    player.bladeRushHitEnemies.add(enemy);
                    const slashDamage = baseDamage * (player.damageMultiplier || 1);
                    enemy.takeDamage(slashDamage, effects);
                    hitCount++;

                    enemy.x += Math.cos(player.angle) * 18;
                    enemy.y += Math.sin(player.angle) * 18;

                    if (effects) {
                        effects.addSlash(enemy.x, enemy.y, player.angle, reach - 10, '#00d2d3');
                        effects.addSparks(enemy.x, enemy.y, '#00d2d3', 6);
                        effects.addSparks(enemy.x, enemy.y, '#ffffff', 4);
                        effects.addComicSplash(enemy.x, enemy.y - 20, level >= 3 ? 'SLASH! 💥' : 'SLASH!');
                    }
                }
            }

            if (hitCount > 0 && window.soundEngine) {
                window.soundEngine.playHit(true, true);
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.PlayerSkills = PlayerSkills;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PlayerSkills };
}
