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
            const events = [
                'currencyChanged', 'heroSelected', 'heroStyleChanged', 'heroUnlocked',
                'accountXpChanged', 'statsUpdated', 'materialsUpdated', 'gearUpgraded',
                'gearEvolved', 'evolutionStoneCrafted', 'weaponEvolved', 'weaponUnlocked',
                'skillUnlocked', 'upgradesUpdated', 'skillLevelsChanged', 'perkUnlocked',
                'perkEquipped', 'perkUnequipped', 'cosmeticsUpdated', 'battlePassUpdated',
                'heroSkinChanged', 'starBlessingUpdated', 'crestsUpdated', 'chestSlotsChanged'
            ];
            for (const ev of events) {
                window.EventBus.on(ev, () => this.requestSave());
            }
            window.EventBus.on('saveRequested', () => this.saveNow());
        }

        if (typeof window !== 'undefined') {
            const flushHandler = () => this.flushLocal();
            window.addEventListener('beforeunload', flushHandler);
            window.addEventListener('pagehide', flushHandler);
            if (typeof document !== 'undefined') {
                document.addEventListener('visibilitychange', () => {
                    if (document.visibilityState === 'hidden') this.flushLocal();
                });
            }
        }
    }

    /**
     * Alias for saveNow() used by UI subsystems
     */
    save() {
        return this.saveNow();
    }

    _wouldDowngradeStoredSave(serialized) {
        if (typeof localStorage === 'undefined' || !serialized || !serialized.player) return false;
        if (typeof window !== 'undefined' && window._lesaioAllowDowngradeSave) return false;
        if (typeof SaveMigration === 'undefined') return false;
        const existing = SaveMigration.safeGetJson(SaveMigration.KEYS.MAIN_SAVE, null);
        if (!existing || !existing.player) return false;
        const sp = serialized.player;
        const ep = existing.player;
        const ss = sp.stats || {};
        const es = ep.stats || {};
        const curLvl = Number(sp.accountLevel) || 1;
        const prevLvl = Number(ep.accountLevel) || 1;
        const curKills = Number(ss.totalKills) || 0;
        const prevKills = Number(es.totalKills) || 0;
        const curHigh = Number(ss.highScore) || 0;
        const prevHigh = Number(es.highScore) || 0;
        return curLvl < prevLvl || curKills < prevKills || curHigh < prevHigh;
    }

    /**
     * Write local master save + rolling backup synchronously without triggering cloud I/O.
     */
    saveLocalOnly() {
        if (!this.gameState || typeof SaveSerializer === 'undefined') return null;
        const serialized = SaveSerializer.serialize(this.gameState);
        if (!serialized) return null;
        if (this._wouldDowngradeStoredSave(serialized)) return null;
        try {
            localStorage.setItem('lesaio_save_v2', JSON.stringify(serialized));
            if (typeof SaveMigration !== 'undefined') {
                SaveMigration.writeBackup(serialized);
                SaveMigration.recordLocalMutation(serialized.timestamp || Date.now());
            } else {
                localStorage.setItem('lesaio_save_v2_backup', JSON.stringify(serialized));
            }
            this.lastSavedTimestamp = Date.now();
            return serialized;
        } catch (err) {
            console.error('[SaveManager] Failed to persist local backup data:', err);
            return null;
        }
    }

    /**
     * Flush any pending debounced save locally before tab close/reload/backgrounding.
     */
    flushLocal() {
        if (typeof window !== 'undefined' && (window._lesaioSuppressUnloadSave || (window.cloudSave && window.cloudSave.isHydratingAuth))) return false;
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
            this.saveDebounceTimer = null;
        }
        return !!this.saveLocalOnly();
    }

    /**
     * Request a debounced save operation
     * @param {number} delayMs 
     */
    requestSave(delayMs = 600) {
        if (typeof window !== 'undefined' && window.cloudSave && (window.cloudSave.isSyncingFromCloud || window.cloudSave.isHydratingAuth)) {
            if (!window.cloudSave.isHydratingAuth) this.saveLocalOnly();
            return;
        }

        if (typeof SaveMigration !== 'undefined') {
            SaveMigration.recordLocalMutation();
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

        const serialized = this.saveLocalOnly();
        if (!serialized) return false;

        try {
            // Notify cloud sync if available (skip if hydrating auth or applying cloud data)
            if (typeof window !== 'undefined' && window.cloudSave && window.cloudSave.currentUser) {
                if (window.cloudSave.isSyncingFromCloud || window.cloudSave.isHydratingAuth) {
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
     * Load persisted data into GameState on startup (falls back to rolling/pre-update backups)
     */
    load() {
        if (!this.gameState || typeof SaveSerializer === 'undefined') return false;

        const candidates = [];
        try {
            const mainRaw = localStorage.getItem('lesaio_save_v2');
            if (mainRaw) candidates.push(JSON.parse(mainRaw));
        } catch (e) {
            console.warn('[SaveManager] Corrupt primary save payload found, checking backups');
        }
        if (typeof SaveMigration !== 'undefined') {
            const fallback = SaveMigration.getBestRecoveryPayload();
            if (fallback) candidates.push(fallback);
        }
        for (const parsed of candidates) {
            if (parsed && parsed.player && SaveSerializer.deserialize(parsed, this.gameState)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Called right after UI subsystems initialize so established players always have
     * an up-to-date master save + rolling backup capturing all subsystems cleanly.
     */
    initStartupSync() {
        if (!this.gameState || typeof SaveSerializer === 'undefined') return false;
        const serialized = SaveSerializer.serialize(this.gameState);
        if (!serialized) return false;
        try {
            const hasSaved = !!localStorage.getItem('lesaio_save_v2');
            const hasProg = (typeof SaveMigration !== 'undefined') && SaveMigration.hasEstablishedProgress();
            if (hasSaved || hasProg) {
                localStorage.setItem('lesaio_save_v2', JSON.stringify(serialized));
                if (typeof SaveMigration !== 'undefined') SaveMigration.writeBackup(serialized);
            }
            return true;
        } catch (_) {
            return false;
        }
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
