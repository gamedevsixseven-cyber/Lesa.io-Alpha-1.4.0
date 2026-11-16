/**
 * Lesa.io - Olympus Ascent Crests Manager
 * Manages entry Crests for climbing Mount Olympus:
 * - Daily refill: +2 Crests once per calendar day (up to max cap of 3)
 * - Cap: 3 Crests max
 * - Story Final Boss reward: +1 Crest upon defeating Rouf (Wave 20), up to cap of 3
 */

class AscentCrestManager {
    constructor() {
        this.storageKey = 'lesaio_ascent_crests';
        this.dateKey = 'lesaio_ascent_crests_date';
        this.maxCrests = 3;
        this.dailyGrant = 2;

        this.count = 0;
        this.lastDailyDate = '';
        this.load();
        this.ensureDailyRefill();
    }

    getTodayKey() {
        const d = new Date();
        return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    }

    load() {
        try {
            if (typeof localStorage !== 'undefined') {
                const rawCount = parseInt(localStorage.getItem(this.storageKey) || '0', 10);
                this.count = isNaN(rawCount) ? 0 : Math.max(0, Math.min(this.maxCrests, rawCount));
                this.lastDailyDate = localStorage.getItem(this.dateKey) || '';
            }
        } catch (err) {
            console.warn('[AscentCrestManager] Failed to load Crests:', err);
        }
        this._syncToGameState();
    }

    save() {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(this.storageKey, String(this.count));
                localStorage.setItem(this.dateKey, this.lastDailyDate);
            }
        } catch (err) {
            console.warn('[AscentCrestManager] Failed to save Crests:', err);
        }
        this._syncToGameState();
    }

    _syncToGameState() {
        if (typeof window !== 'undefined' && window.GameState && window.GameState.player) {
            window.GameState.player.ascentCrests = this.count;
            window.GameState.player.ascentCrestsDate = this.lastDailyDate;
        }
    }

    _emitUpdate(meta = {}) {
        if (typeof window !== 'undefined' && window.EventBus) {
            window.EventBus.emit('crestsUpdated', {
                count: this.count,
                max: this.maxCrests,
                lastDailyDate: this.lastDailyDate,
                ...meta
            });
        }
    }

    /**
     * Grants +2 daily Crests once per new calendar day, capped at maxCrests (3).
     */
    ensureDailyRefill() {
        const today = this.getTodayKey();
        if (this.lastDailyDate === today) return 0;

        const prev = this.count;
        this.count = Math.min(this.maxCrests, this.count + this.dailyGrant);
        this.lastDailyDate = today;
        this.save();

        const added = Math.max(0, this.count - prev);
        this._emitUpdate({ source: 'daily', added });
        return added;
    }

    getCount() {
        this.ensureDailyRefill();
        return this.count;
    }

    getCap() {
        return this.maxCrests;
    }

    canEnterAscent() {
        return this.getCount() >= 1;
    }

    /**
     * Consumes 1 Crest when starting an Olympus Ascent climb.
     */
    consumeCrest() {
        this.ensureDailyRefill();
        if (this.count <= 0) return false;

        this.count -= 1;
        this.save();
        this._emitUpdate({ source: 'consume', added: -1 });
        return true;
    }

    /**
     * Grants +1 Crest upon defeating the Final Story Boss (Rouf, Wave 20), capped at 3.
     */
    awardStoryBossCrest() {
        this.ensureDailyRefill();
        const prev = this.count;
        this.count = Math.min(this.maxCrests, this.count + 1);
        const added = Math.max(0, this.count - prev);
        if (added > 0) {
            this.save();
        }
        this._emitUpdate({ source: 'story_boss', added });
        return {
            added,
            count: this.count,
            max: this.maxCrests,
            atCap: added === 0 && this.count >= this.maxCrests
        };
    }

    /**
     * Merges imported/cloud save data safely without rolling back today's refills.
     */
    syncExternalState(extCount, extDate) {
        const today = this.getTodayKey();
        if (typeof extCount === 'number' && !isNaN(extCount)) {
            const clamped = Math.max(0, Math.min(this.maxCrests, Math.floor(extCount)));
            if (!this.lastDailyDate || (extDate === today && this.lastDailyDate !== today)) {
                this.count = clamped;
                if (extDate) this.lastDailyDate = String(extDate);
            } else if (extDate === this.lastDailyDate) {
                this.count = Math.max(this.count, clamped);
            }
            this.save();
        }
        this.ensureDailyRefill();
    }
}

const globalAscentCrestManager = new AscentCrestManager();

if (typeof window !== 'undefined') {
    window.AscentCrestManager = AscentCrestManager;
    window.ascentCrestManager = globalAscentCrestManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AscentCrestManager, globalAscentCrestManager };
}
