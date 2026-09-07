/**
 * Lesa.io - Gear & Armory Management System (Phase 1)
 * Coordinates equipment state, equipping/unequipping, stat aggregation, and save persistence.
 */

class GearManager {
    static getGearData(itemId) {
        if (typeof GEAR_DATA !== 'undefined' && GEAR_DATA[itemId]) {
            return GEAR_DATA[itemId];
        }
        return null;
    }

    static getEquippedMap() {
        const defaultEquipment = {
            helmet: null,
            armor: null,
            belt: null,
            gloves: null,
            boots: null
        };

        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
            if (!window.GameState.player.equippedGear) {
                const saved = localStorage.getItem('lesaio_equipped_gear');
                window.GameState.player.equippedGear = saved ? JSON.parse(saved) : defaultEquipment;
            }
            return window.GameState.player.equippedGear;
        }

        const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem('lesaio_equipped_gear') : null;
        return raw ? JSON.parse(raw) : defaultEquipment;
    }

    static getEquipped(slot) {
        const equipped = this.getEquippedMap();
        const itemId = equipped[slot];
        return itemId ? this.getGearData(itemId) : null;
    }

    static getUnlockedList() {
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
            if (!Array.isArray(window.GameState.player.unlockedGear)) {
                const saved = localStorage.getItem('lesaio_unlocked_gear');
                window.GameState.player.unlockedGear = saved ? JSON.parse(saved) : [];
            }
            return window.GameState.player.unlockedGear;
        }

        const raw = (typeof localStorage !== 'undefined') ? localStorage.getItem('lesaio_unlocked_gear') : null;
        return raw ? JSON.parse(raw) : [];
    }

    static isUnlocked(itemId) {
        const item = this.getGearData(itemId);
        if (!item) return false;

        // Common starter items are freely unlocked by default
        if (item.rarity === 'common') return true;

        const list = this.getUnlockedList();
        return list.includes(itemId);
    }

    static unlock(itemId) {
        const item = this.getGearData(itemId);
        if (!item) return { success: false, reason: 'Item not found' };
        if (this.isUnlocked(itemId)) return { success: true, alreadyUnlocked: true };

        const cost = item.cost || 0;
        const currentCoins = (typeof window !== 'undefined' && window.GameState && window.GameState.player) ? window.GameState.player.coins : 0;

        if (currentCoins < cost) {
            return { success: false, reason: 'Not enough coins' };
        }

        // Deduct coins
        if (window.GameState && window.GameState.addCurrency) {
            window.GameState.addCurrency(-cost, 0);
        } else if (window.GameState && window.GameState.player) {
            window.GameState.player.coins -= cost;
        }

        const list = this.getUnlockedList();
        if (!list.includes(itemId)) {
            list.push(itemId);
            if (window.GameState && window.GameState.player) {
                window.GameState.player.unlockedGear = list;
            }
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('lesaio_unlocked_gear', JSON.stringify(list));
            }
        }

        if (window.uiController && typeof window.uiController.updateCurrencyUI === 'function') {
            window.uiController.updateCurrencyUI(true);
        }

        this.save();
        return { success: true };
    }

    static equip(itemId) {
        const item = this.getGearData(itemId);
        if (!item) return false;
        if (!this.isUnlocked(itemId)) return false;

        const equipped = this.getEquippedMap();
        equipped[item.slot] = itemId;

        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
            window.GameState.player.equippedGear = equipped;
        }

        this.save();
        this.syncPlayerStats();
        return true;
    }

    static unequip(slot) {
        const equipped = this.getEquippedMap();
        if (equipped[slot]) {
            equipped[slot] = null;
            if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
                window.GameState.player.equippedGear = equipped;
            }
            this.save();
            this.syncPlayerStats();
            return true;
        }
        return false;
    }

    static getEquippedTotalStats() {
        const totals = {
            maxHp: 0,
            speed: 0,
            critChance: 0,
            critDamage: 0,
            damageReduction: 0,
            fireRate: 0,
            bulletDamage: 0,
            bulletSpeed: 0,
            dashCooldown: 0,
            magnetRadius: 0
        };

        const equipped = this.getEquippedMap();
        for (const slot of ['helmet', 'armor', 'belt', 'gloves', 'boots']) {
            const itemId = equipped[slot];
            if (!itemId) continue;

            const item = this.getGearData(itemId);
            if (!item || !item.stats) continue;

            for (const [k, v] of Object.entries(item.stats)) {
                if (typeof totals[k] === 'number') {
                    totals[k] += v;
                }
            }
        }

        // Apply defensive anti-godmode engine caps
        totals.damageReduction = Math.min(40, totals.damageReduction);
        totals.critChance = Math.min(45, totals.critChance);

        return totals;
    }

    static syncPlayerStats() {
        if (typeof window !== 'undefined' && window.gameInstance && window.gameInstance.player) {
            if (typeof window.gameInstance.player.applyEquipmentStats === 'function') {
                window.gameInstance.player.applyEquipmentStats();
            }
        }
        if (typeof window !== 'undefined' && window.uiController && window.uiController.modalManager) {
            if (typeof window.uiController.modalManager.updateGearScreen === 'function') {
                window.uiController.modalManager.updateGearScreen();
            }
        }
    }

    static save() {
        const equipped = this.getEquippedMap();
        const unlocked = this.getUnlockedList();
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('lesaio_equipped_gear', JSON.stringify(equipped));
            localStorage.setItem('lesaio_unlocked_gear', JSON.stringify(unlocked));
        }
        if (typeof window !== 'undefined' && window.GameState && typeof window.GameState.save === 'function') {
            window.GameState.save();
        }
    }
}

if (typeof window !== 'undefined') {
    window.GearManager = GearManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GearManager };
}
