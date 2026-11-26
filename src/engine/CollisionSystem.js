/**
 * Lesa.io - Collision & Combat Physics System
 * High-performance spatial hit detection, damage resolutions, obstacle collisions, and loot drops
 */

class CollisionSystem {
    /**
     * Check all arena entity collisions
     */
    static check(game) {
        const p = game.player;
        const bullets = game.bullets;
        const enemies = game.enemies;
        const arena = game.arena;
        const obstacles = game.arena.obstacles;
        const effects = game.effects;
        const camera = game.camera;

        // 0. Player Arena Map Borders Collision
        if (arena && p) {
            const b = arena.dungeonBounds;
            const minX = (b ? b.minX : -arena.halfWidth) + p.radius;
            const maxX = (b ? b.maxX : arena.halfWidth) - p.radius;
            const minY = (b ? b.minY : -arena.halfHeight) + p.radius;
            const maxY = (b ? b.maxY : arena.halfHeight) - p.radius;

            if (p.x < minX) { p.x = minX; if (p.vx < 0) p.vx = 0; }
            else if (p.x > maxX) { p.x = maxX; if (p.vx > 0) p.vx = 0; }

            if (p.y < minY) { p.y = minY; if (p.vy < 0) p.vy = 0; }
            else if (p.y > maxY) { p.y = maxY; if (p.vy > 0) p.vy = 0; }
        }

        const hasGrid = typeof SpatialHashGrid !== 'undefined';
        if (hasGrid) SpatialHashGrid.beginCollisionPass(game);
        const eGrid = hasGrid ? SpatialHashGrid.enemyGrid : null;
        const oGrid = hasGrid ? SpatialHashGrid.obstacleGrid : null;
        const useEGrid = !!(eGrid && eGrid.source === enemies);
        const useOGrid = !!(oGrid && oGrid.source === obstacles);

        // 1. Bullets Collision Pass
        for (let bi = 0; bi < bullets.length; bi++) {
            const b = bullets[bi];
            if (b.dead) continue;

            if (!b.isEnemy) {
                // Player Bullet vs Enemies (swept segment prevents close/fast/co-op-lag tunneling)
                const hasPrev = Number.isFinite(b.prevX) && Number.isFinite(b.prevY);
                const sdx = hasPrev ? (b.x - b.prevX) : 0, sdy = hasPrev ? (b.y - b.prevY) : 0;
                const segLenSq = sdx * sdx + sdy * sdy;
                const useSweep = segLenSq > 64;
                const qX = useSweep ? (b.prevX + b.x) * 0.5 : b.x, qY = useSweep ? (b.prevY + b.y) * 0.5 : b.y;
                const qHalf = useSweep ? Math.sqrt(segLenSq) * 0.5 : 0;
                const eBuf = hasGrid ? SpatialHashGrid._bulletEnemyBuf : null;
                const eLen = useEGrid ? eGrid.queryIndices(qX, qY, b.radius + qHalf + eGrid.maxRadius + 2, eBuf) : enemies.length;
                for (let ei = 0; ei < eLen; ei++) {
                    const e = useEGrid ? enemies[eBuf[ei]] : enemies[ei];
                    if (e.dead || e.isDying || e.isAirborneImmune) continue;
                    if (b.hitEntities && b.hitEntities.has(e)) continue;

                    const radSum = b.radius + e.radius;
                    let hitSq = Infinity;
                    if (useSweep) {
                        const t = Math.max(0, Math.min(1, ((e.x - b.prevX) * sdx + (e.y - b.prevY) * sdy) / segLenSq));
                        const hx = b.prevX + t * sdx - e.x, hy = b.prevY + t * sdy - e.y;
                        hitSq = hx * hx + hy * hy;
                    } else {
                        const bdx = b.x - e.x, bdy = b.y - e.y;
                        if (Math.abs(bdx) <= radSum && Math.abs(bdy) <= radSum) hitSq = bdx * bdx + bdy * bdy;
                    }
                    if (hitSq < radSum * radSum) {
                        if (b.hitEntities) b.hitEntities.add(e);
                        let dmgMult = (typeof window !== 'undefined' && window.perkSystem) ? window.perkSystem.getDamageMultiplier(e) : 1.0;
                        if (typeof GearPassives !== 'undefined') dmgMult *= GearPassives.getDamageMultiplier(p, e, b.isCrit);
                        const finalDmg = b.damage * dmgMult;
                        e.takeDamage(finalDmg, effects, b.isCrit);
                        if (typeof HeroUltimates !== 'undefined') HeroUltimates.onDamageDealt(p, finalDmg);
                        if (game.isCoopGuest) e.dead = false;
                        if (b.isChargedBubble) {
                            if (e.isBoss || e.isMiniBoss || e.isStationary) {
                                // Bosses cannot go in the bubble: deals damage and immediately pops!
                                b.explode(effects);
                                b.dead = true;
                                break;
                            } else if (typeof e.trapInBubble === 'function') {
                                e.trapInBubble(2.0, 30);
                            }
                        }
                        if (b.isPagakiaChilling && typeof e.applyIceSlow === 'function') {
                            e.applyIceSlow(3.0, 0.50, effects);
                        }
                        if (b.type === 'lightning' && Math.random() < 0.10) {
                            CollisionSystem.triggerLightningChain(e, finalDmg, enemies, effects, game, b.shooter);
                        }
                        if (b.type === 'dialtone' && !b.isEnemy && typeof e.applySonicSlow === 'function') {
                            e.applySonicSlow(1.5, 0.70, effects);
                        }
                        if (!b.isEnemy && typeof WeaponSystem !== 'undefined') WeaponSystem.onBulletHit(b, e, finalDmg, enemies, effects, game);
                        if (typeof GearPassives !== 'undefined') {
                            GearPassives.onBulletHit(b, e, finalDmg, enemies, effects, game);
                        }
                        if (typeof window !== 'undefined' && window.perkSystem && typeof window.perkSystem.onBulletHit === 'function') {
                            window.perkSystem.onBulletHit(b, e, finalDmg, enemies, effects, game);
                        }
                        b.pierce--;
                        if (b.pierce <= 0) {
                            b.explode(effects);
                            b.dead = true;
                            break;
                        } else if (effects && typeof effects.addImpactSplat === 'function') {
                            effects.addImpactSplat(b.x, b.y, b.type, b.isCrit, false, 0.58);
                        }
                    }
                }

                // Player Bullet vs Crates, Barrels, Trees & Buildings
                if (!b.dead) {
                    const oBuf = hasGrid ? SpatialHashGrid._bulletObsBuf : null;
                    const oLen = useOGrid ? oGrid.queryIndices(b.x, b.y, b.radius + oGrid.maxRadius + 2, oBuf) : obstacles.length;
                    for (let oi = 0; oi < oLen; oi++) {
                        const obs = useOGrid ? obstacles[oBuf[oi]] : obstacles[oi];
                        if (obs.dead) continue;
                        if (obs.type === 'crate' || obs.type === 'barrel' || obs.type === 'tree' || obs.type === 'building') {
                            const odx = b.x - obs.x;
                            const ody = b.y - obs.y;
                            const radSum = b.radius + obs.radius;
                            if (Math.abs(odx) <= radSum && Math.abs(ody) <= radSum) {
                                const hit = obs.hitTestCircle ? obs.hitTestCircle(b.x, b.y, b.radius) : null;
                                if (hit) {
                                    if (typeof WeaponSystem !== 'undefined' && WeaponSystem.onObstacleHit(b, obs, effects, game)) { break; }
                                    const destroyed = !game.isCoopGuest ? obs.takeDamage(b.damage, effects, game) : false;
                                    if (destroyed && obs.type === 'crate') {
                                        game.drops.push(new Drop(obs.x, obs.y, 'xp', 20));
                                        if (Math.random() < 0.35) game.drops.push(new Drop(obs.x, obs.y, 'heart', 25));
                                    }

                                    if (b.bouncesLeft > 0) {
                                        const dot = b.vx * hit.nx + b.vy * hit.ny;
                                        b.vx -= 2 * dot * hit.nx;
                                        b.vy -= 2 * dot * hit.ny;
                                        b.bouncesLeft--;
                                        if (b.hitEntities) b.hitEntities.clear();
                                        b.rotation = Math.atan2(b.vy, b.vx);
                                        if (effects) effects.addSparks(b.x, b.y, '#34c759', 4);
                                    } else {
                                        if (obs.type === 'building' && effects) effects.addSparks(b.x, b.y, '#ffd32a', 4);
                                        b.explode(effects);
                                        b.dead = true;
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
            } else {
                // Enemy Bullet vs Obstacles (Crates, Barrels, Mushrooms, Trees & Buildings)
                const oBuf = hasGrid ? SpatialHashGrid._bulletObsBuf : null;
                const oLen = useOGrid ? oGrid.queryIndices(b.x, b.y, b.radius + oGrid.maxRadius + 2, oBuf) : obstacles.length;
                for (let oi = 0; oi < oLen; oi++) {
                    const obs = useOGrid ? obstacles[oBuf[oi]] : obstacles[oi];
                    if (obs.dead) continue;
                    if (obs.type === 'crate' || obs.type === 'barrel' || obs.type === 'mushroom' || obs.type === 'tree' || obs.type === 'building') {
                        const odx = b.x - obs.x;
                        const ody = b.y - obs.y;
                        const radSum = b.radius + obs.radius;
                        if (Math.abs(odx) <= radSum && Math.abs(ody) <= radSum) {
                            const hit = obs.hitTestCircle ? obs.hitTestCircle(b.x, b.y, b.radius) : null;
                            if (hit) {
                                if (!game.isCoopGuest && (obs.type === 'crate' || obs.type === 'barrel')) {
                                    obs.takeDamage(b.damage * 0.7, effects, game);
                                } else if (obs.type === 'building' && effects) {
                                    effects.addSparks(b.x, b.y, '#ffa502', 3);
                                }
                                b.explode(effects);
                                b.dead = true;
                                break;
                            }
                        }
                    }
                }

                // Enemy Bullet vs Player & Co-op Partner
                if (!b.dead) {
                    const pdx = b.x - p.x;
                    const pdy = b.y - p.y;
                    const radSum = b.radius + p.radius;
                    if (Math.abs(pdx) <= radSum && Math.abs(pdy) <= radSum) {
                        if (pdx * pdx + pdy * pdy < radSum * radSum) {
                            if (!game.isCoopGuest) {
                                p.takeDamage(b.damage, effects, camera);
                                if (b.frostChillFrames > 0) {
                                    p.speedDebuffTimer = Math.max(p.speedDebuffTimer || 0, b.frostChillFrames);
                                }
                            }
                            b.explode(effects);
                            b.dead = true;
                        }
                    }
                }

                if (!b.dead && game.coopSession) {
                    const rps = game.coopSession.remotePlayers || (game.coopSession.remotePlayer ? [game.coopSession.remotePlayer] : []);
                    for (let ri = 0; ri < rps.length && !b.dead; ri++) {
                        const p2 = rps[ri];
                        if (!p2 || p2.isDowned || p2.isDownedDisconnected) continue;
                        const p2dx = b.x - p2.x, p2dy = b.y - p2.y, radSum2 = b.radius + p2.radius;
                        if (Math.abs(p2dx) <= radSum2 && Math.abs(p2dy) <= radSum2 && (p2dx * p2dx + p2dy * p2dy < radSum2 * radSum2)) {
                            if (!game.isCoopGuest) {
                                p2.takeDamage(b.damage, effects, camera);
                                if (b.frostChillFrames > 0) p2.speedDebuffTimer = Math.max(p2.speedDebuffTimer || 0, b.frostChillFrames);
                            }
                            b.explode(effects);
                            b.dead = true;
                        }
                    }
                }
            }
        }

        // 2. Player & Co-op Partners vs Enemy Body Collision
        const pBuf = hasGrid ? SpatialHashGrid._playerEnemyBuf : null;
        this._checkUnitEnemyBody(p, enemies, eGrid, useEGrid, pBuf, effects, game, camera, true);
        if (game.coopSession && !game.isCoopGuest) {
            const rps = game.coopSession.remotePlayers || (game.coopSession.remotePlayer ? [game.coopSession.remotePlayer] : []);
            const p2Buf = hasGrid ? SpatialHashGrid._partnerEnemyBuf : null;
            for (let ri = 0; ri < rps.length; ri++) {
                const p2 = rps[ri];
                if (p2 && !p2.isDowned && !p2.isDownedDisconnected) this._checkUnitEnemyBody(p2, enemies, eGrid, useEGrid, p2Buf, effects, game, camera, false);
            }
        }

        // 3A. Player vs Obstacles (Mushrooms, Crates, Trees & Buildings)
        const poBuf = hasGrid ? SpatialHashGrid._playerObsBuf : null;
        const poLen = useOGrid ? oGrid.queryIndices(p.x, p.y, p.radius + oGrid.maxRadius + 2, poBuf) : obstacles.length;
        for (let i = 0; i < poLen; i++) {
            const obs = useOGrid ? obstacles[poBuf[i]] : obstacles[i];
            if (obs.dead) continue;
            const odx = p.x - obs.x, ody = p.y - obs.y, radSum = p.radius + obs.radius;
            if (Math.abs(odx) > radSum || Math.abs(ody) > radSum) continue;
            const hit = obs.hitTestCircle ? obs.hitTestCircle(p.x, p.y, p.radius) : null;
            if (!hit) continue;
            if (obs.type === 'mushroom') { obs.triggerMushroom(p, effects); continue; }
            if (obs.type === 'crate' || obs.type === 'barrel' || obs.type === 'tree' || obs.type === 'building') {
                if (obs.type !== 'tree' && obs.type !== 'building' && (p.isBladeRushing || p.vf185Active)) {
                    const destroyed = !game.isCoopGuest ? obs.takeDamage(85, effects, game) : false;
                    if (destroyed && obs.type === 'crate') {
                        game.drops.push(new Drop(obs.x, obs.y, 'xp', 20));
                        if (Math.random() < 0.35) game.drops.push(new Drop(obs.x, obs.y, 'heart', 25));
                    }
                } else { p.x = hit.pushX; p.y = hit.pushY; }
            }
        }

        // 3B. Visible Obstacles (Mushrooms, Trees & Buildings) vs Enemies via Spatial Hash Grid
        const oeBuf = hasGrid ? SpatialHashGrid._obsEnemyBuf : null;
        for (let i = 0; i < obstacles.length; i++) {
            const obs = obstacles[i];
            if (obs.dead) continue;
            const isMush = obs.type === 'mushroom';
            const isSolid = obs.type === 'tree' || obs.type === 'building';
            if (!isMush && !isSolid) continue;
            const visPad = isMush ? obs.radius + 60 : (obs.cullRadius || obs.radius) + 80;
            if (camera && !camera.isVisible(obs.x, obs.y, visPad)) continue;

            const oeLen = useEGrid ? eGrid.queryIndices(obs.x, obs.y, obs.radius + eGrid.maxRadius + 2, oeBuf) : enemies.length;
            for (let ei = 0; ei < oeLen; ei++) {
                const e = useEGrid ? enemies[oeBuf[ei]] : enemies[ei];
                if (e.dead) continue;
                if (isSolid && (e.isAirborne || e.isAirborneImmune || (e.cutsceneState && e.cutsceneState !== 'COMBAT'))) continue;
                const eRadSum = e.radius + obs.radius, edx = e.x - obs.x, edy = e.y - obs.y;
                if (Math.abs(edx) > eRadSum || Math.abs(edy) > eRadSum) continue;
                if (isMush) {
                    if (edx * edx + edy * edy < eRadSum * eRadSum) obs.triggerMushroom(e, effects);
                } else {
                    const eHit = obs.hitTestCircle ? obs.hitTestCircle(e.x, e.y, e.radius) : null;
                    if (eHit) { e.x = eHit.pushX; e.y = eHit.pushY; }
                }
            }
        }
    }

    static _checkUnitEnemyBody(unit, enemies, eGrid, useEGrid, buf, effects, game, camera, allowBladeRush) {
        const rush = allowBladeRush && unit.isBladeRushing;
        const pad = rush ? 35 : (unit.vf185Active ? 26 : 0);
        const len = useEGrid ? eGrid.queryIndices(unit.x, unit.y, unit.radius + pad + eGrid.maxRadius + 2, buf) : enemies.length;
        for (let i = 0; i < len; i++) {
            const e = useEGrid ? enemies[buf[i]] : enemies[i];
            if (e.dead || e.isDying || e.bubbleTrappedTimer > 0 || e.isAirborneImmune) continue;
            const edx = e.x - unit.x, edy = e.y - unit.y, hitDist = unit.radius + e.radius + pad;
            if (Math.abs(edx) > hitDist || Math.abs(edy) > hitDist || edx * edx + edy * edy >= hitDist * hitDist) continue;
            if (unit.vf185Active && typeof HeroUltimates !== 'undefined') {
                HeroUltimates.onVF185RamEnemy(unit, e, effects, game);
            } else if (rush) {
                if (!unit.bladeRushHitEnemies) unit.bladeRushHitEnemies = new Set();
                if (!unit.bladeRushHitEnemies.has(e)) {
                    unit.bladeRushHitEnemies.add(e);
                    e.takeDamage(85 * (unit.damageMultiplier || 1), effects);
                    if (!e.isStationary) { e.x += Math.cos(unit.angle) * 18; e.y += Math.sin(unit.angle) * 18; }
                    if (effects) { effects.addSlash(e.x, e.y, unit.angle, 65, '#00d2d3'); effects.addSparks(e.x, e.y, '#00d2d3', 6); effects.addComicSplash(e.x, e.y - 20, 'SLASH!'); }
                    if (window.soundEngine) window.soundEngine.playHit(true, true);
                }
            } else if (e.damage > 0 && !unit.isGrabbed && !unit.isAirborne) {
                if (!game.isCoopGuest) unit.takeDamage(e.damage * 0.4, effects, camera);
                const angle = Math.atan2(unit.y - e.y, unit.x - e.x);
                unit.x += Math.cos(angle) * 4;
                unit.y += Math.sin(angle) * 4;
            }
        }
    }

    /**
     * Handle Enemy Defeat, XP, Loot Pinata, Killfeed, & Quests
     */
    static handleDeath(game, enemy) {
        if (typeof SymbioteLauncher !== 'undefined') SymbioteLauncher.onEnemyDeath(enemy, game);
        if (typeof SkewerCharcoalRifle !== 'undefined') SkewerCharcoalRifle.onEnemyDeath(enemy, game);
        const player = game.player;
        if (typeof HeroUltimates !== 'undefined') HeroUltimates.onEnemyKilled(player, enemy);
        player.kills++;
        game.waveManager.waveEnemiesKilled++;
        if (!enemy._deathPopped && game.effects && typeof game.effects.addDeathPop === 'function') {
            enemy._deathPopped = true;
            game.effects.addDeathPop(enemy.x, enemy.y, enemy.radius, enemy.color, enemy.isBoss || enemy.isMiniBoss);
        }

        const heroName = player.name;

        if (enemy.type === 'fatmir') {
            player.fatmirKills++;
            player.score += 250;
            if (game.ui && typeof game.ui.addKillfeed === 'function') {
                game.ui.addKillfeed(`${heroName} BONKED ${enemy.isCrimson ? 'Crimson Fatmir 🔥' : 'Skatmir'}! 💥`);
            }
            for (let i = 0; i < 3; i++) {
                game.drops.push(new Drop(enemy.x, enemy.y, 'xp', 25));
            }
            if (Math.random() < 0.45) {
                game.drops.push(new Drop(enemy.x, enemy.y, 'heart', 35));
            }
            if (Math.random() < 0.25) {
                game.drops.push(new Drop(enemy.x, enemy.y, 'star', 1));
            }
        } else if (enemy.type === 'skarmogyftos') {
            player.skarmogyftosKills = (player.skarmogyftosKills || 0) + 1;
            player.score += 220;
            if (game.ui && typeof game.ui.addKillfeed === 'function') {
                game.ui.addKillfeed(`${heroName} outsmarted Skarmogyftos! 💨`);
            }
            const extraLoot = (enemy.stolenLootCount || 0);
            for (let i = 0; i < 3 + extraLoot; i++) {
                game.drops.push(new Drop(enemy.x + (Math.random() * 40 - 20), enemy.y + (Math.random() * 40 - 20), 'xp', 25));
            }
            if (Math.random() < 0.5 || extraLoot > 0) {
                game.drops.push(new Drop(enemy.x, enemy.y, 'heart', 35));
            }
            if (Math.random() < 0.35) {
                game.drops.push(new Drop(enemy.x, enemy.y, 'star', 1));
            }
        } else if (enemy.type === 'psaltis') {
            player.score += 200;
            if (game.ui && typeof game.ui.addKillfeed === 'function') {
                game.ui.addKillfeed(`${heroName} silenced Psaltis! 🎵`);
            }
            for (let i = 0; i < 2; i++) {
                game.drops.push(new Drop(enemy.x + (Math.random() * 30 - 15), enemy.y + (Math.random() * 30 - 15), 'xp', 25));
            }
            if (Math.random() < 0.4) {
                game.drops.push(new Drop(enemy.x, enemy.y, 'heart', 35));
            }
            if (Math.random() < 0.3) {
                game.drops.push(new Drop(enemy.x, enemy.y, 'star', 1));
            }
        } else if (enemy.type === 'kleanthis') {
            player.kleanthisKills = (player.kleanthisKills || 0) + 1;
            player.score += 300;
            if (!enemy.crateAwarded && !game.isCoopGuest) {
                enemy.crateAwarded = true;
                if (typeof window !== 'undefined' && window.inventoryManager) window.inventoryManager.addCrate('boss_crate_normal', 1);
                if (game.coopSession && game.coopSession.syncBossCrate) game.coopSession.syncBossCrate('boss_crate_normal', 'Kleanthis');
            }
            if (game.ui && typeof game.ui.addKillfeed === 'function') {
                game.ui.addKillfeed(`${heroName} conquered Kleanthis! 🎩`);
            }
            for (let i = 0; i < 4; i++) {
                game.drops.push(new Drop(enemy.x, enemy.y, 'xp', 30));
            }
            if (Math.random() < 0.45) {
                game.drops.push(new Drop(enemy.x, enemy.y, 'heart', 40));
            }
            if (Math.random() < 0.35) {
                game.drops.push(new Drop(enemy.x, enemy.y, 'star', 1));
            }
        } else if (enemy.type === 'rouf') {
            player.roufKills = (player.roufKills || 0) + 1;
            player.score += 600;
            if (!enemy.crateAwarded) {
                enemy.crateAwarded = true;
                if (typeof window !== 'undefined' && window.inventoryManager) window.inventoryManager.addCrate('boss_crate_hard', 1);
                if (!game.isCoopGuest && game.coopSession && game.coopSession.syncBossCrate) game.coopSession.syncBossCrate('boss_crate_hard', 'Rouf');
            }
            if (game.ui && typeof game.ui.addKillfeed === 'function') {
                game.ui.addKillfeed(`${heroName} busted Rouf! 🚨`);
            }
            if (!game.isCoopGuest) {
                if (typeof BossRewardManager !== 'undefined') {
                    const q = BossRewardManager.queueBossDrops('rouf', { effects: game.effects, x: enemy.x, y: enemy.y, game });
                    if (q.queued.length > 0 && game.ui && typeof game.ui.addKillfeed === 'function') game.ui.addKillfeed(`📱 Boss Drop: Dial-Tone Blaster (Claim in Menu)!`);
                } else if (typeof WeaponSystem !== 'undefined') {
                    const unlockRes = WeaponSystem.unlockWeapon('dialtone', { effects: game.effects, x: enemy.x, y: enemy.y });
                    if (unlockRes.unlockedNow && game.ui && typeof game.ui.addKillfeed === 'function') game.ui.addKillfeed(`📱 Unlocked Weapon: Rouf's Dial-Tone Blaster!`);
                }
            }
            for (let i = 0; i < 6; i++) {
                game.drops.push(new Drop(enemy.x, enemy.y, 'xp', 40));
            }
            game.drops.push(new Drop(enemy.x, enemy.y, 'heart', 50));
            game.drops.push(new Drop(enemy.x, enemy.y, 'star', 3));
        } else if (enemy.type === 'kiloumpas') {
            if (typeof enemy.releaseGrab === 'function') enemy.releaseGrab();
            player.kiloumpasKills = (player.kiloumpasKills || 0) + 1;
            player.score += 450;
            if (!enemy.crateAwarded && !game.isCoopGuest) {
                enemy.crateAwarded = true;
                if (typeof window !== 'undefined' && window.inventoryManager) window.inventoryManager.addCrate('boss_crate_normal', 1);
                if (game.coopSession && game.coopSession.syncBossCrate) game.coopSession.syncBossCrate('boss_crate_normal', 'Kiloumpas');
            }
            if (game.ui && typeof game.ui.addKillfeed === 'function') {
                game.ui.addKillfeed(`${heroName} out-slugged Kiloumpas! 👴`);
            }
            if (!game.isCoopGuest) {
                if (typeof BossRewardManager !== 'undefined') {
                    const q = BossRewardManager.queueBossDrops('kiloumpas', { effects: game.effects, x: enemy.x, y: enemy.y, game });
                    if (q.queued.length > 0 && game.ui && typeof game.ui.addKillfeed === 'function') game.ui.addKillfeed(`🔫 Boss Drop: Kiloumpas's Carbine (Claim in Menu)!`);
                } else if (typeof WeaponSystem !== 'undefined') {
                    const unlockRes = WeaponSystem.unlockWeapon('carbine', { effects: game.effects, x: enemy.x, y: enemy.y });
                    if (unlockRes.unlockedNow && game.ui && typeof game.ui.addKillfeed === 'function') game.ui.addKillfeed(`🔫 Unlocked Weapon: Kiloumpas's Carbine!`);
                }
            }
            for (let i = 0; i < 5; i++) {
                game.drops.push(new Drop(enemy.x, enemy.y, 'xp', 35));
            }
            game.drops.push(new Drop(enemy.x, enemy.y, 'heart', 45));
            game.drops.push(new Drop(enemy.x, enemy.y, 'star', 2));
        } else if (enemy.type === 'astynomos' || enemy.type === 'mat_officer') {
            player.score += 180;
            if (game.ui && typeof game.ui.addKillfeed === 'function') {
                const label = enemy.type === 'mat_officer' ? 'MAT Police! 🛡️' : 'Police Officer! 👮';
                game.ui.addKillfeed(`${heroName} evaded ${label}`);
            }
            for (let i = 0; i < 2; i++) {
                game.drops.push(new Drop(enemy.x, enemy.y, 'xp', 25));
            }
            if (Math.random() < 0.35) {
                game.drops.push(new Drop(enemy.x, enemy.y, 'heart', 30));
            }
        } else if (enemy.type === 'zeus_crystal' || enemy.type === 'apex_shield_pillar') {
            player.score += (enemy.scoreValue || 180);
            if (game.ui && typeof game.ui.addKillfeed === 'function') {
                const defaultName = enemy.type === 'apex_shield_pillar' ? 'Aegis Pillar' : 'Storm Crystal';
                const icon = enemy.type === 'apex_shield_pillar' ? '🛡️' : '💎';
                game.ui.addKillfeed(`${heroName} shattered ${enemy.name || defaultName}! ${icon}`);
            }
            for (let i = 0; i < 2; i++) {
                game.drops.push(new Drop(enemy.x + (Math.random() - 0.5) * 24, enemy.y + (Math.random() - 0.5) * 24, 'xp', 30));
            }
            if (Math.random() < 0.35) game.drops.push(new Drop(enemy.x, enemy.y, 'heart', 35));
        } else if (enemy.type === 'frost_wolf' || enemy.type === 'ice_golem' || enemy.type === 'casillas_sentinel' || enemy.type === 'ravine_chieftain' || enemy.type === 'frost_titan' || enemy.type === 'kiloumpas_berserker' || enemy.type === 'zeus') {
            player.score += (enemy.scoreValue || 250);
            if (game.ui && typeof game.ui.addKillfeed === 'function') {
                game.ui.addKillfeed(`${heroName} defeated ${enemy.name || 'Olympian foe'}! ⚡`);
            }
            if (!game.isCoopGuest && enemy.type === 'zeus' && typeof ZeusSkyPhase !== 'undefined') ZeusSkyPhase.grantZeusFirstKillRewards(enemy, game);
            const xpTotal = enemy.xpDrop || 50;
            const orbCount = enemy.isBoss ? 5 : 2;
            const xpPerOrb = Math.max(15, Math.round(xpTotal / orbCount));
            for (let i = 0; i < orbCount; i++) {
                game.drops.push(new Drop(enemy.x + (Math.random() - 0.5) * 30, enemy.y + (Math.random() - 0.5) * 30, 'xp', xpPerOrb));
            }
            if (enemy.isBoss || Math.random() < 0.35) {
                game.drops.push(new Drop(enemy.x, enemy.y, 'heart', 40));
            }
        } else if (typeof EndlessWaveDirector !== 'undefined' && EndlessWaveDirector.handleEnemyDeath(game, enemy)) {
            // Endless enemies & bosses handled by EndlessWaveDirector (score, crate drops, loot)
        } else {
            player.casillasKills++;
            player.score += 150;
            if (game.ui && typeof game.ui.addKillfeed === 'function') {
                game.ui.addKillfeed(`${heroName} outplayed Casillas! ⚽`);
            }
            for (let i = 0; i < 2; i++) {
                game.drops.push(new Drop(enemy.x, enemy.y, 'xp', 20));
            }
            if (Math.random() < 0.3) {
                game.drops.push(new Drop(enemy.x, enemy.y, 'magnet', 1));
            }
            if (Math.random() < 0.2) {
                game.drops.push(new Drop(enemy.x, enemy.y, 'shield', 1));
            }
        }

        if (game.gameMode === 'endless' && typeof EndlessWaveDirector !== 'undefined' && typeof EndlessWaveDirector.maybeDropChronoCore === 'function') {
            EndlessWaveDirector.maybeDropChronoCore(game, enemy);
        }

        if (!game.isCoopGuest && typeof MaterialRegistry !== 'undefined') {
            if (!enemy.materialsAwarded && (enemy.type === 'kleanthis' || enemy.type === 'kiloumpas' || enemy.type === 'rouf')) {
                enemy.materialsAwarded = true;
                const bossMats = MaterialRegistry.getStoryBossRewards(enemy.type);
                if (bossMats && typeof window !== 'undefined' && window.inventoryManager) {
                    window.inventoryManager.awardBattleMaterials(bossMats, {
                        game,
                        x: enemy.x,
                        y: enemy.y,
                        source: 'story_boss',
                        sourceName: `${enemy.name || enemy.type} Bounty`
                    });
                }
            }
            MaterialRegistry.maybeDropForEnemy(game, enemy);
        }

        // Battle Perks & Endgame Gear On-Kill Hooks
        if (typeof window !== 'undefined' && window.perkSystem) {
            window.perkSystem.onEnemyKilled(enemy, game);
        }
        if (typeof GearPassives !== 'undefined') {
            GearPassives.onEnemyKilled(player, enemy, game);
        }
    }

    /**
     * Kitsos 10% Chain Lightning Mechanic:
     * Chains up to 4 enemies max, dealing shock damage and drawing electric chain arcs
     */
    static triggerLightningChain(startEnemy, baseDamage, enemies, effects, game, shooter = null) {
        if (!startEnemy || !enemies || !effects) return;

        const maxChained = 4;
        const chained = new Set([startEnemy]);
        let lastX = startEnemy.x;
        let lastY = startEnemy.y;

        const hasGrid = typeof SpatialHashGrid !== 'undefined';
        const eGrid = hasGrid ? SpatialHashGrid.enemyGrid : null;
        const useGrid = !!(eGrid && eGrid.source === enemies);
        const cBuf = hasGrid ? SpatialHashGrid._chainBuf : null;

        for (let step = 0; step < maxChained; step++) {
            let closest = null;
            let closestDistSq = 250 * 250; // max chain jump distance 250px
            const cLen = useGrid ? eGrid.queryIndices(lastX, lastY, 252, cBuf) : enemies.length;

            for (let i = 0; i < cLen; i++) {
                const cand = useGrid ? enemies[cBuf[i]] : enemies[i];
                if (cand.dead || cand.isDying || cand.isAirborneImmune || chained.has(cand)) continue;

                const dx = cand.x - lastX;
                const dy = cand.y - lastY;
                const distSq = dx * dx + dy * dy;
                if (distSq < closestDistSq) {
                    closestDistSq = distSq;
                    closest = cand;
                }
            }

            if (!closest) break;

            chained.add(closest);
            closest.takeDamage(baseDamage * 0.85, effects, false);
            if (game && game.isCoopGuest) closest.dead = false;

            effects.addLightningChain(lastX, lastY, closest.x, closest.y, '#00d2d3');
            if (shooter && typeof CoopCombatFx !== 'undefined') CoopCombatFx.relayChain(shooter, lastX, lastY, closest.x, closest.y, '#00d2d3');
            lastX = closest.x;
            lastY = closest.y;
        }

        if (chained.size > 1) {
            effects.addComicSplash(startEnemy.x, startEnemy.y - 28, '⚡ CHAIN ZAP!');
            if (window.soundEngine && typeof window.soundEngine.playCrit === 'function') {
                window.soundEngine.playCrit();
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.CollisionSystem = CollisionSystem;
}
