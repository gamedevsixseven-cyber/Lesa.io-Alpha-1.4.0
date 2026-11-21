/**
 * Lesa.io - Kolossos MK-IV Titan Meteor Leap & Helios Trooper Deployment
 * Handles the telegraphed aerial jump slam + expanding dash-dodge seismic ring,
 * as well as deploying miniature KolossosTrooper squads under 75% HP.
 */

class KolossosJumpAttack {
    static spawnTroopers(boss, enemies, effects, count = 3) {
        if (!boss || !Array.isArray(enemies) || typeof KolossosTrooper === 'undefined') return 0;
        let active = 0;
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (e && !e.dead && e.type === 'kolossos_trooper' && e.ownedByBoss === boss) active++;
        }
        const remainingBudget = Math.max(0, 12 - (boss.totalTroopersSpawned || 0));
        const toSpawn = Math.min(count, Math.max(0, 4 - active), remainingBudget);
        if (toSpawn <= 0) return 0;

        const baseAng = Math.random() * Math.PI * 2;
        for (let i = 0; i < toSpawn; i++) {
            const idx = (boss.totalTroopersSpawned || 0);
            const ang = baseAng + (i * Math.PI * 2) / toSpawn;
            const tx = boss.x + Math.cos(ang) * 125;
            const ty = boss.y + Math.sin(ang) * 125;
            const troop = new KolossosTrooper(tx, ty, boss.waveMultiplier, boss, idx);
            enemies.push(troop);
            boss.totalTroopersSpawned = idx + 1;
            if (effects) {
                effects.addLightningChain(boss.x, boss.y, tx, ty, '#ff9f43');
                effects.addShockwave(tx, ty, 60, 'rgba(255, 159, 67, 0.88)');
            }
        }
        if (effects) {
            effects.addComicSplash(boss.x, boss.y - 68, '🤖 HELIOS TROOPERS DEPLOYED!');
        }
        return toSpawn;
    }

    static startJumpAttack(boss, player, effects, arena) {
        if (!boss || !player || boss.jumpAttack || boss.solarNova || boss.omegaBeam) return false;
        const leadX = player.x + (player.vx || 0) * 10;
        const leadY = player.y + (player.vy || 0) * 10;
        const bnd = arena && arena.dungeonBounds
            ? arena.dungeonBounds
            : { minX: -(arena ? arena.halfWidth : 1500) + 120, maxX: (arena ? arena.halfWidth : 1500) - 120, minY: -(arena ? arena.halfHeight : 1500) + 120, maxY: (arena ? arena.halfHeight : 1500) - 120 };

        const targetX = Math.max(bnd.minX, Math.min(bnd.maxX, leadX));
        const targetY = Math.max(bnd.minY, Math.min(bnd.maxY, leadY));

        boss.jumpAttack = {
            phase: 'telegraph',
            timer: 38,
            maxTimer: 38,
            startX: boss.x,
            startY: boss.y,
            targetX,
            targetY,
            impactRadius: 185,
            maxLift: 195,
            dodgeNotified: false
        };
        if (effects) {
            effects.addComicSplash(boss.x, boss.y - 70, '🚀 TITAN LEAP — DASH!');
            effects.addSparks(boss.x, boss.y, '#fed330', 12);
            effects.addDust(boss.x, boss.y, 8, 16);
        }
        return true;
    }

    static updateJumpAttack(boss, dt, player, bullets, effects, arena) {
        const j = boss.jumpAttack;
        if (!j) return;

        j.timer -= dt;
        if (j.phase === 'telegraph') {
            boss.angle = Math.atan2(j.targetY - boss.y, j.targetX - boss.x);
            if (effects && Math.floor(boss.age) % 6 === 0) {
                effects.addSparks(boss.x, boss.y + boss.radius * 0.5, '#ff9f43', 3);
            }
            if (j.timer <= 0) {
                j.phase = 'airborne';
                j.maxTimer = 40;
                j.timer = 40;
                j.startX = boss.x;
                j.startY = boss.y;
                boss.isAirborneImmune = true;
                if (effects) {
                    effects.addShockwave(boss.x, boss.y, 120, 'rgba(255, 165, 2, 0.85)');
                    effects.addDust(boss.x, boss.y, 12, 22);
                }
            }
            return;
        }

        // Airborne phase: parabolic climb to 195px + smooth flight to locked target
        const p = Math.max(0, Math.min(1, 1 - (j.timer / j.maxTimer)));
        boss.x = j.startX + (j.targetX - j.startX) * p;
        boss.y = j.startY + (j.targetY - j.startY) * p;
        boss.jumpLift = 4 * p * (1 - p) * j.maxLift;
        boss.angle = Math.atan2(j.targetY - j.startY, j.targetX - j.startX);

        if (j.timer <= 0) {
            // Touchdown impact!
            boss.isAirborneImmune = false;
            boss.jumpLift = 0;
            boss.x = j.targetX;
            boss.y = j.targetY;
            if (typeof boss.applyArenaBounds === 'function') boss.applyArenaBounds(arena);

            if (effects) {
                effects.addShockwave(boss.x, boss.y, 260, 'rgba(255, 46, 76, 0.96)');
                effects.addShockwave(boss.x, boss.y, 170, 'rgba(254, 211, 48, 0.94)');
                if (typeof effects.addGroundCrack === 'function') {
                    effects.addGroundCrack(boss.x, boss.y, j.impactRadius * 0.82, '#1e272e', '#ff2e4c', 150);
                }
                effects.addSparks(boss.x, boss.y, '#ffa502', 16);
                effects.addDust(boss.x, boss.y, 16, 26);
                if (typeof effects.triggerScreenFlash === 'function') effects.triggerScreenFlash('#ff2e4c', 0.30, 18);
                if (typeof effects.onBossSlam === 'function') effects.onBossSlam(0.10);
            }

            // Scatter 8 radial crimson laser bolts from impact crater
            if (typeof Bullet !== 'undefined' && Array.isArray(bullets)) {
                const seed = Math.random() * 0.4;
                for (let k = 0; k < 8; k++) {
                    const ang = seed + (k * Math.PI * 2) / 8;
                    bullets.push(new Bullet({
                        x: boss.x + Math.cos(ang) * 32,
                        y: boss.y + Math.sin(ang) * 32,
                        vx: Math.cos(ang) * 9.8,
                        vy: Math.sin(ang) * 9.8,
                        damage: Math.round(boss.damage * 0.78),
                        speed: 9.8,
                        radius: 9.5,
                        type: 'kolossos_laser_bolt',
                        isEnemy: true,
                        range: 740
                    }));
                }
            }

            // Crushing direct landing damage unless player Dashed!
            let playerDodged = false;
            if (player && player.hp > 0) {
                const dist = Math.hypot(player.x - boss.x, player.y - boss.y);
                const pr = (player.radius || 25) * 0.72;
                if (dist <= j.impactRadius + pr) {
                    if (player.isDashing || player.isBladeRushing) {
                        playerDodged = true;
                        if (effects && !j.dodgeNotified) {
                            j.dodgeNotified = true;
                            effects.addComicSplash(player.x, player.y - 36, '⚡ DASH DODGED!', '#00f5ff', 22, true);
                        }
                    } else {
                        player.takeDamage(Math.round(boss.damage * 1.45), effects);
                        const ka = Math.atan2(player.y - boss.y, player.x - boss.x);
                        player.x += Math.cos(ka) * 26;
                        player.y += Math.sin(ka) * 26;
                    }
                }
            }

            // Launch fast-expanding Plasma Shockwave Ring that forces a Dash timing check
            if (!boss.leapShockwaves) boss.leapShockwaves = [];
            boss.leapShockwaves.push({
                x: boss.x,
                y: boss.y,
                radius: j.impactRadius * 0.72,
                maxRadius: 560,
                speed: boss.isEnraged ? 14.5 : 13.0,
                thickness: 28,
                damage: Math.round(boss.damage * 1.15),
                hitPlayer: playerDodged,
                dodgeNotified: playerDodged
            });

            boss.jumpAttack = null;
            boss.actionCooldown = Math.max(boss.actionCooldown || 0, 92);
        }
    }

    static updateLeapShockwaves(boss, dt, player, effects) {
        const list = boss.leapShockwaves;
        if (!Array.isArray(list) || list.length === 0) return;

        for (let i = list.length - 1; i >= 0; i--) {
            const sw = list[i];
            sw.radius += sw.speed * dt;
            if (player && player.hp > 0 && !sw.hitPlayer) {
                const d = Math.hypot(player.x - sw.x, player.y - sw.y);
                const pr = (player.radius || 25) * 0.72;
                if (Math.abs(d - sw.radius) <= sw.thickness + pr) {
                    if (player.isDashing || player.isBladeRushing) {
                        if (!sw.dodgeNotified && effects) {
                            sw.dodgeNotified = true;
                            effects.addComicSplash(player.x, player.y - 36, '⚡ DASH DODGED!', '#00f5ff', 22, true);
                        }
                    } else {
                        sw.hitPlayer = true;
                        player.takeDamage(sw.damage, effects);
                        if (effects) effects.addSparks(player.x, player.y, '#ff2e4c', 8);
                    }
                }
            }
            if (sw.radius >= sw.maxRadius) list.splice(i, 1);
        }
    }
}

if (typeof window !== 'undefined') {
    window.KolossosJumpAttack = KolossosJumpAttack;
}
