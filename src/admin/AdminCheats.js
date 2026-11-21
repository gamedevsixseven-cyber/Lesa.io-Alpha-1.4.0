/**
 * Lesa.io - Admin Cheats & Playtesting Controller
 * Manages runtime cheats, entity/drop spawning, Story/Endless/Olympus warps,
 * active boss controls (Kleanthis & Zeus), and full progression/material unlocks.
 */

class AdminCheatsService {
    constructor() {
        this.godMode = false;
        this.infiniteDash = false;
        this.noSkillCooldown = false;
        this.ghostMode = false;
        this.instaKillEnemies = false;
        this.damageBoost = false;
        this.gameSpeed = 1.0;
    }

    /**
     * Applied each frame in the Game update loop.
     */
    applyToUpdate(game, dt) {
        if (!game || !game.player) return;
        const p = game.player;

        if (this.godMode) {
            p.hp = p.maxHp;
            p.hitFlash = 0;
            p.stunTimer = 0;
        }
        if (this.infiniteDash) {
            p.dashCooldown = 0;
            p.canDash = true;
        }
        if (this.noSkillCooldown) {
            p.skillCooldown = 0;
        }
        if (this.instaKillEnemies && Array.isArray(game.enemies) && game.enemies.length > 0) {
            for (let i = game.enemies.length - 1; i >= 0; i--) {
                this._forceKillEntity(game.enemies[i], game);
            }
        }
    }

    _forceKillEntity(enemy, game) {
        if (!enemy || enemy.dead) return;
        if (typeof ZeusBoss !== 'undefined' && enemy instanceof ZeusBoss) {
            if (Array.isArray(enemy.crystals)) {
                for (const c of enemy.crystals) {
                    if (c) { c.hp = 0; c.dead = true; }
                }
            }
            enemy.isFlying = false;
            enemy.isAirborneImmune = false;
            enemy.aerialTriggered = true;
        }
        if (typeof enemy.takeDamage === 'function') {
            const lethal = Math.max(9999999, (enemy.hp || 0) + 9999);
            enemy.takeDamage(lethal, game ? game.effects : null, true, false);
        }
        if (enemy.isDying && typeof enemy.maxDeathTimer === 'number') {
            enemy.deathTimer = Math.max(enemy.deathTimer || 0, enemy.maxDeathTimer - 2);
        } else if (enemy.hp <= 0) {
            enemy.dead = true;
        }
    }

    _ensureRunActive(game, targetMode = null) {
        if (!game) return false;
        const desiredMode = targetMode || game.gameMode || 'story';
        const needsStart = game.state !== 'PLAYING' && game.state !== 'PAUSED';
        const modeSwitch = targetMode && game.gameMode !== targetMode;

        if (needsStart || modeSwitch) {
            const nm = (typeof document !== 'undefined') ? document.getElementById('first-time-name-modal') : null;
            if (nm) nm.classList.add('hidden');
            const ui = (typeof window !== 'undefined') ? window.uiController : null;
            const menuCtrl = ui && ui.menuController;
            if (menuCtrl) {
                if (typeof menuCtrl.hideGameModeModal === 'function') menuCtrl.hideGameModeModal();
                if (menuCtrl.menuScreen) {
                    menuCtrl.menuScreen.classList.add('hidden');
                    menuCtrl.menuScreen.style.setProperty('display', 'none', 'important');
                }
            }
            if (ui && ui.hud && typeof ui.hud.show === 'function') ui.hud.show();
            const hero = (typeof window !== 'undefined' && window.GameState && window.GameState.player)
                ? window.GameState.player.selectedHero : 'psanas';
            if (typeof game.startNewGame === 'function') {
                game.startNewGame(hero, desiredMode);
            }
        } else if (game.state === 'PAUSED') {
            game.state = 'PLAYING';
            if (typeof window !== 'undefined' && window.uiController && typeof window.uiController.hideModals === 'function') {
                window.uiController.hideModals();
            }
        }
        return !!game.player;
    }

    /**
     * Nuke all active enemies currently in the arena.
     */
    nukeArena(game) {
        if (!game || !Array.isArray(game.enemies) || game.enemies.length === 0) return 0;
        const count = game.enemies.length;

        for (let i = game.enemies.length - 1; i >= 0; i--) {
            const enemy = game.enemies[i];
            if (!enemy) continue;
            if (game.effects) {
                game.effects.addComicSplash(enemy.x, enemy.y - 30, 'NUKE!', '#ff4757', 26, true);
                game.effects.addShockwave(enemy.x, enemy.y, 80, 'rgba(255, 71, 87, 0.8)');
                game.effects.addDust(enemy.x, enemy.y, 8, 10);
            }
            this._forceKillEntity(enemy, game);
        }
        if (window.soundEngine) window.soundEngine.playHit(true, true);
        return count;
    }

    fullHeal(game) {
        if (!game || !game.player) return false;
        const p = game.player;
        p.hp = p.maxHp;
        p.stunTimer = 0;
        p.speedDebuffTimer = 0;
        p.dashCooldown = 0;
        p.skillCooldown = 0;
        if (game.effects) {
            game.effects.addPopup(p.x, p.y - 24, 'FULL RESTORE!', '#2ed573', 24);
            game.effects.addShockwave(p.x, p.y, 90, 'rgba(46, 213, 115, 0.75)');
        }
        if (window.soundEngine) window.soundEngine.playPickup('heart');
        return true;
    }

    levelUpPlayer(game, levels = 1) {
        if (!game || !game.player) return 0;
        const count = Math.max(1, parseInt(levels, 10) || 1);
        for (let i = 0; i < count; i++) {
            if (typeof game.player.levelUp === 'function') game.player.levelUp();
        }
        if (window.soundEngine) window.soundEngine.playLevelUp();
        return game.player.level || 1;
    }

    /**
     * Pull all drops on the map straight into the player.
     */
    magnetizeDrops(game) {
        if (!game || !Array.isArray(game.drops) || game.drops.length === 0 || !game.player) return 0;
        const count = game.drops.length;
        const px = game.player.x;
        const py = game.player.y;

        for (const drop of game.drops) {
            drop.x = px + (Math.random() * 18 - 9);
            drop.y = py + (Math.random() * 18 - 9);
            drop.magnetized = true;
        }
        if (game.effects) {
            game.effects.addComicSplash(px, py - 45, 'MAGNET!', '#fed330', 26);
            game.effects.addShockwave(px, py, 140, 'rgba(254, 211, 48, 0.7)');
        }
        if (window.soundEngine) window.soundEngine.playPickup('cookie');
        return count;
    }

    /**
     * Clear all drops from the arena.
     */
    clearDrops(game) {
        if (!game || !Array.isArray(game.drops)) return 0;
        const count = game.drops.length;
        game.drops.length = 0;
        return count;
    }

    /**
     * Warp to a specific Story wave, Endless wave, or Mount Olympus floor (1-5).
     */
    warpMode(game, targetMode = 'story', targetNum = 1) {
        if (!game || !game.waveManager) return false;
        const mode = ['story', 'endless', 'dungeons'].includes(targetMode) ? targetMode : (game.gameMode || 'story');
        let num = Math.max(1, parseInt(targetNum, 10) || 1);
        if (mode === 'dungeons') num = Math.min(5, num);

        this._ensureRunActive(game, mode);
        if (!game.player) return false;

        game.enemies.length = 0;
        game.bullets.length = 0;
        if (Array.isArray(game.hazards)) game.hazards.length = 0;

        const dm = game.waveManager && game.waveManager.dungeonManager;
        if (mode === 'dungeons' && dm) {
            dm.startFloor(num, game.player, game.enemies, game.effects);
        } else {
            game.waveManager.startWave(num, game.player, game.enemies, game.effects);
        }

        const modeLabel = mode === 'dungeons' ? `OLYMPUS F${num}` : `${mode.toUpperCase()} W${num}`;
        if (game.effects) {
            game.effects.addComicSplash(game.player.x, game.player.y - 60, `WARP: ${modeLabel}!`, '#2ed573', 26, true);
        }
        if (window.soundEngine) window.soundEngine.playLevelUp();
        return true;
    }

    /**
     * Jump immediately to any wave in the active mode (backward-compatible API).
     */
    jumpToWave(game, waveNum) {
        const mode = (game && game.gameMode) ? game.gameMode : 'story';
        return this.warpMode(game, mode, waveNum);
    }

    /**
     * Spawn specific enemy or boss type in custom quantity using a lookup table.
     */
    spawnEntity(game, type, count = 1) {
        if (!game) return 0;
        this._ensureRunActive(game, null);
        if (!game.player) return 0;

        const qty = Math.max(1, Math.min(25, parseInt(count, 10) || 1));
        const px = game.player.x;
        const py = game.player.y;
        const waveMult = game.waveManager ? (1.0 + Math.max(0, game.waveManager.wave - 1) * 0.18) : 1.0;

        const factories = {
            fatmir: (x, y, m) => typeof Fatmir !== 'undefined' && new Fatmir(x, y, m),
            casillas: (x, y, m) => typeof Casillas !== 'undefined' && new Casillas(x, y, m),
            skarmogyftos: (x, y, m) => typeof Skarmogyftos !== 'undefined' && new Skarmogyftos(x, y, m),
            psaltis: (x, y, m) => typeof Psaltis !== 'undefined' && new Psaltis(x, y, m),
            astynomos: (x, y, m) => typeof Astynomos !== 'undefined' && new Astynomos(x, y, m, false),
            mat: (x, y, m) => typeof Astynomos !== 'undefined' && new Astynomos(x, y, m, true),
            frost_wolf: (x, y, m) => typeof FrostWolf !== 'undefined' && new FrostWolf(x, y, m),
            ice_golem: (x, y, m) => typeof IceGolem !== 'undefined' && new IceGolem(x, y, m),
            bouzouki_sniper: (x, y, m) => typeof BouzoukiSniper !== 'undefined' && new BouzoukiSniper(x, y, m),
            kafeneio_tank: (x, y, m) => typeof KafeneioTank !== 'undefined' && new KafeneioTank(x, y, m),
            ouzo_bomber: (x, y, m) => typeof OuzoBomber !== 'undefined' && new OuzoBomber(x, y, m),
            dimotiki_enforcer: (x, y, m) => typeof DimotikiEnforcer !== 'undefined' && new DimotikiEnforcer(x, y, m),
            kleanthis: (x, y, m) => typeof Kleanthis !== 'undefined' && new Kleanthis(x, y, m),
            kiloumpas: (x, y, m) => typeof Kiloumpas !== 'undefined' && new Kiloumpas(x, y, m),
            rouf: (x, y, m) => typeof Rouf !== 'undefined' && new Rouf(x, y, m),
            casillas_sentinel: (x, y, m) => typeof CasillasSentinel !== 'undefined' && new CasillasSentinel(x, y, m),
            ravine_chieftain: (x, y, m) => typeof RavineChieftain !== 'undefined' && new RavineChieftain(x, y, m),
            frost_titan: (x, y, m) => typeof FrostTitanBoreas !== 'undefined' && new FrostTitanBoreas(x, y, m),
            kiloumpas_berserker: (x, y, m) => typeof KiloumpasBerserker !== 'undefined' && new KiloumpasBerserker(x, y, m),
            zeus: (x, y, m) => typeof ZeusBoss !== 'undefined' && new ZeusBoss(x, y, m),
            souvlaki_brawler: (x, y, m) => typeof SouvlakiBrawler !== 'undefined' && new SouvlakiBrawler(x, y, m),
            frappe_baron: (x, y, m) => typeof FrappeBaron !== 'undefined' && new FrappeBaron(x, y, m),
            dimarchos: (x, y, m) => typeof DimarchosBoss !== 'undefined' && new DimarchosBoss(x, y, m),
            mecha_kolossos: (x, y, m) => typeof MechaKolossos !== 'undefined' && new MechaKolossos(x, y, m)
        };

        const createFn = factories[type];
        if (!createFn) return 0;

        let spawned = 0;
        for (let i = 0; i < qty; i++) {
            const angle = (i / qty) * Math.PI * 2 + Math.random() * 0.4;
            const dist = 160 + Math.random() * 120;
            const enemy = createFn(px + Math.cos(angle) * dist, py + Math.sin(angle) * dist, waveMult);
            if (enemy) {
                game.enemies.push(enemy);
                spawned++;
            }
        }
        if (game.effects && spawned > 0) {
            game.effects.addComicSplash(px, py - 40, `SPAWNED ${spawned}x ${type.toUpperCase()}!`, '#fed330', 22);
        }
        return spawned;
    }

    /**
     * Spawn collectible drops or crafting materials near the player.
     */
    spawnDrop(game, dropType, count = 1) {
        if (!game || typeof Drop === 'undefined') return 0;
        this._ensureRunActive(game, null);
        if (!game.player) return 0;

        const defaultValues = {
            xp: 50,
            heart: 50,
            star: 1,
            shield: 1,
            magnet: 1,
            coin_pouch: 250,
            chrono_core: 1,
            mat_armory_shards: 15,
            mat_mati_crystal: 5,
            mat_olympian_bronze: 5,
            mat_ambrosia_spark: 2
        };
        const val = defaultValues[dropType] || 1;
        const qty = Math.max(1, Math.min(20, parseInt(count, 10) || 1));

        for (let i = 0; i < qty; i++) {
            const ang = Math.random() * Math.PI * 2;
            const dist = 60 + Math.random() * 55;
            const dx = game.player.x + Math.cos(ang) * dist;
            const dy = game.player.y + Math.sin(ang) * dist;
            game.drops.push(new Drop(dx, dy, dropType, val));
        }
        return qty;
    }

    /**
     * Trigger actions on the active Boss (Kleanthis, Zeus, or generic bosses).
     */
    forceBossAction(game, action) {
        if (!game || !Array.isArray(game.enemies)) return false;
        const zeus = (typeof ZeusBoss !== 'undefined')
            ? game.enemies.find(e => e && !e.dead && e instanceof ZeusBoss) : null;
        const boss = zeus || game.enemies.find(e => e && !e.dead && (e.name === 'Kleanthis' || e.isBoss));
        if (!boss) return false;

        if (action === 'land_zeus' && zeus) {
            if (Array.isArray(zeus.crystals)) {
                for (const c of zeus.crystals) {
                    if (c) { c.hp = 0; c.dead = true; }
                }
            }
            zeus.descendFromSky(game.effects);
            return true;
        }
        if (action === 'zeus_storm' && zeus && typeof zeus.summonThunderstorm === 'function' && game.player) {
            zeus.summonThunderstorm(game.player, game.effects);
            return true;
        }
        if (action === 'zeus_wrath' && zeus) {
            zeus.hp = Math.min(zeus.hp, Math.floor(zeus.maxHp * 0.48));
            zeus.isFlying = false;
            zeus.isAirborneImmune = false;
            zeus.aerialTriggered = true;
            return true;
        }
        if (action === 'slay_boss') {
            this._forceKillEntity(boss, game);
            return true;
        }
        if (action === 'drink' && boss.startDrinking) { boss.startDrinking(game.effects); return true; }
        if (action === 'drunk' && boss.triggerDrunkMode) { boss.drunkMeter = 100; boss.triggerDrunkMode(game.effects); return true; }
        if (action === 'rage') {
            boss.hp = Math.min(boss.hp, Math.floor(boss.maxHp * 0.48));
            if (boss.triggerRageMode) boss.triggerRageMode(game.effects);
            else if (typeof boss.checkEnrage === 'function') boss.isEnraged = true;
            return true;
        }
        if (action === 'kick' && boss.startKarateKick) { boss.startKarateKick(game.player, game.effects); return true; }
        if (action === 'summon' && boss.summonMinions) { boss.summonMinions(game.enemies, game.effects); return true; }
        if (action === 'volley' && boss.executeShatterVolley) { boss.executeShatterVolley(game.player, game.bullets, game.effects); return true; }
        return false;
    }

    /**
     * Economy, Materials & Progression helpers.
     */
    addCurrency(type, amount) {
        const val = parseInt(amount, 10) || 0;
        if (!val) return false;
        const gs = (typeof window !== 'undefined') ? window.GameState : null;
        if (gs && typeof gs.addCurrency === 'function') {
            gs.addCurrency(type === 'coins' ? val : 0, type === 'gems' ? val : 0);
        } else if (typeof window !== 'undefined' && window.uiController) {
            const ui = window.uiController;
            if (type === 'coins') ui.setCoins((ui.coins || 0) + val, true);
            else if (type === 'gems') ui.setGems((ui.gems || 0) + val, true);
        }
        if (window.soundEngine) window.soundEngine.playPickup('star');
        return true;
    }

    addMaterial(matId, qty = 10) {
        const amount = Math.max(1, parseInt(qty, 10) || 1);
        if (typeof window !== 'undefined' && window.inventoryManager && typeof window.inventoryManager.addMaterial === 'function') {
            window.inventoryManager.addMaterial(matId, amount, { source: 'admin' });
            if (window.soundEngine) window.soundEngine.playPickup('diamond');
            return true;
        }
        return false;
    }

    addAscentCrests(qty = 3) {
        const mgr = (typeof window !== 'undefined') ? window.ascentCrestManager : null;
        if (!mgr) return false;
        const maxC = mgr.maxCrests || 3;
        mgr.count = Math.min(maxC, (mgr.count || 0) + (parseInt(qty, 10) || maxC));
        if (typeof mgr.save === 'function') mgr.save();
        if (typeof mgr._emitUpdate === 'function') mgr._emitUpdate({ source: 'admin' });
        if (window.soundEngine) window.soundEngine.playPickup('star');
        return mgr.count;
    }

    addStarStones(qty = 5) {
        const addQty = Math.max(1, parseInt(qty, 10) || 5);
        if (typeof DungeonManager !== 'undefined' && typeof DungeonManager.addOlympianStarStone === 'function') {
            return DungeonManager.addOlympianStarStone(addQty);
        }
        return 0;
    }

    addEvolutionStones(qty = 5) {
        const addQty = Math.max(1, parseInt(qty, 10) || 5);
        if (typeof GearUpgradeManager !== 'undefined' && typeof GearUpgradeManager.addEvolutionStones === 'function') {
            return GearUpgradeManager.addEvolutionStones(addQty);
        }
        return 0;
    }

    addAccountXP(qty = 1000) {
        const gs = (typeof window !== 'undefined') ? window.GameState : null;
        if (!gs || typeof gs.addAccountXP !== 'function') return false;
        gs.addAccountXP(parseInt(qty, 10) || 1000);
        if (window.uiController && window.uiController.profileManager && typeof window.uiController.profileManager.updateProfileUI === 'function') {
            window.uiController.profileManager.updateProfileUI();
        }
        return true;
    }

    maxAllSkills() {
        const skillsMap = (typeof SKILLS !== 'undefined' && SKILLS) || (typeof window !== 'undefined' && window.SKILLS) || null;
        const skillIds = skillsMap ? Object.keys(skillsMap) : ['nerobalonaki', 'blade_rush', 'seismic_quake', 'yaya_scream', 'frappes', 'wrath_of_olympus'];
        const levels = {};

        for (const id of skillIds) {
            if (typeof SkillManager !== 'undefined' && typeof SkillManager.unlockBossSkill === 'function') {
                SkillManager.unlockBossSkill(id, { silent: true });
            }
            const maxLvl = (skillsMap && skillsMap[id] && skillsMap[id].maxLevel) || 3;
            levels[id] = maxLvl;
        }
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('lesaio_unlocked_skills', JSON.stringify(skillIds));
            localStorage.setItem('lesaio_skill_levels', JSON.stringify(levels));
        }
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
            window.GameState.player.unlockedSkills = [...skillIds];
            window.GameState.player.skillLevels = { ...levels };
        }
        const sm = (typeof window !== 'undefined' && window.uiController && window.uiController.skillManager) || null;
        if (sm) {
            sm.unlockedSkills = [...skillIds];
            sm.skillLevels = { ...levels };
            sm.renderSkillCards();
            sm.updateHUDIcon();
        }
        if (window.soundEngine) window.soundEngine.playLevelUp();
        return skillIds.length;
    }

    unlockAllHeroes() {
        const heroes = ['psanas', 'psogas', 'petros', '50balos', 'billias', 'kitsos', 'psgiannhs'];
        const gs = (typeof window !== 'undefined') ? window.GameState : null;
        for (const id of heroes) {
            if (gs && typeof gs.unlockHero === 'function') gs.unlockHero(id, 0);
        }
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('lesaio_unlocked_heroes', JSON.stringify(heroes));
        }
        const hr = (typeof window !== 'undefined' && window.uiController && window.uiController.heroRoster) || null;
        if (hr) {
            hr.unlockedHeroes = [...heroes];
            if (typeof hr.updateHeroCardSelection === 'function') hr.updateHeroCardSelection();
        }
        if (window.soundEngine) window.soundEngine.playLevelUp();
        return heroes.length;
    }

    unlockAllWeapons() {
        const weaponsMap = (typeof WEAPONS !== 'undefined' && WEAPONS) || (typeof window !== 'undefined' && window.WEAPONS) || null;
        const ids = weaponsMap
            ? Object.keys(weaponsMap)
            : ['pea', 'watermelon', 'pepper', 'bubble', 'money_gun', 'burger', 'lightning', 'greek_flag', 'm4_carbine', 'spas12', 'boomerang_saw', 'chrono_rifle', 'carbine', 'dialtone', 'zeus_thunderbolt'];
        for (const id of ids) {
            if (typeof WeaponSystem !== 'undefined' && typeof WeaponSystem.unlockWeapon === 'function') {
                WeaponSystem.unlockWeapon(id, { silent: true });
            }
        }
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('lesaio_unlocked_weapons', JSON.stringify(ids));
        }
        if (window.uiController && window.uiController.modalManager && typeof window.uiController.modalManager.updateWeaponsModal === 'function') {
            window.uiController.modalManager.updateWeaponsModal();
        }
        if (window.soundEngine) window.soundEngine.playLevelUp();
        return ids.length;
    }

    unlockAllGear() {
        const gearMap = (typeof GEAR_DATA !== 'undefined' && GEAR_DATA) || (typeof window !== 'undefined' && window.GEAR_DATA) || null;
        if (!gearMap) return 0;
        const ids = Object.keys(gearMap);
        for (const id of ids) {
            if (typeof GearManager !== 'undefined' && typeof GearManager.unlock === 'function') {
                GearManager.unlock(id, { free: true, source: 'admin' });
            }
        }
        if (window.uiController && window.uiController.modalManager && typeof window.uiController.modalManager.updateGearScreen === 'function') {
            window.uiController.modalManager.updateGearScreen();
        }
        if (window.soundEngine) window.soundEngine.playLevelUp();
        return ids.length;
    }

    unlockAllPerksAndFeats(maxRank = true) {
        const gs = (typeof window !== 'undefined') ? window.GameState : null;
        const perksMap = (typeof PERKS_DATA !== 'undefined' && PERKS_DATA) || (typeof window !== 'undefined' && window.PERKS_DATA) || null;
        if (!perksMap || !gs || !gs.player) return 0;

        if (typeof PerkProgression !== 'undefined') {
            for (const bossId of Object.keys(PerkProgression.BOSS_FEAT_LABELS || {})) {
                PerkProgression.recordBossDefeat(gs, bossId);
            }
            PerkProgression.recordWaveProgress(gs, 'story', 20);
            PerkProgression.recordWaveProgress(gs, 'endless', 50);
            PerkProgression.recordWaveProgress(gs, 'dungeons', 5);
        }

        const allIds = Object.keys(perksMap);
        const ranks = {};
        for (const id of allIds) {
            ranks[id] = maxRank && typeof PerkProgression !== 'undefined' ? PerkProgression.getPerkMaxRank(id) : 1;
        }
        gs.player.unlockedPerks = [...allIds];
        gs.player.perkRanks = ranks;
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('lesaio_unlocked_perks', JSON.stringify(allIds));
            localStorage.setItem('lesaio_perk_ranks', JSON.stringify(ranks));
        }
        const pm = (typeof window !== 'undefined' && window.perkManager) || (window.uiController && window.uiController.perkManager);
        if (pm && typeof pm.render === 'function') pm.render();
        if (window.soundEngine) window.soundEngine.playLevelUp();
        return allIds.length;
    }

    /**
     * Reset all local account progression back to Level 1 starter state for clean playtesting.
     * Leaves any remote Google Cloud save untouched by switching to an isolated local playtest UID.
     */
    async resetAccount(options = {}) {
        const skipConfirm = !!options.skipConfirm;
        const skipReload = !!options.skipReload;
        if (!skipConfirm && typeof confirm === 'function') {
            const confirmed = confirm(
                '⚠️ Reset Local Account to Level 1?\n\n' +
                '• Resets Coins (1,500), Gems (50), Level 1, Heroes (Psanas only), Weapons (Pea only), Evolutions, Gear, Perks, Skills, Upgrades, Materials, Chests, Quests, Mail Claims & Stats.\n' +
                '• Your Google Cloud Save stays untouched; switches to a fresh local Playtest ID and reloads.\n\n' +
                'Continue?'
            );
            if (!confirmed) return false;
        }
        if (typeof window !== 'undefined' && window.SaveManager && window.SaveManager.saveDebounceTimer) {
            clearTimeout(window.SaveManager.saveDebounceTimer);
            window.SaveManager.saveDebounceTimer = null;
        }
        if (typeof window !== 'undefined' && window.cloudSave) {
            if (typeof window.cloudSave.stopRealtimeListener === 'function') window.cloudSave.stopRealtimeListener();
            if (typeof window.cloudSave.signOut === 'function') {
                try { await window.cloudSave.signOut(); } catch (e) {}
            }
        }
        if (typeof AccountSyncManager !== 'undefined' && typeof AccountSyncManager.resetToGuestAccount === 'function') {
            AccountSyncManager.resetToGuestAccount();
        }
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('lesaio_player_uid', `playtest_${Math.random().toString(36).substring(2, 8)}_${Date.now().toString(36)}`);
        }
        if (!skipReload && typeof window !== 'undefined' && window.location) {
            window.location.reload();
        }
        return true;
    }

    triggerCredits() {
        if (window.creditsScreen) {
            window.creditsScreen.start(() => {
                if (window.uiController) window.uiController.showMenuScreen();
            });
        }
    }
}

window.AdminCheats = new AdminCheatsService();
