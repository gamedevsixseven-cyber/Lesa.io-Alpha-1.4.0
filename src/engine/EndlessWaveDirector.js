/**
 * Lesa.io - Endless Mode Wave & Progression Director
 * Manages progressive enemy unlocks after Wave 1, 5-wave Mini-Bosses,
 * 10-wave Main Bosses, Boss Crate progression (Easy -> Normal -> Hard -> Very Hard -> Insane),
 * and P2P Co-op spawning/rewards.
 */

const ENDLESS_DEBUT_BANNERS = {
    6: { label: '🎯 NEW ENEMY: BOUZOUKI SNIPER!', color: '#6c5ce7' },
    12: { label: '🛡️ NEW ENEMY: KAFENEIO TANK!', color: '#e67e22' },
    18: { label: '🔥 NEW ENEMY: OUZO BOMBER!', color: '#00d2d3' },
    26: { label: '⚡ NEW ENEMY: DIMOTIKI ENFORCER!', color: '#fed330' },
    32: { label: '💚 ENDGAME THREAT: BIO-ALCHEMIST!', color: '#10ac84' },
    36: { label: '🤖 HELIOS LEGION: DRONES & TROOPERS!', color: '#cd6133' }
};

const ENDLESS_SPAWN_POOL = [
    { type: 'fatmir', minWave: 1, weight: 1.0, getCtor: () => (typeof Fatmir !== 'undefined' ? Fatmir : null) },
    { type: 'casillas', minWave: 1, weight: 1.0, getCtor: () => (typeof Casillas !== 'undefined' ? Casillas : null) },
    { type: 'skarmogyftos', minWave: 6, weight: 0.85, getCtor: () => (typeof Skarmogyftos !== 'undefined' ? Skarmogyftos : null) },
    { type: 'bouzouki_sniper', minWave: 6, weight: 0.85, getCtor: () => (typeof BouzoukiSniper !== 'undefined' ? BouzoukiSniper : null) },
    {
        type: 'psaltis',
        minWave: 11,
        weight: 0.45,
        maxCount: (total) => Math.min(5, Math.max(1, Math.round(total * 0.10))),
        getCtor: () => (typeof Psaltis !== 'undefined' ? Psaltis : null)
    },
    { type: 'kafeneio_tank', minWave: 12, weight: 0.80, getCtor: () => (typeof KafeneioTank !== 'undefined' ? KafeneioTank : null) },
    { type: 'ouzo_bomber', minWave: 18, weight: 0.85, getCtor: () => (typeof OuzoBomber !== 'undefined' ? OuzoBomber : null) },
    { type: 'dimotiki_enforcer', minWave: 26, weight: 0.85, getCtor: () => (typeof DimotikiEnforcer !== 'undefined' ? DimotikiEnforcer : null) },
    {
        type: 'bio_alchemist',
        minWave: 32,
        weight: 0.42,
        maxCount: (total) => Math.min(3, Math.max(1, Math.round(total * 0.045))),
        getCtor: () => (typeof BioAlchemist !== 'undefined' ? BioAlchemist : null)
    },
    { type: 'kolossos_trooper', minWave: 35, weight: 0.72, getCtor: () => (typeof KolossosTrooper !== 'undefined' ? KolossosTrooper : null) },
    { type: 'kolossos_drone', minWave: 35, weight: 0.65, getCtor: () => (typeof KolossosDrone !== 'undefined' ? KolossosDrone : null) }
];

class EndlessWaveDirector {
    static isMiniBossWave(waveNum) {
        return waveNum > 0 && waveNum % 10 === 5;
    }

    static isBossWave(waveNum) {
        return waveNum > 0 && waveNum % 10 === 0;
    }

    static getMiniBossConfig(waveNum) {
        if (!EndlessWaveDirector.isMiniBossWave(waveNum)) return null;
        if (waveNum === 5) {
            return {
                ctorName: 'SouvlakiBrawler', title: 'PSISTIS THE GRILLMASTER',
                rankName: 'EASY MINI-BOSS', crateId: 'boss_crate_easy', rankColor: '#2ed573'
            };
        }
        if (waveNum === 15) {
            return {
                ctorName: 'TrafficWarden', title: 'WARDEN NIKOS',
                rankName: 'NORMAL MINI-BOSS', crateId: 'boss_crate_normal', rankColor: '#1e90ff'
            };
        }
        if (waveNum === 25) {
            return {
                ctorName: 'ButcherGoliath', title: 'MAKIS THE BUTCHER',
                rankName: 'VERY HARD MINI-BOSS', crateId: 'boss_crate_very_hard', rankColor: '#e67e22'
            };
        }
        if (waveNum === 35) {
            return {
                ctorName: 'SyndicateCapo', title: 'DON STAVROS',
                rankName: 'INSANE MINI-BOSS', crateId: 'boss_crate_insane', rankColor: '#ff4757'
            };
        }

        // Wave 45, 55, 65... infinite Insane Apex cycle
        const apexTier = Math.floor((waveNum - 35) / 10) + 1;
        const useSyndicate = Math.floor((waveNum - 45) / 10) % 2 === 1;
        return {
            ctorName: useSyndicate ? 'SyndicateCapo' : 'ButcherGoliath',
            title: useSyndicate ? `DON STAVROS [APEX ${apexTier}]` : `MAKIS GOLIATH [APEX ${apexTier}]`,
            rankName: `INSANE MINI-BOSS • TIER ${apexTier}`,
            crateId: 'boss_crate_insane',
            bossRank: 'insane',
            rankColor: '#ff4757',
            isApex: true
        };
    }

    static getBossConfig(waveNum) {
        if (!EndlessWaveDirector.isBossWave(waveNum)) return null;
        if (waveNum === 10) {
            return {
                ctorName: 'FrappeBaron', title: 'FRAPPE BARON',
                rankName: 'NORMAL BOSS', crateId: 'boss_crate_normal', rankColor: '#1e90ff'
            };
        }
        if (waveNum === 20) {
            return {
                ctorName: 'DozerForeman', title: 'FOREMAN KOSTAS',
                rankName: 'HARD BOSS', crateId: 'boss_crate_hard', rankColor: '#9b59b6'
            };
        }
        if (waveNum === 30) {
            return {
                ctorName: 'DimarchosBoss', title: 'O DIMARCHOS',
                rankName: 'VERY HARD BOSS', crateId: 'boss_crate_very_hard', rankColor: '#e67e22'
            };
        }
        if (waveNum === 40) {
            return {
                ctorName: 'MechaKolossos', title: 'KOLOSSOS MK-IV',
                rankName: 'FINAL INSANE BOSS', crateId: 'boss_crate_insane', rankColor: '#ff4757'
            };
        }

        // Wave 50, 60, 70... infinite Insane Apex cycle
        const apexTier = Math.floor((waveNum - 40) / 10) + 1;
        const useKolossos = Math.floor((waveNum - 50) / 10) % 2 === 1;
        return {
            ctorName: useKolossos ? 'MechaKolossos' : 'DimarchosBoss',
            title: useKolossos ? `KOLOSSOS MK-${3 + apexTier}` : `O DIMARCHOS [APEX ${apexTier}]`,
            rankName: `INSANE BOSS • TIER ${apexTier}`,
            crateId: 'boss_crate_insane',
            bossRank: 'insane',
            rankColor: '#ff4757',
            isApex: true
        };
    }

    static getUnlockedPool(waveNum) {
        const pool = [];
        for (const entry of ENDLESS_SPAWN_POOL) {
            if (waveNum < entry.minWave) continue;
            const Ctor = entry.getCtor();
            if (typeof Ctor === 'function') pool.push({ ...entry, Ctor });
        }
        return pool;
    }

    static pickEndlessEnemy(waveNum, x, y, waveMult) {
        const pool = EndlessWaveDirector.getUnlockedPool(waveNum);
        if (pool.length === 0) return null;
        const totalWeight = pool.reduce((sum, e) => sum + e.weight, 0);
        let roll = Math.random() * totalWeight;
        for (const entry of pool) {
            roll -= entry.weight;
            if (roll <= 0) return new entry.Ctor(x, y, waveMult);
        }
        return new pool[pool.length - 1].Ctor(x, y, waveMult);
    }

    /**
     * Allocates enemyCount evenly across all unlocked enemy types using weighted
     * largest-remainder quotas + Fisher-Yates shuffle so no single type dominates.
     */
    static buildEndlessRoster(waveNum, enemyCount) {
        const pool = EndlessWaveDirector.getUnlockedPool(waveNum);
        if (pool.length === 0 || enemyCount <= 0) return [];

        const slots = pool.map((e) => ({
            ...e,
            cap: e.maxCount ? e.maxCount(enemyCount) : enemyCount,
            count: 0,
            rem: 0
        }));

        // Lock capped support types first so remaining slots distribute cleanly across combat roster
        let remaining = enemyCount;
        const capped = slots.filter((s) => s.cap < enemyCount);
        const uncapped = slots.filter((s) => s.cap >= enemyCount);
        const totalAllWeight = slots.reduce((sum, s) => sum + s.weight, 0) || 1;

        for (const s of capped) {
            if (remaining <= 0) break;
            const raw = (s.weight / totalAllWeight) * enemyCount;
            s.count = Math.min(s.cap, remaining, Math.max(1, Math.round(raw)));
            remaining -= s.count;
        }

        const active = uncapped.length > 0 ? uncapped : slots;
        const activeWeight = active.reduce((sum, s) => sum + s.weight, 0) || 1;
        let allocated = 0;

        for (const s of active) {
            const exact = (s.weight / activeWeight) * remaining;
            s.count = Math.floor(exact);
            s.rem = exact - s.count;
            allocated += s.count;
        }

        const leftover = remaining - allocated;
        const byRem = [...active].sort((a, b) => (b.rem - a.rem) || (Math.random() - 0.5));
        for (let i = 0; i < leftover; i++) {
            byRem[i % byRem.length].count += 1;
        }

        // Guarantee minimum representation on debut waves (6, 12, 18, 26, and W36 Helios Legion)
        if (ENDLESS_DEBUT_BANNERS[waveNum]) {
            const debutSlots = slots.filter((s) => (waveNum === 36 ? s.minWave === 35 : s.minWave === waveNum));
            const minDebut = Math.min(3, enemyCount);
            for (const debutSlot of debutSlots) {
                const capTarget = Math.min(minDebut, debutSlot.cap);
                while (debutSlot.count < capTarget) {
                    const donors = slots
                        .filter((s) => s !== debutSlot && s.count > 1)
                        .sort((a, b) => b.count - a.count);
                    if (donors.length === 0) break;
                    donors[0].count -= 1;
                    debutSlot.count += 1;
                }
            }
        }

        const roster = [];
        for (const s of slots) {
            for (let k = 0; k < s.count; k++) roster.push(s.Ctor);
        }
        for (let i = roster.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [roster[i], roster[j]] = [roster[j], roster[i]];
        }
        return roster;
    }

    static startEndlessWave(waveManager, waveNum, player, enemies, effects) {
        if (waveManager && waveManager.isEndlessHard) {
            EndlessWaveDirector.startHardWave(waveManager, waveNum, player, enemies, effects);
            return;
        }
        waveManager.wave = waveNum;
        waveManager.waveState = 'IN_PROGRESS';
        waveManager.waveEnemiesKilled = 0;
        waveManager.waveChronoDrops = 0;
        waveManager.waveMatDrops = 0;
        if (typeof window !== 'undefined' && window.GameState && typeof window.GameState.recordWaveProgress === 'function') {
            window.GameState.recordWaveProgress('endless', waveNum);
        }

        const waveMult = 1.0 + (waveNum - 1) * 0.18;
        const encounter = EndlessWaveDirector.getBossConfig(waveNum) || EndlessWaveDirector.getMiniBossConfig(waveNum);

        if (!encounter && typeof LilXasEvent !== 'undefined' && LilXasEvent.tryStartOnEndlessWave(waveManager, waveNum, player, enemies, effects)) {
            return;
        }

        if (encounter) {
            waveManager.waveTotalEnemies = 1;
            waveManager.waveAnnouncementText = '';
            waveManager.waveAnnouncementTimer = 0;

            const game = (typeof window !== 'undefined') ? window.gameInstance : null;
            if (game && game.bossWarningOverlay) {
                game.bossWarningOverlay.trigger(encounter.title, encounter.rankName);
            }

            const spawnAngle = Math.random() * Math.PI * 2;
            const spawnDist = 450;
            const bx = player.x + Math.cos(spawnAngle) * spawnDist;
            const by = player.y + Math.sin(spawnAngle) * spawnDist;
            const BossCtor = (typeof window !== 'undefined') ? window[encounter.ctorName] : null;
            if (typeof BossCtor === 'function') {
                const extra = encounter.isApex ? {
                    hudLabel: `🔴 ${encounter.title} [INSANE] 🔴`,
                    bossRank: encounter.bossRank,
                    rankColor: encounter.rankColor,
                    crateId: encounter.crateId,
                    isApex: true
                } : {};
                enemies.push(new BossCtor(bx, by, waveMult, extra));
            }
            if (effects) {
                effects.addComicSplash(bx, by - 60, encounter.isApex ? '🔴 APEX INSANE! 🔴' : '⚠️ CHALLENGER! ⚠️');
            }
            return;
        }

        // Progressive enemy count scaled up to 120 max enemies in late Endless waves
        const enemyCount = Math.min(120, 4 + Math.floor(waveNum * 2.2));
        waveManager.waveTotalEnemies = enemyCount;

        const roster = EndlessWaveDirector.buildEndlessRoster(waveNum, enemyCount);
        for (let i = 0; i < roster.length; i++) {
            const angle = (i / enemyCount) * Math.PI * 2 + (Math.random() * 0.4);
            const dist = 540 + Math.random() * 290;
            const x = player.x + Math.cos(angle) * dist;
            const y = player.y + Math.sin(angle) * dist;
            const Ctor = roster[i];
            if (typeof Ctor === 'function') enemies.push(new Ctor(x, y, waveMult));
        }

        waveManager.showWaveAnnouncement(`ENDLESS ${waveNum}`, '#fed330', 160);
        if (effects) effects.addComicSplash(player.x, player.y - 50, `ENDLESS ${waveNum}!`);
    }

    static startHardWave(waveManager, waveNum, player, enemies, effects) {
        waveManager.wave = waveNum;
        waveManager.waveState = 'IN_PROGRESS';
        waveManager.waveEnemiesKilled = 0;
        waveManager.waveChronoDrops = 0;
        waveManager.waveMatDrops = 0;
        if (typeof window !== 'undefined' && window.GameState && typeof window.GameState.recordWaveProgress === 'function') {
            window.GameState.recordWaveProgress('endless_hard', waveNum);
        }

        const waveMult = 1.15 + (waveNum - 1) * 0.23;
        const isBoss = EndlessWaveDirector.isBossWave(waveNum);
        const isMini = !isBoss && EndlessWaveDirector.isMiniBossWave(waveNum);
        const game = (typeof window !== 'undefined') ? window.gameInstance : null;

        if (isBoss || isMini) {
            if (typeof HardBossEntranceFX !== 'undefined' && HardBossEntranceFX.spawnHardEncounter(waveManager, waveNum, player, enemies, effects)) return;
            const ang = Math.random() * Math.PI * 2;
            const bx = player.x + Math.cos(ang) * 460;
            const by = player.y + Math.sin(ang) * 460;
            const guardCount = Math.min(8, (isBoss ? 4 : 2) + Math.floor(waveNum / 10));
            if (typeof Fatmir === 'function') {
                const warlord = new Fatmir(bx, by, waveMult * (isBoss ? 2.9 : 1.9), { isCrimson: true });
                warlord.name = isBoss ? 'FATMIR OVERLORD' : 'CRIMSON WARLORD FATMIR';
                warlord.radius = isBoss ? 50 : 42;
                warlord.damage = Math.round(warlord.damage * (isBoss ? 1.45 : 1.25));
                warlord.isEndlessBoss = true;
                warlord.isMiniBoss = isMini;
                warlord.scoreValue = isBoss ? 2400 : 1200;
                warlord.goldBonus = isBoss ? 750 : 380;
                warlord.xpBonus = isBoss ? 520 : 260;
                warlord.crateId = waveNum >= 30 ? 'boss_crate_insane' : (waveNum >= 20 ? 'boss_crate_very_hard' : 'boss_crate_hard');
                if (typeof HardBossEntranceFX !== 'undefined' && HardBossEntranceFX.applyHardScaling) HardBossEntranceFX.applyHardScaling(warlord);
                enemies.push(warlord);
                const guardPool = EndlessWaveDirector._getHardEnemyPool(waveNum);
                for (let g = 0; g < guardCount; g++) {
                    const ga = ang + ((g + 1) / (guardCount + 1)) * Math.PI * 1.4 - 0.7;
                    const gx = player.x + Math.cos(ga) * 560, gy = player.y + Math.sin(ga) * 560;
                    const pick = guardPool[g % guardPool.length];
                    if (pick) {
                        const guard = pick.spawn(gx, gy, waveMult);
                        if (guard && typeof HardBossEntranceFX !== 'undefined' && HardBossEntranceFX.applyHardScaling) HardBossEntranceFX.applyHardScaling(guard);
                        if (guard) enemies.push(guard);
                    }
                }
            }
            waveManager.waveTotalEnemies = enemies.length || 1;
            if (game && game.bossWarningOverlay) {
                game.bossWarningOverlay.trigger(isBoss ? (waveNum === 60 ? 'FINAL APEX OVERLORD' : 'FATMIR OVERLORD') : 'CRIMSON WARLORD FATMIR', isBoss ? (waveNum === 60 ? 'FINAL APEX BOSS' : 'HARD BOSS') : 'HARD MINI-BOSS');
            }
            if (effects) effects.addComicSplash(bx, by - 60, isBoss ? '🔥 HARD OVERLORD! 🔥' : '🔥 CRIMSON WARLORD! 🔥');
            return;
        }

        const enemyCount = Math.min(120, 6 + Math.floor(waveNum * 2.5));
        const pool = EndlessWaveDirector._getHardEnemyPool(waveNum);
        const totalW = pool.reduce((s, e) => s + e.weight, 0) || 1;
        for (let i = 0; i < enemyCount; i++) {
            const angle = (i / enemyCount) * Math.PI * 2 + (Math.random() * 0.35);
            const dist = 540 + Math.random() * 290;
            const ex = player.x + Math.cos(angle) * dist, ey = player.y + Math.sin(angle) * dist;
            let roll = Math.random() * totalW, chosen = pool[0];
            for (const entry of pool) { roll -= entry.weight; if (roll <= 0) { chosen = entry; break; } }
            if (chosen) {
                const mob = chosen.spawn(ex, ey, waveMult);
                if (mob && typeof HardBossEntranceFX !== 'undefined' && HardBossEntranceFX.applyHardScaling) HardBossEntranceFX.applyHardScaling(mob);
                if (mob) enemies.push(mob);
            }
        }
        waveManager.waveTotalEnemies = enemies.length;
        const hardDebuts = {
            2: '🔮 VOID ACOLYTES ARRIVE!', 4: '🌋 OBSIDIAN JUGGERNAUTS!', 6: '🩸 BLOOD WRAITHS STALK!',
            9: '⚡ AETHER TEMPESTS DESCEND!', 14: '⚔️ ECLIPSE HARBINGERS AWAKEN!',
            18: '☣️ PLAGUE WEAVERS EMERGE!', 23: '❄️ GLACIAL MARKSMEN LOCK ON!', 28: '💣 HELLFIRE MORTARS DEPLOYED!'
        };
        const banner = hardDebuts[waveNum] || `🔥 HARD ENDLESS ${waveNum}`;
        waveManager.showWaveAnnouncement(banner, '#ff2e4c', hardDebuts[waveNum] ? 210 : 170);
        if (effects) effects.addComicSplash(player.x, player.y - 50, `🔥 HARD WAVE ${waveNum}!`);
    }

    static _getHardEnemyPool(waveNum) {
        const pool = [];
        if (typeof Fatmir === 'function') pool.push({ weight: 2.8, spawn: (x, y, m) => new Fatmir(x, y, m, { isCrimson: true }) });
        if (waveNum >= 2 && typeof VoidAcolyte === 'function') pool.push({ weight: 2.2, spawn: (x, y, m) => new VoidAcolyte(x, y, m) });
        if (waveNum >= 4 && typeof ObsidianGolem === 'function') pool.push({ weight: 1.9, spawn: (x, y, m) => new ObsidianGolem(x, y, m) });
        if (waveNum >= 6 && typeof CrimsonWraith === 'function') pool.push({ weight: 2.1, spawn: (x, y, m) => new CrimsonWraith(x, y, m) });
        if (waveNum >= 9 && typeof StormTempest === 'function') pool.push({ weight: 1.8, spawn: (x, y, m) => new StormTempest(x, y, m) });
        if (waveNum >= 14 && typeof EclipseHarbinger === 'function') pool.push({ weight: 1.6, spawn: (x, y, m) => new EclipseHarbinger(x, y, m) });
        if (waveNum >= 18 && typeof BlightNecromancer === 'function') pool.push({ weight: 1.5, spawn: (x, y, m) => new BlightNecromancer(x, y, m) });
        if (waveNum >= 23 && typeof CryoSniper === 'function') pool.push({ weight: 1.6, spawn: (x, y, m) => new CryoSniper(x, y, m) });
        if (waveNum >= 28 && typeof InfernoArtillery === 'function') pool.push({ weight: 1.5, spawn: (x, y, m) => new InfernoArtillery(x, y, m) });
        return pool;
    }

    static onEndlessWaveCleared(waveManager, game) {
        const waveNum = waveManager.wave;
        const isHard = !!(waveManager && waveManager.isEndlessHard);
        const bossCfg = EndlessWaveDirector.getBossConfig(waveNum);
        const miniCfg = EndlessWaveDirector.getMiniBossConfig(waveNum);
        const encounter = bossCfg || miniCfg;

        const isBoss = !!bossCfg;
        const isMini = !!miniCfg;
        const hardEncounter = (isHard && typeof HardBossEntranceFX !== 'undefined') ? HardBossEntranceFX.getHardEncounterConfig(waveNum) : null;
        const hardTitle = hardEncounter ? hardEncounter.title : (isHard && waveNum === 60 ? 'FINAL APEX OVERLORD' : (isBoss ? 'FATMIR OVERLORD' : 'CRIMSON WARLORD FATMIR'));
        const msg = isHard
            ? (isBoss ? `👑 ${hardTitle} VANQUISHED! 🔥` : (isMini ? `🔥 ${hardTitle} CRUSHED! 🔥` : `🔥 HARD WAVE ${waveNum} CLEARED!`))
            : (isBoss ? `👑 ${bossCfg.title} DEFEATED! 👑` : (isMini ? `💥 ${miniCfg.title} DEFEATED! 💥` : `ENDLESS ${waveNum} CLEARED!`));

        waveManager.showWaveAnnouncement(msg, isHard ? '#ff2e4c' : (encounter ? encounter.rankColor : '#2ed573'), encounter ? 250 : 165);

        if (encounter && game.effects) {
            game.effects.addConfetti(game.player.x, game.player.y, isBoss ? 105 : 75);
            game.effects.addComicSplash(game.player.x, game.player.y - 60, isBoss ? 'BOSS VANQUISHED! 🏆' : 'MINI-BOSS VANQUISHED! 💥');
        }

        const xpCount = (isBoss ? 12 : (isMini ? 8 : 4)) * (isHard ? 2 : 1);
        const xpVal = (encounter ? 50 : 30) * (isHard ? 2 : 1);
        const dropOff = game.coopSession ? 95 : 25;
        for (let i = 0; i < xpCount; i++) {
            const rx = game.player.x + (Math.random() * 220 - 110);
            const ry = game.player.y + (Math.random() * 220 - 110);
            game.drops.push(new Drop(rx, ry, 'xp', xpVal));
        }
        if (encounter || Math.random() < 0.7) {
            game.drops.push(new Drop(game.player.x + dropOff, game.player.y + 45, 'heart', 55));
            if (game.coopSession) game.drops.push(new Drop(game.player.x - dropOff, game.player.y + 45, 'heart', 55));
        }
        if (encounter || Math.random() < (isHard ? 0.75 : 0.45)) {
            const starVal = (isBoss ? 6 : (isMini ? 3 : 1)) * (isHard ? 2 : 1);
            game.drops.push(new Drop(game.player.x - dropOff, game.player.y - 45, 'star', starVal));
        }
        if (isHard && encounter && !game.isCoopGuest && typeof window !== 'undefined' && window.chestManager) {
            const bonusChest = isBoss ? (waveNum >= 20 ? 'apex' : 'mythic') : (waveNum >= 25 ? 'apex' : 'legendary');
            if (isBoss || Math.random() < 0.45) {
                const res = window.chestManager.addChest(bonusChest);
                if (res && game.ui && typeof game.ui.addKillfeed === 'function') {
                    game.ui.addKillfeed(`🔥 Hard Bounty: ${bonusChest.toUpperCase()} CHEST ${res === 'inventory' ? 'saved to Vault!' : 'earned!'}`);
                }
            }
        }
    }

    static spawnByType(type, x, y, waveMult = 1.0) {
        const map = {
            bouzouki_sniper: typeof BouzoukiSniper !== 'undefined' ? BouzoukiSniper : null,
            kafeneio_tank: typeof KafeneioTank !== 'undefined' ? KafeneioTank : null,
            ouzo_bomber: typeof OuzoBomber !== 'undefined' ? OuzoBomber : null,
            dimotiki_enforcer: typeof DimotikiEnforcer !== 'undefined' ? DimotikiEnforcer : null,
            bio_alchemist: typeof BioAlchemist !== 'undefined' ? BioAlchemist : null,
            souvlaki_brawler: typeof SouvlakiBrawler !== 'undefined' ? SouvlakiBrawler : null,
            traffic_warden: typeof TrafficWarden !== 'undefined' ? TrafficWarden : null,
            butcher_goliath: typeof ButcherGoliath !== 'undefined' ? ButcherGoliath : null,
            syndicate_capo: typeof SyndicateCapo !== 'undefined' ? SyndicateCapo : null,
            frappe_baron: typeof FrappeBaron !== 'undefined' ? FrappeBaron : null,
            dozer_foreman: typeof DozerForeman !== 'undefined' ? DozerForeman : null,
            dimarchos_boss: typeof DimarchosBoss !== 'undefined' ? DimarchosBoss : null,
            mecha_kolossos: typeof MechaKolossos !== 'undefined' ? MechaKolossos : null,
            kolossos_drone: typeof KolossosDrone !== 'undefined' ? KolossosDrone : null,
            kolossos_trooper: typeof KolossosTrooper !== 'undefined' ? KolossosTrooper : null,
            lil_xas: typeof LilXasBoss !== 'undefined' ? LilXasBoss : null,
            lil_xas_speaker: typeof LilXasSpeaker !== 'undefined' ? LilXasSpeaker : null
        };
        const Ctor = map[type];
        return Ctor ? new Ctor(x, y, waveMult) : null;
    }

    static handleEnemyDeath(game, enemy) {
        const player = game.player;
        const heroName = player.name || 'Hero';

        if (enemy.isEndlessBoss) {
            if (enemy.isMiniBoss) player.endlessMiniBossKills = (player.endlessMiniBossKills || 0) + 1;
            else player.endlessBossKills = (player.endlessBossKills || 0) + 1;
            if (!enemy._featRecorded && typeof window !== 'undefined' && window.GameState && typeof window.GameState.recordBossDefeat === 'function') {
                enemy._featRecorded = true;
                window.GameState.recordBossDefeat(enemy.isMiniBoss ? 'endless_mini_boss' : 'endless_boss');
                if (enemy.type === 'mecha_kolossos') window.GameState.recordBossDefeat('mecha_kolossos');
            }

            player.score += enemy.scoreValue || 900;
            player.endlessBossGoldBonus = (player.endlessBossGoldBonus || 0) + (enemy.goldBonus || 300);
            player.endlessBossXpBonus = (player.endlessBossXpBonus || 0) + (enemy.xpBonus || 200);

            if (!enemy.crateAwarded && enemy.crateId && !game.isCoopGuest) {
                enemy.crateAwarded = true;
                if (typeof window !== 'undefined' && window.inventoryManager) {
                    window.inventoryManager.addCrate(enemy.crateId, 1);
                }
                if (game.coopSession && game.coopSession.net && typeof game.coopSession.net.send === 'function') {
                    game.coopSession.net.send('BOSS_CRATE_REWARD', { crateId: enemy.crateId, bossName: enemy.name });
                }
                const crateDef = (typeof getBossCrate === 'function') ? getBossCrate(enemy.crateId) : null;
                const crateName = crateDef ? crateDef.name : enemy.crateId;
                if (game.ui && typeof game.ui.addKillfeed === 'function') {
                    game.ui.addKillfeed(`📦 ${heroName} conquered ${enemy.name}! Earned ${crateName}!`);
                }
            }
            if (!game.isCoopGuest && typeof BossRewardManager !== 'undefined' && typeof BossRewardManager.handleEndlessBossDrop === 'function') {
                BossRewardManager.handleEndlessBossDrop(enemy, game);
            }
            if (!enemy.materialsAwarded && !game.isCoopGuest && typeof MaterialRegistry !== 'undefined' && typeof window !== 'undefined' && window.inventoryManager) {
                enemy.materialsAwarded = true;
                const wNum = game.waveManager ? game.waveManager.wave : 5;
                let bossMats = MaterialRegistry.getEndlessBossRewards(wNum, !!enemy.isMiniBoss);
                if (bossMats && game.isEndlessHard) {
                    const scaled = {};
                    for (const [k, v] of Object.entries(bossMats)) scaled[k] = v * 2;
                    bossMats = scaled;
                }
                if (bossMats) {
                    window.inventoryManager.awardBattleMaterials(bossMats, { game, x: enemy.x, y: enemy.y, source: 'endless_boss', sourceName: `${enemy.name} Bounty` });
                }
            }
            const wNum = game.waveManager ? game.waveManager.wave : 0;
            const isStarWave = game.isEndlessHard ? (wNum === 30 || wNum === 40 || wNum === 60) : (wNum === 40);
            if (isStarWave && !enemy.isMiniBoss && !enemy._starStoneChecked && !game.isCoopGuest) {
                enemy._starStoneChecked = true;
                if (typeof DungeonManager !== 'undefined' && typeof DungeonManager.rollOlympianStarStone === 'function') {
                    DungeonManager.rollOlympianStarStone(game, wNum === 60 ? 0.03 : 0.015, `${enemy.name || `W${wNum} Boss`} (W${wNum})`);
                }
            }

            const orbCount = enemy.isMiniBoss ? 5 : 7;
            for (let i = 0; i < orbCount; i++) {
                game.drops.push(new Drop(enemy.x + (Math.random() * 50 - 25), enemy.y + (Math.random() * 50 - 25), 'xp', 40));
            }
            game.drops.push(new Drop(enemy.x, enemy.y, 'heart', 55));
            game.drops.push(new Drop(enemy.x + 15, enemy.y - 10, 'star', enemy.isMiniBoss ? 2 : 4));
            return true;
        }

        const regularInfo = {
            bouzouki_sniper: { score: 280, msg: `${heroName} dodged & downed Bouzouki Sniper! 🎯`, starChance: 0.30 },
            kafeneio_tank: { score: 360, msg: `${heroName} cracked Kafeneio Tank! 🛡️`, starChance: 0.35 },
            ouzo_bomber: { score: 320, msg: `${heroName} extinguished Ouzo Bomber! 🔥`, starChance: 0.35 },
            dimotiki_enforcer: { score: 440, msg: `${heroName} outgunned Dimotiki Enforcer! ⚡`, starChance: 0.45 },
            bio_alchemist: { score: 520, msg: `${heroName} neutralized Bio-Alchemist! ☣️`, starChance: 0.50 },
            kolossos_drone: { score: 220, msg: `${heroName} shot down Kolossos Drone! 🤖`, starChance: 0.15 },
            kolossos_trooper: { score: 420, msg: `${heroName} dismantled Helios Trooper! 🤖`, starChance: 0.25 },
            lil_xas_speaker: { score: 300, msg: `${heroName} smashed Lil Xas Concert Speaker! 🔇`, starChance: 0.25 },
            void_acolyte: { score: 420, msg: `${heroName} shattered Void Acolyte! 🔮`, starChance: 0.40 },
            obsidian_golem: { score: 540, msg: `${heroName} cracked Obsidian Juggernaut! 🌋`, starChance: 0.50 },
            crimson_wraith: { score: 480, msg: `${heroName} banished Blood Wraith! 🩸`, starChance: 0.45 },
            storm_tempest: { score: 560, msg: `${heroName} grounded Aether Tempest! ⚡`, starChance: 0.50 },
            eclipse_harbinger: { score: 680, msg: `${heroName} felled Eclipse Harbinger! ⚔️`, starChance: 0.60 },
            blight_necromancer: { score: 590, msg: `${heroName} purged Plague Weaver! ☣️`, starChance: 0.50 },
            cryo_sniper: { score: 550, msg: `${heroName} outsniped Glacial Marksman! ❄️`, starChance: 0.50 },
            inferno_artillery: { score: 660, msg: `${heroName} demolished Hellfire Mortar! 💣`, starChance: 0.60 }
        };
        const info = regularInfo[enemy.type];
        if (!info) return false;

        player.score += info.score;
        if (game.ui && typeof game.ui.addKillfeed === 'function') {
            game.ui.addKillfeed(info.msg);
        }
        for (let i = 0; i < 3; i++) {
            game.drops.push(new Drop(enemy.x + (Math.random() * 30 - 15), enemy.y + (Math.random() * 30 - 15), 'xp', 30));
        }
        if (Math.random() < 0.40) game.drops.push(new Drop(enemy.x, enemy.y, 'heart', 35));
        if (Math.random() < info.starChance) game.drops.push(new Drop(enemy.x, enemy.y, 'star', 1));
        return true;
    }

    /**
     * Endless Mode enemy & boss drop hook for Chrono Cores (fuel for the Wave Skipper Machine).
     * Rare normalized drop rate on Wave 3+ (max 1 random drop per wave) + 1 per Boss/Mini-Boss.
     */
    static maybeDropChronoCore(game, enemy) {
        if (!game || game.gameMode !== 'endless' || !enemy || enemy._chronoDropChecked || typeof Drop === 'undefined') return;
        enemy._chronoDropChecked = true;

        if (enemy.isEndlessBoss || enemy.isBoss || enemy.isMiniBoss) {
            game.drops.push(new Drop(enemy.x, enemy.y - 10, 'chrono_core', 1));
            return;
        }

        const wm = game.waveManager;
        const minWave = (typeof WaveSkipperMachine !== 'undefined') ? WaveSkipperMachine.APPEAR_WAVE : 3;
        if (wm && (wm.wave < minWave || (wm.waveChronoDrops || 0) >= 1)) return;

        const totalEnemies = Math.max(8, (wm && wm.waveTotalEnemies) ? wm.waveTotalEnemies : 12);
        const baseChance = Math.min(0.032, 0.36 / totalEnemies);
        const eliteTypes = new Set(['kafeneio_tank', 'dimotiki_enforcer', 'psaltis', 'bio_alchemist', 'obsidian_golem', 'crimson_wraith', 'storm_tempest', 'eclipse_harbinger', 'blight_necromancer', 'inferno_artillery']);
        const chance = eliteTypes.has(enemy.type) ? Math.min(0.055, baseChance * 1.6) : baseChance;
        if (Math.random() < chance) {
            if (wm) wm.waveChronoDrops = (wm.waveChronoDrops || 0) + 1;
            game.drops.push(new Drop(enemy.x, enemy.y, 'chrono_core', 1));
        }
    }
}

if (typeof window !== 'undefined') {
    window.EndlessWaveDirector = EndlessWaveDirector;
}
