/**
 * Lesa.io - Zeus Aerial Siege Orchestrator & Summit Sky-Shield HUD (Mount Olympus Floor 5)
 * Manages Zeus's high-altitude invulnerable phase triggered at <= 80% HP:
 * - Hovers Zeus across the summit clouds while tethered to Storm Crystals
 * - Drops targeted aerial lightning barrages & fires sky javelin volleys
 * - Summons capped Olympian defender waves onto the arena
 * - Returns Zeus to the marble summit once all active crystals are shattered
 */

class ZeusSkyPhase {
    static handleDamageGate(zeus, amount, effects, fromCrit, playSound, applySuper) {
        if (zeus.isDying || zeus.dead) return false;

        if (zeus.isFlying || zeus.isAirborneImmune) {
            if (effects) {
                const liftY = zeus.getVisualLiftY();
                effects.addSparks(zeus.x, zeus.y - liftY, '#00f5ff', 5);
                if (zeus._immuneFeedbackCooldown <= 0) {
                    zeus._immuneFeedbackCooldown = 36;
                    effects.addComicSplash(zeus.x, zeus.y - liftY - 40, '🛡️ DESTROY CRYSTALS!');
                }
            }
            return false;
        }

        if (!zeus.aerialTriggered) {
            const gateHp = Math.ceil(zeus.maxHp * zeus.aerialThresholdRatio);
            if (zeus.hp <= gateHp) {
                this.enter(zeus, effects);
                return false;
            }
            const vuln = zeus.damageVulnerabilityMultiplier || 1.0;
            const capped = Math.min(amount, Math.max(1, (zeus.hp - gateHp) / vuln));
            const didHit = applySuper(capped, effects, fromCrit, playSound);
            if (zeus.hp <= gateHp) {
                zeus.hp = gateHp;
                zeus.dead = false;
                zeus.isDying = false;
                this.enter(zeus, effects);
            }
            return didHit;
        }

        const didHit = applySuper(amount, effects, fromCrit, playSound);
        if (zeus.hp <= 0) {
            zeus.hp = 0;
            zeus.dead = false;
            if (!zeus.isDying) {
                zeus.isDying = true;
                zeus.isFlying = false;
                zeus.isAirborneImmune = false;
                zeus.deathTimer = 0;
                if (effects) {
                    effects.addShockwave(zeus.x, zeus.y, 160, 'rgba(255, 215, 0, 0.95)');
                    effects.addComicSplash(zeus.x, zeus.y - 50, '⚡ DIVINE ASCENSION! ⚡');
                }
            }
        }
        return didHit;
    }

    static enter(zeus, effects = null) {
        if (!zeus || zeus.aerialTriggered) return;
        zeus.aerialTriggered = true;
        zeus.isFlying = true;
        zeus.isAirborneImmune = true;
        zeus.stunTimer = 0;
        zeus.fearTimer = 0;
        zeus.aerialStrikeTimer = 45;
        zeus.aerialSpawnTimer = 260;

        if (effects) {
            effects.addShockwave(zeus.x, zeus.y, 185, 'rgba(0, 245, 255, 0.95)');
            effects.addShockwave(zeus.x, zeus.y, 130, 'rgba(255, 215, 0, 0.9)');
            effects.addSparks(zeus.x, zeus.y, '#00f5ff', 16);
            effects.addComicSplash(zeus.x, zeus.y - 55, '⚡ SKY SHIELD! SHATTER THE CRYSTALS!');
            if (typeof effects.onBossSlam === 'function') effects.onBossSlam(0.06);
        }
    }

    static exit(zeus, effects = null) {
        if (!zeus || !zeus.isFlying) return;
        zeus.isFlying = false;
        zeus.isAirborneImmune = false;
        zeus.descentRecoverTimer = 75;
        if (effects) {
            effects.addShockwave(zeus.x, zeus.y, 220, 'rgba(255, 215, 0, 0.95)');
            effects.addShockwave(zeus.x, zeus.y, 150, 'rgba(0, 245, 255, 0.9)');
            effects.addSparks(zeus.x, zeus.y, '#fed330', 18);
            effects.addComicSplash(zeus.x, zeus.y - 55, '💥 SHIELD SHATTERED! ZEUS IS DOWN!');
            if (typeof effects.onBossSlam === 'function') effects.onBossSlam(0.08);
        }
    }

    static spawnAerialMinions(zeus, player, enemies, arena, effects, count = 2) {
        if (!zeus || !Array.isArray(enemies)) return 0;
        const MAX_ACTIVE_MINIONS = 6;
        const maxTotal = (typeof zeus.maxTotalMinionsSpawned === 'number') ? zeus.maxTotalMinionsSpawned : 10;
        const totalRemaining = Math.max(0, maxTotal - (zeus.totalMinionsSpawned || 0));
        if (totalRemaining <= 0) return 0;

        let currentMinions = 0;
        for (let i = 0; i < enemies.length; i++) {
            const e = enemies[i];
            if (e && !e.dead && !e.isBoss && !e.isCrystal) currentMinions++;
        }
        const toSpawn = Math.min(count, Math.max(0, MAX_ACTIVE_MINIONS - currentMinions), totalRemaining);
        if (toSpawn <= 0) return 0;

        const bounds = (arena && arena.dungeonBounds)
            || (typeof OlympusLayouts !== 'undefined' ? OlympusLayouts.getFloorConfig(5).bounds : { minX: -1160, maxX: 1160, minY: -1160, maxY: 1160 });
        const mult = Math.max(1.0, zeus.waveMultiplier || 1.0);
        let added = 0;

        for (let i = 0; i < toSpawn; i++) {
            const baseAng = Math.random() * Math.PI * 2;
            const radiusDist = 290 + Math.random() * 210;
            const refX = player ? player.x : zeus.x;
            const refY = player ? player.y : zeus.y;
            let sx = Math.max(bounds.minX + 70, Math.min(bounds.maxX - 70, refX + Math.cos(baseAng) * radiusDist));
            let sy = Math.max(bounds.minY + 70, Math.min(bounds.maxY - 70, refY + Math.sin(baseAng) * radiusDist));
            if (typeof OlympusLayouts !== 'undefined' && typeof OlympusLayouts.findSafePosition === 'function') {
                const safe = OlympusLayouts.findSafePosition(sx, sy, 32, arena);
                sx = safe.x;
                sy = safe.y;
            }

            const roll = (zeus._spawnSeq = (zeus._spawnSeq || 0) + 1) % 3;
            let minion = null;
            if (roll === 0 && typeof IceGolem !== 'undefined') {
                minion = new IceGolem(sx, sy, mult * 0.9);
            } else if (typeof FrostWolf !== 'undefined') {
                minion = new FrostWolf(sx, sy, mult * 0.95);
            } else if (typeof Casillas !== 'undefined') {
                minion = new Casillas(sx, sy, mult * 0.85);
            }
            if (!minion) continue;

            minion.spawnedByZeus = true;
            enemies.push(minion);
            zeus.totalMinionsSpawned = (zeus.totalMinionsSpawned || 0) + 1;
            added++;

            if (effects) {
                effects.addLightningChain(sx, sy - 220, sx, sy, '#fed330');
                effects.addShockwave(sx, sy, 70, 'rgba(241, 196, 15, 0.8)');
                effects.addSparks(sx, sy, '#00f5ff', 8);
            }
        }
        return added;
    }

    static summonLightningBarrage(zeus, player, effects, arena = null) {
        if (!zeus || !player) return;
        if (effects && Math.random() < 0.55) {
            effects.addComicSplash(zeus.x, zeus.y - zeus.getVisualLiftY() - 35, '🌩️ WRATH FROM ABOVE!');
        }
        const b = (arena && arena.dungeonBounds) || { minX: -1200, maxX: 1200, minY: -1200, maxY: 1200 };
        const targets = [{
            x: player.x + (player.vx || 0) * 12,
            y: player.y + (player.vy || 0) * 12
        }];
        for (let i = 0; i < 3; i++) {
            const ang = (i / 3) * Math.PI * 2 + Math.random() * 1.2;
            const r = 95 + Math.random() * 135;
            targets.push({ x: player.x + Math.cos(ang) * r, y: player.y + Math.sin(ang) * r });
        }
        for (let i = 0; i < targets.length; i++) {
            zeus.lightningStrikes.push({
                x: Math.max(b.minX + 60, Math.min(b.maxX - 60, targets[i].x)),
                y: Math.max(b.minY + 60, Math.min(b.maxY - 60, targets[i].y)),
                radius: 68,
                timer: 48,
                maxTimer: 48,
                struck: false,
                fromSky: true
            });
        }
    }

    static update(zeus, dt, player, enemies, bullets, effects, arena) {
        if (!zeus.crystalsSpawned) {
            zeus.crystalsSpawned = true;
            if (typeof ZeusCrystal !== 'undefined') {
                ZeusCrystal.spawnSummitCrystals(zeus, enemies, arena, effects);
            }
            this.spawnAerialMinions(zeus, player, enemies, arena, effects, 3);
        }

        const aliveCrystals = zeus.crystals.filter(c => c && !c.dead && c.hp > 0);
        if (zeus.crystalsSpawned && aliveCrystals.length === 0) {
            this.exit(zeus, effects);
            return false;
        }

        const orbitT = zeus.age * 0.018;
        const targetX = player.x * 0.4 + Math.cos(orbitT) * 260;
        const targetY = player.y * 0.4 - 90 + Math.sin(orbitT * 0.85) * 190;
        const ox = targetX - zeus.x;
        const oy = targetY - zeus.y;
        const od = Math.hypot(ox, oy) || 1;
        if (od > 14) {
            const flySpd = Math.min(od, zeus.baseSpeed * 1.15 * dt);
            zeus.x += (ox / od) * flySpd;
            zeus.y += (oy / od) * flySpd;
        }
        zeus.applyArenaBounds(arena);
        zeus.angle = Math.atan2(player.y - zeus.y, player.x - zeus.x);

        zeus.aerialStrikeTimer -= dt;
        if (zeus.aerialStrikeTimer <= 0) {
            zeus.aerialStrikeTimer = 98 + Math.random() * 28;
            this.summonLightningBarrage(zeus, player, effects, arena);
        }

        zeus.javelinTimer -= dt;
        if (zeus.javelinTimer <= 0) {
            zeus.javelinTimer = 128 + Math.random() * 28;
            zeus.fireLightningJavelins(bullets, effects);
        }

        zeus.aerialSpawnTimer -= dt;
        if (zeus.aerialSpawnTimer <= 0) {
            zeus.aerialSpawnTimer = 270;
            this.spawnAerialMinions(zeus, player, enemies, arena, effects, 2);
        }
        return true;
    }

    static banishSummonedForces(enemies, effects) {
        if (!Array.isArray(enemies)) return;
        for (let i = 0; i < enemies.length; i++) {
            const m = enemies[i];
            if (m && !m.dead && (m.spawnedByZeus || m.type === 'zeus_crystal')) {
                m.shatteredNotified = true;
                m.dead = true;
                if (effects) {
                    effects.addSparks(m.x, m.y, '#fed330', 6);
                    effects.addShockwave(m.x, m.y, 55, 'rgba(255, 215, 0, 0.75)');
                }
            }
        }
    }

    static drawZeusSkyEffects(ctx, zeus, hoverY, r) {
        if (!zeus.flyHeight && !zeus.isAirborneImmune) return;
        const fly = zeus.flyHeight || 0;
        if (fly > 0.02) {
            ctx.fillStyle = `rgba(0, 245, 255, ${0.18 * fly})`;
            ctx.strokeStyle = `rgba(241, 196, 15, ${0.75 * fly})`;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.ellipse(0, r * 0.92, r * (1.2 + fly * 0.35), r * (0.45 + fly * 0.14), 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        if (zeus.isAirborneImmune) {
            const pulse = 0.5 + 0.5 * Math.sin(zeus.age * 0.2);
            ctx.fillStyle = `rgba(0, 245, 255, ${0.14 + pulse * 0.1})`;
            ctx.strokeStyle = '#70f8ff';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, hoverY - 12, r * 1.48, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
    }

    static drawCrystalCounterHUD(ctx, width, height, game) {
        if (!game || !Array.isArray(game.enemies)) return;
        const zeus = game.enemies.find(e => e && e.type === 'zeus' && !e.dead);
        if (!zeus || !zeus.isFlying) return;

        const aliveCrystals = game.enemies.filter(e => e && e.type === 'zeus_crystal' && !e.dead && e.hp > 0);
        const total = zeus.crystalTotalCount || 4;
        const rem = aliveCrystals.length;

        ctx.save();
        const dpr = (game && game.dpr) ? game.dpr : 1;
        const cx = width / 2;
        const cy = 152 * dpr;
        const label = rem > 0
            ? `⚡ ZEUS SKY SHIELD ACTIVE — SHATTER CRYSTALS: ${rem} / ${total}`
            : `⚡ CRYSTALS SHATTERED — ZEUS DESCENDING!`;

        ctx.font = `900 ${Math.round(16 * dpr)}px 'Lilita One', 'Fredoka', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const padW = Math.max(360 * dpr, ctx.measureText(label).width + 44 * dpr);
        const boxH = 36 * dpr;

        ctx.fillStyle = 'rgba(10, 18, 36, 0.88)';
        ctx.beginPath();
        ctx.roundRect(cx - padW / 2, cy - boxH / 2, padW, boxH, 12 * dpr);
        ctx.fill();

        ctx.lineWidth = 2.6 * dpr;
        ctx.strokeStyle = rem > 0 ? '#00f5ff' : '#fed330';
        ctx.stroke();

        ctx.lineWidth = 4 * dpr;
        ctx.strokeStyle = '#0c101b';
        ctx.strokeText(label, cx, cy);
        ctx.fillStyle = rem > 0 ? '#70f8ff' : '#fed330';
        ctx.fillText(label, cx, cy);

        if (rem > 0 && game.player && game.camera) {
            for (let i = 0; i < aliveCrystals.length; i++) {
                const c = aliveCrystals[i];
                const sp = (typeof game.camera.worldToScreen === 'function')
                    ? game.camera.worldToScreen(c.x, c.y)
                    : { x: (c.x - game.camera.x) + width / 2 / dpr, y: (c.y - game.camera.y) + height / 2 / dpr };
                const sx = sp.x * dpr;
                const sy = sp.y * dpr;
                if (sx >= 24 * dpr && sx <= width - 24 * dpr && sy >= 24 * dpr && sy <= height - 24 * dpr) continue;
                const pp = (typeof game.camera.worldToScreen === 'function')
                    ? game.camera.worldToScreen(game.player.x, game.player.y)
                    : { x: width / (2 * dpr), y: height / (2 * dpr) };
                const ang = Math.atan2(c.y - game.player.y, c.x - game.player.x);
                const px = pp.x * dpr + Math.cos(ang) * 76 * dpr;
                const py = pp.y * dpr + Math.sin(ang) * 76 * dpr;

                ctx.save();
                ctx.translate(px, py);
                ctx.rotate(ang);
                ctx.fillStyle = '#00f5ff';
                ctx.strokeStyle = '#14141c';
                ctx.lineWidth = 2 * dpr;
                ctx.beginPath();
                ctx.moveTo(11 * dpr, 0);
                ctx.lineTo(-6 * dpr, -6 * dpr);
                ctx.lineTo(-3 * dpr, 0);
                ctx.lineTo(-6 * dpr, 6 * dpr);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
        }
        ctx.restore();
    }

    /**
     * Grant all 3 Mythic Zeus rewards on first victory over Zeus (Mount Olympus Floor 5):
     * - Armor: Aegis Cuirass of Zeus (zeus_aegis_cuirass)
     * - Weapon: Zeus's Master Thunderbolt (zeus_thunderbolt)
     * - Active Skill: Wrath of Olympus (wrath_of_olympus)
     */
    static grantZeusFirstKillRewards(zeus = null, game = null) {
        if (typeof window !== 'undefined' && window.GameState && typeof window.GameState.recordBossDefeat === 'function') window.GameState.recordBossDefeat('zeus');
        const activeGame = game || (typeof window !== 'undefined' ? window.gameInstance : null);
        const effects = activeGame ? activeGame.effects : null;
        const px = zeus ? zeus.x : (activeGame && activeGame.player ? activeGame.player.x : 0);
        const py = zeus ? zeus.y : (activeGame && activeGame.player ? activeGame.player.y : 0);

        if (typeof BossRewardManager !== 'undefined' && typeof BossRewardManager.queueBossDrops === 'function') {
            const res = BossRewardManager.queueBossDrops('zeus', {
                effects,
                x: px,
                y: py,
                game: activeGame,
                bossName: (zeus && zeus.name) ? `${zeus.name} (Mount Olympus Floor 5)` : undefined,
                syncCoop: false
            });
            if (res && res.queued && res.queued.length > 0 && activeGame && activeGame.ui && typeof activeGame.ui.addKillfeed === 'function') {
                activeGame.ui.addKillfeed("⚡ ZEUS DEFEATED! Olympian Trio dropped — Claim in Menu!");
            }
        } else {
            if (typeof WeaponSystem !== 'undefined' && typeof WeaponSystem.unlockWeapon === 'function') {
                WeaponSystem.unlockWeapon('zeus_thunderbolt', { effects, x: px, y: py });
            }
            if (typeof GearManager !== 'undefined' && typeof GearManager.unlock === 'function') {
                GearManager.unlock('zeus_aegis_cuirass', { free: true, source: 'boss_zeus' });
            }
            if (typeof SkillManager !== 'undefined' && typeof SkillManager.unlockBossSkill === 'function') {
                SkillManager.unlockBossSkill('wrath_of_olympus', { effects, x: px, y: py });
            }
        }

        if (zeus && activeGame && activeGame.coopSession && !activeGame.isCoopGuest && activeGame.coopSession.net && activeGame.coopSession.net.connected) {
            activeGame.coopSession.net.send('ZEUS_REWARD_UNLOCK', { bossName: zeus.name || 'Zeus' });
        }
    }
}

if (typeof window !== 'undefined') {
    window.ZeusSkyPhase = ZeusSkyPhase;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ZeusSkyPhase };
}
