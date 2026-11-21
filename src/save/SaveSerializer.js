/**
 * Lesa.io - Save State Serializer & Schema Validator
 * Pure functions to serialize GameState into portable JSON and deserialize with defaults
 */

class SaveSerializer {
    /**
     * Serialize GameState into a persistent save payload
     * @param {GameState} state 
     * @returns {Object}
     */
    static serialize(state) {
        if (!state || !state.player) return null;

        return {
            version: 2,
            timestamp: Date.now(),
            player: {
                name: state.player.name || 'Psanas',
                accountLevel: state.player.accountLevel || 1,
                accountXp: state.player.accountXp || 0,
                coins: state.player.coins || 0,
                gold: state.player.coins || 0,
                gems: state.player.gems || 0,
                diamonds: state.player.gems || 0,
                selectedHero: state.player.selectedHero || 'psanas',
                heroStyles: { ...(state.player.heroStyles || { psgiannhs: (typeof localStorage !== 'undefined' ? (localStorage.getItem('lesaio_hero_style_psgiannhs') || 'jacket') : 'jacket') }) },
                unlockedHeroes: Array.from(state.player.unlockedHeroes || ['psanas']),
                selectedWeapon: state.player.selectedWeapon || state.player.weaponType || 'pea',
                unlockedWeapons: Array.from(state.player.unlockedWeapons || ['pea']),
                olympianStarStones: state.player.olympianStarStones || 0,
                ascentCrests: (typeof window !== 'undefined' && window.ascentCrestManager) ? window.ascentCrestManager.getCount() : (state.player.ascentCrests ?? 0),
                ascentCrestsDate: (typeof window !== 'undefined' && window.ascentCrestManager) ? window.ascentCrestManager.lastDailyDate : (state.player.ascentCrestsDate || ''),
                selectedSkill: state.player.selectedSkill || 'blade_rush',
                unlockedSkills: Array.from(state.player.unlockedSkills || ['blade_rush', 'nerobalonaki']),
                skillLevels: { ...(state.player.skillLevels || { blade_rush: 1, nerobalonaki: 1 }) },
                upgrades: { ...(state.player.upgrades || { critChance: 0, critDamage: 0, maxHealth: 0, goldBonus: 0 }) },
                unlockedPerks: Array.from(state.player.unlockedPerks || []),
                equippedPerks: Array.from(state.player.equippedPerks || [null, null, null]),
                perkRanks: { ...(state.player.perkRanks || {}) },
                combatFeats: { ...(state.player.combatFeats || {}) },
                equippedGear: (typeof GearManager !== 'undefined') ? GearManager.getEquippedMap() : (state.player.equippedGear || { helmet: null, armor: null, belt: null, gloves: null, boots: null }),
                unlockedGear: (typeof GearManager !== 'undefined') ? Array.from(GearManager.getUnlockedList() || []) : Array.from(state.player.unlockedGear || []),
                gearLevels: (typeof GearUpgradeManager !== 'undefined') ? GearUpgradeManager.getAllLevels() : (state.player.gearLevels || {}),
                evolvedGear: (typeof GearUpgradeManager !== 'undefined') ? GearUpgradeManager.getEvolvedList() : Array.from(state.player.evolvedGear || []),
                evolvedWeapons: (typeof WeaponEvolutionManager !== 'undefined') ? WeaponEvolutionManager.getEvolvedList() : Array.from(state.player.evolvedWeapons || []),
                evolutionStones: (typeof GearUpgradeManager !== 'undefined') ? GearUpgradeManager.getEvolutionStones() : (state.player.evolutionStones || 0),
                cosmetics: (typeof CosmeticManager !== 'undefined') ? CosmeticManager.getState() : (state.player.cosmetics || null),
                materials: (typeof window !== 'undefined' && window.inventoryManager && typeof window.inventoryManager.getMaterials === 'function')
                    ? window.inventoryManager.getMaterials()
                    : ((typeof MaterialRegistry !== 'undefined') ? MaterialRegistry.normalizeMap(state.player.materials) : { ...(state.player.materials || {}) }),
                stats: {
                    totalKills: state.player.stats.totalKills || 0,
                    maxWave: state.player.stats.maxWave || 1,
                    highScore: state.player.stats.highScore || 0,
                    totalFatmirs: state.player.stats.totalFatmirs || 0,
                    totalCasillas: state.player.stats.totalCasillas || 0,
                    totalSkarmogyftos: state.player.stats.totalSkarmogyftos || 0,
                    matchesPlayed: state.player.stats.matchesPlayed || 0,
                    totalTimeSeconds: state.player.stats.totalTimeSeconds || 0,
                    heroPlays: { ...(state.player.stats.heroPlays || { psanas: 0, psogas: 0, petros: 0 }) }
                }
            },
            settings: {
                musicVolume: state.settings.musicVolume ?? 0.7,
                sfxVolume: state.settings.sfxVolume ?? 0.8,
                showPopups: state.settings.showPopups ?? true,
                showDamage: state.settings.showDamage ?? true,
                screenShake: state.settings.screenShake ?? true
            }
        };
    }

    /**
     * Deserialize portable JSON data into GameState
     * @param {Object} data 
     * @param {GameState} state 
     */
    static deserialize(data, state) {
        if (!data || !data.player || !state) return false;

        try {
            const p = data.player;
            state.player.name = p.name || state.player.name;
            state.player.accountLevel = p.accountLevel || state.player.accountLevel;
            state.player.accountXp = p.accountXp || state.player.accountXp;
            state.player.coins = typeof p.coins === 'number' ? p.coins : (typeof p.gold === 'number' ? p.gold : state.player.coins);
            state.player.gems = typeof p.diamonds === 'number' ? p.diamonds : (typeof p.gems === 'number' ? p.gems : state.player.gems);
            state.player.selectedHero = p.selectedHero || state.player.selectedHero;
            if (p.heroStyles && typeof p.heroStyles === 'object') {
                state.player.heroStyles = { ...(state.player.heroStyles || {}), ...p.heroStyles };
                if (p.heroStyles.psgiannhs && typeof localStorage !== 'undefined') {
                    localStorage.setItem('lesaio_hero_style_psgiannhs', p.heroStyles.psgiannhs);
                }
            }
            state.player.selectedWeapon = p.selectedWeapon || p.weaponType || state.player.selectedWeapon || 'pea';
            state.player.weaponType = state.player.selectedWeapon;
            if (typeof p.olympianStarStones === 'number') {
                state.player.olympianStarStones = Math.max(state.player.olympianStarStones || 0, p.olympianStarStones);
                localStorage.setItem('lesaio_olympian_star_stones', state.player.olympianStarStones.toString());
            }
            if (typeof p.ascentCrests === 'number' && typeof window !== 'undefined' && window.ascentCrestManager) {
                window.ascentCrestManager.syncExternalState(p.ascentCrests, p.ascentCrestsDate || '');
            }
            state.player.selectedSkill = p.selectedSkill || state.player.selectedSkill || 'blade_rush';

            if (Array.isArray(p.unlockedHeroes)) {
                state.player.unlockedHeroes = Array.from(new Set([...state.player.unlockedHeroes, ...p.unlockedHeroes]));
            }

            if (Array.isArray(p.unlockedWeapons)) {
                state.player.unlockedWeapons = Array.from(new Set([...(state.player.unlockedWeapons || ['pea']), ...p.unlockedWeapons]));
                localStorage.setItem('lesaio_unlocked_weapons', JSON.stringify(state.player.unlockedWeapons));
                if (state.player.unlockedWeapons.includes('bubble')) {
                    localStorage.setItem('lesaio_weapon_bubble_unlocked', 'true');
                }
            }

            if (Array.isArray(p.unlockedSkills)) {
                state.player.unlockedSkills = Array.from(new Set([...state.player.unlockedSkills, ...p.unlockedSkills]));
            }

            if (p.skillLevels && typeof p.skillLevels === 'object') {
                state.player.skillLevels = { ...(state.player.skillLevels || { blade_rush: 1, nerobalonaki: 1 }), ...p.skillLevels };
            }

            if (p.upgrades && typeof p.upgrades === 'object') {
                state.player.upgrades = { ...(state.player.upgrades || { critChance: 0, critDamage: 0, maxHealth: 0, goldBonus: 0 }), ...p.upgrades };
                localStorage.setItem('lesaio_upgrades', JSON.stringify(state.player.upgrades));
            }

            if (Array.isArray(p.unlockedPerks)) {
                state.player.unlockedPerks = Array.from(new Set([...(state.player.unlockedPerks || []), ...p.unlockedPerks]));
                if (state.player.accountLevel < 5) {
                    state.player.unlockedPerks = state.player.unlockedPerks.filter(id => id !== 'hot_foot');
                } else if (!state.player.unlockedPerks.includes('hot_foot')) {
                    state.player.unlockedPerks.push('hot_foot');
                }
                localStorage.setItem('lesaio_unlocked_perks', JSON.stringify(state.player.unlockedPerks));
            }

            if (Array.isArray(p.equippedPerks)) {
                state.player.equippedPerks = p.equippedPerks.slice(0, 3);
                while (state.player.equippedPerks.length < 3) state.player.equippedPerks.push(null);
                localStorage.setItem('lesaio_equipped_perks', JSON.stringify(state.player.equippedPerks));
            }

            if (p.perkRanks && typeof p.perkRanks === 'object') {
                state.player.perkRanks = (typeof PerkProgression !== 'undefined')
                    ? PerkProgression.mergePerkRanks(state.player.perkRanks, p.perkRanks, state.player.unlockedPerks)
                    : { ...(state.player.perkRanks || {}), ...p.perkRanks };
                localStorage.setItem('lesaio_perk_ranks', JSON.stringify(state.player.perkRanks));
            }

            if (p.combatFeats && typeof p.combatFeats === 'object') {
                state.player.combatFeats = (typeof PerkProgression !== 'undefined')
                    ? PerkProgression.mergeFeats(state.player.combatFeats, p.combatFeats)
                    : { ...(state.player.combatFeats || {}), ...p.combatFeats };
                localStorage.setItem('lesaio_combat_feats', JSON.stringify(state.player.combatFeats));
            }

            if (p.equippedGear && typeof p.equippedGear === 'object') {
                state.player.equippedGear = { helmet: null, armor: null, belt: null, gloves: null, boots: null, ...p.equippedGear };
                localStorage.setItem('lesaio_equipped_gear', JSON.stringify(state.player.equippedGear));
            }

            if (Array.isArray(p.unlockedGear)) {
                state.player.unlockedGear = Array.from(new Set([...(state.player.unlockedGear || []), ...p.unlockedGear]));
                localStorage.setItem('lesaio_unlocked_gear', JSON.stringify(state.player.unlockedGear));
            }
            if (p.gearLevels && typeof p.gearLevels === 'object' && !Array.isArray(p.gearLevels)) {
                const mergedLevels = { ...(state.player.gearLevels || {}) };
                for (const [gid, lvl] of Object.entries(p.gearLevels)) {
                    const n = parseInt(lvl, 10) || 1;
                    if (n > (mergedLevels[gid] || 1)) mergedLevels[gid] = n;
                }
                if (typeof GearUpgradeManager !== 'undefined') {
                    state.player.gearLevels = GearUpgradeManager.setLevelsMap(mergedLevels);
                } else {
                    state.player.gearLevels = mergedLevels;
                    localStorage.setItem('lesaio_gear_levels', JSON.stringify(mergedLevels));
                }
            }
            if (Array.isArray(p.evolvedGear)) {
                const mergedEvo = Array.from(new Set([...(state.player.evolvedGear || []), ...p.evolvedGear]));
                if (typeof GearUpgradeManager !== 'undefined') {
                    state.player.evolvedGear = GearUpgradeManager.setEvolvedList(mergedEvo);
                } else {
                    state.player.evolvedGear = mergedEvo;
                    localStorage.setItem('lesaio_evolved_gear', JSON.stringify(mergedEvo));
                }
            }
            if (Array.isArray(p.evolvedWeapons)) {
                const mergedWepEvo = Array.from(new Set([...(state.player.evolvedWeapons || []), ...p.evolvedWeapons]));
                if (typeof WeaponEvolutionManager !== 'undefined') {
                    state.player.evolvedWeapons = WeaponEvolutionManager.setEvolvedList(mergedWepEvo);
                } else {
                    state.player.evolvedWeapons = mergedWepEvo;
                    localStorage.setItem('lesaio_evolved_weapons', JSON.stringify(mergedWepEvo));
                }
            }
            if (typeof p.evolutionStones === 'number') {
                const mergedStones = Math.max(state.player.evolutionStones || 0, Math.floor(p.evolutionStones));
                if (typeof GearUpgradeManager !== 'undefined') {
                    GearUpgradeManager.setEvolutionStones(mergedStones);
                } else {
                    state.player.evolutionStones = mergedStones;
                    localStorage.setItem('lesaio_evolution_stones', mergedStones.toString());
                }
            }

            if (p.cosmetics && typeof p.cosmetics === 'object' && typeof CosmeticManager !== 'undefined') {
                const curC = CosmeticManager.getState();
                CosmeticManager.saveState({
                    equippedBanner: p.cosmetics.equippedBanner || curC.equippedBanner,
                    equippedFrame: p.cosmetics.equippedFrame || curC.equippedFrame,
                    displayedCoins: Array.isArray(p.cosmetics.displayedCoins) ? p.cosmetics.displayedCoins : curC.displayedCoins,
                    unlockedBanners: [...curC.unlockedBanners, ...(p.cosmetics.unlockedBanners || [])],
                    unlockedFrames: [...curC.unlockedFrames, ...(p.cosmetics.unlockedFrames || [])],
                    unlockedCoins: [...curC.unlockedCoins, ...(p.cosmetics.unlockedCoins || [])]
                }, false);
            }

            if (p.materials && typeof p.materials === 'object') {
                const normMats = (typeof MaterialRegistry !== 'undefined')
                    ? MaterialRegistry.normalizeMap(p.materials)
                    : { ...p.materials };
                state.player.materials = normMats;
                if (typeof window !== 'undefined' && window.inventoryManager && typeof window.inventoryManager.syncExternalMaterials === 'function') {
                    window.inventoryManager.syncExternalMaterials(normMats);
                } else if (typeof localStorage !== 'undefined') {
                    try {
                        const existing = JSON.parse(localStorage.getItem('lesaio_inventory') || '{}');
                        existing.materials = normMats;
                        localStorage.setItem('lesaio_inventory', JSON.stringify(existing));
                    } catch (e) {}
                }
            }

            if (p.stats) {
                const s = p.stats;
                const cur = state.player.stats;
                cur.totalKills = Math.max(cur.totalKills, s.totalKills || 0);
                cur.maxWave = Math.max(cur.maxWave, s.maxWave || 1);
                cur.highScore = Math.max(cur.highScore, s.highScore || 0);
                cur.totalFatmirs = Math.max(cur.totalFatmirs, s.totalFatmirs || 0);
                cur.totalCasillas = Math.max(cur.totalCasillas, s.totalCasillas || 0);
                cur.totalSkarmogyftos = Math.max(cur.totalSkarmogyftos || 0, s.totalSkarmogyftos || 0);
                cur.matchesPlayed = Math.max(cur.matchesPlayed, s.matchesPlayed || 0);
                cur.totalTimeSeconds = Math.max(cur.totalTimeSeconds, s.totalTimeSeconds || 0);

                if (s.heroPlays) {
                    for (const [hero, count] of Object.entries(s.heroPlays)) {
                        cur.heroPlays[hero] = Math.max(cur.heroPlays[hero] || 0, count);
                    }
                }
            }

            if (data.settings) {
                state.settings.musicVolume = data.settings.musicVolume ?? state.settings.musicVolume;
                state.settings.sfxVolume = data.settings.sfxVolume ?? state.settings.sfxVolume;
                state.settings.showPopups = data.settings.showPopups ?? state.settings.showPopups;
                state.settings.showDamage = data.settings.showDamage ?? state.settings.showDamage;
                state.settings.screenShake = data.settings.screenShake ?? state.settings.screenShake;
            }

            return true;
        } catch (err) {
            console.error('[SaveSerializer] Failed to deserialize save data:', err);
            return false;
        }
    }

    /**
     * Build a complete, non-destructive Firestore cloud payload from full or partial input.
     * Ensures partial updates (e.g. gear upgrades, weapon unlocks) never reset coins, gems, or level to 0/1.
     */
    static buildCloudPayload(saveData = {}, user = {}, identity = {}) {
        const input = (saveData && typeof saveData === 'object') ? saveData : {};
        const gs = (typeof window !== 'undefined' && window.GameState) ? window.GameState : null;
        const base = gs ? (this.serialize(gs) || {}) : {};
        const basePlayer = (base.player && typeof base.player === 'object') ? base.player : {};
        const inputPlayer = (input.player && typeof input.player === 'object') ? input.player : {};
        const ls = (typeof localStorage !== 'undefined') ? localStorage : null;

        const pickNum = (val) => {
            if (typeof val === 'number' && Number.isFinite(val)) return val;
            if (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val))) return Number(val);
            return undefined;
        };

        const isItemEvent = input.itemId !== undefined;
        const pCoins = pickNum(inputPlayer.coins) ?? pickNum(input.coins) ?? pickNum(inputPlayer.gold) ?? pickNum(input.gold)
            ?? pickNum(basePlayer.coins) ?? (ls ? (parseInt(ls.getItem('lesaio_coins') || '0', 10) || 0) : 0);
        const pGems = pickNum(inputPlayer.gems) ?? pickNum(inputPlayer.diamonds) ?? pickNum(input.gems) ?? pickNum(input.diamonds)
            ?? pickNum(basePlayer.gems) ?? (ls ? (parseInt(ls.getItem('lesaio_gems') || '0', 10) || 0) : 0);
        const pLevel = pickNum(inputPlayer.accountLevel) ?? pickNum(inputPlayer.level) ?? pickNum(input.accountLevel)
            ?? (!isItemEvent ? pickNum(input.level) : undefined) ?? pickNum(basePlayer.accountLevel)
            ?? (ls ? (parseInt(ls.getItem('lesaio_account_level') || '1', 10) || 1) : 1);
        const pXp = pickNum(inputPlayer.accountXp) ?? pickNum(inputPlayer.xp) ?? pickNum(input.accountXp) ?? pickNum(input.xp)
            ?? pickNum(basePlayer.accountXp) ?? (ls ? (parseInt(ls.getItem('lesaio_account_xp') || '0', 10) || 0) : 0);
        const pSkills = inputPlayer.skillLevels || input.skillLevels || basePlayer.skillLevels || { blade_rush: 1, nerobalonaki: 1 };
        const pName = inputPlayer.name || inputPlayer.playerName || input.playerName || input.name
            || basePlayer.name || (ls ? ls.getItem('lesaio_player_name') : null) || 'Psanas';

        const playerScopedKeys = [
            'unlockedHeroes', 'selectedHero', 'heroStyles', 'selectedWeapon', 'unlockedWeapons',
            'unlockedSkills', 'skillLevels', 'upgrades', 'unlockedPerks', 'equippedPerks',
            'perkRanks', 'combatFeats', 'equippedGear', 'unlockedGear', 'gearLevels',
            'evolvedGear', 'evolvedWeapons', 'evolutionStones', 'olympianStarStones',
            'ascentCrests', 'ascentCrestsDate', 'cosmetics', 'materials'
        ];
        const partialPlayerOverrides = {};
        for (const key of playerScopedKeys) {
            if (input[key] !== undefined && inputPlayer[key] === undefined) {
                partialPlayerOverrides[key] = input[key];
            }
        }

        const cleanRoot = { ...base, ...input };
        if (isItemEvent) {
            delete cleanRoot.itemId;
            delete cleanRoot.level;
        }
        if (input.stones !== undefined) delete cleanRoot.stones;

        const fTag = identity.friendTag || '#HERO00';
        const fTagClean = identity.friendTagClean || 'HERO00';

        return {
            ...cleanRoot,
            playerName: pName,
            playerNameLower: String(pName).toLowerCase(),
            friendTag: fTag,
            friendTagClean: fTagClean,
            coins: pCoins,
            gold: pCoins,
            gems: pGems,
            diamonds: pGems,
            level: pLevel,
            xp: pXp,
            skillLevels: pSkills,
            player: {
                ...basePlayer,
                ...partialPlayerOverrides,
                ...inputPlayer,
                name: pName,
                coins: pCoins,
                gold: pCoins,
                gems: pGems,
                diamonds: pGems,
                accountLevel: pLevel,
                accountXp: pXp,
                skillLevels: pSkills
            },
            email: (user && user.email) || 'gamedevsixseven@gmail.com'
        };
    }
}

if (typeof window !== 'undefined') {
    window.SaveSerializer = SaveSerializer;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SaveSerializer };
}
