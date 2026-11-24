/**
 * Lesa.io - Chest System & 4-Slot Progression Manager
 * Manages the 4 persistent main menu slots, timestamp-based timer countdowns,
 * gem speed-ups, loot generation, and slot rendering.
 */

class ChestManager {
    constructor() {
        this.slots = [null, null, null, null];
        this.containerEl = null;
        this.timerInterval = null;
        this.load();
    }

    init() {
        this.containerEl = document.getElementById('menu-chest-slots');
        this.checkTimerCompletions();
        this.render();

        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => this.tick(), 1000);

        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.on('currencyChanged', () => this.render());
        }
    }

    load() {
        try {
            const raw = localStorage.getItem('lesaio_chest_slots');
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length === 4) {
                    this.slots = parsed;
                }
            }
        } catch (e) {
            console.warn('[ChestManager] Failed to load saved slots, resetting:', e);
            this.slots = [null, null, null, null];
        }
        this.checkTimerCompletions();
    }

    save() {
        try {
            localStorage.setItem('lesaio_chest_slots', JSON.stringify(this.slots));
        } catch (e) {
            console.error('[ChestManager] Failed to persist slots:', e);
        }
    }

    checkTimerCompletions() {
        const now = Date.now();
        for (let i = 0; i < 4; i++) {
            const s = this.slots[i];
            if (s && s.state === 'UNLOCKING' && s.unlockStartTime) {
                const elapsedSec = (now - s.unlockStartTime) / 1000;
                if (elapsedSec >= s.unlockDurationSec) {
                    s.state = 'READY';
                    s.unlockStartTime = null;
                }
            }
        }
    }

    tick() {
        let hasActiveUnlocking = false;
        let stateChanged = false;
        const now = Date.now();

        for (let i = 0; i < 4; i++) {
            const s = this.slots[i];
            if (s && s.state === 'UNLOCKING') {
                hasActiveUnlocking = true;
                const elapsedSec = (now - s.unlockStartTime) / 1000;
                if (elapsedSec >= s.unlockDurationSec) {
                    s.state = 'READY';
                    s.unlockStartTime = null;
                    stateChanged = true;
                }
            }
        }

        if (stateChanged) {
            this.save();
            this.render();
        } else if (hasActiveUnlocking) {
            this.updateTimerDisplays();
        }
    }

    getFirstEmptySlot() {
        for (let i = 0; i < 4; i++) {
            if (this.slots[i] === null) return i;
        }
        return -1;
    }

    addChest(type = 'common', options = {}) {
        const def = (typeof CHEST_TYPES !== 'undefined') ? CHEST_TYPES[type] : null;
        if (!def) return false;

        const emptyIdx = this.getFirstEmptySlot();
        if (emptyIdx === -1) {
            if (!options.slotOnly && typeof window !== 'undefined' && window.inventoryManager && typeof window.inventoryManager.addChestToInventory === 'function') {
                if (window.inventoryManager.addChestToInventory(type, 1, { freeOpen: Boolean(options.ready) })) {
                    return 'inventory';
                }
            }
            return false; // All 4 slots full
        }

        this.slots[emptyIdx] = {
            id: 'chest_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            type: type,
            state: options.ready ? 'READY' : 'LOCKED',
            unlockStartTime: null,
            unlockDurationSec: def.unlockTimeSec
        };

        this.save();
        this.render();
        if (typeof window !== 'undefined' && window.inventoryModalUI && typeof window.inventoryModalUI.render === 'function') {
            window.inventoryModalUI.render();
        }

        if (window.soundEngine && typeof window.soundEngine.playPickup === 'function') {
            window.soundEngine.playPickup('diamond');
        }

        return true;
    }

    getActiveUnlockingSlot() {
        for (let i = 0; i < 4; i++) {
            if (this.slots[i] && this.slots[i].state === 'UNLOCKING') return i;
        }
        return -1;
    }

    startUnlock(slotIndex) {
        const slot = this.slots[slotIndex];
        if (!slot || slot.state !== 'LOCKED') return false;

        const activeIdx = this.getActiveUnlockingSlot();
        if (activeIdx !== -1 && activeIdx !== slotIndex) {
            if (typeof window !== 'undefined' && window.uiController) {
                window.uiController.addKillfeed('Another chest is already unlocking!');
            }
            return false;
        }

        const def = CHEST_TYPES[slot.type];
        slot.state = 'UNLOCKING';
        slot.unlockStartTime = Date.now();
        slot.unlockDurationSec = def ? def.unlockTimeSec : 900;

        this.save();
        this.render();

        if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
            window.soundEngine.playSelect();
        }

        return true;
    }

    getRemainingSeconds(slot) {
        if (!slot || slot.state !== 'UNLOCKING' || !slot.unlockStartTime) return 0;
        const elapsed = (Date.now() - slot.unlockStartTime) / 1000;
        return Math.max(0, Math.ceil(slot.unlockDurationSec - elapsed));
    }

    getSpeedUpGemCost(slot) {
        if (!slot) return 0;
        const def = CHEST_TYPES[slot.type];
        if (!def) return 5;
        if (slot.state === 'LOCKED') return def.gemSpeedCost;

        const remaining = this.getRemainingSeconds(slot);
        if (remaining <= 0) return 0;
        const ratio = remaining / slot.unlockDurationSec;
        return Math.max(1, Math.ceil(def.gemSpeedCost * ratio));
    }

    speedUpWithGems(slotIndex) {
        const slot = this.slots[slotIndex];
        if (!slot || slot.state === 'READY') return false;

        const gemCost = this.getSpeedUpGemCost(slot);
        const playerGems = (window.GameState && window.GameState.player) ? window.GameState.player.gems : 0;

        if (playerGems < gemCost) {
            if (window.soundEngine && typeof window.soundEngine.playGoBack === 'function') {
                window.soundEngine.playGoBack();
            }
            if (window.uiController) window.uiController.addKillfeed('Not enough gems! 💎');
            return false;
        }

        if (window.GameState && typeof window.GameState.addCurrency === 'function') {
            window.GameState.addCurrency(0, -gemCost);
        }

        slot.state = 'READY';
        slot.unlockStartTime = null;

        this.save();
        this.render();
        if (typeof window !== 'undefined' && window.SaveManager && typeof window.SaveManager.saveNow === 'function') {
            window.SaveManager.saveNow();
        }

        if (window.soundEngine && typeof window.soundEngine.playPickup === 'function') {
            window.soundEngine.playPickup('diamond');
        }

        return true;
    }

    /**
     * Checks if the active unlocking slot is eligible for the daily 1-minute free finish.
     * Rule: Only Common or Uncommon chests, timer <= 60 seconds, max once per calendar day.
     */
    canUseDailyFreeSkip(slot) {
        if (!slot || slot.state !== 'UNLOCKING' || !slot.unlockStartTime) return false;
        if (slot.type !== 'common' && slot.type !== 'uncommon') return false;

        const remaining = this.getRemainingSeconds(slot);
        if (remaining <= 0 || remaining > 60) return false;

        const today = new Date().toISOString().slice(0, 10);
        const lastUsed = localStorage.getItem('lesaio_daily_free_skip_date');
        return lastUsed !== today;
    }

    /**
     * Executes the daily free skip if eligible.
     */
    useDailyFreeSkip(slotIndex) {
        const slot = this.slots[slotIndex];
        if (!this.canUseDailyFreeSkip(slot)) return false;

        const today = new Date().toISOString().slice(0, 10);
        localStorage.setItem('lesaio_daily_free_skip_date', today);

        slot.state = 'READY';
        slot.unlockStartTime = null;

        this.save();
        this.render();
        if (typeof window !== 'undefined' && window.SaveManager && typeof window.SaveManager.saveNow === 'function') {
            window.SaveManager.saveNow();
        }

        if (window.soundEngine && typeof window.soundEngine.playPickup === 'function') {
            window.soundEngine.playPickup('diamond');
        }
        if (window.uiController && typeof window.uiController.addKillfeed === 'function') {
            window.uiController.addKillfeed('Daily Free Skip Used! ⚡');
        }

        return true;
    }

    formatDuration(seconds) {
        const s = Math.max(0, Math.floor(seconds));
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        if (hrs > 0) {
            if (mins === 30) return '1.5 Hours';
            if (mins > 0) return `${hrs}h ${mins}m`;
            return `${hrs} Hours`;
        }
        return `${mins} Minutes`;
    }

    formatTime(seconds) {
        const s = Math.max(0, Math.floor(seconds));
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = s % 60;

        if (hrs > 0) {
            return `${hrs}H ${mins < 10 ? '0' + mins : mins}M`;
        }
        return `${mins}M ${secs < 10 ? '0' + secs : secs}S`;
    }

    /**
     * Rolls coins, gems, and eligible gear for a chest definition and credits the player.
     */
    rollAndGrantLootForDef(def, showModal = true) {
        // 1. Roll Coins
        const rawCoins = Math.floor(Math.random() * (def.maxCoins - def.minCoins + 1)) + def.minCoins;
        const coins = Math.round(rawCoins * ((typeof ClanBuffs !== 'undefined') ? ClanBuffs.getChestCoinsMultiplier() : 1.0));

        // 2. Roll Gems
        let gems = 0;
        if (Math.random() < def.gemDropChance) {
            gems = Math.floor(Math.random() * (def.maxGems - def.minGems + 1)) + def.minGems;
        }

        // 3. Roll Gear Items from GEAR_DATA / ALL_GEAR (never dropping exclusive event items, and 0% Epic/Leg for Common/Uncommon chests)
        const droppedGear = [];
        const duplicateEntries = [];
        const rawGear = (typeof ALL_GEAR !== 'undefined' && Array.isArray(ALL_GEAR) && ALL_GEAR.length > 0)
            ? ALL_GEAR
            : (typeof GEAR_DATA !== 'undefined' ? Object.values(GEAR_DATA) : []);
        const allowEpic = ((def.gearOdds && def.gearOdds.epic) || 0) > 0 || (def.guaranteedEpic || 0) > 0;
        const allowLeg = ((def.gearOdds && def.gearOdds.legendary) || 0) > 0 || (def.guaranteedLegendary || 0) > 0;
        const eligibleGear = rawGear.filter(g => {
            const r = g.rarity || 'common';
            if (r === 'exclusive' || r === 'mythic' || r === 'apex' || g.excludeFromChests || g.bossUnlock) return false;
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

        // 3.5. Bonus Chest Weapon Drop Roll (prefers unowned Rare / Epic / Legendary chest weapons)
        const droppedWeapon = this.rollChestWeaponDrop(def);

        // 3.6. Container materials & duplicate gear salvage into Armory Shards
        let matLoot = { materials: {}, duplicateShards: 0 };
        if (typeof window !== 'undefined' && window.inventoryManager && typeof window.inventoryManager.applyContainerMaterials === 'function') {
            matLoot = window.inventoryManager.applyContainerMaterials(def.id || def.rarity, duplicateEntries);
        }

        // 4. Deposit currencies
        if (window.GameState && typeof window.GameState.addCurrency === 'function') {
            window.GameState.addCurrency(coins, gems);
        }

        const loot = { coins, gems, gear: droppedGear, weapon: droppedWeapon, materials: matLoot.materials, duplicateShards: matLoot.duplicateShards };

        if (showModal && typeof ChestModalUI !== 'undefined' && typeof ChestModalUI.showLoot === 'function') {
            ChestModalUI.showLoot(def, loot);
        }

        return loot;
    }

    openChest(slotIndex) {
        const slot = this.slots[slotIndex];
        if (!slot || slot.state !== 'READY') return null;

        const def = CHEST_TYPES[slot.type] || CHEST_TYPES.common;
        const loot = this.rollAndGrantLootForDef(def, false);

        // 5. Empty slot & flush updated balance/inventory immediately
        this.slots[slotIndex] = null;
        this.save();
        this.render();
        if (typeof window !== 'undefined' && window.SaveManager && typeof window.SaveManager.saveNow === 'function') {
            window.SaveManager.saveNow();
        }
        if (typeof window !== 'undefined' && window.inventoryModalUI && typeof window.inventoryModalUI.render === 'function') {
            window.inventoryModalUI.render();
        }

        // 6. Show Loot Opening Animation Modal
        if (typeof ChestModalUI !== 'undefined' && typeof ChestModalUI.showLoot === 'function') {
            ChestModalUI.showLoot(def, loot);
        }

        return loot;
    }

    /**
     * Roll chest bonus weapon drop: selects rarity by chest weaponOdds, prefers unowned weapons, and permanently unlocks.
     */
    rollChestWeaponDrop(def) {
        const chance = (def && def.weaponDropChance) || 0;
        if (chance <= 0 || Math.random() >= chance) return null;
        const wMap = (typeof WEAPONS !== 'undefined' && WEAPONS) || (typeof window !== 'undefined' && window.WEAPONS) || {};
        const odds = (def && def.weaponOdds) || { rare: 1.0 };
        const allowedRarities = Object.keys(odds).filter(r => odds[r] > 0);
        const candidates = Object.values(wMap).filter(w => {
            if (!w || w.unlockSource !== 'chest_drop') return false;
            const rk = (w.rarity || 'Rare').toLowerCase();
            if (!allowedRarities.includes(rk)) return false;
            return typeof WeaponSystem === 'undefined' || !WeaponSystem.isWeaponUnlocked(w.id);
        });
        if (candidates.length === 0) return null;

        const total = allowedRarities.reduce((s, r) => s + odds[r], 0);
        let pick = Math.random() * (total > 0 ? total : 1);
        let rolledRarity = allowedRarities[0] || 'rare';
        for (const r of allowedRarities) {
            pick -= odds[r];
            if (pick <= 0) { rolledRarity = r; break; }
        }
        let pool = candidates.filter(w => (w.rarity || 'Rare').toLowerCase() === rolledRarity);
        if (pool.length === 0) {
            if (rolledRarity === 'celestial') return null;
            pool = candidates.filter(w => (w.rarity || 'Rare').toLowerCase() !== 'celestial');
            if (pool.length === 0) return null;
        }
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        if (!chosen) return null;

        if (typeof WeaponSystem !== 'undefined' && typeof WeaponSystem.unlockWeapon === 'function') {
            WeaponSystem.unlockWeapon(chosen.id, { silent: true, deferSave: true });
        }
        return { ...chosen, rarityKey: (chosen.rarity || 'Rare').toLowerCase() };
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
        if (typeof window !== 'undefined' && window.inventoryManager && typeof window.inventoryManager.grantGearToInventory === 'function') {
            return window.inventoryManager.grantGearToInventory(gearId);
        }
        if (typeof GearManager !== 'undefined' && typeof GearManager.unlock === 'function') {
            const wasUnlocked = (typeof GearManager.isUnlocked === 'function') ? GearManager.isUnlocked(gearId) : false;
            GearManager.unlock(gearId, { free: true, source: 'chest' });
            return { isDuplicate: wasUnlocked, shardBonus: 0 };
        }
        return { isDuplicate: false, shardBonus: 0 };
    }

    updateTimerDisplays() {
        if (!this.containerEl) return;
        const now = Date.now();

        for (let i = 0; i < 4; i++) {
            const slot = this.slots[i];
            if (slot && slot.state === 'UNLOCKING') {
                const timeEl = this.containerEl.querySelector(`#chest-time-${i}`);
                if (timeEl) {
                    const rem = this.getRemainingSeconds(slot);
                    timeEl.textContent = this.formatTime(rem);
                }
            }
        }
    }

    render() {
        if (!this.containerEl) {
            this.containerEl = document.getElementById('menu-chest-slots');
            if (!this.containerEl) return;
        }

        this.containerEl.innerHTML = '';

        for (let i = 0; i < 4; i++) {
            const slot = this.slots[i];
            const card = document.createElement('div');

            if (!slot) {
                // Empty Slot
                card.className = 'chest-slot-card slot-empty';
                card.innerHTML = `
                    <div class="slot-empty-icon">${typeof UiIcons !== 'undefined' ? UiIcons.i('lock', 'ui-icon-box') : '🔒'}</div>
                    <div class="slot-empty-title">EMPTY SLOT</div>
                    <div class="slot-empty-hint">Win matches or complete quests to earn chests!</div>
                `;
            } else {
                // Filled Chest Slot
                const def = (typeof CHEST_TYPES !== 'undefined') ? CHEST_TYPES[slot.type] : null;
                const chestName = def ? def.name : 'Chest';
                const chestIcon = def ? def.icon : 'assets/Chests/CommonChest.png';
                const rarityClass = `tier-${slot.type}`;
                const readyClass = (slot.state === 'READY') ? 'slot-ready' : '';

                let footerHtml = '';
                if (slot.state === 'LOCKED') {
                    footerHtml = `<div class="chest-card-footer status-locked">TAP TO UNLOCK</div>`;
                } else if (slot.state === 'UNLOCKING') {
                    const rem = this.getRemainingSeconds(slot);
                    const canFree = this.canUseDailyFreeSkip(slot);
                    const freeClass = canFree ? 'status-free-skip-ready' : '';
                    const lblText = canFree ? `${typeof UiIcons !== 'undefined' ? UiIcons.i('bolt', 'ui-icon-sm') : '⚡'} FREE FINISH!` : 'UNLOCKS IN';
                    footerHtml = `
                        <div class="chest-card-footer status-unlocking ${freeClass}">
                            <span class="status-unlocking-lbl">${lblText}</span>
                            <span id="chest-time-${i}" class="status-unlocking-time">${this.formatTime(rem)}</span>
                        </div>
                    `;
                } else if (slot.state === 'READY') {
                    footerHtml = `<div class="chest-card-footer status-ready">TAP TO OPEN!</div>`;
                }

                card.className = `chest-slot-card ${rarityClass} ${readyClass}`;
                card.innerHTML = `
                    <div class="chest-card-header">${chestName}</div>
                    <div class="chest-card-img-wrap">
                        <img src="${chestIcon}" class="chest-card-img" alt="${chestName}">
                    </div>
                    ${footerHtml}
                `;

                card.addEventListener('click', () => {
                    if (window.soundEngine && typeof window.soundEngine.playSelect === 'function') {
                        window.soundEngine.playSelect();
                    }
                    if (typeof ChestModalUI !== 'undefined') {
                        ChestModalUI.inspect(i, slot, this);
                    }
                });
            }

            this.containerEl.appendChild(card);
        }
    }
}

if (typeof window !== 'undefined') {
    window.ChestManager = ChestManager;
}
