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

    addChest(type = 'common') {
        const def = (typeof CHEST_TYPES !== 'undefined') ? CHEST_TYPES[type] : null;
        if (!def) return false;

        const emptyIdx = this.getFirstEmptySlot();
        if (emptyIdx === -1) {
            return false; // All 4 slots full
        }

        this.slots[emptyIdx] = {
            id: 'chest_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            type: type,
            state: 'LOCKED',
            unlockStartTime: null,
            unlockDurationSec: def.unlockTimeSec
        };

        this.save();
        this.render();

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

    openChest(slotIndex) {
        const slot = this.slots[slotIndex];
        if (!slot || slot.state !== 'READY') return null;

        const def = CHEST_TYPES[slot.type] || CHEST_TYPES.common;

        // 1. Roll Coins
        const coins = Math.floor(Math.random() * (def.maxCoins - def.minCoins + 1)) + def.minCoins;

        // 2. Roll Gems
        let gems = 0;
        if (Math.random() < def.gemDropChance) {
            gems = Math.floor(Math.random() * (def.maxGems - def.minGems + 1)) + def.minGems;
        }

        // 3. Roll Gear Items from ALL_GEAR
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

        // 4. Deposit currencies
        if (window.GameState && typeof window.GameState.addCurrency === 'function') {
            window.GameState.addCurrency(coins, gems);
        }

        // 5. Empty slot
        this.slots[slotIndex] = null;
        this.save();
        this.render();

        const loot = { coins, gems, gear: droppedGear };

        // 6. Show Loot Opening Animation Modal
        if (typeof ChestModalUI !== 'undefined' && typeof ChestModalUI.showLoot === 'function') {
            ChestModalUI.showLoot(def, loot);
        }

        return loot;
    }

    rollRarity(def, itemIndex) {
        if (itemIndex === 0 && def.guaranteedLegendary) return 'legendary';
        if (itemIndex === 0 && def.guaranteedEpic) return 'epic';
        if (itemIndex === 0 && def.guaranteedRare) return 'rare';

        const odds = def.gearOdds;
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
                    <div class="slot-empty-icon">🔒</div>
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
                    const lblText = canFree ? '⚡ FREE FINISH!' : 'UNLOCKS IN';
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
