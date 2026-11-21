/**
 * Lesa.io - Gear Upgrade & Evolution System
 * Rules by Rarity (Base Lv.1):
 *   - Common / Uncommon / Exclusive: NOT upgradable (Max Lv.1)
 *   - Rare: 1 Upgrade -> Max Lv.2
 *   - Epic: 2 Upgrades -> Max Lv.3
 *   - Legendary: 3 Upgrades -> Max Lv.4
 *   - Mythic: 3 Upgrades -> Max Lv.4 + Evolution with Evolution Stone (Awakened ★)
 */

class GearUpgradeManager {
    static STORAGE_LEVELS = 'lesaio_gear_levels';
    static STORAGE_EVOLVED = 'lesaio_evolved_gear';
    static STORAGE_STONES = 'lesaio_evolution_stones';

    static MAX_LEVEL_BY_RARITY = {
        common: 1,
        uncommon: 1,
        rare: 2,
        epic: 3,
        legendary: 4,
        mythic: 4,
        exclusive: 1
    };

    static LEVEL_STAT_MULTIPLIERS = {
        1: 1.00,
        2: 1.18,
        3: 1.38,
        4: 1.60
    };

    static EVOLVED_STAT_MULTIPLIER = 2.00;

    static UPGRADE_COSTS = {
        rare: {
            1: { coins: 2500, materials: { armory_shards: 15, mati_crystal: 2 } }
        },
        epic: {
            1: { coins: 4500, materials: { armory_shards: 25, mati_crystal: 5 } },
            2: { coins: 7500, materials: { armory_shards: 40, mati_crystal: 8, olympian_bronze: 3 } }
        },
        legendary: {
            1: { coins: 8000, materials: { armory_shards: 35, mati_crystal: 8, olympian_bronze: 4 } },
            2: { coins: 14000, materials: { armory_shards: 55, mati_crystal: 12, olympian_bronze: 8 } },
            3: { coins: 22000, materials: { armory_shards: 80, mati_crystal: 18, olympian_bronze: 14, ambrosia_spark: 1 } }
        },
        mythic: {
            1: { coins: 15000, materials: { armory_shards: 60, mati_crystal: 14, olympian_bronze: 10, ambrosia_spark: 1 } },
            2: { coins: 25000, materials: { armory_shards: 90, mati_crystal: 22, olympian_bronze: 16, ambrosia_spark: 2 } },
            3: { coins: 40000, materials: { armory_shards: 130, mati_crystal: 30, olympian_bronze: 24, ambrosia_spark: 3 } }
        }
    };

    static EVOLVE_COST = {
        coins: 20000,
        evolutionStones: 1
    };

    static STONE_CRAFT_RECIPE = {
        coins: 25000,
        materials: {
            armory_shards: 120,
            mati_crystal: 25,
            olympian_bronze: 18,
            ambrosia_spark: 3
        }
    };

    static OLYMPUS_SUMMIT_STONE_CHANCE = 0.08;

    static _resolveItem(itemOrId) {
        if (!itemOrId) return null;
        if (typeof itemOrId === 'object') return itemOrId;
        if (typeof GearManager !== 'undefined' && typeof GearManager.getGearData === 'function') {
            return GearManager.getGearData(itemOrId);
        }
        if (typeof GEAR_DATA !== 'undefined' && GEAR_DATA[itemOrId]) {
            return GEAR_DATA[itemOrId];
        }
        return null;
    }

    static _resolveId(itemOrId) {
        if (!itemOrId) return '';
        return typeof itemOrId === 'object' ? (itemOrId.id || '') : String(itemOrId);
    }

    static normalizeRarity(rarity) {
        return String(rarity || 'common').toLowerCase().trim();
    }

    static getMaxLevel(itemOrId) {
        const item = this._resolveItem(itemOrId);
        const rarity = item ? this.normalizeRarity(item.rarity) : 'common';
        return this.MAX_LEVEL_BY_RARITY[rarity] || 1;
    }

    static isUpgradableRarity(itemOrId) {
        return this.getMaxLevel(itemOrId) > 1;
    }

    static isEvolvableRarity(itemOrId) {
        const item = this._resolveItem(itemOrId);
        return !!item && this.normalizeRarity(item.rarity) === 'mythic';
    }

    static getAllLevels() {
        const gsLevels = (typeof window !== 'undefined' && window.GameState && window.GameState.player && window.GameState.player.gearLevels);
        let raw = gsLevels;
        if (!raw && typeof localStorage !== 'undefined') {
            try {
                raw = JSON.parse(localStorage.getItem(this.STORAGE_LEVELS) || '{}');
            } catch (e) {
                raw = {};
            }
        }
        return this._sanitizeLevelsMap(raw);
    }

    static _sanitizeLevelsMap(raw) {
        const clean = {};
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return clean;
        for (const [id, val] of Object.entries(raw)) {
            const maxLvl = this.getMaxLevel(id);
            const lvl = parseInt(val, 10);
            if (maxLvl > 1 && Number.isFinite(lvl) && lvl > 1) {
                clean[id] = Math.min(maxLvl, Math.max(1, lvl));
            }
        }
        return clean;
    }

    static setLevelsMap(rawMap) {
        const clean = this._sanitizeLevelsMap(rawMap);
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
            window.GameState.player.gearLevels = clean;
        }
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(this.STORAGE_LEVELS, JSON.stringify(clean));
        }
        return clean;
    }

    static getLevel(itemOrId) {
        const id = this._resolveId(itemOrId);
        if (!id) return 1;
        const maxLvl = this.getMaxLevel(itemOrId);
        if (maxLvl <= 1) return 1;
        const levels = this.getAllLevels();
        const saved = parseInt(levels[id], 10);
        if (!Number.isFinite(saved) || saved < 1) return 1;
        return Math.min(maxLvl, saved);
    }

    static getEvolvedList() {
        const gsList = (typeof window !== 'undefined' && window.GameState && window.GameState.player && window.GameState.player.evolvedGear);
        let raw = gsList;
        if (!raw && typeof localStorage !== 'undefined') {
            try {
                raw = JSON.parse(localStorage.getItem(this.STORAGE_EVOLVED) || '[]');
            } catch (e) {
                raw = [];
            }
        }
        return this._sanitizeEvolvedList(raw);
    }

    static _sanitizeEvolvedList(raw) {
        let candidates = [];
        if (Array.isArray(raw)) {
            candidates = raw;
        } else if (raw && typeof raw === 'object') {
            candidates = Object.keys(raw).filter((k) => !!raw[k]);
        }
        const out = [];
        for (const id of candidates) {
            if (typeof id === 'string' && id && !out.includes(id) && this.isEvolvableRarity(id)) {
                out.push(id);
            }
        }
        return out;
    }

    static setEvolvedList(rawList) {
        const clean = this._sanitizeEvolvedList(rawList);
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
            window.GameState.player.evolvedGear = clean;
        }
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(this.STORAGE_EVOLVED, JSON.stringify(clean));
        }
        return clean;
    }

    static isEvolved(itemOrId) {
        const id = this._resolveId(itemOrId);
        if (!id || !this.isEvolvableRarity(itemOrId)) return false;
        return this.getEvolvedList().includes(id);
    }

    static getEvolutionStones() {
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player &&
            typeof window.GameState.player.evolutionStones === 'number' && Number.isFinite(window.GameState.player.evolutionStones)) {
            return Math.max(0, Math.floor(window.GameState.player.evolutionStones));
        }
        if (typeof localStorage !== 'undefined') {
            const parsed = parseInt(localStorage.getItem(this.STORAGE_STONES) || '0', 10);
            const safe = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
            if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
                window.GameState.player.evolutionStones = safe;
            }
            return safe;
        }
        return 0;
    }

    static setEvolutionStones(count) {
        const safe = Math.max(0, Math.floor(Number(count) || 0));
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
            window.GameState.player.evolutionStones = safe;
        }
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(this.STORAGE_STONES, safe.toString());
        }
        this._syncCloudAndEvents({ evolutionStones: safe });
        return safe;
    }

    static addEvolutionStones(delta = 1) {
        const add = Math.floor(Number(delta) || 0);
        return this.setEvolutionStones(this.getEvolutionStones() + add);
    }

    static _getCoins() {
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
            return Math.max(0, Number(window.GameState.player.coins) || 0);
        }
        if (typeof localStorage !== 'undefined') {
            return Math.max(0, parseInt(localStorage.getItem('lesaio_coins') || '0', 10) || 0);
        }
        return 0;
    }

    static _spendCoins(amount) {
        const cost = Math.max(0, Math.floor(Number(amount) || 0));
        if (cost <= 0) return true;
        if (this._getCoins() < cost) return false;
        if (typeof window !== 'undefined' && window.GameState && typeof window.GameState.spendCoins === 'function') {
            return window.GameState.spendCoins(cost);
        }
        if (typeof window !== 'undefined' && window.GameState && typeof window.GameState.addCurrency === 'function') {
            window.GameState.addCurrency(-cost, 0);
            return true;
        }
        return false;
    }

    static canUpgrade(itemOrId) {
        const item = this._resolveItem(itemOrId);
        if (!item) return false;
        const unlocked = (typeof GearManager !== 'undefined') ? GearManager.isUnlocked(item.id) : false;
        if (!unlocked) return false;
        return this.getLevel(item) < this.getMaxLevel(item);
    }

    static canEvolve(itemOrId) {
        const item = this._resolveItem(itemOrId);
        if (!item || !this.isEvolvableRarity(item)) return false;
        const unlocked = (typeof GearManager !== 'undefined') ? GearManager.isUnlocked(item.id) : false;
        if (!unlocked) return false;
        return this.getLevel(item) >= this.getMaxLevel(item) && !this.isEvolved(item);
    }

    static getUpgradeCost(itemOrId) {
        const item = this._resolveItem(itemOrId);
        if (!item || !this.isUpgradableRarity(item)) return null;
        const rarity = this.normalizeRarity(item.rarity);
        const curLvl = this.getLevel(item);
        const maxLvl = this.getMaxLevel(item);
        if (curLvl >= maxLvl) return null;
        const table = this.UPGRADE_COSTS[rarity];
        return (table && table[curLvl]) ? {
            coins: table[curLvl].coins,
            materials: { ...(table[curLvl].materials || {}) }
        } : null;
    }

    static getEvolveCost(itemOrId) {
        const item = this._resolveItem(itemOrId);
        if (!item || !this.isEvolvableRarity(item)) return null;
        return {
            coins: this.EVOLVE_COST.coins,
            evolutionStones: this.EVOLVE_COST.evolutionStones
        };
    }

    static hasUpgradeResources(itemOrId) {
        const cost = this.getUpgradeCost(itemOrId);
        if (!cost) return false;
        if (this._getCoins() < cost.coins) return false;
        const inv = (typeof window !== 'undefined') ? window.inventoryManager : null;
        return !!(inv && typeof inv.hasMaterials === 'function' && inv.hasMaterials(cost.materials));
    }

    static hasEvolveResources(itemOrId) {
        const cost = this.getEvolveCost(itemOrId);
        if (!cost) return false;
        return this._getCoins() >= cost.coins && this.getEvolutionStones() >= cost.evolutionStones;
    }

    static scaleStatValue(baseVal, level = 1, evolved = false) {
        if (typeof baseVal !== 'number' || !Number.isFinite(baseVal)) return baseVal;
        const lvl = Math.max(1, Math.floor(level || 1));
        const evo = !!evolved;
        if (lvl <= 1 && !evo) return baseVal;
        if (baseVal <= 0) return baseVal;
        const mult = evo ? this.EVOLVED_STAT_MULTIPLIER : (this.LEVEL_STAT_MULTIPLIERS[lvl] || 1.0);
        const minStep = (lvl - 1) + (evo ? 2 : 0);
        return Math.max(Math.round(baseVal * mult), baseVal + minStep);
    }

    static getEffectiveStats(itemOrId, overrideLevel = null, overrideEvolved = null) {
        const item = this._resolveItem(itemOrId);
        if (!item || !item.stats) return {};
        const maxLvl = this.getMaxLevel(item);
        const lvl = overrideLevel !== null
            ? Math.min(maxLvl, Math.max(1, Math.floor(overrideLevel)))
            : this.getLevel(item);
        const evo = overrideEvolved !== null
            ? (!!overrideEvolved && this.isEvolvableRarity(item))
            : this.isEvolved(item);

        const result = {};
        for (const [key, val] of Object.entries(item.stats)) {
            result[key] = this.scaleStatValue(val, lvl, evo);
        }
        return result;
    }

    static upgradeGear(itemOrId) {
        const item = this._resolveItem(itemOrId);
        if (!item) return { success: false, reason: 'Item not found.' };
        if (!this.isUpgradableRarity(item)) {
            return { success: false, reason: 'Only Rare and above gear can be upgraded.' };
        }
        if (typeof GearManager !== 'undefined' && !GearManager.isUnlocked(item.id)) {
            return { success: false, reason: 'Unlock this gear item first.' };
        }

        const curLvl = this.getLevel(item);
        const maxLvl = this.getMaxLevel(item);
        if (curLvl >= maxLvl) {
            return { success: false, reason: 'Gear is already at maximum level.' };
        }

        const cost = this.getUpgradeCost(item);
        if (!cost) return { success: false, reason: 'No upgrade path available.' };
        if (this._getCoins() < cost.coins) {
            return { success: false, reason: 'Not enough Coins.' };
        }
        const inv = (typeof window !== 'undefined') ? window.inventoryManager : null;
        if (!inv || typeof inv.hasMaterials !== 'function' || !inv.hasMaterials(cost.materials)) {
            return { success: false, reason: 'Not enough crafting materials.' };
        }

        if (!this._spendCoins(cost.coins)) {
            return { success: false, reason: 'Not enough Coins.' };
        }
        inv.consumeMaterials(cost.materials, { source: 'gear_upgrade', itemId: item.id, targetLevel: curLvl + 1 });

        const nextLvl = curLvl + 1;
        const levels = this.getAllLevels();
        levels[item.id] = nextLvl;
        const savedLevels = this.setLevelsMap(levels);

        this._afterProgressionChange('gearUpgraded', { itemId: item.id, level: nextLvl, gearLevels: savedLevels });
        return { success: true, item, level: nextLvl, stats: this.getEffectiveStats(item) };
    }

    static evolveGear(itemOrId) {
        const item = this._resolveItem(itemOrId);
        if (!item) return { success: false, reason: 'Item not found.' };
        if (!this.isEvolvableRarity(item)) {
            return { success: false, reason: 'Only Mythic gear can be evolved.' };
        }
        if (typeof GearManager !== 'undefined' && !GearManager.isUnlocked(item.id)) {
            return { success: false, reason: 'Unlock this gear item first.' };
        }
        const curLvl = this.getLevel(item);
        const maxLvl = this.getMaxLevel(item);
        if (curLvl < maxLvl) {
            return { success: false, reason: `Upgrade gear to Lv.${maxLvl} before evolving.` };
        }
        if (this.isEvolved(item)) {
            return { success: false, reason: 'Gear is already Evolved.' };
        }

        const cost = this.getEvolveCost(item);
        if (this._getCoins() < cost.coins) {
            return { success: false, reason: 'Not enough Coins.' };
        }
        if (this.getEvolutionStones() < cost.evolutionStones) {
            return { success: false, reason: 'Requires an Evolution Stone.' };
        }

        if (!this._spendCoins(cost.coins)) {
            return { success: false, reason: 'Not enough Coins.' };
        }
        this.addEvolutionStones(-cost.evolutionStones);

        const evolvedList = this.getEvolvedList();
        evolvedList.push(item.id);
        const savedEvolved = this.setEvolvedList(evolvedList);

        this._afterProgressionChange('gearEvolved', { itemId: item.id, evolvedGear: savedEvolved });
        return { success: true, item, evolved: true, stats: this.getEffectiveStats(item) };
    }

    static canCraftEvolutionStone() {
        const recipe = this.STONE_CRAFT_RECIPE;
        if (this._getCoins() < recipe.coins) return false;
        const inv = (typeof window !== 'undefined') ? window.inventoryManager : null;
        return !!(inv && typeof inv.hasMaterials === 'function' && inv.hasMaterials(recipe.materials));
    }

    static craftEvolutionStone() {
        const recipe = this.STONE_CRAFT_RECIPE;
        if (this._getCoins() < recipe.coins) {
            return { success: false, reason: `Requires ${recipe.coins.toLocaleString()} Coins.` };
        }
        const inv = (typeof window !== 'undefined') ? window.inventoryManager : null;
        if (!inv || typeof inv.hasMaterials !== 'function' || !inv.hasMaterials(recipe.materials)) {
            return { success: false, reason: 'Not enough Forging Materials.' };
        }

        if (!this._spendCoins(recipe.coins)) {
            return { success: false, reason: 'Not enough Coins.' };
        }
        inv.consumeMaterials(recipe.materials, { source: 'forge_evolution_stone' });
        const stones = this.addEvolutionStones(1);

        this._afterProgressionChange('evolutionStoneCrafted', { stones });
        return { success: true, stones };
    }

    static tryOlympusSummitEvolutionStoneDrop(game) {
        if (!game || game.isCoopGuest) return false;
        if (Math.random() >= this.OLYMPUS_SUMMIT_STONE_CHANCE) return false;

        this.addEvolutionStones(1);
        if (game.effects && game.player) {
            game.effects.addConfetti(game.player.x, game.player.y, 160);
            game.effects.addShockwave(game.player.x, game.player.y, 130, 'rgba(239, 68, 68, 0.92)');
            game.effects.addComicSplash(game.player.x, game.player.y - 110, 'EVOLUTION STONE ACQUIRED!');
        }
        if (game.ui && typeof game.ui.addKillfeed === 'function') {
            game.ui.addKillfeed('RARE DROP! Discovered 1x Evolution Stone (8%) from Mount Olympus Summit!');
        }
        if (typeof window !== 'undefined' && window.soundEngine && typeof window.soundEngine.playLevelUp === 'function') {
            window.soundEngine.playLevelUp();
        }
        return true;
    }

    static _syncCloudAndEvents(extraFields = {}) {
        if (typeof window === 'undefined') return;
        if (window.SaveManager && typeof window.SaveManager.saveNow === 'function') {
            window.SaveManager.saveNow();
        } else if (window.cloudSave && window.cloudSave.currentUser && typeof window.cloudSave.saveToCloud === 'function') {
            const safeFields = { ...(extraFields || {}) };
            delete safeFields.itemId;
            delete safeFields.level;
            delete safeFields.stones;
            window.cloudSave.saveToCloud(safeFields);
        }
        if (window.inventoryModalUI && typeof window.inventoryModalUI.render === 'function') {
            window.inventoryModalUI.render();
        }
    }

    static _afterProgressionChange(eventName, payload) {
        if (typeof GearManager !== 'undefined' && typeof GearManager.syncPlayerStats === 'function') {
            GearManager.syncPlayerStats();
        }

        if (typeof window !== 'undefined') {
            if (window.soundEngine && typeof window.soundEngine.playLevelUp === 'function') {
                window.soundEngine.playLevelUp();
            }
            if (window.EventBus) {
                window.EventBus.emit(eventName, payload);
            }
            this._syncCloudAndEvents(payload);
            if (window.uiController && window.uiController.modalManager && typeof window.uiController.modalManager.updateGearScreen === 'function') {
                window.uiController.modalManager.updateGearScreen();
            } else if (typeof GearModalUI !== 'undefined' && typeof GearModalUI.renderAll === 'function') {
                GearModalUI.renderAll();
            }
            if (window.uiController && typeof window.uiController.updateCoinsDisplay === 'function') {
                window.uiController.updateCoinsDisplay();
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.GearUpgradeManager = GearUpgradeManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GearUpgradeManager };
}
