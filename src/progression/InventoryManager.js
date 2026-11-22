/**
 * Lesa.io - Player Inventory Subsystem & Boss Crate Manager
 * Manages persistent inventory storage for Boss Crates, unboxing mechanics,
 * loot generation, currency attribution, and event dispatching.
 */

class InventoryManager {
    constructor() {
        this.storageKey = 'lesaio_inventory';
        this.crates = {
            boss_crate_easy: 0,
            boss_crate_normal: 0,
            boss_crate_hard: 0,
            boss_crate_very_hard: 0,
            boss_crate_insane: 0
        };
        this.chests = {
            common: 0,
            uncommon: 0,
            rare: 0,
            epic: 0,
            legendary: 0,
            mythic: 0
        };
        this.materials = (typeof MaterialRegistry !== 'undefined')
            ? MaterialRegistry.createEmptyMap()
            : { armory_shards: 0, mati_crystal: 0, olympian_bronze: 0, ambrosia_spark: 0 };
        this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed.crates === 'object') {
                    for (const key of Object.keys(this.crates)) {
                        if (typeof parsed.crates[key] === 'number') {
                            this.crates[key] = Math.max(0, Math.floor(parsed.crates[key]));
                        }
                    }
                }
                if (parsed && typeof parsed.chests === 'object') {
                    for (const [key, val] of Object.entries(parsed.chests)) {
                        if (typeof val === 'number') {
                            this.chests[key] = Math.max(0, Math.floor(val));
                        }
                    }
                }
                if (parsed && typeof parsed.materials === 'object') {
                    for (const key of Object.keys(this.materials)) {
                        const val = Number(parsed.materials[key]);
                        if (Number.isFinite(val) && val >= 0) {
                            this.materials[key] = Math.floor(val);
                        }
                    }
                }
            }
        } catch (err) {
            console.warn('[InventoryManager] Failed to load inventory from storage:', err);
        }
        this._syncMaterialsToGameState();
    }

    save() {
        try {
            this._syncMaterialsToGameState();
            const payload = {
                version: 2,
                updatedAt: Date.now(),
                crates: { ...this.crates },
                chests: { ...this.chests },
                materials: { ...this.materials }
            };
            localStorage.setItem(this.storageKey, JSON.stringify(payload));
        } catch (err) {
            console.error('[InventoryManager] Failed to save inventory to storage:', err);
        }
    }

    _syncMaterialsToGameState() {
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
            window.GameState.player.materials = { ...this.materials };
        }
    }

    getCrateCount(crateId) {
        return this.crates[crateId] || 0;
    }

    getTotalCratesCount() {
        return Object.values(this.crates).reduce((sum, val) => sum + (val || 0), 0);
    }

    getCrates() {
        return { ...this.crates };
    }

    getStoredChestCount(chestType) {
        return this.chests[chestType] || 0;
    }

    getTotalStoredChestsCount() {
        return Object.values(this.chests).reduce((sum, val) => sum + (val || 0), 0);
    }

    getStoredChests() {
        return { ...this.chests };
    }

    getMaterialCount(matId) {
        return (this.materials && typeof this.materials[matId] === 'number') ? this.materials[matId] : 0;
    }

    getMaterials() {
        return { ...this.materials };
    }

    getTotalMaterialsCount() {
        return Object.values(this.materials || {}).reduce((sum, val) => sum + (val || 0), 0);
    }

    addMaterial(matId, count = 1, meta = {}) {
        const qty = Math.floor(Number(count) || 0);
        if (!matId || qty <= 0 || !(matId in this.materials)) return 0;
        return this.addMaterials({ [matId]: qty }, meta)[matId] || 0;
    }

    addMaterials(matMap, meta = {}) {
        if (!matMap || typeof matMap !== 'object') return {};
        const added = {};
        let anyChanged = false;
        for (const [matId, rawVal] of Object.entries(matMap)) {
            if (!(matId in this.materials)) continue;
            const qty = Math.floor(Number(rawVal) || 0);
            if (qty <= 0) continue;
            this.materials[matId] += qty;
            added[matId] = (added[matId] || 0) + qty;
            anyChanged = true;
        }
        if (!anyChanged) return {};

        this.save();
        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.emit('materialsUpdated', { added, materials: { ...this.materials }, meta });
        }
        this._notifyInventoryUpdated({ materialsAdded: added, materials: { ...this.materials }, meta });
        return added;
    }

    hasMaterials(costMap) {
        if (!costMap || typeof costMap !== 'object') return true;
        for (const [matId, rawCost] of Object.entries(costMap)) {
            const need = Math.floor(Number(rawCost) || 0);
            if (need <= 0) continue;
            if (this.getMaterialCount(matId) < need) return false;
        }
        return true;
    }

    consumeMaterials(costMap, meta = {}) {
        if (!this.hasMaterials(costMap)) {
            return { success: false, reason: 'Not enough crafting materials!' };
        }
        let anyChanged = false;
        for (const [matId, rawCost] of Object.entries(costMap || {})) {
            const need = Math.floor(Number(rawCost) || 0);
            if (need <= 0 || !(matId in this.materials)) continue;
            this.materials[matId] = Math.max(0, this.materials[matId] - need);
            anyChanged = true;
        }
        if (anyChanged) {
            this.save();
            if (typeof window !== 'undefined' && window.EventBus) {
                window.EventBus.emit('materialsUpdated', { consumed: costMap, materials: { ...this.materials }, meta });
            }
            this._notifyInventoryUpdated({ materialsConsumed: costMap, materials: { ...this.materials }, meta });
        }
        return { success: true };
    }

    syncExternalMaterials(matMap) {
        if (!matMap || typeof matMap !== 'object') return;
        for (const key of Object.keys(this.materials)) {
            const val = Number(matMap[key]);
            this.materials[key] = (Number.isFinite(val) && val >= 0) ? Math.floor(val) : 0;
        }
        this.save();
        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.emit('materialsUpdated', { materials: { ...this.materials }, synced: true });
        }
        this._notifyInventoryUpdated({ materials: { ...this.materials }, synced: true });
    }

    _notifyInventoryUpdated(payload) {
        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.emit('inventoryUpdated', payload);
        }
        if (typeof window !== 'undefined' && window.inventoryModalUI && typeof window.inventoryModalUI.render === 'function') {
            window.inventoryModalUI.render();
        }
    }

    /**
     * Stores an overflow chest directly in inventory when main-menu chest slots are full.
     */
    addChestToInventory(chestType, count = 1) {
        if (!chestType || count <= 0) return false;
        const validDef = (typeof CHEST_TYPES !== 'undefined') ? CHEST_TYPES[chestType] : null;
        if (!validDef) return false;

        this.chests[chestType] = (this.chests[chestType] || 0) + count;
        this.save();

        if (window.soundEngine && typeof window.soundEngine.playPickup === 'function') {
            window.soundEngine.playPickup('diamond');
        }

        this._notifyInventoryUpdated({ chestType, count, total: this.chests[chestType] });
        return true;
    }

    /**
     * Moves one stored overflow chest into an available main-menu chest slot.
     */
    moveStoredChestToSlot(chestType) {
        if (!chestType || this.getStoredChestCount(chestType) <= 0) return false;
        if (typeof window === 'undefined' || !window.chestManager) return false;
        if (window.chestManager.getFirstEmptySlot() === -1) return false;

        const moved = window.chestManager.addChest(chestType, { slotOnly: true });
        if (moved !== true) return false;

        this.chests[chestType] = Math.max(0, this.chests[chestType] - 1);
        this.save();
        this._notifyInventoryUpdated({ chestType, movedToSlot: true, total: this.chests[chestType] });
        return true;
    }

    /**
     * Opens one stored overflow chest immediately using gems (matches ChestManager gemSpeedCost).
     */
    openStoredChestWithGems(chestType) {
        if (!chestType || this.getStoredChestCount(chestType) <= 0) return null;
        const def = (typeof CHEST_TYPES !== 'undefined') ? CHEST_TYPES[chestType] : null;
        if (!def) return null;

        const gemCost = Math.max(0, def.gemSpeedCost || 0);
        const playerGems = (window.GameState && window.GameState.player) ? (window.GameState.player.gems || 0) : 0;
        if (gemCost > 0) {
            if (playerGems < gemCost || !window.GameState || typeof window.GameState.addCurrency !== 'function') {
                if (window.soundEngine && typeof window.soundEngine.playGoBack === 'function') {
                    window.soundEngine.playGoBack();
                }
                if (window.uiController && typeof window.uiController.addKillfeed === 'function') {
                    window.uiController.addKillfeed('Not enough gems!');
                }
                return null;
            }
            window.GameState.addCurrency(0, -gemCost);
        }

        this.chests[chestType] = Math.max(0, this.chests[chestType] - 1);
        this.save();

        let loot = null;
        if (typeof window !== 'undefined' && window.chestManager && typeof window.chestManager.rollAndGrantLootForDef === 'function') {
            loot = window.chestManager.rollAndGrantLootForDef(def, true);
        }
        if (window.soundEngine && typeof window.soundEngine.playLevelUp === 'function') {
            window.soundEngine.playLevelUp();
        }
        this._notifyInventoryUpdated({ chestType, loot, gemCost });
        if (typeof window !== 'undefined' && window.SaveManager && typeof window.SaveManager.saveNow === 'function') {
            window.SaveManager.saveNow();
        }
        return loot;
    }

    /**
     * Awards one or more boss crates directly to the player's inventory
     */
    addCrate(crateId, count = 1) {
        if (!crateId || count <= 0) return false;
        if (typeof this.crates[crateId] === 'undefined') {
            this.crates[crateId] = 0;
        }

        this.crates[crateId] += count;
        this.save();

        const def = (typeof BOSS_CRATES !== 'undefined') ? BOSS_CRATES[crateId] : null;
        const crateName = def ? def.name : 'Boss Crate';

        if (window.soundEngine && typeof window.soundEngine.playPickup === 'function') {
            window.soundEngine.playPickup('diamond');
        }

        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.emit('inventoryUpdated', { crateId, count, total: this.crates[crateId] });
        }

        if (typeof window !== 'undefined' && window.inventoryModalUI && typeof window.inventoryModalUI.render === 'function') {
            window.inventoryModalUI.render();
        }

        return true;
    }

    /**
     * Opens a boss crate from inventory, rolls loot, credits player, and shows reveal modal
     */
    openCrate(crateId) {
        if (!this.crates[crateId] || this.crates[crateId] <= 0) {
            if (window.soundEngine && typeof window.soundEngine.playGoBack === 'function') {
                window.soundEngine.playGoBack();
            }
            return null;
        }

        const def = (typeof BOSS_CRATES !== 'undefined') ? BOSS_CRATES[crateId] : null;
        if (!def) return null;

        // 1. Decrement crate from inventory
        this.crates[crateId]--;
        this.save();

        // 2. Roll Gold Coins
        const coins = Math.floor(Math.random() * (def.maxCoins - def.minCoins + 1)) + def.minCoins;

        // 3. Roll Gems
        let gems = 0;
        if (Math.random() < def.gemDropChance) {
            gems = Math.floor(Math.random() * (def.maxGems - def.minGems + 1)) + def.minGems;
        }

        // 4. Roll Gear Cards (respect chest rarity odds & 0% Epic/Legendary guard for low-tier crates)
        const droppedGear = [];
        const duplicateEntries = [];
        const rawGear = (typeof ALL_GEAR !== 'undefined' && Array.isArray(ALL_GEAR) && ALL_GEAR.length > 0)
            ? ALL_GEAR
            : (typeof GEAR_DATA !== 'undefined' ? Object.values(GEAR_DATA) : []);
        const allowEpic = ((def.gearOdds && def.gearOdds.epic) || 0) > 0 || (def.guaranteedEpic || 0) > 0;
        const allowLeg = ((def.gearOdds && def.gearOdds.legendary) || 0) > 0 || (def.guaranteedLegendary || 0) > 0;
        const eligibleGear = rawGear.filter(g => {
            const r = g.rarity || 'common';
            if (r === 'exclusive' || g.excludeFromChests) return false;
            if (r === 'epic' && !allowEpic) return false;
            if (r === 'legendary' && !allowLeg) return false;
            return true;
        });

        if (eligibleGear.length > 0) {
            for (let i = 0; i < def.gearCount; i++) {
                const targetRarity = this.rollRarity(def, i);
                let pool = eligibleGear.filter(g => (g.rarity || 'common') === targetRarity);
                if (pool.length === 0) pool = eligibleGear;
                const chosen = pool[Math.floor(Math.random() * pool.length)];
                if (chosen) {
                    const grantRes = this.grantGearToInventory(chosen.id);
                    droppedGear.push({ ...chosen, isDuplicate: grantRes.isDuplicate, shardBonus: grantRes.shardBonus });
                    if (grantRes.isDuplicate && grantRes.shardBonus > 0) duplicateEntries.push(grantRes);
                }
            }
        }

        // 4.5. Roll Container Materials + Duplicate Gear Salvage into Armory Shards
        const matLoot = this.applyContainerMaterials(def.id || crateId, duplicateEntries);

        // 5. Deposit Currencies
        if (window.GameState && typeof window.GameState.addCurrency === 'function') {
            window.GameState.addCurrency(coins, gems);
        } else if (window.uiController) {
            if (typeof window.uiController.setCoins === 'function') {
                window.uiController.setCoins((window.uiController.coins || 0) + coins);
            }
            if (typeof window.uiController.setGems === 'function') {
                window.uiController.setGems((window.uiController.gems || 0) + gems);
            }
        }

        if (window.soundEngine && typeof window.soundEngine.playLevelUp === 'function') {
            window.soundEngine.playLevelUp();
        }

        const loot = { coins, gems, gear: droppedGear, materials: matLoot.materials, duplicateShards: matLoot.duplicateShards };

        // 6. Show Loot Animation Reveal
        if (typeof ChestModalUI !== 'undefined' && typeof ChestModalUI.showLoot === 'function') {
            ChestModalUI.showLoot(def, loot);
        }

        // 7. Fire Events & Re-render Inventory UI (GameState.addCurrency already emitted currencyChanged with total balances)
        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.emit('inventoryUpdated', { crateId, loot });
        }
        if (typeof window !== 'undefined' && window.SaveManager && typeof window.SaveManager.saveNow === 'function') {
            window.SaveManager.saveNow();
        }

        if (typeof window !== 'undefined' && window.inventoryModalUI && typeof window.inventoryModalUI.render === 'function') {
            window.inventoryModalUI.render();
        }

        return loot;
    }

    rollRarity(def, itemIndex) {
        if (itemIndex < (def.guaranteedLegendary || 0)) return 'legendary';
        if (itemIndex < (def.guaranteedEpic || 0)) return 'epic';
        if (itemIndex < (def.guaranteedRare || 0)) return 'rare';

        const odds = def.gearOdds || { common: 1.0 };
        const entries = Object.entries(odds).filter(([, prob]) => prob > 0);
        const total = entries.reduce((sum, [, prob]) => sum + prob, 0);
        const rand = Math.random() * (total > 0 ? total : 1);
        let cumulative = 0;

        for (const [rarity, prob] of entries) {
            cumulative += prob;
            if (rand <= cumulative) return rarity;
        }
        return entries.length > 0 ? entries[entries.length - 1][0] : 'common';
    }

    grantGearToInventory(gearId) {
        if (typeof GearManager === 'undefined') return { isDuplicate: false, shardBonus: 0 };

        const wasUnlocked = (typeof GearManager.isUnlocked === 'function') ? GearManager.isUnlocked(gearId) : false;
        const gearDef = (typeof GearManager.getGearData === 'function') ? GearManager.getGearData(gearId) : null;

        if (typeof GearManager.unlock === 'function') {
            const res = GearManager.unlock(gearId, { free: true, source: 'chest' });
            const isDup = !!(wasUnlocked || (res && res.alreadyUnlocked));
            const shardBonus = (isDup && typeof MaterialRegistry !== 'undefined')
                ? MaterialRegistry.getDuplicateShardValue(gearDef ? gearDef.rarity : 'common')
                : 0;
            return { isDuplicate: isDup, shardBonus };
        }

        if (typeof GearManager.getUnlockedList === 'function') {
            const list = GearManager.getUnlockedList();
            if (!list.includes(gearId)) {
                list.push(gearId);
                if (window.GameState && window.GameState.player) {
                    window.GameState.player.unlockedGear = list;
                }
                localStorage.setItem('lesaio_unlocked_gear', JSON.stringify(list));
                return { isDuplicate: false, shardBonus: 0 };
            }
            const shardBonus = (typeof MaterialRegistry !== 'undefined')
                ? MaterialRegistry.getDuplicateShardValue(gearDef ? gearDef.rarity : 'common')
                : 0;
            return { isDuplicate: true, shardBonus };
        }

        return { isDuplicate: false, shardBonus: 0 };
    }

    /**
     * Shared chest/crate material roller & duplicate-gear salvage grant.
     * Used cleanly by both ChestManager and InventoryManager.openCrate.
     */
    applyContainerMaterials(containerId, duplicateEntries = []) {
        const rolled = (typeof MaterialRegistry !== 'undefined')
            ? MaterialRegistry.rollForContainer(containerId)
            : {};
        let duplicateShards = 0;
        for (const entry of (duplicateEntries || [])) {
            if (entry && entry.shardBonus > 0) {
                duplicateShards += entry.shardBonus;
            }
        }
        const totalMap = { ...rolled };
        if (duplicateShards > 0) {
            totalMap.armory_shards = (totalMap.armory_shards || 0) + duplicateShards;
        }
        const added = this.addMaterials(totalMap, { source: 'container', containerId, duplicateShards });
        return { materials: added, rolled, duplicateShards };
    }

    /**
     * Awards guaranteed battle/boss/floor materials with HUD killfeed, comic float text,
     * run tracking, and Co-op P2P guest synchronization.
     */
    awardBattleMaterials(rewardMap, options = {}) {
        if (!rewardMap || typeof rewardMap !== 'object') return {};
        const finalMap = (typeof MaterialRegistry !== 'undefined' && typeof MaterialRegistry.applyDropLuckBonus === 'function')
            ? MaterialRegistry.applyDropLuckBonus(rewardMap, options)
            : rewardMap;
        const added = this.addMaterials(finalMap, { source: options.source || 'battle', sourceName: options.sourceName || '' });
        const entries = Object.entries(added);
        if (entries.length === 0) return {};

        const game = options.game || (typeof window !== 'undefined' ? window.gameInstance : null);
        if (game) {
            if (!game.materialsEarnedThisRun) game.materialsEarnedThisRun = {};
            for (const [id, qty] of entries) {
                game.materialsEarnedThisRun[id] = (game.materialsEarnedThisRun[id] || 0) + qty;
            }
            if (options.syncCoop !== false && !game.isCoopGuest && game.coopSession && game.coopSession.net && typeof game.coopSession.net.send === 'function') {
                game.coopSession.net.send('MATERIAL_REWARD', {
                    materials: added,
                    sourceName: options.sourceName || ''
                });
            }
        }

        const parts = entries.map(([matId, qty]) => {
            const def = (typeof MaterialRegistry !== 'undefined') ? MaterialRegistry.get(matId) : null;
            return `+${qty} ${def ? `${def.icon} ${def.name}` : matId}`;
        });
        const labelText = parts.join(' • ');

        if (game && game.ui && typeof game.ui.addKillfeed === 'function') {
            const prefix = options.sourceName ? `${options.sourceName}: ` : '';
            game.ui.addKillfeed(`${prefix}${labelText}`);
        }
        if (game && game.effects && typeof game.effects.spawnDamageText === 'function') {
            const tx = Number.isFinite(options.x) ? options.x : (game.player ? game.player.x : 0);
            const ty = (Number.isFinite(options.y) ? options.y : (game.player ? game.player.y : 0)) - 75;
            const firstDef = (typeof MaterialRegistry !== 'undefined') ? MaterialRegistry.get(entries[0][0]) : null;
            game.effects.spawnDamageText(tx, ty, labelText, firstDef ? firstDef.color : '#38bdf8');
        }
        return added;
    }
}

if (typeof window !== 'undefined') {
    window.InventoryManager = InventoryManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InventoryManager };
}
