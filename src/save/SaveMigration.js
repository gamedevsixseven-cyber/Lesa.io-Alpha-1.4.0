/**
 * Lesa.io - Rollout Save Preservation, Schema Migration & Recovery Engine
 * Guarantees backward-compatible upgrades across game updates with zero account wipes:
 *   - Runs before GameState initialization to heal corrupted/missing keys from backups
 *   - Takes an automatic pre-update safety snapshot whenever CURRENT_APP_VERSION advances
 *   - Migrates legacy keys non-destructively (union sets / Math.max counters)
 *   - Reconciles offline local progress vs Firestore snapshots without clobbering newer data
 */

class SaveMigration {
    static CURRENT_APP_VERSION = '1.7.2';
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
        if (this.safeGetInt('lesaio_account_level', 1, 1) > 1) return true;
        if (this.safeGetInt('lesaio_account_xp', 0, 0) > 0) return true;
        if (this.safeGetInt('lesaio_matches_played', 0, 0) > 0) return true;
        if (this.safeGetInt('lesaio_highscore', 0, 0) > 0) return true;
        if (this.safeGetInt('lesaio_total_kills', 0, 0) > 0) return true;
        if (this.safeGetInt('lesaio_max_wave', 1, 1) > 1) return true;
        if (this.safeGetInt('lesaio_evolution_stones', 0, 0) > 0) return true;
        if (this.safeGetInt('lesaio_olympian_star_stones', 0, 0) > 0) return true;
        const rawCoins = localStorage.getItem('lesaio_coins');
        if (rawCoins !== null && this.safeGetInt('lesaio_coins', 1500, 0) !== 1500) return true;
        const rawGems = localStorage.getItem('lesaio_gems');
        if (rawGems !== null && this.safeGetInt('lesaio_gems', 50, 0) !== 50) return true;
        const heroes = this.safeGetJson('lesaio_unlocked_heroes', null);
        if (Array.isArray(heroes) && heroes.length > 1) return true;
        const weapons = this.safeGetJson('lesaio_unlocked_weapons', null);
        if (Array.isArray(weapons) && weapons.length > 1) return true;
        const skills = this.safeGetJson('lesaio_unlocked_skills', null);
        if (Array.isArray(skills) && skills.length > 2) return true;
        const gear = this.safeGetJson('lesaio_unlocked_gear', null);
        if (Array.isArray(gear) && gear.length > 0) return true;
        const perks = this.safeGetJson('lesaio_unlocked_perks', null);
        if (Array.isArray(perks) && perks.length > 0) return true;
        const upg = this.safeGetJson('lesaio_upgrades', null);
        if (upg && typeof upg === 'object' && Object.values(upg).some(v => (parseInt(v, 10) || 0) > 0)) return true;
        const bp = this.safeGetJson('lesaio_battle_pass_s1', null);
        if (bp && ((bp.xp || 0) > 0 || bp.hasPremium || (Array.isArray(bp.claimedFree) && bp.claimedFree.length > 0))) return true;
        return false;
    }

    static scoreCloudDoc(data) {
        if (!data || typeof data !== 'object') return -1;
        const p = (data.player && typeof data.player === 'object') ? data.player : data;
        const s = (p.stats && typeof p.stats === 'object') ? p.stats : (data.stats || {});
        const social = (data.socialStats && typeof data.socialStats === 'object') ? data.socialStats : {};
        const lvl = Math.max(1, parseInt(p.accountLevel ?? p.level ?? data.accountLevel ?? data.level ?? 1, 10) || 1);
        const xp = Math.max(0, parseInt(p.accountXp ?? p.xp ?? data.accountXp ?? data.xp ?? 0, 10) || 0);
        const highScore = Math.max(0, Number(s.highScore) || 0, Number(data.highScore) || 0, Number(data.lbHighScore) || 0, Number(social.highScore) || 0);
        const totalKills = Math.max(0, Number(s.totalKills) || 0, Number(data.lbTotalKills) || 0, Number(social.totalKills) || 0, Number(data.totalKills) || 0);
        const maxWave = Math.max(1, Number(s.maxWave) || 1, Number(data.maxWave) || 1, Number(data.lbEndlessWave) || 1, Number(social.maxWave) || 1);
        const matches = Math.max(0, Number(s.matchesPlayed) || 0);
        const heroes = Array.isArray(p.unlockedHeroes) ? p.unlockedHeroes.length : (Array.isArray(data.unlockedHeroes) ? data.unlockedHeroes.length : 1);
        const weapons = Array.isArray(p.unlockedWeapons) ? p.unlockedWeapons.length : (Array.isArray(data.unlockedWeapons) ? data.unlockedWeapons.length : 1);
        const gear = Array.isArray(p.unlockedGear) ? p.unlockedGear.length : 0;
        const evoStones = Math.max(0, Number(p.evolutionStones) || 0, Number(p.olympianStarStones) || 0);
        const bpXp = (p.battlePass && Number(p.battlePass.xp)) || 0;
        const coins = Math.max(0, Number(p.coins ?? data.coins ?? data.gold ?? 0) || 0);
        const gems = Math.max(0, Number(p.gems ?? data.diamonds ?? data.gems ?? 0) || 0);

        let score = 0;
        score += (lvl - 1) * 100000 + Math.min(99999, xp);
        score += totalKills * 25;
        score += Math.min(50000000, highScore) * 0.02;
        score += matches * 300 + (maxWave - 1) * 150;
        score += Math.max(0, heroes - 1) * 2000 + Math.max(0, weapons - 1) * 1200 + gear * 500 + evoStones * 100 + bpXp * 0.5;
        score += Math.min(100000, coins) * 0.01 + Math.min(10000, gems) * 0.1;
        return score;
    }

    static _scoreSavePayload(save) {
        return this.scoreCloudDoc(save);
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

    static _parseTsValue(v) {
        if (!v) return 0;
        if (typeof v === 'number' && Number.isFinite(v)) return v;
        if (typeof v === 'string') { const ms = Date.parse(v); return Number.isFinite(ms) ? ms : 0; }
        if (typeof v.toMillis === 'function') return v.toMillis();
        if (typeof v.seconds === 'number') return v.seconds * 1000;
        return 0;
    }

    static wasWipedByDev(baseline, localTs = 0) {
        if (!baseline || typeof baseline !== 'object' || !baseline.wipedByDevAt) return false;
        const wipedMs = this._parseTsValue(baseline.wipedByDevAt);
        return wipedMs > 0 && wipedMs >= (Number(localTs) || 0) - 2000;
    }

    static extractNormalizedPlayer(data) {
        if (!data || typeof data !== 'object') return {};
        const p = (data.player && typeof data.player === 'object') ? data.player : data;
        const s = (p.stats && typeof p.stats === 'object') ? p.stats : (data.stats || {});
        const social = (data.socialStats && typeof data.socialStats === 'object') ? data.socialStats : {};
        const levelCandidates = [p.accountLevel, p.level, data.accountLevel, data.level]
            .map(v => parseInt(v, 10)).filter(n => Number.isFinite(n) && n >= 1);
        const lvl = levelCandidates.length ? Math.max(...levelCandidates) : undefined;
        const xpCandidates = [p.accountXp, p.xp, data.accountXp, data.xp]
            .map(v => parseInt(v, 10)).filter(n => Number.isFinite(n) && n >= 0);
        const maxHigh = Math.max(0, Number(s.highScore) || 0, Number(data.highScore) || 0, Number(data.lbHighScore) || 0, Number(social.highScore) || 0);
        const maxKills = Math.max(0, Number(s.totalKills) || 0, Number(data.lbTotalKills) || 0, Number(social.totalKills) || 0, Number(data.totalKills) || 0);
        const maxWave = Math.max(1, Number(s.maxWave) || 1, Number(data.maxWave) || 1, Number(data.lbEndlessWave) || 1, Number(social.maxWave) || 1);
        return {
            ...p,
            name: data.playerName || p.name || p.playerName || undefined,
            accountLevel: lvl,
            accountXp: xpCandidates.length ? Math.max(...xpCandidates) : undefined,
            stats: {
                ...s,
                highScore: maxHigh,
                totalKills: maxKills,
                maxWave
            }
        };
    }

    static _maxObj(a = {}, b = {}, min = 0) {
        const out = { ...(a || {}) };
        for (const [k, v] of Object.entries(b || {})) {
            const n = parseInt(v, 10);
            if (Number.isFinite(n)) out[k] = Math.max(parseInt(out[k], 10) || min, n);
        }
        return out;
    }

    static _unionArr(a, b) {
        return Array.from(new Set([...(Array.isArray(b) ? b : []), ...(Array.isArray(a) ? a : [])]));
    }

    static mergeMonotonicCloudPayload(payload, baseline) {
        if (!payload || typeof payload !== 'object' || !baseline || typeof baseline !== 'object') return payload;
        if (this.wasWipedByDev(baseline, payload.timestamp || Date.now())) return payload;

        const bp = this.extractNormalizedPlayer(baseline);
        const pp = (payload.player && typeof payload.player === 'object') ? payload.player : {};
        const ps = (pp.stats && typeof pp.stats === 'object') ? pp.stats : {};
        const bs = (bp.stats && typeof bp.stats === 'object') ? bp.stats : {};

        const payLvl = Math.max(1, parseInt(pp.accountLevel ?? payload.level ?? 1, 10) || 1);
        const baseLvl = Math.max(1, parseInt(bp.accountLevel ?? 1, 10) || 1);
        const mergedLvl = Math.max(payLvl, baseLvl);
        const payXp = Math.max(0, parseInt(pp.accountXp ?? payload.xp ?? 0, 10) || 0);
        const baseXp = Math.max(0, parseInt(bp.accountXp ?? 0, 10) || 0);
        const mergedXp = baseLvl > payLvl ? baseXp : (baseLvl === payLvl ? Math.max(payXp, baseXp) : payXp);

        const mergedStats = {
            ...ps,
            totalKills: Math.max(Number(ps.totalKills) || 0, Number(bs.totalKills) || 0),
            maxWave: Math.max(Number(ps.maxWave) || 1, Number(bs.maxWave) || 1),
            highScore: Math.max(Number(ps.highScore) || 0, Number(bs.highScore) || 0),
            totalFatmirs: Math.max(Number(ps.totalFatmirs) || 0, Number(bs.totalFatmirs) || 0),
            totalCasillas: Math.max(Number(ps.totalCasillas) || 0, Number(bs.totalCasillas) || 0),
            totalSkarmogyftos: Math.max(Number(ps.totalSkarmogyftos) || 0, Number(bs.totalSkarmogyftos) || 0),
            matchesPlayed: Math.max(Number(ps.matchesPlayed) || 0, Number(bs.matchesPlayed) || 0),
            totalTimeSeconds: Math.max(Number(ps.totalTimeSeconds) || 0, Number(bs.totalTimeSeconds) || 0),
            heroPlays: this._maxObj(ps.heroPlays, bs.heroPlays, 0)
        };

        const mergedPlayer = {
            ...pp,
            accountLevel: mergedLvl,
            accountXp: mergedXp,
            unlockedHeroes: this._unionArr(pp.unlockedHeroes, bp.unlockedHeroes),
            unlockedWeapons: this._unionArr(pp.unlockedWeapons, bp.unlockedWeapons),
            unlockedSkills: this._unionArr(pp.unlockedSkills, bp.unlockedSkills),
            unlockedPerks: this._unionArr(pp.unlockedPerks, bp.unlockedPerks),
            unlockedGear: this._unionArr(pp.unlockedGear, bp.unlockedGear),
            evolvedGear: this._unionArr(pp.evolvedGear, bp.evolvedGear),
            ascendedGear: this._unionArr(pp.ascendedGear, bp.ascendedGear),
            evolvedWeapons: this._unionArr(pp.evolvedWeapons, bp.evolvedWeapons),
            starBlessedHeroes: this._unionArr(pp.starBlessedHeroes, bp.starBlessedHeroes),
            skillLevels: this._maxObj(pp.skillLevels, bp.skillLevels, 1),
            upgrades: this._maxObj(pp.upgrades, bp.upgrades, 0),
            gearLevels: this._maxObj(pp.gearLevels, bp.gearLevels, 1),
            perkRanks: this._maxObj(pp.perkRanks, bp.perkRanks, 1),
            evolutionStones: Math.max(Number(pp.evolutionStones) || 0, Number(bp.evolutionStones) || 0),
            olympianStarStones: Math.max(Number(pp.olympianStarStones) || 0, Number(bp.olympianStarStones) || 0),
            stats: mergedStats
        };

        return {
            ...payload,
            level: mergedLvl,
            xp: mergedXp,
            skillLevels: mergedPlayer.skillLevels,
            highScore: Math.max(Number(payload.highScore) || 0, mergedStats.highScore),
            maxWave: Math.max(Number(payload.maxWave) || 1, mergedStats.maxWave),
            lbHighScore: Math.max(Number(payload.lbHighScore) || 0, mergedStats.highScore),
            lbEndlessWave: Math.max(0, Number(mergedPlayer.combatFeats && mergedPlayer.combatFeats.endlessMaxWave) || 0, mergedStats.maxWave > 20 ? mergedStats.maxWave : 0),
            lbTotalKills: Math.max(Number(payload.lbTotalKills) || 0, mergedStats.totalKills),
            player: mergedPlayer
        };
    }

    /**
     * Reconcile an initial Firestore snapshot with local state non-destructively.
     * Prevents stale cloud docs from overwriting newer offline progress AND prevents fresh Lv.1 clients from clobbering cloud saves.
     */
    static reconcileCloudSnapshot(data, gameState, isInitialSync) {
        if (!data || typeof data !== 'object') return { preferLocalCurrencies: false };
        const gs = gameState || (typeof window !== 'undefined' ? window.GameState : null);
        const p = this.extractNormalizedPlayer(data);

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
        const cloudScore = this.scoreCloudDoc(data);
        const localScore = Math.max(this.scoreCloudDoc(gs), this.scoreCloudDoc(localSave));
        const curCoins = gs && gs.player ? (Number(gs.player.coins) || 0) : this.safeGetInt('lesaio_coins', 1500, 0);
        const curGems = gs && gs.player ? (Number(gs.player.gems) || 0) : this.safeGetInt('lesaio_gems', 50, 0);
        const cloudCoins = Number.isFinite(numCoins) ? numCoins : (Number.isFinite(numGold) ? numGold : 0);
        const cloudGems = Number.isFinite(numGems) ? numGems : (Number.isFinite(numDiamonds) ? numDiamonds : 0);
        const wiped = this.wasWipedByDev(data, localTs);

        const localRicherCurr = !wiped && (curCoins > cloudCoins || curGems > cloudGems) && localTs >= cloudTs - 2000;
        const preferLocalCurrencies = Boolean(
            isInitialSync &&
            this.hasEstablishedProgress() &&
            !wiped &&
            (localRicherCurr || (!hasConsoleCurrencyDiff && cloudTs > 0 && localTs > cloudTs + 2000 && localScore >= cloudScore))
        );

        if ((isInitialSync || cloudScore > localScore) && gs && typeof SaveSerializer !== 'undefined' && typeof SaveSerializer.mergeProgressOnly === 'function') {
            SaveSerializer.mergeProgressOnly({ player: p }, gs);
        }

        return { preferLocalCurrencies, cloudTs, localTs, cloudScore, localScore };
    }
}

SaveMigration.runStartupMigration();

if (typeof window !== 'undefined') {
    window.SaveMigration = SaveMigration;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SaveMigration };
}
