/**
 * Lesa.io - Save State Serializer & Schema Validator
 * Pure functions to serialize GameState into portable JSON and deserialize with defaults
 */

class SaveSerializer {
    static _safeJson(key, fallback) {
        if (typeof localStorage === 'undefined') return fallback;
        try {
            const raw = localStorage.getItem(key);
            if (!raw || raw === 'undefined' || raw === 'null') return fallback;
            const parsed = JSON.parse(raw);
            return (parsed !== null && parsed !== undefined) ? parsed : fallback;
        } catch (_) {
            return fallback;
        }
    }

    static _readInventorySnapshot(state) {
        if (typeof window !== 'undefined' && window.inventoryManager) {
            const im = window.inventoryManager;
            return {
                crates: { ...(im.crates || {}) },
                chests: { ...(im.chests || {}) },
                materials: (typeof im.getMaterials === 'function') ? im.getMaterials() : { ...(im.materials || {}) }
            };
        }
        const rawInv = this._safeJson('lesaio_inventory', {});
        const mats = (typeof MaterialRegistry !== 'undefined')
            ? MaterialRegistry.normalizeMap(rawInv.materials || state.player.materials)
            : { ...(rawInv.materials || state.player.materials || {}) };
        return {
            crates: (rawInv.crates && typeof rawInv.crates === 'object') ? { ...rawInv.crates } : {},
            chests: (rawInv.chests && typeof rawInv.chests === 'object') ? { ...rawInv.chests } : {},
            materials: mats
        };
    }

    static _readFlagsSnapshot() {
        if (typeof localStorage === 'undefined') return {};
        return {
            nameChosen: localStorage.getItem('lesaio_player_name_chosen') === 'true',
            starterPackPurchased: localStorage.getItem('lesaio_starter_pack_purchased') === 'true',
            starterPackStart: localStorage.getItem('lesaio_starter_pack_start') || '',
            tributeClaimed: localStorage.getItem('lesaio_mazonakis_tribute_claimed') === 'true',
            bubbleMailClaimed: localStorage.getItem('lesaio_alpha_bubble_mail_claimed') === 'true'
                || localStorage.getItem('lesaio_weapon_bubble_unlocked') === 'true',
            alphaMailClaimed: localStorage.getItem('lesaio_alpha_mail_claimed') === 'true',
            alpha11MailClaimed: localStorage.getItem('lesaio_alpha11_mail_claimed') === 'true',
            alpha12MailClaimed: localStorage.getItem('lesaio_alpha12_mail_claimed') === 'true',
            alpha13MailClaimed: localStorage.getItem('lesaio_alpha13_mail_claimed') === 'true',
            alpha14MailClaimed: localStorage.getItem('lesaio_alpha14_mail_claimed') === 'true'
        };
    }

    /**
     * Serialize GameState into a persistent save payload
     * @param {GameState} state 
     * @returns {Object}
     */
    static serialize(state) {
        if (!state || !state.player) return null;

        const inv = this._readInventorySnapshot(state);
        const chestSlots = (typeof window !== 'undefined' && window.chestManager && Array.isArray(window.chestManager.slots))
            ? window.chestManager.slots.map(s => (s ? { ...s } : null))
            : this._safeJson('lesaio_chest_slots', [null, null, null, null]);
        const ls = typeof localStorage !== 'undefined' ? localStorage : null;
        const questsDate = ls ? (ls.getItem('lesaio_quests_date') || '') : '';
        const questsData = (typeof window !== 'undefined' && window.questManager && Array.isArray(window.questManager.quests))
            ? window.questManager.quests.map(q => ({ ...q }))
            : this._safeJson('lesaio_quests_data', null);

        return {
            version: 3,
            timestamp: Date.now(),
            player: {
                name: state.player.name || 'Psanas',
                accountLevel: Number.isFinite(Number(state.player.accountLevel)) ? state.player.accountLevel : 1,
                accountXp: Number.isFinite(Number(state.player.accountXp)) ? state.player.accountXp : 0,
                coins: Number.isFinite(Number(state.player.coins)) ? state.player.coins : 0,
                gold: Number.isFinite(Number(state.player.coins)) ? state.player.coins : 0,
                gems: Number.isFinite(Number(state.player.gems)) ? state.player.gems : 0,
                diamonds: Number.isFinite(Number(state.player.gems)) ? state.player.gems : 0,
                selectedHero: state.player.selectedHero || 'psanas',
                heroStyles: { ...(state.player.heroStyles || { psgiannhs: (ls ? (ls.getItem('lesaio_hero_style_psgiannhs') || 'jacket') : 'jacket') }) },
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
                ascendedGear: (typeof GearUpgradeManager !== 'undefined') ? GearUpgradeManager.getAscendedList() : Array.from(state.player.ascendedGear || []),
                evolvedWeapons: (typeof WeaponEvolutionManager !== 'undefined') ? WeaponEvolutionManager.getEvolvedList() : Array.from(state.player.evolvedWeapons || []),
                evolutionStones: (typeof GearUpgradeManager !== 'undefined') ? GearUpgradeManager.getEvolutionStones() : (state.player.evolutionStones || 0),
                starBlessedHeroes: (typeof HeroStarBlessing !== 'undefined') ? HeroStarBlessing.getBlessedList() : Array.from(state.player.starBlessedHeroes || []),
                cosmetics: (typeof CosmeticManager !== 'undefined') ? CosmeticManager.getState() : (state.player.cosmetics || null),
                heroSkins: (typeof HeroSkinSystem !== 'undefined') ? HeroSkinSystem.getState() : (state.player.heroSkins || null),
                battlePass: (typeof window !== 'undefined' && window.battlePassManager) ? window.battlePassManager.getState() : (state.player.battlePass || null),
                materials: inv.materials,
                inventory: inv,
                chestSlots: Array.isArray(chestSlots) && chestSlots.length === 4 ? chestSlots : [null, null, null, null],
                dailyFreeSkipDate: ls ? (ls.getItem('lesaio_daily_free_skip_date') || '') : '',
                pendingBossRewards: (typeof BossRewardManager !== 'undefined') ? BossRewardManager.getPending() : this._safeJson('lesaio_pending_boss_rewards', []),
                quests: questsData ? { date: questsDate, data: questsData } : null,
                flags: this._readFlagsSnapshot(),
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

    static _applyNonDestructiveProgress(p, state, opts = {}) {
        const ls = typeof localStorage !== 'undefined' ? localStorage : null;
        if (opts.syncCurrencies) {
            if (p.name && (!state.player.name || state.player.name === 'Psanas' || opts.overwriteName)) {
                state.player.name = p.name;
                if (ls) {
                    ls.setItem('lesaio_player_name', p.name);
                    if (p.name.trim() && p.name.trim() !== 'Psanas') ls.setItem('lesaio_player_name_chosen', 'true');
                }
            }
            const prevLvl = state.player.accountLevel || 1;
            const lvl = parseInt(p.accountLevel ?? p.level, 10);
            if (Number.isFinite(lvl) && lvl >= 1) {
                state.player.accountLevel = Math.max(prevLvl, lvl);
                if (ls) ls.setItem('lesaio_account_level', state.player.accountLevel.toString());
            }
            const xp = parseInt(p.accountXp ?? p.xp, 10);
            if (Number.isFinite(xp) && xp >= 0) {
                const effLvl = Number.isFinite(lvl) ? lvl : prevLvl;
                const nextXp = effLvl > prevLvl ? xp : (effLvl === prevLvl ? Math.max(state.player.accountXp || 0, xp) : (state.player.accountXp || 0));
                state.player.accountXp = nextXp;
                if (ls) ls.setItem('lesaio_account_xp', nextXp.toString());
            }
            const inCoins = Number.isFinite(Number(p.coins)) ? Number(p.coins) : (Number.isFinite(Number(p.gold)) ? Number(p.gold) : null);
            if (inCoins !== null && inCoins >= 0) {
                state.player.coins = inCoins;
                if (ls) ls.setItem('lesaio_coins', inCoins.toString());
            }
            const inGems = Number.isFinite(Number(p.diamonds)) ? Number(p.diamonds) : (Number.isFinite(Number(p.gems)) ? Number(p.gems) : null);
            if (inGems !== null && inGems >= 0) {
                state.player.gems = inGems;
                if (ls) ls.setItem('lesaio_gems', inGems.toString());
            }
        }

        if (opts.syncSelections) {
            if (p.selectedHero) {
                state.player.selectedHero = p.selectedHero;
                if (ls) ls.setItem('lesaio_selected_hero', p.selectedHero);
            }
            const selWep = p.selectedWeapon || p.weaponType;
            if (selWep) {
                state.player.selectedWeapon = selWep;
                state.player.weaponType = selWep;
                if (ls) ls.setItem('lesaio_selected_weapon', selWep);
            }
            if (p.selectedSkill) {
                state.player.selectedSkill = p.selectedSkill;
                if (ls) ls.setItem('lesaio_selected_skill', p.selectedSkill);
            }
        }

        if (p.heroStyles && typeof p.heroStyles === 'object') {
            state.player.heroStyles = { ...(state.player.heroStyles || {}), ...p.heroStyles };
            if (p.heroStyles.psgiannhs && ls) ls.setItem('lesaio_hero_style_psgiannhs', p.heroStyles.psgiannhs);
        }
        if (typeof p.olympianStarStones === 'number' && Number.isFinite(p.olympianStarStones)) {
            state.player.olympianStarStones = Math.max(state.player.olympianStarStones || 0, Math.floor(p.olympianStarStones));
            if (ls) ls.setItem('lesaio_olympian_star_stones', state.player.olympianStarStones.toString());
        }
        if (typeof p.ascentCrests === 'number' && typeof window !== 'undefined' && window.ascentCrestManager) {
            window.ascentCrestManager.syncExternalState(p.ascentCrests, p.ascentCrestsDate || '');
        }

        if (Array.isArray(p.unlockedHeroes)) {
            state.player.unlockedHeroes = Array.from(new Set([...(state.player.unlockedHeroes || ['psanas']), ...p.unlockedHeroes]));
            if (ls) ls.setItem('lesaio_unlocked_heroes', JSON.stringify(state.player.unlockedHeroes));
        }
        if (Array.isArray(p.unlockedWeapons)) {
            state.player.unlockedWeapons = Array.from(new Set([...(state.player.unlockedWeapons || ['pea']), ...p.unlockedWeapons]));
            if (ls) {
                ls.setItem('lesaio_unlocked_weapons', JSON.stringify(state.player.unlockedWeapons));
                if (state.player.unlockedWeapons.includes('bubble')) ls.setItem('lesaio_weapon_bubble_unlocked', 'true');
            }
        }
        if (Array.isArray(p.unlockedSkills)) {
            state.player.unlockedSkills = Array.from(new Set([...(state.player.unlockedSkills || ['blade_rush', 'nerobalonaki']), ...p.unlockedSkills]));
            if (ls) ls.setItem('lesaio_unlocked_skills', JSON.stringify(state.player.unlockedSkills));
        }
        if (p.skillLevels && typeof p.skillLevels === 'object') {
            const mergedSkills = { ...(state.player.skillLevels || { blade_rush: 1, nerobalonaki: 1 }) };
            for (const [k, v] of Object.entries(p.skillLevels)) {
                const n = parseInt(v, 10) || 1;
                mergedSkills[k] = Math.max(mergedSkills[k] || 1, n);
            }
            state.player.skillLevels = mergedSkills;
            if (ls) ls.setItem('lesaio_skill_levels', JSON.stringify(mergedSkills));
        }
        if (p.upgrades && typeof p.upgrades === 'object') {
            const mergedUpg = { ...(state.player.upgrades || { critChance: 0, critDamage: 0, maxHealth: 0, goldBonus: 0 }) };
            for (const [k, v] of Object.entries(p.upgrades)) {
                mergedUpg[k] = Math.max(mergedUpg[k] || 0, parseInt(v, 10) || 0);
            }
            state.player.upgrades = mergedUpg;
            if (ls) ls.setItem('lesaio_upgrades', JSON.stringify(mergedUpg));
        }
        if (Array.isArray(p.unlockedPerks)) {
            state.player.unlockedPerks = Array.from(new Set([...(state.player.unlockedPerks || []), ...p.unlockedPerks]));
            if ((state.player.accountLevel || 1) < 5) {
                state.player.unlockedPerks = state.player.unlockedPerks.filter(id => id !== 'hot_foot');
            } else if (!state.player.unlockedPerks.includes('hot_foot')) {
                state.player.unlockedPerks.push('hot_foot');
            }
            if (ls) ls.setItem('lesaio_unlocked_perks', JSON.stringify(state.player.unlockedPerks));
        }
        if (Array.isArray(p.equippedPerks) && (!Array.isArray(state.player.equippedPerks) || state.player.equippedPerks.every(x => !x))) {
            state.player.equippedPerks = p.equippedPerks.slice(0, 3);
            while (state.player.equippedPerks.length < 3) state.player.equippedPerks.push(null);
            if (ls) ls.setItem('lesaio_equipped_perks', JSON.stringify(state.player.equippedPerks));
        }
        if (p.perkRanks && typeof p.perkRanks === 'object') {
            state.player.perkRanks = (typeof PerkProgression !== 'undefined')
                ? PerkProgression.mergePerkRanks(state.player.perkRanks, p.perkRanks, state.player.unlockedPerks)
                : { ...(state.player.perkRanks || {}), ...p.perkRanks };
            if (ls) ls.setItem('lesaio_perk_ranks', JSON.stringify(state.player.perkRanks));
        }
        if (p.combatFeats && typeof p.combatFeats === 'object') {
            state.player.combatFeats = (typeof PerkProgression !== 'undefined')
                ? PerkProgression.mergeFeats(state.player.combatFeats, p.combatFeats)
                : { ...(state.player.combatFeats || {}), ...p.combatFeats };
            if (ls) ls.setItem('lesaio_combat_feats', JSON.stringify(state.player.combatFeats));
        }
        if (p.equippedGear && typeof p.equippedGear === 'object') {
            const curEq = state.player.equippedGear || { helmet: null, armor: null, belt: null, gloves: null, boots: null };
            const hasLocalGear = Object.values(curEq).some(Boolean);
            if (!hasLocalGear || opts.syncSelections) {
                state.player.equippedGear = { helmet: null, armor: null, belt: null, gloves: null, boots: null, ...p.equippedGear };
                if (ls) ls.setItem('lesaio_equipped_gear', JSON.stringify(state.player.equippedGear));
            }
        }
        if (Array.isArray(p.unlockedGear)) {
            state.player.unlockedGear = Array.from(new Set([...(state.player.unlockedGear || []), ...p.unlockedGear]));
            if (ls) ls.setItem('lesaio_unlocked_gear', JSON.stringify(state.player.unlockedGear));
        }
        if (p.gearLevels && typeof p.gearLevels === 'object' && !Array.isArray(p.gearLevels)) {
            const mergedLevels = { ...(state.player.gearLevels || {}) };
            for (const [gid, lvl] of Object.entries(p.gearLevels)) {
                const n = parseInt(lvl, 10) || 1;
                if (n > (mergedLevels[gid] || 1)) mergedLevels[gid] = n;
            }
            if (typeof GearUpgradeManager !== 'undefined') state.player.gearLevels = GearUpgradeManager.setLevelsMap(mergedLevels);
            else { state.player.gearLevels = mergedLevels; if (ls) ls.setItem('lesaio_gear_levels', JSON.stringify(mergedLevels)); }
        }
        if (Array.isArray(p.ascendedGear)) {
            const mergedAsc = Array.from(new Set([...(state.player.ascendedGear || []), ...p.ascendedGear]));
            if (typeof GearUpgradeManager !== 'undefined') state.player.ascendedGear = GearUpgradeManager.setAscendedList(mergedAsc);
            else { state.player.ascendedGear = mergedAsc; if (ls) ls.setItem('lesaio_ascended_gear', JSON.stringify(mergedAsc)); }
        }
        if (Array.isArray(p.starBlessedHeroes)) {
            const mergedBlessed = Array.from(new Set([...(state.player.starBlessedHeroes || []), ...p.starBlessedHeroes]));
            if (typeof HeroStarBlessing !== 'undefined') state.player.starBlessedHeroes = HeroStarBlessing.setBlessedList(mergedBlessed);
            else { state.player.starBlessedHeroes = mergedBlessed; if (ls) ls.setItem('lesaio_star_blessed_heroes', JSON.stringify(mergedBlessed)); }
        }
        if (Array.isArray(p.evolvedGear)) {
            const mergedEvo = Array.from(new Set([...(state.player.evolvedGear || []), ...p.evolvedGear]));
            if (typeof GearUpgradeManager !== 'undefined') state.player.evolvedGear = GearUpgradeManager.setEvolvedList(mergedEvo);
            else { state.player.evolvedGear = mergedEvo; if (ls) ls.setItem('lesaio_evolved_gear', JSON.stringify(mergedEvo)); }
        }
        if (Array.isArray(p.evolvedWeapons)) {
            const mergedWepEvo = Array.from(new Set([...(state.player.evolvedWeapons || []), ...p.evolvedWeapons]));
            if (typeof WeaponEvolutionManager !== 'undefined') state.player.evolvedWeapons = WeaponEvolutionManager.setEvolvedList(mergedWepEvo);
            else { state.player.evolvedWeapons = mergedWepEvo; if (ls) ls.setItem('lesaio_evolved_weapons', JSON.stringify(mergedWepEvo)); }
        }
        if (typeof p.evolutionStones === 'number' && Number.isFinite(p.evolutionStones)) {
            const mergedStones = Math.max(state.player.evolutionStones || 0, Math.floor(p.evolutionStones));
            if (typeof GearUpgradeManager !== 'undefined') GearUpgradeManager.setEvolutionStones(mergedStones);
            else { state.player.evolutionStones = mergedStones; if (ls) ls.setItem('lesaio_evolution_stones', mergedStones.toString()); }
        }
        if (p.cosmetics && typeof p.cosmetics === 'object' && typeof CosmeticManager !== 'undefined') {
            const curC = CosmeticManager.getState();
            CosmeticManager.saveState({
                equippedBanner: curC.equippedBanner || p.cosmetics.equippedBanner,
                equippedFrame: curC.equippedFrame || p.cosmetics.equippedFrame,
                displayedCoins: curC.displayedCoins && curC.displayedCoins.length ? curC.displayedCoins : (Array.isArray(p.cosmetics.displayedCoins) ? p.cosmetics.displayedCoins : []),
                unlockedBanners: [...curC.unlockedBanners, ...(p.cosmetics.unlockedBanners || [])],
                unlockedFrames: [...curC.unlockedFrames, ...(p.cosmetics.unlockedFrames || [])],
                unlockedCoins: [...curC.unlockedCoins, ...(p.cosmetics.unlockedCoins || [])]
            }, false);
        }
        if (p.heroSkins && typeof p.heroSkins === 'object' && typeof HeroSkinSystem !== 'undefined') {
            HeroSkinSystem.applyState(p.heroSkins);
        }
        if (p.battlePass && typeof p.battlePass === 'object') {
            if (typeof window !== 'undefined' && window.battlePassManager) window.battlePassManager.applyState(p.battlePass);
            else if (ls) {
                const curBp = this._safeJson('lesaio_battle_pass_s1', {});
                const nextBp = {
                    season: p.battlePass.season || curBp.season || 'season_1',
                    xp: Math.max(Number(curBp.xp) || 0, Number(p.battlePass.xp) || 0),
                    hasPremium: Boolean(curBp.hasPremium || p.battlePass.hasPremium),
                    claimedFree: Array.from(new Set([...(curBp.claimedFree || []), ...(p.battlePass.claimedFree || p.battlePass.claimedTiers || [])])),
                    claimedPremium: Array.from(new Set([...(curBp.claimedPremium || []), ...(p.battlePass.claimedPremium || [])]))
                };
                state.player.battlePass = nextBp;
                ls.setItem('lesaio_battle_pass_s1', JSON.stringify(nextBp));
            }
        }
        if (p.inventory && typeof p.inventory === 'object') {
            const curInv = this._safeJson('lesaio_inventory', {});
            const mergedCrates = { ...(curInv.crates || {}) };
            for (const [k, v] of Object.entries(p.inventory.crates || {})) mergedCrates[k] = Math.max(mergedCrates[k] || 0, Math.floor(Number(v) || 0));
            const mergedChests = { ...(curInv.chests || {}) };
            for (const [k, v] of Object.entries(p.inventory.chests || {})) mergedChests[k] = Math.max(mergedChests[k] || 0, Math.floor(Number(v) || 0));
            const rawMats = { ...(curInv.materials || {}) };
            for (const [k, v] of Object.entries(p.inventory.materials || p.materials || {})) rawMats[k] = Math.max(rawMats[k] || 0, Math.floor(Number(v) || 0));
            const normMats = (typeof MaterialRegistry !== 'undefined') ? MaterialRegistry.normalizeMap(rawMats) : rawMats;
            state.player.materials = normMats;
            if (ls) ls.setItem('lesaio_inventory', JSON.stringify({ version: 2, updatedAt: Date.now(), crates: mergedCrates, chests: mergedChests, materials: normMats }));
            if (typeof window !== 'undefined' && window.inventoryManager && typeof window.inventoryManager.load === 'function') window.inventoryManager.load();
        } else if (p.materials && typeof p.materials === 'object') {
            const normMats = (typeof MaterialRegistry !== 'undefined') ? MaterialRegistry.normalizeMap(p.materials) : { ...p.materials };
            state.player.materials = normMats;
            if (typeof window !== 'undefined' && window.inventoryManager && typeof window.inventoryManager.syncExternalMaterials === 'function') {
                window.inventoryManager.syncExternalMaterials(normMats);
            } else if (ls) {
                const existing = this._safeJson('lesaio_inventory', {});
                existing.materials = normMats;
                ls.setItem('lesaio_inventory', JSON.stringify(existing));
            }
        }
        if (Array.isArray(p.chestSlots) && p.chestSlots.length === 4 && ls) {
            const curSlots = this._safeJson('lesaio_chest_slots', [null, null, null, null]);
            if (Array.isArray(curSlots) && curSlots.length === 4 && curSlots.every(s => !s)) {
                ls.setItem('lesaio_chest_slots', JSON.stringify(p.chestSlots));
                if (typeof window !== 'undefined' && window.chestManager && typeof window.chestManager.load === 'function') window.chestManager.load();
            }
        }
        if (Array.isArray(p.pendingBossRewards) && p.pendingBossRewards.length > 0 && ls) {
            const curPend = this._safeJson('lesaio_pending_boss_rewards', []);
            const seen = new Set(curPend.map(e => e && `${e.category}:${e.id}`));
            const mergedPend = [...curPend];
            for (const e of p.pendingBossRewards) {
                const k = e && `${e.category}:${e.id}`;
                if (k && !seen.has(k)) { seen.add(k); mergedPend.push(e); }
            }
            ls.setItem('lesaio_pending_boss_rewards', JSON.stringify(mergedPend));
        }
        if (p.flags && typeof p.flags === 'object' && ls) {
            if (p.flags.nameChosen) ls.setItem('lesaio_player_name_chosen', 'true');
            if (p.flags.starterPackPurchased) ls.setItem('lesaio_starter_pack_purchased', 'true');
            if (p.flags.starterPackStart && !ls.getItem('lesaio_starter_pack_start')) ls.setItem('lesaio_starter_pack_start', String(p.flags.starterPackStart));
            if (p.flags.tributeClaimed) ls.setItem('lesaio_mazonakis_tribute_claimed', 'true');
            if (p.flags.bubbleMailClaimed) { ls.setItem('lesaio_alpha_bubble_mail_claimed', 'true'); ls.setItem('lesaio_weapon_bubble_unlocked', 'true'); }
            if (p.flags.alphaMailClaimed) ls.setItem('lesaio_alpha_mail_claimed', 'true');
            if (p.flags.alpha11MailClaimed) ls.setItem('lesaio_alpha11_mail_claimed', 'true');
            if (p.flags.alpha12MailClaimed) ls.setItem('lesaio_alpha12_mail_claimed', 'true');
            if (p.flags.alpha13MailClaimed) ls.setItem('lesaio_alpha13_mail_claimed', 'true');
            if (p.flags.alpha14MailClaimed) ls.setItem('lesaio_alpha14_mail_claimed', 'true');
        }
        const statsSrc = (p.stats && typeof p.stats === 'object') ? p.stats : {};
        const socialSrc = (p.socialStats && typeof p.socialStats === 'object') ? p.socialStats : {};
        const fallbackHigh = Math.max(statsSrc.highScore || 0, p.highScore || 0, p.lbHighScore || 0, socialSrc.highScore || 0);
        const fallbackKills = Math.max(statsSrc.totalKills || 0, p.totalKills || 0, p.lbTotalKills || 0, socialSrc.totalKills || 0);
        const fallbackWave = Math.max(statsSrc.maxWave || 1, p.maxWave || 1, p.lbEndlessWave || 1, socialSrc.maxWave || 1);
        if (p.stats && typeof p.stats === 'object' || fallbackHigh > 0 || fallbackKills > 0 || fallbackWave > 1) {
            const s = statsSrc;
            const cur = state.player.stats;
            cur.totalKills = Math.max(cur.totalKills || 0, fallbackKills);
            cur.maxWave = Math.max(cur.maxWave || 1, fallbackWave);
            cur.highScore = Math.max(cur.highScore || 0, fallbackHigh);
            cur.totalFatmirs = Math.max(cur.totalFatmirs, s.totalFatmirs || 0);
            cur.totalCasillas = Math.max(cur.totalCasillas, s.totalCasillas || 0);
            cur.totalSkarmogyftos = Math.max(cur.totalSkarmogyftos || 0, s.totalSkarmogyftos || 0);
            cur.matchesPlayed = Math.max(cur.matchesPlayed, s.matchesPlayed || 0);
            cur.totalTimeSeconds = Math.max(cur.totalTimeSeconds, s.totalTimeSeconds || 0);
            if (s.heroPlays && typeof s.heroPlays === 'object') {
                for (const [hero, count] of Object.entries(s.heroPlays)) {
                    cur.heroPlays[hero] = Math.max(cur.heroPlays[hero] || 0, count || 0);
                }
            }
            if (ls) {
                ls.setItem('lesaio_total_kills', String(cur.totalKills));
                ls.setItem('lesaio_max_wave', String(cur.maxWave));
                ls.setItem('lesaio_highscore', String(cur.highScore));
                ls.setItem('lesaio_total_fatmirs', String(cur.totalFatmirs));
                ls.setItem('lesaio_total_casillas', String(cur.totalCasillas));
                ls.setItem('lesaio_total_skarmogyftos', String(cur.totalSkarmogyftos));
                ls.setItem('lesaio_matches_played', String(cur.matchesPlayed));
                ls.setItem('lesaio_total_time_seconds', String(cur.totalTimeSeconds));
                ls.setItem('lesaio_hero_plays', JSON.stringify(cur.heroPlays));
            }
        }
    }

    /**
     * Merge non-currency cloud progression into local GameState without clobbering currencies or active selections.
     */
    static mergeProgressOnly(data, state) {
        if (!data || !data.player || !state || !state.player) return false;
        try {
            this._applyNonDestructiveProgress(data.player, state, { syncCurrencies: false, syncSelections: false });
            return true;
        } catch (err) {
            console.warn('[SaveSerializer] Non-fatal mergeProgressOnly notice:', err);
            return false;
        }
    }

    /**
     * Deserialize portable JSON data into GameState
     * @param {Object} data 
     * @param {GameState} state 
     */
    static deserialize(data, state) {
        if (!data || !data.player || !state) return false;

        try {
            this._applyNonDestructiveProgress(data.player, state, { syncCurrencies: true, syncSelections: true });

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
    static buildCloudPayload(saveData = {}, user = {}, identity = {}, cloudBaseline = null) {
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
            'evolvedGear', 'ascendedGear', 'evolvedWeapons', 'evolutionStones', 'olympianStarStones',
            'starBlessedHeroes', 'ascentCrests', 'ascentCrestsDate', 'cosmetics', 'heroSkins',
            'battlePass', 'materials', 'inventory', 'chestSlots', 'dailyFreeSkipDate',
            'pendingBossRewards', 'quests', 'flags'
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

        const statsObj = inputPlayer.stats || basePlayer.stats || {};
        const statsHigh = Math.max(0, Number(statsObj.highScore) || 0, Number(input.highScore) || 0);
        const statsKills = Math.max(0, Number(statsObj.totalKills) || 0);
        const statsWave = Math.max(1, Number(statsObj.maxWave) || 1, Number(input.maxWave) || 1);

        let result = {
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
            highScore: statsHigh,
            maxWave: statsWave,
            lbHighScore: statsHigh,
            lbEndlessWave: Math.max(statsWave, Number((basePlayer.combatFeats && basePlayer.combatFeats.endlessMaxWave) || 0)),
            lbTotalKills: statsKills,
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
            ...(user && user.email ? { email: user.email } : {})
        };
        if (cloudBaseline && typeof SaveMigration !== 'undefined' && typeof SaveMigration.mergeMonotonicCloudPayload === 'function') {
            result = SaveMigration.mergeMonotonicCloudPayload(result, cloudBaseline);
        }
        return result;
    }
}

if (typeof window !== 'undefined') {
    window.SaveSerializer = SaveSerializer;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SaveSerializer };
}
