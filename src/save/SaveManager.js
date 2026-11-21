/**
 * Lesa.io - Master Save & Persistence Manager
 * Coordinates local storage saves and debounced cloud synchronization with Firebase
 */

class SaveManager {
    constructor(gameState = null) {
        this.gameState = gameState || (typeof window !== 'undefined' ? window.GameState : null);
        this.saveDebounceTimer = null;
        this.lastSavedTimestamp = 0;

        this.initEventListeners();
    }

    initEventListeners() {
        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.on('currencyChanged', () => this.requestSave());
            window.EventBus.on('heroSelected', () => this.requestSave());
            window.EventBus.on('heroStyleChanged', () => this.requestSave());
            window.EventBus.on('heroUnlocked', () => this.requestSave());
            window.EventBus.on('accountXpChanged', () => this.requestSave());
            window.EventBus.on('statsUpdated', () => this.requestSave());
            window.EventBus.on('materialsUpdated', () => this.requestSave());
            window.EventBus.on('gearUpgraded', () => this.requestSave());
            window.EventBus.on('gearEvolved', () => this.requestSave());
            window.EventBus.on('evolutionStoneCrafted', () => this.requestSave());
            window.EventBus.on('weaponEvolved', () => this.requestSave());
            window.EventBus.on('upgradesUpdated', () => this.requestSave());
            window.EventBus.on('skillLevelsChanged', () => this.requestSave());
            window.EventBus.on('cosmeticsUpdated', () => this.requestSave());
            window.EventBus.on('saveRequested', () => this.saveNow());
        }
    }

    /**
     * Alias for saveNow() used by UI subsystems
     */
    save() {
        return this.saveNow();
    }

    /**
     * Request a debounced save operation
     * @param {number} delayMs 
     */
    requestSave(delayMs = 600) {
        if (typeof window !== 'undefined' && window.cloudSave && window.cloudSave.isSyncingFromCloud) {
            if (this.gameState) {
                const serialized = SaveSerializer.serialize(this.gameState);
                if (serialized) localStorage.setItem('lesaio_save_v2', JSON.stringify(serialized));
            }
            return;
        }

        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
        }

        this.saveDebounceTimer = setTimeout(() => {
            this.saveNow();
        }, delayMs);
    }

    /**
     * Execute save immediately
     */
    saveNow() {
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
            this.saveDebounceTimer = null;
        }

        if (!this.gameState) return false;

        const serialized = SaveSerializer.serialize(this.gameState);
        if (!serialized) return false;

        try {
            // Save master payload
            localStorage.setItem('lesaio_save_v2', JSON.stringify(serialized));
            this.lastSavedTimestamp = Date.now();

            // Notify cloud sync if available (skip if we are currently applying cloud data)
            if (typeof window !== 'undefined' && window.cloudSave && window.cloudSave.currentUser) {
                if (window.cloudSave.isSyncingFromCloud) {
                    return true;
                }
                if (typeof window.cloudSave.triggerCloudSync === 'function') {
                    window.cloudSave.triggerCloudSync(serialized);
                } else if (typeof window.cloudSave.saveToCloud === 'function') {
                    window.cloudSave.saveToCloud(serialized);
                }
            }

            return true;
        } catch (err) {
            console.error('[SaveManager] Failed to persist game data:', err);
            return false;
        }
    }

    /**
     * Load persisted data into GameState on startup
     */
    load() {
        if (!this.gameState) return false;

        const raw = localStorage.getItem('lesaio_save_v2');
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                return SaveSerializer.deserialize(parsed, this.gameState);
            } catch (e) {
                console.warn('[SaveManager] Corrupt save payload found, falling back to legacy keys');
            }
        }
        return false;
    }
}

// Global Save Manager Singleton
const globalSaveManager = new SaveManager();

if (typeof window !== 'undefined') {
    window.SaveManager = globalSaveManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SaveManager, globalSaveManager };
}
