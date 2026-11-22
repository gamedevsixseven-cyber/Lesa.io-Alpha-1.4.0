/**
 * Lesa.io - Rollout Save Preservation, Schema Migration & Recovery Engine
 * Guarantees backward-compatible upgrades across game updates with zero account wipes:
 *   - Runs before GameState initialization to heal corrupted/missing keys from backups
 *   - Takes an automatic pre-update safety snapshot whenever CURRENT_APP_VERSION advances
 *   - Migrates legacy keys non-destructively (union sets / Math.max counters)
 *   - Reconciles offline local progress vs Firestore snapshots without clobbering newer data
 */

class SaveMigration {
    static CURRENT_APP_VERSION = '1.6.14';
    static CURRENT_SCHEMA_VERSION = 3;

    static KEYS = {
        SCHEMA_VERSION: 'lesaio_save_schema_version',
        APP_VERSION_SEEN: 'lesaio_app_version_seen',
        LAST_LOCAL_SAVE_AT: 'lesaio_last_local_save_at',
        MAIN_SAVE: 'lesaio_save_v2',
        ROLLING_BACKUP: 'lesaio_save_v2_backup',
        PRE_UPDATE_BACKUP: 'lesaio_save_pre_update_backup'
    };

    static _migratedOnce = false;

    static safeGetJson(key, fallback = null) {
        if (typeof localStorage === 'undefined') return fallback;
        try {
            const raw = localStorage.getItem(key);
            if (!raw || raw === 'undefined' || raw === 'null') return fallback;
            const parsed = JSON.parse(raw);
            return parsed !== null && parsed !== undefined ? parsed : fallback;
        } catch (_) {
            return fallback;
        }
    }

    static safeGetInt(key, fallback = 0, min = null) {
        if (typeof localStorage === 'undefined') return fallback;
        try {
            const raw = localStorage.getItem(key);
            if (raw === null || raw === '') return fallback;
            const n = parseInt(raw, 10);
            if (!Number.isFinite(n)) return fallback;
            return min !== null ? Math.max(min, n) : n;
        } catch (_) {
            return fallback;
        }
    }

    static recordLocalMutation(ts = Date.now()) {
        if (typeof localStorage === 'undefined') return;
        try {
            localStorage.setItem(this.KEYS.LAST_LOCAL_SAVE_AT, String(ts));
        } catch (_) {}
    }

    static writeBackup(serialized) {
        if (typeof localStorage === 'undefined' || !serialized || !serialized.player) return false;
        try {
            localStorage.setItem(this.KEYS.ROLLING_BACKUP, JSON.stringify(serialized));
            return true;
        } catch (_) {
            return false;
        }
    }

    static _hasAnyProgressionStorage() {
        if (typeof localStorage === 'undefined') return false;
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const k = localStorage.key(i);
                if (k && k.startsWith('lesaio_') && k !== this.KEYS.APP_VERSION_SEEN && k !== this.KEYS.SCHEMA_VERSION) {
                    return true;
                }
            }
        } catch (_) {}
        return false;
    }

    static hasEstablishedProgress() {
        if (typeof localStorage === 'undefined') return false;
        if (localStorage.getItem('lesaio_player_name_chosen') === 'true') return true;
        if (localStorage.getItem('lesaio_google_linked') === 'true') return true;
        if (this.safeGetInt('lesaio_account_level', 1, 1) > 1) return true;
        if (this.safeGetInt('lesaio_matches_played', 0, 0) > 0) return true;
        if (this.safeGetInt('lesaio_highscore', 0, 0) > 0) return true;
        const heroes = this.safeGetJson('lesaio_unlocked_heroes', null);
        if (Array.isArray(heroes) && heroes.length > 1) return true;
        const weapons = this.safeGetJson('lesaio_unlocked_weapons', null);
        if (Array.isArray(weapons) && weapons.length > 1) return true;
        const gear = this.safeGetJson('lesaio_unlocked_gear', null);
        if (Array.isArray(gear) && gear.length > 0) return true;
        const bp = this.safeGetJson('lesaio_battle_pass_s1', null);
        if (bp && ((bp.xp || 0) > 0 || bp.hasPremium)) return true;
        const name = localStorage.getItem('lesaio_player_name');
        if (name && name.trim() && name.trim() !== 'Psanas') return true;
        return false;
    }

    static _scoreSavePayload(save) {
        if (!save || typeof save !== 'object' || !save.player || typeof save.player !== 'object') return -1;
        const p = save.player;
        let score = 0;
        score += (Number(p.accountLevel) || 1) * 10000;
        score += (Array.isArray(p.unlockedHeroes) ? p.unlockedHeroes.length : 1) * 500;
        score += (Array.isArray(p.unlockedWeapons) ? p.unlockedWeapons.length : 1) * 300;
        score += (Array.isArray(p.unlockedGear) ? p.unlockedGear.length : 0) * 200;
        score += (p.stats && Number(p.stats.matchesPlayed) || 0) * 100;
        score += Math.min(50000, Number(p.coins) || 0) * 0.01;
        if (Number(save.timestamp) > 0) score += 50;
        return score;
    }

    static getBestRecoveryPayload() {
        const preUpd = this.safeGetJson(this.KEYS.PRE_UPDATE_BACKUP, null);
        const candidates = [
            this.safeGetJson(this.KEYS.MAIN_SAVE, null),
            this.safeGetJson(this.KEYS.ROLLING_BACKUP, null),
            this.safeGetJson('lesaio_cloud_payload', null),
            (preUpd && preUpd.saveV2) ? preUpd.saveV2 : null
        ].filter(c => c && typeof c === 'object' && c.player && typeof c.player === 'object');

        if (candidates.length === 0) return null;
        candidates.sort((a, b) => {
            const diff = this._scoreSavePayload(b) - this._scoreSavePayload(a);
            if (Math.abs(diff) > 100) return diff;
            return (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0);
        });
        return candidates[0];
    }

    static _capturePreUpdateSnapshot(prevVersion, bestSave) {
        try {
            const snapshot = {
                fromVersion: prevVersion || 'pre-1.6.14',
                toVersion: this.CURRENT_APP_VERSION,
                capturedAt: Date.now(),
                saveV2: bestSave || null,
                summary: {
                    name: localStorage.getItem('lesaio_player_name') || '',
                    coins: this.safeGetInt('lesaio_coins', 1500, 0),
                    gems: this.safeGetInt('lesaio_gems', 50, 0),
                    level: this.safeGetInt('lesaio_account_level', 1, 1)
                }
            };
            localStorage.setItem(this.KEYS.PRE_UPDATE_BACKUP, JSON.stringify(snapshot));
        } catch (_) {}
    }

    static _repairJsonKey(key, expectedType, recoveryVal, defaultVal) {
        const raw = localStorage.getItem(key);
        let valid = false;
        if (raw !== null && raw !== '' && raw !== 'undefined' && raw !== 'null') {
            try {
                const parsed = JSON.parse(raw);
                if (expectedType === 'array') valid = Array.isArray(parsed);
                else if (expectedType === 'object') valid = !!parsed && typeof parsed === 'object' && !Array.isArray(parsed);
            } catch (_) {}
        }
        if (valid) return;

        const chosen = (recoveryVal !== undefined && recoveryVal !== null) ? recoveryVal : defaultVal;
        if (chosen !== undefined && chosen !== null && (raw !== null || recoveryVal !== undefined)) {
            try { localStorage.setItem(key, JSON.stringify(chosen)); } catch (_) {}
        }
    }

    static _repairIntKey(key, minVal, recoveryVal) {
        const raw = localStorage.getItem(key);
        const parsed = (raw !== null && raw !== '') ? parseInt(raw, 10) : NaN;
        if (Number.isFinite(parsed) && parsed >= minVal) return;

        if (recoveryVal !== undefined && recoveryVal !== null && Number.isFinite(Number(recoveryVal))) {
            try {
                localStorage.setItem(key, String(Math.max(minVal, Math.floor(Number(recoveryVal)))));
            } catch (_) {}
        } else if (raw !== null) {
            try { localStorage.removeItem(key); } catch (_) {}
        }
    }

    static _syncAliasMaxInt(aliasKey, canonicalKey, minVal = 0) {
        const aliasVal = this.safeGetInt(aliasKey, -1);
        if (aliasVal < minVal) return;
        const curVal = this.safeGetInt(canonicalKey, minVal - 1);
        if (aliasVal > curVal) {
            try { localStorage.setItem(canonicalKey, String(aliasVal)); } catch (_) {}
        }
    }

    static _reconcileLegacyAliases() {
        this._syncAliasMaxInt('lesaio_high_score', 'lesaio_highscore', 0);
        this._syncAliasMaxInt('lesaio_player_level', 'lesaio_account_level', 1);

        const legacyStats = this.safeGetJson('lesaio_stats', null);
        if (legacyStats && typeof legacyStats === 'object') {
            const pairs = [
                ['totalKills', 'lesaio_total_kills'],
                ['maxWave', 'lesaio_max_wave'],
                ['highScore', 'lesaio_highscore'],
                ['matchesPlayed', 'lesaio_matches_played'],
                ['totalFatmirs', 'lesaio_total_fatmirs'],
                ['totalCasillas', 'lesaio_total_casillas'],
                ['totalSkarmogyftos', 'lesaio_total_skarmogyftos'],
                ['totalTimeSeconds', 'lesaio_total_time_seconds']
            ];
            for (const [prop, k] of pairs) {
                const v = parseInt(legacyStats[prop], 10);
                if (Number.isFinite(v) && v > this.safeGetInt(k, 0, 0)) {
                    try { localStorage.setItem(k, String(v)); } catch (_) {}
                }
            }
        }

        const bubbleClaimed = localStorage.getItem('lesaio_alpha_bubble_mail_claimed') === 'true'
            || localStorage.getItem('lesaio_weapon_bubble_unlocked') === 'true';
        const weaps = this.safeGetJson('lesaio_unlocked_weapons', null);
        if (bubbleClaimed || (Array.isArray(weaps) && weaps.includes('bubble'))) {
            try { localStorage.setItem('lesaio_weapon_bubble_unlocked', 'true'); } catch (_) {}
            if (Array.isArray(weaps) && !weaps.includes('bubble')) {
                weaps.push('bubble');
                try { localStorage.setItem('lesaio_unlocked_weapons', JSON.stringify(weaps)); } catch (_) {}
            }
        }

        const bp = this.safeGetJson('lesaio_battle_pass_s1', null);
        if (bp && typeof bp === 'object' && Array.isArray(bp.claimedTiers) && !Array.isArray(bp.claimedFree)) {
            bp.claimedFree = Array.from(new Set(bp.claimedTiers));
            delete bp.claimedTiers;
            try { localStorage.setItem('lesaio_battle_pass_s1', JSON.stringify(bp)); } catch (_) {}
        }

        if (!localStorage.getItem('lesaio_player_name_chosen') && this.hasEstablishedProgress()) {
            try { localStorage.setItem('lesaio_player_name_chosen', 'true'); } catch (_) {}
        }
    }

    static runStartupMigration() {
        if (this._migratedOnce || typeof localStorage === 'undefined') return false;
        this._migratedOnce = true;

        try {
            if (!this._hasAnyProgressionStorage()) {
                localStorage.setItem(this.KEYS.SCHEMA_VERSION, String(this.CURRENT_SCHEMA_VERSION));
                localStorage.setItem(this.KEYS.APP_VERSION_SEEN, this.CURRENT_APP_VERSION);
                return false;
            }

            const prevAppVersion = localStorage.getItem(this.KEYS.APP_VERSION_SEEN) || '';
            const bestSave = this.getBestRecoveryPayload();

            if (prevAppVersion !== this.CURRENT_APP_VERSION && this.hasEstablishedProgress()) {
                this._capturePreUpdateSnapshot(prevAppVersion, bestSave);
            }

            const p = (bestSave && bestSave.player) ? bestSave.player : {};
            const s = (p.stats && typeof p.stats === 'object') ? p.stats : {};

            this._repairIntKey('lesaio_coins', 0, p.coins ?? p.gold);
            this._repairIntKey('lesaio_gems', 0, p.gems ?? p.diamonds);
            this._repairIntKey('lesaio_account_level', 1, p.accountLevel ?? p.level);
            this._repairIntKey('lesaio_account_xp', 0, p.accountXp ?? p.xp);
            this._repairIntKey('lesaio_highscore', 0, s.highScore);
            this._repairIntKey('lesaio_max_wave', 1, s.maxWave);
            this._repairIntKey('lesaio_total_kills', 0, s.totalKills);
            this._repairIntKey('lesaio_total_fatmirs', 0, s.totalFatmirs);
            this._repairIntKey('lesaio_total_casillas', 0, s.totalCasillas);
            this._repairIntKey('lesaio_total_skarmogyftos', 0, s.totalSkarmogyftos);
            this._repairIntKey('lesaio_matches_played', 0, s.matchesPlayed);
            this._repairIntKey('lesaio_total_time_seconds', 0, s.totalTimeSeconds);
            this._repairIntKey('lesaio_evolution_stones', 0, p.evolutionStones);
            this._repairIntKey('lesaio_olympian_star_stones', 0, p.olympianStarStones);

            if (!localStorage.getItem('lesaio_player_name') && p.name) {
                localStorage.setItem('lesaio_player_name', String(p.name));
            }
            if (!localStorage.getItem('lesaio_selected_hero') && p.selectedHero) {
                localStorage.setItem('lesaio_selected_hero', String(p.selectedHero));
            }
            if (!localStorage.getItem('lesaio_selected_weapon') && p.selectedWeapon) {
                localStorage.setItem('lesaio_selected_weapon', String(p.selectedWeapon));
            }
            if (!localStorage.getItem('lesaio_selected_skill') && p.selectedSkill) {
                localStorage.setItem('lesaio_selected_skill', String(p.selectedSkill));
            }

            this._repairJsonKey('lesaio_unlocked_heroes', 'array', p.unlockedHeroes, ['psanas']);
            this._repairJsonKey('lesaio_unlocked_skills', 'array', p.unlockedSkills, ['blade_rush', 'nerobalonaki']);
            this._repairJsonKey('lesaio_skill_levels', 'object', p.skillLevels, { blade_rush: 1, nerobalonaki: 1 });
            this._repairJsonKey('lesaio_unlocked_weapons', 'array', p.unlockedWeapons, ['pea']);
            this._repairJsonKey('lesaio_upgrades', 'object', p.upgrades, { critChance: 0, critDamage: 0, maxHealth: 0, goldBonus: 0 });
            this._repairJsonKey('lesaio_unlocked_perks', 'array', p.unlockedPerks, []);
            this._repairJsonKey('lesaio_equipped_perks', 'array', p.equippedPerks, [null, null, null]);
            this._repairJsonKey('lesaio_perk_ranks', 'object', p.perkRanks, {});
            this._repairJsonKey('lesaio_combat_feats', 'object', p.combatFeats, { storyMaxWave: 1, endlessMaxWave: 0, olympusMaxFloor: 0, defeatedBosses: {}, endlessMiniBossKills: 0 });
            this._repairJsonKey('lesaio_equipped_gear', 'object', p.equippedGear, { helmet: null, armor: null, belt: null, gloves: null, boots: null });
            this._repairJsonKey('lesaio_unlocked_gear', 'array', p.unlockedGear, []);
            this._repairJsonKey('lesaio_gear_levels', 'object', p.gearLevels, {});
            this._repairJsonKey('lesaio_evolved_gear', 'array', p.evolvedGear, []);
            this._repairJsonKey('lesaio_ascended_gear', 'array', p.ascendedGear, []);
            this._repairJsonKey('lesaio_evolved_weapons', 'array', p.evolvedWeapons, []);
            this._repairJsonKey('lesaio_star_blessed_heroes', 'array', p.starBlessedHeroes, []);
            this._repairJsonKey('lesaio_hero_plays', 'object', s.heroPlays, { psanas: 0, psogas: 0, petros: 0 });
            this._repairJsonKey('lesaio_battle_pass_s1', 'object', p.battlePass, undefined);
            this._repairJsonKey('lesaio_hero_skins', 'object', p.heroSkins && p.heroSkins.equipped, undefined);
            this._repairJsonKey('lesaio_unlocked_hero_skins', 'array', p.heroSkins && p.heroSkins.unlocked, undefined);
            this._repairJsonKey('lesaio_chest_slots', 'array', p.chestSlots, [null, null, null, null]);
            this._repairJsonKey('lesaio_pending_boss_rewards', 'array', p.pendingBossRewards, []);
            this._repairJsonKey('lesaio_displayed_coins', 'array', p.cosmetics && p.cosmetics.displayedCoins, []);
            this._repairJsonKey('lesaio_unlocked_banners', 'array', p.cosmetics && p.cosmetics.unlockedBanners, ['banner_recruit']);
            this._repairJsonKey('lesaio_unlocked_frames', 'array', p.cosmetics && p.cosmetics.unlockedFrames, ['frame_rookie']);
            this._repairJsonKey('lesaio_unlocked_coins', 'array', p.cosmetics && p.cosmetics.unlockedCoins, []);

            if (p.inventory && typeof p.inventory === 'object') {
                this._repairJsonKey('lesaio_inventory', 'object', p.inventory, undefined);
            } else if (p.materials && typeof p.materials === 'object') {
                this._repairJsonKey('lesaio_inventory', 'object', { materials: p.materials }, undefined);
            } else {
                this._repairJsonKey('lesaio_inventory', 'object', undefined, {});
            }

            if (p.cosmetics && typeof p.cosmetics === 'object') {
                if (!localStorage.getItem('lesaio_equipped_banner') && p.cosmetics.equippedBanner) {
                    localStorage.setItem('lesaio_equipped_banner', p.cosmetics.equippedBanner);
                }
                if (!localStorage.getItem('lesaio_equipped_frame') && p.cosmetics.equippedFrame) {
                    localStorage.setItem('lesaio_equipped_frame', p.cosmetics.equippedFrame);
                }
            }

            this._reconcileLegacyAliases();

            if (bestSave && !localStorage.getItem(this.KEYS.MAIN_SAVE)) {
                localStorage.setItem(this.KEYS.MAIN_SAVE, JSON.stringify(bestSave));
            }
            if (bestSave && !localStorage.getItem(this.KEYS.ROLLING_BACKUP)) {
                this.writeBackup(bestSave);
            }

            localStorage.setItem(this.KEYS.SCHEMA_VERSION, String(this.CURRENT_SCHEMA_VERSION));
            localStorage.setItem(this.KEYS.APP_VERSION_SEEN, this.CURRENT_APP_VERSION);
            return true;
        } catch (err) {
            console.warn('[SaveMigration] Non-fatal migration warning:', err);
            return false;
        }
    }

    static _parseCloudTimestamp(data) {
        if (!data || typeof data !== 'object') return 0;
        if (typeof data.timestamp === 'number' && Number.isFinite(data.timestamp)) return data.timestamp;
        if (typeof data.timestamp === 'string') {
            const ms = Date.parse(data.timestamp);
            if (Number.isFinite(ms)) return ms;
        }
        if (data.lastUpdated && typeof data.lastUpdated.toMillis === 'function') return data.lastUpdated.toMillis();
        if (data.lastUpdated && typeof data.lastUpdated.seconds === 'number') return data.lastUpdated.seconds * 1000;
        if (typeof data.lastSeenAt === 'number' && Number.isFinite(data.lastSeenAt)) return data.lastSeenAt;
        return 0;
    }

    /**
     * Reconcile an initial Firestore snapshot with local state non-destructively.
     * Prevents stale cloud docs from overwriting newer offline progress on rollout.
     */
    static reconcileCloudSnapshot(data, gameState, isInitialSync) {
        if (!data || typeof data !== 'object') return { preferLocalCurrencies: false };
        const gs = gameState || (typeof window !== 'undefined' ? window.GameState : null);
        const p = data.player && typeof data.player === 'object' ? data.player : data;

        const rawDiamonds = data.diamonds !== undefined ? data.diamonds : p.diamonds;
        const rawGems = data.gems !== undefined ? data.gems : p.gems;
        const rawGold = data.gold !== undefined ? data.gold : p.gold;
        const rawCoins = data.coins !== undefined ? data.coins : p.coins;

        const numDiamonds = rawDiamonds !== undefined ? parseInt(rawDiamonds, 10) : undefined;
        const numGems = rawGems !== undefined ? parseInt(rawGems, 10) : undefined;
        const numGold = rawGold !== undefined ? parseInt(rawGold, 10) : undefined;
        const numCoins = rawCoins !== undefined ? parseInt(rawCoins, 10) : undefined;

        const hasConsoleCurrencyDiff =
            (numDiamonds !== undefined && numGems !== undefined && !isNaN(numDiamonds) && !isNaN(numGems) && numDiamonds !== numGems) ||
            (numGold !== undefined && numCoins !== undefined && !isNaN(numGold) && !isNaN(numCoins) && numGold !== numCoins);

        const cloudTs = this._parseCloudTimestamp(data);
        const localMutationTs = this.safeGetInt(this.KEYS.LAST_LOCAL_SAVE_AT, 0, 0);
        const localSave = this.safeGetJson(this.KEYS.MAIN_SAVE, null);
        const localTs = Math.max(localMutationTs, Number(localSave && localSave.timestamp) || 0);

        const preferLocalCurrencies = Boolean(
            isInitialSync &&
            this.hasEstablishedProgress() &&
            !hasConsoleCurrencyDiff &&
            cloudTs > 0 &&
            localTs > cloudTs + 2000
        );

        if (isInitialSync && gs && typeof SaveSerializer !== 'undefined' && typeof SaveSerializer.mergeProgressOnly === 'function') {
            SaveSerializer.mergeProgressOnly({ player: p }, gs);
        }

        return { preferLocalCurrencies, cloudTs, localTs };
    }
}

SaveMigration.runStartupMigration();

if (typeof window !== 'undefined') {
    window.SaveMigration = SaveMigration;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SaveMigration };
}
