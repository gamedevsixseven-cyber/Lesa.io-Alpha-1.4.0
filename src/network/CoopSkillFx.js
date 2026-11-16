/**
 * Lesa.io - Co-op Remote Skill Effects Coordinator
 * Handles visual FX, audio, and authoritative host combat for remote player skill activations
 */

class CoopSkillFx {
    static playRemoteSkill(game, remotePlayer, skillData = {}, isHostAuthoritative = false) {
        if (!remotePlayer || !game) return;
        const skillId = skillData.skillId || 'blade_rush';
        const level = skillData.level || 1;
        const x = Number.isFinite(skillData.x) ? skillData.x : remotePlayer.x;
        const y = Number.isFinite(skillData.y) ? skillData.y : remotePlayer.y;
        const angle = Number.isFinite(skillData.angle) ? skillData.angle : (remotePlayer.angle || 0);
        const fx = game.effects;
        const cam = game.camera;
        const se = (typeof window !== 'undefined') ? window.soundEngine : null;

        if (skillId === 'seismic_quake') {
            const radius = 160 + (level - 1) * 15;
            if (fx) {
                fx.addComicSplash(x, y - 35, level >= 4 ? 'TITAN QUAKE! 💥' : 'QUAKE! 🪨');
                if (typeof fx.addGroundCrack === 'function') {
                    fx.addGroundCrack(x, y, radius * 1.05, '#1e272e', level >= 4 ? '#f39c12' : '#3498db', 140);
                }
                fx.addShockwave(x, y, radius, 'rgba(52, 152, 219, 0.85)');
                fx.addShockwave(x, y, radius * 0.65, 'rgba(41, 128, 185, 0.95)');
                fx.addDust(x, y, 14, 20);
                fx.addSparks(x, y, '#3498db', 16);
            }
            if (cam && typeof cam.addShake === 'function') cam.addShake(12);
            if (se) {
                if (typeof se.playNoiseCrack === 'function') se.playNoiseCrack(0, 0.2, 0.5);
                if (typeof se.playFatmirSlam === 'function') se.playFatmirSlam();
            }
            if (isHostAuthoritative && game.enemies) {
                const baseDamage = 140 + (level - 1) * 30;
                const stunSec = 2.0 + (level - 1) * 0.25;
                for (let i = 0; i < game.enemies.length; i++) {
                    const e = game.enemies[i];
                    if (!e || e.dead) continue;
                    const dx = e.x - x, dy = e.y - y;
                    const maxR = radius + e.radius;
                    if (dx * dx + dy * dy <= maxR * maxR) {
                        const dist = Math.max(1, Math.hypot(dx, dy));
                        e.x += (dx / dist) * 18;
                        e.y += (dy / dist) * 18;
                        e.takeDamage(baseDamage, fx, true);
                        if (typeof e.applyStun === 'function') e.applyStun(stunSec, fx);
                        else e.stunTimer = Math.round(stunSec * 60);
                        if (e.isCharging) { e.isCharging = false; e.chargeWindup = 0; }
                    }
                }
            }
        } else if (skillId === 'yaya_scream') {
            const range = 240 + (level - 1) * 20;
            const shouts = ['ΕΛΑ ΕΔΩΩΩ! 📢', 'ΑΜΑΝ! 📢', 'ΣΤΑΜΑΤΑ! 📢', 'ΠΑΝΑΓΙΑ ΜΟΥ! 📢', 'ΞΥΛΟ ΠΟΥ ΘΑ ΦΑΣ! 📢'];
            const shout = shouts[Math.floor(Math.random() * shouts.length)];
            if (fx) {
                fx.addComicSplash(x + Math.cos(angle) * 50, y + Math.sin(angle) * 50 - 25, shout);
                fx.addSlash(x, y, angle, range * 0.8, '#9b59b6');
                fx.addShockwave(x + Math.cos(angle) * (range * 0.45), y + Math.sin(angle) * (range * 0.45), range * 0.55, 'rgba(155, 89, 182, 0.85)');
                fx.addSparks(x, y, '#9b59b6', 12);
            }
            if (cam && typeof cam.addShake === 'function') cam.addShake(9);
            if (se && typeof se.playBossWarning === 'function') se.playBossWarning();
            if (isHostAuthoritative) {
                if (game.bullets) {
                    for (let b = 0; b < game.bullets.length; b++) {
                        const bullet = game.bullets[b];
                        if (!bullet || bullet.dead || !bullet.isEnemy) continue;
                        const bdx = bullet.x - x, bdy = bullet.y - y;
                        if (Math.hypot(bdx, bdy) <= range) {
                            let diff = Math.abs(Math.atan2(bdy, bdx) - angle);
                            while (diff > Math.PI) diff -= Math.PI * 2;
                            if (Math.abs(diff) <= Math.PI * 0.55) {
                                bullet.dead = true;
                                if (fx) { fx.addSparks(bullet.x, bullet.y, '#9b59b6', 5); fx.addComicSplash(bullet.x, bullet.y - 15, 'CLANG!'); }
                            }
                        }
                    }
                }
                if (game.enemies) {
                    const fearSec = 3.0 + (level - 1) * 0.3;
                    const baseDamage = 110 + (level - 1) * 25;
                    for (let i = 0; i < game.enemies.length; i++) {
                        const e = game.enemies[i];
                        if (!e || e.dead) continue;
                        const edx = e.x - x, edy = e.y - y;
                        if (Math.hypot(edx, edy) <= range + e.radius) {
                            let diff = Math.abs(Math.atan2(edy, edx) - angle);
                            while (diff > Math.PI) diff -= Math.PI * 2;
                            if (Math.abs(diff) <= Math.PI * 0.55) {
                                e.takeDamage(baseDamage, fx);
                                if (typeof e.applyFear === 'function') e.applyFear(fearSec, fx);
                                else e.fearTimer = Math.round(fearSec * 60);
                            }
                        }
                    }
                }
            }
        } else if (skillId === 'frappes') {
            const hasPagakia = level >= 5;
            remotePlayer.frenzyTimer = hasPagakia ? 480 : 300;
            remotePlayer.hasPagakiaMastery = hasPagakia;
            if (fx) {
                fx.addComicSplash(x, y - 35, hasPagakia ? 'FRAPPES+! 🧊' : 'FRAPPES FRENZY! 🥤');
                fx.addShockwave(x, y, 120, hasPagakia ? 'rgba(0, 206, 201, 0.85)' : 'rgba(243, 156, 18, 0.85)');
                fx.addSparks(x, y, hasPagakia ? '#00cec9' : '#f39c12', 18);
            }
            if (se && typeof se.playPowerup === 'function') se.playPowerup();
        } else if (skillId === 'nerobalonaki') {
            const radius = 105 + (level - 1) * 12;
            const duration = 360 + (level - 1) * 40;
            const dropX = x + Math.cos(angle) * 45;
            const dropY = y + Math.sin(angle) * 45;
            if (fx) {
                fx.addComicSplash(dropX, dropY - 28, 'SPLASH! 💦');
                fx.addShockwave(dropX, dropY, radius + 10, 'rgba(0, 210, 211, 0.85)');
                fx.addSparks(dropX, dropY, '#00d2d3', 14);
            }
            if (cam && typeof cam.shake === 'function') cam.shake(5, 7);
            if (se && typeof se.playWaterSplash === 'function') se.playWaterSplash();
            if (typeof WaterPuddle !== 'undefined' && game) {
                if (!game.hazards) game.hazards = [];
                game.hazards.push(new WaterPuddle(dropX, dropY, radius, duration, 0.55, 1.30));
            }
        } else if (skillId === 'wrath_of_olympus') {
            if (typeof WrathOfOlympusSkill !== 'undefined') {
                const targetEnemies = isHostAuthoritative && game && game.enemies ? game.enemies : [];
                WrathOfOlympusSkill.execute({ x, y, angle, damageMultiplier: 1, invulnerableTimer: 0, skillCooldown: 0, maxSkillCooldown: 0 }, level, targetEnemies, fx, cam, game);
            }
        } else {
            // Blade Rush (default)
            const reach = 75 + (level - 1) * 8;
            const slashX = x + Math.cos(angle) * 36;
            const slashY = y + Math.sin(angle) * 36;
            if (fx) {
                fx.addSlash(slashX, slashY, angle, reach + 5, '#00d2d3');
                fx.addDust(x, y, 6, 8);
                fx.addComicSplash(slashX, slashY - 26, level >= 3 ? 'CLEAVE!' : 'SWISH!');
            }
            if (cam && typeof cam.shake === 'function') cam.shake(6, 8);
            if (se && typeof se.playBladeSwish === 'function') se.playBladeSwish();
            if (isHostAuthoritative && game.enemies) {
                const baseDamage = 90 + (level - 1) * 20;
                const x2 = x + Math.cos(angle) * 210, y2 = y + Math.sin(angle) * 210;
                const dx = x2 - x, dy = y2 - y, l2 = dx * dx + dy * dy;
                for (let i = 0; i < game.enemies.length; i++) {
                    const e = game.enemies[i];
                    if (!e || e.dead) continue;
                    let t = l2 > 0 ? ((e.x - x) * dx + (e.y - y) * dy) / l2 : 0;
                    t = Math.max(0, Math.min(1, t));
                    if (Math.hypot(e.x - (x + t * dx), e.y - (y + t * dy)) <= reach + e.radius) {
                        e.takeDamage(baseDamage, fx);
                        e.x += Math.cos(angle) * 18;
                        e.y += Math.sin(angle) * 18;
                        if (fx) { fx.addSlash(e.x, e.y, angle, reach - 10, '#00d2d3'); fx.addSparks(e.x, e.y, '#00d2d3', 6); }
                    }
                }
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.CoopSkillFx = CoopSkillFx;
}
