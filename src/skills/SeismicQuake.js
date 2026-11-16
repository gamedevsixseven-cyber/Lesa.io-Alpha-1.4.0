/**
 * Lesa.io - Active Skill: Seismic Quake (Rare)
 * Heavy Ground Stomp: Releases 360° crushing seismic shockwaves that stun enemies and interrupt brute charges.
 */

class SeismicQuakeSkill {
    static execute(player, level, enemies = [], effects = null, camera = null, game = null) {
        const skillData = (typeof SKILLS !== 'undefined' && SKILLS.seismic_quake) ? SKILLS.seismic_quake : null;
        const levelData = (skillData && skillData.levels) ? skillData.levels[level] : null;

        const cdSec = skillData ? skillData.cooldown : 10.0;
        player.skillCooldown = Math.round(cdSec * 60);
        player.maxSkillCooldown = player.skillCooldown;

        const baseDamage = levelData ? levelData.damage : 140;
        const radius = levelData ? levelData.radius : 160;
        const stunSec = levelData ? levelData.stunDuration : 2.0;
        const knockback = levelData ? levelData.knockback : 18;

        // Visual impacts at player position
        if (effects) {
            effects.addComicSplash(player.x, player.y - 35, level >= 4 ? 'TITAN QUAKE! 💥' : 'QUAKE! 🪨');
            if (typeof effects.addGroundCrack === 'function') {
                const crackRadius = radius * 1.05;
                const glowCol = level >= 4 ? '#f39c12' : '#3498db';
                effects.addGroundCrack(player.x, player.y, crackRadius, '#1e272e', glowCol, 140);
            }
            effects.addShockwave(player.x, player.y, radius, 'rgba(52, 152, 219, 0.85)');
            effects.addShockwave(player.x, player.y, radius * 0.65, 'rgba(41, 128, 185, 0.95)');
            effects.addDust(player.x, player.y, 14, 20);
            effects.addSparks(player.x, player.y, '#3498db', 16);
            effects.addSparks(player.x, player.y, '#f1c40f', 8);
        }

        if (camera) {
            camera.addShake(12);
        }

        if (window.soundEngine) {
            if (typeof window.soundEngine.playNoiseCrack === 'function') {
                window.soundEngine.playNoiseCrack(0, 0.2, 0.5);
            }
            if (typeof window.soundEngine.playFatmirSlam === 'function') {
                window.soundEngine.playFatmirSlam();
            } else if (typeof window.soundEngine.playHit === 'function') {
                window.soundEngine.playHit(true, true);
            }
        }

        // Damage, Stun, and Interrupt Enemies within 360° radius
        if (enemies && enemies.length > 0) {
            let hitCount = 0;
            const finalDamage = baseDamage * (player.damageMultiplier || 1);

            for (let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                if (enemy.dead || enemy.isDying || enemy.isAirborneImmune) continue;

                const dx = enemy.x - player.x;
                const dy = enemy.y - player.y;
                const distSq = dx * dx + dy * dy;
                const maxRange = radius + enemy.radius;

                if (distSq <= maxRange * maxRange) {
                    hitCount++;
                    const dist = Math.max(1, Math.sqrt(distSq));
                    const nx = dx / dist;
                    const ny = dy / dist;

                    if (!enemy.isStationary) {
                        enemy.x += nx * knockback;
                        enemy.y += ny * knockback;
                    }

                    // Deal heavy crushing damage
                    enemy.takeDamage(finalDamage, effects, true);

                    if (!enemy.isStationary) {
                        if (typeof enemy.applyStun === 'function') {
                            enemy.applyStun(stunSec, effects);
                        } else {
                            enemy.stunTimer = Math.round(stunSec * 60);
                        }
                    }

                    // Explicitly cancel brute charges if charging
                    if (enemy.isCharging) {
                        enemy.isCharging = false;
                        enemy.chargeWindup = 0;
                    }

                    if (effects) {
                        effects.addSparks(enemy.x, enemy.y, '#3498db', 6);
                    }
                }
            }

            if (hitCount > 0 && window.soundEngine && typeof window.soundEngine.playHit === 'function') {
                window.soundEngine.playHit(true, true);
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.SeismicQuakeSkill = SeismicQuakeSkill;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SeismicQuakeSkill };
}
