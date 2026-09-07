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
            }
        } catch (err) {
            console.warn('[InventoryManager] Failed to load inventory from storage:', err);
        }
    }

    save() {
        try {
            const payload = {
                version: 1,
                updatedAt: Date.now(),
                crates: { ...this.crates }
            };
            localStorage.setItem(this.storageKey, JSON.stringify(payload));
        } catch (err) {
            console.error('[InventoryManager] Failed to save inventory to storage:', err);
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

        // 4. Roll Gear Cards
        const droppedGear = [];
        if (typeof ALL_GEAR !== 'undefined' && Array.isArray(ALL_GEAR) && ALL_GEAR.length > 0) {
            for (let i = 0; i < def.gearCount; i++) {
                const targetRarity = this.rollRarity(def, i);
                let pool = ALL_GEAR.filter(g => (g.rarity || 'common') === targetRarity);
                if (pool.length === 0) pool = ALL_GEAR;
                const chosen = pool[Math.floor(Math.random() * pool.length)];
                if (chosen) {
                    droppedGear.push(chosen);
                    this.grantGearToInventory(chosen.id);
                }
            }
        }

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

        const loot = { coins, gems, gear: droppedGear };

        // 6. Show Loot Animation Reveal
        if (typeof ChestModalUI !== 'undefined' && typeof ChestModalUI.showLoot === 'function') {
            ChestModalUI.showLoot(def, loot);
        }

        // 7. Fire Events & Re-render Inventory UI
        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.emit('inventoryUpdated', { crateId, loot });
            window.EventBus.emit('currencyChanged', { coins, gems });
        }

        if (typeof window !== 'undefined' && window.inventoryModalUI && typeof window.inventoryModalUI.render === 'function') {
            window.inventoryModalUI.render();
        }

        return loot;
    }

    rollRarity(def, itemIndex) {
        if (itemIndex === 0 && def.guaranteedLegendary) return 'legendary';
        if (itemIndex === 0 && def.guaranteedEpic) return 'epic';
        if (itemIndex === 0 && def.guaranteedRare) return 'rare';

        const odds = def.gearOdds || { common: 1.0 };
        const rand = Math.random();
        let cumulative = 0;

        for (const [rarity, prob] of Object.entries(odds)) {
            cumulative += prob;
            if (rand <= cumulative) return rarity;
        }
        return 'common';
    }

    grantGearToInventory(gearId) {
        if (typeof GearManager !== 'undefined' && typeof GearManager.getUnlockedList === 'function') {
            const list = GearManager.getUnlockedList();
            if (!list.includes(gearId)) {
                list.push(gearId);
                if (window.GameState && window.GameState.player) {
                    window.GameState.player.unlockedGear = list;
                }
                localStorage.setItem('lesaio_unlocked_gear', JSON.stringify(list));
            }
        }
    }
}

if (typeof window !== 'undefined') {
    window.InventoryManager = InventoryManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InventoryManager };
}
