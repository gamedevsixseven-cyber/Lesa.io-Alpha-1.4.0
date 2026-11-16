/**
 * Lesa.io - Active Skill: Yaya Scream (Epic)
 * Megaphone Blast: 180° frontal sonic wave that deflects enemy bullets and terrifies enemies into fleeing with fear debuff.
 */

class YayaScreamSkill {
    static execute(player, level, enemies = [], effects = null, camera = null, game = null) {
        const skillData = (typeof SKILLS !== 'undefined' && SKILLS.yaya_scream) ? SKILLS.yaya_scream : null;
        const levelData = (skillData && skillData.levels) ? skillData.levels[level] : null;

        const cdSec = skillData ? skillData.cooldown : 11.0;
        player.skillCooldown = Math.round(cdSec * 60);
        player.maxSkillCooldown = player.skillCooldown;

        const baseDamage = levelData ? levelData.damage : 110;
        const range = levelData ? levelData.range : 240;
        const coneAngle = levelData ? levelData.coneAngle : Math.PI; // 180 degrees
        const fearSec = levelData ? levelData.fearDuration : 3.0;

        // Vintage Megaphone Auntie Comedic Shouts
        const shouts = ['ΕΛΑ ΕΔΩΩΩ! 📢', 'ΑΜΑΝ! 📢', 'ΣΤΑΜΑΤΑ! 📢', 'ΠΑΝΑΓΙΑ ΜΟΥ! 📢', 'ΞΥΛΟ ΠΟΥ ΘΑ ΦΑΣ! 📢'];
        const chosenShout = shouts[Math.floor(Math.random() * shouts.length)];

        const coneCenterX = player.x + Math.cos(player.angle) * (range * 0.45);
        const coneCenterY = player.y + Math.sin(player.angle) * (range * 0.45);

        if (effects) {
            effects.addComicSplash(player.x + Math.cos(player.angle) * 50, player.y + Math.sin(player.angle) * 50 - 25, chosenShout);
            effects.addSlash(player.x, player.y, player.angle, range * 0.8, '#9b59b6');
            effects.addShockwave(coneCenterX, coneCenterY, range * 0.55, 'rgba(155, 89, 182, 0.85)');
            effects.addSparks(player.x, player.y, '#9b59b6', 12);
            effects.addSparks(player.x, player.y, '#e056fd', 10);
            effects.addSparks(player.x, player.y, '#ffd32a', 6);
        }

        if (camera) {
            camera.addShake(9);
        }

        if (window.soundEngine) {
            if (typeof window.soundEngine.playBossWarning === 'function') {
                window.soundEngine.playBossWarning();
            } else if (typeof window.soundEngine.playHit === 'function') {
                window.soundEngine.playHit(false, true);
            }
        }

        // Deflect / Destroy Enemy Bullets inside the 180° cone
        const activeGame = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (activeGame && activeGame.bullets) {
            for (let b = 0; b < activeGame.bullets.length; b++) {
                const bullet = activeGame.bullets[b];
                if (!bullet || bullet.dead || !bullet.isEnemy) continue;

                const bdx = bullet.x - player.x;
                const bdy = bullet.y - player.y;
                const bdist = Math.hypot(bdx, bdy);

                if (bdist <= range) {
                    let bAngleDiff = Math.abs(Math.atan2(bdy, bdx) - player.angle);
                    while (bAngleDiff > Math.PI) bAngleDiff -= Math.PI * 2;

                    if (Math.abs(bAngleDiff) <= coneAngle * 0.55) {
                        bullet.dead = true;
                        if (effects) {
                            effects.addSparks(bullet.x, bullet.y, '#9b59b6', 5);
                            effects.addComicSplash(bullet.x, bullet.y - 15, 'CLANG!');
                        }
                    }
                }
            }
        }

        // Damage and Fear Enemies inside frontal cone
        if (enemies && enemies.length > 0) {
            let hitCount = 0;
            const finalDamage = baseDamage * (player.damageMultiplier || 1);

            for (let i = 0; i < enemies.length; i++) {
                const enemy = enemies[i];
                if (enemy.dead || enemy.isDying || enemy.isAirborneImmune) continue;

                const edx = enemy.x - player.x;
                const edy = enemy.y - player.y;
                const edist = Math.hypot(edx, edy);

                if (edist <= range + enemy.radius) {
                    let angleDiff = Math.abs(Math.atan2(edy, edx) - player.angle);
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;

                    if (Math.abs(angleDiff) <= coneAngle * 0.55) {
                        hitCount++;
                        enemy.takeDamage(finalDamage, effects, false);
                        if (enemy.dead || enemy.hp <= 0) continue;

                        if (!enemy.isStationary) {
                            if (typeof enemy.applyFear === 'function') {
                                enemy.applyFear(fearSec, effects);
                            } else {
                                enemy.fearTimer = Math.round(fearSec * 60);
                            }

                            // Push slightly backward
                            const fdir = Math.atan2(edy, edx);
                            enemy.x += Math.cos(fdir) * 14;
                            enemy.y += Math.sin(fdir) * 14;
                        }

                        if (effects) {
                            effects.addSparks(enemy.x, enemy.y, '#74b9ff', 4); // sweat drop sparks
                        }
                    }
                }
            }

            if (hitCount > 0 && window.soundEngine && typeof window.soundEngine.playHit === 'function') {
                window.soundEngine.playHit(true, false);
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.YayaScreamSkill = YayaScreamSkill;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { YayaScreamSkill };
}
